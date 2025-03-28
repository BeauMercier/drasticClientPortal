'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { Card } from '../../shared/ui/molecules';
import { Button } from '../../shared/ui/atoms';
import { ChartBarIcon, DocumentTextIcon, CurrencyDollarIcon, FolderIcon } from '@heroicons/react/24/outline';
import supabase from '@/lib/api/client';

// Project components and hooks
import { ProjectList } from '../../features/projects/components/ProjectList';
import { useProjects } from '../../features/projects/hooks/useProjects';

// Billing components and hooks
import { InvoiceList } from '../../features/billing/components/InvoiceList';
import { useBilling } from '../../features/billing/hooks/useBilling';

// Files components and hooks
import { RecentFiles } from '../../features/files/components/RecentFiles';
import { useFileStorage } from '../../features/files/hooks/useFileStorage';

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { invoices, isLoading: invoicesLoading } = useBilling();
  const { files, isLoading: filesLoading } = useFileStorage();
  const [isAdmin, setIsAdmin] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Add check for admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        console.log('Checking authentication status...');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
          setIsAdmin(profile?.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
      }
    };
    
    checkAdminRole();
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Don't render the dashboard content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Stats cards
  const statsCards = [
    {
      title: 'Projects',
      value: projects?.length || 0,
      icon: <DocumentTextIcon className="h-6 w-6" />,
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
    },
    {
      title: 'Invoices',
      value: invoices?.length || 0,
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
    },
    {
      title: 'Files',
      value: files?.length || 0,
      icon: <FolderIcon className="h-6 w-6" />,
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
    },
    {
      title: 'Analytics',
      value: '18',
      icon: <ChartBarIcon className="h-6 w-6" />,
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
    }
  ];

  return (
    <main className="p-6 bg-white dark:bg-black">
      {/* Admin Panel Access (only visible to admins) */}
      {isAdmin && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Admin Access</h3>
              <p className="text-sm text-red-600 dark:text-red-300">
                You have administrator privileges. Access the admin panel to manage users, projects, and more.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push('/admin')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Admin Panel
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
          <div key={index} className="bg-white dark:bg-black rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{card.title}</h3>
              <div className={`${card.bgColor} p-2 rounded-full ${card.textColor}`}>
                {card.icon}
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Section */}
        <Card title="Recent Projects" className="lg:col-span-2 bg-white dark:bg-black shadow-xl">
          {projectsLoading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <ProjectList projects={projects || []} />
          )}
          <div className="mt-4 text-right">
            <Button
              variant="primary"
              onClick={() => router.push('/projects')}
            >
              View All Projects
            </Button>
          </div>
        </Card>

        {/* Billing Section */}
        <Card title="Recent Invoices" className="bg-white dark:bg-black shadow-xl">
          {invoicesLoading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <InvoiceList invoices={invoices || []} />
          )}
          <div className="mt-4 text-right">
            <Button
              variant="primary"
              onClick={() => router.push('/billing')}
            >
              View All Invoices
            </Button>
          </div>
        </Card>

        {/* Files Section */}
        <Card title="Recent Files" className="lg:col-span-3 bg-white dark:bg-black shadow-xl">
          {filesLoading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <RecentFiles files={files || []} />
          )}
          <div className="mt-4 text-right">
            <Button
              variant="primary"
              onClick={() => router.push('/files')}
            >
              View All Files
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
} 