'use client';

import { useState, useEffect, ChangeEvent, useRef } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { 
  UserIcon, 
  GlobeAltIcon, 
  ChartBarIcon, 
  FolderIcon, 
  QuestionMarkCircleIcon,
  PencilIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { getUserProfile, updateUserProfile, uploadProfilePicture } from '@/lib/api/client-api';
import supabase from '@/lib/api/client';
import { Card } from '@/shared/ui/molecules';
import { useAuthContext } from '@/features/auth/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import EditProfileView from './EditProfileView';

export default function MyProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    phone: '',
    mobile: '',
    preferredContact: 'Email',
    address: '',
    city: '',
    state: '',
    zip: '',
    company: '',
    position: '',
    businessWebsite: '',
    avatar_url: '',
    website_dashboard_url: ''
  });
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    mobile: '',
    preferredContact: 'Email',
    address: '',
    city: '',
    state: '',
    zip: '',
    company: '',
    position: '',
    businessWebsite: '',
    avatar_url: ''
  });

  const { user, updateProfile: updateAuthContextProfile } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const profile = await getUserProfile();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (profile) {
          const loadedData = {
            full_name: profile.full_name || '',
            email: authUser?.email || '', 
            phone: profile.phone || '',
            mobile: profile.mobile || '',
            preferredContact: profile.preferred_contact || 'Email',
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            zip: profile.zip || '',
            company: profile.company || '',
            position: profile.position || '',
            businessWebsite: profile.business_website || '',
            avatar_url: profile.avatar_url || '',
            website_dashboard_url: profile.website_dashboard_url || ''
          };
          setUserData(loadedData);
          const initialFormData = { ...loadedData };
          delete (initialFormData as any).email; 
          delete (initialFormData as any).website_dashboard_url;
          setFormData(initialFormData);
          
          if (profile.avatar_url) {
            setProfilePhotoUrl(profile.avatar_url);
          }
        }
      } catch (error) {
        setError('Failed to load profile information. Please try again later.');
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
        loadProfile();
    } else {
        setIsLoading(false);
    }
  }, [user, toast]);

  const handleEditClick = () => {
    setIsEditing(true);
    const currentFormData = { ...userData };
    delete (currentFormData as any).email;
    delete (currentFormData as any).website_dashboard_url;
    setFormData(currentFormData);
    setProfilePhotoUrl(userData.avatar_url || null); 
    setProfilePhoto(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfilePhoto(null);
    if (userData.avatar_url) {
      setProfilePhotoUrl(userData.avatar_url);
    } else {
      setProfilePhotoUrl(null);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePhoto(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      let finalAvatarUrl = formData.avatar_url;

      if (profilePhoto) {
        try {
          const photoResult = await uploadProfilePicture(profilePhoto);
          if (photoResult && photoResult.avatar_url) {
            finalAvatarUrl = photoResult.avatar_url;
          } else {
             throw new Error("Photo upload did not return a URL.");
          }
        } catch (photoError) {
          toast({
            title: "Error",
            description: "Failed to upload profile photo. Please try again.",
            variant: "destructive",
          });
          setIsSaving(false);
          return; 
        }
      }
      
      const profileUpdates = {
        full_name: formData.full_name,
        phone: formData.phone,
        mobile: formData.mobile,
        preferred_contact: formData.preferredContact,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        company: formData.company,
        position: formData.position,
        business_website: formData.businessWebsite,
        avatar_url: finalAvatarUrl
      };
      
      const updatedProfile = await updateUserProfile(profileUpdates);

      setUserData(prev => ({
          ...prev,
          ...profileUpdates,
          avatar_url: finalAvatarUrl
      }));
      setProfilePhotoUrl(finalAvatarUrl);

      if (updateAuthContextProfile) {
         updateAuthContextProfile({ 
             full_name: profileUpdates.full_name, 
             avatar_url: finalAvatarUrl 
         });
      }

      toast({ title: "Success", description: "Profile updated successfully!" });
      setIsEditing(false);
      setProfilePhoto(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during update.";
      setError(`Failed to update profile: ${errorMessage}`);
      toast({
        title: "Error",
        description: `Failed to save profile changes: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const renderMyInfoContent = () => {
     if (isLoading) {
      return (
        <div className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg shadow min-h-[300px]"> 
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-8">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    if (error) {
        return <div className="p-6 text-red-500">Error: {error}</div>;
    }

    if (isEditing) {
      return (
        <EditProfileView
          formData={formData}
          handleInputChange={handleInputChange}
          handleCancelEdit={handleCancelEdit}
          handleSubmit={handleSubmit}
          isSaving={isSaving}
          profilePhotoUrl={profilePhotoUrl}
          handlePhotoClick={handlePhotoClick}
          handlePhotoChange={handlePhotoChange}
          fileInputRef={fileInputRef}
        />
      );
    }

    return (
      <Card title="My Info" icon={
        <Button onClick={handleEditClick} size="sm" variant="outline" className="flex items-center gap-2">
          <PencilIcon className="h-4 w-4" />
          Edit info
        </Button>
      }>
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
               <div className="flex-shrink-0 mr-4">
                 <Avatar className="h-16 w-16 border-2 border-gray-200 dark:border-gray-700">
                   <AvatarImage src={profilePhotoUrl || undefined} alt={userData.full_name || 'User'} />
                   <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400">
                      <UserIcon className="h-8 w-8" />
                   </AvatarFallback>
                 </Avatar>
               </div>
               <div>
                 <h2 className="text-xl font-semibold text-gray-900 dark:text-white">About You</h2>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Personal details and information</p>
               </div>
             </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6"> 
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{userData.full_name || <span className="text-gray-500 dark:text-gray-500 italic">Not provided</span>}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</p>
              <div className="flex items-center mt-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{userData.email || <span className="text-gray-500 dark:text-gray-500 italic">Not provided</span>}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone Number</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{userData.phone || <span className="text-gray-500 dark:text-gray-500 italic">Not provided</span>}</p>
            </div>
             <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mobile Number</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{userData.mobile || <span className="text-gray-500 dark:text-gray-500 italic">Not provided</span>}</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preferred Contact</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{userData.preferredContact}</p>
            </div>
             <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Country</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">United States</p> 
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{userData.company || <span className="text-gray-500 dark:text-gray-500 italic">Not provided</span>}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Position</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{userData.position || <span className="text-gray-500 dark:text-gray-500 italic">Not provided</span>}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Business Website</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {userData.businessWebsite ? (
                  <a href={userData.businessWebsite.startsWith('http') ? userData.businessWebsite : `https://${userData.businessWebsite}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                    {userData.businessWebsite}
                  </a>
                ) : <span className="text-gray-500 dark:text-gray-500 italic">Not provided</span>}
              </p>
            </div>

            <div></div> 
          </div>
      </Card>
    );
  };

  const renderDashboardCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 p-6 hover:shadow-lg transition-shadow border border-gray-700 text-white">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center">
                <GlobeAltIcon className="h-6 w-6 text-blue-300" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Website Dashboard</h3>
              <p className="mt-1 text-sm text-gray-400">
                Access your website analytics and performance metrics
              </p>
              <div className="mt-4">
                 <Button asChild variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                     {userData.website_dashboard_url ? (
                         <a href={userData.website_dashboard_url} target="_blank" rel="noopener noreferrer">
                             Go to Dashboard
                         </a>
                     ) : (
                         <Link href="/dashboard/website"> 
                             Go to Dashboard 
                         </Link> 
                     )}
                 </Button>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gray-800 p-6 hover:shadow-lg transition-shadow border border-gray-700 text-white">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-green-900 flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-green-300" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lead Dashboard</h3>
              <p className="mt-1 text-sm text-gray-400">
                View and manage your leads and customer inquiries
              </p>
              <div className="mt-4">
                 <Button asChild variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                     <a href="https://Leads.DrasticDigital.com" target="_blank" rel="noopener noreferrer">
                         Go to Dashboard
                     </a>
                 </Button>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gray-800 p-6 hover:shadow-lg transition-shadow border border-gray-700 text-white">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-purple-900 flex items-center justify-center">
                <FolderIcon className="h-6 w-6 text-purple-300" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project Files</h3>
              <p className="mt-1 text-sm text-gray-400">
                Access all your project files and documents
              </p>
              <div className="mt-4">
                 <Button asChild variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                     <Link href="/client/files"> 
                         Browse Files
                     </Link> 
                 </Button>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gray-800 p-6 hover:shadow-lg transition-shadow border border-gray-700 text-white">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-amber-900 flex items-center justify-center">
                <QuestionMarkCircleIcon className="h-6 w-6 text-amber-300" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Support</h3>
              <p className="mt-1 text-sm text-gray-400">
                Get help from our support team or browse documentation
              </p>
              <div className="mt-4">
                 <Button asChild variant="default" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Link href="/support"> 
                        Contact Support
                    </Link>
                 </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };
  
  return (
    <div className="w-full space-y-6"> 
      {error && (
        <div className="bg-red-900 border-l-4 border-red-500 p-4 mb-4 rounded-md text-red-100">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {renderMyInfoContent()} 
        
      {renderDashboardCards()}
    </div>
  );
} 