'use client';

import { Suspense } from 'react';
import { DesignerWorkloadDashboard } from '@/components/admin/DesignerWorkloadDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function DesignerWorkloadPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-0">
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Designer Workload Dashboard</CardTitle>
          <CardDescription>
            Monitor designer capacity and active project assignments across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            This dashboard shows the current workload for each designer based on their assigned projects.
            Designers are categorized as available (green), busy (yellow), or overloaded (red) based on their
            current project load.
          </p>
          
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <DesignerWorkloadDashboard />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
} 