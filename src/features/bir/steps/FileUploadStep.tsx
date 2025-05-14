'use client';

import React from 'react';
import BirFileUploader from '@/components/BirFileUploader';
import { BirFileType } from '@/lib/types/bir'; // Assuming BirFileType is here
import { KeyedMutator } from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UseBirData } from '@/features/bir/useBir'; // Added import

interface FileUploadStepProps {
  birId: string;
  mutateBir: KeyedMutator<UseBirData>; // Updated type
  onUploadComplete?: () => void; // Optional: callback for when all uploads are done or step is "finished"
  // Add any other props needed, e.g., for styling or controlling behavior
}

/**
 * FileUploadStep component for the multi-step Business Information Request form.
 * Handles the uploading of various file types related to the BIR.
 *
 * @param birId - The ID of the Business Information Request.
 * @param mutateBir - SWR mutator function to revalidate BIR data after uploads.
 * @param onUploadComplete - Optional callback when the user considers this step finished.
 */
const FileUploadStep: React.FC<FileUploadStepProps> = ({ 
  birId, 
  mutateBir,
  onUploadComplete 
}) => {
  // TODO: Potentially manage loading states for individual uploaders or overall step

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Supporting Files</CardTitle>
        <CardDescription>
          Please upload relevant files such as your company logo, brand style guide, photos, or certifications.
          Accepted types: Images, PDF, ZIP up to 20 MB each.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <BirFileUploader birId={birId} fileType={BirFileType.Logo} onUploadSuccess={mutateBir} />
          <BirFileUploader birId={birId} fileType={BirFileType.StyleGuide} onUploadSuccess={mutateBir} />
          <BirFileUploader birId={birId} fileType={BirFileType.Photo} onUploadSuccess={mutateBir} />
          <BirFileUploader birId={birId} fileType={BirFileType.Certificate} onUploadSuccess={mutateBir} />
          <BirFileUploader birId={birId} fileType={BirFileType.Misc} onUploadSuccess={mutateBir} />
        </div>
        
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