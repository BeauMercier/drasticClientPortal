import React from 'react';
import { FileTextIcon, ImageIcon, FolderIcon } from 'lucide-react';

// Define a simpler type for the file parameter, including only what's used by this function
interface GetFileIconFileParam {
  mime_type?: string | null;
  is_folder?: boolean;
  name?: string;
}

export const getFileIcon = (
  file: GetFileIconFileParam, 
  iconSize?: number | string // Tailwind size class like 'h-5 w-5' or number for style prop
): React.ReactElement => {
  let className = "mr-2 flex-shrink-0";
  let style: React.CSSProperties | undefined = undefined;

  if (typeof iconSize === 'string') {
    className = `${className} ${iconSize}`;
  } else if (typeof iconSize === 'number') {
    style = { height: iconSize, width: iconSize };
  }
  // Default size if nothing specific is passed. Match reference from FileUploadStep
  if (!iconSize) {
    className = `${className} h-5 w-5`; 
  }

  if (file.is_folder) {
    return <FolderIcon className={`${className} text-yellow-500`} style={style} aria-label={`Folder: ${file.name}`} />;
  }

  const type = file.mime_type?.split('/')[0];
  if (type === 'image') {
    return <ImageIcon className={`${className} text-blue-500`} style={style} aria-label={`Image file: ${file.name}`} />;
  }
  
  return <FileTextIcon className={`${className} text-gray-500`} style={style} aria-label={`File: ${file.name}`} />;
};

export default getFileIcon; 