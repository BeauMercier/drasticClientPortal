'use client';

import React from 'react';
import { Card } from '../../shared/ui/molecules';
import FileList from '@/components/FileList';
import { FileProvider } from '@/shared/contexts/FileContext';

export default function FilesPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">My Files</h1>
      <Card className="bg-white p-0 shadow-md overflow-hidden">
        <FileProvider>
          <FileList />
        </FileProvider>
      </Card>
    </div>
  );
} 