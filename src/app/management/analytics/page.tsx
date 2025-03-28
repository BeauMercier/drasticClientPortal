'use client';

import React from 'react';
import { Card } from '../../../shared/ui/molecules';
import { Button } from '../../../shared/ui/atoms';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const handleExportReport = () => {
    // Implement export report functionality
    console.log('Exporting analytics report');
  };

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <Button
          variant="primary"
          onClick={handleExportReport}
          className="bg-blue-600 dark:bg-red-600 hover:bg-blue-700 dark:hover:bg-red-700"
        >
          Export Report
        </Button>
      </div>

      {/* Time Period Selector */}
      <div className="flex space-x-2 mb-6">
        <Button variant="secondary" className="bg-blue-600 dark:bg-red-600 text-white">Last 30 Days</Button>
        <Button variant="secondary" className="dark:text-gray-300 dark:hover:bg-gray-900">Last Quarter</Button>
        <Button variant="secondary" className="dark:text-gray-300 dark:hover:bg-gray-900">Year to Date</Button>
        <Button variant="secondary" className="dark:text-gray-300 dark:hover:bg-gray-900">Custom</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white dark:bg-black shadow-xl border border-gray-200 dark:border-gray-900">
          <h2 className="text-gray-600 dark:text-gray-300 font-medium mb-2">Total Users</h2>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">24,521</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">+12% vs. previous period</div>
        </Card>

        <Card className="bg-white dark:bg-black shadow-xl border border-gray-200 dark:border-gray-900">
          <h2 className="text-gray-600 dark:text-gray-300 font-medium mb-2">Page Views</h2>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">98,742</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">+18% vs. previous period</div>
        </Card>

        <Card className="bg-white dark:bg-black shadow-xl border border-gray-200 dark:border-gray-900">
          <h2 className="text-gray-600 dark:text-gray-300 font-medium mb-2">Avg. Session</h2>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">3:24</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">+0:15 vs. previous period</div>
        </Card>

        <Card className="bg-white dark:bg-black shadow-xl border border-gray-200 dark:border-gray-900">
          <h2 className="text-gray-600 dark:text-gray-300 font-medium mb-2">Bounce Rate</h2>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">31.4%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">-2.1% vs. previous period</div>
        </Card>
      </div>

      {/* Traffic Chart Placeholder */}
      <Card title="Traffic Overview" className="bg-white dark:bg-black shadow-xl border border-gray-200 dark:border-gray-900 mb-8">
        <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-900 rounded-md">
          <div className="text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Traffic chart will appear here
            </p>
          </div>
        </div>
      </Card>

      {/* Top Pages */}
      <Card title="Top Pages" className="bg-white dark:bg-black shadow-xl border border-gray-200 dark:border-gray-900 mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-900">
            <thead className="bg-gray-50 dark:bg-black">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Page
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Views
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Avg. Time
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Bounce Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-900">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  /home
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                  24,152
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                  2:18
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                  28%
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  /services
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                  12,845
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                  3:42
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                  24%
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  /about
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                  9,632
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                  2:51
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                  35%
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  /contact
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                  7,823
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                  1:42
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                  15%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
} 