'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../features/auth';
import { Card } from '../../../../shared/ui/molecules';
import { 
  getClientProjectsForCategories, 
  ProjectCategoryCounts 
} from '../../../../lib/api/client-api';
import { ProjectType } from '@/lib/types/project';

export default function ProjectsPage() {
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth();
  const router = useRouter();
  
  const [projectInfo, setProjectInfo] = useState<ProjectCategoryCounts>({});
  const [projectsLoading, setProjectsLoading] = useState<boolean>(true);
  
  // Project categories with descriptions and links
  const projectCategories: { id: ProjectType; slug: string; name: string; description: string; icon: JSX.Element; }[] = [
    {
      id: 'web_design',
      slug: 'web-design',
      name: 'Web Design',
      description: 'Responsive websites tailored to your brand and audience',
      icon: (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
      )
    },
    {
      id: 'logo_design',
      slug: 'logo-design',
      name: 'Logo Design',
      description: 'Professional logo designs to represent your brand identity',
      icon: (
        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
        </svg>
      )
    },
    {
      id: 'social_graphics',
      slug: 'social-graphics',
      name: 'Social Graphics',
      description: 'Eye-catching graphics for your social media platforms',
      icon: (
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      )
    }
  ];
  
  useEffect(() => {
    if (!authIsLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authIsLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchProjectData = async () => {
        setProjectsLoading(true);
        try {
          const data = await getClientProjectsForCategories();
          setProjectInfo(data);
        } catch (error) {
          // console.error("Failed to fetch project counts:", error);
        } finally {
          setProjectsLoading(false);
        }
      };
      fetchProjectData();
    }
  }, [isAuthenticated, user]);

  // Show loading state while checking authentication or fetching projects
  if (authIsLoading || (isAuthenticated && projectsLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">My Projects</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Access your design projects and track their progress. Choose a project category below to view your active projects.
          </p>
        </div>

        {/* Project categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projectCategories.map((category) => {
            const categoryProjectInfo = projectInfo[category.id];
            const count = categoryProjectInfo?.count || 0;
            const singleProjectId = categoryProjectInfo?.singleProjectId;

            let href = `/client/projects/${category.slug}`;
            let linkText = "View Projects";

            if (count === 1 && singleProjectId) {
              href = `/client/projects/${category.slug}/${singleProjectId}`;
              linkText = "View Project";
            }

            return (
              <Link href={projectsLoading ? '#' : href} key={category.id} passHref legacyBehavior={projectsLoading ? true : undefined}>
                <a className={`${projectsLoading ? 'pointer-events-none opacity-50' : ''}`}>
                  <Card className="h-full bg-white dark:bg-black shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer">
                    <div className="p-6 flex flex-col h-full">
                      <div className="mb-4">
                        {category.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{category.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm flex-grow">{category.description}</p>
                      <div className="mt-6">
                        <span className="text-blue-600 dark:text-blue-400 flex items-center text-sm font-medium">
                          {projectsLoading ? 'Loading...' : linkText}
                          {!projectsLoading && (
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          )}
                        </span>
                      </div>
                    </div>
                  </Card>
                </a>
              </Link>
            );
          })}
        </div>

        {/* Support section */}
        <div className="mt-16 bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Need help or want to start a new project?</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Contact our support team to discuss your requirements or request a new design project.
          </p>
          <a
            href="https://www.drasticdigital.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-800"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
} 