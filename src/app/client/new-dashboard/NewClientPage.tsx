'use client';
import { DrasticLogo } from '@/components/logos/DrasticLogo';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  UserCircleIcon,
  CogIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useAuthContext } from '@/features/auth/contexts/AuthContext';
import { getUserProfile } from '@/lib/api/client-api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Skeleton } from '@/components/ui/skeleton';
import { DashboardCard } from '@/components/DashboardCard';

/* ------------------------------------------------------------------ */
/*  CONSTANTS & UTILS                                                 */
/* ------------------------------------------------------------------ */
const __DEV__ = process.env.NODE_ENV !== 'production';
const debug = (...args: unknown[]) => {
  if (__DEV__) console.log('[ClientDashboard]', ...args);
};

const FRAME_RATIO = 1.8133;
const MIN_FRAME_H = 550;
const MIN_FRAME_TOP = 208; // Header (48px) + Logo (160px)

const MENU_ITEMS = [
  // Removed "View Your Profile" per request
  { name: 'Project Management', icon: CogIcon, href: '/client/projects' },
  { name: 'Website Projects', icon: ComputerDesktopIcon, href: '/client/projects/web-design' },
  { name: 'Lead Dashboard', icon: ChartBarIcon, href: '#' },
  { name: 'Get Help', icon: QuestionMarkCircleIcon, href: '#' },
] as const;

