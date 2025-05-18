'use client';

import React from 'react';
import BirFileUploader from '@/components/BirFileUploader';
import { BirFileType } from '@/lib/types/bir'; // Assuming BirFileType is here
import { KeyedMutator } from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UseBirData } from '@/features/bir/useBir'; // Added import
import { SignedBirFile } from '@/lib/types/bir'; // Ensure BirFileType is imported if not already
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DownloadIcon, FileTextIcon, ImageIcon, Trash2Icon } from 'lucide-react'; // Assuming these are used
import { useToast } from '@/components/ui/use-toast'; // Corrected path

interface FileUploadStepProps {
  birId: string;
  mutateBir: KeyedMutator<UseBirData>; // Updated type
  uploadedFiles: SignedBirFile[] | null; // New prop for existing files
  onUploadComplete?: () => void; // Optional: callback for when all uploads are done or step is "finished"
  readOnly?: boolean; // New prop for read-only mode
  // Add any other props needed, e.g., for styling or controlling behavior
}

/**
 * FileUploadStep component for the multi-step Business Information Request form.
 * Handles the uploading of various file types related to the BIR.
 *
 * @param birId - The ID of the Business Information Request.
 * @param mutateBir - SWR mutator function to revalidate BIR data after uploads.
 * @param uploadedFiles - New prop for existing files
 * @param onUploadComplete - Optional callback when the user considers this step finished.
 */
const FileUploadStep: React.FC<FileUploadStepProps> = ({ 
  birId, 
  mutateBir,
  uploadedFiles, // Destructure new prop
  onUploadComplete, 
  readOnly = false, // Default to false
}) => {
  const { toast } = useToast(); // Initialize toast

  const handleUploadSuccess = () => {
    mutateBir(); // Call SWR mutate to revalidate/refetch BIR data (including files)
  };

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileMimeType: string | null): React.ReactElement => {
    const type = fileMimeType?.split('/')[0];
    if (type === 'image') {
        return <ImageIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />;
    }
    // Add more specific icons based on mime_type or file_type from BirFileRow if needed
    return <FileTextIcon className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" />;
  };

  const handleDeleteBirFile = async (file: SignedBirFile) => {
    if (!window.confirm('Permanently delete this file?')) return;

    try {
      const res = await fetch(`/api/bir/file/${file.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json();
        // Use toast for error
        toast({
          title: "Error Deleting File",
          description: body?.error || 'Unknown error occurred.',
          variant: "destructive",
        });
        throw new Error(body?.error || 'Unknown error');
      }

      // Use toast for success
      toast({
        title: "File Deleted",
        description: `'${file.original_name}' has been successfully deleted.`,
        variant: "default", // or "success" if you have one
      });
      await mutateBir(); // re-fetch list
    } catch (err) {
      console.error('Failed to delete file:', err);
      // Fallback toast error if not already shown
      if (!(err instanceof Error && err.message.includes('Unknown error'))) { // Avoid double toast if error was from res.json()
        toast({
          title: "Error",
          description: "Failed to delete file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{readOnly ? "View Uploaded Files" : "Upload Supporting Files"}</CardTitle>
        <CardDescription>
          {readOnly 
            ? "These are the files uploaded by the client for this request."
            : "Please upload relevant files such as your company logo, brand style guide, photos, or certifications. Accepted types: Images, PDF, ZIP up to 20 MB each."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!readOnly && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <BirFileUploader birId={birId} fileType={BirFileType.Logo} onUploadSuccess={handleUploadSuccess} />
            <BirFileUploader birId={birId} fileType={BirFileType.StyleGuide} onUploadSuccess={handleUploadSuccess} />
            <BirFileUploader birId={birId} fileType={BirFileType.Photo} onUploadSuccess={handleUploadSuccess} />
            <BirFileUploader birId={birId} fileType={BirFileType.Certificate} onUploadSuccess={handleUploadSuccess} />
            <BirFileUploader birId={birId} fileType={BirFileType.Misc} onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {uploadedFiles && uploadedFiles.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-medium mb-2">Uploaded BIR Files</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium flex items-center">
                      {getFileIcon(file.mime_type)}
                      {file.original_name}
                    </TableCell>
                    <TableCell>{formatFileSize(file.size_bytes)}</TableCell>
                    <TableCell>{file.file_type}</TableCell>
                    <TableCell className="space-x-2">
                      {file.publicUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={file.publicUrl} download={file.original_name} target="_blank" rel="noopener noreferrer">
                            <DownloadIcon className="h-4 w-4 mr-1" /> Download
                          </a>
                        </Button>
                      )}
                      {/* TODO: Enable delete button once implemented */}
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteBirFile(file)}
                        title="Delete file"
                        disabled={readOnly}
                      >
                        <Trash2Icon className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {onUploadComplete && (
           <div className="flex justify-end pt-4">
            <button
                type="button"
                onClick={onUploadComplete}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Finish & Review
            </button>
           </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploadStep; 