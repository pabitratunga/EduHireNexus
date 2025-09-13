# EduHire Faculty - Academic Job Marketplace

A comprehensive faculty jobs marketplace built with Next.js, Firebase, and TypeScript. This platform connects academic professionals with educational institutions across India, featuring role-based access control, admin approval workflows, and comprehensive job management.

## 🌟 Features

### Core Functionality
- **Role-based Access Control**: Seekers, Employers, and Admins with distinct permissions
- **Mandatory Email Verification**: All protected actions require verified email addresses
- **Admin Approval Workflows**: Employers and job postings require admin approval
- **Comprehensive Job Search**: Advanced filtering by department, location, salary, and more
- **File Upload System**: Resume uploads for seekers, document verification for employers
- **Real-time Notifications**: Email notifications for key platform events
- **Audit Logging**: Complete activity tracking for administrative oversight

### User Roles

#### **Job Seekers (Faculty)**
- Create and manage professional profiles
- Upload and manage resumes (PDF only, 5MB limit)
- Search and filter job opportunities
- Apply to approved positions
- Track application status and history
- Receive status update notifications

#### **Employers (Institutions/HR)**
- Company profile setup with verification documents
- Job posting creation and management
- Application review and candidate management
- Status updates for applicants
- Dashboard analytics and insights

#### **Administrators**
- Employer verification and approval
- Job posting moderation
- User role management
- Platform analytics and reporting
- Abuse report handling
- System audit logs

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** with shadcn/ui components
- **React Hook Form** with Zod validation
- **TanStack Query** for data fetching and caching
- **Lucide Icons** for consistent iconography

### Backend
- **Firebase Authentication** (Email/Password, Google, Phone OTP)
- **Cloud Firestore** for data storage
- **Firebase Storage** for file uploads
- **Cloud Functions** for server-side logic
- **Firebase Admin SDK** for privileged operations

### Additional Services
- **SendGrid** for email notifications
- **Firebase Security Rules** for data protection
- **Firebase Emulator Suite** for local development

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with enabled services
- SendGrid account for email notifications

### 1. Firebase Project Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable the following services:
   - **Authentication**: Email/Password, Google providers
   - **Cloud Firestore**: Production mode
   - **Cloud Storage**: Default bucket
   - **Cloud Functions**: Node.js 18 runtime

3. In Authentication > Settings:
   - Add your development domain (localhost:5000) to authorized domains
   - After deployment, add your production domain

4. Get your Firebase configuration from Project Settings > General > Your apps

### 2. Environment Configuration

1. Copy the environment template:
```bash
cp .env.example .env.local
