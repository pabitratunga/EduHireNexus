import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set. Email functionality will be disabled.");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return false;
    }

    const emailData = {
      to: params.to,
      from: params.from || process.env.FROM_EMAIL || 'noreply@eduhire.faculty.com',
      subject: params.subject,
      text: params.text,
      html: params.html,
      ...(params.templateId && {
        templateId: params.templateId,
        dynamicTemplateData: params.dynamicTemplateData,
      }),
    };

    await sgMail.send(emailData);
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

// Email templates
export const EmailTemplates = {
  WELCOME: {
    subject: 'Welcome to EduHire Faculty!',
    getHtml: (name: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to EduHire Faculty, ${name}!</h1>
        <p>Thank you for joining our academic job marketplace. We're excited to help you find the perfect faculty position.</p>
        <p>To get started, please verify your email address by clicking the verification link sent by Firebase Auth.</p>
        <p>Best regards,<br>The EduHire Faculty Team</p>
      </div>
    `
  },
  
  EMPLOYER_APPROVED: {
    subject: 'Your Employer Account Has Been Approved!',
    getHtml: (companyName: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Congratulations!</h1>
        <p>Your employer account for <strong>${companyName}</strong> has been approved.</p>
        <p>You can now start posting faculty positions and attracting qualified candidates.</p>
        <p><a href="${process.env.APP_URL}/employer" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
        <p>Best regards,<br>The EduHire Faculty Team</p>
      </div>
    `
  },
  
  JOB_APPROVED: {
    subject: 'Your Job Posting Has Been Approved!',
    getHtml: (jobTitle: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Job Approved!</h1>
        <p>Your job posting "<strong>${jobTitle}</strong>" has been approved and is now live on our platform.</p>
        <p>Qualified candidates can now view and apply for this position.</p>
        <p><a href="${process.env.APP_URL}/employer/jobs" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Applications</a></p>
        <p>Best regards,<br>The EduHire Faculty Team</p>
      </div>
    `
  },
  
  APPLICATION_RECEIVED: {
    subject: 'New Application Received',
    getHtml: (jobTitle: string, applicantName: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Application Received</h1>
        <p>You have received a new application for the position "<strong>${jobTitle}</strong>" from ${applicantName}.</p>
        <p><a href="${process.env.APP_URL}/employer/jobs" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Application</a></p>
        <p>Best regards,<br>The EduHire Faculty Team</p>
      </div>
    `
  },
  
  APPLICATION_STATUS_CHANGED: {
    subject: 'Application Status Update',
    getHtml: (jobTitle: string, status: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Application Status Update</h1>
        <p>The status of your application for "<strong>${jobTitle}</strong>" has been updated to: <strong>${status}</strong>.</p>
        <p><a href="${process.env.APP_URL}/profile" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Application</a></p>
        <p>Best regards,<br>The EduHire Faculty Team</p>
      </div>
    `
  }
};

// Helper functions for sending specific emails
export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: EmailTemplates.WELCOME.subject,
    html: EmailTemplates.WELCOME.getHtml(name),
  });
}

export async function sendEmployerApprovedEmail(to: string, companyName: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: EmailTemplates.EMPLOYER_APPROVED.subject,
    html: EmailTemplates.EMPLOYER_APPROVED.getHtml(companyName),
  });
}

export async function sendJobApprovedEmail(to: string, jobTitle: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: EmailTemplates.JOB_APPROVED.subject,
    html: EmailTemplates.JOB_APPROVED.getHtml(jobTitle),
  });
}

export async function sendApplicationReceivedEmail(to: string, jobTitle: string, applicantName: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: EmailTemplates.APPLICATION_RECEIVED.subject,
    html: EmailTemplates.APPLICATION_RECEIVED.getHtml(jobTitle, applicantName),
  });
}

export async function sendApplicationStatusEmail(to: string, jobTitle: string, status: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: EmailTemplates.APPLICATION_STATUS_CHANGED.subject,
    html: EmailTemplates.APPLICATION_STATUS_CHANGED.getHtml(jobTitle, status),
  });
}
