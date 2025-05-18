'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LightbulbIcon, 
  PencilIcon, 
  RotateCcwIcon, 
  CheckCircleIcon, 
  PackageIcon, 
  FileUpIcon,
  UploadCloudIcon,
  FileTextIcon,
  ImageIcon,
  Trash2Icon,
  DownloadIcon
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import BusinessInfoGate from '@/features/bir/BusinessInfoGate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUploadStep from '@/features/bir/steps/FileUploadStep';
import { useBir } from '@/features/bir/useBir';
import { WebDesignProject, ProjectStage } from '@/lib/types/project';
import { useProject } from '@/features/projects/hooks/useProject';
import ProjectTimeline, { StageConfig } from '@/components/projects/ProjectTimeline';
import { useProjectRealtime } from '@/features/projects/hooks/useProjectRealtime';

// Define the stages in order, aligning keys with ProjectStage type
const PROJECT_STAGES: StageConfig[] = [
  { key: 'discovery', label: 'Discovery', icon: LightbulbIcon },
  { key: 'concept-development', label: 'Initial Design', icon: PencilIcon },
  { key: 'refinement', label: 'Revisions', icon: RotateCcwIcon },
  { key: 'finalization', label: 'Approval', icon: CheckCircleIcon },
  { key: 'delivery', label: 'Delivery', icon: PackageIcon },
];

export default function WebDesignProjectDetails() {
  const { id: routeId } = useParams();
  const projectId = Array.isArray(routeId) ? routeId[0] : routeId;

  const { user, isLoading: authLoading } = useAuth();
  const { 
    project, 
    isLoading: projectLoading,
    error: projectError,
    mutate: mutateProject
  } = useProject<WebDesignProject>(projectId as string, 'web_design');
  
  useProjectRealtime(projectId as string, 'web_design', 'web_design_projects');

  const { toast } = useToast();

  const { bir: fetchedBir, signedBirFiles, mutate: mutateBir, isLoading: birLoadingBir } = useBir(project?.id);

  const reloadProjectData = async () => {
    if (!projectId) return;

    console.log("Reloading project and BIR data...");
    try {
      await mutateProject();
      await mutateBir();
    } catch (err) {
      console.error('Error reloading project data:', err);
      toast({ title: "Error", description: "Failed to reload project details.", variant: "destructive" });
    }
  };

  if (authLoading || projectLoading || birLoadingBir) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-8 w-1/4" />
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
            <CardContent><Skeleton className="h-20 w-full" /></CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
            <CardContent><Skeleton className="h-20 w-full" /></CardContent>
          </Card>
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (projectError) {
    return <div className="p-6 text-red-500">Error loading project: {projectError.message}</div>;
  }

  if (!project) {
    return <div className="p-6">Project not found.</div>;
  }

  // TEMPORARY DEBUG LOG
  console.log('[Project debug]', {
    current_stage: project.current_stage,
    discovery_date: project.discovery_date,
    concept_development_date: project.concept_development_date,
    refinement_date: project.refinement_date,
    finalization_date: project.finalization_date,
    delivery_date: project.delivery_date,
  });

  // Create stageDates mapping for the new ProjectTimeline component
  const stageDates: Record<ProjectStage, string | null> = {
    discovery: project.discovery_date,
    'concept-development': project.concept_development_date,
    refinement: project.refinement_date,
    finalization: project.finalization_date,
    delivery: project.delivery_date,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{project.title}</CardTitle>
          <CardDescription>
            Current Stage: {project.current_stage ? PROJECT_STAGES.find(s => s.key === project.current_stage)?.label : 'Uninitialized'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectTimeline
            stages={PROJECT_STAGES}
            currentStage={project.current_stage}
            stageDates={stageDates}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="business-info" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger 
            value="business-info" 
            className="text-lg font-semibold py-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
          >
            Business Info
          </TabsTrigger>
          <TabsTrigger 
            value="bir-files" 
            className="text-lg font-semibold py-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
          >
            Project Files
          </TabsTrigger>
        </TabsList>
        <TabsContent value="business-info">
          <BusinessInfoGate 
            projectId={project.id}
            projectType="web_design" // Hardcoded for this page
          />
        </TabsContent>
        <TabsContent value="bir-files">
          <Card>
            <CardContent className="pt-6">
              {fetchedBir && fetchedBir.id ? (
                <FileUploadStep 
                  birId={fetchedBir.id} 
                  uploadedFiles={signedBirFiles || []} 
                  mutateBir={mutateBir}
                />
              ) : (
                <p className="text-muted-foreground italic">
                  Please complete the Business Information section first to enable file uploads for the BIR.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
} 