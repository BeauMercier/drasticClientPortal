'use client';

import React, { useState, useEffect } from 'react';
import { FileObject, useFiles } from '@/shared/contexts/FileContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadIcon, Trash2Icon, ZoomInIcon } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/formatFileSize';
import { getFileIcon } from '@/lib/utils/getFileIcon';
import { toast } from 'sonner';
import Image from 'next/image';

interface GalleryViewProps {
  files: FileObject[];
  onPreviewFile: (file: FileObject) => void; // Callback to open preview modal
  // allowDelete might be managed by a parent or context
}

const GalleryView: React.FC<GalleryViewProps> = ({ files, onPreviewFile }) => {
  const { 
    isLoading, // To disable actions while context is busy
    deleteFile, // Assuming deleteFile expects FileObject
  } = useFiles();

  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  // Generate presigned URLs for image previews
  useEffect(() => {
    const fetchPreviewUrls = async () => {
      const newUrls: Record<string, string> = {};
      for (const file of files) {
        if (file.mime_type?.startsWith('image/') && file.fullPath && !previewUrls[file.id]) {
          try {
            const response = await fetch(`/api/files/url?path=${encodeURIComponent(file.fullPath)}&thumbnail=true`);
            if (!response.ok) {
              console.warn(`Failed to get preview URL for ${file.name}`);
              continue;
            }
            const data = await response.json();
            if (data.url) {
              newUrls[file.id] = data.url;
            }
          } catch (error) {
            console.warn(`Error fetching preview URL for ${file.name}:`, error);
          }
        }
      }
      if (Object.keys(newUrls).length > 0) {
        setPreviewUrls(prev => ({ ...prev, ...newUrls }));
      }
    };
    if (files.length > 0) {
      fetchPreviewUrls();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]); // Re-run if files array changes (e.g., after upload/delete)

  // Download handler (similar to ListView)
  const downloadFileHandler = async (fileToDownload: FileObject) => {
    if (!fileToDownload || !fileToDownload.fullPath) {
      toast.error("File path missing.");
      return;
    }
    try {
      const response = await fetch(`/api/files/url?path=${encodeURIComponent(fileToDownload.fullPath)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to get download URL' }));
        throw new Error(errorData.message || 'Failed to get download URL');
      }
      const data = await response.json();
      if (data.url) {
        const link = document.createElement('a');
        link.href = data.url;
        link.download = fileToDownload.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloading ${fileToDownload.name}`);
      } else {
        throw new Error('No URL received from API for download');
      }
    } catch (error: any) {
      console.error('Download error in GalleryView:', error);
      toast.error(`Download failed: ${error.message || 'Unknown error'}`);
    }
  };

  const deleteFileHandler = async (fileToDelete: FileObject) => {
    if (!fileToDelete) return;
    if (confirm(`Are you sure you want to delete ${fileToDelete.name}?`)) {
      try {
        await deleteFile(fileToDelete);
        toast.success(`File "${fileToDelete.name}" deleted.`);
        // Remove from local previewUrls if it exists
        setPreviewUrls(prev => {
          const newPrev = { ...prev };
          delete newPrev[fileToDelete.id];
          return newPrev;
        });
      } catch (err: any) {
        toast.error(err.message || "Failed to delete file.");
      }
    }
  };

  const isImageFile = (file: FileObject) => file.mime_type?.startsWith('image/');

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 flex-grow">
      {files.map((file) => (
        <Card 
          key={file.id} 
          className="group relative aspect-square flex flex-col justify-between items-center p-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Main content: Image or Icon */}
          <div 
            className="w-full h-full flex items-center justify-center cursor-pointer" 
            onClick={() => onPreviewFile(file)} // Opens preview modal for all file types
          >
            {isImageFile(file) && previewUrls[file.id] ? (
              <Image 
                src={previewUrls[file.id]}
                alt={file.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, (max-width: 1536px) 16vw, 12.5vw"
                className="object-cover"
                onError={(e) => { console.warn(`Image load error for ${file.name}`, e.currentTarget.src); /* Optionally show placeholder */ }}
              />
            ) : (
              <div className="p-4 flex items-center justify-center w-full h-full bg-muted/30">
                {getFileIcon(file, "w-1/2 h-1/2 opacity-70")}
              </div>
            )}
          </div>

          {/* Overlay for name and actions, appears on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
            <div 
              className="flex-grow flex items-center justify-center cursor-pointer" 
              onClick={() => onPreviewFile(file)} // Click on overlay text also previews
            >
              <p className="text-xs font-medium text-center break-all line-clamp-3" title={file.name}>
                {file.name}
              </p>
            </div>
            
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="truncate">{file.size != null ? formatFileSize(file.size) : 'N/A'}</span>
              {/* Actions: Preview, Download, Delete */}
              <div className="flex items-center space-x-0.5">
                <Button variant="ghost" size="icon" onClick={() => onPreviewFile(file)} title="Preview" className="text-white hover:bg-white/20 hover:text-white p-1 h-auto w-auto">
                  <ZoomInIcon size={14} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => downloadFileHandler(file)} title="Download" className="text-white hover:bg-white/20 hover:text-white p-1 h-auto w-auto" disabled={isLoading}>
                  <DownloadIcon size={14} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteFileHandler(file)} title="Delete" className="text-white hover:bg-red-500/50 hover:text-white p-1 h-auto w-auto" disabled={isLoading}>
                  <Trash2Icon size={14} />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default GalleryView; 