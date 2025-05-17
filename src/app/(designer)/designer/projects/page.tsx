'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClockIcon, ArrowPathIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { getUserProfile, getDesignerAssignedProjects } from '@/lib/api/client-api';
import Link from 'next/link';

export default function DesignerProjectsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user profile
        const userProfile = await getUserProfile();
        
        // Check role
        if (userProfile?.role !== 'designer') {
          router.push('/dashboard');
          return;
        }

        // Fetch designer's assigned projects
        const assignedProjects = await getDesignerAssignedProjects();
        console.log('Fetched projects:', assignedProjects);
        
        // Ensure we have an array of projects
        if (Array.isArray(assignedProjects)) {
          setProjects(assignedProjects);
        } else {
          console.error('Expected array of projects but got:', typeof assignedProjects);
          setProjects([]);
        }
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Failed to load projects');
        // In development mode, add some mock data for testing
        if (process.env.NODE_ENV === 'development') {
          setProjects([
            {
              id: '1',
              title: 'Company Website Redesign',
              description: 'A complete overhaul of the corporate website with modern design principles and improved UX.',
              status: 'in_progress',
              type: 'web_design',
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              client_name: 'Acme Corporation'
            },
            {
              id: '2',
              title: 'Brand Identity Package',
              description: 'Creating a new logo, color palette, and brand guidelines for a tech startup.',
              status: 'pending',
              type: 'logo_design',
              deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              client_name: 'TechStart Inc.'
            },
            {
              id: '3',
              title: 'Social Media Campaign',
              description: 'A series of graphics for Instagram, Facebook, and Twitter to promote summer sale.',
              status: 'completed',
              type: 'social_graphics',
              deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              client_name: 'Fashion Boutique'
            }
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [router]);

  // Filter projects based on the selected tab
  const filteredProjects = projects.filter(project => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return project.status !== 'completed' && project.status !== 'cancelled';
    if (activeTab === 'completed') return project.status === 'completed';
    if (activeTab === 'upcoming') {
      if (!project.deadline) return false;
      const deadline = new Date(project.deadline);
      const now = new Date();
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 3600 * 24));
      return diffDays <= 7 && diffDays >= 0 && project.status !== 'completed' && project.status !== 'cancelled';
    }
    return true;
  });

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'todo': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Get type badge color
  const getTypeColor = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'web_design': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'logo_design': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'social_graphics': return 'bg-pink-100 text-pink-800 border-pink-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatProjectType = (type: string) => {
    if (!type) return 'Project';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="h-8 w-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h1>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
          <TabsTrigger 
            value="all" 
            className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-primary-600 data-[state=active]:text-white dark:data-[state=active]:bg-primary-500 dark:data-[state=active]:text-white"
          >
            All Projects
          </TabsTrigger>
          <TabsTrigger 
            value="active" 
            className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-primary-600 data-[state=active]:text-white dark:data-[state=active]:bg-primary-500 dark:data-[state=active]:text-white"
          >
            Active
          </TabsTrigger>
          <TabsTrigger 
            value="upcoming" 
            className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-primary-600 data-[state=active]:text-white dark:data-[state=active]:bg-primary-500 dark:data-[state=active]:text-white"
          >
            Upcoming Deadlines
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:bg-primary-600 data-[state=active]:text-white dark:data-[state=active]:bg-primary-500 dark:data-[state=active]:text-white"
          >
            Completed
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-4">All Projects ({projects.length})</h2>
          <div className="grid grid-cols-1 gap-6">
            {renderProjects(filteredProjects)}
          </div>
        </TabsContent>
        
        <TabsContent value="active" className="mt-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-4">Active Projects ({
            projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length
          })</h2>
          <div className="grid grid-cols-1 gap-6">
            {renderProjects(filteredProjects)}
          </div>
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-4">Upcoming Deadlines</h2>
          <div className="grid grid-cols-1 gap-6">
            {renderProjects(filteredProjects)}
          </div>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-4">Completed Projects ({
            projects.filter(p => p.status === 'completed').length
          })</h2>
          <div className="grid grid-cols-1 gap-6">
            {renderProjects(filteredProjects)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Helper function to render project cards
  function renderProjects(projectsList: any[]) {
    if (projectsList.length === 0) {
      return (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-center text-gray-600 dark:text-gray-400">No projects found</p>
          </CardContent>
        </Card>
      );
    }
    
    return projectsList.map((project) => (
      <Card key={project.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                <Link href={`/designer/projects/${project.type || 'web_design'}/${project.id}`} className="hover:underline text-primary-600 dark:text-primary-400">
                  {project.name || project.title}
                </Link>
              </h3>
              
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {project.description?.substring(0, 150)}
                {project.description?.length > 150 ? '...' : ''}
              </p>
              
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className={getStatusColor(project.status)}>
                  {project.status?.replace('_', ' ')}
                </Badge>
                
                {project.deadline && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    Due {formatDate(project.deadline)}
                  </span>
                )}
                
                <Badge variant="outline" className={getTypeColor(project.type)}>
                  {formatProjectType(project.type) || 'Web Design'}
                </Badge>
                
                {project.client_name && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Client: {project.client_name}
                  </span>
                )}
              </div>
            </div>
            
            <div className="ml-4">
              <Button 
                className="bg-primary-600 hover:bg-primary-700 text-white"
                size="sm" 
                onClick={() => router.push(`/designer/projects/${project.type || 'web_design'}/${project.id}`)}
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  }
} 