/* ------------------------------------------------------------------ */
/*  LEFT COLUMN                                                       */
/* ------------------------------------------------------------------ */
const LeftColumn = React.memo(function LeftColumn() {
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{
    fullName: string;
    companyName: string;
    avatarUrl: string | null;
  }>({ fullName: '', companyName: '', avatarUrl: null });

  useEffect(() => {
    debug('auth user id:', user?.id);
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      // If no user, show skeleton briefly then fallback state
      if (!user?.id) {
        debug('No user ID, skipping profile fetch');
        if (!mounted) return;
        setIsLoading(false);
        setProfile({ fullName: 'Client Name', companyName: 'Company Name', avatarUrl: null });
        return;
      }

      try {
        setIsLoading(true);
        const data = await getUserProfile();
        if (!mounted) return;
        setProfile({
          fullName: data?.full_name ?? 'Client Name',
          companyName: data?.company ?? 'Company Name',
          avatarUrl: data?.avatar_url ?? null,
        });
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        if (!mounted) return;
        setProfile({ fullName: 'Client Name', companyName: 'Company Name', avatarUrl: null });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return (
    <DashboardCard>
      {isLoading ? (
        <LeftColumnSkeleton />
      ) : (
        <>
          {/* Profile Section */}
          <div className="flex-shrink-0">
            <div className="flex flex-col items-center pt-4">
              <div className="relative h-32 w-32">
                <Avatar className="h-full w-full border-2 border-gray-600">
                  <AvatarImage
                    src={profile.avatarUrl || '/images/dashboard/drastic-prof-icon.jpg'}
                    alt={profile.fullName || 'Client profile avatar'}
                  />
                  <AvatarFallback className="bg-gray-700">
                    <UserCircleIcon className="h-1/2 w-1/2 text-[hsl(var(--text-dark))]" />
                  </AvatarFallback>
                </Avatar>
                <button
                  className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[hsl(var(--accent-red))] transition hover:opacity-90"
                  aria-label="Upload new profile picture"
                >
                  <PlusIcon className="h-5 w-5 text-white" />
                </button>
              </div>
              <h2 className="mt-4 text-xl font-semibold">{profile.fullName}</h2>
              <p className="mt-1 text-sm text-[hsl(var(--text-dark))]">{profile.companyName}</p>
              <div className="mt-6 flex w-full gap-2 px-3">
                <Link
                  href="/client/my-profile-v2?edit=1"
                  className="flex-1 text-center whitespace-nowrap rounded-[var(--radius-md)] border border-[hsl(var(--text-light))] bg-transparent px-3 py-2 text-xs font-medium text-[hsl(var(--text-light))] transition hover:bg-[hsl(var(--text-light))] hover:text-[hsl(var(--bg-medium))]"
                  aria-label="Add more information about your business"
                >
                  Add Info +
                </Link>
                <Link
                  href="/client/my-profile-v2"
                  className="flex-1 text-center whitespace-nowrap rounded-[var(--radius-md)] bg-[hsl(var(--text-light))] px-3 py-2 text-xs font-medium text-[hsl(var(--bg-medium))] transition hover:opacity-90"
                  aria-label="View your profile"
                >
                  View Profile
                </Link>
              </div>
            </div>
          </div>

          <hr className="mt-6 mb-3 border-t-4 border-[#565656]" />

          {/* Menu */}
          <nav className="flex flex-col gap-1 px-4 py-3 overflow-hidden">
            {MENU_ITEMS.map(({ name, href }) => (
              <Link
                key={name}
                href={href}
                className="flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-[hsl(var(--text-light))] transition hover:bg-[#343434] hover:[text-shadow:0_0_5px_#fff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-red))]"
              >
                <span className="truncate">{name}</span>
              </Link>
            ))}
          </nav>

          <div className="flex-shrink-0 pt-4">
            <div className="flex justify-center">
              <DrasticLogo
                iconColor="hsl(var(--text-medium))"
                textColor="hsl(var(--text-medium))"
                className="w-36"
              />
            </div>
          </div>
        </>
      )}
    </DashboardCard>
  );
});

const LeftColumnSkeleton = React.memo(function LeftColumnSkeleton() {
  return (
    <div className="flex h-full flex-col animate-pulse">
      <div className="flex-shrink-0">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gray-700" />
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
        {Array.from({ length: 5 }).map((_, i) => (
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
});

/* ------------------------------------------------------------------ */
/*  MIDDLE COLUMN                                                     */
/* ------------------------------------------------------------------ */
interface CtaButtonProps {
  title: string;
  subtitle: string;
  color: string; // pass CSS var name like --accent-red
  href: string;
  target?: string;
  rel?: string;
}

const CtaButton = React.memo(function CtaButton({ title, subtitle, color, href, target, rel }: CtaButtonProps) {
  const isExternal = target === '_blank' || href.startsWith('http');
  return (
    <Link
      href={href}
      target={target}
      rel={isExternal ? rel ?? 'noopener noreferrer' : rel}
      prefetch={!isExternal}
      className="relative flex h-full w-full items-center justify-between overflow-hidden rounded-[var(--radius-lg)] bg-[hsl(var(--bg-medium))] p-4 text-[hsl(var(--text-light))] shadow-lg transition hover:bg-[hsl(var(--bg-light))]"
      aria-label={`${title} - ${subtitle}`}
    >
      {/* Top Color Bar */}
      <div style={{ backgroundColor: `hsl(var(${color}))` }} className="absolute left-0 top-0 h-2 w-full" />

      {/* Text Content */}
      <div className="z-10">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-sm text-[hsl(var(--text-medium))]">{subtitle}</p>
      </div>

      {/* Icon */}
      <div className="z-10">
        <div style={{ backgroundColor: `hsl(var(${color}))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
          <ArrowRightIcon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Link>
  );
});

const MiddleColumn = React.memo(function MiddleColumn() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <DashboardCard className="relative flex-[4.25] overflow-hidden border-[5px] border-[#2c2c2c]">
        <button className="absolute top-[15px] right-[15px] z-10 rounded-full bg-[hsl(var(--accent-red))] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(0,0,0,0.6)] transition hover:opacity-90">
          Action Required
        </button>

        {/* Image wrapper */}
        <div className="absolute inset-x-0 top-0 bottom-[70px] overflow-hidden" style={{ borderRadius: 'inherit' }}>
          <Image
            src="/images/dashboard/tester-176.jpg"
            alt="Top section background"
            fill
            className="object-cover"
            style={{ objectPosition: 'center 15%' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
        </div>

        {/* Bottom bar content */}
        <div className="absolute bottom-[10px] left-0 right-0 h-[50px] px-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-[hsl(var(--text-light))]">Design Projects</h3>
            <p className="text-sm text-[hsl(var(--text-medium))]">View Your Projects</p>
          </div>
          <div style={{ backgroundColor: `hsl(var(--accent-red))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
            <ArrowRightIcon className="h-6 w-6 text-white" />
          </div>
        </div>
      </DashboardCard>

      <div className="flex flex-[1] justify-between gap-6">
        <CtaButton title="Website Portal" subtitle="access your website" color="--accent-red" href="/client/projects/web-design" />
        <CtaButton title="Leads Portal" subtitle="Traffic Dashboard" color="--accent-blue" href="https://leads.drasticdigital.com" target="_blank" rel="noopener noreferrer" />
      </div>

      {/* Support banner */}
      <DashboardCard className="relative flex-[1.75] overflow-hidden border-[5px] border-[#2c2c2c]">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -translate-x-[47%] inset-y-0 left-0 w-[130%]"
            style={{
              backgroundImage: "url('/images/dashboard/dd-deskpic-cropped.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'top right',
            }}
          />
        </div>

        {/* Diagonal overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(65deg, rgba(0,0,0,0.6) 48%, hsl(var(--bg-medium)) 48.1%)' }}
        />

        {/* Text block */}
        <div className="absolute inset-y-0 right-0 w-[60%] flex items-center justify-center">
          <div className="text-center text-[hsl(var(--text-light))]">
            <h3 className="text-lg font-bold">Need Support?</h3>
            <p className="text-sm">Speak To A Live Agent</p>
            <Link href="https://drasticdigital.com/contact" target="_blank" rel="noopener noreferrer">
              <button className="mt-4 rounded-[var(--radius-lg)] bg-[hsl(var(--accent-red))] px-6 py-2 font-bold text-white transition hover:opacity-90">
                Get Help
              </button>
            </Link>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  RIGHT COLUMN                                                      */
/* ------------------------------------------------------------------ */
const RightColumn = React.memo(function RightColumn() {
  const notifications = useMemo(
    () => [
      { description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed', time: '13 hours ago' },
      { description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed', time: '13 hours ago' },
      { description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed', time: '13 hours ago' },
    ],
    []
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <DashboardCard className="relative flex flex-1 flex-col min-h-0 p-4">
        <div
          className="absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--accent-red))] text-base font-bold text-white"
          aria-live="polite"
          aria-label="Unread notifications"
        >
          12
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Notifications</h3>
        </div>
        <hr className="my-2 border-t-2 border-[hsl(var(--stroke-light))]" />
        <div className="flex-1 space-y-2 overflow-hidden">
          {notifications.map((n, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2">
              <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-xs text-[hsl(var(--text-dark))]">{n.time}</p>
                <p className="text-xs text-[hsl(var(--text-light))]">{n.description}</p>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard className="flex-1 flex flex-col">
        <h3 className="mb-2 text-lg font-bold p-4">Recent Activity</h3>
        <hr className="border-t border-[hsl(var(--stroke-light))]" />
        <div className="flex-1 space-y-3 p-4 overflow-hidden">
          <div className="flex items-center">
            <ComputerDesktopIcon className="h-5 w-5 mr-3 text-[hsl(var(--accent-blue))]" />
            <p className="text-sm text-[hsl(var(--text-medium))]">
              New <span className="font-bold">Web Design</span> project started.
            </p>
          </div>
          <div className="flex items-center">
            <UserCircleIcon className="h-5 w-5 mr-3 text-[hsl(var(--text-light))]" />
            <p className="text-sm text-[hsl(var(--text-medium))]">Profile information updated.</p>
          </div>
          <div className="flex items-center">
            <ArrowRightIcon className="h-5 w-5 mr-3 text-[hsl(var(--accent-red))]" />
            <p className="text-sm text-[hsl(var(--text-medium))]">
              New lead received from <span className="font-bold">Google Ads</span> campaign.
            </p>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  PAGE                                                              */
/* ------------------------------------------------------------------ */
export default function NewClientPage() {
  return (
    <div className="dark">
      <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background layers (fixed) */}
      <div className="absolute inset-0 z-0">
        <div className="fixed top-0 left-0 right-0 h-screen w-full will-change-transform">
          <div className="flex h-full flex-col">
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
            <div className="flex-grow w-full bg-cover bg-center"
                 style={{ backgroundImage: "url('/images/dashboard/carbon-fiber-wallpaper-abstract.jpg')" }}
                 aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Centered Logo Overlay (fixed) */}
      <div className="fixed inset-x-0 z-10 flex items-center justify-center top-12 h-40">
        <DrasticLogo iconColor="hsl(var(--accent-red))" textColor="hsl(var(--text-light))" className="w-[25rem]" />
      </div>

      {/* Foreground content */}
      <div
        className="absolute z-10 left-1/2 -translate-x-1/2"
        style={{ top: `${MIN_FRAME_TOP}px`, height: `max(${MIN_FRAME_H}px, 71.429vh)`, aspectRatio: FRAME_RATIO }}
      >
        <div className="h-full w-full grid grid-cols-[18.5fr_31fr_18.5fr] gap-6">
          <LeftColumn />
          <MiddleColumn />
          <RightColumn />
        </div>
      </div>
    </div>
    </div>
  );
}
