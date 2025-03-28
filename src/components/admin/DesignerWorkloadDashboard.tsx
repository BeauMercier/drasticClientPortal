'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Designer {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  activeProjects: Project[];
  totalActiveProjects: number;
  projectTypes: {
    web_design: number;
    logo_design: number;
    social_graphics: number;
  };
  workloadPercentage: number;
  workloadLevel: 'low' | 'medium' | 'high';
}

interface Project {
  id: string;
  name: string;
  type: string;
  assignedAt: string;
}

export function DesignerWorkloadDashboard() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDesignerWorkloads = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/designers/workload');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch designer workloads');
        }
        
        const data = await response.json();
        setDesigners(data);
      } catch (err) {
        console.error('Error fetching designer workloads:', err);
        setError(err instanceof Error ? err.message : 'Failed to load designer workloads');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDesignerWorkloads();
  }, []);
  
  const getWorkloadColor = (level: string): string => {
    switch (level) {
      case 'low':
        return 'bg-green-600';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };
  
  const getWorkloadTextColor = (level: string): string => {
    switch (level) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-500';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };
  
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const getProjectTypeLabel = (type: string): string => {
    switch (type) {
      case 'web_design':
        return 'Web';
      case 'logo_design':
        return 'Logo';
      case 'social_graphics':
        return 'Social';
      default:
        return type;
    }
  };
  
  const getProjectTypeBadgeClass = (type: string): string => {
    switch (type) {
      case 'web_design':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'logo_design':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'social_graphics':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="p-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-full mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <div className="flex">
          <div className="text-red-700">
            <span className="font-medium">Error: </span>
            {error}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Designer Workload</h2>
        <div className="flex items-center space-x-2">
          <span className="flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            <span className="h-2 w-2 rounded-full bg-green-600 mr-1"></span>
            Available
          </span>
          <span className="flex items-center px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
            <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1"></span>
            Busy
          </span>
          <span className="flex items-center px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            <span className="h-2 w-2 rounded-full bg-red-600 mr-1"></span>
            Overloaded
          </span>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {designers.map(designer => (
          <Card key={designer.id} className="overflow-hidden">
            <CardHeader className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={designer.avatar_url || ''} alt={designer.name} />
                  <AvatarFallback>{getInitials(designer.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{designer.name}</CardTitle>
                  <CardDescription>{designer.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">
                    Workload: 
                    <span className={`ml-1 ${getWorkloadTextColor(designer.workloadLevel)}`}>
                      {designer.workloadPercentage}%
                    </span>
                  </span>
                  <span className="text-sm text-gray-600">
                    {designer.totalActiveProjects} active projects
                  </span>
                </div>
                <Progress 
                  value={designer.workloadPercentage} 
                  className="h-2"
                  indicatorClassName={getWorkloadColor(designer.workloadLevel)}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(designer.projectTypes).map(([type, count]) => 
                    count > 0 && (
                      <Badge 
                        key={type} 
                        variant="outline" 
                        className={getProjectTypeBadgeClass(type)}
                      >
                        {getProjectTypeLabel(type)}: {count}
                      </Badge>
                    )
                  )}
                </div>
                
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {designer.activeProjects.slice(0, 5).map(project => (
                    <div 
                      key={`${project.type}-${project.id}`} 
                      className="text-xs rounded-md bg-slate-50 p-2 flex justify-between items-center"
                    >
                      <span className="truncate max-w-[200px]">{project.name}</span>
                      <Badge 
                        variant="outline" 
                        className={getProjectTypeBadgeClass(project.type)}
                      >
                        {getProjectTypeLabel(project.type)}
                      </Badge>
                    </div>
                  ))}
                  {designer.activeProjects.length > 5 && (
                    <div className="text-xs text-center text-gray-500">
                      +{designer.activeProjects.length - 5} more projects
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {designers.length === 0 && (
          <div className="col-span-full text-center p-8 bg-gray-50 rounded-md">
            <h3 className="text-lg font-medium text-gray-900">No designers found</h3>
            <p className="text-gray-500">There are no designers with assigned projects in the system.</p>
          </div>
        )}
      </div>
    </div>
  );
} 