'use client';

import { ChangeEvent, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Use Shadcn Input for consistency
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils'; // Assuming you have cn utility
import { BirFileType } from '@/app/api/bir/upload/route'; // Import the enum

interface Props {
  birId: string;
  fileType: BirFileType; // Use the enum type
  onUploadSuccess?: (uploadedFile: any) => void; // Pass uploaded file data back
  className?: string;
  accept?: string; // Allow specifying accepted file types
  disabled?: boolean;
}

export default function BirFileUploader({
  birId,
  fileType,
  onUploadSuccess,
  className,
  accept = 'image/*,application/pdf,.zip', // Default accepted types
  disabled = false,
}: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value to allow re-uploading the same file
    if (inputRef.current) {
      inputRef.current.value = '';
    }

    setUploading(true);

    const form = new FormData();
    form.append('birId', birId);
    form.append('fileType', fileType);
    form.append('file', file);

    try {
      const res = await fetch('/api/bir/upload', { method: 'POST', body: form });
      const result = await res.json();

      if (res.ok) {
        toast({
          title: 'File Uploaded Successfully',
          description: `${file.name}`,
        });
        onUploadSuccess?.(result.file); // Pass back the newly created bir_file record
      } else {
        console.error('Upload failed:', result);
        toast({
          title: 'Upload Failed',
          description: result.error || 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Upload fetch error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Could not connect to the server.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
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
        className="hidden" // Hide the default input
        onChange={handleFileChange}
        ref={inputRef}
        accept={accept}
        disabled={uploading || disabled}
      />
      {/* Use Button component as the visible trigger */}
      <Button
        type="button"
        variant="outline" // Or adjust variant as needed
        onClick={() => inputRef.current?.click()} // Trigger hidden input click
        disabled={uploading || disabled}
        aria-label={`Upload ${buttonLabel}`}
      >
        {uploading ? 'Uploading...' : `Upload ${buttonLabel}`}
      </Button>
      {/* Optional: Display selected file name or progress here */}
    </div>
  );
} 