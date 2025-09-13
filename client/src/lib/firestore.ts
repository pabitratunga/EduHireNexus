import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  QueryConstraint,
  DocumentSnapshot,
  Query,
  Timestamp,
  WhereFilterOp,
  and,
  or,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Job,
  JobSearchFilters,
  Company,
  Application,
  User,
  Report,
  AuditLog,
  PaginatedResponse,
  InsertJob,
  InsertCompany,
  InsertApplication,
  InsertReport,
  InsertAuditLog,
} from "@shared/schema";

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  COMPANIES: 'companies',
  JOBS: 'jobs',
  APPLICATIONS: 'applications',
  REPORTS: 'reports',
  AUDIT_LOGS: 'auditLogs',
} as const;

// Helper to convert Firestore timestamp to Date
export const timestampToDate = (timestamp: any): Date => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return new Date();
};

// Helper to convert Firestore document to typed object
const convertFirestoreDoc = <T>(doc: DocumentSnapshot, id?: string): T => {
  const data = doc.data();
  if (!data) {
    throw new Error('Document does not exist');
  }
  
  // Convert timestamps to dates
  const convertedData = Object.keys(data).reduce((acc, key) => {
    const value = data[key];
    if (value instanceof Timestamp) {
      acc[key] = value.toDate();
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as any);

  return {
    id: id || doc.id,
    ...convertedData,
  } as T;
};

// Generic CRUD operations
export class FirestoreService<T> {
  constructor(private collectionName: string) {}

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const doc = await getDoc(docRef);
    return convertFirestoreDoc<T>(doc);
  }

  async createWithId(id: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const docRef = doc(db, this.collectionName, id);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const docSnapshot = await getDoc(docRef);
    return convertFirestoreDoc<T>(docSnapshot);
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnapshot = await getDoc(docRef);
    
    if (!docSnapshot.exists()) {
      return null;
    }
    
    return convertFirestoreDoc<T>(docSnapshot);
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(collection(db, this.collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => convertFirestoreDoc<T>(doc));
  }

  async getPaginated(
    constraints: QueryConstraint[] = [],
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ items: T[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
    const queryConstraints = [
      ...constraints,
      limit(pageSize + 1), // Get one extra to check if there are more
    ];
    
    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc));
    }
    
    const q = query(collection(db, this.collectionName), ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    const docs = querySnapshot.docs;
    const hasMore = docs.length > pageSize;
    const items = docs.slice(0, pageSize).map(doc => convertFirestoreDoc<T>(doc));
    const newLastDoc = hasMore ? docs[pageSize - 1] : null;
    
    return { items, lastDoc: newLastDoc, hasMore };
  }
}

// Service instances
export const userService = new FirestoreService<User>(COLLECTIONS.USERS);
export const companyService = new FirestoreService<Company>(COLLECTIONS.COMPANIES);
export const jobService = new FirestoreService<Job>(COLLECTIONS.JOBS);
export const applicationService = new FirestoreService<Application>(COLLECTIONS.APPLICATIONS);
export const reportService = new FirestoreService<Report>(COLLECTIONS.REPORTS);
export const auditLogService = new FirestoreService<AuditLog>(COLLECTIONS.AUDIT_LOGS);

// Specialized job search function
export async function searchJobs(filters: JobSearchFilters): Promise<PaginatedResponse<Job>> {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'approved'),
  ];

  // Add filters
  if (filters.department) {
    constraints.push(where('department', '==', filters.department));
  }

  if (filters.instituteType) {
    constraints.push(where('instituteType', '==', filters.instituteType));
  }

  if (filters.level) {
    constraints.push(where('level', '==', filters.level));
  }

  if (filters.employmentType) {
    constraints.push(where('employmentType', '==', filters.employmentType));
  }

  if (filters.location) {
    constraints.push(where('location.city', '==', filters.location));
  }

  // Date filtering for "posted within"
  if (filters.postedWithin !== 'all') {
    const now = new Date();
    let daysAgo = 0;
    
    switch (filters.postedWithin) {
      case '24h':
        daysAgo = 1;
        break;
      case '7d':
        daysAgo = 7;
        break;
      case '30d':
        daysAgo = 30;
        break;
    }
    
    const dateThreshold = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    constraints.push(where('createdAt', '>=', Timestamp.fromDate(dateThreshold)));
  }

  // Sorting
  switch (filters.sortBy) {
    case 'newest':
      constraints.push(orderBy('createdAt', 'desc'));
      break;
    case 'deadline':
      constraints.push(orderBy('lastDate', 'asc'));
      break;
    case 'salary_high':
      constraints.push(orderBy('maxSalary', 'desc'));
      break;
    case 'salary_low':
      constraints.push(orderBy('minSalary', 'asc'));
      break;
  }

  // Get paginated results
  const startIndex = (filters.page - 1) * filters.limit;
  constraints.push(limit(filters.limit));

  const q = query(collection(db, COLLECTIONS.JOBS), ...constraints);
  const querySnapshot = await getDocs(q);
  
  let jobs = querySnapshot.docs.map(doc => convertFirestoreDoc<Job>(doc));

  // Client-side text search if query provided
  if (filters.query) {
    const searchTerm = filters.query.toLowerCase();
    jobs = jobs.filter(job => 
      job.title.toLowerCase().includes(searchTerm) ||
      job.description.toLowerCase().includes(searchTerm) ||
      job.qualifications.some(q => q.toLowerCase().includes(searchTerm)) ||
      job.skills.some(s => s.toLowerCase().includes(searchTerm))
    );
  }

  // Calculate total for pagination (this is approximate for client-side filtering)
  const total = jobs.length;
  const hasMore = jobs.length === filters.limit;

  return {
    items: jobs,
    total,
    page: filters.page,
    limit: filters.limit,
    hasMore,
  };
}

