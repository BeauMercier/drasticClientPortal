'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  UserPlusIcon, 
  DocumentTextIcon, 
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline';

interface StatsCard {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
  changeType: 'increase' | 'decrease';
}

interface Activity {
  id: string;
  type: string;
  title: string;
  date: string;
  status: 'completed' | 'in-progress' | 'pending';
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulated data - in a real app this would come from an API
  const statsCards: StatsCard[] = [
    {
      title: 'Total Sales',
      value: '$12,426',
      icon: <ChartBarIcon className="h-6 w-6" />,
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'New Leads',
      value: '32',
      icon: <UserPlusIcon className="h-6 w-6" />,
      change: '+5%',
      changeType: 'increase'
    },
    {
      title: 'Projects',
      value: '12',
      icon: <DocumentTextIcon className="h-6 w-6" />,
      change: '0%',
      changeType: 'increase'
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      icon: <ArrowTrendingUpIcon className="h-6 w-6" />,
      change: '-1%',
      changeType: 'decrease'
    }
  ];

  const recentActivity: Activity[] = [
    {
      id: '1',
      type: 'invoice',
      title: 'Monthly hosting payment',
      date: '2 days ago',
      status: 'completed'
    },
    {
      id: '2',
      type: 'project',
      title: 'Website redesign project',
      date: '1 week ago',
      status: 'in-progress'
    },
    {
      id: '3',
      type: 'support',
      title: 'Support ticket #1234',
      date: '3 days ago',
      status: 'pending'
    }
  ];

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome back, {session?.user?.name || 'User'}!
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-500">{card.title}</div>
              <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                {card.icon}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{card.value}</div>
              <div className={`text-sm mt-1 flex items-center ${
                card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {card.changeType === 'increase' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{card.change} from last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/files" className="border border-gray-200 rounded-lg p-4 flex items-center hover:bg-gray-50 transition-colors">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="font-medium">Project Files</div>
              <div className="text-sm text-gray-500">Access and manage your files</div>
            </div>
          </Link>
          <a href="https://wordpress.com/admin" target="_blank" rel="noopener noreferrer" className="border border-gray-200 rounded-lg p-4 flex items-center hover:bg-gray-50 transition-colors">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <div className="font-medium">WordPress Admin</div>
              <div className="text-sm text-gray-500">Manage your website</div>
            </div>
          </a>
          <Link href="/support" className="border border-gray-200 rounded-lg p-4 flex items-center hover:bg-gray-50 transition-colors">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="font-medium">Support</div>
              <div className="text-sm text-gray-500">Get help with your project</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.map(activity => (
            <div key={activity.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4">
                  {activity.type === 'invoice' && (
                    <div className="p-2 bg-green-100 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  )}
                  {activity.type === 'project' && (
                    <div className="p-2 bg-blue-100 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                  )}
                  {activity.type === 'support' && (
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium">{activity.title}</div>
                  <div className="text-sm text-gray-500">{activity.date}</div>
                </div>
              </div>
              <div>
                {activity.status === 'completed' && (
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>
                )}
                {activity.status === 'in-progress' && (
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">In Progress</span>
                )}
                {activity.status === 'pending' && (
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 