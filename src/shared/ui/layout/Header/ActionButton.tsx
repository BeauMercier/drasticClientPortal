import Link from 'next/link';
import { usePathname } from 'next/navigation';

type ActionButtonProps = {
  onUploadFile?: () => void;
};

/**
 * Component that displays contextual action buttons based on the current page
 */
export default function ActionButton({ onUploadFile }: ActionButtonProps) {
  const pathname = usePathname();
  
  // Display upload button on files page
  if (pathname === '/files' && onUploadFile) {
    return (
      <button 
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md flex items-center"
        onClick={onUploadFile}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        Upload New File
      </button>
    );
  }
  
  // View All Files button on project pages
  if (pathname?.includes('/projects/') && pathname !== '/projects') {
    return (
      <Link 
        href="/files" 
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        View All Files
      </Link>
    );
  }
  
  // Website management action button
  if (pathname?.includes('/management/website')) {
    return (
      <button 
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
      >
        Request Website Update
      </button>
    );
  }
  
  // Google Ads action button
  if (pathname?.includes('/management/google-ads')) {
    return (
      <button 
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
      >
        Create New Campaign
      </button>
    );
  }
  
  // Analytics action button
  if (pathname?.includes('/management/analytics')) {
    return (
      <button 
        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
      >
        Export Report
      </button>
    );
  }
  
  // No action button for other pages
  return null;
}
