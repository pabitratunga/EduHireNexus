import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthProvider';
import { getCompanyByOwner, getJobsByCompany } from '@/lib/firestore';
import { uploadLogo, uploadProofDocument } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner, PageLoadingSpinner } from '@/components/LoadingSpinner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { 
  Building, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  Upload, 
  FileText, 
  Download, 
  Plus, 
  Edit, 
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Briefcase,
  Eye,
  HelpCircle,
  MessageCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InstituteType } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const companyFormSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  website: z.string().url().optional().or(z.literal('')),
  instituteType: InstituteType,
  hrEmail: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  address: z.string().min(10, 'Please provide a complete address'),
});

type CompanyForm = z.infer<typeof companyFormSchema>;

export function Employer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['employer-company', user?.uid],
    queryFn: () => user?.uid ? getCompanyByOwner(user.uid) : null,
    enabled: !!user?.uid,
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['employer-jobs', company?.id],
    queryFn: () => company?.id ? getJobsByCompany(company.id) : [],
    enabled: !!company?.id,
  });

  const form = useForm<CompanyForm>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      website: '',
      instituteType: 'Private University' as InstituteType,
      hrEmail: '',
      phone: '',
      address: '',
    },
  });

  React.useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        website: company.website || '',
        instituteType: company.instituteType,
        hrEmail: company.hrEmail,
        phone: company.phone || '',
        address: company.address,
      });
    }
  }, [company, form]);

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyForm) => {
      // In a real app, this would call an API to update the company
      toast({
        title: "Company Updated",
        description: "Company profile has been updated successfully.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-company'] });
    },
  });

  const onSubmit = (data: CompanyForm) => {
    updateCompanyMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (companyLoading) {
    return <PageLoadingSpinner text="Loading employer dashboard..." />;
  }

  return (
    <ProtectedRoute requiredRole="employer">
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Status Banner */}
          {company?.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Account Under Review</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your employer account is pending admin approval. You'll be able to post jobs once verified.
                  </p>
                </div>
              </div>
            </div>
          )}

          {company?.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Account Rejected</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Your employer account has been rejected. Please contact support for more information.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile" data-testid="tab-profile">Company Profile</TabsTrigger>
                  <TabsTrigger value="jobs" data-testid="tab-jobs">Posted Jobs</TabsTrigger>
                  <TabsTrigger value="applications" data-testid="tab-applications">Applications</TabsTrigger>
                </TabsList>

                {/* Company Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Company Profile</CardTitle>
                        <Button variant="outline" size="sm" data-testid="button-edit-company">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Company Header */}
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {company?.name ? company.name.substring(0, 3).toUpperCase() : 'COM'}
                            </span>
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-foreground" data-testid="company-name">
                              {company?.name || 'New Company'}
                            </h2>
                            <p className="text-muted-foreground">{company?.instituteType}</p>
                          </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Company/Institution Name *</Label>
                            <Input
                              id="name"
                              {...form.register('name')}
                              data-testid="input-company-name"
                            />
                            {form.formState.errors.name && (
                              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="instituteType">Institute Type *</Label>
                            <Select 
                              value={form.watch('instituteType')} 
                              onValueChange={(value: InstituteType) => form.setValue('instituteType', value)}
                            >
                              <SelectTrigger data-testid="select-institute-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="IIT">IIT</SelectItem>
                                <SelectItem value="NIT">NIT</SelectItem>
                                <SelectItem value="IIIT">IIIT</SelectItem>
                                <SelectItem value="Central University">Central University</SelectItem>
                                <SelectItem value="State University">State University</SelectItem>
                                <SelectItem value="Private University">Private University</SelectItem>
                                <SelectItem value="Deemed University">Deemed University</SelectItem>
                                <SelectItem value="Research Institute">Research Institute</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                              id="website"
                              type="url"
                              placeholder="https://www.company.edu"
                              {...form.register('website')}
                              data-testid="input-website"
                            />
                            {form.formState.errors.website && (
                              <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="hrEmail">HR Email *</Label>
                            <Input
                              id="hrEmail"
                              type="email"
                              placeholder="hr@company.edu"
                              {...form.register('hrEmail')}
                              data-testid="input-hr-email"
                            />
                            {form.formState.errors.hrEmail && (
                              <p className="text-sm text-destructive">{form.formState.errors.hrEmail.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+91 12345 67890"
                              {...form.register('phone')}
                              data-testid="input-phone"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Address *</Label>
                          <Textarea
                            id="address"
                            placeholder="Complete address including city, state, and pincode"
                            rows={3}
                            {...form.register('address')}
                            data-testid="textarea-address"
                          />
                          {form.formState.errors.address && (
                            <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                          )}
                        </div>

                        {/* Verification Documents */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-foreground">Verification Documents</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                              <CardContent className="p-4">
                                <h4 className="font-medium text-foreground mb-2">Certificate of Incorporation</h4>
                                {company?.proofDocs && company.proofDocs.length > 0 ? (
                                  <div className="flex items-center justify-between bg-muted rounded-lg p-3">
                                    <div className="flex items-center">
                                      <FileText className="w-5 h-5 text-muted-foreground mr-3" />
                                      <div>
                                        <p className="text-sm font-medium text-foreground">incorporation_cert.pdf</p>
                                        <p className="text-xs text-muted-foreground">1.2 MB</p>
                                      </div>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Upload document</p>
                                    <Button variant="outline" size="sm" className="mt-2" data-testid="button-upload-docs">
                                      Choose File
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardContent className="p-4">
                                <h4 className="font-medium text-foreground mb-2">Authorization Letter</h4>
                                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">Upload document</p>
                                  <Button variant="outline" size="sm" className="mt-2">
                                    Choose File
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={updateCompanyMutation.isPending}
                            data-testid="button-save-company"
                          >
                            {updateCompanyMutation.isPending ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              'Save Changes'
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Posted Jobs Tab */}
                <TabsContent value="jobs" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Posted Jobs</CardTitle>
                        <Button 
                          disabled={company?.status !== 'approved'}
                          data-testid="button-post-job"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Post New Job
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {jobsLoading ? (
                        <div className="flex justify-center py-8">
                          <LoadingSpinner text="Loading jobs..." />
                        </div>
                      ) : jobs && jobs.length > 0 ? (
                        <div className="space-y-4">
                          {jobs.map((job) => (
                            <div key={job.id} className="border border-border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground mb-1" data-testid={`job-title-${job.id}`}>
                                    {job.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Posted on {job.createdAt.toLocaleDateString()} • Apply by {job.lastDate.toLocaleDateString()}
                                  </p>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                      <Users className="w-4 h-4 mr-1" />
                                      <span>{job.applicationCount || 0} Applications</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Eye className="w-4 h-4 mr-1" />
                                      <span>{job.viewCount || 0} Views</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <Badge className={getStatusColor(job.status)} data-testid={`job-status-${job.id}`}>
                                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                  </Badge>
                                  <Button variant="ghost" size="sm" data-testid={`button-edit-job-${job.id}`}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">No Jobs Posted Yet</h3>
                          <p className="text-muted-foreground mb-4">
                            {company?.status === 'approved' 
                              ? "Start posting jobs to attract qualified candidates." 
                              : "Complete your profile verification to start posting jobs."
                            }
                          </p>
                          <Button 
                            disabled={company?.status !== 'approved'}
                            data-testid="button-post-first-job"
                          >
                            Post Your First Job
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Applications Tab */}
                <TabsContent value="applications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Job Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Applications Yet</h3>
                        <p className="text-muted-foreground">
                          Applications will appear here once candidates start applying to your jobs.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Jobs Posted</span>
                    <span className="font-medium text-foreground" data-testid="stat-total-jobs">
                      {jobs?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Applications</span>
                    <span className="font-medium text-foreground" data-testid="stat-applications">
                      {jobs?.reduce((total, job) => total + (job.applicationCount || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Profile Views</span>
                    <span className="font-medium text-foreground" data-testid="stat-views">
                      {jobs?.reduce((total, job) => total + (job.viewCount || 0), 0) || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Verification Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Verification Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm text-foreground">Email Verified</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm text-foreground">Company Details</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(company?.status === 'approved' ? 'approved' : 'pending')}
                    <span className="text-sm text-foreground ml-3">Document Review</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(company?.status || 'pending')}
                    <span className="text-sm text-foreground ml-3">Admin Approval</span>
                  </div>
                </CardContent>
              </Card>

              {/* Support */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-help-guide">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    View Guide
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-contact-support">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default Employer;
