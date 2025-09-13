import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthProvider';
import { getUserResumes, uploadResume, deleteFile } from '@/lib/storage';
import { getApplicationsByUser } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner, PageLoadingSpinner } from '@/components/LoadingSpinner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Upload, 
  FileText, 
  Download, 
  Trash, 
  Edit,
  Plus,
  ExternalLink,
  MailCheck,
  GraduationCap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Department } from '@shared/schema';

export function Profile() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ['user-resumes', user?.uid],
    queryFn: () => user?.uid ? getUserResumes(user.uid) : [],
    enabled: !!user?.uid,
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['user-applications', user?.uid],
    queryFn: () => user?.uid ? getApplicationsByUser(user.uid) : [],
    enabled: !!user?.uid,
  });

  const uploadResumeMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.uid) throw new Error('User not authenticated');
      
      setIsUploading(true);
      setUploadProgress(0);
      
      return uploadResume(file, user.uid, {
        onProgress: (progress) => setUploadProgress(progress),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-resumes'] });
      toast({
        title: "Resume Uploaded",
        description: "Your resume has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const deleteResumeMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-resumes'] });
      toast({
        title: "Resume Deleted",
        description: "Your resume has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadResumeMutation.mutate(file);
    }
  };

  const handleDeleteResume = (resumePath: string) => {
    if (confirm('Are you sure you want to delete this resume?')) {
      deleteResumeMutation.mutate(resumePath);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'offered':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ProtectedRoute requiredRole="seeker">
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
                <Button variant="outline" size="sm" data-testid="button-edit-profile">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-primary-foreground" data-testid="user-avatar">
                        {userProfile?.displayName ? getInitials(userProfile.displayName) : 'U'}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-foreground" data-testid="user-name">
                      {userProfile?.displayName || 'Anonymous User'}
                    </h2>
                    <p className="text-muted-foreground">Mathematics Professor</p>
                    <div className="flex items-center justify-center mt-2">
                      <MailCheck className="w-4 h-4 text-accent mr-2" />
                      <span className="text-sm text-accent">Email Verified</span>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground mr-3" />
                      <span data-testid="user-email">{user?.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground mr-3" />
                      <span>+91 98765 43210</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mr-3" />
                      <span>New Delhi, India</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground mr-3" />
                      <span>15 years experience</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  {/* Resume Upload Section */}
                  <div className="border border-border rounded-lg p-6">
                    <h3 className="font-semibold text-foreground mb-4">Resume/CV</h3>
                    
                    {resumesLoading ? (
                      <div className="flex justify-center py-4">
                        <LoadingSpinner text="Loading resumes..." />
                      </div>
                    ) : resumes && resumes.length > 0 ? (
                      <div className="space-y-3">
                        {resumes.map((resume) => (
                          <div key={resume.path} className="flex items-center justify-between bg-muted rounded-lg p-3">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-muted-foreground mr-3" />
                              <div>
                                <p className="text-sm font-medium text-foreground" data-testid={`resume-name-${resume.name}`}>
                                  {resume.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Uploaded {resume.uploadedAt.toLocaleDateString()} • {(resume.size / (1024 * 1024)).toFixed(1)} MB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(resume.downloadURL, '_blank')}
                                data-testid={`button-download-${resume.name}`}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteResume(resume.path)}
                                disabled={deleteResumeMutation.isPending}
                                data-testid={`button-delete-${resume.name}`}
                              >
                                <Trash className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">
                          No resume uploaded yet
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Upload your resume to apply for jobs
                        </p>
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className="mt-4">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="resume-upload"
                        data-testid="input-resume-upload"
                      />
                      <label htmlFor="resume-upload">
                        <Button 
                          disabled={isUploading}
                          className="w-full cursor-pointer"
                          data-testid="button-upload-resume"
                          asChild
                        >
                          {isUploading ? (
                            <>
                              <LoadingSpinner size="sm" />
                              Uploading... {Math.round(uploadProgress)}%
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload New Resume
                            </>
                          )}
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        PDF format only, max 5MB
                      </p>
                    </div>
                  </div>

                  {/* Skills & Qualifications */}
                  <div className="border border-border rounded-lg p-6">
                    <h3 className="font-semibold text-foreground mb-4">Skills & Qualifications</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="block text-sm font-medium text-foreground mb-2">Highest Qualification</Label>
                        <Input 
                          defaultValue="Ph.D. in Mathematics" 
                          className="w-full"
                          data-testid="input-qualification"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-medium text-foreground mb-2">Specialization</Label>
                        <Input 
                          defaultValue="Applied Mathematics, Numerical Analysis" 
                          className="w-full"
                          data-testid="input-specialization"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <Label className="block text-sm font-medium text-foreground mb-2">Skills</Label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {['MATLAB', 'Python', 'LaTeX', 'Research', 'Teaching'].map((skill) => (
                          <Badge key={skill} variant="secondary" data-testid={`skill-${skill.toLowerCase()}`}>
                            {skill}
                          </Badge>
                        ))}
                        <Button variant="outline" size="sm" data-testid="button-add-skill">
                          <Plus className="w-3 h-3 mr-1" />
                          Add Skill
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">About Me</Label>
                      <Textarea 
                        placeholder="Tell us about your experience, research interests, and career goals..."
                        rows={4}
                        data-testid="textarea-about"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Applications</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Applications</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="reviewed">Under Review</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner text="Loading applications..." />
                </div>
              ) : applications && applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">IIT</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground" data-testid={`application-title-${application.id}`}>
                                Loading Job Title...
                              </h4>
                              <p className="text-sm text-muted-foreground">Loading Company...</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Applied on {application.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge 
                            className={getStatusColor(application.status)} 
                            data-testid={`application-status-${application.id}`}
                          >
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </Badge>
                          <Button variant="ghost" size="sm" data-testid={`button-view-application-${application.id}`}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Applications Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't applied to any jobs yet. Start browsing available positions.
                  </p>
                  <Button data-testid="button-browse-jobs">
                    Browse Jobs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default Profile;
