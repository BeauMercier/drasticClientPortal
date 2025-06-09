'use client';

import React from 'react';
import AdminSidebar from "@/components/admin/AdminSidebar";
import Header from '@/shared/ui/layout/Header';
import { useUI } from '@/shared/contexts/UIContext';
import ReactQueryProvider from '@/providers/ReactQueryProvider';
import { ToastProvider } from "@/components/ui/use-toast";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { sidebarExpanded } = useUI();
    
    return (
        <ReactQueryProvider>
            <ToastProvider>
                <div className="min-h-screen h-full bg-gray-100 dark:bg-black">
                    <div className="flex h-full">
                        <AdminSidebar />
                        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-16'}`}>
                            <Header />
                            <main className="flex-grow p-6 overflow-y-auto bg-gray-100 dark:bg-gray-900">
                                {children}
                            </main>
                        </div>
                    </div>
                </div>
            </ToastProvider>
        </ReactQueryProvider>
    );
} 