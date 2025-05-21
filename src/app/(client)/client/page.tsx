'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ActiveClientProject, ProjectStage, ProjectType } from '@/lib/types/project';
import ProjectTimeline, { StageConfig } from '@/components/projects/ProjectTimeline';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  ArrowRightIcon, BriefcaseIcon, BellIcon, LinkIcon, 
  NewspaperIcon, QuestionMarkCircleIcon, SparklesIcon
} from '@heroicons/react/24/outline';
import { Zap, Lightbulb, PenTool, ShieldCheck, Package } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getUserProfile } from '@/lib/api/client-api';
import { Tables } from '@/lib/database.types';
import { useAuthContext } from '@/features/auth/contexts/AuthContext';

/**
 * @constant {StageConfig[]} stageConfigs
 * Configuration for the stages displayed in the ProjectTimeline component.
 * Each object defines a stage's key, display label, and associated icon.
 */
const stageConfigs: StageConfig[] = [
  { key: 'discovery', label: 'Discovery', icon: Zap },
  { key: 'concept-development', label: 'Concept', icon: Lightbulb },
  { key: 'refinement', label: 'Refinement', icon: PenTool },
  { key: 'finalization', label: 'Finalization', icon: ShieldCheck },
  { key: 'delivery', label: 'Delivery', icon: Package },
];

/**
 * ClientDashboardPage component.
 * 
 * Displays an overview for the authenticated client, including:
 * - A personalized welcome message.
 * - A section for "Active Projects", showing a timeline for a single project or cards for multiple projects.
 * - A "Quick Links" section for easy navigation to relevant parts of the portal or external resources.
 * 
 * Fetches active projects and user profile information to dynamically render content.
 */
