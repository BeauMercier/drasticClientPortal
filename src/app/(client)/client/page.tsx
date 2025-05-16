'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
// TODO: Import actual client data fetching functions (e.g., getClientProfile, getClientProjects)
// import { getClientProfile, getClientProjects } from '@/lib/api/client-api'; 
// TODO: Import specific types for client data
// import { Project } from '@/lib/types/project'; 

export default function ClientDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // TODO: Define state for actual client data (e.g., projects, profile)
  const [clientProjects, setClientProjects] = useState<any[]>([]); // Using any[] as placeholder

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // --- Placeholder for fetching user profile and checking role ---
        // const userProfile = await getClientProfile(); 
        // const isUserClient = userProfile?.role?.toLowerCase() === 'client';
        // if (!isUserClient) {
        //   console.warn('Non-client attempted to access client dashboard');
        //   router.replace('/login'); // Or appropriate redirect
        //   return;
        // }
        console.log("Simulating client role check and data fetch..."); // Placeholder logic

        // --- Placeholder for fetching client-specific data ---
        // const projects = await getClientProjects();
        // setClientProjects(projects || []);
        console.log("Simulating fetch for client projects..."); // Placeholder logic
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        setClientProjects([{ id: 'proj1', name: 'Sample Client Project 1' }, { id: 'proj2', name: 'Sample Client Project 2' }]); // Placeholder data

      } catch (err) {
        console.error('Error loading client dashboard:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"> {/* Adjust height as needed */}
        <ArrowPathIcon className="h-8 w-8 text-gray-500 animate-spin" />
        <span className="ml-2">Loading Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-red-50 border-red-200">
           <CardContent className="p-6">
             <p className="text-red-700">{error}</p>
           </CardContent>
         </Card>
      </div>
    );
  }

  // --- Main Dashboard Content ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Client Dashboard</h1>

      {/* Placeholder for Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
         <Card>
           <CardHeader><CardTitle>My Projects</CardTitle></CardHeader>
           <CardContent>
             <p className="text-3xl font-bold">{clientProjects.length}</p>
             <p className="text-sm text-gray-500">Active projects</p>
           </CardContent>
         </Card>
         {/* Add more relevant client stats cards here */}
         <Card>
           <CardHeader><CardTitle>Account Status</CardTitle></CardHeader>
           <CardContent>
             <p className="text-green-600 font-semibold">Active</p> 
             <Button size="sm" variant="outline" className="mt-2" onClick={() => router.push('/client/billing')}>View Billing</Button>
           </CardContent>
         </Card>
         <Card>
           <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
           <CardContent className="flex flex-col space-y-2">
             <Button size="sm" variant="link" className="justify-start p-0 h-auto" onClick={() => router.push('/client/my-profile')}>My Profile</Button>
             {/* Add more relevant links */}
           </CardContent>
         </Card>
      </div>

      {/* Placeholder for Project List */}
      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {clientProjects.length > 0 ? (
            <ul className="space-y-3">
              {clientProjects.map((project) => (
                <li key={project.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  {/* TODO: Link to actual project page e.g., /client/projects/{project.id} */}
                  <span className="font-medium text-blue-600 hover:underline cursor-pointer">{project.name}</span>
                  {/* Add more project details */}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">You have no active projects.</p>
          )}
        </CardContent>
      </Card>

      {/* Add other sections as needed for the client dashboard */}

    </div>
  );
} 