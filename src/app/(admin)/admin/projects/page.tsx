'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Helper function for safe date formatting
const safeFormatDate = (dateInput: string | null | undefined, formatString: string = 'MMM d, yyyy'): string => {
  if (!dateInput) {
    return 'N/A'; // Handle null, undefined, or empty string
  }
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      // Handle cases where new Date() results in "Invalid Date"
      console.warn(`safeFormatDate received invalid date input: ${dateInput}`);
      return '(Invalid Date)';
    }
    return format(date, formatString);
  } catch (error) {
    console.error(`Error formatting date input: ${dateInput}`, error);
    return '(Error Formatting)';
  }
};

interface Project {
  id: string;
  type: string;
  name: string;
  description?: string;
  status: string;
  deadline?: string;
  client_id: string;
  designer_id?: string;
  created_at: string;
  updated_at: string;
}

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

  // Project details state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDetails, setProjectDetails] = useState<{
    status: string;
    description?: string;
    deadline?: string;
    owner?: {
      full_name?: string;
      email?: string;
      company?: string;
    };
    designer?: {
      full_name?: string;
      email?: string;
    };
    designer_assignment?: {
      designer_name?: string;
      designer_email?: string;
      designer_id?: string;
      assigned_at?: string;
    };
    [key: string]: unknown;
  } | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Edit project state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<string>('');
  
  // Assign designer state
  const [isAssignDesignerOpen, setIsAssignDesignerOpen] = useState(false);
  const [projectToAssign, setProjectToAssign] = useState<Project | null>(null);
  const [designers, setDesigners] = useState<{id: string; role: string; full_name?: string; email?: string}[]>([]);
  const [selectedDesignerId, setSelectedDesignerId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Add project state
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [clients, setClients] = useState<{id: string; role: string; full_name?: string; email?: string; company?: string}[]>([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Effect to initialize editStatus when the edit dialog is opened
  useEffect(() => {
    // Only run if we have a project selected for editing
    if (editProject) {
      console.log('Setting editStatus based on editProject:', editProject.status);
      setEditStatus(editProject.status);
    } else {
      // Optionally clear status when dialog closes or no project is selected
      setEditStatus(''); 
    }
  }, [editProject]); // Re-run when the project to edit changes

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching projects...');
        // Try with the correct API endpoint (with trailing slash)
        const response = await fetch('/api/admin/projects/');
        console.log('Projects response status:', response.status);
        
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            throw new Error(errorData.error || 'Failed to fetch projects');
          } else {
            // Handle non-JSON error response
            const text = await response.text();
            console.error('Non-JSON error response:', text.substring(0, 500));
            throw new Error(`Server returned ${response.status}: Non-JSON response`);
          }
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Unexpected non-JSON response:', text.substring(0, 500));
          throw new Error('Server returned non-JSON response');
        }
        
        const data = await response.json();
        console.log('Projects data received:', data);
        
        // Handle both response formats (array or {projects: array})
        const projectsData = Array.isArray(data) ? data : data.projects;
        
        if (!projectsData) {
          console.error('No projects data in response:', data);
          throw new Error('Invalid response format: missing projects data');
        }
        
        console.log(`Setting ${projectsData.length} projects`);
        setProjects(projectsData);
      } catch (err) {
        console.error('Error in fetchProjects:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
        // Set to empty array on error, no mock data
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch project details
  const fetchProjectDetails = async (project: Project) => {
    try {
      setIsDetailsLoading(true);
      setError(null);
      
      console.log(`Fetching details for project ${project.id} of type ${project.type}`);
      const response = await fetch(`/api/admin/projects/${project.type}/${project.id}/`);
      console.log('Project details response status:', response.status);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(errorData.error || 'Failed to fetch project details');
        } else {
          // Handle non-JSON error response
          const text = await response.text();
          console.error('Non-JSON error response:', text.substring(0, 500));
          throw new Error(`Server returned ${response.status}: Non-JSON response`);
        }
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Unexpected non-JSON response:', text.substring(0, 500));
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      console.log('Project details received:', data);
      
      // Extract project data from response, handle both formats
      const projectData = data.project || data || {};
      
      // Generate basic project details if API fails to provide them
      setProjectDetails({
        status: project.status,
        description: project.description || '',
        name: project.name,
        deadline: project.deadline,
        created_at: project.created_at,
        updated_at: project.updated_at,
        ...projectData
      });
      setSelectedProject(project);
      setIsDetailsOpen(true);
    } catch (err) {
      console.error('Error fetching project details:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to fetch project details',
      });
    } finally {
      setIsDetailsLoading(false);
    }
  };

  // Fetch designers for assignment
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

  // Handle project edit - Updated signature and logic
  const handleSaveEdit = async (formData: {
    name?: string; // Make name optional
    title?: string; // Add optional title
    description?: string;
    status: string;
    deadline?: string | null;
  }) => {
    if (!editProject) return;
    
    try {
      setIsEditing(true);
      
      // Prepare data for API, using title or name based on type
      const dataToSend: { [key: string]: any } = { 
        description: formData.description,
        status: formData.status,
        deadline: formData.deadline
      };

      if (editProject.type === 'logo_design' || editProject.type === 'social_graphics') {
        dataToSend.title = formData.title || formData.name; // Use title if present, fallback to name from form
      } else {
        dataToSend.name = formData.name; // Use name for web_design
      }

      // Remove undefined/null deadline if necessary (already handled before calling)
      if (dataToSend.deadline === undefined || dataToSend.deadline === null) {
        delete dataToSend.deadline;
      }
      // Ensure status is present
      if (!dataToSend.status) {
        throw new Error("Status cannot be empty.");
      }
      
      console.log(`Updating project ${editProject.id} (${editProject.type}) with data:`, dataToSend);
      
      const response = await fetch(`/api/admin/projects/${editProject.type}/${editProject.id}/`, { 
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }
      
      const { project } = await response.json(); // API returns the updated project
      
      // Update the project in the local state
      setProjects(prevProjects => 
        prevProjects.map(p => 
          (p.id === editProject.id) ? { ...p, ...project } : p // Match only by ID now is fine
        )
      );
      
      toast({
        title: "Project updated",
        description: "The project has been successfully updated.",
      });
      
      setIsEditOpen(false);
      setEditProject(null);
    } catch (err) {
      console.error('Error updating project:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update project',
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Handle designer assignment
  const handleAssignDesigner = async () => {
    if (!projectToAssign || !selectedDesignerId) return;
    
    try {
      setIsAssigning(true);
      
      const response = await fetch('/api/admin/projects/assign-designer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectToAssign.id,
          projectType: projectToAssign.type,
          designerId: selectedDesignerId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign designer');
      }
      
      await response.json(); // Read the response but we don't need it
      
      // Find the assigned designer's name from our list
      const assignedDesigner = designers.find(d => d.id === selectedDesignerId);
      const designerName = assignedDesigner?.full_name || assignedDesigner?.email || 'Unknown designer';
      
      toast({
        title: "Designer assigned",
        description: `${designerName} has been assigned to the project.`,
      });
      
      // Refresh the project details if this is the selected project
      if (selectedProject && 
          selectedProject.id === projectToAssign.id && 
          selectedProject.type === projectToAssign.type) {
        fetchProjectDetails(selectedProject);
      }
      
      setIsAssignDesignerOpen(false);
      setProjectToAssign(null);
      setSelectedDesignerId('');
    } catch (err) {
      console.error('Error assigning designer:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to assign designer',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Fetch clients for project creation
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

  // Handle adding a new project
  const handleAddProject = async (formData: {
    clientId: string;
    projectType: 'web_design' | 'logo_design' | 'social_graphics';
    name: string;
    description?: string;
    deadline?: string;
  }) => {
    try {
      setIsAddingProject(true);
      
      const projectData = {
        title: formData.name,
        description: formData.description || '',
        ...(formData.deadline ? { deadline: formData.deadline } : {})
      };
      
      console.log('Creating project with data:', {
        projectType: formData.projectType,
        userId: formData.clientId,
        projectData
      });
      
      const response = await fetch('/api/admin/projects/force-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectType: formData.projectType,
          userId: formData.clientId,
          projectData,
          confirmationCode: 'FORCE_CREATE_CONFIRMED'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }
      
      const { project } = await response.json();
      
      // Add the new project to the state
      setProjects(prevProjects => [
        ...prevProjects,
        {
          id: project.id,
          type: formData.projectType,
          name: formData.name,
          description: formData.description,
          status: 'pending',
          deadline: formData.deadline,
          client_id: formData.clientId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      
      toast({
        title: "Project created",
        description: "The project has been successfully created.",
      });
      
      setIsAddProjectOpen(false);
    } catch (err) {
      console.error('Error creating project:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create project',
      });
    } finally {
      setIsAddingProject(false);
    }
  };

  // Filter and search functions
  const filteredProjects = projects?.filter(project => {
    // Safely check name and description before calling includes/toLowerCase
    const nameMatch = project.name ? project.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const descriptionMatch = project.description ? project.description.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesSearch = nameMatch || descriptionMatch;
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="flex-1 space-y-6 p-8 pt-0">
      {/* Search, Filter Controls and Add Button */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-8 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => {
            setIsAddProjectOpen(true);
            fetchClients();
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border">
              <Skeleton className="h-6 w-1/4 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          <p>{error}</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No projects found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div
              key={`${project.id}-${project.type}`}
              className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer"
              onClick={() => fetchProjectDetails(project)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.description}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    project.status === 'completed'
                      ? 'default'
                      : project.status === 'in_progress'
                      ? 'secondary'
                      : project.status === 'cancelled'
                      ? 'destructive'
                      : 'outline'
                  }
                >
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                <p>Created: {safeFormatDate(project.created_at)}</p>
                {/* Only render deadline paragraph if deadline exists */}
                {project.deadline && (
                  <p>Deadline: {safeFormatDate(project.deadline)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Details Dialog */}
      {selectedProject && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-[600px] bg-popover">
            <DialogHeader>
              <DialogTitle>Project Details</DialogTitle>
              <DialogDescription>
                View and manage project information
              </DialogDescription>
            </DialogHeader>
            {isDetailsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-1/3" />
              </div>
            ) : projectDetails ? (
              <div className="space-y-4">
                {/* Project details content */}
                <div className="grid gap-4">
                  <div>
                    <Label>Status</Label>
                    <p className="text-sm font-medium">{projectDetails.status}</p>
                  </div>
                  {projectDetails.description && (
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm">{projectDetails.description}</p>
                    </div>
                  )}
                  {projectDetails.owner && (
                    <div>
                      <Label>Client</Label>
                      <p className="text-sm">{projectDetails.owner.full_name || projectDetails.owner.email || 'Unknown'}</p>
                      {projectDetails.owner.company && (
                        <p className="text-xs text-muted-foreground">{projectDetails.owner.company}</p>
                      )}
                    </div>
                  )}
                  {projectDetails.deadline && (
                    <div>
                      <Label>Deadline</Label>
                      <p className="text-sm">
                        {safeFormatDate(projectDetails.deadline, 'MMMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {/* Show assigned designer if available */}
                  {projectDetails.designer && (
                    <div>
                      <Label>Assigned Designer</Label>
                      <p className="text-sm">{projectDetails.designer.full_name || projectDetails.designer.email || 'Unknown'}</p>
                    </div>
                  )}
                  {/* If we have a designer assignment from the junction table */}
                  {projectDetails.designer_assignment && (
                    <div>
                      <Label>Assigned Designer</Label>
                      <p className="text-sm">
                        {projectDetails.designer_assignment.designer_name || 
                         projectDetails.designer_assignment.designer_email || 
                         projectDetails.designer_assignment.designer_id || 'Unknown'}
                      </p>
                      {projectDetails.designer_assignment.assigned_at && (
                        <p className="text-xs text-muted-foreground">
                          Assigned: {safeFormatDate(projectDetails.designer_assignment.assigned_at, 'MMMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditProject(selectedProject);
                      setIsDetailsOpen(false);
                      setIsEditOpen(true);
                    }}
                  >
                    Edit Project
                  </Button>
                  <Button
                    onClick={() => {
                      setProjectToAssign(selectedProject);
                      setIsDetailsOpen(false);
                      setIsAssignDesignerOpen(true);
                      setIsAssigning(true);
                      fetchDesigners();
                    }}
                  >
                    Assign Designer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-destructive">Failed to load project details</p>
                <p className="text-xs text-muted-foreground">
                  There was an error retrieving project details from the server. Please try again later.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Project Dialog */}
      {editProject && (
        <Dialog 
          open={isEditOpen} 
          onOpenChange={(isOpen) => {
            setIsEditOpen(isOpen);
            // Clear the editProject state when dialog is closed
            if (!isOpen) {
              setEditProject(null); 
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px] bg-popover">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Make changes to the project information
              </DialogDescription>
            </DialogHeader>
            {/* Form now uses controlled state for status */}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!editProject) return; // Guard against missing editProject
              
              const form = e.currentTarget;
              const nameValue = (form.elements.namedItem('name') as HTMLInputElement).value;
              const descriptionValue = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
              const deadlineValue = (form.elements.namedItem('deadline') as HTMLInputElement).value || undefined;
              
              // Prepare the data payload
              const baseFormData = {
                description: descriptionValue,
                status: editStatus, // Use controlled state
                deadline: deadlineValue
              };
              
              // Map 'name' input value to 'title' for relevant project types
              const dataToSubmit = (
                editProject.type === 'logo_design' || editProject.type === 'social_graphics'
                ) ? {
                  ...baseFormData,
                  title: nameValue // Map name input to title field
                } : {
                  ...baseFormData,
                  name: nameValue // Keep as name for web_design (or others if applicable)
                };
                
                // Basic validation: Ensure status is not empty
                if (!editStatus) {
                    toast({ variant: "destructive", title: "Error", description: "Status cannot be empty." });
                    return;
                }
                
                handleSaveEdit(dataToSubmit); // Pass the correctly mapped data
            }}>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    defaultValue={editProject.name}
                    required
                    className="bg-background"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    defaultValue={editProject.description}
                    className="bg-background"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    name="status" 
                    value={editStatus} 
                    onValueChange={setEditStatus} 
                  >
                    <SelectTrigger id="status" className="bg-background">
                      <SelectValue placeholder="Select status..."/>
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem> 
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    defaultValue={editProject.deadline?.split('T')[0]}
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="bg-background"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditing} className="bg-primary text-primary-foreground">
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Designer Dialog */}
      {projectToAssign && (
        <Dialog open={isAssignDesignerOpen} onOpenChange={setIsAssignDesignerOpen}>
          <DialogContent className="bg-popover">
            <DialogHeader>
              <DialogTitle>Assign Designer</DialogTitle>
              <DialogDescription>
                Select a designer to assign to this project
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Project</Label>
                <p className="text-sm font-medium">{projectToAssign.name}</p>
              </div>
              <div>
                <Label htmlFor="designer">Designer</Label>
                <Select
                  value={selectedDesignerId}
                  onValueChange={setSelectedDesignerId}
                  disabled={isAssigning}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={isAssigning ? "Loading designers..." : "Select a designer"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {isAssigning ? (
                      <SelectItem value="loading" disabled>
                        Loading designers...
                      </SelectItem>
                    ) : designers?.length > 0 ? (
                      designers.map((designer) => (
                        <SelectItem key={designer.id} value={designer.id}>
                          {designer.full_name || designer.email}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-designers" disabled>
                        No designers found in the system
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {designers?.length === 0 && !isAssigning && (
                  <p className="text-xs text-muted-foreground mt-2">
                    To add designers, first create user accounts with the designer role in the Users section.
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setIsAssignDesignerOpen(false)}
                className="bg-background"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignDesigner}
                disabled={!selectedDesignerId || isAssigning}
                className="bg-primary text-primary-foreground"
              >
                {isAssigning ? 'Assigning...' : 'Assign Designer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Project Dialog */}
      <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
        <DialogContent 
          className="sm:max-w-[600px]" 
          style={{ backgroundColor: "#000000", color: "#ffffff" }}
        >
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
            <DialogDescription>
              Create a new project for a client
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            
            // Extract form values - use DOM methods to get values more reliably
            const clientIdElement = form.querySelector('[name="clientId"]') as HTMLSelectElement;
            const projectTypeElement = form.querySelector('[name="projectType"]') as HTMLSelectElement;
            const nameElement = form.querySelector('#name') as HTMLInputElement;
            const descriptionElement = form.querySelector('#description') as HTMLTextAreaElement;
            const deadlineElement = form.querySelector('#deadline') as HTMLInputElement;
            
            // Get values
            const clientId = clientIdElement?.value;
            const projectType = projectTypeElement?.value as 'web_design' | 'logo_design' | 'social_graphics';
            const name = nameElement?.value;
            const description = descriptionElement?.value;
            const deadline = deadlineElement?.value;
            
            console.log('Form values:', { clientId, projectType, name, description, deadline });
            
            // Validate required fields
            if (!clientId) {
              toast({
                variant: "destructive",
                title: "Missing field",
                description: "Please select a client",
              });
              return;
            }
            
            if (!projectType) {
              toast({
                variant: "destructive",
                title: "Missing field",
                description: "Please select a project type",
              });
              return;
            }
            
            if (!name) {
              toast({
                variant: "destructive",
                title: "Missing field",
                description: "Please enter a project name",
              });
              return;
            }
            
            handleAddProject({
              clientId,
              projectType,
              name,
              description,
              deadline: deadline || undefined
            });
          }}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="clientId">Client</Label>
                <Select name="clientId">
                  <SelectTrigger 
                    id="clientId" 
                    className="bg-background"
                    style={{ backgroundColor: "#1f1f1f" }}
                  >
                    <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a client"} />
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-background"
                    style={{ backgroundColor: "#1f1f1f", color: "#ffffff" }}
                  >
                    {isLoadingClients ? (
                      <SelectItem value="loading" disabled>
                        Loading clients...
                      </SelectItem>
                    ) : clients?.length > 0 ? (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name || client.email} {client.company ? `(${client.company})` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-clients" disabled>
                        No clients found in the system
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {clients?.length === 0 && !isLoadingClients && (
                  <p className="text-xs text-muted-foreground mt-2">
                    To add projects, first create user accounts with the client role in the Users section.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="projectType">Project Type</Label>
                <Select name="projectType">
                  <SelectTrigger 
                    id="projectType" 
                    className="bg-background"
                    style={{ backgroundColor: "#1f1f1f" }}
                  >
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-background"
                    style={{ backgroundColor: "#1f1f1f", color: "#ffffff" }}
                  >
                    <SelectItem value="web_design">Web Design</SelectItem>
                    <SelectItem value="logo_design">Logo Design</SelectItem>
                    <SelectItem value="social_graphics">Social Graphics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="Enter project name"
                  className="bg-background"
                  style={{ backgroundColor: "#1f1f1f", color: "#ffffff" }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter project description"
                  className="bg-background"
                  style={{ backgroundColor: "#1f1f1f", color: "#ffffff" }}
                />
              </div>
              <div>
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <div className="relative">
                  <Input
                    id="deadline"
                    type="date"
                    placeholder="Select deadline"
                    className="bg-background"
                    style={{ backgroundColor: "#1f1f1f", color: "#ffffff" }}
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddProjectOpen(false)}
                className="bg-background"
                style={{ backgroundColor: "#1f1f1f", color: "#ffffff" }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isAddingProject} 
                className="bg-primary text-primary-foreground"
                style={{ backgroundColor: "#0284c7", color: "#ffffff" }}
              >
                {isAddingProject ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 