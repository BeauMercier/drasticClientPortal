'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout'; // Path to the actual layout component

// This layout applies only to routes within the (dashboard) group
export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 