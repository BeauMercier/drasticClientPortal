'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DrasticLogo } from '@/components/logos/DrasticLogo';
import { DashboardCard } from '@/components/DashboardCard';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '@/hooks/useNotifications';
import ProjectTimeline, { StageConfig } from '@/components/projects/ProjectTimeline';
import { useProject } from '@/features/projects/hooks/useProject';
import { useProjectRealtime } from '@/features/projects/hooks/useProjectRealtime';
import { WebDesignProject, ProjectStage } from '@/lib/types/project';
import {
  LightbulbIcon,
  PencilIcon,
  RotateCcwIcon,
  CheckCircleIcon,
  PackageIcon,
} from 'lucide-react';

const FRAME_RATIO = 1.8133;
const MIN_FRAME_H = 550;
const MIN_FRAME_TOP = 208;

const PROJECT_STAGES: StageConfig[] = [
  { key: 'discovery', label: 'Discovery', icon: LightbulbIcon },
  { key: 'concept-development', label: 'Initial Design', icon: PencilIcon },
  { key: 'refinement', label: 'Revisions', icon: RotateCcwIcon },
  { key: 'finalization', label: 'Approval', icon: CheckCircleIcon },
  { key: 'delivery', label: 'Delivery', icon: PackageIcon },
];

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-xs text-[hsl(var(--text-dark))] uppercase tracking-wider">{label}</p>
  );
}

const RightColumn: React.FC = () => {
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
        <Cta title="Website Projects" subtitle="Project Management" color="--accent-red" href="/client/projects/web-design" />
        <Cta title="Leads Portal" subtitle="Traffic Dashboard" color="--accent-blue" href="https://leads.drasticdigital.com" external />
      </div>

      <DashboardCard className="relative flex-[1.25] overflow-hidden border-[5px] border-[#2c2c2c] bg-[hsl(var(--accent-red))] text-white">
        <div className="p-6 text-center">
          <p className="tracking-wider text-sm opacity-90">REFERRAL PROGRAM</p>
          <h3 className="mt-2 text-2xl font-extrabold">$200 for you. 10% off for all your friends.</h3>
          <Link href="/client/referrals" className="mt-4 inline-block rounded-[var(--radius-lg)] bg-white px-6 py-2 font-bold text-[hsl(var(--accent-red))] transition hover:opacity-90">Learn More</Link>
        </div>
      </DashboardCard>
    </div>
  );
};

