'use client';

import React from 'react';
import { Card } from '../../../shared/ui/molecules';
import { Button } from '../../../shared/ui/atoms';
import { 
  ArrowUpIcon, 
  ArrowDownIcon
} from '@heroicons/react/24/outline';

export default function WebsiteManagementPage() {
  const handleRequestUpdate = () => {
    // Implement update request functionality
    console.log('Website update requested');
  };

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <Button
          variant="primary"
          onClick={handleRequestUpdate}
          className="bg-red-600 hover:bg-red-700"
        >
          Request Website Update
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Monthly Visitors */}
        <Card className="bg-black shadow-xl border border-gray-900">
          <h2 className="text-gray-300 font-medium mb-2">Monthly Visitors</h2>
          <div className="text-4xl font-bold mb-2 text-white">15,872</div>
          <div className="flex items-center text-green-500">
            <ArrowUpIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">12% from last month</span>
          </div>
        </Card>

        {/* Avg. Time on Site */}
        <Card className="bg-black shadow-xl border border-gray-900">
          <h2 className="text-gray-300 font-medium mb-2">Avg. Time on Site</h2>
          <div className="text-4xl font-bold mb-2 text-white">3:42</div>
          <div className="flex items-center text-green-500">
            <ArrowUpIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">0:18 from last month</span>
          </div>
        </Card>

        {/* Bounce Rate */}
        <Card className="bg-black shadow-xl border border-gray-900">
          <h2 className="text-gray-300 font-medium mb-2">Bounce Rate</h2>
          <div className="text-4xl font-bold mb-2 text-white">32%</div>
          <div className="flex items-center text-green-500">
            <ArrowDownIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">5% from last month</span>
          </div>
        </Card>
      </div>

      {/* Recent Website Updates */}
      <Card title="Recent Website Updates" className="bg-black shadow-xl border border-gray-900">
        <div className="divide-y divide-gray-900">
          <div className="py-4">
            <h3 className="font-medium text-white">Homepage Redesign</h3>
            <p className="text-sm text-gray-400 mt-1">Updated hero section with new images and messaging</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">Completed on Mar 15, 2025</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-100">
                Completed
              </span>
            </div>
          </div>
          <div className="py-4">
            <h3 className="font-medium text-white">Services Page Content Update</h3>
            <p className="text-sm text-gray-400 mt-1">Added new service offerings and updated pricing</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">Completed on Feb 28, 2025</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-100">
                Completed
              </span>
            </div>
          </div>
          <div className="py-4">
            <h3 className="font-medium text-white">Blog Integration</h3>
            <p className="text-sm text-gray-400 mt-1">Added blog functionality with initial articles</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">Completed on Jan 20, 2025</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-100">
                Completed
              </span>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
} 