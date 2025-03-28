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
  UploadCloudIcon
} from 'lucide-react';

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

  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Make sure id is a string
        const projectId = Array.isArray(id) ? id[0] : id;
        
        const projectData = await getWebDesignProject(projectId as string);
        console.log('Web Design Project Details:', projectData);
        
        if (!projectData) {
          throw new Error('Project not found');
        }
        
        setProject(projectData);
      } catch (err) {
        console.error('Error loading web design project:', err);
        setError('Failed to load project details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      loadProject();
    }
  }, [authLoading, user, id]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setSelectedFiles(fileArray);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    // Here you would implement the file upload to your backend/Supabase
    setIsUploading(true);
    try {
      // Upload files logic here
      console.log('Uploading files:', selectedFiles);
      
      // Mock success after 1 second
      setTimeout(() => {
        setIsUploading(false);
        setSelectedFiles([]);
        // Refresh project data after upload
        // loadProject();
      }, 1000);
    } catch (error) {
      console.error('Error uploading files:', error);
      setIsUploading(false);
    }
  };

  // Determine current stage index
  const getCurrentStageIndex = (project: WebDesignProject) => {
    if (project.delivery_completed) return 4;
    if (project.approval_completed) return 3;
    if (project.revisions_completed) return 2;
    if (project.initial_design_completed) return 1;
    if (project.discovery_completed) return 0;
    return 0; // Default to discovery stage
  };

  // Loading state
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

  // Error state
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

  // No project found
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
      
      {/* Project Timeline */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Timeline visualization */}
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
              
              {/* Progress bar */}
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
            
            {/* Current stage description and actions */}
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
                  
                  {/* Business Info Section */}
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
                  
                  {/* File Upload Section */}
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
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Selected Files ({selectedFiles.length})</h5>
                        <ul className="space-y-1 mb-4">
                          {selectedFiles.map((file, index) => (
                            <li key={index} className="text-sm">
                              {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </li>
                          ))}
                        </ul>
                        <Button 
                          onClick={handleFileUpload} 
                          disabled={isUploading}
                        >
                          {isUploading ? 'Uploading...' : 'Upload Files'}
                        </Button>
                      </div>
                    )}
                    
                    {/* Previously uploaded files */}
                    {project.files && project.files.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Your Uploaded Files</h5>
                        <ul className="space-y-1">
                          {project.files.map((file, index) => (
                            <li key={index} className="text-sm flex items-center">
                              <span className="flex-1">{file.name}</span>
                              <Button variant="ghost" size="sm">View</Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
      
      {/* Project Details */}
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
      
      {/* Need Help? */}
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