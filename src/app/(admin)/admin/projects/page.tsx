'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, CalendarIcon, MoreHorizontal, Trash2, Edit, Eye, UserPlus, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

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
import AdminProjectDetailsModal from './components/AdminProjectDetailsModal';
import { AdminProject } from "./types"; // Import AdminProject

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
  type: LibProjectType;
  title: string;
  name?: string;
  description?: string | null;
  status: string;
  deadline?: string | null;
  due_date?: string | null;
  user_id: string;
  client_id?: string;
  client: ClientProfileData;
  client_name?: string | null;
  client_email?: string | null;
  client_company?: string | null;
  designer_id?: string | null;
  designer_name?: string | null;
  designer_email?: string | null;
  created_at: string;
  updated_at: string;
  current_stage?: ProjectStage | null;
  birId?: string | null;
  birStatus?: string | null;
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

  const [selectedProjectForModal, setSelectedProjectForModal] = useState<Project | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
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
  
  // State for the Add New Project form
  const initialNewProjectData = {
    clientId: '',
    projectType: 'web_design' as LibProjectType, // Default to web_design or make it empty
    title: '',
    description: '',
    deadline: '',
  };
  const [newProjectData, setNewProjectData] = useState(initialNewProjectData);
  
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

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/projects/');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Failed to fetch projects: ${response.statusText}`);
      }
      const data = await response.json();
      const mappedData: Project[] = data.map((p: any) => ({
        ...p, // Spread raw API data first
        id: p.id,
        type: p.type as LibProjectType,
        title: p.title,
        description: p.description,
        status: p.status,
        deadline: p.deadline, // Keep original deadline from API if needed by page.tsx
        due_date: p.deadline || null, // Map for AdminProject
        user_id: p.user_id, // Keep original user_id
        client_id: p.user_id, // Map for AdminProject
        client: p.client, // Keep original client object
        client_name: p.client?.full_name || null, // Map for AdminProject
        client_email: p.client?.email || null,   // Map for AdminProject
        client_company: p.client?.company || null,// Map for AdminProject
        designer_id: p.designer_id || null,
        // designer_name and designer_email are not reliably in list API data
        // AdminProject makes them optional, so this is fine.
        designer_name: p.designer_name || null, // if API happens to provide it
        designer_email: p.designer_email || null, // if API happens to provide it
        created_at: p.created_at,
        updated_at: p.updated_at,
        current_stage: p.current_stage,
        birId: p.bir_id || null,
        birStatus: p.bir_status || null,
      }));
      setProjects(mappedData);
    } catch (err) {
      console.error('Error in fetchProjects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openDetailsModal = (project: Project) => {
    setSelectedProjectForModal(project);
    setIsDetailsModalOpen(true);
  };

  const fetchProjectDetails = async (project: Project) => {
    console.log('[AdminProjects] fetchProjectDetails called for:', project?.title);
    if (!project) {
      console.log('[AdminProjects] fetchProjectDetails: No project provided');
      return;
    }
    // This function originally fetched more details, now we just open the modal with existing list data
    setSelectedProjectForModal(project);
    setIsDetailsModalOpen(true);
    // console.log('[AdminProjects] fetchProjectDetails: Dialog open, details might be in selectedProjectForModal');
    // Original detailed fetch logic removed as AdminProjectDetailsModal uses project prop directly
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

  const handleNewProjectInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProjectData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewProjectSelectChange = (name: string, value: string) => {
    setNewProjectData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProjectSubmit = async () => {
    // Basic front-end validation
    if (!newProjectData.clientId || !newProjectData.projectType || !newProjectData.title) {
      toast({
        title: "Missing Information",
        description: "Please select a client, project type, and enter a title.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAddingProject(true);

      const payload = {
        userId: newProjectData.clientId, // Map clientId to userId
        projectType: newProjectData.projectType,
        projectData: {
          title: newProjectData.title,
          description: newProjectData.description,
          deadline: newProjectData.deadline || null, // Ensure null if empty
          // status and current_stage will be set by the backend by default
        },
        confirmationCode: "FORCE_CREATE_CONFIRMED", // Add required confirmation code
        skipValidation: false, // Explicitly set, can be true if needed for specific cases
      };

      const response = await fetch("/api/admin/projects/force-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // Send the new payload structure
      });

      if (!response.ok) {
        // You could read response.json() for details if your API returns them
        const errorData = await response.json().catch(() => ({ message: `Server responded ${response.status}` }));
        throw new Error(errorData.message || `Server responded ${response.status}`);
      }

      // Optional: get the newly-created project to prepend to your list
      const createdProjectResponse = (await response.json()) as { project: Project }; // Backend wraps project in a 'project' key
      setProjects((oldProjects) => [createdProjectResponse.project, ...oldProjects]);

      toast({ title: "Success", description: "Project added!" });

      // Reset + close
      setNewProjectData(initialNewProjectData);
      setIsAddProjectOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "Error", 
        description: err.message || "Could not add project. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsAddingProject(false);
    }
  };
  
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/projects/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectToDelete.id,
          projectType: projectToDelete.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete project' }));
        throw new Error(errorData.message || `Server responded ${response.status}`);
      }

      toast({ title: "Success", description: `Project "${projectToDelete.title}" deleted successfully.` });
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectToDelete.id));
      setIsDeleteConfirmOpen(false);
      setProjectToDelete(null);
    } catch (err: any) {
      console.error("Error deleting project:", err);
      toast({ 
        title: "Error Deleting Project", 
        description: err.message || "Could not delete project. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const typeName = project.type === 'web_design' ? 'Web Design' :
                       project.type === 'logo_design' ? 'Logo Design' : 'Social Graphics';
      
      // Search match logic - uses project.title and project.client.full_name
      const searchMatch = 
          (project.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || // Directly use project.title
          typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.client_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (project.client_company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Dashboard - Projects</h1>
        <p className="text-muted-foreground">Manage all client projects from one place.</p>
      </header>

      {/* Search and Filter UI - Restored */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search by title, client, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-50 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-50 data-[placeholder]:text-gray-500 dark:data-[placeholder]:text-gray-400">
              <span className="flex items-center"> 
                <Filter className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <SelectValue placeholder="Filter by status" />
              </span>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-50">
              <SelectItem value="all" className="hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">All Statuses</SelectItem>
              <SelectItem value="pending" className="hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">Pending</SelectItem>
              <SelectItem value="in_progress" className="hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">In Progress</SelectItem>
              <SelectItem value="on_hold" className="hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">On Hold</SelectItem>
              <SelectItem value="completed" className="hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">Completed</SelectItem>
              <SelectItem value="cancelled" className="hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setIsAddProjectOpen(true); fetchClients(); }} className="bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>
      </div>
      
      {isLoading && (
        // Skeleton loading state
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 animate-pulse">
              <Skeleton className="h-24 w-full bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="text-red-700 dark:text-red-400 text-center py-10 bg-red-50 dark:bg-red-900/30 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-2">Failed to load projects</h2>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4 bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600">Try Again</Button>
        </div>
      )}

      {!isLoading && !error && projects.length === 0 && (
         <div className="text-center py-10">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new project.</p>
            <div className="mt-6">
                <Button onClick={() => setIsAddProjectOpen(true)} className="bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600">
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
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
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
                  } className={
                    project.type === 'web_design' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700' :
                    project.type === 'logo_design' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }>{project.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} className="h-7 w-7 p-0 flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-ring data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                      <span className="flex items-center justify-center"> {/* Wrapper for single child */}
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50">
                      <DropdownMenuItem onSelect={() => openDetailsModal(project)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Quick Details
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">
                        <Link href={`/admin/projects/view/${project.id}?type=${project.type}`}>
                          <Briefcase className="mr-2 h-4 w-4" /> {/* Using Briefcase as an example icon */}
                          View Full Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(project)} className="hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setProjectToAssign(project);
                        setSelectedDesignerId(project.designer_id || ''); // Pre-select assigned designer
                        setIsAssignDesignerOpen(true);
                        fetchDesigners();
                      }} className="hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign Designer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setProjectToDelete(project); setIsDeleteConfirmOpen(true); }} className="text-red-600 hover:!text-red-700 hover:!bg-red-50 dark:text-red-500 dark:hover:!text-red-400 dark:hover:!bg-red-900/50 focus:!text-red-700 dark:focus:!text-red-400 focus:!bg-red-50 dark:focus:!bg-red-900/50">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 
                  className="text-xl font-semibold leading-tight truncate text-gray-900 dark:text-white group-hover:underline"
                  // onClick handler removed from h3 as the parent div is now clickable
                >
                  {project.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 truncate" title={project.description || ''}>
                  {project.description || 'No description'}
                </p>
                <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                    Client: {project.client_name || project.user_id}
                  </div>
                  {project.status && (
                      <div className="flex items-center">
                          <span className={`mr-1.5 h-2 w-2 rounded-full ${getStatusColor(project.status)}`}></span>
                          Status: <span className="capitalize text-gray-700 dark:text-gray-300">{project.status.replace(/_/g, ' ')}</span>
                      </div>
                  )}
                  {project.current_stage && (
                       <div className="flex items-center">
                          <span className="text-xs text-gray-400 dark:text-gray-500">→</span> {/* Simpler arrow */}
                          <span className="ml-1">Stage:</span> <span className="capitalize ml-1 text-gray-700 dark:text-gray-300">{project.current_stage.replace(/-/g, ' ')}</span>
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
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Edit Project: {editProject?.title}</DialogTitle> {/* Use title */}
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Update the details for this project. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right text-gray-700 dark:text-gray-300">Title</Label> {/* Changed from Name to Title */}
              <Input
                id="edit-title"
                name="title" // Name attribute for forms
                value={editFormData.title} // Controlled component
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                className="col-span-3 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Project Title"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right text-gray-700 dark:text-gray-300">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={editFormData.description} // Controlled component
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Project Description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-deadline" className="text-right text-gray-700 dark:text-gray-300">Deadline</Label>
              <Input
                id="edit-deadline"
                name="deadline"
                type="date"
                value={editFormData.deadline} // Controlled component
                onChange={(e) => setEditFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="col-span-3 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right text-gray-700 dark:text-gray-300">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus} name="status">
                <SelectTrigger id="edit-status" className="col-span-3 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-50 data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-gray-500">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-50">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-stage" className="text-right text-gray-700 dark:text-gray-300">Stage</Label>
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
      {isDetailsModalOpen && selectedProjectForModal && (
        <AdminProjectDetailsModal
          open={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          project={selectedProjectForModal as AdminProject} 
          onBirApproved={fetchProjects} 
        />
      )}
      
      {/* Assign Designer Dialog */}
      <Dialog open={isAssignDesignerOpen} onOpenChange={(isOpen) => {
        if (!isAssigning) {
            setIsAssignDesignerOpen(isOpen);
            if (!isOpen) {
                setProjectToAssign(null);
                setSelectedDesignerId(''); // Clear selection on close
            }
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Designer to: {projectToAssign?.title}</DialogTitle>
            <DialogDescription>
              Select a designer from the list below to assign them to this project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select 
                value={selectedDesignerId} 
                onValueChange={setSelectedDesignerId} 
                disabled={isAssigning || designers.length === 0}
            >
              <SelectTrigger id="designer-select">
                <SelectValue placeholder={designers.length === 0 && !isAssigning ? "No designers available" : "Select a designer..."} />
              </SelectTrigger>
              <SelectContent>
                {designers.length > 0 ? (
                  designers.map(designer => (
                    <SelectItem key={designer.id} value={designer.id}>
                      {designer.full_name || designer.email || designer.id}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-designers" disabled>
                    {isAssigning ? "Loading designers..." : "No designers found"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button 
                variant="outline" 
                onClick={() => {
                    setIsAssignDesignerOpen(false);
                    setProjectToAssign(null);
                    setSelectedDesignerId('');
                }}
                disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button 
                onClick={handleAssignDesignerAction} 
                disabled={isAssigning || !selectedDesignerId}
            >
              {isAssigning ? 'Assigning...' : 'Assign Designer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Project Dialog */}
      <Dialog open={isAddProjectOpen} onOpenChange={(isOpen) => {
        setIsAddProjectOpen(isOpen);
        if (!isOpen) {
          setNewProjectData(initialNewProjectData); // Reset form on close
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Client Selector */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-project-client" className="text-right">Client</Label>
              <Select
                value={newProjectData.clientId}
                onValueChange={(value) => handleNewProjectSelectChange('clientId', value)}
                name="clientId"
              >
                <SelectTrigger id="new-project-client" className="col-span-3" disabled={isLoadingClients}>
                  <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a client"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.length > 0 ? (
                    clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.full_name || client.company || client.email || client.id}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-clients" disabled>No clients available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Project Type Selector */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-project-type" className="text-right">Project Type</Label>
              <Select
                value={newProjectData.projectType}
                onValueChange={(value) => handleNewProjectSelectChange('projectType', value as LibProjectType)}
                name="projectType"
              >
                <SelectTrigger id="new-project-type" className="col-span-3">
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web_design">Web Design</SelectItem>
                  <SelectItem value="logo_design">Logo Design</SelectItem>
                  <SelectItem value="social_graphics">Social Graphics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project Title */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-project-title" className="text-right">Title</Label>
              <Input
                id="new-project-title"
                name="title"
                value={newProjectData.title}
                onChange={handleNewProjectInputChange}
                className="col-span-3"
                placeholder="Enter project title"
                required
              />
            </div>

            {/* Description */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-project-description" className="text-right">Description</Label>
              <Textarea
                id="new-project-description"
                name="description"
                value={newProjectData.description}
                onChange={handleNewProjectInputChange}
                className="col-span-3"
                placeholder="Enter project description (optional)"
              />
            </div>

            {/* Deadline */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-project-deadline" className="text-right">Deadline</Label>
              <Input
                id="new-project-deadline"
                name="deadline"
                type="date"
                value={newProjectData.deadline}
                onChange={handleNewProjectInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setIsAddProjectOpen(false);
              setNewProjectData(initialNewProjectData); // Reset form on cancel
            }}>Cancel</Button>
            <Button type="button" onClick={handleAddProjectSubmit} disabled={isAddingProject || isLoadingClients}>
              {isAddingProject ? 'Adding...' : 'Add Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Project Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={(isOpen) => {
        if (!isDeleting) { // Prevent closing while delete is in progress
            setIsDeleteConfirmOpen(isOpen);
            if (!isOpen) {
                setProjectToDelete(null); // Clear project to delete if dialog is closed
            }
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project: {projectToDelete?.title}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the project "{projectToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setProjectToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject} 
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
} 