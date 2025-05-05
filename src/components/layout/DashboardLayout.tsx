'use client';

import { PropsWithChildren } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/shared/ui/layout/Header';
import { useUI } from '@/shared/contexts/UIContext';

export default function DashboardLayout({ children }: PropsWithChildren) {
  const { sidebarExpanded } = useUI();
  
  return (
    <div className="min-h-screen h-full bg-black">
      <div className="flex h-full">
        <Sidebar />
        <div className={`flex-1 flex flex-col min-h-screen ${sidebarExpanded ? 'ml-64' : 'ml-16'}`}>
          <Header />
          <main className="flex-grow px-6 pt-0 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
} 