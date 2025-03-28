import { usePathname } from 'next/navigation';
import Link from 'next/link';

type PageTitleProps = {
  projectTitle?: string | null;
};

/**
 * Component that displays the current page title based on the URL path
 */
export default function PageTitle({ projectTitle }: PageTitleProps) {
  const pathname = usePathname();
  
  // Get page title based on current path
  const getPageTitle = () => {
    // If we have a project title, use it directly
    if (projectTitle && pathname?.includes('/projects/')) {
      return projectTitle;
    }
    
    const pathSegments = pathname?.split('/').filter(Boolean) || ['dashboard'];
    const mainPath = pathSegments[0];
    
    // Handle admin section with special breadcrumb navigation
    if (mainPath === 'admin') {
      const subPath = pathSegments[1];
      
      if (subPath === 'users') return 'User Management';
      if (subPath === 'projects') return 'Project Management';
      if (subPath === 'billing') return 'Billing Center';
      if (subPath === 'support') return 'Support Tickets';
      if (subPath === 'designers') return 'Designer Workload';
      if (subPath === 'settings') return 'System Settings';
      
      return 'Admin Dashboard';
    }
    
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard',
      'files': 'My Files',
      'my-info': 'My Information',
      'support': 'Support',
      'billing': 'Billing & Payments',
      'business-profile': 'Business Profile',
      'business': 'Business Profile',
      'projects': 'Projects',
      'management': 'Management'
    };
    
    if (pathname?.includes('/management/')) {
      const subpath = pathSegments[1];
      if (subpath === 'website') return 'Website Management';
      if (subpath === 'google-ads') return 'Google Ads';
      if (subpath === 'analytics') return 'Analytics';
    }
    
    return titles[mainPath] || 'Dashboard';
  };

  // Determine if we need to show breadcrumb navigation
  const showBreadcrumb = () => {
    if (!pathname) return false;
    
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // For admin section with subpages
    if (pathSegments[0] === 'admin' && pathSegments.length > 1) {
      return true;
    }
    
    // For other sections with subpages
    if (pathSegments.length > 1 && pathSegments[0] !== 'dashboard') {
      return true;
    }
    
    return false;
  };
  
  // Get breadcrumb items based on the current path
  const getBreadcrumbs = () => {
    if (!pathname) return [];
    
    const pathSegments = pathname.split('/').filter(Boolean);
    
    if (pathSegments.length === 0) {
      return [{ label: 'Dashboard', href: '/' }];
    }
    
    const breadcrumbs = [];
    
    // First segment (always present if we have a path)
    const firstSegment = pathSegments[0];
    
    if (firstSegment === 'admin') {
      breadcrumbs.push({ label: 'Admin', href: '/admin' });
      
      // Handle second segment if present
      if (pathSegments.length > 1) {
        const secondSegment = pathSegments[1];
        let label = '';
        
        // Map segment to readable label
        switch (secondSegment) {
          case 'users':
            label = 'User Management';
            break;
          case 'projects':
            label = 'Project Management';
            break;
          case 'billing':
            label = 'Billing Center';
            break;
          case 'support':
            label = 'Support Tickets';
            break;
          case 'designers':
            label = 'Designer Workload';
            break;
          case 'settings':
            label = 'System Settings';
            break;
          default:
            label = secondSegment.charAt(0).toUpperCase() + secondSegment.slice(1);
        }
        
        breadcrumbs.push({
          label,
          href: `/admin/${secondSegment}`
        });
      }
    } else {
      // Handle other paths
      const mainLabel = 
        firstSegment === 'dashboard' ? 'Dashboard' :
        firstSegment === 'files' ? 'My Files' :
        firstSegment === 'projects' ? 'Projects' :
        firstSegment === 'management' ? 'Management' :
        firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
      
      breadcrumbs.push({
        label: mainLabel,
        href: `/${firstSegment}`
      });
      
      // Add additional breadcrumbs for deeper paths if needed
      if (pathSegments.length > 1 && pathSegments[0] !== 'admin') {
        // Add specific handling here for other sections as needed
      }
    }
    
    return breadcrumbs;
  };
  
  const pageTitle = getPageTitle();
  const breadcrumbs = getBreadcrumbs();
  const hasBreadcrumbs = showBreadcrumb();
  
  return (
    <div>
      {hasBreadcrumbs && (
        <div className="flex items-center gap-1 text-gray-400 mb-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center">
              {index > 0 && <span className="mx-1">›</span>}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-white font-medium">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-white transition-colors">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </div>
      )}
      <h1 className="text-2xl font-semibold text-white">{pageTitle}</h1>
    </div>
  );
}
