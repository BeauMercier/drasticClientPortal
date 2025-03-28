'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../shared/ui/molecules';
import { Button, Input } from '../../shared/ui/atoms';
import { useAuth } from '../../features/auth';

// Label component since it's not in the atoms
const Label: React.FC<{
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ htmlFor, children, className = '' }) => (
  <label 
    htmlFor={htmlFor} 
    className={`block text-sm font-medium text-gray-300 mb-1 ${className}`}
  >
    {children}
  </label>
);

interface UserProfileData {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  profileImageUrl: string | null;
}

// Extended user type to handle custom fields
interface ExtendedUser {
  full_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  profile_image_url?: string | null;
}

export default function MyProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData>({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    profileImageUrl: null
  });

  useEffect(() => {
    if (user) {
      // Cast user to ExtendedUser to avoid type errors
      const extendedUser = user as unknown as ExtendedUser;
      
      // Load profile data from user object or API
      setProfileData({
        fullName: extendedUser.full_name || '',
        email: extendedUser.email || '',
        phone: extendedUser.phone || '',
        company: extendedUser.company || '',
        jobTitle: extendedUser.job_title || '',
        profileImageUrl: extendedUser.profile_image_url || null
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Implement API call to save profile data
      console.log('Saving profile data:', profileData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form and exit edit mode
    if (user) {
      // Cast user to ExtendedUser to avoid type errors
      const extendedUser = user as unknown as ExtendedUser;
      
      setProfileData({
        fullName: extendedUser.full_name || '',
        email: extendedUser.email || '',
        phone: extendedUser.phone || '',
        company: extendedUser.company || '',
        jobTitle: extendedUser.job_title || '',
        profileImageUrl: extendedUser.profile_image_url || null
      });
    }
    setIsEditing(false);
  };

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div></div>
        {!isEditing ? (
          <Button
            variant="primary"
            onClick={() => setIsEditing(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            Edit Profile
          </Button>
        ) : (
          <div className="space-x-2">
            <Button
              variant="secondary"
              onClick={handleCancel}
              className="bg-gray-800 hover:bg-gray-900 text-gray-100"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <Card className="lg:col-span-2 bg-black shadow-xl border border-gray-900">
          <h2 className="text-xl font-semibold mb-4 text-white">Personal Information</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              {isEditing ? (
                <Input
                  id="fullName"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              ) : (
                <div className="mt-1 text-gray-300">{profileData.fullName || 'Not provided'}</div>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              {isEditing ? (
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  disabled={true} // Email cannot be changed
                  className="bg-gray-900 border-gray-700 text-white"
                />
              ) : (
                <div className="mt-1 text-gray-300">{profileData.email}</div>
              )}
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              ) : (
                <div className="mt-1 text-gray-300">{profileData.phone || 'Not provided'}</div>
              )}
            </div>
            
            <div>
              <Label htmlFor="company">Company</Label>
              {isEditing ? (
                <Input
                  id="company"
                  name="company"
                  value={profileData.company}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              ) : (
                <div className="mt-1 text-gray-300">{profileData.company || 'Not provided'}</div>
              )}
            </div>
            
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              {isEditing ? (
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  value={profileData.jobTitle}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              ) : (
                <div className="mt-1 text-gray-300">{profileData.jobTitle || 'Not provided'}</div>
              )}
            </div>
          </div>
        </Card>

        {/* Account Options */}
        <Card className="bg-black shadow-xl border border-gray-900">
          <h2 className="text-xl font-semibold mb-4 text-white">Account Settings</h2>
          
          <div className="space-y-4">
            <Button 
              variant="secondary" 
              className="w-full justify-center bg-gray-800 hover:bg-gray-900 text-gray-100"
              onClick={() => console.log('Change password')}
            >
              Change Password
            </Button>
            
            <Button 
              variant="secondary" 
              className="w-full justify-center bg-gray-800 hover:bg-gray-900 text-gray-100"
              onClick={() => console.log('Notification preferences')}
            >
              Notification Preferences
            </Button>
            
            <Button 
              variant="secondary" 
              className="w-full justify-center bg-gray-800 hover:bg-gray-900 text-gray-100"
              onClick={() => console.log('Two-factor authentication')}
            >
              Two-Factor Authentication
            </Button>
            
            <div className="pt-4 border-t border-gray-900">
              <Button 
                variant="danger" 
                className="w-full justify-center"
                onClick={() => console.log('Delete account')}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
} 