const LeftColumn: React.FC<{ project?: WebDesignProject | null }> = ({ project }) => {
  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <DashboardCard className="relative flex-[3] overflow-hidden border-[5px] border-[#2c2c2c]">
        <div className="absolute inset-x-0 top-0 bottom-[70px] overflow-hidden" style={{ borderRadius: 'inherit' }}>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/dashboard/tester-176.jpg')", opacity: 0.35 }}
            aria-hidden
          />
        </div>
        <div className="absolute bottom-[10px] left-0 right-0 h-[50px] px-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-[hsl(var(--text-light))]">Active Projects</h3>
            <p className="text-sm text-[hsl(var(--text-medium))]">Click to View</p>
          </div>
          <div style={{ backgroundColor: `hsl(var(--accent-red))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
            <ArrowRightIcon className="h-6 w-6 text-white" />
          </div>
        </div>
      </DashboardCard>

      <div className="flex flex-[1] justify-between gap-6">
        <Link href="/client/projects" className="relative flex h-full w-full items-center justify-between overflow-hidden rounded-[var(--radius-lg)] bg-[hsl(var(--bg-medium))] p-4 text-[hsl(var(--text-light))] shadow-lg transition hover:bg-[hsl(var(--bg-light))]">
          <div className="z-10">
            <h3 className="font-bold text-lg">Previous Projects</h3>
            <p className="text-sm text-[hsl(var(--text-medium))]">Click to View</p>
          </div>
          <div className="z-10">
            <div style={{ backgroundColor: `hsl(var(--accent-red))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
              <ArrowRightIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </Link>
        <Link href={project?.client?.email ? `mailto:${project.client.email}` : '#'} className="relative flex h-full w-full items-center justify-between overflow-hidden rounded-[var(--radius-lg)] bg-[hsl(var(--bg-medium))] p-4 text-[hsl(var(--text-light))] shadow-lg transition hover:bg-[hsl(var(--bg-light))]">
          <div className="z-10">
            <h3 className="font-bold text-lg">Email Project Lead</h3>
            <p className="text-sm text-[hsl(var(--text-medium))]">Click to Contact</p>
          </div>
          <div className="z-10">
            <div style={{ backgroundColor: `hsl(var(--accent-red))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
              <ArrowRightIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </Link>
      </div>

      <div className="flex flex-[1] justify-between gap-6">
        <Link href={`/client/my-profile-v2?edit=1`} className="relative flex h-full w-full items-center justify-between overflow-hidden rounded-[var(--radius-lg)] bg-[hsl(var(--bg-medium))] p-4 text-[hsl(var(--text-light))] shadow-lg transition hover:bg-[hsl(var(--bg-light))]">
          <div className="z-10">
            <h3 className="font-bold text-lg">Update Company Info</h3>
            <p className="text-sm text-[hsl(var(--text-medium))]">Click to Edit</p>
          </div>
          <div className="z-10">
            <div style={{ backgroundColor: `hsl(var(--accent-red))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
              <ArrowRightIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </Link>
        <Link href={project ? `/client/projects/web-design/${project.id}?tab=files` : '#'} className="relative flex h-full w-full items-center justify-between overflow-hidden rounded-[var(--radius-lg)] bg-[hsl(var(--bg-medium))] p-4 text-[hsl(var(--text-light))] shadow-lg transition hover:bg-[hsl(var(--bg-light))]">
          <div className="z-10">
            <h3 className="font-bold text-lg">Revision Request</h3>
            <p className="text-sm text-[hsl(var(--text-medium))]">Click to Request</p>
          </div>
          <div className="z-10">
            <div style={{ backgroundColor: `hsl(var(--accent-red))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
              <ArrowRightIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </Link>
      </div>

      <Link href="https://drasticdigital.com/contact" target="_blank" rel="noopener noreferrer" className="relative flex h-[60px] w-full items-center justify-between overflow-hidden rounded-[var(--radius-lg)] bg-[hsl(var(--bg-medium))] px-4 text-[hsl(var(--text-light))] shadow-lg transition hover:bg-[hsl(var(--bg-light))]">
        <h3 className="font-bold">Get Support</h3>
        <div style={{ backgroundColor: `hsl(var(--accent-blue))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
          <ArrowRightIcon className="h-6 w-6 text-white" />
        </div>
      </Link>
    </div>
  );
};

export default function WebDesignProjectV2Page() {
  const { id: routeId } = useParams();
  const projectId = Array.isArray(routeId) ? routeId[0] : routeId;

  const { project } = useProject<WebDesignProject>(projectId as string, 'web_design');
  useProjectRealtime(projectId as string, 'web_design', 'web_design_projects');

  const [title, setTitle] = useState('Website Project');
  useEffect(() => {
    if (project?.title) setTitle(project.title);
  }, [project?.title]);

  const stageDates: Record<ProjectStage, string | null> = {
    discovery: project?.discovery_date ?? null,
    'concept-development': project?.concept_development_date ?? null,
    refinement: project?.refinement_date ?? null,
    finalization: project?.finalization_date ?? null,
    delivery: project?.delivery_date ?? null,
  };

  return (
    <div className="dark">
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* Background layers (fixed) */}
        <div className="absolute inset-0 z-0">
          <div className="fixed top-0 left-0 right-0 h-screen w-full will-change-transform">
            <div className="flex h-full flex-col">
              {/* Top header bar with logo */}
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

        {/* Go Back link */}
        <Link href="/client/projects/web-design" className="fixed z-20 left-6 top-14 flex items-center gap-2 text-white font-semibold" style={{ WebkitTextStroke: '0.6px black', textShadow: '0 0 2px rgba(0,0,0,0.9)' }}>
          <ArrowLeftIcon className="h-5 w-5 text-white" />
          <span>Go Back</span>
        </Link>

        {/* Centered Page Title */}
        <div className="fixed inset-x-0 z-10 flex items-center justify-center top-12 h-40">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-[0_6px_8px_rgba(0,0,0,0.6)]">{title}</h1>
        </div>

        {/* Foreground content */}
        <div
          className="absolute z-10 left-1/2 -translate-x-1/2"
          style={{ top: `${MIN_FRAME_TOP}px`, height: `max(${MIN_FRAME_H}px, 71.429vh)`, aspectRatio: FRAME_RATIO }}
        >
          <div className="h-full w-full grid grid-cols-[18.5fr_31fr_18.5fr] gap-6">
            <div className="col-span-2 flex h-full min-h-0 flex-col gap-6">
              {/* Timeline (spans across two columns) */}
              <DashboardCard className="p-0 overflow-hidden border-[5px] border-[#2c2c2c]">
                <div className="p-6">
                  <div className="mb-4">
                    <SectionLabel label="PROJECT STAGE" />
                    <p className="text-xl font-bold mt-1">{project?.current_stage ? PROJECT_STAGES.find(s => s.key === project.current_stage)?.label : 'Uninitialized'}</p>
                  </div>
                  <div className="pt-2">
                    <ProjectTimeline stages={PROJECT_STAGES} currentStage={project?.current_stage ?? null} stageDates={stageDates} />
                  </div>
                </div>
              </DashboardCard>

              {/* Action buttons grid: 2 rows x 3 columns */}
              <div className="grid grid-cols-3 gap-6">
                <Link href="/client/projects" className="relative flex h-[120px] w-full items-center justify-between overflow-hidden rounded-[var(--radius-lg)] bg-[hsl(var(--bg-medium))] p-4 text-[hsl(var(--text-light))] shadow-lg transition hover:bg-[hsl(var(--bg-light))]">
                  <div className="z-10">
                    <h3 className="font-bold text-lg">Active Projects</h3>
                    <p className="text-sm text-[hsl(var(--text-medium))]">Click to View</p>
                  </div>
                  <div className="z-10">
                    <div style={{ backgroundColor: `hsl(var(--accent-red))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
                      <ArrowRightIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </Link>

                <Link href="/client/projects" className="relative flex h-[120px] w-full items-center justify-between overflow-hidden rounded-[var(--radius-lg)] bg-[hsl(var(--bg-medium))] p-4 text-[hsl(var(--text-light))] shadow-lg transition hover:bg-[hsl(var(--bg-light))]">
                  <div className="z-10">
                    <h3 className="font-bold text-lg">Previous Projects</h3>
                    <p className="text-sm text-[hsl(var(--text-medium))]">Click to View</p>
                  </div>
                  <div className="z-10">
                    <div style={{ backgroundColor: `hsl(var(--accent-red))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
                      <ArrowRightIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </Link>

                <Link href={project?.client?.email ? `mailto:${project.client.email}` : '#'} className="relative flex h-[120px] w-full items-center justify-between overflow-hidden rounded-[var(--radius-lg)] bg-[hsl(var(--bg-medium))] p-4 text-[hsl(var(--text-light))] shadow-lg transition hover:bg-[hsl(var(--bg-light))]">
                  <div className="z-10">
                    <h3 className="font-bold text-lg">Email Project Lead</h3>
                    <p className="text-sm text-[hsl(var(--text-medium))]">Click to Contact</p>
                  </div>
                  <div className="z-10">
                    <div style={{ backgroundColor: `hsl(var(--accent-red))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
                      <ArrowRightIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </Link>

                <Link href="/client/my-profile-v2?edit=1" className="relative flex h-[120px] w-full items-center justify-between overflow-hidden rounded-[var(--radius-lg)] bg-[hsl(var(--bg-medium))] p-4 text-[hsl(var(--text-light))] shadow-lg transition hover:bg-[hsl(var(--bg-light))]">
                  <div className="z-10">
                    <h3 className="font-bold text-lg">Update Company Info</h3>
                    <p className="text-sm text-[hsl(var(--text-medium))]">Click to Edit</p>
                  </div>
                  <div className="z-10">
                    <div style={{ backgroundColor: `hsl(var(--accent-red))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
                      <ArrowRightIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </Link>

                <Link href={project ? `/client/projects/web-design/${project.id}?tab=files` : '#'} className="relative flex h-[120px] w-full items-center justify-between overflow-hidden rounded-[var(--radius-lg)] bg-[hsl(var(--bg-medium))] p-4 text-[hsl(var(--text-light))] shadow-lg transition hover:bg-[hsl(var(--bg-light))]">
                  <div className="z-10">
                    <h3 className="font-bold text-lg">Revision Request</h3>
                    <p className="text-sm text-[hsl(var(--text-medium))]">Click to Request</p>
                  </div>
                  <div className="z-10">
                    <div style={{ backgroundColor: `hsl(var(--accent-red))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
                      <ArrowRightIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </Link>

                <Link href="https://drasticdigital.com/contact" target="_blank" rel="noopener noreferrer" className="relative flex h-[120px] w-full items-center justify-between overflow-hidden rounded-[var(--radius-lg)] bg-[hsl(var(--bg-medium))] p-4 text-[hsl(var(--text-light))] shadow-lg transition hover:bg-[hsl(var(--bg-light))]">
                  <div className="z-10">
                    <h3 className="font-bold text-lg">Get Support</h3>
                    <p className="text-sm text-[hsl(var(--text-medium))]">Click for Help</p>
                  </div>
                  <div className="z-10">
                    <div style={{ backgroundColor: `hsl(var(--accent-blue))` }} className="flex h-10 w-10 items-center justify-center rounded-full">
                      <ArrowRightIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </Link>
              </div>

              {/* Message input spanning two columns */}
              <DashboardCard className="h-[68px] flex-row items-center justify-between px-4">
                <input
                  disabled
                  placeholder="Send Us A Direct Message..."
                  className="flex-1 bg-transparent text-[hsl(var(--text-light))] placeholder:text-[hsl(var(--text-medium))] outline-none"
                />
                <div style={{ backgroundColor: `hsl(var(--accent-red))` }} className="flex h-10 w-10 items-center justify-center rounded-full opacity-80">
                  <ArrowRightIcon className="h-6 w-6 text-white" />
                </div>
              </DashboardCard>
            </div>
            <RightColumn />
          </div>
        </div>
      </div>
    </div>
  );
}


