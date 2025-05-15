'use client';

import React, { PropsWithChildren } from 'react';
import Header from '@/shared/ui/layout/Header';
// import RoleSidebar from '@/components/RoleSidebar'; // Remove RoleSidebar import
import ClientSidebar from '@/components/client/ClientSidebar'; // Import ClientSidebar
import { useUI } from '@/shared/contexts/UIContext';

// This layout applies only to routes within the (client) group
export default function ClientLayout({ children }: PropsWithChildren) {
  const { sidebarExpanded } = useUI();
  
  return (
    <div className="min-h-screen h-full bg-black"> 
      <div className="flex h-full"> 
        {/* <RoleSidebar /> */}
        <ClientSidebar /> {/* Use ClientSidebar */}
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-16'}`}> 
          <Header />
          <main className="relative flex-grow p-6 overflow-y-auto bg-gray-100 dark:bg-gray-900">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 