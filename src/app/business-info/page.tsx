'use client';

import { useState, useEffect } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import { getBusinessProfile, updateBusinessProfile } from '@/lib/api/client-api';
import { BusinessProfile } from '@/lib/types/user';
import { Card } from '../../shared/ui/molecules';
import { toast } from 'react-hot-toast';

// Skeleton components for loading state
const InputSkeleton = () => (
  <div className="h-12 bg-gray-200 animate-pulse rounded-md w-full"></div>
);

const LabelSkeleton = () => (
  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
);

const FormGroupSkeleton = () => (
  <div className="space-y-2">
    <LabelSkeleton />
    <InputSkeleton />
  </div>
);

export default function BusinessInfoPage() {
  // Define business profile state
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Company Information state
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  
  // Contact Information state
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Business Address state
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  
  // Business Hours state
  const [mondayStart, setMondayStart] = useState('');
  const [mondayEnd, setMondayEnd] = useState('');
  const [tuesdayStart, setTuesdayStart] = useState('');
  const [tuesdayEnd, setTuesdayEnd] = useState('');
  const [wednesdayStart, setWednesdayStart] = useState('');
  const [wednesdayEnd, setWednesdayEnd] = useState('');
  const [thursdayStart, setThursdayStart] = useState('');
  const [thursdayEnd, setThursdayEnd] = useState('');
  const [fridayStart, setFridayStart] = useState('');
  const [fridayEnd, setFridayEnd] = useState('');
  const [saturdayClosed, setSaturdayClosed] = useState(true);
  const [sundayClosed, setSundayClosed] = useState(true);
  
  // Load business profile data on component mount
  useEffect(() => {
    async function fetchBusinessProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const profile = await getBusinessProfile();
        
        // Set form state from profile
        setCompanyName(profile?.company_name || '');
        setBusinessType(profile?.business_type || '');
        setIndustry(profile?.industry || '');
        setCompanyWebsite(profile?.company_website || '');
        
        // Contact Information
        setPrimaryContactName(profile?.primary_contact_name || '');
        setPositionTitle(profile?.position_title || '');
        setEmailAddress(profile?.email_address || '');
        setPhoneNumber(profile?.phone_number || '');
        
        // Business Address
        setStreetAddress(profile?.street_address || '');
        setCity(profile?.city || '');
        setStateProvince(profile?.state_province || '');
        setPostalCode(profile?.postal_code || '');
        setCountry(profile?.country || '');
        
        // Business Hours
        setMondayStart(profile?.monday_start || '');
        setMondayEnd(profile?.monday_end || '');
        setTuesdayStart(profile?.tuesday_start || '');
        setTuesdayEnd(profile?.tuesday_end || '');
        setWednesdayStart(profile?.wednesday_start || '');
        setWednesdayEnd(profile?.wednesday_end || '');
        setThursdayStart(profile?.thursday_start || '');
        setThursdayEnd(profile?.thursday_end || '');
        setFridayStart(profile?.friday_start || '');
        setFridayEnd(profile?.friday_end || '');
        setSaturdayClosed(profile?.saturday_closed !== false);
        setSundayClosed(profile?.sunday_closed !== false);
      } catch (error) {
        console.error('Error fetching business profile:', error);
        setError('Failed to load business information. Please try again later.');
        toast.error('Failed to load business information');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBusinessProfile();
  }, []);
  
  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };
  
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const updates: Partial<BusinessProfile> = {
        // Company Information
        company_name: companyName,
        business_type: businessType,
        industry: industry,
        company_website: companyWebsite,
        
        // Contact Information
        primary_contact_name: primaryContactName,
        position_title: positionTitle,
        email_address: emailAddress,
        phone_number: phoneNumber,
        
        // Business Address
        street_address: streetAddress,
        city: city,
        state_province: stateProvince,
        postal_code: postalCode,
        country: country,
        
        // Business Hours
        monday_start: mondayStart || undefined,
        monday_end: mondayEnd || undefined,
        tuesday_start: tuesdayStart || undefined,
        tuesday_end: tuesdayEnd || undefined,
        wednesday_start: wednesdayStart || undefined,
        wednesday_end: wednesdayEnd || undefined,
        thursday_start: thursdayStart || undefined,
        thursday_end: thursdayEnd || undefined,
        friday_start: fridayStart || undefined,
        friday_end: fridayEnd || undefined,
        saturday_closed: saturdayClosed,
        sunday_closed: sundayClosed,
      };
      
      const updatedProfile = await updateBusinessProfile(updates);
      
      // Update local state with the changes
      setCompanyName(updatedProfile.company_name || '');
      setBusinessType(updatedProfile.business_type || '');
      setIndustry(updatedProfile.industry || '');
      setCompanyWebsite(updatedProfile.company_website || '');
      setPrimaryContactName(updatedProfile.primary_contact_name || '');
      setPositionTitle(updatedProfile.position_title || '');
      setEmailAddress(updatedProfile.email_address || '');
      setPhoneNumber(updatedProfile.phone_number || '');
      setStreetAddress(updatedProfile.street_address || '');
      setCity(updatedProfile.city || '');
      setStateProvince(updatedProfile.state_province || '');
      setPostalCode(updatedProfile.postal_code || '');
      setCountry(updatedProfile.country || '');
      
      setIsEditing(false);
      toast.success('Business profile updated successfully!');
    } catch (error) {
      console.error('Failed to update business profile:', error);
      setError('Failed to update business profile. Please try again.');
      toast.error('Failed to update business profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Input field style classes 
  const inputClass = `px-4 py-2 h-12 focus:ring-indigo-500 focus:border-indigo-500 block w-full 
    sm:text-sm rounded-md border ${isEditing ? 'border-gray-300 bg-white text-black' : 'border-gray-300 bg-white text-black'}`;
  
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  
  // Render the input or skeleton based on loading state
  const renderInput = (value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type = "text", id = "") => (
    isLoading ? <InputSkeleton /> : (
      <input
        type={type}
        id={id}
        className={inputClass}
        value={value}
        onChange={onChange}
        disabled={!isEditing}
      />
    )
  );
  
  // Render the time input or skeleton based on loading state
  const renderTimeInput = (value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => (
    isLoading ? <InputSkeleton /> : (
      <input
        type="time"
        className={inputClass}
        value={value}
        onChange={onChange}
        disabled={!isEditing}
      />
    )
  );
  
  return (
    <main className="p-6 space-y-6">
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
      
      {/* Company Information */}
      <Card className="bg-white shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
          <div className="flex gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  console.log('Test Save button clicked - directly calling handleSaveChanges');
                  handleSaveChanges();
                }}
                disabled={isLoading || isSaving}
                className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700"
              >
                Test Save
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                console.log('Main button clicked, isEditing:', isEditing);
                console.log('Button disabled:', isLoading || isSaving);
                
                if (isEditing) {
                  console.log('Calling handleSaveChanges');
                  handleSaveChanges();
                } else {
                  console.log('Calling handleToggleEdit');
                  handleToggleEdit();
                }
              }}
              disabled={isLoading || isSaving}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                isEditing 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </div>
              ) : isSaving ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </div>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                <>
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </>
              )}
            </button>
          </div>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(8)].map((_, i) => (
                <FormGroupSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="companyName" className={labelClass}>Company Name</label>
                {renderInput(companyName, (e) => setCompanyName(e.target.value), "text", "companyName")}
              </div>
              <div>
                <label htmlFor="businessType" className={labelClass}>Business Type</label>
                {renderInput(businessType, (e) => setBusinessType(e.target.value), "text", "businessType")}
              </div>
              <div>
                <label htmlFor="industry" className={labelClass}>Industry</label>
                {renderInput(industry, (e) => setIndustry(e.target.value), "text", "industry")}
              </div>
              <div>
                <label htmlFor="companyWebsite" className={labelClass}>Company Website</label>
                {renderInput(companyWebsite, (e) => setCompanyWebsite(e.target.value), "url", "companyWebsite")}
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Contact Information */}
      <Card className="bg-white shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="primaryContactName" className={labelClass}>
                Primary Contact Name
              </label>
              {renderInput(primaryContactName, (e) => setPrimaryContactName(e.target.value), "text", "primaryContactName")}
            </div>
            
            <div>
              <label htmlFor="positionTitle" className={labelClass}>
                Position/Title
              </label>
              {renderInput(positionTitle, (e) => setPositionTitle(e.target.value), "text", "positionTitle")}
            </div>
            
            <div>
              <label htmlFor="emailAddress" className={labelClass}>
                Email Address
              </label>
              {renderInput(emailAddress, (e) => setEmailAddress(e.target.value), "email", "emailAddress")}
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className={labelClass}>
                Phone Number
              </label>
              {renderInput(phoneNumber, (e) => setPhoneNumber(e.target.value), "tel", "phoneNumber")}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Business Address */}
      <Card className="bg-white shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Business Address</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="streetAddress" className={labelClass}>
                Street Address
              </label>
              {renderInput(streetAddress, (e) => setStreetAddress(e.target.value), "text", "streetAddress")}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="city" className={labelClass}>
                  City
                </label>
                {renderInput(city, (e) => setCity(e.target.value), "text", "city")}
              </div>
              
              <div>
                <label htmlFor="stateProvince" className={labelClass}>
                  State/Province
                </label>
                {renderInput(stateProvince, (e) => setStateProvince(e.target.value), "text", "stateProvince")}
              </div>
              
              <div>
                <label htmlFor="postalCode" className={labelClass}>
                  Postal Code
                </label>
                {renderInput(postalCode, (e) => setPostalCode(e.target.value), "text", "postalCode")}
              </div>
              
              <div>
                <label htmlFor="country" className={labelClass}>
                  Country
                </label>
                {renderInput(country, (e) => setCountry(e.target.value), "text", "country")}
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Business Hours */}
      <Card className="bg-white shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Business Hours</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="col-span-1">
                <span className="text-sm font-medium text-gray-700">Monday</span>
              </div>
              <div className="col-span-2">
                {renderTimeInput(mondayStart, (e) => setMondayStart(e.target.value))}
              </div>
              <div className="col-span-2">
                {renderTimeInput(mondayEnd, (e) => setMondayEnd(e.target.value))}
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="col-span-1">
                <span className="text-sm font-medium text-gray-700">Tuesday</span>
              </div>
              <div className="col-span-2">
                {renderTimeInput(tuesdayStart, (e) => setTuesdayStart(e.target.value))}
              </div>
              <div className="col-span-2">
                {renderTimeInput(tuesdayEnd, (e) => setTuesdayEnd(e.target.value))}
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="col-span-1">
                <span className="text-sm font-medium text-gray-700">Wednesday</span>
              </div>
              <div className="col-span-2">
                {renderTimeInput(wednesdayStart, (e) => setWednesdayStart(e.target.value))}
              </div>
              <div className="col-span-2">
                {renderTimeInput(wednesdayEnd, (e) => setWednesdayEnd(e.target.value))}
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="col-span-1">
                <span className="text-sm font-medium text-gray-700">Thursday</span>
              </div>
              <div className="col-span-2">
                {renderTimeInput(thursdayStart, (e) => setThursdayStart(e.target.value))}
              </div>
              <div className="col-span-2">
                {renderTimeInput(thursdayEnd, (e) => setThursdayEnd(e.target.value))}
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="col-span-1">
                <span className="text-sm font-medium text-gray-700">Friday</span>
              </div>
              <div className="col-span-2">
                {renderTimeInput(fridayStart, (e) => setFridayStart(e.target.value))}
              </div>
              <div className="col-span-2">
                {renderTimeInput(fridayEnd, (e) => setFridayEnd(e.target.value))}
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="col-span-1">
                <span className="text-sm font-medium text-gray-700">Saturday</span>
              </div>
              <div className="col-span-4">
                <div className="flex items-center">
                  {isLoading ? (
                    <div className="h-4 w-4 bg-gray-200 animate-pulse rounded-sm mr-2"></div>
                  ) : (
                    <input
                      id="saturdayClosed"
                      name="saturdayClosed"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={saturdayClosed}
                      onChange={(e) => setSaturdayClosed(e.target.checked)}
                      disabled={!isEditing}
                    />
                  )}
                  <label htmlFor="saturdayClosed" className="ml-2 block text-sm text-gray-700">
                    Closed
                  </label>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="col-span-1">
                <span className="text-sm font-medium text-gray-700">Sunday</span>
              </div>
              <div className="col-span-4">
                <div className="flex items-center">
                  {isLoading ? (
                    <div className="h-4 w-4 bg-gray-200 animate-pulse rounded-sm mr-2"></div>
                  ) : (
                    <input
                      id="sundayClosed"
                      name="sundayClosed"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={sundayClosed}
                      onChange={(e) => setSundayClosed(e.target.checked)}
                      disabled={!isEditing}
                    />
                  )}
                  <label htmlFor="sundayClosed" className="ml-2 block text-sm text-gray-700">
                    Closed
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
} 