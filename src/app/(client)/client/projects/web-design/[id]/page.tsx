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
  DownloadIcon,
  ListIcon,
  GridIcon,
  ArrowDownUpIcon,
  ArrowDownIcon,
  ArrowUpIcon
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import BusinessInfoGate from '@/features/bir/BusinessInfoGate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUploadStep from '@/features/bir/steps/FileUploadStep';
import { useBir } from '@/features/bir/useBir';
import { WebDesignProject, ProjectStage, ProjectFile } from '@/lib/types/project';
import { useProject } from '@/features/projects/hooks/useProject';
import ProjectTimeline, { StageConfig } from '@/components/projects/ProjectTimeline';
import { useProjectRealtime } from '@/features/projects/hooks/useProjectRealtime';
import { FILES_BUCKET } from '@/lib/api/storage'; // Added for constructing URLs if needed
import { DocumentIcon } from '@heroicons/react/24/outline'; // For getFileIcon
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define the stages in order, aligning keys with ProjectStage type
const PROJECT_STAGES: StageConfig[] = [
  { key: 'discovery', label: 'Discovery', icon: LightbulbIcon },
  { key: 'concept-development', label: 'Initial Design', icon: PencilIcon },
  { key: 'refinement', label: 'Revisions', icon: RotateCcwIcon },
  { key: 'finalization', label: 'Approval', icon: CheckCircleIcon },
  { key: 'delivery', label: 'Delivery', icon: PackageIcon },
];

