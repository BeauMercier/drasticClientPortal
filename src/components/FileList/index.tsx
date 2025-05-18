'use client';

import React, { useEffect, useCallback, memo, useState, useMemo } from 'react';
import { FileObject, useFiles, TOP_SCOPE_GENERAL, TOP_SCOPE_PROJECT_PREFIX } from '@/shared/contexts/FileContext';
import {
  ListIcon,
  GridIcon,
  Trash2Icon,
  DownloadIcon,
  ArrowLeftIcon,
  UploadCloudIcon,
  FileWarningIcon,
  FolderOpenIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatFileSize } from '@/lib/utils/formatFileSize';
import { getFileIcon } from '@/lib/utils/getFileIcon'; // Corrected import
import { toast } from 'sonner'; // For notifications

// TODO: Consider moving to a shared types location if used elsewhere
export interface NavigableFileObject extends FileObject {
  project_id: string | null; 
  project_type?: string | null;
}

export interface FileListProps {
  showFilters?: boolean; // Not used yet, for future
  maxHeight?: string;
  onFileSelect?: (file: FileObject) => void;
  allowUpload?: boolean; // To be used in Step 3
  allowDelete?: boolean;
  className?: string;
  // New props for Step 3 (Uploader and Toolbar) if needed
  // currentProjectId?: string | null; // If uploads are project-specific from this component
}

// Helper to build the immediate children for the current view
// Takes all files relevant to the current scope (e.g., all general files, or all files for a specific project)
// and the relative path *within* that scope.
const buildImmediateChildren = (scopedFiles: FileObject[], relativePathWithinScope: string): FileObject[] => {
  const children: FileObject[] = [];
  const seenFolders = new Set<string>(); // To avoid duplicate virtual folders

  scopedFiles.forEach(file => {
    // Determine the parent path of 'file' relative to the start of its scope
    let parentPathInScope = '';
    const pathSegments = file.fullPath.split('/');
    pathSegments.pop(); // Remove filename to get parent directory

    if (file.project_id) {
      // For project files, path is relative to project_id folder
      // e.g., fullPath: __SCOPE__PROJECT__/project123/folderA/file.txt
      // project_id: project123. relativePathWithinScope: folderA
      // We need to find parentPathInScope for 'file.txt' which would be 'folderA'
      const projectIdIndex = pathSegments.indexOf(file.project_id);
      if (projectIdIndex !== -1 && projectIdIndex < pathSegments.length) {
        parentPathInScope = pathSegments.slice(projectIdIndex + 1).join('/');
      }
    } else { 
      // For general files, path is relative to TOP_SCOPE_GENERAL
      // e.g., fullPath: __SCOPE__GENERAL__/folderB/file.txt
      // TOP_SCOPE_GENERAL: __SCOPE__GENERAL__
      // We need parentPathInScope for 'file.txt' which would be 'folderB'
      const generalScopeSegment = TOP_SCOPE_GENERAL.replace(/^__SCOPE__|__$/g, ''); // e.g. "GENERAL"
      const generalIndex = pathSegments.indexOf(generalScopeSegment); 
      if (generalIndex !== -1 && generalIndex < pathSegments.length) {
        parentPathInScope = pathSegments.slice(generalIndex + 1).join('/');
      } else if (pathSegments.length === 0 && file.fullPath.startsWith(TOP_SCOPE_GENERAL)) {
         // This case handles files directly under TOP_SCOPE_GENERAL where pathSegments might be empty
         // E.g. __SCOPE__GENERAL__/file.txt -> pathSegments = [__SCOPE__GENERAL__], pop makes it []
         // parentPathInScope should be '' for these
         parentPathInScope = '';
      }
    }
    
    // Normalize relativePathWithinScope (e.g. remove trailing slash if not root)
    const normalizedRelativePath = relativePathWithinScope.endsWith('/') && relativePathWithinScope.length > 1 
                                     ? relativePathWithinScope.slice(0, -1) 
                                     : relativePathWithinScope;

    if (parentPathInScope === normalizedRelativePath) {
      // This file/folder is a direct child of the current `relativePathWithinScope`
      const childFile = { ...file }; // Create a copy

      if (file.isFolder) {
        // If it's a folder, ensure we haven't already added it (virtual folders from paths)
        if (!seenFolders.has(childFile.name)) {
          children.push(childFile);
          seenFolders.add(childFile.name);
        }
      } else {
        children.push(childFile);
      }
    }
  });

  // Sort: folders first, then by name
  children.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name);
  });

  return children;
};


