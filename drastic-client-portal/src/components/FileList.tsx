'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import {
  FolderIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

type FileType = {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
  webViewLink: string;
  isFolder: boolean;
  iconLink?: string;
  thumbnailLink?: string;
};

export default function FileList() {
  const { data: session } = useSession();
  const [files, setFiles] = useState<FileType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Array<{id: string, name: string}>>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    disabled: uploading,
  });

  useEffect(() => {
    loadFiles();
  }, [currentFolder]);

  async function loadFiles() {
    setIsLoading(true);
    setError(null);

    try {
      // Build URL with optional folder parameter
      const url = currentFolder
        ? `/api/files?folderId=${currentFolder}`
        : '/api/files';

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load files');
      }

      if (data.success) {
        setFiles(data.files);
      } else {
        throw new Error(data.error || 'Failed to load files');
      }
    } catch (err: any) {
      console.error('Error loading files:', err);
      setError(err.message || 'An error occurred while loading files');
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileDrop(acceptedFiles: File[]) {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Add folder ID if available
      if (currentFolder) {
        formData.append('folderId', currentFolder);
      }
      
      // Upload the file
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload file');
      }
      
      // Refresh the file list
      loadFiles();
      
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.message || 'An error occurred while uploading the file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function getFileIcon(file: FileType) {
    if (file.isFolder) {
      return <FolderIcon className="h-10 w-10 text-yellow-500" />;
    }
    
    const mimeType = file.mimeType.toLowerCase();
    
    if (mimeType.includes('image')) {
      return file.thumbnailLink ? (
        <img src={file.thumbnailLink} alt={file.name} className="h-10 w-10 object-cover rounded" />
      ) : (
        <PhotoIcon className="h-10 w-10 text-green-500" />
      );
    }
    
    if (mimeType.includes('video')) {
      return <FilmIcon className="h-10 w-10 text-purple-500" />;
    }
    
    if (mimeType.includes('audio')) {
      return <MusicalNoteIcon className="h-10 w-10 text-pink-500" />;
    }
    
    return <DocumentIcon className="h-10 w-10 text-blue-500" />;
  }

  function handleFileClick(file: FileType) {
    if (file.isFolder) {
      // Navigate to folder
      setCurrentFolder(file.id);
      setFolderPath([...folderPath, { id: file.id, name: file.name }]);
    } else {
      // Open file in new window
      window.open(file.webViewLink, '_blank');
    }
  }

  function handleNavigateToFolder(index: number) {
    if (index === -1) {
      // Navigate to root
      setCurrentFolder(null);
      setFolderPath([]);
    } else {
      // Navigate to specific folder in path
      const folder = folderPath[index];
      setCurrentFolder(folder.id);
      setFolderPath(folderPath.slice(0, index + 1));
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">My Files</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => loadFiles()}
              className="p-2 rounded-full hover:bg-gray-100"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Folder navigation breadcrumbs */}
        <div className="flex items-center text-sm mt-4 overflow-x-auto">
          <button
            onClick={() => handleNavigateToFolder(-1)}
            className="px-2 py-1 rounded hover:bg-gray-100 text-blue-600"
          >
            Home
          </button>
          
          {folderPath.map((folder, index) => (
            <div key={folder.id} className="flex items-center">
              <span className="mx-1 text-gray-500">/</span>
              <button
                onClick={() => handleNavigateToFolder(index)}
                className="px-2 py-1 rounded hover:bg-gray-100 text-blue-600 truncate max-w-xs"
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* File upload area */}
      <div
        {...getRootProps()}
        className={`p-6 border-b border-gray-200 border-dashed rounded-md cursor-pointer transition-colors ${
          isDragActive ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center py-4">
          <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium">
            {isDragActive
              ? 'Drop the file here'
              : 'Drag & drop a file here, or click to select a file'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Upload files to your Google Drive folder
          </p>
        </div>
        
        {uploading && (
          <div className="mt-4">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}
      </div>

      {/* File list */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => loadFiles()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No files found in this folder</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleFileClick(file)}
              >
                <div className="p-4 flex flex-col items-center">
                  {getFileIcon(file)}
                  <h3 className="font-medium text-gray-900 mt-2 text-center truncate w-full">
                    {file.name}
                  </h3>
                </div>
                <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>{file.size}</span>
                    <span>{file.modifiedTime}</span>
                  </div>
                  {!file.isFolder && (
                    <div className="mt-2 flex justify-center">
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                        <span>Download</span>
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 