'use client';

import React from 'react';
import { FileObject, useFiles } from '@/shared/contexts/FileContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DownloadIcon, Trash2Icon } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/formatFileSize';
import { getFileIcon } from '@/lib/utils/getFileIcon';
import { toast } from 'sonner';

interface ListViewProps {
  files: FileObject[];
  // allowDelete prop might be sourced from context or passed down if needed
}

const ListView: React.FC<ListViewProps> = ({ files }) => {
  const { 
    // If preview or selection logic is needed directly in ListView later:
    // selectFile, 
    // For actions:
    // deleteFile, // deleteFile is complex, better to call from main FileList or a Row component if it needs the full FileObject
    // For now, direct download will be handled here if simple enough
    isLoading, // To disable actions while context is busy
    deleteFile, // Assuming deleteFile expects FileObject
  } = useFiles();

  // Simplified download handler (taken from old FileList, may need context version if more complex)
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
      console.error('Download error in ListView:', error);
      toast.error(`Download failed: ${error.message || 'Unknown error'}`);
    }
  };

  const deleteFileHandler = async (fileToDelete: FileObject) => {
    if (!fileToDelete) return;
    if (confirm(`Are you sure you want to delete ${fileToDelete.name}?`)) {
      try {
        await deleteFile(fileToDelete);
        toast.success(`File "${fileToDelete.name}" deleted.`);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete file.");
      }
    }
  };

  // Columns definition (adapted from old FileList)
  const columns = React.useMemo(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: { row: { original: FileObject } }) => {
        const file = row.original;
        return (
          <div className="flex items-center">
            <div className="mr-2 flex-shrink-0">
              {getFileIcon(file, "h-5 w-5")} 
            </div>
            <span className="truncate" title={file.name}>
              {file.name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "extension",
      header: "Type",
      cell: ({ row }: { row: { original: FileObject } }) => {
        const file = row.original;
        const displayExtension = typeof file.extension === 'string' ? file.extension.toUpperCase() : null;
        return displayExtension || "N/A"; // Folders are filtered out, so no "Folder" text needed
      },
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: ({ row }: { row: { original: FileObject } }) => {
        const file = row.original;
        return (file.size != null ? formatFileSize(file.size) : 'N/A');
      },
    },
    {
      accessorKey: "uploaded_at",
      header: "Date Added",
      cell: ({ row }: { row: { original: FileObject } }) => {
        const file = row.original;
        return file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : 'N/A';
      },
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: FileObject } }) => {
        const file = row.original;
        return (
          <div className="flex items-center justify-end space-x-1">
            <Button variant="ghost" size="icon" onClick={() => downloadFileHandler(file)} title="Download" disabled={isLoading}>
              <DownloadIcon size={16} />
            </Button>
            {/* Assuming allowDelete is implicitly true or managed by a parent/context for simplicity here */}
            <Button variant="ghost" size="icon" onClick={() => deleteFileHandler(file)} title="Delete" className="hover:text-red-500" disabled={isLoading}>
              <Trash2Icon size={16} />
            </Button>
          </div>
        );
      },
    },
  ], [isLoading, downloadFileHandler, deleteFileHandler]); // Added deleteFileHandler to deps

  return (
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
          {files.map((file) => (
            <TableRow key={file.id} className="cursor-pointer hover:bg-muted/50">
              {/* Row click could trigger preview if FileList handles preview state */}
              {columns.map((column) => (
                <TableCell key={column.id || column.accessorKey}>
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
  );
};

export default ListView; 