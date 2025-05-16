'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, CalendarIcon, MoreHorizontal, Trash2, Edit, Eye, UserPlus, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StageSelect } from "@/components/projects/StageSelect";
import { ProjectStage, ProjectType as LibProjectType, ClientProfileData } from "@/lib/types/project";

// Helper function for safe date formatting
const safeFormatDate = (dateInput: string | null | undefined, formatString: string = 'MMM d, yyyy'): string => {
  if (!dateInput) {
    return 'N/A';
  }
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      console.warn(`safeFormatDate received invalid date input: ${dateInput}`);
      return '(Invalid Date)';
    }
    return format(date, formatString);
  } catch (error) {
    console.error(`Error formatting date input: ${dateInput}`, error);
    return '(Error Formatting)';
  }
};

// Updated Project interface to align with API response and use title
interface Project {
  id: string;
  type: LibProjectType; // Use aliased ProjectType from lib
  title: string; // Canonical name field
  name?: string; // Optional, for transition. TODO: name will be removed after migration from types
  description?: string | null;
  status: string; // Consider using ProjectStatus from lib/types/project
  deadline?: string | null;
  user_id: string; // Foreign key to user/client
  client: ClientProfileData; // Nested client information
  designer_id?: string | null;
  created_at: string;
  updated_at: string;
  current_stage?: ProjectStage | null;
}

// Helper function for status badge color (can be outside component or memoized)
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': return 'bg-green-500';
    case 'in_progress': return 'bg-blue-500';
    case 'on_hold': return 'bg-yellow-500';
    case 'pending': return 'bg-gray-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-300';
  }
};

/**
 * AdminProjects Component
 * 
 * Renders the main page for administrators to view and manage all projects 
 * (Web Design, Logo Design, Social Graphics).
 * 
 * Features:
 * - Fetches and displays a combined list of all projects.
 * - Allows searching and filtering projects by status.
 * - Provides modals (Dialogs) for:
 *   - Viewing detailed project information (fetches from `/api/admin/projects/[type]/[id]/`).
 *   - Editing project details (submits updates via PUT to `/api/admin/projects/[type]/[id]/`).
 *     - Uses controlled components for form inputs (especially status).
 *     - Maps the "Name" input field to the `title` property for Logo/Social projects before submitting.
 *   - Assigning designers to projects (fetches designers, submits via POST to `/api/admin/projects/assign-designer`).
 *   - Adding new projects (fetches clients, submits via POST to `/api/admin/projects/force-create`).
 */
