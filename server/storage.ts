import { 
  User, 
  Company, 
  Job, 
  Application, 
  Report, 
  AuditLog,
  InsertUser, 
  InsertCompany, 
  InsertJob, 
  InsertApplication, 
  InsertReport, 
  InsertAuditLog,
  JobSearchFilters,
  PaginatedResponse,
  UserRole,
  CompanyStatus,
  JobStatus,
  ApplicationStatus
} from "@shared/schema";
import { randomUUID } from "crypto";

// Enhanced storage interface for faculty jobs marketplace
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<void>;
  deleteUser(id: string): Promise<void>;

  // Company operations
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyByOwner(ownerUid: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<Company>): Promise<void>;
  getPendingCompanies(): Promise<Company[]>;
  getApprovedCompanies(): Promise<Company[]>;

  // Job operations
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<void>;
  deleteJob(id: string): Promise<void>;
  getJobsByCompany(companyId: string): Promise<Job[]>;
  getJobsByPoster(posterUid: string): Promise<Job[]>;
  getPendingJobs(): Promise<Job[]>;
  getApprovedJobs(): Promise<Job[]>;
  getFeaturedJobs(limit?: number): Promise<Job[]>;
  searchJobs(filters: Partial<JobSearchFilters>, page?: number, limit?: number): Promise<PaginatedResponse<Job>>;

  // Application operations
  getApplication(id: string): Promise<Application | undefined>;
  getApplicationByDedupeKey(dedupeKey: string): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, updates: Partial<Application>): Promise<void>;
  getApplicationsByUser(applicantUid: string): Promise<Application[]>;
  getApplicationsByJob(jobId: string): Promise<Application[]>;

  // Report operations
  getReport(id: string): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, updates: Partial<Report>): Promise<void>;
  getPendingReports(): Promise<Report[]>;

  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;

  // Statistics
  getStats(): Promise<{
    totalJobs: number;
    totalApplications: number;
    totalEmployers: number;
    totalSeekers: number;
    pendingJobs: number;
    pendingEmployers: number;
    activeJobs: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private companies: Map<string, Company> = new Map();
  private jobs: Map<string, Job> = new Map();
  private applications: Map<string, Application> = new Map();
  private reports: Map<string, Report> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, { ...user, ...updates, updatedAt: new Date() });
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
    // Also clean up related data
    const userCompanies = Array.from(this.companies.values()).filter(c => c.ownerUid === id);
    userCompanies.forEach(company => this.companies.delete(company.id));
    
    const userJobs = Array.from(this.jobs.values()).filter(j => j.posterUid === id);
    userJobs.forEach(job => this.jobs.delete(job.id));
    
    const userApplications = Array.from(this.applications.values()).filter(a => a.applicantUid === id);
    userApplications.forEach(app => this.applications.delete(app.id));
  }

  // Company operations
  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompanyByOwner(ownerUid: string): Promise<Company | undefined> {
    return Array.from(this.companies.values()).find(company => company.ownerUid === ownerUid);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const company: Company = {
      ...insertCompany,
      id,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<void> {
    const company = this.companies.get(id);
    if (company) {
      this.companies.set(id, { ...company, ...updates, updatedAt: new Date() });
    }
  }

  async getPendingCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values())
      .filter(company => company.status === 'pending')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getApprovedCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values())
      .filter(company => company.status === 'approved')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Job operations
  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = {
      ...insertJob,
      id,
      status: 'pending',
      viewCount: 0,
      applicationCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<void> {
    const job = this.jobs.get(id);
    if (job) {
      this.jobs.set(id, { ...job, ...updates, updatedAt: new Date() });
    }
  }

  async deleteJob(id: string): Promise<void> {
    this.jobs.delete(id);
    // Clean up related applications
    const jobApplications = Array.from(this.applications.values()).filter(a => a.jobId === id);
    jobApplications.forEach(app => this.applications.delete(app.id));
  }

  async getJobsByCompany(companyId: string): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.companyId === companyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getJobsByPoster(posterUid: string): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.posterUid === posterUid)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPendingJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.status === 'pending')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getApprovedJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.status === 'approved')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getFeaturedJobs(limit: number = 6): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.status === 'approved')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async searchJobs(filters: Partial<JobSearchFilters>, page: number = 1, limit: number = 20): Promise<PaginatedResponse<Job>> {
    let allJobs = Array.from(this.jobs.values()).filter(job => job.status === 'approved');

    // Apply filters
    if (filters.department) {
      allJobs = allJobs.filter(job => job.department === filters.department);
    }
    if (filters.instituteType) {
      allJobs = allJobs.filter(job => job.instituteType === filters.instituteType);
    }
    if (filters.level) {
      allJobs = allJobs.filter(job => job.level === filters.level);
    }
    if (filters.location) {
      allJobs = allJobs.filter(job => 
        job.location.city.toLowerCase().includes(filters.location!.toLowerCase()) ||
        job.location.state.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }
    if (filters.employmentType) {
      allJobs = allJobs.filter(job => job.employmentType === filters.employmentType);
    }

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      allJobs = allJobs.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.qualifications.some(q => q.toLowerCase().includes(query)) ||
        job.skills.some(s => s.toLowerCase().includes(query))
      );
    }

    // Date filtering
    if (filters.postedWithin && filters.postedWithin !== 'all') {
      const now = new Date();
      let daysAgo = 0;
      switch (filters.postedWithin) {
        case '24h': daysAgo = 1; break;
        case '7d': daysAgo = 7; break;
        case '30d': daysAgo = 30; break;
      }
      const dateThreshold = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      allJobs = allJobs.filter(job => job.createdAt >= dateThreshold);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'deadline':
        allJobs.sort((a, b) => a.lastDate.getTime() - b.lastDate.getTime());
        break;
      case 'salary_high':
        allJobs.sort((a, b) => (b.maxSalary || 0) - (a.maxSalary || 0));
        break;
      case 'salary_low':
        allJobs.sort((a, b) => (a.minSalary || 0) - (b.minSalary || 0));
        break;
      default: // 'newest'
        allJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    // Pagination
    const total = allJobs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = allJobs.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    return {
      items,
      total,
      page,
      limit,
      hasMore,
    };
  }

  // Application operations
  async getApplication(id: string): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationByDedupeKey(dedupeKey: string): Promise<Application | undefined> {
    return Array.from(this.applications.values()).find(app => app.dedupeKey === dedupeKey);
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = randomUUID();
    const application: Application = {
      ...insertApplication,
      id,
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<void> {
    const application = this.applications.get(id);
    if (application) {
      this.applications.set(id, { ...application, ...updates, updatedAt: new Date() });
    }
  }

  async getApplicationsByUser(applicantUid: string): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(application => application.applicantUid === applicantUid)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getApplicationsByJob(jobId: string): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(application => application.jobId === jobId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Report operations
  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      ...insertReport,
      id,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.reports.set(id, report);
    return report;
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<void> {
    const report = this.reports.get(id);
    if (report) {
      this.reports.set(id, { ...report, ...updates, updatedAt: new Date() });
    }
  }

  async getPendingReports(): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => report.status === 'pending')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Audit log operations
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = {
      ...insertLog,
      id,
      timestamp: new Date(),
    };
    this.auditLogs.set(id, log);
    return log;
  }

  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Statistics
  async getStats(): Promise<{
    totalJobs: number;
    totalApplications: number;
    totalEmployers: number;
    totalSeekers: number;
    pendingJobs: number;
    pendingEmployers: number;
    activeJobs: number;
  }> {
    const totalJobs = this.jobs.size;
    const totalApplications = this.applications.size;
    const totalEmployers = Array.from(this.users.values()).filter(u => u.role === 'employer').length;
    const totalSeekers = Array.from(this.users.values()).filter(u => u.role === 'seeker').length;
    const pendingJobs = Array.from(this.jobs.values()).filter(j => j.status === 'pending').length;
    const pendingEmployers = Array.from(this.companies.values()).filter(c => c.status === 'pending').length;
    const activeJobs = Array.from(this.jobs.values()).filter(j => j.status === 'approved').length;

    return {
      totalJobs,
      totalApplications,
      totalEmployers,
      totalSeekers,
      pendingJobs,
      pendingEmployers,
      activeJobs,
    };
  }
}

export const storage = new MemStorage();
