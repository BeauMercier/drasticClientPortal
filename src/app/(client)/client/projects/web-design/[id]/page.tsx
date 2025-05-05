'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { getWebDesignProject } from '@/lib/api/client-api';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

type WebDesignProject = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  project_type: 'web_design';
  website_type?: string;
  current_stage?: string;
  is_placeholder?: boolean;
  created_at: string;
  updated_at: string;
  discovery_completed?: boolean;
  discovery_date?: string | null;
  initial_design_completed?: boolean;
  initial_design_date?: string | null;
  revisions_completed?: boolean;
  revisions_date?: string | null;
  approval_completed?: boolean;
  approval_date?: string | null;
  delivery_completed?: boolean;
  delivery_date?: string | null;
  files?: ProjectFile[];
  business_info_submitted?: boolean;
};

// Define the stages in order
const PROJECT_STAGES = [
  { key: 'discovery', label: 'Discovery', icon: LightbulbIcon },
  { key: 'initial_design', label: 'Initial Design', icon: PencilIcon },
  { key: 'revisions', label: 'Revisions', icon: RotateCcwIcon },
  { key: 'approval', label: 'Approval', icon: CheckCircleIcon },
  { key: 'delivery', label: 'Delivery', icon: PackageIcon },
];

export default function WebDesignProjectDetails() {
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const [project, setProject] = useState<WebDesignProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessInfoExpanded, setBusinessInfoExpanded] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [projectUserFiles, setProjectUserFiles] = useState<ProjectUserFile[]>([]);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
  const [isDownloading, setIsDownloading] = useState<{[key: string]: boolean}>({});
  const [isDeleting, setIsDeleting] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  const fetchProjectUserFiles = async (projectId: string) => {
    if (!projectId) return;
    setIsFetchingFiles(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/user-files`);
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
    const projectId = Array.isArray(id) ? id[0] : id;
    if (!projectId) return;

    console.log("Reloading project data and files...");
    setIsLoading(true);
    try {
      const projectData = await getWebDesignProject(projectId as string);
      if (projectData) {
        setProject(projectData);
      }
      await fetchProjectUserFiles(projectId as string);
    } catch (err) {
      console.error('Error reloading project data:', err);
      setError('Failed to reload project details.');
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const projectId = Array.isArray(id) ? id[0] : id;
      if (!projectId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const projectData = await getWebDesignProject(projectId as string);
        console.log('Web Design Project Details:', projectData);
        if (!projectData) {
          throw new Error('Project not found');
        }
        setProject(projectData);

        await fetchProjectUserFiles(projectId as string);

      } catch (err) {
        console.error('Error loading initial project data:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to load project details. Please try again later.';
        setError(errorMsg);
        setProject(null);
        setProjectUserFiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user && id) {
      loadInitialData();
    }
  }, [authLoading, user, id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setSelectedFiles(fileArray);
    }
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0 || !id) {
        toast({
            title: "No files selected",
            description: "Please select files to upload.",
        });
        return;
    }

    const projectId = Array.isArray(id) ? id[0] : id;
    const projectType = 'web_design';
    const filesToUpload = [...selectedFiles];

    console.log('[handleFileUpload] Attempting upload...');
    console.log('[handleFileUpload] Project ID:', projectId);
    console.log('[handleFileUpload] Project Type:', projectType);
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
        formData.append('projectType', projectType);

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

  const getCurrentStageIndex = (project: WebDesignProject) => {
    if (project.delivery_completed) return 4;
    if (project.approval_completed) return 3;
    if (project.revisions_completed) return 2;
    if (project.initial_design_completed) return 1;
    if (project.discovery_completed) return 0;
    return 0;
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

  // Handle file deletion
  const handleDeleteFile = async (file: ProjectUserFile) => {
    if (!file || !file.id) return;

    // Confirmation dialog
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

      // Remove file from local state immediately for better UX
      setProjectUserFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));

      toast({ title: "File Deleted", description: `"${file.file_name}" was deleted successfully.` });

    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Could not delete file.",
        variant: "destructive"
      });
      // Optionally refetch files if delete failed to ensure UI consistency
      // reloadProjectData(); 
    } finally {
      setIsDeleting(prev => ({ ...prev, [file.id]: false }));
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-60 rounded-lg md:col-span-2" />
          <Skeleton className="h-40 rounded-lg md:col-span-3" />
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 text-center p-4">Error: {error}</p>;
  }

  if (!project) {
    return <p className="text-center p-4">Project not found.</p>;
  }

  const currentStageIndex = getCurrentStageIndex(project);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{project.title}</h1>
        <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="mt-2 md:mt-0 capitalize">
          {project.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 overflow-x-auto pb-2">
            {PROJECT_STAGES.map((stage, index) => (
              <div key={stage.key} className="flex flex-col items-center flex-shrink-0 w-28">
                <div className={`p-3 rounded-full ${index <= currentStageIndex ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <stage.icon className="h-6 w-6" />
                </div>
                <span className={`mt-2 text-xs font-medium ${index <= currentStageIndex ? 'text-blue-600' : 'text-gray-500'}`}>
                  {stage.label}
                </span>
                {index < PROJECT_STAGES.length - 1 && (
                  <div className={`absolute top-1/2 left-full w-full h-0.5 ${index < currentStageIndex ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ transform: 'translateY(-50%)' }}></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <BusinessInfoGate 
             projectId={project.id}
             projectType={project.project_type || 'web_design'}
           />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Project Files</h3>
              <Button variant="ghost" size="sm">
                {isFetchingFiles ? 'Loading...' : 'Hide'}
              </Button>
            </div>
            {isFetchingFiles ? (
              <p className="text-sm text-muted-foreground">Loading files...</p>
            ) : projectUserFiles.length > 0 ? (
              <ul className="space-y-2 border rounded-md p-3 bg-white">
                {projectUserFiles.map((file) => (
                  <li key={file.id} className="text-sm flex items-center justify-between py-1 border-b last:border-b-0">
                    <div className="flex items-center overflow-hidden mr-2">
                      {getFileIcon(file.file_type)}
                      <span className="truncate" title={file.file_name}>{file.file_name}</span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(file.uploaded_at), 'MMM d, yyyy')}</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          // onClick={() => handleDownloadFile(file)} // Temporarily comment out to stop error flood
                          disabled={isDownloading[file.id] || isDeleting[file.id]}
                        >
                          {isDownloading[file.id] ? 'Downloading...' : <DownloadIcon className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteFile(file)}
                          disabled={isDownloading[file.id] || isDeleting[file.id]}
                        >
                           {isDeleting[file.id] ? 'Deleting...' : <Trash2Icon className="h-4 w-4" />}
                        </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No files uploaded for this project yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{project.description || "No description provided."}</p>
        </CardContent>
      </Card>
    </div>
  );
} 