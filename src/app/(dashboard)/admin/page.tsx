'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, FileBox, CreditCard, LifeBuoy, Settings, BarChart4 } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalDesigners: number;
  totalProjects: number;
  activeProjects: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching dashboard stats...');
        
        const response = await fetch('/api/admin/dashboard');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Error fetching dashboard stats: ${response.statusText || errorText}`);
        }
        
        const data = await response.json();
        console.log('Dashboard data received:', data);
        setStats(data);
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Admin Navigation Links
  const adminLinks = [
    { 
      href: '/admin/users', 
      label: 'Users', 
      icon: <Users className="h-8 w-8" />,
      description: 'Manage user accounts and permissions'
    },
    { 
      href: '/admin/projects', 
      label: 'Projects', 
      icon: <FileBox className="h-8 w-8" />,
      description: 'Oversee all client projects'
    },
    {
      href: '/admin/designers',
      label: 'Designer Workload',
      icon: <Users className="h-8 w-8" />,
      description: 'Monitor and manage designer capacity'
    },
    { 
      href: '/admin/billing', 
      label: 'Billing', 
      icon: <CreditCard className="h-8 w-8" />,
      description: 'Manage invoices and payments'
    },
    { 
      href: '/admin/support', 
      label: 'Support', 
      icon: <LifeBuoy className="h-8 w-8" />,
      description: 'Handle client support requests'
    },
    { 
      href: '/admin/settings', 
      label: 'Settings', 
      icon: <Settings className="h-8 w-8" />,
      description: 'Configure system settings'
    },
    { 
      href: '/admin/analytics', 
      label: 'Analytics', 
      icon: <BarChart4 className="h-8 w-8" />,
      description: 'View detailed system analytics'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-destructive/10 rounded-lg my-6">
        <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Dashboard</h2>
        <p>{error || "No data available"}</p>
        <p className="mt-4">Please check your permissions or try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 pt-0 space-y-8 max-w-7xl mx-auto">
      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-none shadow-lg transition-all hover:shadow-xl">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">{stats.totalUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-none shadow-lg transition-all hover:shadow-xl">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">{stats.totalDesigners}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Designers</p>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-none shadow-lg transition-all hover:shadow-xl">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4">
            <FileBox className="h-8 w-8 text-white" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">{stats.totalProjects}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-none shadow-lg transition-all hover:shadow-xl">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4">
            <FileBox className="h-8 w-8 text-white" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">{stats.activeProjects}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Active Projects</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Admin Navigation */}
      <div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className="group"
            >
              <Card className="h-full border-none shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] group-hover:bg-muted/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    {link.icon}
                  </div>
                  <CardTitle className="text-xl">{link.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {link.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 