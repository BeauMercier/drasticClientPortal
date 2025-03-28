'use client';

import { PropsWithChildren } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/shared/ui/layout/Header';

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="px-6 pt-0">{children}</main>
        </div>
      </div>
    </div>
  );
} 