export default function ClientDashboardPage() {
  const { user: authUser, isLoading: authIsLoading, error: authError } = useAuthContext();
  const [activeProjects, setActiveProjects] = useState<ActiveClientProject[]>([]);
  const [userProfile, setUserProfile] = useState<Tables<'profiles'> | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingProfileDetails, setIsLoadingProfileDetails] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActiveProjects() {
      setIsLoadingProjects(true);
      setProjectsError(null);
      try {
        const projectsResponse = await fetch('/api/client/active-projects');
        if (!projectsResponse.ok) {
          const errorData = await projectsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch active projects');
        }
        const projectsData: ActiveClientProject[] = await projectsResponse.json();
        console.log('[Dashboard] Raw projectsData from API:', JSON.stringify(projectsData, null, 2));
        setActiveProjects(projectsData);
      } catch (err) {
        const e = err as Error;
        console.error("Dashboard projects fetch error:", e.message);
        setProjectsError(e.message);
      } finally {
        setIsLoadingProjects(false);
      }
    }

    async function fetchDetailedProfile() {
      if (authUser && !authIsLoading) {
        setIsLoadingProfileDetails(true);
        try {
          const profileData = await getUserProfile();
          setUserProfile(profileData);
        } catch (err) {
          console.error("Dashboard detailed profile fetch error:", (err as Error).message);
        } finally {
          setIsLoadingProfileDetails(false);
        }
      } else if (!authIsLoading) {
        setIsLoadingProfileDetails(false);
        setUserProfile(null);
      }
    }

    fetchActiveProjects();
    fetchDetailedProfile();
  }, [authUser, authIsLoading]);

  /**
   * @const {Array<Object>} quickLinks
   * Configuration for the "Quick Links" section of the dashboard.
   * Each object defines a link with properties for its title, description, URL (href),
   * icon, background color (`bgColor`), text colors for base elements (`baseTextColor`)
   * and descriptions (`descriptionTextColor`), button styling classes (`buttonClasses`),
   * button text, disabled state, and whether it's an external link.
   * These properties are used to render theme-aware cards for each quick link.
   */
  const quickLinks = [
    {
      title: 'Website Dashboard',
      description: 'Access your website analytics.',
      href: userProfile?.website_dashboard_url || '#',
      icon: NewspaperIcon,
      bgColor: 'bg-blue-100 dark:bg-blue-600',
      baseTextColor: 'text-blue-700 dark:text-blue-100',
      descriptionTextColor: 'text-blue-600 dark:text-blue-200',
      buttonClasses: 'bg-blue-200 hover:bg-blue-300 text-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 dark:text-blue-50',
      buttonText: 'Go to Dashboard',
      disabled: !userProfile?.website_dashboard_url,
      external: !!userProfile?.website_dashboard_url,
    },
    {
      title: 'Lead Dashboard',
      description: 'View and manage your leads.',
      href: 'https://Leads.DrasticDigital.com',
      icon: SparklesIcon,
      bgColor: 'bg-green-100 dark:bg-green-600',
      baseTextColor: 'text-green-700 dark:text-green-100',
      descriptionTextColor: 'text-green-600 dark:text-green-200',
      buttonClasses: 'bg-green-200 hover:bg-green-300 text-green-700 dark:bg-green-500 dark:hover:bg-green-400 dark:text-green-50',
      buttonText: 'Go to Leads',
      external: true,
      disabled: false,
    },
    // {
    //   title: 'Project Files',
    //   description: 'Access all your project files.',
    //   href: '/client/files',
    //   icon: BriefcaseIcon,
    //   bgColor: 'bg-purple-100 dark:bg-purple-600',
    //   baseTextColor: 'text-purple-700 dark:text-purple-100',
    //   descriptionTextColor: 'text-purple-600 dark:text-purple-200',
    //   buttonClasses: 'bg-purple-200 hover:bg-purple-300 text-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 dark:text-purple-50',
    //   buttonText: 'Browse Files',
    //   external: false,
    //   disabled: false,
    // }, Commenting out as /client/files is removed
    {
      title: 'Support',
      description: 'Get help or browse documentation.',
      href: 'https://drasticdigital.com/contact',
      icon: QuestionMarkCircleIcon,
      bgColor: 'bg-amber-100 dark:bg-amber-600',
      baseTextColor: 'text-amber-700 dark:text-amber-100',
      descriptionTextColor: 'text-amber-600 dark:text-amber-200',
      buttonClasses: 'bg-amber-200 hover:bg-amber-300 text-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-amber-50',
      buttonText: 'Contact Support',
      external: true,
      disabled: false,
    },
  ];

  const projectStageDates = (project: ActiveClientProject): Record<ProjectStage, string | null> => ({
    'discovery': project.discovery_date,
    'concept-development': project.concept_development_date,
    'refinement': project.refinement_date,
    'finalization': project.finalization_date,
    'delivery': project.delivery_date,
  });

  const getFirstName = () => {
    if (authUser?.full_name) {
      return authUser.full_name.split(' ')[0];
    }
    return 'Client'; // Fallback
  };

  const mainContentIsLoading = isLoadingProjects || authIsLoading;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Hi {authIsLoading ? '...' : getFirstName()}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's an overview of your projects and resources.</p>
      </header>

      {/* Active Projects Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-6 text-gray-700 dark:text-gray-300 flex items-center">
          <BriefcaseIcon className="h-6 w-6 mr-2" /> Active Projects
        </h2>
        {mainContentIsLoading && activeProjects.length === 0 && <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>}
        {projectsError && !mainContentIsLoading && <p className="text-red-500">Error loading projects: {projectsError}</p>}
        {!mainContentIsLoading && !projectsError && (
          <>
            {activeProjects.length === 0 && (
              <p className="text-gray-600 dark:text-gray-400">You have no active projects at the moment.</p>
            )}
            {activeProjects.length === 1 && activeProjects[0] && (() => {
              const project = activeProjects[0];
              const projectLinkHref = `/client/projects/${project.project_type}/${project.id}`;
              console.log(`[Dashboard] Single project link href: ${projectLinkHref}`);
              return (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">{project.title}</CardTitle>
                    <Badge variant="secondary" className="w-fit">{project.project_type.replace('_', ' ').toUpperCase()}</Badge>
                  </CardHeader>
                  <CardContent>
                    {project.current_stage && (
                      <ProjectTimeline
                        stages={stageConfigs}
                        currentStage={project.current_stage} 
                        stageDates={projectStageDates(project)}
                      />
                    )}
                    {!project.current_stage && <p className="text-gray-500">Project stage information not available.</p>}
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Link href={projectLinkHref} passHref prefetch={false}>
                      <Button variant="default">View Project <ArrowRightIcon className="ml-2 h-4 w-4" /></Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })()}
            {activeProjects.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeProjects.map((project) => {
                  const projectLinkHref = `/client/projects/${project.project_type}/${project.id}`;
                  console.log(`[Dashboard] Multi-project link href for ${project.id}: ${projectLinkHref}`);
                  return (
                    <Card key={project.id} className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle>{project.title}</CardTitle>
                        <Badge variant="outline">{project.project_type.replace('_', ' ').toUpperCase()}</Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Current Stage: <span className="font-semibold">{project.current_stage ? project.current_stage.replace('-', ' ') : 'N/A'}</span>
                        </p>
                        {project.thumbnail_url && (
                          <img src={project.thumbnail_url} alt={project.title} className="rounded-md aspect-video object-cover my-2" />
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-end">
                        <Link href={projectLinkHref} passHref prefetch={false}>
                          <Button variant="outline" size="sm">View Details <ArrowRightIcon className="ml-2 h-4 w-4" /></Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* Quick Links Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center">
          <LinkIcon className="h-6 w-6 mr-2" /> Quick Links
        </h2>
        {(isLoadingProfileDetails || authIsLoading) && <p className="text-gray-600 dark:text-gray-400">Loading links...</p>}
        {!(isLoadingProfileDetails || authIsLoading) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link) => (
              <Card key={link.title} className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ${link.bgColor} ${link.disabled ? 'opacity-70' : ''}`}> 
                <CardHeader>
                  <div className="flex items-center space-x-3">
                      <link.icon className={`h-8 w-8 ${link.baseTextColor}`} /> 
                      <CardTitle className={`text-xl ${link.baseTextColor}`}>{link.title}</CardTitle> 
                  </div>
                </CardHeader>
                <CardContent>
                  <p className={`${link.descriptionTextColor}`}>{link.description}</p> 
                </CardContent>
                <CardFooter>
                  {link.external ? (
                    <a 
                      href={link.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`w-full ${link.disabled ? 'pointer-events-none' : ''}`}
                    >
                      <Button variant="default" className={`w-full ${link.buttonClasses}`} disabled={link.disabled}>
                          {link.buttonText} <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  ) : (
                    <Link href={link.href} passHref legacyBehavior={link.disabled || link.href === '#'}> 
                      <a className={`w-full ${link.disabled ? 'pointer-events-none' : ''}`}> 
                        <Button variant="default" className={`w-full ${link.buttonClasses}`} disabled={link.disabled}>
                            {link.buttonText} <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </Button>
                      </a>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Notifications Section has been removed */}
    </div>
  );
} 