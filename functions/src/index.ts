import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';
import { z } from 'zod';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Region configuration (use India region for better performance)
const region = 'asia-south1';

// Schema definitions for validation
const companySchema = z.object({
  name: z.string().min(2),
  website: z.string().url().optional(),
  instituteType: z.string(),
  hrEmail: z.string().email(),
  phone: z.string().optional(),
  address: z.string().min(10),
  proofDocs: z.array(z.string()).default([]),
});

const jobSchema = z.object({
  title: z.string().min(5),
  department: z.string(),
  level: z.string(),
  instituteType: z.string(),
  employmentType: z.string(),
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string().default('India'),
  }),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  currency: z.string().default('INR'),
  qualifications: z.array(z.string()),
  skills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  description: z.string().min(50),
  requirements: z.string().optional(),
  lastDate: z.any().transform(val => admin.firestore.Timestamp.fromDate(new Date(val))),
  companyId: z.string(),
});

// Helper function to send emails
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured');
    return false;
  }

  try {
    await sgMail.send({
      to,
      from: process.env.FROM_EMAIL || 'noreply@eduhire.faculty.com',
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

// Helper function to create audit log
async function createAuditLog(
  actorUid: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: any
): Promise<void> {
  await db.collection('auditLogs').add({
    actorUid,
    action,
    targetType,
    targetId,
    metadata: metadata || {},
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// 1. User creation trigger - Create user profile on authentication
export const onAuthUserCreate = functions
  .region(region)
  .auth.user()
  .onCreate(async (user) => {
    try {
      const userProfile = {
        displayName: user.displayName || 'Anonymous User',
        email: user.email!,
        role: 'seeker', // Default role
        emailVerified: user.emailVerified,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('users').doc(user.uid).set(userProfile);

      // Send welcome email
      if (user.email) {
        await sendEmail(
          user.email,
          'Welcome to EduHire Faculty!',
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Welcome to EduHire Faculty!</h1>
            <p>Thank you for joining our academic job marketplace. We're excited to help you find the perfect faculty position.</p>
            <p>To get started, please verify your email address using the verification link sent by Firebase Authentication.</p>
            <p>Best regards,<br>The EduHire Faculty Team</p>
          </div>
          `
        );
      }

      console.log(`User profile created for ${user.uid}`);
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  });

// 2. Request employer upgrade (callable function)
export const requestEmployerUpgrade = functions
  .region(region)
  .https
  .onCall(async (data, context) => {
    // Verify authentication and email verification
    if (!context.auth || !context.auth.token.email_verified) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated and email verified'
      );
    }

    try {
      const validatedData = companySchema.parse(data);
      const uid = context.auth.uid;

      // Check if user already has a company
      const existingCompany = await db.collection('companies')
        .where('ownerUid', '==', uid)
        .limit(1)
        .get();

      if (!existingCompany.empty) {
        throw new functions.https.HttpsError(
          'already-exists',
          'User already has a company profile'
        );
      }

      // Create company with pending status
      const companyData = {
        ...validatedData,
        ownerUid: uid,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const companyRef = await db.collection('companies').add(companyData);

      // Create audit log
      await createAuditLog(uid, 'company_created', 'company', companyRef.id);

      return { success: true, companyId: companyRef.id };
    } catch (error) {
      console.error('Error requesting employer upgrade:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create company profile');
    }
  });

// 3. Approve employer upgrade (admin only callable function)
export const approveEmployerUpgrade = functions
  .region(region)
  .https
  .onCall(async (data, context) => {
    // Verify admin authentication
    if (!context.auth || context.auth.token.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admin users can approve employers'
      );
    }

    const { uid, companyId } = data;

    if (!uid || !companyId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'uid and companyId are required'
      );
    }

    try {
      // Update company status
      await db.collection('companies').doc(companyId).update({
        status: 'approved',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Set custom user claim
      await auth.setCustomUserClaims(uid, { role: 'employer' });

      // Update user profile
      await db.collection('users').doc(uid).update({
        role: 'employer',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Get company and user details for email
      const [companyDoc, userDoc] = await Promise.all([
        db.collection('companies').doc(companyId).get(),
        db.collection('users').doc(uid).get(),
      ]);

      const companyData = companyDoc.data();
      const userData = userDoc.data();

      // Send approval email
      if (userData?.email) {
        await sendEmail(
          userData.email,
          'Your Employer Account Has Been Approved!',
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16a34a;">Congratulations!</h1>
            <p>Your employer account for <strong>${companyData?.name}</strong> has been approved.</p>
            <p>You can now start posting faculty positions and attracting qualified candidates.</p>
            <p><a href="${process.env.APP_URL || 'https://eduhire.faculty.com'}/employer" 
               style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
               Go to Dashboard</a></p>
            <p>Best regards,<br>The EduHire Faculty Team</p>
          </div>
          `
        );
      }

      // Create audit log
      await createAuditLog(context.auth.uid, 'company_approved', 'company', companyId, { uid });

      return { success: true };
    } catch (error) {
      console.error('Error approving employer:', error);
      throw new functions.https.HttpsError('internal', 'Failed to approve employer');
    }
  });

// 4. Create job (employer only callable function)
export const createJob = functions
  .region(region)
  .https
  .onCall(async (data, context) => {
    // Verify employer authentication and email verification
    if (!context.auth || !context.auth.token.email_verified || context.auth.token.role !== 'employer') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only verified employers can create jobs'
      );
    }

    try {
      const validatedData = jobSchema.parse(data);
      const uid = context.auth.uid;

      // Verify company ownership and approval
      const companyDoc = await db.collection('companies').doc(validatedData.companyId).get();
      if (!companyDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Company not found');
      }

      const companyData = companyDoc.data()!;
      if (companyData.ownerUid !== uid) {
        throw new functions.https.HttpsError('permission-denied', 'Not authorized to post for this company');
      }

      if (companyData.status !== 'approved') {
        throw new functions.https.HttpsError('permission-denied', 'Company must be approved to post jobs');
      }

      // Create job with pending status
      const jobData = {
        ...validatedData,
        posterUid: uid,
        status: 'pending',
        viewCount: 0,
        applicationCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const jobRef = await db.collection('jobs').add(jobData);

      // Create audit log
      await createAuditLog(uid, 'job_created', 'job', jobRef.id);

      return { success: true, jobId: jobRef.id };
    } catch (error) {
      console.error('Error creating job:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create job');
    }
  });

// 5. Approve job (admin only callable function)
export const approveJob = functions
  .region(region)
  .https
  .onCall(async (data, context) => {
    // Verify admin authentication
    if (!context.auth || context.auth.token.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admin users can approve jobs'
      );
    }

    const { jobId } = data;

    if (!jobId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'jobId is required'
      );
    }

    try {
      // Update job status
      await db.collection('jobs').doc(jobId).update({
        status: 'approved',
        approvedBy: context.auth.uid,
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Get job and company details for email
      const jobDoc = await db.collection('jobs').doc(jobId).get();
      const jobData = jobDoc.data()!;

      const companyDoc = await db.collection('companies').doc(jobData.companyId).get();
      const companyData = companyDoc.data()!;

      const userDoc = await db.collection('users').doc(jobData.posterUid).get();
      const userData = userDoc.data()!;

      // Send approval email
      if (userData?.email) {
        await sendEmail(
          userData.email,
          'Your Job Posting Has Been Approved!',
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16a34a;">Job Approved!</h1>
            <p>Your job posting "<strong>${jobData.title}</strong>" has been approved and is now live on our platform.</p>
            <p>Qualified candidates can now view and apply for this position.</p>
            <p><a href="${process.env.APP_URL || 'https://eduhire.faculty.com'}/employer/jobs" 
               style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
               View Applications</a></p>
            <p>Best regards,<br>The EduHire Faculty Team</p>
          </div>
          `
        );
      }

      // Create audit log
      await createAuditLog(context.auth.uid, 'job_approved', 'job', jobId);

      return { success: true };
    } catch (error) {
      console.error('Error approving job:', error);
      throw new functions.https.HttpsError('internal', 'Failed to approve job');
    }
  });

// 6. Apply to job (seeker only callable function)
export const applyToJob = functions
  .region(region)
  .https
  .onCall(async (data, context) => {
    // Verify seeker authentication and email verification
    if (!context.auth || !context.auth.token.email_verified || context.auth.token.role !== 'seeker') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only verified job seekers can apply to jobs'
      );
    }

    const { jobId, resumePath, coverLetter } = data;
    const uid = context.auth.uid;

    if (!jobId || !resumePath) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'jobId and resumePath are required'
      );
    }

    try {
      // Verify job exists and is approved
      const jobDoc = await db.collection('jobs').doc(jobId).get();
      if (!jobDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Job not found');
      }

      const jobData = jobDoc.data()!;
      if (jobData.status !== 'approved') {
        throw new functions.https.HttpsError('permission-denied', 'Job is not available for applications');
      }

      // Check if application deadline has passed
      const lastDate = jobData.lastDate.toDate();
      if (lastDate < new Date()) {
        throw new functions.https.HttpsError('permission-denied', 'Application deadline has passed');
      }

      // Check for duplicate application
      const dedupeKey = `${jobId}_${uid}`;
      const existingApplication = await db.collection('applications')
        .where('dedupeKey', '==', dedupeKey)
        .limit(1)
        .get();

      if (!existingApplication.empty) {
        throw new functions.https.HttpsError('already-exists', 'You have already applied to this job');
      }

      // Create application
      const applicationData = {
        jobId,
        applicantUid: uid,
        resumePath,
        coverLetter: coverLetter || '',
        status: 'submitted',
        dedupeKey,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const applicationRef = await db.collection('applications').add(applicationData);

      // Update job application count
      await db.collection('jobs').doc(jobId).update({
        applicationCount: admin.firestore.FieldValue.increment(1),
      });

      // Get applicant and company details for notification
      const [applicantDoc, companyDoc] = await Promise.all([
        db.collection('users').doc(uid).get(),
        db.collection('companies').doc(jobData.companyId).get(),
      ]);

      const applicantData = applicantDoc.data()!;
      const companyData = companyDoc.data()!;

      // Send application notification to employer
      await sendEmail(
        companyData.hrEmail,
        'New Application Received',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">New Application Received</h1>
          <p>You have received a new application for the position "<strong>${jobData.title}</strong>" from ${applicantData.displayName}.</p>
          <p><a href="${process.env.APP_URL || 'https://eduhire.faculty.com'}/employer/jobs" 
             style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
             Review Application</a></p>
          <p>Best regards,<br>The EduHire Faculty Team</p>
        </div>
        `
      );

      // Create audit log
      await createAuditLog(uid, 'application_submitted', 'application', applicationRef.id, { jobId });

      return { success: true, applicationId: applicationRef.id };
    } catch (error) {
      console.error('Error applying to job:', error);
      throw new functions.https.HttpsError('internal', 'Failed to submit application');
    }
  });

// 7. Generate signed URL for resume access (employer/admin only)
export const signUrlForResume = functions
  .region(region)
  .https
  .onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth || !context.auth.token.email_verified) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated and email verified'
      );
    }

    const { applicationId } = data;
    const uid = context.auth.uid;
    const role = context.auth.token.role;

    if (!applicationId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'applicationId is required'
      );
    }

    try {
      // Get application details
      const applicationDoc = await db.collection('applications').doc(applicationId).get();
      if (!applicationDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Application not found');
      }

      const applicationData = applicationDoc.data()!;

      // Check permissions
      if (role === 'admin') {
        // Admin can access any resume
      } else if (role === 'employer') {
        // Employer can only access resumes for their job postings
        const jobDoc = await db.collection('jobs').doc(applicationData.jobId).get();
        if (!jobDoc.exists || jobDoc.data()!.posterUid !== uid) {
          throw new functions.https.HttpsError(
            'permission-denied',
            'Not authorized to access this resume'
          );
        }
      } else {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only employers and admin can access resumes'
        );
      }

      // Generate signed URL (expires in 1 hour)
      const bucket = admin.storage().bucket();
      const file = bucket.file(applicationData.resumePath);

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 3600 * 1000, // 1 hour
      });

      return { success: true, url };
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new functions.https.HttpsError('internal', 'Failed to generate signed URL');
    }
  });

