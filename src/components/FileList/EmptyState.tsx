'use client';

import React from 'react';
import { FolderOpenIcon } from 'lucide-react';
import Uploader from './Uploader'; // Assuming Uploader is in the same directory
import { Scope } from '@/shared/contexts/FileContext'; // Import Scope type

interface EmptyStateProps {
  activeScope: Scope;
}

const EmptyState: React.FC<EmptyStateProps> = ({ activeScope }) => {
  // Determine the text based on the active scope
  let scopeText = '';
  switch (activeScope) {
    case 'photos':
      scopeText = 'photo';
      break;
    case 'documents':
      scopeText = 'document';
      break;
    default:
      scopeText = ''; // For 'all' scope, or any other
      break;
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
      <FolderOpenIcon size={64} className="mb-4 text-gray-400 dark:text-gray-500" />
      <h3 className="text-xl font-semibold mb-2">
        {scopeText ? `No ${scopeText} files yet.` : 'This space is empty.'}
      </h3>
      <p className="mb-6">
        {scopeText 
          ? `Upload some ${scopeText}s, or switch to a different view.` 
          : 'Upload files to get started, or switch to a different view.'
        }
      </p>
      <Uploader variant="default" size="lg" buttonText="Upload Files" showIcon={true} />
    </div>
  );
};

export default EmptyState; 