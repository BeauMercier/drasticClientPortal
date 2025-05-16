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

interface ProjectUserFile {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
}

interface ProjectFile {
  id: string;
  name: string;
  size: number;
  url: string;
  created_at: string;
}

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

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [projectUserFiles, setProjectUserFiles] = useState<ProjectUserFile[]>([]);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
  const [isDownloading, setIsDownloading] = useState<{[key: string]: boolean}>({});
  const [isDeleting, setIsDeleting] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  const { bir: fetchedBir, signedBirFiles, mutate: mutateBir, isLoading: birLoadingBir } = useBir(project?.id);

  const fetchProjectUserFiles = async (currentProjectId: string) => {
    if (!currentProjectId) return;
    setIsFetchingFiles(true);
    try {
      const response = await fetch(`/api/projects/${currentProjectId}/user-files`);
      if (!response.ok) {
        throw new Error('Failed to fetch project files');
      }
      const filesData = await response.json();
      setProjectUserFiles(filesData || []);
    } catch (err) {
      console.error('Error fetching project user files:', err);
      toast({ title: "Error", description: "Could not load project files.", variant: "destructive" });
      setProjectUserFiles([]);
    } finally {
      setIsFetchingFiles(false);
    }
  };

  const reloadProjectData = async () => {
    if (!projectId) return;

    console.log("Reloading project data and files...");
    try {
      await mutateProject();
      await fetchProjectUserFiles(projectId as string);
    } catch (err) {
      console.error('Error reloading project data:', err);
      toast({ title: "Error", description: "Failed to reload project details.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (project?.id) {
      fetchProjectUserFiles(project.id);
    }
  }, [project?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setSelectedFiles(fileArray);
    }
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0 || !projectId) {
        toast({
            title: "No files selected",
            description: "Please select files to upload.",
        });
        return;
    }

    const currentProjectType = 'web_design';
    const filesToUpload = [...selectedFiles];

    console.log('[handleFileUpload] Attempting upload...');
    console.log('[handleFileUpload] Project ID:', projectId);
    console.log('[handleFileUpload] Project Type:', currentProjectType);
    console.log('[handleFileUpload] Files to upload:', filesToUpload.map(f => f.name));
    if (!projectId) {
      console.error('[handleFileUpload] ERROR: Project ID is missing!');
      toast({ title: "Error", description: "Project ID is missing.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setSelectedFiles([]);
    let uploadSuccessCount = 0;
    let uploadErrorCount = 0;

    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('projectType', currentProjectType);

        console.log(`[handleFileUpload] FormData for ${file.name}:`);
        for (const pair of formData.entries()) {
           console.log(`  ${pair[0]}: ${pair[1]}`);
        }

        try {
          console.log('[handleFileUpload] Sending fetch request to /api/projects/files/upload...');
          const response = await fetch('/api/projects/files/upload', {
            method: 'POST',
            body: formData,
          });
          console.log('[handleFileUpload] Fetch response received:', response.status, response.statusText);

          if (!response.ok) {
            let errorMsg = `Failed to upload ${file.name}.`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (e) { /* Ignore if response body is not JSON */ }
            throw new Error(errorMsg);
          }
          
          uploadSuccessCount++;

        } catch (fileError) {
          console.error('Error uploading file:', file.name, fileError);
          uploadErrorCount++;
          toast({
            title: `Upload Error: ${file.name}`,
            description: fileError instanceof Error ? fileError.message : "An unknown error occurred.",
            variant: "destructive",
          });
        }
      }

      if (uploadSuccessCount > 0) {
          toast({
              title: "Upload Complete",
              description: `${uploadSuccessCount} file(s) uploaded successfully.`,
          });
          reloadProjectData();
      }
      if (uploadErrorCount > 0) {
         toast({
            title: "Upload Incomplete",
            description: `${uploadErrorCount} file(s) failed to upload. See console for details.`,
         });
      }

    } catch (overallError) {
      console.error('An unexpected error occurred during file upload:', overallError);
      toast({
        title: "Upload Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number | null | undefined): string => {
      if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string | null): React.ReactElement => {
      const type = fileType?.split('/')[0];
      if (type === 'image') {
          return <ImageIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />;
      }
      return <FileTextIcon className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" />;
  };

  const handleDownloadFile = async (file: ProjectUserFile) => {
    if (!file || !file.file_path) return;

    setIsDownloading(prev => ({ ...prev, [file.id]: true }));
    try {
      const urlResponse = await fetch(`/api/files/url?path=${encodeURIComponent(file.file_path)}&download=true`);

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json().catch(() => ({ error: "Failed to parse error response" }));
        throw new Error(errorData.error || `Failed to get download URL: ${urlResponse.statusText}`);
      }
      
      const responseData = await urlResponse.json();
      console.log('[handleDownloadFile] Raw response data from API:', responseData);
      
      const { url: signedUrl } = responseData;
      console.log('[handleDownloadFile] Destructured signedUrl:', signedUrl);

      if (!signedUrl) {
        throw new Error('Could not get download URL from API response');
      }

      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = file.file_name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Download Started", description: `Downloading ${file.file_name}...` });

    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Could not download file.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(prev => ({ ...prev, [file.id]: false }));
    }
  };

  const handleDeleteFile = async (file: ProjectUserFile) => {
    if (!file || !file.id) return;

    if (!confirm(`Are you sure you want to delete "${file.file_name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(prev => ({ ...prev, [file.id]: true }));
    try {
      const response = await fetch(`/api/user-files/${file.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMsg = 'Failed to delete file.';
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (e) { /* Ignore if response body is not JSON */ }
        throw new Error(errorMsg);
      }

      setProjectUserFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));

      toast({ title: "File Deleted", description: `"${file.file_name}" was deleted successfully.` });

    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Could not delete file.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(prev => ({ ...prev, [file.id]: false }));
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
      <header className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            Client: {project.client_name || 'N/A'} | Due Date: {project.due_date ? format(new Date(project.due_date), 'PPP') : 'N/A'}
          </p>
        </div>
        <Badge variant={project.status === 'completed' ? 'default' : 'outline'} className={project.status === 'completed' ? 'bg-green-500 text-white' : ''}>
          {project.status}
        </Badge>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
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

      <Tabs defaultValue="business_info" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="business_info">Business Information</TabsTrigger>
          <TabsTrigger value="project_files_bir">Project Files (BIR)</TabsTrigger>
        </TabsList>
        <TabsContent value="business_info">
          <BusinessInfoGate 
            projectId={project.id}
            projectType="web_design" // Hardcoded for this page
          />
        </TabsContent>
        <TabsContent value="project_files_bir">
          {fetchedBir?.id ? (
            <FileUploadStep 
              birId={fetchedBir.id} // Now definitely a string
              mutateBir={mutateBir}
              uploadedFiles={signedBirFiles || []}
              onUploadComplete={async () => {
                  await mutateBir();
                  toast({ title: "File Operation Complete", description: "BIR related files updated." });
              }}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  The Business Information Request (BIR) must be submitted before files can be uploaded here. Please complete the BIR in the "Business Information" tab.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Legacy File Upload Section - To be reviewed for removal or repurposing */}
      {/* This section's functionality might be fully replaced by BIR FileUploadStep */}
      {/* If removed, also remove related state and handlers: */}
      {/* selectedFiles, isUploading, projectUserFiles, isFetchingFiles, isDownloading, isDeleting */}
      {/* handleFileChange, handleFileUpload, formatFileSize, getFileIcon, fetchProjectUserFiles, handleDownloadFile, handleDeleteFile */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>General Project Files (Legacy)</CardTitle>
          <CardDescription>This section is under review. Files related to the Business Information Request should be managed in the "Project Files (BIR)" tab.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Legacy file upload section content */}
        </CardContent>
      </Card>
    </div>
  );
} 