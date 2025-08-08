'use client';

import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { DrasticLogo } from '@/components/logos/DrasticLogo';
import { useAuthContext } from '@/features/auth/contexts/AuthContext';
import { getUserProfile, updateUserProfile, uploadProfilePicture } from '@/lib/api/client-api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DashboardCard } from '@/components/DashboardCard';
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications } from '@/hooks/useNotifications';
import EditProfileView from '@/app/(client)/client/my-profile/EditProfileView';
import { useToast } from '@/components/ui/use-toast';

const FRAME_RATIO = 1.8133;
const MIN_FRAME_H = 550;
const MIN_FRAME_TOP = 208; // Header (48px) + Title area


function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-xs text-[hsl(var(--text-dark))] uppercase tracking-wider">{label}</p>
  );
}

/* ------------------------- Combined Left + Middle ------------------------- */
const CombinedColumn: React.FC<{ profile: any; onProfileSaved: (p: any) => void; initialIsEditing?: boolean }> = ({ profile, onProfileSaved, initialIsEditing }) => {
  const { user, updateProfile: updateAuthContextProfile } = useAuthContext();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    if (!profile) return;
    const loaded = {
      full_name: profile.full_name || '',
      email: user?.email || '',
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
    setUserData(loaded);
    setProfilePhotoUrl(profile.avatar_url || null);
  }, [profile, user?.email]);

  // Allow opening in edit mode from parent (e.g., via query param)
  useEffect(() => {
    if (initialIsEditing) {
      handleEditClick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIsEditing]);

  const handleEditClick = () => {
    setIsEditing(true);
    const current: any = { ...userData };
    delete current.email;
    delete current.website_dashboard_url;
    setFormData(current);
    setProfilePhoto(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfilePhoto(null);
    setProfilePhotoUrl(userData.avatar_url || null);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhotoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      let finalAvatarUrl = formData.avatar_url;

      if (profilePhoto) {
        const photoResult = await uploadProfilePicture(profilePhoto);
        if (!photoResult?.avatar_url) throw new Error('Photo upload did not return a URL.');
        finalAvatarUrl = photoResult.avatar_url;
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
        avatar_url: finalAvatarUrl,
      };

      const updated = await updateUserProfile(profileUpdates);
      const merged = { ...profile, ...updated };
      setUserData(prev => ({ ...prev, ...profileUpdates, avatar_url: finalAvatarUrl }));
      setProfilePhotoUrl(finalAvatarUrl);
      onProfileSaved(merged);
      updateAuthContextProfile?.({ full_name: profileUpdates.full_name, avatar_url: finalAvatarUrl });

      toast({ title: 'Success', description: 'Profile updated successfully!' });
      setIsEditing(false);
      setProfilePhoto(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to save profile changes.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <DashboardCard className="p-0 overflow-hidden border-[5px] border-[#2c2c2c]">
        {isEditing ? (
          <div className="p-6">
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
              wrapperClassName="bg-[hsl(var(--bg-medium))] text-[hsl(var(--text-light))] border border-[hsl(var(--stroke-light))] rounded-[var(--radius-lg)] shadow-none"
            />
          </div>
        ) : (
        <>
        {/* Header area with avatar, name, and edit button */}
        <div className="flex items-center gap-6 p-6">
          <div className="relative h-32 w-32 flex-shrink-0">
            <Avatar className="h-full w-full border-2 border-gray-600">
              <AvatarImage src={profile?.avatar_url || '/images/dashboard/drastic-prof-icon.jpg'} alt={profile?.full_name || 'Client profile avatar'} />
              <AvatarFallback className="bg-gray-700" />
            </Avatar>
            <button className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[hsl(var(--accent-red))] transition hover:opacity-90" aria-label="Upload new profile picture" onClick={handlePhotoClick}>
              <PlusIcon className="h-5 w-5 text-white" />
              <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/png, image/jpeg" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-extrabold truncate">{profile?.full_name || 'Client Name'}</h2>
            <p className="text-sm mt-1 text-[hsl(var(--text-dark))] truncate">{profile?.company || 'Company'}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleEditClick} className="rounded-[var(--radius-md)] border border-[hsl(var(--text-light))] bg-transparent px-4 py-2 text-sm font-medium text-[hsl(var(--text-light))] transition hover:bg-[hsl(var(--text-light))] hover:text-[hsl(var(--bg-medium))] whitespace-nowrap">
              Edit Profile
            </button>
            <Link href="/client/my-profile/business-info" className="rounded-[var(--radius-md)] bg-[hsl(var(--text-light))] px-4 py-2 text-sm font-medium text-[hsl(var(--bg-medium))] transition hover:opacity-90 whitespace-nowrap">
              Business Info
            </Link>
          </div>
        </div>

        {/* Quick Links removed per request */}

        <div className="px-6 pb-6">
          <Tabs defaultValue="contact" className="w-full">
            {/* Segmented tab bar (mockup style) */}
            <div className="rounded-[20px] bg-[#3a3a3a] p-1 mb-4">
              <div role="tablist" className="grid w-full grid-cols-2 gap-2 bg-[#3a3a3a] text-white rounded-[20px] h-12 items-center p-1">
              <TabsTrigger
                value="contact"
                className="text-sm font-semibold h-10 px-4 py-0 leading-none rounded-[16px] !bg-transparent !text-white data-[state=active]:!bg-[#5a5a5a] data-[state=active]:!text-white"
              >
                Contact Information
              </TabsTrigger>
              <TabsTrigger
                value="business"
                className="text-sm font-semibold h-10 px-4 py-0 leading-none rounded-[16px] !bg-transparent !text-white data-[state=active]:!bg-[#5a5a5a] data-[state=active]:!text-white"
              >
                Business Information
              </TabsTrigger>
              </div>
            </div>

            <TabsContent value="contact">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-10 p-2">
                <div>
                  <SectionLabel label="FULL NAME" />
                  <p className="mt-1 text-sm">{profile?.full_name || '—'}</p>
                </div>
                <div>
                  <SectionLabel label="CONTACT EMAIL" />
                  <p className="mt-1 text-sm break-words">{user?.email || '—'}</p>
                </div>
                <div>
                  <SectionLabel label="BUSINESS WEBSITE" />
                  <p className="mt-1 text-sm break-words">{profile?.business_website || '—'}</p>
                </div>

                <div>
                  <SectionLabel label="PHONE NUMBER" />
                  <p className="mt-1 text-sm">{profile?.phone || '—'}</p>
                </div>
                <div>
                  <SectionLabel label="MOBILE NUMBER" />
                  <p className="mt-1 text-sm">{profile?.mobile || '—'}</p>
                </div>
                <div>
                  <SectionLabel label="PREFERRED CONTACT" />
                  <p className="mt-1 text-sm">{profile?.preferred_contact || '—'}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="business">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-2">
                <div>
                  <SectionLabel label="Company" />
                  <p className="mt-1 text-sm">{profile?.company || '—'}</p>
                </div>
                <div>
                  <SectionLabel label="Position" />
                  <p className="mt-1 text-sm">{profile?.position || '—'}</p>
                </div>
                <div>
                  <SectionLabel label="Address" />
                  <p className="mt-1 text-sm">{profile?.address || '—'}</p>
                </div>
                <div>
                  <SectionLabel label="City, State ZIP" />
                  <p className="mt-1 text-sm">{[profile?.city, profile?.state, profile?.zip].filter(Boolean).join(', ') || '—'}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        </>
        )}
      </DashboardCard>
    </div>
  );
};

/* ------------------------------ Right Column ----------------------------- */
const RightColumn: React.FC<{ profile?: any }> = ({ profile }) => {
  const { notifications, unreadCount } = useNotifications();
  const items = useMemo(() => notifications ?? [], [notifications]);

  const Cta = ({
    title,
    subtitle,
    color,
    href,
    external,
  }: {
    title: string;
    subtitle: string;
    color: string;
    href: string;
    external?: boolean;
  }) => (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="relative flex h-full w-full items-center justify-between overflow-hidden rounded-[var(--radius-lg)] bg-[hsl(var(--bg-medium))] p-4 text-[hsl(var(--text-light))] shadow-lg transition hover:bg-[hsl(var(--bg-light))]"
    >
      <div style={{ backgroundColor: `hsl(var(${color}))` }} className="absolute left-0 top-0 h-2 w-full" />
      <div className="z-10">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-sm text-[hsl(var(--text-medium))]">{subtitle}</p>
      </div>
      <div className="z-10">
        <div style={{ backgroundColor: `hsl(var(${color}))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
          <ArrowRightIcon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Link>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <DashboardCard className="relative flex flex-1 flex-col min-h-0 p-4">
        <div
          className="absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--accent-red))] text-base font-bold text-white"
          aria-live="polite"
          aria-label="Unread notifications"
        >
          {unreadCount}
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Notifications</h3>
        </div>
        <hr className="my-2 border-t-2 border-[hsl(var(--stroke-light))]" />
        <div className="flex-1 space-y-2 overflow-hidden">
          {items.map((n) => (
            <div key={n.id} className="flex items-start gap-3 p-2">
              <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-xs text-[hsl(var(--text-dark))]">{new Date(n.created_at).toLocaleString()}</p>
                <p className="text-xs text-[hsl(var(--text-light))]">{n.title}: {n.message}</p>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="p-2 text-sm text-[hsl(var(--text-medium))]">No notifications yet.</div>
          )}
        </div>
      </DashboardCard>

      <div className="grid grid-rows-2 gap-6">
        <Cta title="Website Dashboard" subtitle="Access your site" color="--accent-red" href={profile?.website_dashboard_url || '/client/projects/web-design'} external={Boolean(profile?.website_dashboard_url)} />
        <Cta
          title="Leads Portal"
          subtitle="View your leads"
          color="--accent-blue"
          href="https://leads.drasticdigital.com"
          external
        />
      </div>

      <DashboardCard className="relative flex-[1.25] overflow-hidden border-[5px] border-[#2c2c2c] bg-[hsl(var(--accent-red))] text-white">
        <div className="p-6 text-center">
          <p className="tracking-wider text-sm opacity-90">REFERRAL PROGRAM</p>
          <h3 className="mt-2 text-2xl font-extrabold">$200 for you. 10% off for all your friends.</h3>
          <Link
            href="/client/referrals"
            className="mt-4 inline-block rounded-[var(--radius-lg)] bg-white px-6 py-2 font-bold text-[hsl(var(--accent-red))] transition hover:opacity-90"
          >
            Learn More
          </Link>
        </div>
      </DashboardCard>
    </div>
  );
};

/* --------------------------------- Page --------------------------------- */
export default function MyProfileV2Page() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<any>(null);
  const [isEditingOnLoad, setIsEditingOnLoad] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id) return;
      const data = await getUserProfile();
      if (mounted) setProfile({ ...data });
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Support `?edit=1` to immediately open edit view
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const edit = url.searchParams.get('edit');
    setIsEditingOnLoad(edit === '1' || edit === 'true');
  }, []);

  return (
    <div className="dark">
      <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background layers (fixed) */}
      <div className="absolute inset-0 z-0">
        <div className="fixed top-0 left-0 right-0 h-screen w-full will-change-transform">
          <div className="flex h-full flex-col">
            {/* Top header bar with logo (same as NewClientPage) */}
            <div className="h-12 w-full bg-[#0e0e0e] flex items-center px-6">
              <DrasticLogo iconColor="hsl(var(--accent-red))" textColor="hsl(var(--text-light))" className="h-8" />
            </div>
            <div className="relative h-[250px] w-full bg-black">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-25 blur-sm"
                style={{ backgroundImage: "url('/images/dashboard/tester-176.jpg')" }}
                aria-hidden
              />
            </div>
            <div className="h-2 w-full bg-[#2c2c2c]" />
            <div
              className="flex-grow w-full bg-cover bg-center"
              style={{ backgroundImage: "url('/images/dashboard/carbon-fiber-wallpaper-abstract.jpg')" }}
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Go Home link (fixed, under logo, top-left) */}
      <Link
        href="/client/new-dashboard"
        className="fixed z-20 left-6 top-14 flex items-center gap-2 text-white font-semibold"
        style={{ WebkitTextStroke: '0.6px black', textShadow: '0 0 2px rgba(0,0,0,0.9)' }}
      >
        <ArrowLeftIcon className="h-5 w-5 text-white" />
        <span>Go Home</span>
      </Link>

      {/* Centered Page Title (fixed) */}
      <div className="fixed inset-x-0 z-10 flex items-center justify-center top-12 h-40">
        <h1 className="text-5xl font-extrabold text-white drop-shadow-[0_6px_8px_rgba(0,0,0,0.6)]">My Profile</h1>
      </div>

      {/* Foreground content */}
      <div
        className="absolute z-10 left-1/2 -translate-x-1/2"
        style={{ top: `${MIN_FRAME_TOP}px`, height: `max(${MIN_FRAME_H}px, 71.429vh)`, aspectRatio: FRAME_RATIO }}
      >
        <div className="h-full w-full grid grid-cols-[18.5fr_31fr_18.5fr] gap-6">
          <div className="col-span-2">
            <CombinedColumn profile={profile} onProfileSaved={(p) => setProfile({ ...p })} initialIsEditing={isEditingOnLoad} />
          </div>
          <RightColumn profile={profile} />
        </div>
      </div>
      </div>
    </div>
  );
}




