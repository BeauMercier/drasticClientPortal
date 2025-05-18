'use client';

import React, { useEffect, useCallback, memo, useState } from 'react';
import { FileObject, useFiles } from '@/shared/contexts/FileContext';

export interface FileListProps {
  initialFolder?: string;
  showFilters?: boolean;
  maxHeight?: string;
  onFileSelect?: (file: FileObject) => void;
  allowUpload?: boolean;
  allowDelete?: boolean;
  className?: string;
}

const FileList: React.FC<FileListProps> = ({
  initialFolder = '',
  showFilters = true,
  maxHeight,
  onFileSelect,
  allowUpload = true,
  allowDelete = true,
  className,
}) => {
  const { 
    files, 
    isLoading, 
    error, 
    uploadProgress,
    loadFiles, 
    uploadFile, 
    createFolder, 
    deleteFile, 
    selectFile,
    navigateToFolder,
    folderPath,
  } = useFiles();

  // We need to handle these state changes in the component since they're not in the context
  const [localFolderPath, setLocalFolderPath] = useState(initialFolder);
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  // Change in state management to add file type filtering
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('gallery');
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [previewFile, setPreviewFile] = useState<FileObject | null>(null);

  // Check if file is an image
  const isImage = useCallback((file: FileObject): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const ext = file.extension?.toLowerCase() || '';
    return imageExtensions.includes(ext);
  }, []);

  // Load initial files only once on mount or when initialFolder changes
  useEffect(() => {
    let isMounted = true;
    
    console.log('[FileList useEffect] Running initial load effect. initialFolder:', initialFolder);

    const loadInitialFiles = async () => {
      // We might still need localFolderPath if we allow navigation *within* FileList itself
      // Let's simplify the condition for now to load whenever initialFolder is set
      // or if the component mounts and hasn't loaded yet.
      setIsLocalLoading(true);
      try {
        await loadFiles(initialFolder);
        if (isMounted) {
          setLocalFolderPath(initialFolder); // Sync local state if needed
          // selectFile(null); // Avoid calling selectFile here if it causes issues
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading initial files:', error);
        }
      } finally {
        if (isMounted) {
          setIsLocalLoading(false);
        }
      }
    };
    
    loadInitialFiles();
    
    return () => {
      isMounted = false;
    };
  // *** DEPENDENCIES CHANGED: Only depend on initialFolder and the stable loadFiles reference ***
  }, [initialFolder, loadFiles]); // Removed localFolderPath, files.length, selectFile

  // Load preview URLs for images when files change
  useEffect(() => {
    const loadPreviewUrls = async () => {
      const imageFiles = files.filter(file => isImage(file));
      const urlsToFetch = imageFiles.filter(file => !previewUrls[file.id]);
      
      if (urlsToFetch.length === 0) return;
      
      // Start with a copy IF we are going to modify it
      let newUrls: Record<string, string> | null = null; 
      let addedNewUrl = false; // Flag to track if we actually added anything
      
      for (const file of urlsToFetch) {
        try {
          const response = await fetch(`/api/files/url?path=${encodeURIComponent(file.fullPath)}`);
          if (!response.ok) {
            console.error(`Failed to fetch preview URL for ${file.name}: ${response.statusText}`);
            continue;
          }
          const responseData = await response.json(); // Expect { url: "..." }
          if (responseData?.url) { // Check responseData.url directly
            // Initialize newUrls only when we have the first URL to add
            if (!newUrls) {
              newUrls = { ...previewUrls }; // Create copy only when needed
            }
            newUrls[file.id] = responseData.url; // Assign the signed URL
            addedNewUrl = true; // Mark that we added a URL
          }
        } catch (error) {
          console.error(`Failed to get preview URL for ${file.name}:`, error);
        }
      }
      
      // Only update state if we actually added a new URL
      if (addedNewUrl && newUrls) {
        console.log('[FileList loadPreviewUrls] Updating previewUrls state.');
        setPreviewUrls(newUrls);
      } else {
        console.log('[FileList loadPreviewUrls] No new preview URLs fetched or added, skipping state update.');
      }
    };
    
    loadPreviewUrls();
  // *** DEPENDENCIES CHANGED: Ensure isImage is stable (it uses useCallback) ***
  }, [files, previewUrls, isImage]); // Keep files dependency, ensure isImage is stable

  // Handle file selection
  const handleFileSelect = useCallback((file: FileObject) => {
    if (file.isFolder) {
      // Navigate into folder
      navigateToFolder(file.fullPath);
    } else {
      // Select file
      selectFile(file);
      if (onFileSelect) {
        onFileSelect(file);
      }
    }
  }, [navigateToFolder, onFileSelect, selectFile]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    await uploadFile(file);
  }, [uploadFile]);

  // Handle folder creation
  const handleCreateFolder = useCallback(async () => {
    // Intentionally disabled: New Folder functionality
    // const folderName = prompt('Enter folder name:');
    // if (folderName) {
    //   await createFolder(folderName);
    // }
  }, [createFolder]);

  // Handle file deletion
  const handleFileDelete = useCallback(async (file: FileObject) => {
    if (confirm(`Are you sure you want to delete ${file.name}?`)) {
      await deleteFile(file);
    }
  }, [deleteFile]);

  // Format file size
  const formatFileSize = useCallback((bytes?: number): string => {
    if (!bytes) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);
  
  // Format date
  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  }, []);

  // Download file functionality
  const downloadFile = useCallback(async (file: FileObject) => {
    if (!file || !file.fullPath) {
       alert('Cannot download: File path is missing.');
       return;
    }
    try {
      // Get file URL from Supabase via our API route
      const urlResponse = await fetch(`/api/files/url?path=${encodeURIComponent(file.fullPath)}&download=true`);
      
      if (!urlResponse.ok) {
        const errorData = await urlResponse.json().catch(() => ({ error: "Failed to parse error response" }));
        throw new Error(errorData.error || `Failed to get download URL: ${urlResponse.statusText}`);
      }
      
      // *** CHANGE EXPECTED STRUCTURE HERE ***
      const responseData = await urlResponse.json(); 
      console.log('[FileList downloadFile] Raw response data from API:', responseData);

      // Expect { url: "..." } directly from the API route
      const signedUrl = responseData?.url; 
      console.log('[FileList downloadFile] Extracted signedUrl:', signedUrl);
      
      if (!signedUrl || typeof signedUrl !== 'string') { // Check if it's a non-empty string
        throw new Error('Could not get valid file URL from API response'); // Updated error
      }
      
      console.log('Got download URL:', signedUrl);
      
      // Trigger download using the signed URL
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = file.name || 'download'; // Use original file name
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      alert(`Download started for ${file.name}.`); // Use alert or toast

    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    // Removed the finally block setting download state as it wasn't used
  }, []); // Dependencies removed as it doesn't rely on component state directly

  // Preview file
  const previewFileHandler = useCallback((file: FileObject) => {
    setPreviewFile({
      ...file,
      url: previewUrls[file.id]
    });
  }, [previewUrls]);

  // Close preview
  const closePreview = useCallback(() => {
    setPreviewFile(null);
  }, []);

  // Add function to get file type
  const getFileType = useCallback((file: FileObject): string => {
    if (file.isFolder) return 'folder';
    const ext = file.extension?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
    if (['txt', 'md'].includes(ext)) return 'text';
    if (['zip', 'rar', '7z'].includes(ext)) return 'archive';
    return 'other';
  }, []);

  // Enhanced file filtering logic
  const filteredFiles = useCallback(() => {
    let filtered = [...files];
    
    // First apply tab filter
    if (activeTab === 'images') {
      filtered = filtered.filter(file => isImage(file));
    } else if (activeTab === 'documents') {
      filtered = filtered.filter(file => !isImage(file) && !file.isFolder);
    } else if (activeTab === 'folders') {
      filtered = filtered.filter(file => file.isFolder);
    }
    
    // Then apply file type filter
    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter(file => {
        const ext = file.extension?.toLowerCase() || '';
        switch (fileTypeFilter) {
          case 'image':
            return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
          case 'pdf':
            return ext === 'pdf';
          case 'document':
            return ['doc', 'docx', 'txt', 'rtf', 'md'].includes(ext);
          case 'spreadsheet':
            return ['xls', 'xlsx', 'csv'].includes(ext);
          case 'presentation':
            return ['ppt', 'pptx'].includes(ext);
          case 'archive':
            return ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext);
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [files, activeTab, fileTypeFilter, sortBy, sortOrder, isImage]);

  // File type count helper
  const getFileTypeCounts = useCallback(() => {
    const counts = {
      all: files.length,
      image: files.filter(file => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(file.extension?.toLowerCase() || '')).length,
      pdf: files.filter(file => file.extension?.toLowerCase() === 'pdf').length,
      document: files.filter(file => ['doc', 'docx', 'txt', 'rtf', 'md'].includes(file.extension?.toLowerCase() || '')).length,
      spreadsheet: files.filter(file => ['xls', 'xlsx', 'csv'].includes(file.extension?.toLowerCase() || '')).length,
      presentation: files.filter(file => ['ppt', 'pptx'].includes(file.extension?.toLowerCase() || '')).length,
      archive: files.filter(file => ['zip', 'rar', '7z', 'tar', 'gz'].includes(file.extension?.toLowerCase() || '')).length,
      folder: files.filter(file => file.isFolder).length
    };
    return counts;
  }, [files]);

  return (
    <div className={`flex flex-col w-full bg-white rounded shadow-sm ${className || ''}`}>
      {/* Breadcrumb navigation */}
      <div className="flex items-center p-4 border-b border-gray-200">
        {folderPath.length === 0 ? (
          // At root: display a non-clickable title based on the context's folderPath or initialFolder.
          // Since folderPath from useFiles() is the current path segments, if it's empty, we are at root.
          <span className="text-gray-700 font-medium">
            {/* Display "" (empty string) or the name of the root folder if initialFolder provides it and it's not empty */}
            {(initialFolder && initialFolder !== '') ? initialFolder.split('/').pop() : ''}
          </span>
        ) : (
          // In a subfolder: display clickable "Root"
          <button
            onClick={() => navigateToFolder('')} // Navigate to empty string for root
            className="text-blue-600 hover:underline"
          >
            Root
          </button>
        )}
        {/* Display path segments from the context's folderPath */}
        {folderPath.map((folder) => (
          <React.Fragment key={folder.id}> {/* Assuming folder.id is unique & represents the segment path/id */}
            <span className="mx-2 text-gray-500">/</span>
            <button
              className="text-blue-600 hover:underline"
              onClick={() => navigateToFolder(folder.id)} // navigateToFolder uses the segment id/path
            >
              {folder.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Tabs and View Toggle */}
      <div className="flex flex-col md:flex-row border-b border-gray-200 justify-between p-2">
        <div className="flex mb-2 md:mb-0 overflow-x-auto">
          <button
            className={`py-2 px-3 text-sm border-b-2 ${activeTab === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('all')}
          >
            All Files
          </button>
          <button
            className={`py-2 px-3 text-sm border-b-2 ${activeTab === 'images' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('images')}
          >
            Images
          </button>
          <button
            className={`py-2 px-3 text-sm border-b-2 ${activeTab === 'documents' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
          <button
            className={`py-2 px-3 text-sm border-b-2 ${activeTab === 'folders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('folders')}
          >
            Folders
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            className="text-sm border rounded py-1 px-2"
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="pdf">PDF</option>
            <option value="document">Documents</option>
            <option value="spreadsheet">Spreadsheets</option>
            <option value="presentation">Presentations</option>
            <option value="archive">Archives</option>
          </select>
          
          <select 
            className="text-sm border rounded py-1 px-2"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-') as [any, any];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="date-desc">Date (Newest)</option>
            <option value="size-asc">Size (Smallest)</option>
            <option value="size-desc">Size (Largest)</option>
          </select>
          
          <div className="flex">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="List view"
            >
              <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`p-1.5 rounded ${viewMode === 'gallery' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Gallery view"
            >
              <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm8-8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Actions bar */}
      {showFilters && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {allowUpload && (
            <div className="flex gap-2">
              <input
                type="file"
                id="file-upload"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
              >
                Upload File
              </label>
              {/* <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                New Folder
              </button> */}
            </div>
          )}
        </div>
      )}

      {/* File list */}
      <div className="p-4" style={{ maxHeight: maxHeight || 'auto', overflowY: maxHeight ? 'auto' : 'visible' }}>
        {isLoading && uploadProgress === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-500 rounded">
            <p>{error}</p>
          </div>
        ) : filteredFiles().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No files in this folder</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFiles().map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleFileSelect(file)}
                      >
                        {file.isFolder ? (
                          <>
                            <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
                            </svg>
                            <span className="text-blue-600">{file.name}</span>
                          </>
                        ) : isImage(file) ? (
                          <>
                            <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path>
                            </svg>
                            <span>{file.name}</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
                            </svg>
                            <span>{file.name}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {file.isFolder ? '-' : formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(file.created_at)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                      <div className="flex justify-end space-x-2">
                        {!file.isFolder && (
                          <>
                            {isImage(file) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  previewFileHandler(file);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadFile(file);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              Download
                            </button>
                          </>
                        )}
                        {allowDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileDelete(file);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Gallery view for images
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
            {filteredFiles().map((file) => (
              <div 
                key={file.id} 
                className="relative group rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300 bg-white flex flex-col"
                onClick={() => file.isFolder ? handleFileSelect(file) : previewFileHandler(file)}
              >
                <div className="flex-1 flex items-center justify-center p-2 min-h-[140px]">
                  {file.isFolder ? (
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      <svg className="w-16 h-16 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
                      </svg>
                    </div>
                  ) : isImage(file) && previewUrls[file.id] ? (
                    <div className="w-full h-full flex items-center justify-center overflow-hidden bg-gray-50">
                      <img 
                        src={previewUrls[file.id]} 
                        alt={file.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      {file.extension?.toLowerCase() === 'pdf' ? (
                        <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
                        </svg>
                      ) : ['doc', 'docx'].includes(file.extension?.toLowerCase() || '') ? (
                        <svg className="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
                        </svg>
                      ) : ['xls', 'xlsx'].includes(file.extension?.toLowerCase() || '') ? (
                        <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
                        </svg>
                      ) : (
                        <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="p-2 bg-white border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">{file.isFolder ? `${getFileTypeCounts().folder} items` : formatFileSize(file.size)}</p>
                    <p className="text-xs text-gray-400">{file.extension?.toUpperCase()}</p>
                  </div>
                </div>
                
                {!file.isFolder && (
                  <div className="absolute top-0 right-0 p-1 hidden group-hover:flex gap-1 bg-white bg-opacity-90 rounded-bl shadow-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file);
                      }}
                      className="p-1 rounded text-green-600 hover:bg-green-100"
                      title="Download"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                      </svg>
                    </button>
                    {allowDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileDelete(file);
                        }}
                        className="p-1 rounded text-red-600 hover:bg-red-100"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewFile && isImage(previewFile) && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium text-lg">{previewFile.name}</h3>
              <button onClick={closePreview} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex justify-center items-center max-h-[70vh] overflow-auto bg-gray-100">
              {previewFile.url ? (
                <img 
                  src={previewFile.url} 
                  alt={previewFile.name}
                  className="max-w-full max-h-full object-contain" 
                />
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path>
                  </svg>
                  <p>Image preview not available</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => downloadFile(previewFile)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(FileList); 