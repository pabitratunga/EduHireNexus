import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { 
  InstituteType, 
  Department, 
  JobLevel, 
  EmploymentType,
  JobSearchFilters 
} from "@shared/schema";
import { validateFirebaseToken } from "./services/firebase-admin";
import { sendEmail } from "./services/email";
import { storage } from "./storage";

// User interface is now extended globally via types/express.d.ts

// API Response helper
const createApiResponse = (data?: any, error?: string, message?: string) => ({
  success: !error,
  data,
  error,
  message,
});

// Middleware to validate Firebase token
const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json(createApiResponse(null, 'No token provided'));
    }

    const decodedToken = await validateFirebaseToken(token);
    req.user = decodedToken as any; // Compatible with optional fields
    next();
  } catch (error) {
    res.status(401).json(createApiResponse(null, 'Invalid token'));
  }
};

// Middleware to check email verification
const requireEmailVerification = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.email_verified) {
    return res.status(403).json(createApiResponse(null, 'Email verification required'));
  }
  next();
};

// Middleware to check user role
const requireRole = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role || 'seeker';
  if (!roles.includes(userRole)) {
    return res.status(403).json(createApiResponse(null, 'Insufficient permissions'));
  }
  next();
};

// Validation schemas
const companySchema = z.object({
  name: z.string().min(2),
  website: z.string().url().optional(),
  instituteType: InstituteType,
  hrEmail: z.string().email(),
  phone: z.string().optional(),
  address: z.string().min(10),
});

const jobSchema = z.object({
  title: z.string().min(5),
  department: Department,
  level: JobLevel,
  instituteType: InstituteType,
  employmentType: EmploymentType,
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string().default('India'),
  }),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  currency: z.string().default('INR'),
  qualifications: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  description: z.string().min(50),
  requirements: z.string().optional(),
  lastDate: z.string().transform(str => new Date(str)),
  companyId: z.string(),
});

const applicationSchema = z.object({
  jobId: z.string(),
  resumePath: z.string(),
  coverLetter: z.string().optional(),
});