// 8. Scheduled function to expire jobs
export const expireJobs = functions
  .region(region)
  .pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    try {
      const now = admin.firestore.Timestamp.now();
      
      // Find jobs past their deadline
      const expiredJobsQuery = await db.collection('jobs')
        .where('status', '==', 'approved')
        .where('lastDate', '<', now)
        .get();

      const batch = db.batch();
      let count = 0;

      expiredJobsQuery.docs.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'expired',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        count++;
      });

      if (count > 0) {
        await batch.commit();
        console.log(`Expired ${count} jobs`);
      }

      return null;
    } catch (error) {
      console.error('Error expiring jobs:', error);
      return null;
    }
  });

// 9. Update application status (employer/admin only)
export const updateApplicationStatus = functions
  .region(region)
  .https
  .onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth || !context.auth.token.email_verified) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated and email verified'
      );
    }

    const { applicationId, status, notes } = data;
    const uid = context.auth.uid;
    const role = context.auth.token.role;

    const validStatuses = ['reviewed', 'shortlisted', 'rejected', 'offered'];
    if (!applicationId || !status || !validStatuses.includes(status)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'applicationId and valid status are required'
      );
    }

    try {
      // Get application details
      const applicationDoc = await db.collection('applications').doc(applicationId).get();
      if (!applicationDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Application not found');
      }

      const applicationData = applicationDoc.data()!;

      // Check permissions
      if (role === 'admin') {
        // Admin can update any application
      } else if (role === 'employer') {
        // Employer can only update applications for their jobs
        const jobDoc = await db.collection('jobs').doc(applicationData.jobId).get();
        if (!jobDoc.exists || jobDoc.data()!.posterUid !== uid) {
          throw new functions.https.HttpsError(
            'permission-denied',
            'Not authorized to update this application'
          );
        }
      } else {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only employers and admin can update applications'
        );
      }

      // Update application
      await db.collection('applications').doc(applicationId).update({
        status,
        notes: notes || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Get job and applicant details for notification
      const [jobDoc, applicantDoc] = await Promise.all([
        db.collection('jobs').doc(applicationData.jobId).get(),
        db.collection('users').doc(applicationData.applicantUid).get(),
      ]);

      const jobData = jobDoc.data()!;
      const applicantData = applicantDoc.data()!;

      // Send status update email to applicant
      if (applicantData?.email) {
        await sendEmail(
          applicantData.email,
          'Application Status Update',
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Application Status Update</h1>
            <p>The status of your application for "<strong>${jobData.title}</strong>" has been updated to: <strong>${status}</strong>.</p>
            ${notes ? `<p>Additional notes: ${notes}</p>` : ''}
            <p><a href="${process.env.APP_URL || 'https://eduhire.faculty.com'}/profile" 
               style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
               View Application</a></p>
            <p>Best regards,<br>The EduHire Faculty Team</p>
          </div>
          `
        );
      }

      // Create audit log
      await createAuditLog(uid, 'application_status_changed', 'application', applicationId, { status, previousStatus: applicationData.status });

      return { success: true };
    } catch (error) {
      console.error('Error updating application status:', error);
      throw new functions.https.HttpsError('internal', 'Failed to update application status');
    }
  });
