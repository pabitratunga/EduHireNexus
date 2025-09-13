# Overview

EduHire Faculty is a comprehensive academic job marketplace platform that connects faculty members with educational institutions across India. The application features a multi-tier role-based system with job seekers (faculty), employers (institutions/HR), and administrators managing the entire ecosystem. The platform emphasizes security through mandatory email verification and admin-moderated approval workflows for employers and job postings.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with modern React architecture using Next.js 14 with App Router and TypeScript for type safety. The UI layer leverages Tailwind CSS combined with shadcn/ui components for consistent design and Radix UI primitives for accessibility. The application uses Wouter for client-side routing and React Hook Form with Zod validation for robust form handling. State management is handled through TanStack Query for server state and React Context for authentication state.

## Backend Architecture
The backend follows a hybrid approach combining Express.js server with Firebase services. The Express server handles API routes and serves the React application in development via Vite middleware. Authentication and real-time data are managed through Firebase Auth and Firestore, while file storage utilizes Firebase Storage. The architecture also includes Firebase Cloud Functions for server-side operations like user profile creation and admin actions.

## Database Design
The application uses Firestore as the primary database with collections for users, companies, jobs, applications, reports, and audit logs. Additionally, there's a PostgreSQL database configured with Drizzle ORM for potential relational data needs. The schema is strongly typed using Zod schemas shared between client and server, ensuring data consistency across the application.

## Authentication & Authorization
Authentication is built on Firebase Auth supporting email/password, Google OAuth, and phone number verification. The system enforces mandatory email verification before accessing protected features. Role-based access control is implemented using Firebase custom claims with three distinct roles: seekers (default), employers (requires admin approval), and admins. Protected routes are secured through middleware and React route guards.

## File Management System
File uploads are handled through Firebase Storage with specific paths for different file types (resumes, company logos, proof documents). The system includes validation for file types, size limits, and progress tracking for uploads. Resume uploads are restricted to PDF format with a 5MB limit, while company documents support multiple formats.

# External Dependencies

## Firebase Services
- **Firebase Auth**: User authentication with email/password, Google OAuth, and phone verification
- **Firestore**: NoSQL database for storing user profiles, companies, jobs, applications, and reports
- **Firebase Storage**: File storage for resumes, company logos, and verification documents
- **Firebase Cloud Functions**: Server-side functions for user management and admin operations

## Database & ORM
- **PostgreSQL**: Relational database via Neon serverless
- **Drizzle ORM**: Type-safe database toolkit for PostgreSQL operations

## Email Services
- **SendGrid**: Email delivery service for verification emails, notifications, and password reset functionality

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Accessible component primitives for form controls, navigation, and overlays
- **Lucide Icons**: Icon library for consistent iconography

## Development & Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESLint**: Code linting and formatting
- **Wouter**: Lightweight client-side routing library