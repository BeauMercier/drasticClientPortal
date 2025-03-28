'use client';

import React from 'react';
import { Card } from '../../../shared/ui/molecules';
import { Button } from '../../../shared/ui/atoms';
import { 
  ArrowUpIcon, 
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function GoogleAdsPage() {
  const handleCreateCampaign = () => {
    // Implement create campaign functionality
    console.log('Create new campaign');
  };

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <Button
          variant="primary"
          onClick={handleCreateCampaign}
          className="bg-blue-600 dark:bg-red-600 hover:bg-blue-700 dark:hover:bg-red-700"
        >
          Create New Campaign
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Clicks */}
        <Card className="bg-white dark:bg-black shadow-xl border border-gray-200 dark:border-gray-900">
          <h2 className="text-gray-600 dark:text-gray-300 font-medium mb-2">Clicks (Last 30 Days)</h2>
          <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">4,287</div>
          <div className="flex items-center text-green-600 dark:text-green-500">
            <ArrowUpIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">8% from previous period</span>
          </div>
        </Card>

        {/* CTR */}
        <Card className="bg-white dark:bg-black shadow-xl border border-gray-200 dark:border-gray-900">
          <h2 className="text-gray-600 dark:text-gray-300 font-medium mb-2">Click-Through Rate</h2>
          <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">3.2%</div>
          <div className="flex items-center text-green-600 dark:text-green-500">
            <ArrowUpIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">0.4% from previous period</span>
          </div>
        </Card>

        {/* Cost */}
        <Card className="bg-white dark:bg-black shadow-xl border border-gray-200 dark:border-gray-900">
          <h2 className="text-gray-600 dark:text-gray-300 font-medium mb-2">Cost</h2>
          <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">$1,250</div>
          <div className="flex items-center text-red-600">
            <ArrowUpIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">$125 from previous period</span>
          </div>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card title="Active Campaigns" className="bg-white dark:bg-black shadow-xl border border-gray-200 dark:border-gray-900 mb-8">
        <div className="divide-y divide-gray-200 dark:divide-gray-900">
          <div className="py-4">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Spring Promotion</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Targeting new customers in California</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">$450</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Budget/mo</div>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Active
              </span>
              <div className="text-sm text-gray-500 dark:text-gray-400">CTR: 4.2%</div>
            </div>
          </div>
          <div className="py-4">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Product Launch</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Nationwide campaign for new product line</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">$750</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Budget/mo</div>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Active
              </span>
              <div className="text-sm text-gray-500 dark:text-gray-400">CTR: 3.8%</div>
            </div>
          </div>
          <div className="py-4">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Brand Awareness</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Display network targeting industry professionals</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">$325</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Budget/mo</div>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                Optimizing
              </span>
              <div className="text-sm text-gray-500 dark:text-gray-400">CTR: 2.1%</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Performance Chart Placeholder */}
      <Card title="Campaign Performance" className="bg-white dark:bg-black shadow-xl border border-gray-200 dark:border-gray-900">
        <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-900 rounded-md">
          <div className="text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Campaign performance charts will appear here
            </p>
          </div>
        </div>
      </Card>
    </main>
  );
} 