const FileList: React.FC<FileListProps> = ({
  onFileSelect, 
  allowDelete = true,
  className,
  // allowUpload will be used in Step 3
}) => {
  const { 
    files: allUserFiles,
    isLoading: contextIsLoading, 
    error: contextError, 
    loadFiles, 
    deleteFile, 
    selectFile, // For selecting a file to preview, if needed
    navigateToFolder: contextNavigateToFolder,
    currentFolder, // currentFolder is the full path like "__SCOPE__GENERAL__/some/folder" or "__SCOPE__PROJECT__/project123/another/folder" or null for root
    // folderPath: contextFolderPath, // Using contextFolderPath for clarity if needed later
  } = useFiles();

  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({}); // Store { fileId: signedUrl }
  const [previewFile, setPreviewFile] = useState<FileObject | null>(null); // For modal preview

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Memoized list of files/folders to display in the current view
  const viewFiles = useMemo(() => {
    if (!currentFolder) { // Root view: Show "General Files" and each "Project X Files" as top-level folders
      const groups: FileObject[] = [];
      const hasGeneralFiles = allUserFiles.some(f => !f.project_id);
      
      // Create a user-friendly name for the general scope
      const generalScopeName = TOP_SCOPE_GENERAL.replace(/^__SCOPE__|__$/g, '')
        .split('_')
        .filter(s => s.length > 0) // Filter out empty strings
        .map(w=>w.charAt(0).toUpperCase()+w.slice(1))
        .join(' ');

      if (hasGeneralFiles) {
        groups.push({
          id: TOP_SCOPE_GENERAL, // Special ID for this virtual folder
          name: `${generalScopeName} Files`,
          isFolder: true,
          fullPath: TOP_SCOPE_GENERAL, // Path to navigate into
          project_id: null,
          project_type: 'general', // Custom type for this virtual folder
          uploaded_at: new Date().toISOString(), // Placeholder
          user_id: null, // Placeholder
          extension: null, 
          mime_type: null, 
          size: null,      
        });
      }

      const projectMap = new Map<string, { type: string | null, name?: string, originalName?: string }>();
      allUserFiles.forEach(f => {
        if (f.project_id) {
          if (!projectMap.has(f.project_id)) {
             // Try to find the root folder for the project to get its original name
            const projectRootFolder = allUserFiles.find(pf => pf.project_id === f.project_id && pf.isFolder && pf.fullPath === `${TOP_SCOPE_PROJECT_PREFIX}${f.project_id}`);
            projectMap.set(f.project_id, { 
              type: f.project_type || null,
              originalName: projectRootFolder?.name // Store the original name if found
            });
          }
        }
      });

      for (const [id, projData] of projectMap) {
        // Generate a user-friendly name for the project type
        const projectTypeName = projData.originalName || 
          (projData.type 
            ? projData.type.replace(/_/g, ' ')
                .split(' ')
                .filter(s => s.length > 0) // Filter out empty strings
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ') 
            : 'Project');
        groups.push({
          id: `${TOP_SCOPE_PROJECT_PREFIX}${id}`, // Special ID
          name: `${projectTypeName} Files`, // Display name
          isFolder: true,
          fullPath: `${TOP_SCOPE_PROJECT_PREFIX}${id}`, // Path to navigate into
          project_id: id,
          project_type: projData.type,
          uploaded_at: new Date().toISOString(), // Placeholder
          user_id: null, // Placeholder
          extension: null,
          mime_type: null,
          size: null,
        });
      }
      return groups.sort((a,b) => a.name.localeCompare(b.name));
    }

    // If not in root view, currentFolder is set.
    // currentFolder can be: __SCOPE__GENERAL__ or __SCOPE__GENERAL__/path or __SCOPE__PROJECT__projectID or __SCOPE__PROJECT__projectID/path
    const [scope, ...pathParts] = currentFolder.split('/'); // e.g. ["__SCOPE__PROJECT__project123", "folderA"]
    const relativePathWithinScope = pathParts.join('/'); // e.g. "folderA" or "" if at scope root

    let scopedFiles: FileObject[] = [];
    if (scope === TOP_SCOPE_GENERAL) {
      scopedFiles = allUserFiles.filter(f => !f.project_id);
    } else if (scope.startsWith(TOP_SCOPE_PROJECT_PREFIX)) {
      const projectId = scope.replace(TOP_SCOPE_PROJECT_PREFIX, '');
      scopedFiles = allUserFiles.filter(f => f.project_id === projectId);
    }
    
    return buildImmediateChildren(scopedFiles, relativePathWithinScope);
  }, [allUserFiles, currentFolder]);


  // Effect to fetch preview URLs for image files in the current view
  useEffect(() => {
    const fetchPreviews = async () => {
      const missingPreviews = viewFiles.filter(
        (f) =>
          !f.isFolder &&
          f.mime_type?.startsWith('image/') &&
          !previewUrls[f.id] // Only fetch if not already fetched
      );

      if (!missingPreviews.length) return;

      const promises = missingPreviews.map(async (f) => {
        try {
          const res = await fetch(
            // Use the API route that generates a signed URL for preview
            `/api/files/url?path=${encodeURIComponent(f.fullPath)}&mode=preview`
          );
          if (res.ok) {
            const { url } = await res.json();
            return [f.id, url] as const; // Tuple of [fileId, previewUrl]
          }
          console.warn(`Failed to get preview URL for ${f.name}: ${res.status}`);
          return null;
        } catch (error) {
          console.error(`Error fetching preview for ${f.name}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const updates: Record<string, string> = {};
      results.forEach((tuple) => {
        if (tuple) updates[tuple[0]] = tuple[1];
      });

      if (Object.keys(updates).length) {
        setPreviewUrls((prev) => ({ ...prev, ...updates }));
      }
    };

    if (viewMode === 'gallery') { // Only fetch for gallery view, or always if preferred
        fetchPreviews();
    }
  }, [viewFiles, viewMode]); // Re-run if files in view or viewMode change

  const downloadFileHandler = useCallback(async (fileId: string) => {
    if (!fileId || fileId.startsWith('__SCOPE__')) return; // Ignore scope "folders"

    const fileToDownload = allUserFiles.find(f => f.id === fileId);
    if (!fileToDownload || !fileToDownload.fullPath || fileToDownload.isFolder) {
      toast.error("File not found, path missing, or it's a folder.");
      console.error('File not found, path missing, or is a folder for download:', fileId);
      return;
    }

    try {
      // Get download URL from API
      const response = await fetch(`/api/files/url?path=${encodeURIComponent(fileToDownload.fullPath)}`); // Default mode is download
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to get download URL' }));
        throw new Error(errorData.message || 'Failed to get download URL');
      }
      const data = await response.json();
      if (data.url) {
        const link = document.createElement('a');
        link.href = data.url;
        link.download = fileToDownload.name; // Sets the default filename for the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloading ${fileToDownload.name}`);
      } else {
        throw new Error('No URL received from API for download');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(`Download failed: ${error.message || 'Unknown error'}`);
    }
  }, [allUserFiles]);

  const deleteFileHandler = useCallback(async (fileId: string) => {
    if (!fileId || fileId.startsWith('__SCOPE__')) return; // Ignore scope "folders"

    const fileToDelete = allUserFiles.find(f => f.id === fileId);
    if (!fileToDelete) { 
      toast.error("File not found for deletion.");
      console.error('File not found for deletion:', fileId);
      return;
    }

    // Could use a more robust confirmation dialog here
    if (confirm(`Are you sure you want to delete ${fileToDelete.name}?`)) {
      try {
        await deleteFile(fileToDelete); // Assumes deleteFile handles errors and potentially reloads files
        toast.success(`File "${fileToDelete.name}" deleted.`);
      } catch (err: any) { // Catch error from deleteFile context method
        toast.error(err.message || "Failed to delete file.");
      }
    }
  }, [allUserFiles, deleteFile]);
  
  const isImage = useCallback((file: FileObject): boolean => {
    if (file.mime_type) return file.mime_type.startsWith('image/');
    if (file.extension) {
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
      // Ensure extension is a string and convert to lower case for comparison
      return typeof file.extension === 'string' && imageExtensions.includes(file.extension.toLowerCase());
    }
    return false;
  }, []);

  const previewFileHandler = useCallback((file: FileObject) => {
    if (file.isFolder) {
      contextNavigateToFolder(file.fullPath); // Pass the fullPath string
      return;
    }
    setPreviewFile(file); // Set the FileObject itself for the modal
    // If onFileSelect prop is provided (e.g., for selecting a file in a form), call it
    if (onFileSelect && !file.isFolder) onFileSelect(file); 
    // If FileContext provides a selectFile method for global state, use it
    if (selectFile) selectFile(file); 
  }, [onFileSelect, selectFile, contextNavigateToFolder]);

  const renderBreadcrumbs = () => {
    if (!currentFolder) return <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">Root</div>;

    const pathSegments = currentFolder.split('/');
    let cumulativePath = '';
    
    const generalScopeDisplayName = TOP_SCOPE_GENERAL.replace(/^__SCOPE__|__$/g, '')
      .split('_')
      .filter(s => s.length > 0) // Filter out empty strings
      .map(w=>w.charAt(0).toUpperCase()+w.slice(1))
      .join(' ');

    const breadcrumbItems = pathSegments.map((segment, index) => {
      const isLast = index === pathSegments.length - 1;
      let displaySegment = segment;
      
      if (index === 0) { // First segment is scope
        if (segment === TOP_SCOPE_GENERAL) {
          displaySegment = generalScopeDisplayName;
        } else if (segment.startsWith(TOP_SCOPE_PROJECT_PREFIX)) {
          const projectId = segment.replace(TOP_SCOPE_PROJECT_PREFIX, '');
          // Find project to display its name
          const projectFile = allUserFiles.find(f => f.project_id === projectId);
          const projectType = projectFile?.project_type 
            ? projectFile.project_type.replace(/_/g, ' ')
                .split(' ')
                .filter(s => s.length > 0) // Filter out empty strings
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ') 
            : 'Project';
          // Attempt to find original root folder name for the project
          const projectRootFolder = allUserFiles.find(pf => pf.project_id === projectId && pf.isFolder && pf.fullPath === `${TOP_SCOPE_PROJECT_PREFIX}${projectId}`);
          displaySegment = projectRootFolder?.name || `${projectType}`;
        }
        cumulativePath = segment;
      } else {
        cumulativePath += `/${segment}`;
      }
      
      return (
        <React.Fragment key={cumulativePath}>
          {!isLast ? (
            <button onClick={() => contextNavigateToFolder(cumulativePath)} className="hover:underline">
              {displaySegment}
            </button>
          ) : (
            <span className="text-gray-500 dark:text-gray-300">{displaySegment}</span>
          )}
          {!isLast && <span className="mx-1">/</span>}
        </React.Fragment>
      );
    });

    return (
      <div className="mb-4 text-sm text-gray-700 dark:text-gray-300 flex items-center">
        <button onClick={() => contextNavigateToFolder(null)} className="hover:underline mr-1">Root</button>
        {breadcrumbItems.length > 0 && <span className="mx-1">/</span>}
        {breadcrumbItems}
      </div>
    );
  };
  
  const columns = useMemo(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: { row: any }) => { // TODO: Type `row` properly if ColumnDef from tanstack-table is available
        const file = row.original as FileObject;
        return (
          <div className="flex items-center">
            <div className="mr-2 flex-shrink-0">
                {getFileIcon(file, "h-5 w-5")} 
            </div>
            <span 
              className={`truncate ${file.isFolder ? 'cursor-pointer hover:underline' : ''}`}
              onClick={() => file.isFolder ? contextNavigateToFolder(file.fullPath) : previewFileHandler(file)}
              title={file.name}
            >
              {file.name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "extension",
      header: "Type",
      cell: ({ row }: { row: any }) => {
        const file = row.original as FileObject;
        // Ensure extension is a string before calling toUpperCase()
        const displayExtension = typeof file.extension === 'string' ? file.extension.toUpperCase() : null;
        return displayExtension || (file.isFolder ? "Folder" : "N/A");
      },
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: ({ row }: { row: any }) => {
        const file = row.original as FileObject;
        return file.isFolder ? '--' : (file.size != null ? formatFileSize(file.size) : 'N/A');
      },
    },
    {
      accessorKey: "uploaded_at",
      header: "Date Added",
      cell: ({ row }: { row: any }) => {
        const file = row.original as FileObject;
        return file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : 'N/A';
      },
    },
    {
      id: "actions",
      cell: ({ row }: { row: any }) => {
        const file = row.original as FileObject;
        if (file.id.startsWith('__SCOPE__')) return null; // No actions for virtual scope folders

        return (
          <div className="flex items-center justify-end space-x-1">
            {!file.isFolder && (
              <Button variant="ghost" size="icon" onClick={() => downloadFileHandler(file.id)} title="Download">
                <DownloadIcon size={16} />
              </Button>
            )}
            {allowDelete && (
              <Button variant="ghost" size="icon" onClick={() => deleteFileHandler(file.id)} title="Delete" className="hover:text-red-500">
                <Trash2Icon size={16} />
              </Button>
            )}
          </div>
        );
      },
    },
  ], [contextNavigateToFolder, previewFileHandler, downloadFileHandler, deleteFileHandler, allowDelete, getFileIcon]);


  if (contextIsLoading && !allUserFiles.length) { // Show skeleton loader on initial load
    return (
      <div className={`space-y-4 ${className}`}>
        <Skeleton className="h-10 w-1/3" /> {/* Breadcrumb skeleton */}
        <Skeleton className="h-8 w-1/4" /> {/* Toolbar skeleton */}
        {viewMode === 'list' ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {[...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-6 w-full" /></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="aspect-square">
                <Skeleton className="h-full w-full" />
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (contextError) {
    return (
      <div className={`flex flex-col items-center justify-center text-red-500 border border-red-500 p-6 rounded-md ${className}`}>
        <FileWarningIcon size={48} className="mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Files</h3>
        <p className="text-center">{typeof contextError === 'string' ? contextError : contextError.message || 'An unknown error occurred.'}</p>
        <Button onClick={loadFiles} className="mt-4">Try Again</Button>
      </div>
    );
  }
  
  const displayedItems = viewFiles; // Files and folders for the current navigation path

  return (
    <div className={`flex flex-col ${className || 'h-full'}`}>
      {/* Breadcrumbs and View Toggle */}
      <div className="flex justify-between items-center mb-4">
        {renderBreadcrumbs()}
        <div className="flex items-center space-x-2">
          {/* Placeholder for Uploader - Step 3 */}
          {/* <Button variant="outline" size="sm"><UploadCloudIcon className="mr-2 h-4 w-4" /> Upload</Button> */}
          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} title="List View">
            <ListIcon size={20} />
          </Button>
          <Button variant={viewMode === 'gallery' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('gallery')} title="Gallery View">
            <GridIcon size={20} />
          </Button>
        </div>
      </div>

      {/* File Display Area */}
      {displayedItems.length === 0 && !contextIsLoading ? (
         <div className="flex-grow flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
            <FolderOpenIcon size={64} className="mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-xl font-semibold mb-2">This folder is empty.</h3>
            <p>Upload files or navigate to another folder.</p>
            {/* Placeholder for Uploader Button in empty state - Step 3 */}
            {/* <Button variant="default" size="lg" className="mt-6"><UploadCloudIcon className="mr-2 h-5 w-5" /> Upload Files</Button> */}
        </div>
      ) : viewMode === 'list' ? (
        <div className="rounded-md border overflow-auto flex-grow">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.id || column.accessorKey}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedItems.map((file) => (
                <TableRow 
                    key={file.id} 
                    onClick={() => !file.isFolder && previewFileHandler(file) }
                    className={!file.isFolder ? 'cursor-pointer hover:bg-muted/50' : (file.isFolder ? 'cursor-pointer hover:bg-muted/50' : '')}
                >
                  {columns.map((column) => (
                    <TableCell 
                        key={column.id || column.accessorKey} 
                        onClick={() => {
                            if (file.isFolder && column.accessorKey === 'name') {
                                contextNavigateToFolder(file.fullPath);
                            }
                        }}
                    >
                      {column.cell 
                        ? column.cell({ row: { original: file } }) 
                        : (column.accessorKey && typeof column.accessorKey === 'string' ? (file as any)[column.accessorKey] : null)
                      } 
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : ( // Gallery View
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-auto flex-grow">
          {displayedItems.map((file) => (
            <div key={file.id}>
              <Card 
                className="group relative aspect-square flex flex-col justify-center items-center cursor-pointer hover:shadow-lg transition-shadow dark:bg-gray-800 dark:hover:shadow-gray-700/50"
                onClick={() => previewFileHandler(file)} // Handles folder navigation or file preview
              >
                {file.isFolder ? (
                  getFileIcon(file, "h-16 w-16") // Corrected: Pass file object and size
                ) : isImage(file) && previewUrls[file.id] ? (
                  <img src={previewUrls[file.id]} alt={file.name} className="object-contain h-full w-full rounded-md" />
                ) : (
                  // Fallback icon for non-image files or images not yet loaded
                  getFileIcon(file, "h-16 w-16") // Corrected: Pass file object and size
                )}
                {/* Skeleton for images that are loading */}
                {!file.isFolder && isImage(file) && !previewUrls[file.id] && (
                  <Skeleton className="absolute inset-0 h-full w-full rounded-md" />
                )}

                {/* Hover actions overlay: Show for folders OR (images that are loaded OR non-image files) */}
                { (file.isFolder || (!file.isFolder && (!isImage(file) || (isImage(file) && previewUrls[file.id])))) &&
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-md">
                    {!file.isFolder && ( // Download only for files
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); downloadFileHandler(file.id); }} className="text-white hover:text-blue-300" title="Download">
                        <DownloadIcon size={20} />
                      </Button>
                    )}
                    {allowDelete && ( // Delete for files and folders (if context supports folder deletion)
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteFileHandler(file.id); }} className="text-white hover:text-red-400" title="Delete">
                        <Trash2Icon size={20} />
                      </Button>
                    )}
                  </div>
                }
              </Card>
              {/* File name and details below card */}
              <div className="pt-2 text-center">
                <h3 
                    className="text-sm font-medium truncate text-gray-800 dark:text-gray-200 hover:underline" 
                    title={file.name}
                    onClick={() => previewFileHandler(file)} // Allow clicking name for navigation/preview
                >
                    {file.name}
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center mt-1 px-1">
                  <span>
                    {/* Corrected: typeof check for file.extension before toUpperCase */}
                    {typeof file.extension === 'string' ? file.extension.toUpperCase() : (file.isFolder ? 'Folder' : 'N/A')}
                  </span>
                  <span>{file.size != null && !file.isFolder ? formatFileSize(file.size) : '--'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Image Preview */}
      {previewFile && !previewFile.isFolder && isImage(previewFile) && (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewFile(null)} // Close on overlay click
        >
          <Card className="max-w-3xl max-h-[80vh] overflow-auto p-0 relative dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewUrls[previewFile.id] || ''} // Use URL from state
              alt={`Preview of ${previewFile.name}`} 
              className="block max-w-full max-h-[75vh] object-contain rounded-t-md" 
            />
             <div className="p-4 border-t dark:border-gray-700">
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{previewFile.name}</p>
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span>
                        Type: {typeof previewFile.extension === 'string' ? previewFile.extension.toUpperCase() : 'N/A'}
                    </span>
                    <span>
                        Size: {previewFile.size != null ? formatFileSize(previewFile.size) : 'N/A'}
                    </span>
                </div>
                <div className="mt-3 flex gap-2">
                    <Button onClick={() => downloadFileHandler(previewFile.id)}>
                        <DownloadIcon className="mr-2 h-4 w-4" /> Download
                    </Button>
                    {allowDelete && (
                        <Button variant="destructive" onClick={() => { deleteFileHandler(previewFile.id); setPreviewFile(null); }}>
                            <Trash2Icon className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setPreviewFile(null)}>Close</Button>
                </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default memo(FileList);