// Get featured/recent jobs
export async function getFeaturedJobs(limitCount: number = 6): Promise<Job[]> {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc'),
    limit(limitCount),
  ];

  return jobService.getAll(constraints);
}

// Get jobs by company
export async function getJobsByCompany(companyId: string): Promise<Job[]> {
  const constraints: QueryConstraint[] = [
    where('companyId', '==', companyId),
    orderBy('createdAt', 'desc'),
  ];

  return jobService.getAll(constraints);
}

// Get applications by user
export async function getApplicationsByUser(uid: string): Promise<Application[]> {
  const constraints: QueryConstraint[] = [
    where('applicantUid', '==', uid),
    orderBy('createdAt', 'desc'),
  ];

  return applicationService.getAll(constraints);
}

// Get applications by job
export async function getApplicationsByJob(jobId: string): Promise<Application[]> {
  const constraints: QueryConstraint[] = [
    where('jobId', '==', jobId),
    orderBy('createdAt', 'desc'),
  ];

  return applicationService.getAll(constraints);
}

// Get pending companies for admin
export async function getPendingCompanies(): Promise<Company[]> {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
  ];

  return companyService.getAll(constraints);
}

// Get pending jobs for admin
export async function getPendingJobs(): Promise<Job[]> {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
  ];

  return jobService.getAll(constraints);
}

// Get company by owner
export async function getCompanyByOwner(ownerUid: string): Promise<Company | null> {
  const constraints: QueryConstraint[] = [
    where('ownerUid', '==', ownerUid),
    limit(1),
  ];

  const companies = await companyService.getAll(constraints);
  return companies.length > 0 ? companies[0] : null;
}

// Check if user has applied to job
export async function hasUserAppliedToJob(jobId: string, uid: string): Promise<boolean> {
  const dedupeKey = `${jobId}_${uid}`;
  const constraints: QueryConstraint[] = [
    where('dedupeKey', '==', dedupeKey),
    limit(1),
  ];

  const applications = await applicationService.getAll(constraints);
  return applications.length > 0;
}

// Get job statistics
export async function getJobStats(): Promise<{
  totalJobs: number;
  approvedJobs: number;
  pendingJobs: number;
  totalApplications: number;
}> {
  const [allJobs, allApplications] = await Promise.all([
    jobService.getAll(),
    applicationService.getAll(),
  ]);

  const approvedJobs = allJobs.filter(job => job.status === 'approved').length;
  const pendingJobs = allJobs.filter(job => job.status === 'pending').length;

  return {
    totalJobs: allJobs.length,
    approvedJobs,
    pendingJobs,
    totalApplications: allApplications.length,
  };
}
