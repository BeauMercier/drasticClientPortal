'use client';

import React, { useContext, useMemo, useState, useCallback } from 'react';
import { FileObject, useFiles, Scope } from '@/shared/contexts/FileContext'; // Scope imported
import GalleryView from './GalleryView';
import ListView from './ListView';
import Uploader from './Uploader';
import EmptyState from './EmptyState';

// ShadCN UI Components
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs" // For Scope Tabs

// Icons
import { ListIcon, LayoutGridIcon, XIcon, DownloadIcon } from 'lucide-react';
import Image from 'next/image';
import { getFileIcon } from '@/lib/utils/getFileIcon';
import { formatFileSize } from '@/lib/utils/formatFileSize';
import { toast } from 'sonner';

// Define MIME types for documents as per user patch
const docMimes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

// Helper functions to determine file type (adapted from user patch)
const isPhoto = (f: FileObject) => f.mime_type?.startsWith('image/');
const isDocument = (f: FileObject) => docMimes.has(f.mime_type ?? '');

// Props for FileList (can be expanded if needed)
interface FileListProps {
  // Placeholder for any future props, e.g., allowDelete (though context might handle this)
  className?: string;
}

const FileList: React.FC<FileListProps> = ({ className }) => {
  const {
    files: allUserFiles, // Renamed from files in user patch to avoid conflict with filtered 'files'
    listView,
    setListView,
    activeScope,
    setActiveScope,
    isLoading,
    deleteFile: contextDeleteFile, // Renamed for clarity
  } = useFiles();

  const [previewFile, setPreviewFile] = useState<FileObject | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Filtering logic based on activeScope
  const files = useMemo(() => {
    switch (activeScope) {
      case 'photos':
        return allUserFiles.filter(f => !f.isFolder && isPhoto(f)); // Ensure isFolder is false
      case 'documents':
        return allUserFiles.filter(f => !f.isFolder && isDocument(f)); // Ensure isFolder is false
      default: // 'all' scope
        return allUserFiles.filter(f => !f.isFolder); // Ensure isFolder is false
    }
  }, [allUserFiles, activeScope]);

  // File Preview Modal Logic (retained from old FileList)
  const previewFileHandler = useCallback(async (file: FileObject) => {
    setPreviewFile(file);
    setPreviewImageUrl(null); // Reset previous image URL

    if (file.mime_type?.startsWith('image/') && file.fullPath) {
      try {
        // Fetch a non-thumbnail, potentially higher-res URL for preview modal
        const response = await fetch(`/api/files/url?path=${encodeURIComponent(file.fullPath)}`);
        if (!response.ok) throw new Error('Failed to get image preview URL');
        const data = await response.json();
        if (data.url) setPreviewImageUrl(data.url);
        else throw new Error('No URL in response for image preview');
      } catch (error) {
        console.error('Error fetching image for preview modal:', error);
        toast.error('Could not load image preview.');
      }
    }
    // For other file types, modal will show icon and metadata
  }, []);

  const closePreviewModal = () => {
    setPreviewFile(null);
    setPreviewImageUrl(null);
  };

  const downloadPreviewedFile = async () => {
    if (!previewFile || !previewFile.fullPath) return;
    try {
      const response = await fetch(`/api/files/url?path=${encodeURIComponent(previewFile.fullPath)}`);
      if (!response.ok) throw new Error('Failed to get download URL');
      const data = await response.json();
      if (data.url) {
        const link = document.createElement('a');
        link.href = data.url;
        link.download = previewFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloading ${previewFile.name}`);
      } else {
        throw new Error('No URL for download');
      }
    } catch (error:any) {
      toast.error(`Download failed: ${error.message}`);
    }
  };

  const deletePreviewedFile = async () => {
    if (!previewFile) return;
    if (confirm(`Are you sure you want to delete ${previewFile.name}?`)) {
      try {
        await contextDeleteFile(previewFile);
        toast.success(`File "${previewFile.name}" deleted.`);
        closePreviewModal();
      } catch (err: any) {
        toast.error(err.message || "Failed to delete file from modal.");
      }
    }
  };

  // Toolbar component adaptation (MUI to ShadCN)
  const ScopeTabs = (
    <Tabs value={activeScope} onValueChange={(value) => setActiveScope(value as Scope)} className="mr-2">
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="photos">Photos</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
    </Tabs>
  );

  const ViewToggle = (
    <ToggleGroup 
      type="single" 
      variant="outline" 
      value={listView} 
      onValueChange={(value: string) => { if (value) setListView(value as 'list' | 'gallery'); }}
      size="sm"
    >
      <ToggleGroupItem value="list" aria-label="List view">
        <ListIcon className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="gallery" aria-label="Gallery view">
        <LayoutGridIcon className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Toolbar: Scope Tabs, View Toggle, Uploader */}
      <div className="flex items-center mb-4 p-1 border-b">
        {ScopeTabs}
        <div className="ml-auto flex items-center space-x-2">
          {ViewToggle}
          <Uploader variant="default" size="sm" buttonText="Upload" showIcon={true}/>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-grow overflow-y-auto p-1">
        {files.length === 0 ? (
          <EmptyState activeScope={activeScope} />
        ) : listView === 'list' ? (
          <ListView files={files} />
        ) : (
          <GalleryView files={files} onPreviewFile={previewFileHandler} />
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={(isOpen) => !isOpen && closePreviewModal()}>
          <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] flex flex-col max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="truncate max-w-[calc(100%-3rem)]" title={previewFile.name}>{previewFile.name}</DialogTitle>
              <Button variant="ghost" size="icon" className="absolute top-3 right-3" onClick={closePreviewModal}>
                <XIcon size={20}/>
                <span className="sr-only">Close</span>
              </Button>
            </DialogHeader>
            
            <div className="flex-grow overflow-y-auto p-1 -mx-6 px-6">
              {previewImageUrl ? (
                <div className="relative aspect-video w-full mx-auto bg-black rounded-md overflow-hidden">
                   <Image src={previewImageUrl} alt={`Preview of ${previewFile.name}`} layout="fill" objectFit="contain" />
                </div>
              ) : previewFile.mime_type?.startsWith('image/') ? (
                <div className="flex items-center justify-center h-64 text-gray-500">Loading image preview...</div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8">
                  {getFileIcon(previewFile, "w-24 h-24 text-gray-400 mb-4")}
                  <p className="text-lg">{previewFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {previewFile.mime_type || 'Unknown type'} - {previewFile.size != null ? formatFileSize(previewFile.size) : 'Size N/A'}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-auto pt-4 border-t">
              <Button variant="outline" onClick={closePreviewModal}>Close</Button>
              <div className="flex-grow" /> 
              {/* Allow delete from preview only if allowDelete were true */}
              <Button variant="destructive" onClick={deletePreviewedFile} disabled={isLoading}>
                Delete File
              </Button>
              <Button variant="default" onClick={downloadPreviewedFile} disabled={isLoading}>
                <DownloadIcon className="mr-2 h-4 w-4" /> Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FileList;