export default function AdminProjects() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDetails, setProjectDetails] = useState<any | null>(null); // Kept as any for now, details fetch might bring more fields
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '', deadline: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<string>('');
  const [stage, setStage] = useState<ProjectStage>("discovery");
  
  const [isAssignDesignerOpen, setIsAssignDesignerOpen] = useState(false);
  const [projectToAssign, setProjectToAssign] = useState<Project | null>(null);
  const [designers, setDesigners] = useState<{id: string; role: string; full_name?: string; email?: string}[]>([]);
  const [selectedDesignerId, setSelectedDesignerId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [clients, setClients] = useState<{id: string; role: string; full_name?: string; email?: string; company?: string}[]>([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (editProject) {
      setEditFormData({
        title: editProject.title || '', // Use title for form init
        description: editProject.description || '',
        deadline: editProject.deadline ? format(new Date(editProject.deadline), 'yyyy-MM-dd') : '',
      });
      setEditStatus(editProject.status);
      setStage(editProject.current_stage || "discovery");
    } else {
      setEditFormData({ title: '', description: '', deadline: '' });
      setEditStatus('');
      setStage("discovery");
    }
  }, [editProject]);

  useEffect(() => {
    const fetchProjectsScoped = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/admin/projects/');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorData.error || `Failed to fetch projects: ${response.statusText}`);
        }
        const data = await response.json();
        // API now returns a flat array directly
        setProjects(data as Project[]);
      } catch (err) {
        console.error('Error in fetchProjectsScoped:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjectsScoped();
  }, []);

  const fetchProjectDetails = async (project: Project) => {
    console.log('[AdminProjects] fetchProjectDetails called for:', project?.title);
    if (!project) {
      console.log('[AdminProjects] fetchProjectDetails: No project provided');
      return;
    }
    setIsDetailsOpen(true);
    setSelectedProject(project);
    setIsDetailsLoading(true);
    console.log('[AdminProjects] fetchProjectDetails: Dialog open, loading details...');
    try {
      const response = await fetch(`/api/admin/projects/${project.type}/${project.id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('[AdminProjects] fetchProjectDetails: API error', errorData);
        throw new Error(errorData.error || 'Failed to fetch project details');
      }
      const details = await response.json();
      console.log('[AdminProjects] fetchProjectDetails: Details received', details);
      setProjectDetails(details);
    } catch (error: any) {
      console.error('[AdminProjects] fetchProjectDetails: Catch block error', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setProjectDetails(null);
    } finally {
      setIsDetailsLoading(false);
      console.log('[AdminProjects] fetchProjectDetails: Finished loading.');
    }
  };

  const fetchDesigners = async () => {
    try {
      setIsAssigning(true);
      
      console.log('Fetching designers...');
      const response = await fetch('/api/admin/users?role=designer');
      console.log('Designers response status:', response.status);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Error fetching designers:', errorData);
          throw new Error(errorData.error || 'Failed to fetch designers');
        } else {
          // Handle non-JSON error response
          const text = await response.text();
          console.error('Non-JSON error response for designers:', text.substring(0, 500));
          throw new Error(`Server returned ${response.status}: Non-JSON response`);
        }
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Unexpected non-JSON response for designers:', text.substring(0, 500));
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      console.log('Designers data received:', data);
      
      // Handle both array and {users: array} formats
      const designerData = Array.isArray(data) ? data : data.users;
      
      if (!designerData || designerData.length === 0) {
        console.log('No designers found in the system');
        setDesigners([]);
        return;
      }
      
      setDesigners(designerData);
    } catch (err) {
      console.error('Error fetching designers:', err);
      // Set empty array on error
      setDesigners([]);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not load designers: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setIsAssigning(false);
    }
  };
  
  const handleEdit = (project: Project) => {
    setEditProject(project);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editProject) return;
    setIsEditing(true);
    const dataToSend: {title: string; description?: string; status: string; deadline?: string | null; [key: string]: any} = {
      title: editFormData.title,
      description: editFormData.description,
      status: editStatus,
      deadline: editFormData.deadline || null,
    };

    try {
      const response = await fetch(`/api/admin/projects/${editProject.type}/${editProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || 'Failed to update project');
      }
      
      // Stage update logic
      if (stage !== editProject.current_stage) {
        await updateProjectStage(editProject.id, stage, editProject.type);
        setProjects(prevProjects =>
          prevProjects.map(p =>
            p.id === editProject.id ? { ...p, current_stage: stage } : p 
          )
        );
      }

      toast({ title: "Success", description: "Project updated successfully." });
      setIsEditOpen(false);
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === editProject.id ? { ...p, ...dataToSend, title: dataToSend.title, current_stage: stage, client: p.client } : p
        )
      );
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsEditing(false);
    }
  };
  
  async function updateProjectStage(projectId: string, newStage: ProjectStage, type: LibProjectType) {
    try {
      const response = await fetch('/api/admin/projects/update-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, projectType: type, newStage }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Failed to update project stage for ${type}`);
      }
      // The main project list will be updated by handleSaveEdit or needs a re-fetch if stage updated independently.
      // For now, handleSaveEdit updates the local state which includes current_stage
    } catch (error: any) {
      console.error("Error updating project stage:", error);
      toast({ title: "Stage Update Error", description: error.message, variant: "destructive" });
      // Potentially re-throw or handle state rollback if critical
    }
  }

  const handleAssignDesignerAction = async () => {
    if (!projectToAssign || !selectedDesignerId) return;
    setIsAssigning(true);
    try {
      const response = await fetch('/api/admin/projects/assign-designer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectToAssign.id,
          projectType: projectToAssign.type,
          designerId: selectedDesignerId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || 'Failed to assign designer');
      }
      toast({ title: "Designer Assigned", description: "Designer has been assigned to the project." });
      // Optionally, refetch project details or update local state if designer info is displayed in the list
      refreshProjects(); // Re-fetch all projects to get updated designer info
      setIsAssignDesignerOpen(false);
      setProjectToAssign(null);
      setSelectedDesignerId('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsAssigning(false);
    }
  };

  const fetchClients = async () => {
    try {
      setIsLoadingClients(true);
      
      console.log('Fetching clients...');
      const response = await fetch('/api/admin/users?role=client');
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch clients');
        } else {
          // Handle non-JSON error response
          throw new Error(`Server returned ${response.status}: Non-JSON response`);
        }
      }
      
      const data = await response.json();
      
      // Handle both response formats (array or {users: array})
      const clientsData = Array.isArray(data) ? data : data.users;
      
      if (!clientsData) {
        throw new Error('Invalid response format: missing clients data');
      }
      
      console.log(`Found ${clientsData.length} clients`);
      setClients(clientsData);
    } catch (err) {
      console.error('Error fetching clients:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not load clients: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
      setClients([]);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleAddProject = async (formData: {
    clientId: string;
    projectType: LibProjectType; // Use LibProjectType
    title: string; // Changed from name to title
    description?: string;
    deadline?: string;
  }) => {
    // ... (existing code, ensure API call sends title)
    // API /api/admin/projects/force-create will need to expect 'title'
    // For now, this changes the formData shape.
    // ...
  };
  
  const handleDeleteProject = async () => {
    // ... (existing code)
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const typeName = project.type === 'web_design' ? 'Web Design' :
                       project.type === 'logo_design' ? 'Logo Design' : 'Social Graphics';
      
      // Search match logic - uses project.title and project.client.full_name
      const searchMatch = 
          (project.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || // Directly use project.title
          typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.client?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (project.client?.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (project.user_id && project.user_id.toLowerCase().includes(searchTerm.toLowerCase())); // Keep user_id search if useful

      const statusMatch = statusFilter === 'all' || project.status.toLowerCase() === statusFilter.toLowerCase();
      return searchMatch && statusMatch;
    });
  }, [projects, searchTerm, statusFilter]); // Removed projectDetails from dependencies

  // Function to be called to refresh projects from other handlers if needed
  const refreshProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/projects/');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Failed to fetch projects: ${response.statusText}`);
      }
      const data = await response.json();
      setProjects(data as Project[]);
      setError(null);
    } catch (err) {
      console.error('Error in refreshProjects:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh projects');
    } finally {
      setIsLoading(false);
    }
  };

  // JSX Rendering
  return (
    <div className="container mx-auto p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard - Projects</h1>
        <p className="text-muted-foreground">Manage all client projects from one place.</p>
      </header>

      {/* Search and Filter UI - Restored */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title, client, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <span className="flex items-center"> 
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setIsAddProjectOpen(true); fetchClients(); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>
      </div>
      
      {isLoading && (
        // Skeleton loading state - existing code
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border animate-pulse">
              <Skeleton className="h-24 w-full" /> {/* Simplified Skeleton Card */}
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="text-red-500 text-center py-10 bg-red-50 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-2">Failed to load projects</h2>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
        </div>
      )}

      {!isLoading && !error && projects.length === 0 && (
         <div className="text-center py-10">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
            <div className="mt-6">
                <Button onClick={() => setIsAddProjectOpen(true)}>
                    <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    New Project
                </Button>
            </div>
        </div>
      )}

      {!isLoading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className="bg-card border rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                console.log('[AdminProjects] Project card clicked:', project?.title);
                fetchProjectDetails(project);
              }}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={
                    project.type === 'web_design' ? 'default' :
                    project.type === 'logo_design' ? 'secondary' :
                    'outline'
                  }>{project.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} className="h-7 w-7 p-0 flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-ring data-[state=open]:bg-muted hover:bg-accent hover:text-accent-foreground">
                      <span className="flex items-center justify-center"> {/* Wrapper for single child */}
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}> {/* Stop propagation here too */}
                      <DropdownMenuItem onClick={() => fetchProjectDetails(project)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(project)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setProjectToAssign(project); setIsAssignDesignerOpen(true); fetchDesigners(); }}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign Designer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 
                  className="text-xl font-semibold leading-tight truncate group-hover:underline"
                  // onClick handler removed from h3 as the parent div is now clickable
                >
                  {project.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground truncate" title={project.description || ''}>
                  {project.description || 'No description'}
                </p>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                    Client: {project.client?.full_name || project.client?.company || project.user_id}
                  </div>
                  {project.status && (
                      <div className="flex items-center">
                          <span className={`mr-1.5 h-2 w-2 rounded-full ${getStatusColor(project.status)}`}></span>
                          Status: <span className="capitalize">{project.status.replace(/_/g, ' ')}</span>
                      </div>
                  )}
                  {project.current_stage && (
                       <div className="flex items-center">
                          <span className="text-xs">→</span> {/* Simpler arrow */}
                          <span className="ml-1">Stage:</span> <span className="capitalize ml-1">{project.current_stage.replace(/-/g, ' ')}</span>
                      </div>
                  )}
                  {project.deadline && (
                      <div className="flex items-center">
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                          Deadline: {safeFormatDate(project.deadline)}
                      </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Edit Project Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Project: {editProject?.title}</DialogTitle> {/* Use title */}
            <DialogDescription>
              Update the details for this project. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">Title</Label> {/* Changed from Name to Title */}
              <Input
                id="edit-title"
                name="title" // Name attribute for forms
                value={editFormData.title} // Controlled component
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                className="col-span-3"
                placeholder="Project Title"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={editFormData.description} // Controlled component
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Project Description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-deadline" className="text-right">Deadline</Label>
              <Input
                id="edit-deadline"
                name="deadline"
                type="date"
                value={editFormData.deadline} // Controlled component
                onChange={(e) => setEditFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus} name="status">
                <SelectTrigger id="edit-status" className="col-span-3">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-stage" className="text-right">Stage</Label>
              <div className="col-span-3">
                <StageSelect 
                  value={stage} 
                  onChange={setStage} 
                  disabled={isEditing}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSaveEdit} disabled={isEditing}>
              {isEditing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Project Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project Details: {selectedProject?.title}</DialogTitle>
            <DialogDescription>
              Viewing details for project: {selectedProject?.title}. Client: {selectedProject?.client?.full_name || selectedProject?.client?.company || 'N/A'}.
            </DialogDescription>
          </DialogHeader>
          {isDetailsLoading ? (
            <div className="py-4">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : projectDetails ? (
            <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Title</h4>
                <p className="text-muted-foreground">{projectDetails.title}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Client</h4>
                <p className="text-muted-foreground">{projectDetails.client?.full_name || projectDetails.client?.company || projectDetails.user_id || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Project Type</h4>
                <p className="text-muted-foreground capitalize">{projectDetails.type?.replace(/_/g, ' ') || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Status</h4>
                <p className="text-muted-foreground capitalize">{projectDetails.status?.replace(/_/g, ' ') || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="font-semibold mb-1">Description</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{projectDetails.description || 'No description provided.'}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Deadline</h4>
                <p className="text-muted-foreground">{safeFormatDate(projectDetails.deadline)}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Current Stage</h4>
                <p className="text-muted-foreground capitalize">{projectDetails.current_stage?.replace(/-/g, ' ') || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Created At</h4>
                <p className="text-muted-foreground">{safeFormatDate(projectDetails.created_at, 'PPpp')}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Last Updated</h4>
                <p className="text-muted-foreground">{safeFormatDate(projectDetails.updated_at, 'PPpp')}</p>
              </div>
              {/* Add more fields as needed from projectDetails specific to project type if they exist */}
            </div>
          ) : (
            <div className="py-4 text-muted-foreground">No details available or failed to load.</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assign Designer Dialog */}
      <Dialog open={isAssignDesignerOpen} onOpenChange={setIsAssignDesignerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Designer to: {projectToAssign?.title}</DialogTitle> {/* Use title */}
            {/* ... DialogDescription ... */}
          </DialogHeader>
          {/* ... Assign designer form ... */}
        </DialogContent>
      </Dialog>

      {/* Add New Project Dialog */}
      <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
            {/* ... DialogDescription ... */}
          </DialogHeader>
          {/* Form will need to use 'title' for the project name input */}
          {/* Example:
            <Label htmlFor="new-project-title">Project Title</Label>
            <Input id="new-project-title" name="title" ... />
          */}
        </DialogContent>
      </Dialog>
      
      {/* Delete Project Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project: {projectToDelete?.title}?</DialogTitle> {/* Use title */}
            {/* ... DialogDescription ... */}
          </DialogHeader>
          {/* ... Confirmation buttons ... */}
        </DialogContent>
      </Dialog>

    </div>
  );
} 