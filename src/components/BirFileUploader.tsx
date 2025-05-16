'use client';

import { ChangeEvent, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Use Shadcn Input for consistency
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils'; // Assuming you have cn utility
import { BirFileType, BirFileRow } from '@/lib/types/bir'; // Import from the new shared location

interface Props {
  birId: string;
  fileType: BirFileType; // This might be used to categorize on client or passed to record-file if needed
  onUploadSuccess?: (uploadedFile: BirFileRow) => void;
  className?: string;
  accept?: string;
  disabled?: boolean;
}

export default function BirFileUploader({
  birId,
  fileType, // Keep fileType prop for potential future use or if needed by record-file
  onUploadSuccess,
  className,
  accept = 'image/*,application/pdf,.zip,.txt', // Added .txt to default accepted types
  disabled = false,
}: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let allUploadsSuccessful = true;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Step 1: Get the signed URL from our backend
        const createUrlResponse = await fetch('/api/bir/create-upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birId: birId,
            filename: file.name,
            mime: file.type || 'application/octet-stream'
          }),
        });

        if (!createUrlResponse.ok) {
          const errorResult = await createUrlResponse.json().catch(() => ({ error: "Failed to get signed URL", details: createUrlResponse.statusText }));
          throw new Error(errorResult.error || `Failed to get signed URL for ${file.name}: ${errorResult.details}`);
        }

        const { uploadUrl, objectKey } = await createUrlResponse.json();

        // Step 2: Upload the file directly to Supabase Storage
        const uploadToStorageResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        });

        if (!uploadToStorageResponse.ok) {
          throw new Error(`Storage upload failed for ${file.name}: ${uploadToStorageResponse.statusText} (status: ${uploadToStorageResponse.status})`);
        }

        // Step 3: Record the file metadata in our database
        const recordFileResponse = await fetch('/api/bir/record-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birId: birId,
            objectKey: objectKey,
            size: file.size,
            mime: file.type || 'application/octet-stream',
            originalName: file.name,
            fileType: fileType,
          }),
        });

        if (!recordFileResponse.ok) {
          const errorResult = await recordFileResponse.json().catch(() => ({ error: "Failed to record file metadata", details: recordFileResponse.statusText }));
          throw new Error(errorResult.error || `Failed to record file metadata for ${file.name}: ${errorResult.details}`);
        }

        const recordedFileResult = await recordFileResponse.json();

        toast({
          title: 'File Uploaded Successfully',
          description: `${file.name}`,
        });

        if (recordedFileResult.file) {
          onUploadSuccess?.(recordedFileResult.file as BirFileRow);
        } else {
          console.warn(`record-file API did not return the file object for ${file.name}. onUploadSuccess might not have detailed data.`);
        }

      } catch (error: any) {
        allUploadsSuccessful = false;
        console.error(`Upload process error for ${file.name}:`, error);
        toast({
          title: `Upload Failed for ${file.name}`,
          description: error.message || 'An unknown error occurred during upload.',
          variant: 'destructive',
        });
        // Optionally, break the loop if one file fails, or continue trying others
        // For now, it continues.
      }
    }

    if (inputRef.current) {
      inputRef.current.value = ''; // Reset input after all files are processed
    }
    setUploading(false);

    if (allUploadsSuccessful && files.length > 0) {
      // This callback might need adjustment if it's intended for overall success.
      // For now, onUploadSuccess is called for each successful file.
      // If a general "all done" notification is needed, that's a separate consideration.
    }
  };

  // Map file type enum to human-readable label
  const getButtonLabel = (type: BirFileType) => {
    switch (type) {
      case BirFileType.Logo: return 'Logo';
      case BirFileType.StyleGuide: return 'Style Guide';
      case BirFileType.Photo: return 'Photo/Asset';
      case BirFileType.Certificate: return 'Certificate/License';
      case BirFileType.Misc: return 'Miscellaneous';
      default: return 'File';
    }
  };

  const buttonLabel = getButtonLabel(fileType);
  const inputId = `${fileType}-upload-${birId}`;

  return (
    <div className={cn('flex flex-col items-start', className)}>
      <Input
        id={inputId}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        ref={inputRef}
        accept={accept} // Use the accept prop
        disabled={uploading || disabled}
        multiple // Allow multiple file selection
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || disabled}
        aria-label={`Upload ${buttonLabel}`}
      >
        {uploading ? 'Uploading...' : `Upload ${buttonLabel}`}
      </Button>
    </div>
  );
} 