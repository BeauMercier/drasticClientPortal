'use client';
import { DrasticLogo } from '@/components/logos/DrasticLogo';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  UserCircleIcon,
  CogIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  PlusIcon,
  ArrowRightIcon, // Added for buttons
} from '@heroicons/react/24/outline';
import { useAuthContext } from '@/features/auth/contexts/AuthContext';
import { getUserProfile } from '@/lib/api/client-api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

/* ------------------------------------------------------------------ */
/*  LEFT COLUMN                                                       */
/* ------------------------------------------------------------------ */
const LeftColumn = () => {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<{
    fullName: string;
    companyName: string;
    avatarUrl: string | null;
  }>({
    fullName: '',
    companyName: '',
    avatarUrl: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getUserProfile()
        .then((data) =>
          setProfile({
            fullName: data?.full_name || 'Client Name',
            companyName: data?.company || 'Company Name',
            avatarUrl: data?.avatar_url || null,
          }),
        )
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const menuItems = [
    { name: 'View Your Profile', icon: UserCircleIcon, href: '/client/my-profile' },
    { name: 'Project Management', icon: CogIcon, href: '/client/projects' },
    { name: 'Website Projects', icon: ComputerDesktopIcon, href: '/client/projects/web-design' },
    { name: 'Lead Dashboard', icon: ChartBarIcon, href: '#' },
    { name: 'Get Help', icon: QuestionMarkCircleIcon, href: '#' },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[25px] border border-[#2c2c2c] bg-[#232323] p-6 text-white shadow-lg backdrop-blur-sm">
      {isLoading ? (
        <LeftColumnSkeleton />
      ) : (
        <>
          {/* Profile Section */}
          <div className="flex-shrink-0">
            <div className="flex flex-col items-center pt-6">
              <div
                style={{
                  width: '10rem', // approx 16.19vh on 1080p
                  height: '10rem',
                }}
                className="relative"
              >
                <Avatar className="h-full w-full border-2 border-gray-600">
                  <AvatarImage src={profile.avatarUrl || '/images/dashboard/drastic-prof-icon.jpg'} alt={profile.fullName} />
                  <AvatarFallback className="bg-gray-700">
                    <UserCircleIcon className="h-1/2 w-1/2 text-gray-400" />
                  </AvatarFallback>
                </Avatar>

                {/* red add-photo chip: red bg, white border & icon */}
                <button className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-600 transition hover:bg-red-500">
                  <PlusIcon className="h-5 w-5 text-white" />
                </button>
              </div>
              <h2 className="mt-4 text-xl font-semibold">{profile.fullName}</h2>
              <p className="mt-1 text-sm text-gray-400">{profile.companyName}</p>
              <div
                className="mt-6 flex w-full gap-[0.625vw]"
                style={{
                  paddingLeft:    '1.25vw',  // 1 square inset from left edge
                  paddingRight:   '1.25vw',  // **NEW** 1 square inset from right edge
                }}
              >
                <button className="flex-1 whitespace-nowrap rounded-[20px] border border-[#e7e7e7] bg-transparent px-3 py-1 text-xs font-medium text-[#e7e7e7] transition hover:bg-[#e7e7e7] hover:text-[#232323]">
                  Add Info +
                </button>
                <button className="flex-1 whitespace-nowrap rounded-[20px] bg-[#e7e7e7] px-3 py-1 text-xs font-medium text-[#232323] transition hover:opacity-90">
                  View Account
                </button>
              </div>
            </div>
          </div>

          <hr className="my-6 border-t border-[#4f4f4f]" />

          {/* Navigation */}
          <nav className="flex flex-1 items-center min-h-0 overflow-y-auto">
            <div className="flex w-full flex-col gap-2 text-center">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="rounded-md px-3 py-1 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* Logo */}
          <div className="flex-shrink-0 pt-6">
            <div className="flex justify-center">
              <DrasticLogo iconColor="#cecece" textColor="#cecece" className="w-[150px]" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const LeftColumnSkeleton = () => (
  <div className="flex h-full flex-col animate-pulse">
    <div className="flex-shrink-0">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gray-700" />
        </div>
        <div className="mt-4 h-6 w-3/4 rounded-md bg-gray-700" />
        <div className="mt-2 h-4 w-1/2 rounded-md bg-gray-700" />
        <div className="mt-6 flex w-full gap-4">
          <div className="h-10 flex-1 rounded-lg bg-gray-700" />
          <div className="h-10 flex-1 rounded-lg bg-gray-700" />
        </div>
      </div>
      <hr className="my-6 w-full border-t border-[#4f4f4f]" />
    </div>
    <div className="flex-1 space-y-3 overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <div className="h-6 w-6 rounded-md bg-gray-700" />
          <div className="h-5 w-full rounded-md bg-gray-700" />
        </div>
      ))}
    </div>
    <div className="flex-shrink-0 pt-6">
      <div className="mx-auto h-10 w-36 rounded-md bg-gray-700" />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  MIDDLE COLUMN                                                     */
/* ------------------------------------------------------------------ */
// Reusable button component for the new design
interface CtaButtonProps {
  title: string;
  subtitle: string;
  color: string;
  href: string;
}

const CtaButton = ({ title, subtitle, color, href }: CtaButtonProps) => (
  <Link href={href} className="relative flex h-full w-full items-center justify-between overflow-hidden rounded-[25px] bg-[#232323] p-4 text-white shadow-lg transition hover:bg-[#3a3a3a]">
    {/* Top Color Bar */}
    <div style={{ backgroundColor: color }} className="absolute left-0 top-0 h-[10%] w-full" />

    {/* Text Content */}
    <div className="z-10">
      <h3 className="font-bold">{title}</h3>
      <p className="text-sm text-gray-300">{subtitle}</p>
    </div>

    {/* Icon */}
    <div className="z-10">
      <div style={{ backgroundColor: color }} className="flex h-10 w-10 items-center justify-center rounded-full">
        <ArrowRightIcon className="h-6 w-6 text-white" />
      </div>
    </div>
  </Link>
);

const MiddleColumn = () => (
  <div className="flex h-full min-h-0 flex-col gap-6">
    <div className="flex flex-[4.25] flex-col overflow-hidden rounded-[25px] bg-black bg-opacity-50 shadow-lg">
      {/* Image Area (80.5%) */}
      <div className="relative flex-[8.05] border-2 border-[#232323] bg-black">
        <Image
          src="/images/dashboard/tester-176.jpg"
          alt="Top section background"
          layout="fill"
          objectFit="cover"
          className="opacity-70"
        />
      </div>
      {/* Gray Area (19.5%) */}
      <div className="flex-[1.95] bg-[#232323]">
        {/* Content for the gray bar can go here */}
      </div>
    </div>

    <div className="flex flex-[1] justify-between gap-6">
       <CtaButton 
        title="Website Projects"
        subtitle="Project management"
        color="#ff1010"
        href="/client/projects/web-design"
      />
      <CtaButton 
        title="Leads Portal"
        subtitle="Traffic Dashboard"
        color="#1075ff"
        href="#"
      />
    </div>

    {/* ───────── MIDDLE-BOTTOM (support banner) ───────── */}
<div className="relative flex-[1.75] grid grid-cols-2 overflow-hidden rounded-[25px] shadow-lg">

  {/* LEFT ½ — photo, clipped on a 35° line */}
  <div className="relative">
    <Image
      src="/images/dashboard/tester-59.jpg"
      alt="Need support"
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      style={{ objectFit: 'cover', objectPosition: 'center' }}
      priority
    />

    {/* 35° mask so the right edge tilts down ↘ toward centre */}
    <div
      className="absolute inset-0 bg-black/40"
      style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 100%)' }}
    />
  </div>

  {/* RIGHT ½ — grey panel with perfectly centred copy & CTA */}
  <div className="flex items-center justify-center bg-[#232323] text-center text-white">
    <div className="px-6">
      <h3 className="text-lg font-bold">Need Support?</h3>
      <p className="text-sm">Speak To A Live Agent</p>
      <button className="mt-4 rounded-[25px] bg-[#ff1010] px-6 py-2 font-bold text-white transition hover:opacity-90">
        Get Help
      </button>
    </div>
  </div>
</div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  RIGHT COLUMN                                                      */
/* ------------------------------------------------------------------ */
const RightColumn = () => {
  const notifications = [
    {
      title: 'New Logo Design Revision',
      description: 'A new revision for the "Brand Refresh" project is available for review.',
      time: '2h ago',
    },
    {
      title: 'Invoice Awaiting Payment',
      description: 'Invoice #INV-0078 for Web Design Phase 1 is due.',
      time: '1d ago',
    },
    {
      title: 'Welcome to the Portal!',
      description: 'Your account is set up and you can start your first project.',
      time: '3d ago',
    },
  ];

  return (
  <div className="flex h-full min-h-0 flex-col gap-6">
    <div className="flex flex-1 flex-col rounded-[25px] bg-[#232323] p-4 text-white shadow-lg min-h-0">
      <h3 className="mb-2 text-lg font-bold">Notifications</h3>
      <hr className="mb-4 border-t border-[#4f4f4f]" />
      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {notifications.map((notification, index) => (
          <div key={index} className="rounded-lg bg-black/30 p-2">
            <p className="text-sm font-semibold">{notification.title}</p>
            <p className="text-xs text-gray-400">{notification.description}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="flex-1 rounded-[25px] bg-black bg-opacity-50 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-400">
        <span className="text-gray-300">Right Bottom</span>
      </div>
    </div>
  </div>
)};

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */
export default function NewClientPage() {
  return (
    <div className="relative min-h-screen w-full overflow-y-auto">
      {/* Background layers (fixed) */}
      <div className="absolute inset-0 z-0">
        <div className="fixed top-0 left-0 right-0 h-screen w-full">
          <div className="flex h-full flex-col">
            <div className="h-[5.715vh] w-full bg-[#0e0e0e] flex items-center pl-[1.25vw]">
              <DrasticLogo iconColor="#ff2424" textColor="#ffffff" className="h-[3.5vh]" />
            </div>
            <div className="relative h-[26.794vh] w-full bg-black">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-25"
                style={{ backgroundImage: "url('/images/dashboard/tester-176.jpg')" }}
              />
            </div>
            <div className="h-[0.762vh] w-full bg-[#171717]" />
            <div
              className="flex-grow w-full bg-cover bg-center"
              style={{ backgroundImage: "url('/images/dashboard/carbon-fiber-wallpaper-abstract.jpg')" }}
            />
          </div>
        </div>
      </div>

      {/* Centered Logo Overlay (fixed) */}
      <div className="fixed inset-x-0 z-10 flex items-center justify-center" style={{ top: '5.715vh', height: '17.142vh' }}>
        <DrasticLogo iconColor="#ff2424" textColor="#ffffff" className="w-[35vw]" />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-[7.5vw]" style={{ paddingTop: '22.857vh', paddingBottom: '5.714vh' }}>
        <div className="h-full min-h-[71.43vh] w-full">
          <div className="grid h-full min-h-0 w-full grid-cols-[16.5fr_35fr_16.5fr] gap-[1.25vw]">
            <LeftColumn />
            <MiddleColumn />
            <RightColumn />
          </div>
        </div>
      </div>
    </div>
  );
}
