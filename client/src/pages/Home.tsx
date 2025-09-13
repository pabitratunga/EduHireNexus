import React from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Calendar, Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getFeaturedJobs } from '@/lib/firestore';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Job } from '@shared/schema';

export function Home() {
  const { data: featuredJobs, isLoading } = useQuery({
    queryKey: ['featured-jobs'],
    queryFn: () => getFeaturedJobs(6),
  });

  const departments = [
    'Mathematics',
    'Statistics', 
    'Control Theory',
    'Computer Science',
    'Physics',
  ];

  const getCompanyInitials = (companyName: string) => {
    return companyName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 3);
  };

  const formatSalary = (min?: number, max?: number, currency = 'INR') => {
    if (!min && !max) return null;
    
    const formatAmount = (amount: number) => {
      if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(0)}L`;
      }
      return `₹${(amount / 1000).toFixed(0)}K`;
    };

    if (min && max) {
      return `${formatAmount(min)} - ${formatAmount(max)}`;
    }
    return formatAmount(min || max!);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 to-background py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Find Your Perfect<br />
              <span className="text-primary">Academic Position</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Connect with leading educational institutions across India. Discover faculty positions in Mathematics, Statistics, Control Theory, and more.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-4xl mx-auto mb-12">
              <Card className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Position or Keywords</label>
                    <Input 
                      placeholder="e.g., Assistant Professor Mathematics" 
                      className="h-12"
                      data-testid="input-search-keywords"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                    <Select>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="delhi">Delhi</SelectItem>
                        <SelectItem value="mumbai">Mumbai</SelectItem>
                        <SelectItem value="bangalore">Bangalore</SelectItem>
                        <SelectItem value="chennai">Chennai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Link href="/jobs" className="w-full">
                      <Button className="w-full h-12" data-testid="button-search-jobs">
                        <Search className="w-5 h-5 mr-2" />
                        Search Jobs
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Categories */}
            <div className="flex flex-wrap justify-center gap-3">
              {departments.map((dept) => (
                <Link key={dept} href={`/jobs?department=${dept.toLowerCase().replace(' ', '-')}`}>
                  <Button 
                    variant="secondary" 
                    className="rounded-full"
                    data-testid={`button-category-${dept.toLowerCase().replace(' ', '-')}`}
                  >
                    {dept}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Featured Positions</h2>
            <p className="text-lg text-muted-foreground">Latest opportunities from top institutions</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center">
              <LoadingSpinner size="lg" text="Loading featured jobs..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs?.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow" data-testid={`job-card-${job.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm" data-testid={`company-logo-${job.id}`}>
                            {/* In real implementation, this would be fetched from company data */}
                            IIT
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground" data-testid={`job-title-${job.id}`}>
                            {job.title}
                          </h3>
                          <p className="text-sm text-muted-foreground" data-testid={`job-company-${job.id}`}>
                            {/* In real implementation, this would be fetched from company data */}
                            Loading Company...
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" data-testid={`job-badge-${job.id}`}>
                        New
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span data-testid={`job-location-${job.id}`}>
                          {job.location.city}, {job.location.state}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span data-testid={`job-deadline-${job.id}`}>
                          Apply by {job.lastDate.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Briefcase className="w-4 h-4 mr-2" />
                        <span data-testid={`job-type-${job.id}`}>{job.employmentType}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.qualifications.slice(0, 2).map((qual, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {qual}
                        </Badge>
                      ))}
                    </div>

                    <Link href={`/jobs/${job.id}`}>
                      <Button className="w-full" data-testid={`button-view-job-${job.id}`}>
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/jobs">
              <Button variant="outline" size="lg" data-testid="button-view-all-jobs">
                View All Jobs
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center" data-testid="stat-active-positions">
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">2,500+</div>
              <div className="text-muted-foreground">Active Positions</div>
            </div>
            <div className="text-center" data-testid="stat-partner-institutions">
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">450+</div>
              <div className="text-muted-foreground">Partner Institutions</div>
            </div>
            <div className="text-center" data-testid="stat-registered-candidates">
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">15,000+</div>
              <div className="text-muted-foreground">Registered Candidates</div>
            </div>
            <div className="text-center" data-testid="stat-success-rate">
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">85%</div>
              <div className="text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