// Type assertion helper to ensure user is authenticated
function assertUser(req: Request): asserts req is Request & { user: Express.UserPayload } {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get('/api/health', (req, res) => {
    res.json(createApiResponse({ status: 'OK', timestamp: new Date().toISOString() }));
  });

  // Auth routes
  app.post('/api/auth/send-verification', authenticateUser, async (req, res) => {
    try {
      const { email } = req.user;
      
      // Send verification email
      const emailSent = await sendEmail({
        to: email,
        subject: 'Verify your EduHire Faculty account',
        html: `
          <h1>Welcome to EduHire Faculty!</h1>
          <p>Please verify your email address by clicking the link below:</p>
          <p>This is a demo - email verification would be handled by Firebase Auth.</p>
        `
      });

      if (emailSent) {
        res.json(createApiResponse(null, null, 'Verification email sent'));
      } else {
        res.status(500).json(createApiResponse(null, 'Failed to send email'));
      }
    } catch (error) {
      res.status(500).json(createApiResponse(null, 'Internal server error'));
    }
  });

  // Company routes
  app.post('/api/companies', authenticateUser, requireEmailVerification, async (req, res) => {
    try {
      const validatedData = companySchema.parse(req.body);
      
      const company = await storage.createCompany({
        ...validatedData,
        ownerUid: req.user.uid,
        proofDocs: [],
      });

      res.json(createApiResponse(company));
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(createApiResponse(null, 'Validation error', error.errors[0].message));
      } else {
        res.status(500).json(createApiResponse(null, 'Failed to create company'));
      }
    }
  });

  app.get('/api/companies/me', authenticateUser, requireEmailVerification, async (req, res) => {
    try {
      const company = await storage.getCompanyByOwner(req.user.uid);
      res.json(createApiResponse(company));
    } catch (error) {
      res.status(500).json(createApiResponse(null, 'Failed to get company'));
    }
  });

  app.put('/api/companies/:id', authenticateUser, requireEmailVerification, async (req, res) => {
    try {
      const companyId = req.params.id;
      const validatedData = companySchema.partial().parse(req.body);
      
      // Check if user owns the company
      const company = await storage.getCompany(companyId);
      if (!company || company.ownerUid !== req.user.uid) {
        return res.status(403).json(createApiResponse(null, 'Not authorized'));
      }
      
      // Don't allow updates if company is approved (except specific fields)
      if (company.status === 'approved') {
        const allowedFields = ['phone', 'address'];
        const updateData = Object.keys(validatedData).reduce((acc: any, key) => {
          if (allowedFields.includes(key)) {
            acc[key] = validatedData[key as keyof typeof validatedData];
          }
          return acc;
        }, {});
        
        await storage.updateCompany(companyId, updateData);
      } else {
        await storage.updateCompany(companyId, validatedData);
      }
      
      res.json(createApiResponse(null, null, 'Company updated successfully'));
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(createApiResponse(null, 'Validation error', error.errors[0].message));
      } else {
        res.status(500).json(createApiResponse(null, 'Failed to update company'));
      }
    }
  });

  // Admin route to get pending companies
  app.get('/api/admin/companies/pending', 
    authenticateUser, 
    requireEmailVerification, 
    requireRole(['admin']), 
    async (req, res) => {
      try {
        const companies = await storage.getPendingCompanies();
        res.json(createApiResponse(companies));
      } catch (error) {
        res.status(500).json(createApiResponse(null, 'Failed to get pending companies'));
      }
    }
  );

  // Admin route to approve/reject companies
  app.patch('/api/admin/companies/:id/status', 
    authenticateUser, 
    requireEmailVerification, 
    requireRole(['admin']), 
    async (req, res) => {
      try {
        const companyId = req.params.id;
        const { status } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
          return res.status(400).json(createApiResponse(null, 'Invalid status'));
        }
        
        await storage.updateCompany(companyId, { status });
        
        // Log audit entry
        await storage.createAuditLog({
          actorUid: req.user.uid,
          action: status === 'approved' ? 'company_approved' : 'company_rejected',
          targetType: 'company',
          targetId: companyId,
          metadata: { status },
        });
        
        res.json(createApiResponse(null, null, `Company ${status} successfully`));
      } catch (error) {
        res.status(500).json(createApiResponse(null, `Failed to ${req.body.status} company`));
      }
    }
  );

  // Job routes
  app.post('/api/jobs', 
    authenticateUser, 
    requireEmailVerification, 
    requireRole(['employer']), 
    async (req, res) => {
      try {
        const validatedData = jobSchema.parse(req.body);
        
        // Check if company is approved
        const company = await storage.getCompany(validatedData.companyId);
        if (!company || company.status !== 'approved' || company.ownerUid !== req.user.uid) {
          return res.status(403).json(createApiResponse(null, 'Company must be approved to post jobs'));
        }
        
        const job = await storage.createJob({
          ...validatedData,
          posterUid: req.user.uid,
          status: 'pending',
        });

        res.json(createApiResponse(job));
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json(createApiResponse(null, 'Validation error', error.errors[0].message));
        } else {
          res.status(500).json(createApiResponse(null, 'Failed to create job'));
        }
      }
    }
  );

  app.get('/api/jobs', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const filters = {
        department: req.query.department as string,
        instituteType: req.query.instituteType as string,
        level: req.query.level as string,
        location: req.query.location as string,
        employmentType: req.query.employmentType as string,
        sortBy: req.query.sortBy as string || 'newest',
        query: req.query.q as string,
      };
      
      const result = await storage.searchJobs(filters, page, limit);
      res.json(createApiResponse(result));
    } catch (error) {
      res.status(500).json(createApiResponse(null, 'Failed to search jobs'));
    }
  });

  app.get('/api/jobs/featured', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 6, 20);
      const jobs = await storage.getFeaturedJobs(limit);
      res.json(createApiResponse(jobs));
    } catch (error) {
      res.status(500).json(createApiResponse(null, 'Failed to get featured jobs'));
    }
  });

  app.get('/api/jobs/:id', async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json(createApiResponse(null, 'Job not found'));
      }
      
      // Increment view count
      await storage.updateJob(job.id, { 
        viewCount: (job.viewCount || 0) + 1 
      });
      
      res.json(createApiResponse(job));
    } catch (error) {
      res.status(500).json(createApiResponse(null, 'Failed to get job'));
    }
  });

  // Admin routes for jobs
  app.get('/api/admin/jobs/pending', 
    authenticateUser, 
    requireEmailVerification, 
    requireRole(['admin']), 
    async (req, res) => {
      try {
        const jobs = await storage.getPendingJobs();
        res.json(createApiResponse(jobs));
      } catch (error) {
        res.status(500).json(createApiResponse(null, 'Failed to get pending jobs'));
      }
    }
  );

  app.patch('/api/admin/jobs/:id/status', 
    authenticateUser, 
    requireEmailVerification, 
    requireRole(['admin']), 
    async (req, res) => {
      try {
        const jobId = req.params.id;
        const { status } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
          return res.status(400).json(createApiResponse(null, 'Invalid status'));
        }
        
        const updateData: any = { status };
        if (status === 'approved') {
          updateData.approvedBy = req.user.uid;
          updateData.approvedAt = new Date();
        }
        
        await storage.updateJob(jobId, updateData);
        
        // Log audit entry
        await storage.createAuditLog({
          actorUid: req.user.uid,
          action: status === 'approved' ? 'job_approved' : 'job_rejected',
          targetType: 'job',
          targetId: jobId,
          metadata: { status },
        });
        
        res.json(createApiResponse(null, null, `Job ${status} successfully`));
      } catch (error) {
        res.status(500).json(createApiResponse(null, `Failed to ${req.body.status} job`));
      }
    }
  );

  // Application routes
  app.post('/api/applications', 
    authenticateUser, 
    requireEmailVerification, 
    requireRole(['seeker']), 
    async (req, res) => {
      try {
        const validatedData = applicationSchema.parse(req.body);
        
        // Check if job is approved
        const job = await storage.getJob(validatedData.jobId);
        if (!job || job.status !== 'approved') {
          return res.status(400).json(createApiResponse(null, 'Job not available for applications'));
        }
        
        // Check if application deadline has passed
        if (job.lastDate < new Date()) {
          return res.status(400).json(createApiResponse(null, 'Application deadline has passed'));
        }
        
        // Check for duplicate application
        const dedupeKey = `${validatedData.jobId}_${req.user.uid}`;
        const existingApplication = await storage.getApplicationByDedupeKey(dedupeKey);
        if (existingApplication) {
          return res.status(400).json(createApiResponse(null, 'You have already applied to this job'));
        }
        
        const application = await storage.createApplication({
          ...validatedData,
          applicantUid: req.user.uid,
          dedupeKey,
        });
        
        // Increment application count
        await storage.updateJob(job.id, { 
          applicationCount: (job.applicationCount || 0) + 1 
        });
        
        res.json(createApiResponse(application));
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json(createApiResponse(null, 'Validation error', error.errors[0].message));
        } else {
          res.status(500).json(createApiResponse(null, 'Failed to submit application'));
        }
      }
    }
  );

  app.get('/api/applications/me', 
    authenticateUser, 
    requireEmailVerification, 
    requireRole(['seeker']), 
    async (req, res) => {
      try {
        const applications = await storage.getApplicationsByUser(req.user.uid);
        res.json(createApiResponse(applications));
      } catch (error) {
        res.status(500).json(createApiResponse(null, 'Failed to get applications'));
      }
    }
  );

  // Stats route
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(createApiResponse(stats));
    } catch (error) {
      res.status(500).json(createApiResponse(null, 'Failed to get stats'));
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
