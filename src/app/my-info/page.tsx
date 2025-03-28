'use client';

import { useState, useEffect, ChangeEvent, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
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
import { Card } from '../../shared/ui/molecules';

export default function MyInfoPage() {
  const [activeTab, setActiveTab] = useState('myInfo');
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

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      setError(null);
      try {
        // Get user profile directly
        const profile = await getUserProfile();
        // Get the current user's email from auth
        const { data: { user } } = await supabase.auth.getUser();
        
        if (profile) {
          setUserData({
            full_name: profile.full_name || '',
            email: user?.email || '', // Use email from auth user
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
          });
          setFormData({
            full_name: profile.full_name || '',
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
            avatar_url: profile.avatar_url || ''
          });
          
          if (profile.avatar_url) {
            setProfilePhotoUrl(profile.avatar_url);
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        setError('Failed to load profile information. Please try again later.');
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleEditClick = () => {
    setIsEditing(true);
    setFormData({ ...userData });
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
      
      // Create a preview URL
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
      console.log("Starting profile update process");
      let updatedProfile;
      
      // First upload profile photo if changed
      if (profilePhoto) {
        try {
          console.log("Uploading new profile photo");
          const photoResult = await uploadProfilePicture(profilePhoto);
          console.log("Photo uploaded successfully:", photoResult);
          
          if (photoResult && photoResult.avatar_url) {
            formData.avatar_url = photoResult.avatar_url;
          }
        } catch (photoError) {
          console.error("Error uploading profile photo:", photoError);
          toast.error('Failed to upload profile photo');
          // Continue with the rest of the profile update
        }
      }
      
      // Prepare profile updates
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
        business_website: formData.businessWebsite
      };
      
      console.log("Profile updates to send:", profileUpdates);
      
      try {
        // Update profile using our consolidated API function
        updatedProfile = await updateUserProfile(profileUpdates);
        console.log("Profile updated successfully:", updatedProfile);
        toast.success('Profile updated successfully!');
      } catch (apiError) {
        console.error("API Error:", apiError);
        setError('Failed to update profile information. Please try again later.');
        toast.error('Could not save profile changes.');
        return;
      }
      
      // Update local state
      setUserData({
        ...userData,
        ...formData,
        avatar_url: updatedProfile.avatar_url || userData.avatar_url,
        website_dashboard_url: updatedProfile.website_dashboard_url || userData.website_dashboard_url
      });
      
      // Update the profile photo URL if it was changed
      if (updatedProfile.avatar_url) {
        setProfilePhotoUrl(updatedProfile.avatar_url);
      }
      
      setIsEditing(false);
      setProfilePhoto(null);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to update profile. Please try again later.');
      toast.error('Failed to update profile. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Render my information tab content
  const renderMyInfoContent = () => {
    if (isLoading) {
      return (
        <div className="p-6">
          <div className="flex items-start mb-8">
            <div className="flex-shrink-0 mr-4">
              <div className="bg-gray-200 rounded-full h-16 w-16 animate-pulse">
              </div>
            </div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {[...Array(10)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                  <div className="h-5 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    if (isEditing) {
      return (
        <div className="p-6">
          <div className="flex items-start mb-8">
            <div className="flex-shrink-0 mr-4">
              {/* Photo upload section */}
              <div 
                onClick={handlePhotoClick}
                className="relative bg-gray-100 rounded-full h-20 w-20 flex items-center justify-center cursor-pointer group overflow-hidden"
              >
                {profilePhotoUrl ? (
                  <img 
                    src={profilePhotoUrl} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-10 w-10 text-gray-500" />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <CameraIcon className="h-6 w-6 text-white" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="hidden" 
                />
              </div>
              <p className="text-xs text-center mt-2 text-gray-600">Click to change</p>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium text-gray-900">About {userData.full_name}</h2>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Personal details and information</p>
            </div>
          </div>
          
          {/* Form Fields */}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base py-3 px-4"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userData.email}
                    disabled
                    className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-base py-3 px-4 text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => window.alert('Email change functionality coming soon')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                  >
                    Change
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Email address requires verification to change</p>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base py-3 px-4"
                  placeholder="Your phone number"
                />
              </div>
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base py-3 px-4"
                  placeholder="Your mobile number"
                />
              </div>
              <div>
                <label htmlFor="preferredContact" className="block text-sm font-medium text-gray-700 mb-1">Preferred Contact</label>
                <select
                  id="preferredContact"
                  name="preferredContact"
                  value={formData.preferredContact}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base py-3 px-4"
                >
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  id="country"
                  name="country"
                  className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base py-3 px-4"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base py-3 px-4"
                  placeholder="Your company name"
                />
              </div>
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base py-3 px-4"
                  placeholder="Your job position"
                />
              </div>
              <div>
                <label htmlFor="businessWebsite" className="block text-sm font-medium text-gray-700 mb-1">Business Website</label>
                <input
                  type="url"
                  id="businessWebsite"
                  name="businessWebsite"
                  value={formData.businessWebsite}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base py-3 px-4"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base py-3 px-4"
                    placeholder="Your street address"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base py-3 px-4"
                    placeholder="Your city"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base py-3 px-4"
                    placeholder="Your state"
                  />
                </div>
                <div>
                  <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
                  <input
                    type="text"
                    id="zip"
                    name="zip"
                    value={formData.zip}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base py-3 px-4"
                    placeholder="Your ZIP code"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      );
    } else {
      return (
        <div className="p-6">
          <div className="flex items-start mb-8">
            <div className="flex-shrink-0 mr-4">
              <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center overflow-hidden">
                {profilePhotoUrl ? (
                  <img 
                    src={profilePhotoUrl} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-8 w-8 text-gray-500" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-medium text-gray-900">About {userData.full_name || 'You'}</h2>
                  <p className="text-sm text-gray-600 mt-1">Personal details and information</p>
                </div>
                <button 
                  onClick={handleEditClick}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4 inline mr-1 text-gray-500" />
                  Edit Info
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h3 className="text-sm text-gray-700">Full Name</h3>
                <p className="mt-1 text-sm font-medium text-gray-900">{userData.full_name || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-700">Email</h3>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-medium text-gray-900">{userData.email || 'Not provided'}</p>
                  <button 
                    onClick={() => window.alert('Email change functionality coming soon')}
                    className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Change
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-sm text-gray-700">Phone Number</h3>
                <p className="mt-1 text-sm font-medium text-gray-900">{userData.phone || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-700">Mobile Number</h3>
                <p className="mt-1 text-sm font-medium text-gray-900">{userData.mobile || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-700">Preferred Contact</h3>
                <p className="mt-1 text-sm font-medium text-gray-900">{userData.preferredContact}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-700">Country</h3>
                <p className="mt-1 text-sm font-medium text-gray-900">United States</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-700">Company</h3>
                <p className="mt-1 text-sm font-medium text-gray-900">{userData.company || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-700">Position</h3>
                <p className="mt-1 text-sm font-medium text-gray-900">{userData.position || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-700">Business Website</h3>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {userData.businessWebsite ? (
                    <a href={userData.businessWebsite} target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:text-gray-700 hover:underline">
                      {userData.businessWebsite}
                    </a>
                  ) : 'Not provided'}
                </p>
              </div>
            </div>

            {userData.address && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Address</h3>
                <p className="text-sm text-gray-900">{userData.address}</p>
                {userData.city && userData.state && (
                  <p className="text-sm text-gray-900">{userData.city}, {userData.state} {userData.zip}</p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  // Render my files tab content
  const renderMyFilesContent = () => {
    return (
      <div className="p-6">
        <div className="flex items-start mb-8">
          <div className="flex-shrink-0 mr-4">
            <div className="bg-indigo-100 rounded-full p-3 h-16 w-16 flex items-center justify-center">
              <FolderIcon className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-medium text-gray-900">My Files</h2>
            <p className="text-sm text-gray-600 mt-1">Access and manage all your project files</p>
          </div>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-lg mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">Quick access to your most recent files</p>
          <Link href="/files" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline">
            View all files
          </Link>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">No recent files found.</p>
          <Link
            href="/files"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Browse All Files
          </Link>
        </div>
      </div>
    );
  };

  // Render billing tab content
  const renderBillingContent = () => {
    return (
      <div className="p-6">
        <div className="flex items-start mb-8">
          <div className="flex-shrink-0 mr-4">
            <div className="bg-emerald-100 rounded-full p-3 h-16 w-16 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-medium text-gray-900">Billing</h2>
            <p className="text-sm text-gray-600 mt-1">Manage your billing information and payment methods</p>
          </div>
        </div>
        
        <div className="bg-emerald-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Current Plan</p>
              <p className="text-sm text-gray-600">Basic Plan</p>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
              Upgrade Plan
            </button>
          </div>
        </div>
        
        <h3 className="text-sm font-medium text-gray-900 mb-4">Payment Methods</h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">No payment methods found.</p>
          <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
            Add Payment Method
          </button>
        </div>
      </div>
    );
  };

  // Render dashboard cards
  const renderDashboardCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Website Dashboard card */}
        <Card className="bg-white p-6 hover:shadow-md transition-shadow border border-gray-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <GlobeAltIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Website Dashboard</h3>
              <p className="mt-1 text-sm text-gray-600">
                Access your website analytics and performance metrics
              </p>
              <div className="mt-4">
                {userData.website_dashboard_url ? (
                  <a
                    href={userData.website_dashboard_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to Dashboard
                  </a>
                ) : (
                  <Link
                    href="/dashboard/website"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Lead Dashboard card */}
        <Card className="bg-white p-6 hover:shadow-md transition-shadow border border-gray-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Lead Dashboard</h3>
              <p className="mt-1 text-sm text-gray-600">
                View and manage your leads and customer inquiries
              </p>
              <div className="mt-4">
                <a
                  href="https://Leads.DrasticDigital.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Project Files card */}
        <Card className="bg-white p-6 hover:shadow-md transition-shadow border border-gray-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FolderIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Project Files</h3>
              <p className="mt-1 text-sm text-gray-600">
                Access all your project files and documents
              </p>
              <div className="mt-4">
                <Link
                  href="/files"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Browse Files
                </Link>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Support card */}
        <Card className="bg-white p-6 hover:shadow-md transition-shadow border border-gray-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <QuestionMarkCircleIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Support</h3>
              <p className="mt-1 text-sm text-gray-600">
                Get help from our support team or browse documentation
              </p>
              <div className="mt-4">
                <Link
                  href="/support"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };
  
  return (
    <div className="w-full p-6 space-y-6">
      {/* Error display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    
      <main className="p-6 space-y-6">
        {/* User information card */}
        <Card className="bg-white shadow-md border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'myInfo' 
                    ? 'border-red-500 text-red-500' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('myInfo')}
              >
                My Info
              </button>
              <button
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'myFiles' 
                    ? 'border-red-500 text-red-500' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('myFiles')}
              >
                My Files
              </button>
              <button
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'billing' 
                    ? 'border-red-500 text-red-500' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('billing')}
              >
                Billing
              </button>
            </div>
          </div>
          
          {/* Tab content */}
          {activeTab === 'myInfo' && renderMyInfoContent()}
          {activeTab === 'myFiles' && renderMyFilesContent()}
          {activeTab === 'billing' && renderBillingContent()}
        </Card>
        
        {/* Dashboard cards - visible in all tabs */}
        {renderDashboardCards()}
      </main>
    </div>
  );
} 