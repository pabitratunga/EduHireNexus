import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPendingCompanies, getPendingJobs, getJobStats } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner, PageLoadingSpinner } from '@/components/LoadingSpinner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { 
  Clock, 
  Briefcase, 
  Flag, 
  Users, 
  CheckCircle, 
  XCircle, 
  Building,
  Eye,
  BarChart,
  Download,
  Settings,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getJobStats,
  });

  const { data: pendingCompanies, isLoading: companiesLoading } = useQuery({
    queryKey: ['pending-companies'],
    queryFn: getPendingCompanies,
  });

  const { data: pendingJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['pending-jobs'],
    queryFn: getPendingJobs,
  });

  const handleApproveCompany = async (companyId: string) => {
    // In a real app, this would call a Firebase Cloud Function
    toast({
      title: "Company Approved",
      description: "The company has been approved and can now post jobs.",
    });
  };

  const handleRejectCompany = async (companyId: string) => {
    // In a real app, this would call a Firebase Cloud Function
    toast({
      title: "Company Rejected",
      description: "The company application has been rejected.",
      variant: "destructive",
    });
  };

  const handleApproveJob = async (jobId: string) => {
    // In a real app, this would call a Firebase Cloud Function
    toast({
      title: "Job Approved",
      description: "The job posting has been approved and is now visible to job seekers.",
    });
  };

  const handleRejectJob = async (jobId: string) => {
    // In a real app, this would call a Firebase Cloud Function
    toast({
      title: "Job Rejected",
      description: "The job posting has been rejected.",
      variant: "destructive",
    });
  };

  if (statsLoading && !stats) {
    return <PageLoadingSpinner text="Loading admin dashboard..." />;
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage employers, jobs, and platform moderation</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="employers" data-testid="tab-employers">Employers</TabsTrigger>
              <TabsTrigger value="jobs" data-testid="tab-jobs">Jobs</TabsTrigger>
              <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Pending Employers</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="stat-pending-employers">
                          {pendingCompanies?.length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Pending Jobs</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="stat-pending-jobs">
                          {pendingJobs?.length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <Flag className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Reports</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="stat-reports">
                          0
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="stat-total-users">
                          15,247
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3" data-testid="activity-item">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">John Admin</span> approved employer <span className="font-medium">IIT Delhi</span>
                        </p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">Sarah Admin</span> approved job posting <span className="font-medium">Professor - Physics</span>
                        </p>
                        <p className="text-xs text-muted-foreground">15 minutes ago</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <Flag className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          New report received for job posting <span className="font-medium">Assistant Professor - Chemistry</span>
                        </p>
                        <p className="text-xs text-muted-foreground">1 hour ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-manage-roles">
                      <UserCheck className="w-4 h-4 mr-3" />
                      Manage User Roles
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-platform-settings">
                      <Settings className="w-4 h-4 mr-3" />
                      Platform Settings
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-analytics">
                      <BarChart className="w-4 h-4 mr-3" />
                      View Analytics
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-export-data">
                      <Download className="w-4 h-4 mr-3" />
                      Export Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Employers Tab */}
            <TabsContent value="employers" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Pending Employer Reviews</CardTitle>
                    <Badge variant="secondary" data-testid="badge-pending-employers">
                      {pendingCompanies?.length || 0} Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {companiesLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner text="Loading pending employers..." />
                    </div>
                  ) : pendingCompanies && pendingCompanies.length > 0 ? (
                    <div className="space-y-4">
                      {pendingCompanies.map((company) => (
                        <div key={company.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {company.name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground" data-testid={`company-name-${company.id}`}>
                                  {company.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">{company.hrEmail}</p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted {company.createdAt.toLocaleDateString()}
                                </p>
                                <div className="flex items-center mt-2 space-x-2">
                                  <Badge variant="outline" className="text-xs">{company.instituteType}</Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {company.proofDocs.length} Documents
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm"
                                onClick={() => handleApproveCompany(company.id)}
                                data-testid={`button-approve-company-${company.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRejectCompany(company.id)}
                                data-testid={`button-reject-company-${company.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Pending Employers</h3>
                      <p className="text-muted-foreground">All employer applications have been reviewed.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Pending Job Reviews</CardTitle>
                    <Badge variant="secondary" data-testid="badge-pending-jobs">
                      {pendingJobs?.length || 0} Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {jobsLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner text="Loading pending jobs..." />
                    </div>
                  ) : pendingJobs && pendingJobs.length > 0 ? (
                    <div className="space-y-4">
                      {pendingJobs.map((job) => (
                        <div key={job.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground mb-1" data-testid={`job-title-${job.id}`}>
                                {job.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                {job.department} • {job.level}
                              </p>
                              <p className="text-xs text-muted-foreground mb-3">
                                Submitted {job.createdAt.toLocaleDateString()} • Apply by {job.lastDate.toLocaleDateString()}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {job.location.city}, {job.location.state}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {job.employmentType}
                                </Badge>
                                {(job.minSalary || job.maxSalary) && (
                                  <Badge variant="outline" className="text-xs">
                                    {job.minSalary && job.maxSalary 
                                      ? `₹${(job.minSalary / 100000).toFixed(0)}-${(job.maxSalary / 100000).toFixed(0)} LPA`
                                      : job.minSalary 
                                        ? `₹${(job.minSalary / 100000).toFixed(0)}+ LPA`
                                        : `₹${(job.maxSalary! / 100000).toFixed(0)} LPA`
                                    }
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2 ml-4">
                              <Button 
                                size="sm"
                                onClick={() => handleApproveJob(job.id)}
                                data-testid={`button-approve-job-${job.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRejectJob(job.id)}
                                data-testid={`button-reject-job-${job.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                              <Button variant="outline" size="sm" data-testid={`button-view-job-${job.id}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Pending Jobs</h3>
                      <p className="text-muted-foreground">All job postings have been reviewed.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Reports & Moderation</CardTitle>
                    <Badge variant="secondary">0 Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Reports</h3>
                    <p className="text-muted-foreground">
                      No abuse reports have been submitted. The platform is running smoothly.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default Admin;
