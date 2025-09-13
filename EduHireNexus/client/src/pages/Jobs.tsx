import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
// Removed direct firestore import - using API instead
import { JobSearchFilters, Department, InstituteType, JobLevel, EmploymentType, Job, PaginatedResponse } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner, PageLoadingSpinner } from '@/components/LoadingSpinner';
import { 
  MapPin, 
  Calendar, 
  Briefcase, 
  Clock, 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function Jobs() {
  const [filters, setFilters] = useState<JobSearchFilters>({
    page: 1,
    limit: 20,
    sortBy: 'newest',
    postedWithin: 'all',
  });

  // Build API URL with query parameters
  const buildJobsUrl = (filters: JobSearchFilters) => {
    const params = new URLSearchParams();
    params.append('page', filters.page?.toString() || '1');
    params.append('limit', filters.limit?.toString() || '20');
    if (filters.query) params.append('q', filters.query);
    if (filters.department) params.append('department', filters.department);
    if (filters.instituteType) params.append('instituteType', filters.instituteType);
    if (filters.level) params.append('level', filters.level);
    if (filters.location) params.append('location', filters.location);
    if (filters.employmentType) params.append('employmentType', filters.employmentType);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.postedWithin) params.append('postedWithin', filters.postedWithin);
    return `/api/jobs?${params.toString()}`;
  };

  const { data: apiResponse, isLoading, refetch } = useQuery<{ data: PaginatedResponse<Job> }>({
    queryKey: [buildJobsUrl(filters)],
  });

  const jobResults = apiResponse?.data;

  const handleFilterChange = (key: keyof JobSearchFilters, value: any) => {
    // Convert 'all-*' values to undefined for filtering
    const filterValue = value?.startsWith?.('all-') ? undefined : value;
    setFilters(prev => ({
      ...prev,
      [key]: filterValue,
      page: 1, // Reset to first page when changing filters
    }));
  };

  const handleSearch = () => {
    refetch();
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (isLoading && !jobResults) {
    return <PageLoadingSpinner text="Loading jobs..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Filter Bar */}
      <section className="bg-card border-b border-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Faculty Positions</h1>
              <p className="text-muted-foreground mt-1" data-testid="text-job-count">
                {jobResults?.total ? `${jobResults.total}+ positions available` : 'Loading...'}
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <Select 
                value={filters.sortBy} 
                onValueChange={(value: JobSearchFilters['sortBy']) => 
                  handleFilterChange('sortBy', value)
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Sort by: Newest</SelectItem>
                  <SelectItem value="deadline">Sort by: Deadline</SelectItem>
                  <SelectItem value="salary_high">Sort by: Salary High</SelectItem>
                  <SelectItem value="salary_low">Sort by: Salary Low</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by title, keywords, or skills..."
                  value={filters.query || ''}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  className="h-10"
                  data-testid="input-job-search"
                />
              </div>
              <Button onClick={handleSearch} data-testid="button-search">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Select
                value={filters.department}
                onValueChange={(value: Department) => handleFilterChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-departments">All Departments</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Statistics">Statistics</SelectItem>
                  <SelectItem value="Control Theory">Control Theory</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.instituteType}
                onValueChange={(value: InstituteType) => handleFilterChange('instituteType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Institute Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-institute-types">All Institute Types</SelectItem>
                  <SelectItem value="IIT">IIT</SelectItem>
                  <SelectItem value="NIT">NIT</SelectItem>
                  <SelectItem value="State University">State University</SelectItem>
                  <SelectItem value="Private University">Private University</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.level}
                onValueChange={(value: JobLevel) => handleFilterChange('level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-levels">All Levels</SelectItem>
                  <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                  <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                  <SelectItem value="Professor">Professor</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.location}
                onValueChange={(value: string) => handleFilterChange('location', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-locations">All Locations</SelectItem>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Bangalore">Bangalore</SelectItem>
                  <SelectItem value="Chennai">Chennai</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.postedWithin}
                onValueChange={(value: JobSearchFilters['postedWithin']) => 
                  handleFilterChange('postedWithin', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Posted Anytime</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleSearch}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-apply-filters"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Searching jobs..." />
            </div>
          ) : (
            <div className="space-y-6">
              {jobResults?.items.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow" data-testid={`job-listing-${job.id}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4">
                          {/* Company Logo Placeholder */}
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">
                              {/* In real implementation, get company initials */}
                              {job.instituteType.substring(0, 3)}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <Link href={`/jobs/${job.id}`}>
                                  <h3 className="text-lg font-semibold text-foreground mb-1 hover:text-primary transition-colors" data-testid={`job-title-${job.id}`}>
                                    {job.title}
                                  </h3>
                                </Link>
                                <p className="text-muted-foreground mb-2" data-testid={`job-institute-type-${job.id}`}>
                                  {job.instituteType} • {job.department}
                                </p>
                                
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    <span data-testid={`job-location-${job.id}`}>
                                      {job.location.city}, {job.location.state}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <Briefcase className="w-4 h-4 mr-1" />
                                    <span>{job.employmentType}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    <span data-testid={`job-deadline-${job.id}`}>
                                      Apply by {job.lastDate.toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end ml-4">
                                {(job.minSalary || job.maxSalary) && (
                                  <Badge variant="secondary" className="mb-2">
                                    {job.minSalary && job.maxSalary 
                                      ? `₹${(job.minSalary / 100000).toFixed(0)}-${(job.maxSalary / 100000).toFixed(0)} LPA`
                                      : job.minSalary 
                                        ? `₹${(job.minSalary / 100000).toFixed(0)}+ LPA`
                                        : `₹${(job.maxSalary! / 100000).toFixed(0)} LPA`
                                    }
                                  </Badge>
                                )}
                                <Link href={`/jobs/${job.id}`}>
                                  <Button data-testid={`button-apply-${job.id}`}>
                                    Apply Now
                                  </Button>
                                </Link>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`job-description-${job.id}`}>
                                {job.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {job.level}
                                </Badge>
                                {job.qualifications.slice(0, 2).map((qual, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {qual}
                                  </Badge>
                                ))}
                                {job.skills.slice(0, 2).map((skill, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Empty State */}
              {jobResults?.items.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No jobs found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({ page: 1, limit: 20, sortBy: 'newest', postedWithin: 'all' })}
                    data-testid="button-clear-filters"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {jobResults && jobResults.items.length > 0 && (
            <div className="flex items-center justify-between mt-12">
              <div className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                Showing {((filters.page - 1) * filters.limit) + 1}-{Math.min(filters.page * filters.limit, jobResults.total)} of {jobResults.total}+ results
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, Math.ceil(jobResults.total / filters.limit)) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === filters.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        data-testid={`button-page-${page}`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={!jobResults.hasMore}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Jobs;
