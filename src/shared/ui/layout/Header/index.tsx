'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/api/client';
import { getUserProfile } from '@/lib/api/client-api';
import { useAuth } from '@/features/auth';
import { usePathname } from 'next/navigation';

// Import sub-components
import PageTitle from './PageTitle';
import ActionButton from './ActionButton';
import NotificationsMenu from './NotificationsMenu';
import UserProfileMenu from './UserProfileMenu';

export default function Header() {
  const { session } = useAuth();
  const pathname = usePathname();
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  // Get project title when path changes
  useEffect(() => {
    if (pathname?.includes('/projects/')) {
      const parts = pathname.split('/');
      const projectId = parts[parts.length - 1];
      // Use proper typing for the parameter
      // const project = mockProjects.find(p => p.id === projectId);
      // if (project) {
      //   setProjectTitle(project.name);
      // }
      
      // Just use the ID until we implement a proper project service
      setProjectTitle(`Project ${projectId}`);
    } else {
      setProjectTitle(null);
    }
  }, [pathname]);

  // Fetch user profile to get avatar URL
  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) return;
      
      try {
        const profile = await getUserProfile();
        if (profile?.avatar_url) {
          setUserAvatarUrl(profile.avatar_url);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    }
    
    loadProfile();
  }, [session?.user?.id]);

  // Create a hidden file input reference
  const openFileUpload = () => {
    // Create a temporary file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.click();
    
    // Handle the file selection
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && target.files && target.files.length > 0) {
        // Dispatch a custom event with the selected files
        const event = new CustomEvent('file-upload-selected', { 
          detail: { files: Array.from(target.files) } 
        });
        window.dispatchEvent(event);
      }
    };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="h-[72px] flex items-center justify-between w-full px-6">
        {/* Separate border div for better control */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-400"></div>
        <div className="flex items-center">
          {/* Page title */}
          <PageTitle projectTitle={projectTitle} />
        </div>

        <div className="flex items-center space-x-4">
          {/* Action Button based on current page */}
          <ActionButton onUploadFile={openFileUpload} />
          
          {/* Notifications */}
          <NotificationsMenu />

          {/* User Profile */}
          <UserProfileMenu 
            userAvatarUrl={userAvatarUrl}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  );
}
