'use client';

import { ChangeEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CameraIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface EditProfileViewProps {
  formData: any;
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleCancelEdit: () => void;
  handleSubmit: () => void;
  isSaving: boolean;
  profilePhotoUrl: string | null;
  handlePhotoClick: () => void;
  handlePhotoChange: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function EditProfileView({
  formData,
  handleInputChange,
  handleCancelEdit,
  handleSubmit,
  isSaving,
  profilePhotoUrl,
  handlePhotoClick,
  handlePhotoChange,
  fileInputRef,
}: EditProfileViewProps) {
  const userInitial = (formData.full_name?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="p-6 bg-white dark:bg-black text-gray-900 dark:text-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold">Edit My Profile</h2>
        <div className="flex items-center gap-4">
          <Button onClick={handleCancelEdit} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="flex items-start">
        <div className="flex-shrink-0 mr-6 text-center">
          <div className="relative group" onClick={handlePhotoClick}>
            <Avatar className="w-24 h-24 text-4xl border-2 border-gray-300 dark:border-gray-700">
              {profilePhotoUrl ? (
                <Image src={profilePhotoUrl} alt="Profile Photo" layout="fill" objectFit="cover" className="rounded-full" />
              ) : (
                <AvatarFallback>{userInitial}</AvatarFallback>
              )}
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <CameraIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            className="hidden"
            accept="image/png, image/jpeg"
          />
          <p className="text-sm mt-2">Edit Photo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 flex-grow">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="position">Position / Title</Label>
            <Input id="position" name="position" value={formData.position} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input id="mobile" name="mobile" value={formData.mobile} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" name="company" value={formData.company} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="businessWebsite">Company Website</Label>
            <Input id="businessWebsite" name="businessWebsite" value={formData.businessWebsite} onChange={handleInputChange} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" value={formData.city} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" value={formData.state} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="zip">ZIP Code</Label>
            <Input id="zip" name="zip" value={formData.zip} onChange={handleInputChange} />
          </div>
        </div>
      </div>
    </div>
  );
} 