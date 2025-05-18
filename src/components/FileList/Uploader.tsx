'use client';

import React, { useRef } from 'react';
import { useFiles } from '@/shared/contexts/FileContext';
import { Button, ButtonProps } from '@/components/ui/button'; // Assuming ShadCN Button
import { UploadCloudIcon } from 'lucide-react';
import { toast } from 'sonner';

interface UploaderProps {
  variant?: ButtonProps['variant']; // 'default', 'outline', 'secondary', etc.
  size?: ButtonProps['size'];
  className?: string;
  buttonText?: string; // e.g., "Upload" or "Upload Files"
  showIcon?: boolean;
}

const Uploader: React.FC<UploaderProps> = ({ 
  variant = 'outline', 
  size = 'sm', 
  className,
  buttonText = 'Upload',
  showIcon = true,
}) => {
  const { uploadFile, isLoading } = useFiles(); // currentFolder removed
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      // toast.info(`Starting upload of ${selectedFiles.length} file(s)...`);
      for (let i = 0; i < selectedFiles.length; i++) {
        try {
          // uploadFile in context now handles its own path logic
          await uploadFile(selectedFiles[i]);
        } catch (uploadError: any) {
          // Context's uploadFile should ideally handle its own errors and toasts.
          // This is a fallback or for additional logging if needed.
          console.error("Upload failed in Uploader component for file:", selectedFiles[i].name, uploadError);
          // toast.error(`Upload failed for ${selectedFiles[i].name}: ${uploadError.message || 'Unknown error'}`);
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear input
      }
    }
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        onClick={handleUploadButtonClick} 
        disabled={isLoading}
        className={className}
      >
        {showIcon && <UploadCloudIcon className={`mr-2 h-${size === 'lg' ? '5' : '4'} w-${size === 'lg' ? '5' : '4'}`} />}
        {buttonText}
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelected}
        multiple
        disabled={isLoading}
      />
    </>
  );
};

export default Uploader; 