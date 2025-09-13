import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthProvider';
import { UserRole } from '@shared/schema';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, Mail, ShieldOff } from 'lucide-react';
import { sendVerificationEmail } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireEmailVerification?: boolean;
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requireEmailVerification = true,
  fallbackPath = '/auth',
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to auth if not signed in
  useEffect(() => {
    if (!loading && !user) {
      setLocation(fallbackPath);
    }
  }, [loading, user, fallbackPath, setLocation]);

  if (!user) {
    return null; // Return null while redirecting
  }

  // Show email verification required
  if (requireEmailVerification && !user.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-xl">Email Verification Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Please verify your email address to access this feature. We've sent a verification link to:
            </p>
            <p className="font-medium text-foreground bg-muted px-3 py-2 rounded">
              {user.email}
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => sendVerificationEmail(user)}
                variant="default"
                className="w-full"
                data-testid="button-resend-verification"
              >
                Resend Verification Email
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
                data-testid="button-refresh-status"
              >
                I've Verified - Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role requirements
  if (requiredRole && userProfile?.role !== requiredRole) {
    const roleNames = {
      seeker: 'Job Seeker',
      employer: 'Employer',
      admin: 'Administrator',
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldOff className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl">Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This page requires <strong>{roleNames[requiredRole]}</strong> access.
            </p>
            <p className="text-sm text-muted-foreground">
              Your current role: <strong>{userProfile?.role ? roleNames[userProfile.role] : 'Unknown'}</strong>
            </p>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full"
              data-testid="button-go-back"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check employer approval status
  if (requiredRole === 'employer' && userProfile?.role === 'employer') {
    // Note: In a real implementation, you'd check the company approval status
    // For now, we'll assume all employers need to be approved
  }

  return <>{children}</>;
}

export default ProtectedRoute;
