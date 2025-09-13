import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthProvider';
import { signIn, signUp, signInWithGoogle, resetPassword } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { GraduationCap, Mail, Smartphone, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserRole } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

const signUpSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['seeker', 'employer'] as const),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export function Auth() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user?.emailVerified) {
      setLocation('/');
    }
  }, [user, setLocation]);

  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      role: 'seeker',
      acceptTerms: false,
    },
  });

  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSignIn = async (data: SignInForm) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      setLocation('/');
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUp = async (data: SignUpForm) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.displayName, data.role);
      setLocation('/verify');
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      setActiveTab('signin');
    } catch (error) {
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      setLocation('/');
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="shadow-lg border border-border">
          <CardHeader className="text-center pb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Welcome to EduHire</CardTitle>
            <p className="text-muted-foreground mt-2">Sign in to your account or create a new one</p>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" data-testid="tab-signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Form */}
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email Address</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your.email@university.edu"
                      {...signInForm.register('email')}
                      data-testid="input-signin-email"
                    />
                    {signInForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        {...signInForm.register('password')}
                        data-testid="input-signin-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {signInForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember-me" 
                        {...signInForm.register('rememberMe')}
                      />
                      <Label htmlFor="remember-me" className="text-sm">Remember me</Label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setActiveTab('reset')}
                      className="p-0 h-auto"
                      data-testid="button-forgot-password"
                    >
                      Forgot password?
                    </Button>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    data-testid="button-signin"
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Sign In'}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    data-testid="button-google-signin"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Continue with Google
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full"
                    disabled={true}
                    data-testid="button-phone-signin"
                  >
                    <Smartphone className="w-5 h-5 mr-2" />
                    Continue with Phone (Coming Soon)
                  </Button>
                </div>
              </TabsContent>

              {/* Sign Up Form */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Dr. John Smith"
                      {...signUpForm.register('displayName')}
                      data-testid="input-signup-name"
                    />
                    {signUpForm.formState.errors.displayName && (
                      <p className="text-sm text-destructive">{signUpForm.formState.errors.displayName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email Address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your.email@university.edu"
                      {...signUpForm.register('email')}
                      data-testid="input-signup-email"
                    />
                    {signUpForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        {...signUpForm.register('password')}
                        data-testid="input-signup-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {signUpForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-role">I am a</Label>
                    <Select value={signUpForm.watch('role')} onValueChange={(value) => signUpForm.setValue('role', value as 'seeker' | 'employer')}>
                      <SelectTrigger data-testid="select-user-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seeker">Job Seeker (Faculty)</SelectItem>
                        <SelectItem value="employer">Employer (Institution/HR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="accept-terms"
                      {...signUpForm.register('acceptTerms')}
                      data-testid="checkbox-accept-terms"
                    />
                    <Label htmlFor="accept-terms" className="text-sm leading-5">
                      I agree to the <Link href="/terms" className="text-primary hover:text-primary/80">Terms of Service</Link> and{' '}
                      <Link href="/privacy" className="text-primary hover:text-primary/80">Privacy Policy</Link>
                    </Label>
                  </div>
                  {signUpForm.formState.errors.acceptTerms && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.acceptTerms.message}</p>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                    data-testid="button-signup"
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Reset Password Form */}
            {activeTab === 'reset' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Reset Password</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Enter your email address and we'll send you a reset link
                  </p>
                </div>

                <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="your.email@university.edu"
                      {...resetForm.register('email')}
                      data-testid="input-reset-email"
                    />
                    {resetForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{resetForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setActiveTab('signin')}
                      data-testid="button-back-signin"
                    >
                      Back to Sign In
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isLoading}
                      data-testid="button-send-reset"
                    >
                      {isLoading ? <LoadingSpinner size="sm" /> : 'Send Reset Link'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Auth;
