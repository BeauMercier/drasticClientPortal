import React from 'react';
import { FileType } from '../types';

interface RecentFilesProps {
  files: FileType[];
}

export const RecentFiles: React.FC<RecentFilesProps> = ({ files }) => {
  if (files.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No recent files found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Type
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Size
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Modified
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map((file) => (
            <tr key={file.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {file.is_folder ? (
                    <svg
                      className="flex-shrink-0 h-5 w-5 text-yellow-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z"
                        clipRule="evenodd"
                      />
                      <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
                    </svg>
                  ) : (
                    <svg
                      className="flex-shrink-0 h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{file.name}</div>
                    <div className="text-sm text-gray-500">{file.path}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {file.is_folder ? 'Folder' : getFileTypeLabel(file.type)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {file.is_folder ? '--' : formatFileSize(file.size)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(file.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileTypeLabel = (mimeType?: string): string => {
  if (!mimeType) return 'Unknown';
  
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word')) return 'Word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PowerPoint';
  
  return mimeType.split('/')[1] || 'File';
}; 