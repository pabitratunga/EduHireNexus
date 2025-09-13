import React, { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/context/AuthProvider';
import { sendVerificationEmail, logout } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MailCheck, RefreshCw, Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function EmailVerification() {
  const { user, refetchProfile } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [showChangeEmail, setShowChangeEmail] = useState(false);

  React.useEffect(() => {
    // Redirect if already verified
    if (user?.emailVerified) {
      window.location.href = '/';
    }
  }, [user?.emailVerified]);

  React.useEffect(() => {
    // Check verification status every 30 seconds
    const interval = setInterval(async () => {
      if (user && !user.emailVerified) {
        await user.reload();
        await refetchProfile();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, refetchProfile]);

  const handleResendVerification = async () => {
    if (!user) return;

    setIsResending(true);
    try {
      await sendVerificationEmail(user);
    } catch (error) {
      console.error('Error resending verification email:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!user) return;

    setIsCheckingStatus(true);
    try {
      await user.reload();
      await refetchProfile();
      
      if (user.emailVerified) {
        toast({
          title: "Email Verified!",
          description: "Your email has been verified successfully.",
        });
        window.location.href = '/';
      } else {
        toast({
          title: "Not Verified Yet",
          description: "Please check your email and click the verification link.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      toast({
        title: "Error",
        description: "Failed to check verification status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to verify your email.
          </p>
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="shadow-lg border border-border">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-8 h-8 text-accent" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">Verify Your Email</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                We've sent a verification link to:
              </p>
              <div className="bg-muted rounded-lg p-3 mb-6">
                <p className="font-medium text-foreground break-all" data-testid="text-user-email">
                  {user.email}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Please check your email and click the verification link to activate your account.
                Don't forget to check your spam folder.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full"
                data-testid="button-resend-verification"
              >
                {isResending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>

              <Button 
                onClick={handleCheckStatus}
                disabled={isCheckingStatus}
                variant="outline"
                className="w-full"
                data-testid="button-check-status"
              >
                {isCheckingStatus ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  "I've Verified - Check Status"
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Need help?</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowChangeEmail(!showChangeEmail)}
                data-testid="button-change-email"
              >
                <Mail className="w-4 h-4 mr-2" />
                Change Email Address
              </Button>

              {showChangeEmail && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="new-email">New Email Address</Label>
                    <Input
                      id="new-email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="new.email@university.edu"
                      data-testid="input-new-email"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Note: Changing your email will require you to sign in again with the new email.
                  </p>
                  <div className="flex space-x-2">
                    <Button size="sm" disabled className="flex-1">
                      Update Email (Coming Soon)
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowChangeEmail(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border">
              <Link href="/auth">
                <Button variant="ghost" size="sm" data-testid="button-back-auth">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>

              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                data-testid="button-sign-out"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EmailVerification;
