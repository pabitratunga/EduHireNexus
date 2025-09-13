import { z } from "zod";

// User roles
export const UserRole = z.enum(["seeker", "employer", "admin"]);
export type UserRole = z.infer<typeof UserRole>;

// User schema
export const UserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  role: UserRole.default("seeker"),
  emailVerified: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const InsertUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = z.infer<typeof UserSchema>;
export type InsertUser = z.infer<typeof InsertUserSchema>;

// Company/Institution schema
export const CompanyStatus = z.enum(["pending", "approved", "rejected"]);
export type CompanyStatus = z.infer<typeof CompanyStatus>;

export const InstituteType = z.enum([
  "IIT",
  "NIT",
  "IIIT",
  "IISc",
  "Central University",
  "State University",
  "Deemed University",
  "Private University",
  "Community College",
  "Research Institute",
  "Other"
]);
export type InstituteType = z.infer<typeof InstituteType>;

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  website: z.string().url().optional(),
  instituteType: InstituteType,
  hrEmail: z.string().email(),
  logoPath: z.string().optional(),
  address: z.string(),
  phone: z.string().optional(),
  proofDocs: z.array(z.string()).default([]),
  ownerUid: z.string(),
  status: CompanyStatus.default("pending"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const InsertCompanySchema = CompanySchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export type Company = z.infer<typeof CompanySchema>;
export type InsertCompany = z.infer<typeof InsertCompanySchema>;

// Job schema
export const JobStatus = z.enum(["pending", "approved", "rejected", "expired"]);
export type JobStatus = z.infer<typeof JobStatus>;

export const JobLevel = z.enum([
  "Assistant Professor",
  "Associate Professor", 
  "Professor",
  "Lecturer",
  "Senior Lecturer",
  "Principal",
  "Vice-Chancellor",
  "Director",
  "Visiting Professor",
  "Adjunct Professor",
  "Postdoc",
  "Research Associate",
  "Research Scientist"
]);
export type JobLevel = z.infer<typeof JobLevel>;

export const EmploymentType = z.enum([
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Visiting"
]);
export type EmploymentType = z.infer<typeof EmploymentType>;

export const Department = z.enum([
  "Mathematics",
  "Statistics", 
  "Control Theory",
  "Computer Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Engineering",
  "Economics",
  "Management",
  "Social Sciences",
  "Humanities",
  "Medicine",
  "Law",
  "Education",
  "Other"
]);
export type Department = z.infer<typeof Department>;

export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  department: Department,
  level: JobLevel,
  instituteType: InstituteType,
  employmentType: EmploymentType,
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string().default("India"),
  }),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  currency: z.string().default("INR"),
  qualifications: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  description: z.string(),
  requirements: z.string().optional(),
  lastDate: z.date(),
  applyMode: z.enum(["external", "internal"]).default("internal"),
  applyUrl: z.string().url().optional(),
  companyId: z.string(),
  posterUid: z.string(),
  status: JobStatus.default("pending"),
  approvedBy: z.string().optional(),
  approvedAt: z.date().optional(),
  viewCount: z.number().default(0),
  applicationCount: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const InsertJobSchema = JobSchema.omit({
  id: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  viewCount: true,
  applicationCount: true,
  createdAt: true,
  updatedAt: true,
});

export type Job = z.infer<typeof JobSchema>;
export type InsertJob = z.infer<typeof InsertJobSchema>;

// Application schema
export const ApplicationStatus = z.enum([
  "submitted",
  "reviewed", 
  "shortlisted",
  "rejected",
  "offered",
  "withdrawn"
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatus>;

export const ApplicationSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  applicantUid: z.string(),
  resumePath: z.string(),
  coverLetter: z.string().optional(),
  status: ApplicationStatus.default("submitted"),
  notes: z.string().optional(),
  dedupeKey: z.string(), // jobId + applicantUid hash
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const InsertApplicationSchema = ApplicationSchema.omit({
  id: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
});

export type Application = z.infer<typeof ApplicationSchema>;
export type InsertApplication = z.infer<typeof InsertApplicationSchema>;

// Report schema (for abuse/moderation)
export const ReportType = z.enum(["job", "company", "user", "application"]);
export type ReportType = z.infer<typeof ReportType>;

export const ReportReason = z.enum([
  "spam",
  "inappropriate_content", 
  "fake_information",
  "harassment",
  "duplicate",
  "other"
]);
export type ReportReason = z.infer<typeof ReportReason>;

export const ReportSchema = z.object({
  id: z.string(),
  type: ReportType,
  targetId: z.string(),
  reporterUid: z.string(),
  reason: ReportReason,
  notes: z.string().optional(),
  status: z.enum(["pending", "resolved", "dismissed"]).default("pending"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const InsertReportSchema = ReportSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export type Report = z.infer<typeof ReportSchema>;
export type InsertReport = z.infer<typeof InsertReportSchema>;

// Audit Log schema
export const AuditActionType = z.enum([
  "user_created",
  "user_role_changed",
  "company_approved",
  "company_rejected", 
  "job_approved",
  "job_rejected",
  "application_submitted",
  "application_status_changed",
  "report_created",
  "report_resolved"
]);
export type AuditActionType = z.infer<typeof AuditActionType>;

export const AuditLogSchema = z.object({
  id: z.string(),
  actorUid: z.string(),
  action: AuditActionType,
  targetType: z.string(),
  targetId: z.string(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.date(),
});

export const InsertAuditLogSchema = AuditLogSchema.omit({
  id: true,
  timestamp: true,
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
export type InsertAuditLog = z.infer<typeof InsertAuditLogSchema>;

// Search/Filter schemas
export const JobSearchFilters = z.object({
  query: z.string().optional(),
  department: Department.optional(),
  instituteType: InstituteType.optional(),
  level: JobLevel.optional(),
  location: z.string().optional(),
  employmentType: EmploymentType.optional(),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  postedWithin: z.enum(["24h", "7d", "30d", "all"]).default("all"),
  sortBy: z.enum(["newest", "deadline", "salary_high", "salary_low"]).default("newest"),
  page: z.number().default(1),
  limit: z.number().default(20),
});

export type JobSearchFilters = z.infer<typeof JobSearchFilters>;

// API Response schemas
export const ApiResponse = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export const PaginatedResponse = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(), 
    limit: z.number(),
    hasMore: z.boolean(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};
