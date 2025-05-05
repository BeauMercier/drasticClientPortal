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
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center mb-6">
          <Skeleton className="h-8 w-1/3" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4 mb-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Project Details</h1>
        </div>
        <Card className="text-center p-8">
          <CardContent className="pt-6">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Project Details</h1>
        </div>
        <Card className="text-center p-8">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-4">Project Not Found</h3>
            <p className="text-muted-foreground mb-6">
              The requested project could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStageIndex = getCurrentStageIndex(project);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{project.title || 'Web Design Project'}</h1>
          <p className="text-muted-foreground">
            Last updated: {format(new Date(project.updated_at), 'MMMM d, yyyy')}
          </p>
        </div>
        <Badge className="text-sm px-3 py-1">
          {project.status.replace(/_/g, ' ')}
        </Badge>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                {PROJECT_STAGES.map((stage, index) => {
                  const Icon = stage.icon;
                  const isCompleted = index < currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  const date = project[`${stage.key}_date` as keyof typeof project] as string | undefined;
                  
                  return (
                    <div key={stage.key} className="flex flex-col items-center text-center">
                      <div 
                        className={`w-16 h-16 rounded-full flex items-center justify-center 
                          ${isCompleted ? 'bg-green-100' : isCurrent ? 'bg-blue-100' : 'bg-gray-100'}`}
                      >
                        <Icon 
                          className={`h-8 w-8 
                            ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'}`} 
                        />
                      </div>
                      <span className={`mt-2 font-medium ${isCurrent ? 'text-blue-600' : ''}`}>
                        {stage.label}
                      </span>
                      {date && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="relative h-2 bg-gray-100 rounded-full">
                <div 
                  className="absolute top-0 left-0 h-2 bg-blue-600 rounded-full"
                  style={{ width: `${Math.min(100, (currentStageIndex / (PROJECT_STAGES.length - 1)) * 100)}%` }}
                ></div>
                {PROJECT_STAGES.map((_, index) => (
                  <div 
                    key={index}
                    className={`absolute top-0 w-4 h-4 -mt-1 rounded-full 
                      ${index <= currentStageIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
                    style={{ left: `${(index / (PROJECT_STAGES.length - 1)) * 100}%` }}
                  ></div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium mb-2">
                {PROJECT_STAGES[currentStageIndex].label} Stage
              </h3>
              
              {currentStageIndex === 0 && (
                <div className="space-y-4">
                  <p>
                    In this discovery phase, we need to gather essential information about your business 
                    and brand to create a website that perfectly represents your company.
                  </p>
                  
                  <div className="border rounded-md overflow-hidden">
                    <div 
                      className="flex justify-between items-center p-3 bg-gray-100 cursor-pointer"
                      onClick={() => setBusinessInfoExpanded(!businessInfoExpanded)}
                    >
                      <h4 className="font-medium">Business Information</h4>
                      <Button variant="ghost" size="sm">
                        {businessInfoExpanded ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                    
                    {businessInfoExpanded && (
                      <div className="p-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Please complete the business information form to help us understand your brand and business needs.
                        </p>
                        
                        <Button asChild variant="default">
                          <a href="/business-info">
                            {project.business_info_submitted 
                              ? 'Update Business Information' 
                              : 'Complete Business Information Form'}
                          </a>
                        </Button>
                        
                        {project.business_info_submitted && (
                          <Badge className="ml-2">Completed</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-md p-4 space-y-4">
                    <h4 className="font-medium">Upload Brand Assets & Photos</h4>
                    <p className="text-sm text-muted-foreground">
                      Please upload your logo, brand assets, product/service photos, team photos, and any other visual 
                      materials we should incorporate into your website design.
                    </p>
                    
                    <div className="border-2 border-dashed rounded-md p-6 text-center">
                      <UploadCloudIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Drag and drop files here, or click to browse
                      </p>
                      <input 
                        type="file" 
                        id="file-upload" 
                        multiple 
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Button asChild variant="secondary">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <FileUpIcon className="h-4 w-4 mr-2" />
                          Browse Files
                        </label>
                      </Button>
                    </div>
                    
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 text-center">
                        <p className="text-sm mb-2">
                          {selectedFiles.length} file(s) selected:
                        </p>
                        <ul className="text-xs text-left max-w-xs mx-auto mb-3 list-disc list-inside">
                          {selectedFiles.map(file => <li key={file.name} className="truncate">{file.name}</li>)}
                        </ul>
                        <Button 
                          onClick={handleFileUpload} 
                          disabled={isUploading}
                        >
                          {isUploading ? 'Uploading...' : <><UploadCloudIcon className="h-4 w-4 mr-2" /> Upload Selected Files</>}
                        </Button>
                      </div>
                    )}

                    <div className="mt-6">
                      <h5 className="font-medium mb-2">Project Files</h5>
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
                  </div>
                </div>
              )}
              
              {currentStageIndex === 1 && (
                <div className="space-y-4">
                  <p>
                    We are working on your initial website design based on the information provided. 
                    Our designer will create a layout and visual identity for your approval.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please check back soon for design updates or contact us if you have any questions.
                  </p>
                </div>
              )}
              
              {currentStageIndex === 2 && (
                <div className="space-y-4">
                  <p>
                    We&apos;re in the revisions phase. Our team is making adjustments based on your feedback 
                    to refine the website design.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You can provide additional feedback or request changes using the form below.
                  </p>
                  <Button>Submit Feedback</Button>
                </div>
              )}
              
              {currentStageIndex === 3 && (
                <div className="space-y-4">
                  <p>
                    Your website design is ready for final approval. Please review the design and confirm 
                    that everything meets your expectations.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="secondary">Request Changes</Button>
                    <Button>Approve Design</Button>
                  </div>
                </div>
              )}
              
              {currentStageIndex === 4 && (
                <div className="space-y-4">
                  <p>
                    Your website is complete and ready for delivery! We&apos;ll coordinate with you for the 
                    final launch and handover.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your project manager will contact you to schedule the launch and provide access credentials.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="text-sm text-muted-foreground">
                {project.description || 'No description provided.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Website Type</h3>
                <p className="text-sm text-muted-foreground">
                  {project.website_type?.replace(/_/g, ' ') || 'Standard Website'}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Start Date</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(project.created_at), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="font-medium text-lg">Need help with your project?</h3>
            <p className="text-sm text-muted-foreground">
              Contact our support team for any questions or assistance.
            </p>
          </div>
          <Button variant="outline">Contact Support</Button>
        </CardContent>
      </Card>
    </div>
  );
} 