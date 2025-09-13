import { User as FirebaseUser } from "firebase/auth";
import { User, UserRole, Job, Company, Application } from "@shared/schema";

// Extended Firebase user type with profile data
export interface ExtendedUser extends FirebaseUser {
  profile?: User;
  role?: UserRole;
}

// Auth context state
export interface AuthState {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  error: string | null;
}

// Job with company information
export interface JobWithCompany extends Job {
  company: Company;
}

// Application with job and applicant information
export interface ApplicationWithDetails extends Application {
  job: Job;
  applicant: User;
}

// Search result types
export interface JobSearchResult {
  jobs: JobWithCompany[];
  total: number;
  hasMore: boolean;
  facets: {
    departments: Record<string, number>;
    instituteTypes: Record<string, number>;
    locations: Record<string, number>;
    levels: Record<string, number>;
  };
}

// Dashboard statistics
export interface DashboardStats {
  totalJobs: number;
  totalApplications: number;
  totalEmployers: number;
  totalSeekers: number;
  pendingJobs: number;
  pendingEmployers: number;
  activeJobs: number;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionLabel?: string;
}

// Form states
export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// File upload states
export interface FileUploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  file: File | null;
  uploaded: boolean;
}

// Modal states
export interface ModalState {
  isOpen: boolean;
  data?: any;
  loading?: boolean;
}

// Filter options for jobs
export interface JobFilterOptions {
  departments: Array<{ value: string; label: string; count: number }>;
  instituteTypes: Array<{ value: string; label: string; count: number }>;
  levels: Array<{ value: string; label: string; count: number }>;
  locations: Array<{ value: string; label: string; count: number }>;
  employmentTypes: Array<{ value: string; label: string; count: number }>;
}

// API request types
export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Component prop types
export interface PageProps {
  title?: string;
  description?: string;
  className?: string;
}

export interface LayoutProps extends PageProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

// Hook return types
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
  reset: () => void;
}

export interface UsePaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setLimit: (limit: number) => void;
}

// Route protection types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireEmailVerification?: boolean;
  fallback?: React.ReactNode;
}

// Search and filter types
export interface SearchState {
  query: string;
  filters: Record<string, any>;
  sort: {
    field: string;
    order: 'asc' | 'desc';
  };
  loading: boolean;
  results: any[];
  total: number;
  hasMore: boolean;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeState {
  theme: Theme;
  systemTheme: 'light' | 'dark';
  resolvedTheme: 'light' | 'dark';
}

// Toast notification types
export interface ToastState {
  id: string;
  title?: string;
  description?: string;
  type: 'default' | 'success' | 'error' | 'warning';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}
