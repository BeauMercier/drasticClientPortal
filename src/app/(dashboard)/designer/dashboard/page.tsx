'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowPathIcon, ClockIcon, FolderIcon } from '@heroicons/react/24/outline';
import { getUserProfile, getDesignerAssignedProjects, getDesignerTasks } from '@/lib/api/client-api';
import { Project } from '@/lib/types/project';
import { DesignerTask } from '@/lib/types/task';
import Link from 'next/link';

// Simple error boundary component
interface ErrorFallbackProps {
  message?: string;
  children: React.ReactNode;
}

const ErrorFallback = ({ message, children }: ErrorFallbackProps) => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Caught error:', error);
      setHasError(true);
      setErrorMessage(message || 'Something went wrong');
    };

    // Set up event listener for errors
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [message]);

  if (hasError) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-6">
          <p className="text-amber-800">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return children;
};

export default function DesignerDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<DesignerTask[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    upcomingDeadlines: 0,
    completedTasks: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user profile
        const userProfile = await getUserProfile();
        
        // Strict role check - must be designer, no exceptions
        const isUserDesigner = userProfile?.role?.toLowerCase().includes('design');
        if (!isUserDesigner) {
          console.warn('Non-designer attempted to access designer dashboard');
          // Use replace instead of push for security - removes from history
          router.replace('/dashboard');
          return;
        }

        // Try to fetch designer's assigned projects
        try {
          const assignedProjects = await getDesignerAssignedProjects();
          setProjects(assignedProjects || []);
          
          // Calculate project stats
          const activeProjs = assignedProjects.filter(p => 
            p.status !== 'completed' && p.status !== 'cancelled'
          );

          const upcomingDeadlines = assignedProjects.filter(p => {
            if (!p.deadline) return false;
            const deadline = new Date(p.deadline);
            const now = new Date();
            const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 3600 * 24));
            return diffDays <= 7 && diffDays >= 0;
          });
          
          setStats(prevStats => ({
            ...prevStats,
            totalProjects: assignedProjects.length,
            activeProjects: activeProjs.length,
            upcomingDeadlines: upcomingDeadlines.length,
          }));
          
        } catch (projectError) {
          console.error('Error loading projects:', projectError);
          setProjects([]);
        }

        // Try to fetch designer's tasks
        try {
          const designerTasks = await getDesignerTasks(userProfile.id);
          setTasks(designerTasks || []);
          
          // Update task stats
          const completedTasksCount = designerTasks.filter(t => t.status === 'completed').length;
          const pendingTasksCount = designerTasks.filter(t => t.status !== 'completed').length;
          
          setStats(prevStats => ({
            ...prevStats,
            completedTasks: completedTasksCount,
            pendingTasks: pendingTasksCount
          }));
          
        } catch (taskError) {
          console.error('Error loading tasks:', taskError);
          setTasks([]);
        }

      } catch (err) {
        console.error('Error loading designer dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  // Get badge color based on priority
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="h-8 w-8 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (error) {
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
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Designer Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Active Projects</span>
              <span className="text-3xl font-bold mt-2">{stats.activeProjects}</span>
              <span className="text-sm text-gray-500 mt-1">out of {stats.totalProjects} total</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Upcoming Deadlines</span>
              <span className="text-3xl font-bold mt-2">{stats.upcomingDeadlines}</span>
              <span className="text-sm text-gray-500 mt-1">in the next 7 days</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Pending Tasks</span>
              <span className="text-3xl font-bold mt-2">{stats.pendingTasks}</span>
              <span className="text-sm text-gray-500 mt-1">awaiting completion</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Completed Tasks</span>
              <span className="text-3xl font-bold mt-2">{stats.completedTasks}</span>
              <span className="text-sm text-gray-500 mt-1">finished</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Projects Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>Your ongoing project assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled')
                    .slice(0, 5)
                    .map((project) => (
                      <div key={project.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              <Link href={`/designer/projects/web_design/${project.id}`} className="hover:underline">
                                {project.name}
                              </Link>
                            </h3>
                            <p className="text-sm text-gray-500">
                              {project.description?.substring(0, 100)}
                              {project.description && project.description.length > 100 ? '...' : ''}
                            </p>
                            <div className="mt-2 flex items-center space-x-2">
                              <Badge className={getStatusColor(project.status || 'pending')}>
                                {project.status || 'Pending'}
                              </Badge>
                              <span className="text-xs text-gray-500 flex items-center">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                Updated {project.updated_at ? formatDate(project.updated_at) : 'recently'}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            Web Design
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No active projects assigned
                </p>
              )}
              {projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length > 5 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={() => router.push('/designer/projects')}>
                    View All Projects
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Your latest assigned tasks</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <div className="flex items-center mt-1">
                            <Badge className={getPriorityColor(task.priority)} variant="secondary">
                              {task.priority}
                            </Badge>
                            <span className="ml-2 text-xs text-gray-500">
                              {task.due_date ? formatDate(task.due_date) : 'No deadline'}
                            </span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No tasks assigned
                </p>
              )}
              {tasks.length > 5 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={() => router.push('/designer/tasks')}>
                    View All Tasks
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 