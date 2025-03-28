'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import { getUserLogoDesignProjects } from '@/lib/api/client-api';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusIcon, ChevronRightIcon, PaintbrushIcon, CalendarIcon, BriefcaseIcon } from 'lucide-react';

type LogoDesignProject = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  industry?: string;
  color_preferences?: string;
  style_preferences?: string;
  is_placeholder?: boolean;
  created_at: string;
  updated_at: string;
};

export default function LogoDesignProjectsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<LogoDesignProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const projectsData = await getUserLogoDesignProjects();
        console.log('Logo Design Projects:', projectsData);
        
        // Filter out placeholder projects or handle them specially
        const activeProjects = projectsData.filter(project => !project.is_placeholder);
        setProjects(activeProjects);

        // Check if we only have placeholder projects
        if (projectsData.length > 0 && activeProjects.length === 0) {
          // We only have placeholder projects - all projects are placeholders
          setProjects(projectsData);
        }
      } catch (err) {
        console.error('Error loading logo design projects:', err);
        setError('Failed to load your projects. Please try again later.');
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      loadProjects();
    }
  }, [authLoading, user]);
  
  const getStatusBadge = (status: string) => {
    let variant = 'default';
    let label = status.replace(/_/g, ' ');
    
    switch(status.toLowerCase()) {
      case 'in_progress':
      case 'in-progress':
        variant = 'secondary';
        label = 'In Progress';
        break;
      case 'completed':
        variant = 'success';
        label = 'Completed';
        break;
      case 'pending':
        variant = 'outline';
        label = 'Pending';
        break;
      case 'not-started':
      case 'not_started':
        variant = 'outline';
        label = 'Not Started';
        break;
      case 'cancelled':
        variant = 'destructive';
        label = 'Cancelled';
        break;
    }
    
    return (
      <Badge variant={variant as "default" | "secondary" | "outline" | "destructive"}>{label}</Badge>
    );
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Logo Design Projects</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <div className="p-4 flex justify-between items-center">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Logo Design Projects</h1>
        </div>
        <Card className="text-center p-8">
          <CardContent className="pt-6">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state or only placeholder projects
  if (projects.length === 0 || (projects.length > 0 && projects.every(p => p.is_placeholder))) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Logo Design Projects</h1>
        </div>
        <Card className="text-center p-8">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-4">No Active Logo Design Projects</h3>
            <p className="text-muted-foreground mb-6">
              You do not have any active logo design projects at the moment. Contact us to start a new logo design project.
            </p>
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/support">
                  Contact Us to Start a Project
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Projects display
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Logo Design Projects</h1>
        <Button asChild>
          <Link href="/support">
            <PlusIcon className="mr-2 h-4 w-4" />
            Request New Project
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{project.title || 'Untitled Project'}</CardTitle>
                {getStatusBadge(project.status)}
              </div>
              <CardDescription>
                Logo Design
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description || 'No description provided.'}
              </p>
              
              <div className="mt-4 space-y-2">
                {project.industry && (
                  <div className="flex items-center text-sm">
                    <BriefcaseIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Industry: {project.industry.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {project.color_preferences && (
                  <div className="flex items-center text-sm">
                    <PaintbrushIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Colors: {project.color_preferences}</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Updated: {format(new Date(project.updated_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </CardContent>
            <div className="p-4 flex justify-between items-center">
              {project.is_placeholder ? (
                <Button variant="secondary" disabled>
                  Coming Soon
                </Button>
              ) : (
                <Button asChild variant="default">
                  <Link href={`/projects/logo-design/${project.id}`}>
                    View Details
                    <ChevronRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 