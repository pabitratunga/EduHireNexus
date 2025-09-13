import React from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { jobService, hasUserAppliedToJob } from '@/lib/firestore';
import { useAuth } from '@/context/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageLoadingSpinner } from '@/components/LoadingSpinner';
import { 
  MapPin, 
  Calendar, 
  Briefcase, 
  Clock, 
  Building,
  Users,
  GraduationCap,
  Star,
  Share2,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function JobDetails() {
  const [, params] = useRoute('/jobs/:id');
  const jobId = params?.id;
  const { user } = useAuth();

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobId ? jobService.getById(jobId) : null,
    enabled: !!jobId,
  });

  const { data: hasApplied, isLoading: applicationLoading } = useQuery({
    queryKey: ['job-application', jobId, user?.uid],
    queryFn: () => jobId && user?.uid ? hasUserAppliedToJob(jobId, user.uid) : false,
    enabled: !!jobId && !!user?.uid,
  });

  if (jobLoading) {
    return <PageLoadingSpinner text="Loading job details..." />;
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Job Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/jobs">
            <Button>Browse Other Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleApply = () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to apply for this job",
        variant: "destructive",
      });
      return;
    }

    if (!user.emailVerified) {
      toast({
        title: "Email Verification Required",
        description: "Please verify your email to apply for jobs",
        variant: "destructive",
      });
      return;
    }

    // Navigate to application page or open modal
    // This would typically open an application modal or navigate to application page
    toast({
      title: "Application Started",
      description: "Redirecting to application form...",
      variant: "default",
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: job.title,
        text: `Check out this ${job.level} position at ${job.instituteType}`,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying URL
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Job link has been copied to clipboard",
        variant: "default",
      });
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    
    const formatAmount = (amount: number) => {
      if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(0)} LPA`;
      }
      return `₹${(amount / 1000).toFixed(0)}K per month`;
    };

    if (min && max) {
      return `${formatAmount(min)} - ${formatAmount(max)}`;
    }
    return formatAmount(min || max!);
  };

  const isExpired = new Date(job.lastDate) < new Date();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/jobs">
            <Button variant="ghost" size="sm" data-testid="button-back-to-jobs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Header */}
            <Card>
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    {/* Company Logo */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {job.instituteType.substring(0, 3)}
                      </span>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="job-title">
                        {job.title}
                      </h1>
                      <p className="text-lg text-muted-foreground mb-3" data-testid="job-institute">
                        {job.instituteType} • {job.department}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span data-testid="job-location">
                            {job.location.city}, {job.location.state}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1" />
                          <span>{job.employmentType}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span data-testid="job-deadline">
                            Apply by {job.lastDate.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleShare} data-testid="button-share">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Job Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary" data-testid="job-views">
                      {job.viewCount || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary" data-testid="job-applications">
                      {job.applicationCount || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Applications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {Math.ceil((job.lastDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-sm text-muted-foreground">Days Left</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {job.level === 'Assistant Professor' ? '★★☆☆☆' : 
                       job.level === 'Associate Professor' ? '★★★☆☆' : '★★★★☆'}
                    </div>
                    <div className="text-sm text-muted-foreground">Level</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">{job.level}</Badge>
                  <Badge variant="secondary">{job.department}</Badge>
                  <Badge variant="outline">{job.employmentType}</Badge>
                  {formatSalary(job.minSalary, job.maxSalary) && (
                    <Badge variant="secondary" data-testid="job-salary">
                      {formatSalary(job.minSalary, job.maxSalary)}
                    </Badge>
                  )}
                  {isExpired && <Badge variant="destructive">Expired</Badge>}
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-foreground whitespace-pre-wrap" data-testid="job-description">
                    {job.description}
                  </p>
                </div>

                {job.requirements && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Requirements</h3>
                      <p className="text-foreground whitespace-pre-wrap">
                        {job.requirements}
                      </p>
                    </div>
                  </>
                )}

                {job.responsibilities.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Key Responsibilities</h3>
                      <ul className="space-y-2">
                        {job.responsibilities.map((responsibility, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span className="text-foreground">{responsibility}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {job.qualifications.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Required Qualifications</h3>
                      <ul className="space-y-2">
                        {job.qualifications.map((qualification, index) => (
                          <li key={index} className="flex items-start">
                            <GraduationCap className="w-4 h-4 mt-1 mr-3 text-primary flex-shrink-0" />
                            <span className="text-foreground">{qualification}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {job.skills.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Preferred Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, index) => (
                          <Badge key={index} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Section */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {!isExpired ? (
                    hasApplied ? (
                      <div className="text-center">
                        <Badge variant="secondary" className="mb-3">Already Applied</Badge>
                        <p className="text-sm text-muted-foreground">
                          You have already applied for this position. We'll notify you about any updates.
                        </p>
                      </div>
                    ) : (
                      <>
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={handleApply}
                          disabled={applicationLoading}
                          data-testid="button-apply-job"
                        >
                          {applicationLoading ? 'Checking...' : 'Apply Now'}
                        </Button>
                        {job.applyMode === 'external' && job.applyUrl && (
                          <Link href={job.applyUrl} target="_blank">
                            <Button variant="outline" className="w-full" data-testid="button-external-apply">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Apply on Company Site
                            </Button>
                          </Link>
                        )}
                      </>
                    )
                  ) : (
                    <div className="text-center">
                      <Badge variant="destructive" className="mb-3">Application Closed</Badge>
                      <p className="text-sm text-muted-foreground">
                        The application deadline for this position has passed.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Job Info */}
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Position Level</span>
                  <span className="font-medium">{job.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{job.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Employment Type</span>
                  <span className="font-medium">{job.employmentType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Institute Type</span>
                  <span className="font-medium">{job.instituteType}</span>
                </div>
                {formatSalary(job.minSalary, job.maxSalary) && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Salary Range</span>
                    <span className="font-medium">{formatSalary(job.minSalary, job.maxSalary)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Posted On</span>
                  <span className="font-medium">{job.createdAt.toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Similar Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Positions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* This would typically show similar jobs */}
                <p className="text-sm text-muted-foreground">
                  Loading similar positions...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetails;