export default function WebDesignProjectDetails() {
  console.log("Attempting to load WebDesignProjectDetails page...");
  const { id: routeId } = useParams();
  const projectId = Array.isArray(routeId) ? routeId[0] : routeId;
  const projectType = 'web_design'; // Hardcoded for this page

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

  // New state for general client files and the merged list
  const [generalClientFiles, setGeneralClientFiles] = useState<ProjectFile[]>([]);
  const [allClientProjectFiles, setAllClientProjectFiles] = useState<ProjectFile[]>([]);

  // State for file display options (ported from designer page)
  const [fileViewMode, setFileViewMode] = useState<'list' | 'gallery'>('gallery'); // Default to gallery
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const reloadProjectData = async () => {
    if (!projectId) return;

    console.log("Reloading project and BIR data...");
    try {
      await mutateProject();
      await mutateBir();
      await fetchGeneralClientFiles(); // Also reload general client files
    } catch (err) {
      console.error('Error reloading project data:', err);
      toast({ title: "Error", description: "Failed to reload project details.", variant: "destructive" });
    }
  };

  // Function to fetch general client-uploaded project files
  // Placeholder - needs actual API endpoint and logic to identify client-uploaded general files
  const fetchGeneralClientFiles = async () => {
    if (!projectId || !projectType) return;
    console.log("Fetching general client-uploaded project files...");
    try {
      // TODO: Replace with actual API call. 
      // This might involve a new endpoint or enhancing /api/projects/files
      // to filter by uploader or fetch files specifically from a client's context.
      // For now, simulating an empty array.
      const response = await fetch(`/api/projects/files?projectId=${projectId}&projectType=${projectType}&uploaded_by=client`); // Placeholder
      if (!response.ok) {
        console.error("Failed to fetch general client files:", response.statusText);
        setGeneralClientFiles([]); // Set to empty on error
        return;
      }
      const data = await response.json();
      const mappedFiles: ProjectFile[] = data.map((file: any) => ({
        id: file.id || file.name,
        name: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'application/octet-stream',
        url: `${FILES_BUCKET}/${projectType}/${projectId}/${file.name}`, // Adjust URL construction as needed
        project_id: projectId,
        upload_date: file.created_at || new Date().toISOString(),
        uploaded_by: 'client', // Assuming this API call only returns client files
      }));
      setGeneralClientFiles(mappedFiles);
      console.log("Fetched general client files:", mappedFiles);
    } catch (error) {
      console.error("Error in fetchGeneralClientFiles:", error);
      setGeneralClientFiles([]); // Set to empty on error
    }
  };
  
  useEffect(() => {
    if (projectId) {
      fetchGeneralClientFiles();
    }
  }, [projectId]);

  // Effect to merge general client files and BIR files
  useEffect(() => {
    const birFilesMapped: ProjectFile[] = (signedBirFiles || []).map(birFile => ({
      id: birFile.id,
      name: birFile.original_name ?? 'Unknown Filename',
      size: birFile.size_bytes || 0,
      type: birFile.mime_type || 'application/octet-stream',
      url: birFile.publicUrl || `bir-file://${birFile.id}`, // Use publicUrl, fallback for ID
      project_id: projectId,
      upload_date: birFile.uploaded_at || new Date().toISOString(),
      uploaded_by: 'client', // BIR files are always client-uploaded
      origin: 'bir', // Add origin to differentiate later if needed for delete/download
    }));

    // Add origin to general client files
    const generalFilesWithOrigin = generalClientFiles.map(file => ({
      ...file,
      origin: 'general', // Add origin
    }));

    console.log('[FileMergeEffect ClientPage] General files to merge:', generalFilesWithOrigin);
    console.log('[FileMergeEffect ClientPage] BIR files to merge:', birFilesMapped);

    setAllClientProjectFiles([...generalFilesWithOrigin, ...birFilesMapped]);
  }, [generalClientFiles, signedBirFiles, projectId]);

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

  // HELPER FUNCTIONS FOR FILE DISPLAY (ported from designer page)
  const formatFileSize = (bytes: number | null | undefined): string => {
    if (bytes === null || bytes === undefined || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (file: ProjectFile): string => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension) return 'other';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (extension === 'pdf') return 'pdf';
    if (['doc', 'docx', 'rtf', 'txt', 'odt'].includes(extension)) return 'document';
    if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) return 'spreadsheet';
    if (['ppt', 'pptx', 'odp'].includes(extension)) return 'presentation';
    if (['zip', 'rar', 'tar', 'gz'].includes(extension)) return 'archive';
    return 'other';
  };
  
  const getFileIcon = (file: ProjectFile): React.ReactElement => {
    const type = getFileType(file);
    // Use larger icons for gallery placeholders if needed, this is for list view
    switch (type) {
      case 'image':
        return <ImageIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />;
      case 'pdf':
        return <FileTextIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />; // Example: Red for PDF
      case 'document':
        return <DocumentIcon className="h-5 w-5 text-sky-500 mr-2 flex-shrink-0" />; // heroicon
      case 'archive':
        return <PackageIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />; // lucide
      default:
        return <FileTextIcon className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" />;
    }
  };

  const isViewableImage = (file: ProjectFile): boolean => {
    const viewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return viewableExtensions.includes(extension);
  };

  const isImage = (file: ProjectFile): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic']; // Include HEIC if needed
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return imageExtensions.includes(extension);
  };
  
  const getFileTypeCounts = () => {
    // For the client page, we don't have sub-tabs for designer/client files in the same way.
    // We are displaying allClientProjectFiles which are, by definition, client-related.
    const counts = {
      all: allClientProjectFiles.length,
      image: allClientProjectFiles.filter(file => getFileType(file) === 'image').length,
      pdf: allClientProjectFiles.filter(file => getFileType(file) === 'pdf').length,
      document: allClientProjectFiles.filter(file => getFileType(file) === 'document').length,
      spreadsheet: allClientProjectFiles.filter(file => getFileType(file) === 'spreadsheet').length,
      presentation: allClientProjectFiles.filter(file => getFileType(file) === 'presentation').length,
      archive: allClientProjectFiles.filter(file => getFileType(file) === 'archive').length,
      other: allClientProjectFiles.filter(file => getFileType(file) === 'other').length
    };
    return counts;
  };

  // Filter and sort files (adapted from designer page)
  const filteredAndSortedFiles = () => {
    console.log('[ClientPage FilesDisplay] Full files array before filtering:', JSON.parse(JSON.stringify(allClientProjectFiles)));
    
    let filtered = [...allClientProjectFiles];
    
    // On the client page, all files in allClientProjectFiles are considered "client uploads"
    // So, no need to filter by uploaded_by like on the designer page's sub-tabs.

    // Apply filter by file type
    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter(file => getFileType(file) === fileTypeFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime();
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    console.log('[ClientPage FilesDisplay] Files after filtering and sorting:', JSON.parse(JSON.stringify(filtered)));
    return filtered;
  };

  // TODO: Adapt handleFileDownload and handleFileDelete
  // For handleFileDelete, it will need to check file.origin ('bir' or 'general')
  // and call the appropriate API endpoint.

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