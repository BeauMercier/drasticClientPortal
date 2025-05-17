'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClockIcon, ArrowPathIcon, PaperClipIcon, DocumentIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { getUserProfile, getDesignerProject, addProjectNote, getProjectNotes, deleteProjectNote, getProjectRevisions, createProjectRevision, updateRevision, deleteRevision } from '@/lib/api/client-api';
import { ProjectRevision, RevisionStatus, ProjectTypeForRevision } from '@/lib/types/project';
import { ProjectFile } from '@/lib/types/project';
import { ProjectNote } from '@/lib/types/project';
import { ProjectDetails } from '@/lib/types/project';
import { useBir } from '@/features/bir/useBir';
import { SignedBirFile } from '@/lib/types/bir';
import { FileIcon, ImageIcon, DownloadIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Project type names mapping
const projectTypeNames = {
  web_design: 'Web Design',
  logo_design: 'Logo Design',
  social_graphics: 'Social Graphics'
};

interface RouteParams {
  type: ProjectTypeForRevision;
  id: string;
}

export default function DesignerProjectDetailPage({ params }: { params: RouteParams }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [fileViewMode, setFileViewMode] = useState<'list' | 'gallery'>('list');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [revisions, setRevisions] = useState<ProjectRevision[]>([]);
  const [filesSubTab, setFilesSubTab] = useState<'designer' | 'client'>('designer');
  
  const isWebDesign = params.type === 'web_design';
  const { 
    signedBirFiles, 
    isLoading: isLoadingBir, 
    error: birError 
  } = useBir(isWebDesign ? params.id : undefined);
  
  // New revision form state
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [isEditingRevision, setIsEditingRevision] = useState(false);
  const [currentRevisionId, setCurrentRevisionId] = useState<string | null>(null);
  const [newRevision, setNewRevision] = useState<{
    title: string;
    description: string;
    notes: string;
    selectedFiles: string[];
    links: {url: string, title: string}[];
    status: RevisionStatus;
  }>({
    title: '',
    description: '',
    notes: '',
    selectedFiles: [],
    links: [{url: '', title: ''}],
    status: 'pending'
  });

  const { id, type } = params;

  useEffect(() => {
    const loadProjectDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check auth status
        const isAuthenticated = await checkAuthStatus();
        if (!isAuthenticated) {
          console.error('User not authenticated');
          router.push('/login');
          return;
        }
        
        console.log('Loading project details for:', id, type);
        
        // Fetch project details
        const projectDataResponse = await fetch(`/api/projects/${type}/${id}`);
        
        if (!projectDataResponse.ok) {
          throw new Error(`Failed to load project: ${projectDataResponse.statusText}`);
        }
        
        const projectData = await projectDataResponse.json();
        
        console.log('Fetched project data:', projectData);
        setProject(projectData);
        
        // Set initial status filter based on the project's status
        setStatusUpdate(projectData.status || '');
        
        // Fetch project files
        await fetchProjectFiles();
        
        // Fetch project notes
        await fetchProjectNotes();
        
        // Fetch project revisions
        await fetchProjectRevisions();

      } catch (err) {
        console.error('Error loading project details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project details');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectDetails();
  }, [id, type, router]);

  // Function to check authentication status
  const checkAuthStatus = async () => {
    try {
      console.log('Checking authentication status...');
      const response = await fetch('/api/auth/check', {
        credentials: 'same-origin',
        cache: 'no-store'
      });
      
      const data = await response.json();
      console.log('Auth status:', data);
      
      return data.authenticated;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  };

  // Function to fetch project files
  const fetchProjectFiles = async (retryCount = 0) => {
    try {
      console.log(`Fetching project files (attempt ${retryCount + 1})...`);
      const filesResponse = await fetch(`/api/projects/files?projectId=${id}&projectType=${type}`, {
        method: 'GET',
        // Include credentials - same-origin is better for this use case
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        console.log('Successfully fetched files:', filesData.length);
        
        // Temporarily assign ownership to files
        // In a real implementation, this would come from the database
        const filesWithOwnership = filesData.map((file: ProjectFile, index: number) => ({
          ...file,
          uploaded_by: index % 3 === 0 ? 'client' : 'designer' // Mock data - every 3rd file is from client
        }));
        
        setFiles(filesWithOwnership);
        return true;
      } else {
        // If there's an authentication error and we haven't exceeded retry attempts
        if (filesResponse.status === 401 && retryCount < 2) {
          console.log('Authentication error when fetching files, retrying in 1 second...');
          
          // Force a new auth check before retrying
          await checkAuthStatus();
          
          setTimeout(() => fetchProjectFiles(retryCount + 1), 1000);
          return false;
        }
        
        try {
          const errorData = await filesResponse.json();
          console.error('Error fetching files:', errorData);
        } catch {
          const errorText = await filesResponse.text();
          console.error('Error fetching files (text):', errorText);
        }
        setFiles([]);
        return false;
      }
    } catch (fileErr) {
      console.error('Error fetching project files:', fileErr);
      setFiles([]);
      return false;
    }
  };

  // Function to fetch project notes
  const fetchProjectNotes = async () => {
    try {
      console.log('Fetching project notes...');
      const notesData = await getProjectNotes(
        id, 
        type as ProjectTypeForRevision
      );
      
      console.log('Fetched notes:', notesData);
      setNotes(notesData);
      return true;
    } catch (error) {
      console.error('Error fetching project notes:', error);
      return false;
    }
  };

  // Function to fetch project revisions
  const fetchProjectRevisions = async () => {
    try {
      console.log('Fetching project revisions...');
      const revisionsData = await getProjectRevisions(
        id, 
        type as ProjectTypeForRevision
      );
      
      console.log('Fetched revisions:', revisionsData);
      setRevisions(revisionsData);
      return true;
    } catch (error) {
      console.error('Error fetching project revisions:', error);
      return false;
    }
  };

  // MOVED HELPER FUNCTION HERE
  // Display formatted file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle adding a new revision
  const handleAddRevision = async () => {
    if (!newRevision.title.trim() || !newRevision.description.trim()) return;
    
    try {
      setIsSubmitting(true);
      console.log('Starting revision creation process...');
      
      if (isEditingRevision && currentRevisionId) {
        // Update existing revision
        console.log(`Updating revision ${currentRevisionId}`);
        
        const updatedRevision = await updateRevision(
          currentRevisionId,
          {
            status: newRevision.status,
            feedback: null // You might want to add a feedback field to your form if needed
          }
        );
        
        console.log('Revision updated successfully:', updatedRevision);
        
        // Update the revisions list with the updated revision
        setRevisions(prevRevisions => 
          prevRevisions.map(r => r.id === currentRevisionId ? updatedRevision : r)
        );
        
        // Reset form and editing state
        setIsEditingRevision(false);
        setCurrentRevisionId(null);
      } else {
        // Create new revision
        // Create the revision in the database - must match the expected type
        const revisionData = {
          project_id: id,
          project_type: type as ProjectTypeForRevision,
          title: newRevision.title,
          description: newRevision.description || null,
          status: newRevision.status,
          feedback: null,
          version: 0, // API will auto-calculate this
          // Don't set created_by - the API function will do this
          approved_by: null,
          approved_at: null
        } as Omit<ProjectRevision, 'id' | 'created_at' | 'updated_at'>;
        
        console.log('Sending revision data:', JSON.stringify(revisionData));
        
        try {
          // Create the revision in the database
          const createdRevision = await createProjectRevision(revisionData);
          
          console.log('Revision created successfully:', createdRevision);
          
          // Add new revision to state
          setRevisions(prevRevisions => [createdRevision, ...prevRevisions]);
        } catch (apiError) {
          console.error('API Error:', apiError);
          if (apiError instanceof Error) {
            console.error('Error message:', apiError.message);
            console.error('Error stack:', apiError.stack);
          }
          throw apiError;
        }
      }
      
      // Clear the form and hide it
      setNewRevision({
        title: '',
        description: '',
        notes: '',
        selectedFiles: [],
        links: [{url: '', title: ''}],
        status: 'pending'
      });
      setShowRevisionForm(false);
      
      // Provide feedback
      alert(isEditingRevision ? 'Revision updated successfully!' : 'Revision added successfully!');
    } catch (error) {
      console.error('Error managing revision:', error);
      alert(`Failed to ${isEditingRevision ? 'update' : 'add'} revision: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle editing a revision
  const handleEditRevision = (revision: ProjectRevision) => {
    setIsEditingRevision(true);
    setCurrentRevisionId(revision.id);
    setNewRevision({
      title: revision.title,
      description: revision.description || '',
      notes: '',  // You might want to fetch notes if they're stored separately
      selectedFiles: [], // You might want to fetch associated files
      links: [{url: '', title: ''}], // You might want to fetch associated links
      status: revision.status
    });
    setShowRevisionForm(true);
  };

  // Handle deleting a revision
  const handleDeleteRevision = async (revisionId: string) => {
    if (!confirm('Are you sure you want to delete this revision? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log(`Deleting revision ${revisionId}...`);
      
      await deleteRevision(revisionId);
      
      console.log('Revision deleted successfully');
      
      // Remove the deleted revision from state
      setRevisions(prevRevisions => prevRevisions.filter(r => r.id !== revisionId));
      
      // Provide feedback
      alert('Revision deleted successfully!');
    } catch (error) {
      console.error('Error deleting revision:', error);
      alert(`Failed to delete revision: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to add a new empty link field
  const addLinkField = () => {
    setNewRevision({
      ...newRevision,
      links: [...newRevision.links, {url: '', title: ''}]
    });
  };

  // Helper to update a link field
  const updateLinkField = (index: number, field: 'url' | 'title', value: string) => {
    const updatedLinks = [...newRevision.links];
    updatedLinks[index][field] = value;
    setNewRevision({
      ...newRevision,
      links: updatedLinks
    });
  };

  // Helper to remove a link field
  const removeLinkField = (index: number) => {
    const updatedLinks = [...newRevision.links];
    updatedLinks.splice(index, 1);
    setNewRevision({
      ...newRevision,
      links: updatedLinks.length ? updatedLinks : [{url: '', title: ''}]
    });
  };

  // Helper to toggle file selection
  const toggleFileSelection = (filePath: string) => {
    const isSelected = newRevision.selectedFiles.includes(filePath);
    if (isSelected) {
      setNewRevision({
        ...newRevision,
        selectedFiles: newRevision.selectedFiles.filter(path => path !== filePath)
      });
    } else {
      setNewRevision({
        ...newRevision,
        selectedFiles: [...newRevision.selectedFiles, filePath]
      });
    }
  };

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProjectTypeDisplay = (projectType: string) => {
    return projectTypeNames[projectType as keyof typeof projectTypeNames] || projectType;
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Check auth status before adding note
      const isAuthenticated = await checkAuthStatus();
      if (!isAuthenticated) {
        console.error('Not authenticated for adding note');
        alert('Authentication required. Please refresh the page and try again.');
        return;
      }
      
      // Add note to the project
      const noteData = await addProjectNote(
        id,
        type as ProjectTypeForRevision,
        note,
        isPrivateNote
      );
      
      console.log('Note added:', noteData);
      
      // Update the notes list with the new note
      setNotes(prevNotes => [noteData, ...prevNotes]);

      // Clear the note field after submission
      setNote('');
      setIsPrivateNote(false);
      
      // Provide feedback to the user
      alert('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      setIsSubmitting(true);
      
      // Delete the note
      await deleteProjectNote(noteId);
      
      // Update the notes list
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      
      // Provide feedback
      alert('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate || !project || statusUpdate === project.status) return;
    
    try {
      setIsSubmitting(true);
      
      // TODO: Implement status update functionality
      // This would call an API function to update the project status

      // Update the project state with the new status
      setProject(prevProject => {
        if (!prevProject) return null;
        return { ...prevProject, status: statusUpdate };
      });
      
      // Provide feedback to the user
      alert('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = () => {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.click();
    
    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files?.length) return;
      
      try {
        setIsSubmitting(true);
        
        // Check auth status before uploading
        const isAuthenticated = await checkAuthStatus();
        if (!isAuthenticated) {
          console.error('Not authenticated for file upload');
          alert('Authentication required. Please refresh the page and try again.');
          return;
        }
        
        const uploadedFiles: ProjectFile[] = [];
        
        // Upload each file
        for (let i = 0; i < target.files.length; i++) {
          const file = target.files[i];
          console.log(`Uploading file ${i+1}/${target.files.length}: ${file.name}`);
          
          // Create a FormData object for the file upload
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectId', id);
          formData.append('projectType', type);
          
          // Upload the file to the API
          const uploadResponse = await fetch('/api/projects/files/upload', {
            method: 'POST',
            body: formData,
            // Include credentials with same-origin policy
            credentials: 'same-origin',
            cache: 'no-store'
          });
          
          if (!uploadResponse.ok) {
            let errorMessage = 'Failed to upload file';
            try {
              const errorData = await uploadResponse.json();
              errorMessage = errorData.error || errorMessage;
            } catch {
              try {
                const errorText = await uploadResponse.text();
                errorMessage = errorText || errorMessage;
              } catch {
                // Fallback to default error message
              }
            }
            throw new Error(errorMessage);
          }
          
          const uploadResult = await uploadResponse.json();
          uploadedFiles.push(uploadResult);
        }
        
        // Update the files list with the new files
        setFiles(prevFiles => [...uploadedFiles, ...prevFiles]);
        
        // Provide feedback to the user
        alert(`${target.files.length} file(s) uploaded successfully`);
        
        // Refresh file list
        fetchProjectFiles();
      } catch (error) {
        console.error('Error uploading files:', error);
        alert(error instanceof Error ? error.message : 'Failed to upload files. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };
  };

  const handleFileDownload = async (filePath: string, fileName: string) => {
    try {
      setIsSubmitting(true);
      
      // Check auth status before downloading
      const isAuthenticated = await checkAuthStatus();
      if (!isAuthenticated) {
        console.error('Not authenticated for file download');
        alert('Authentication required. Please refresh the page and try again.');
        return;
      }
      
      // Get the download URL via API
      const response = await fetch(`/api/projects/files/download?path=${encodeURIComponent(filePath)}`, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to get download URL';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Could not parse as JSON
          console.error('Failed to parse error as JSON', e);
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (e) {
            // Could not get error text
            console.error('Failed to get error text', e);
          }
        }
        throw new Error(errorMessage);
      }
      
      const { url } = await response.json();
      
      // Use fetch to download the file as a blob
      const fileResponse = await fetch(url);
      if (!fileResponse.ok) throw new Error('Failed to download file');
      
      // Get the file as a blob
      const blob = await fileResponse.blob();
      
      // Create an object URL from the blob
      const objectUrl = URL.createObjectURL(blob);
      
      // Create anchor element for download
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName; // This is key to trigger download instead of navigation
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      }, 100);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(error instanceof Error ? error.message : 'Failed to download file. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file deletion
  const handleFileDelete = async (filePath: string, fileName: string) => {
    try {
      // Confirm deletion with the user
      if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
        return;
      }
      
      setIsSubmitting(true);
      
      // Check auth status before deleting
      const isAuthenticated = await checkAuthStatus();
      if (!isAuthenticated) {
        console.error('Not authenticated for file deletion');
        alert('Authentication required. Please refresh the page and try again.');
        return;
      }
      
      // Delete the file via API
      const response = await fetch(`/api/projects/files/delete?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete file';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Could not parse as JSON
          console.error('Failed to parse error as JSON', e);
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (e) {
            // Could not get error text
            console.error('Failed to get error text', e);
          }
        }
        throw new Error(errorMessage);
      }
      
      // Remove the file from the local state
      setFiles(prevFiles => prevFiles.filter(file => file.url !== filePath));
      
      // Show success message
      alert(`"${fileName}" has been deleted successfully.`);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete file. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get file type based on file extension
  const getFileType = (file: ProjectFile): string => {
    if (!file.name) return 'other';
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['pdf'].includes(extension)) return 'pdf';
    if (['doc', 'docx'].includes(extension)) return 'document';
    if (['xls', 'xlsx', 'csv'].includes(extension)) return 'spreadsheet';
    if (['ppt', 'pptx'].includes(extension)) return 'presentation';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'archive';
    return 'other';
  };

  // Get file icon based on file type
  const getFileIcon = (file: ProjectFile) => {
    const fileType = getFileType(file);
    
    switch (fileType) {
      case 'image':
        return <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path>
        </svg>;
      case 'pdf':
        return <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
        </svg>;
      case 'document':
        return <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
        </svg>;
      case 'spreadsheet':
        return <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
        </svg>;
      case 'presentation':
        return <svg className="h-6 w-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
        </svg>;
      case 'archive':
        return <svg className="h-6 w-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 4a1 1 0 011-1h8a1 1 0 011 1v1H5V4zm4 3V6h2v1h-2zm-3 2V8h8v1H6z" clipRule="evenodd"></path>
          <path d="M4 7a1 1 0 011-1h10a1 1 0 011 1v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"></path>
        </svg>;
      default:
        return <DocumentIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  // Filter and sort files
  const filteredAndSortedFiles = () => {
    let filtered = [...files];
    
    // Filter by owner (designer or client)
    filtered = filtered.filter(file => 
      filesSubTab === 'designer' 
        ? file.uploaded_by === 'designer' 
        : file.uploaded_by === 'client'
    );
    
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
    
    return filtered;
  };

  // Check if file is an image with browser-viewable format
  const isViewableImage = (file: ProjectFile): boolean => {
    // Only these formats can be reliably displayed in browsers
    const viewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return viewableExtensions.includes(extension);
  };

  // Check if file is any kind of image (including HEIC)
  const isImage = (file: ProjectFile): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return imageExtensions.includes(extension);
  };

  // Get file type counts for displaying in filters
  const getFileTypeCounts = () => {
    // Filter files by current sub-tab first
    const subTabFiles = files.filter(file => 
      filesSubTab === 'designer' 
        ? file.uploaded_by === 'designer' 
        : file.uploaded_by === 'client'
    );
    
    const counts = {
      all: subTabFiles.length,
      image: subTabFiles.filter(file => getFileType(file) === 'image').length,
      pdf: subTabFiles.filter(file => getFileType(file) === 'pdf').length,
      document: subTabFiles.filter(file => getFileType(file) === 'document').length,
      spreadsheet: subTabFiles.filter(file => getFileType(file) === 'spreadsheet').length,
      presentation: subTabFiles.filter(file => getFileType(file) === 'presentation').length,
      archive: subTabFiles.filter(file => getFileType(file) === 'archive').length,
      other: subTabFiles.filter(file => getFileType(file) === 'other').length
    };
    return counts;
  };

  // Get status badge color based on revision status
  const getRevisionStatusColor = (status: RevisionStatus) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'current': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format status for display
  const formatRevisionStatus = (status: RevisionStatus): string => {
    switch(status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'current': return 'Current';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="h-8 w-8 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
          <Button className="mt-4" onClick={() => router.push('/designer/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 p-4 rounded-md">
          <p className="text-yellow-700">Project not found or not assigned to you.</p>
          <Button className="mt-4" onClick={() => router.push('/designer/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Project Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mb-2"
              onClick={() => router.push('/designer/projects')}
            >
              Back to Projects
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{project.name || project.title}</h1>
            <div className="flex items-center mt-2 space-x-3">
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
              <span className="text-sm text-gray-500">{getProjectTypeDisplay(type)}</span>
              {project.deadline && (
                <span className="text-xs text-gray-500 flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  Due {formatDate(String(project.deadline))}
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={handleFileUpload}
              disabled={isSubmitting}
            >
              <PaperClipIcon className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>
      </div>

      {/* Project Tabs */}
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="details">Project Details</TabsTrigger>
          <TabsTrigger value="revisions">Revisions</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        
        {/* Details Tab */}
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Details about the project and requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Overview</h3>
                  
                  <dl className="grid grid-cols-1 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Client</dt>
                      <dd className="mt-1 text-gray-900">{project.client_name || 'Unknown Client'}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-gray-900">{project.description || 'No description provided'}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="mt-1 text-gray-900">{formatDate(project.created_at)}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-gray-900">{formatDate(project.updated_at)}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1 text-gray-900">
                        <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border border-gray-700 text-white">
                            <SelectItem value="pending" className="focus:bg-gray-700 focus:text-white">Pending</SelectItem>
                            <SelectItem value="in_progress" className="focus:bg-gray-700 focus:text-white">In Progress</SelectItem>
                            <SelectItem value="review" className="focus:bg-gray-700 focus:text-white">Review</SelectItem>
                            <SelectItem value="completed" className="focus:bg-gray-700 focus:text-white">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          className="mt-2" 
                          disabled={isSubmitting || statusUpdate === project.status}
                          onClick={handleStatusUpdate}
                        >
                          Update Status
                        </Button>
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Project Details</h3>
                  
                  <dl className="grid grid-cols-1 gap-4">
                    {/* Type-specific fields */}
                    {type === 'web_design' && (
                      <>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Site Type</dt>
                          <dd className="mt-1 text-gray-900">{project.site_type || 'Not specified'}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Domain Name</dt>
                          <dd className="mt-1 text-gray-900">{project.domain_name || 'Not specified'}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Hosting Provider</dt>
                          <dd className="mt-1 text-gray-900">{project.hosting_provider || 'Not specified'}</dd>
                        </div>
                      </>
                    )}
                    
                    {type === 'logo_design' && (
                      <>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Industry</dt>
                          <dd className="mt-1 text-gray-900">{project.industry || 'Not specified'}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Color Preferences</dt>
                          <dd className="mt-1 text-gray-900">{project.color_preferences || 'Not specified'}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Style Preferences</dt>
                          <dd className="mt-1 text-gray-900">{project.style_preferences || 'Not specified'}</dd>
                        </div>
                      </>
                    )}
                    
                    {type === 'social_graphics' && (
                      <>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Social Platform</dt>
                          <dd className="mt-1 text-gray-900">
                            {typeof project.social_platform === 'string' 
                              ? project.social_platform.replace('_', ' ') 
                              : 'Not specified'}
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Content Type</dt>
                          <dd className="mt-1 text-gray-900">{project.content_type || 'Not specified'}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Post Format</dt>
                          <dd className="mt-1 text-gray-900">{project.post_format || 'Not specified'}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Revisions Tab */}
        <TabsContent value="revisions" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Revisions</CardTitle>
                <CardDescription>Track the history of design revisions for this project</CardDescription>
              </div>
              <Button onClick={() => {
                setIsEditingRevision(false);
                setCurrentRevisionId(null);
                setNewRevision({
                  title: '',
                  description: '',
                  notes: '',
                  selectedFiles: [],
                  links: [{url: '', title: ''}],
                  status: 'pending'
                });
                setShowRevisionForm(true);
              }} disabled={showRevisionForm}>
                New Revision
              </Button>
            </CardHeader>
            <CardContent>
              {showRevisionForm && (
                <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {isEditingRevision ? 'Edit Revision' : 'Create New Revision'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        placeholder="Enter revision title..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={newRevision.title}
                        onChange={(e) => setNewRevision({...newRevision, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <Textarea 
                        placeholder="Describe the changes in this revision..." 
                        value={newRevision.description}
                        onChange={(e) => setNewRevision({...newRevision, description: e.target.value})}
                        className="min-h-[80px] w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                      <Textarea 
                        placeholder="Additional notes about this revision..." 
                        value={newRevision.notes}
                        onChange={(e) => setNewRevision({...newRevision, notes: e.target.value})}
                        className="min-h-[80px] w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <Select 
                        value={newRevision.status}
                        onValueChange={(value) => setNewRevision({
                          ...newRevision, 
                          status: value as RevisionStatus
                        })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="current">Current</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Associated Files</label>
                      <div className="mb-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            // Create file input element
                            const fileInput = document.createElement('input');
                            fileInput.type = 'file';
                            fileInput.multiple = true;
                            fileInput.click();
                            
                            fileInput.onchange = async (e) => {
                              const target = e.target as HTMLInputElement;
                              if (!target.files?.length) return;
                              
                              try {
                                setIsSubmitting(true);
                                
                                // Check auth status before uploading
                                const isAuthenticated = await checkAuthStatus();
                                if (!isAuthenticated) {
                                  console.error('Not authenticated for file upload');
                                  alert('Authentication required. Please refresh the page and try again.');
                                  return;
                                }
                                
                                const uploadedFiles: ProjectFile[] = [];
                                
                                // Upload each file
                                for (let i = 0; i < target.files.length; i++) {
                                  const file = target.files[i];
                                  console.log(`Uploading file ${i+1}/${target.files.length}: ${file.name}`);
                                  
                                  // Create a FormData object for the file upload
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  formData.append('projectId', id);
                                  formData.append('projectType', type);
                                  
                                  // Upload the file to the API
                                  const uploadResponse = await fetch('/api/projects/files/upload', {
                                    method: 'POST',
                                    body: formData,
                                    // Include credentials with same-origin policy
                                    credentials: 'same-origin',
                                    cache: 'no-store'
                                  });
                                  
                                  if (!uploadResponse.ok) {
                                    let errorMessage = 'Failed to upload file';
                                    try {
                                      const errorData = await uploadResponse.json();
                                      errorMessage = errorData.error || errorMessage;
                                    } catch {
                                      try {
                                        const errorText = await uploadResponse.text();
                                        errorMessage = errorText || errorMessage;
                                      } catch {
                                        // Fallback to default error message
                                      }
                                    }
                                    throw new Error(errorMessage);
                                  }
                                  
                                  const uploadResult = await uploadResponse.json();
                                  uploadedFiles.push(uploadResult);
                                  
                                  // Add the uploaded file to the selected files
                                  setNewRevision(prev => ({
                                    ...prev,
                                    selectedFiles: [...prev.selectedFiles, uploadResult.url]
                                  }));
                                }
                                
                                // Update the files list with the new files
                                setFiles(prevFiles => [...uploadedFiles, ...prevFiles]);
                                
                                // Provide feedback to the user
                                alert(`${target.files.length} file(s) uploaded successfully`);
                              } catch (error) {
                                console.error('Error uploading files:', error);
                                alert(error instanceof Error ? error.message : 'Failed to upload files. Please try again.');
                              } finally {
                                setIsSubmitting(false);
                              }
                            };
                          }}
                          className="mb-2"
                        >
                          Upload New Files
                        </Button>
                      </div>
                      {files.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                          {files.map((file, idx) => (
                            <div key={idx} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                              <input 
                                type="checkbox"
                                id={`file-${idx}`}
                                checked={newRevision.selectedFiles.includes(file.url)}
                                onChange={() => toggleFileSelection(file.url)}
                                className="mr-2 h-4 w-4"
                              />
                              <label htmlFor={`file-${idx}`} className="text-sm flex items-center cursor-pointer">
                                {getFileIcon(file)}
                                <span className="ml-2">{file.name}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No files available to select</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Links (Optional)</label>
                      <div className="space-y-2">
                        {newRevision.links.map((link, idx) => (
                          <div key={idx} className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="Link title"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                              value={link.title}
                              onChange={(e) => updateLinkField(idx, 'title', e.target.value)}
                            />
                            <input
                              type="url"
                              placeholder="URL"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                              value={link.url}
                              onChange={(e) => updateLinkField(idx, 'url', e.target.value)}
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              type="button"
                              onClick={() => removeLinkField(idx)}
                              disabled={newRevision.links.length === 1}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm"
                          type="button"
                          onClick={addLinkField}
                        >
                          Add Link
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4 space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowRevisionForm(false);
                          setNewRevision({
                            title: '',
                            description: '',
                            notes: '',
                            selectedFiles: [],
                            links: [{url: '', title: ''}],
                            status: 'pending'
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddRevision}
                        disabled={isSubmitting}
                      >
                        {isEditingRevision ? 'Update Revision' : 'Save Revision'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revision History</h3>
                
                {revisions.length > 0 ? (
                  <div className="space-y-6">
                    {revisions.map((revision) => (
                      <div key={revision.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-4 flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-medium text-gray-900">v{revision.version}</span>
                            <h4 className="text-lg font-medium text-gray-700">{revision.title}</h4>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRevisionStatusColor(revision.status)}`}>
                              {formatRevisionStatus(revision.status)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{formatDate(revision.created_at)}</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditRevision(revision)}
                              disabled={isSubmitting}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleDeleteRevision(revision.id)}
                              disabled={isSubmitting}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          {revision.description && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700">Description</h5>
                              <p className="mt-1 text-sm text-gray-500">{revision.description}</p>
                            </div>
                          )}
                          
                          {revision.feedback && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700">Feedback</h5>
                              <p className="mt-1 text-sm text-gray-500 italic">{revision.feedback}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-gray-50 p-3 border-t border-gray-200 flex justify-end space-x-2">
                          <Select 
                            value={revision.status}
                            onValueChange={async (value) => {
                              try {
                                setIsSubmitting(true);
                                const updatedRevision = await updateRevision(
                                  revision.id, 
                                  { status: value as RevisionStatus }
                                );
                                
                                // Update the revisions list with the updated revision
                                setRevisions(prevRevisions => 
                                  prevRevisions.map(r => r.id === revision.id ? updatedRevision : r)
                                );
                              } catch (error) {
                                console.error('Error updating revision status:', error);
                                alert('Failed to update revision status. Please try again.');
                              } finally {
                                setIsSubmitting(false);
                              }
                            }}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="current">Current</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No revisions have been added yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Files Tab */}
        <TabsContent value="files" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Project Files</CardTitle>
                  <CardDescription>View and manage files for this project</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <Select 
                      value={fileTypeFilter}
                      onValueChange={setFileTypeFilter}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="File Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        <SelectItem value="all">All Files ({getFileTypeCounts().all})</SelectItem>
                        {getFileTypeCounts().image > 0 && (
                          <SelectItem value="image">Images ({getFileTypeCounts().image})</SelectItem>
                        )}
                        {getFileTypeCounts().pdf > 0 && (
                          <SelectItem value="pdf">PDFs ({getFileTypeCounts().pdf})</SelectItem>
                        )}
                        {getFileTypeCounts().document > 0 && (
                          <SelectItem value="document">Documents ({getFileTypeCounts().document})</SelectItem>
                        )}
                        {getFileTypeCounts().spreadsheet > 0 && (
                          <SelectItem value="spreadsheet">Spreadsheets ({getFileTypeCounts().spreadsheet})</SelectItem>
                        )}
                        {getFileTypeCounts().presentation > 0 && (
                          <SelectItem value="presentation">Presentations ({getFileTypeCounts().presentation})</SelectItem>
                        )}
                        {getFileTypeCounts().archive > 0 && (
                          <SelectItem value="archive">Archives ({getFileTypeCounts().archive})</SelectItem>
                        )}
                        {getFileTypeCounts().other > 0 && (
                          <SelectItem value="other">Other ({getFileTypeCounts().other})</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center">
                    <Select 
                      value={`${sortBy}-${sortOrder}`}
                      onValueChange={(value) => {
                        const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder];
                        setSortBy(newSortBy);
                        setSortOrder(newSortOrder);
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="date-desc">Newest First</SelectItem>
                        <SelectItem value="date-asc">Oldest First</SelectItem>
                        <SelectItem value="size-desc">Largest First</SelectItem>
                        <SelectItem value="size-asc">Smallest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex border rounded-md overflow-hidden">
                    <button
                      onClick={() => setFileViewMode('list')}
                      className={`p-2 ${fileViewMode === 'list' ? 'bg-gray-200 text-gray-800' : 'bg-white text-gray-400 hover:text-gray-600'}`}
                      title="List view"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => setFileViewMode('gallery')}
                      className={`p-2 ${fileViewMode === 'gallery' ? 'bg-gray-200 text-gray-800' : 'bg-white text-gray-400 hover:text-gray-600'}`}
                      title="Gallery view"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm8-8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* File source sub-tabs */}
              <div className="mt-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                  <button
                    onClick={() => setFilesSubTab('designer')}
                    className={`py-2 px-1 ${
                      filesSubTab === 'designer'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Designer Files
                  </button>
                  <button
                    onClick={() => setFilesSubTab('client')}
                    className={`py-2 px-1 ${
                      filesSubTab === 'client'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Client Files
                  </button>
                </nav>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {filesSubTab === 'designer' ? 'Designer Files' : 'Client Files'}
                </h3>
                {filesSubTab === 'designer' && (
                  <Button 
                    onClick={handleFileUpload}
                    disabled={isSubmitting}
                  >
                    <PaperClipIcon className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                )}
              </div>
                
              {/* Conditional rendering for BIR files / other files */}
              {filesSubTab === 'client' && isWebDesign ? (
                // === NEW: BIR Files for Web Design ===
                <>
                  {isLoadingBir && (
                    <div className="flex items-center justify-center py-10">
                      <ArrowPathIcon className="h-6 w-6 text-gray-500 animate-spin mr-2" />
                      <p className="text-sm text-gray-500">Loading client files…</p>
                    </div>
                  )}
                  {birError && (
                     <div className="text-center py-8 px-4 bg-red-50 rounded-md">
                        <svg className="mx-auto h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-red-800">Unable to load client files</h3>
                        <p className="mt-1 text-sm text-red-700">There was an issue fetching the Business Information files. Please try again later or contact support if the problem persists.</p>
                        {birError.message && <p className="mt-1 text-xs text-red-600">Error: {birError.message}</p>}
                      </div>
                  )}
                  {!isLoadingBir && !birError && (!signedBirFiles || signedBirFiles.length === 0) && (
                    <div className="text-center py-10">
                      <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">No client files</h3>
                      <p className="mt-1 text-sm text-gray-500">The client hasn&rsquo;t uploaded any files for this project&rsquo;s Business Information Request yet.</p>
                    </div>
                  )}
                  {!isLoadingBir && !birError && signedBirFiles && signedBirFiles.length > 0 && (
                    <ul role="list" className="divide-y divide-gray-200 border-t border-gray-200">
                      {signedBirFiles.map((file) => (
                        <li key={file.id} className="flex items-center justify-between py-3 hover:bg-gray-50 px-2">
                          <div className="flex min-w-0 items-center gap-x-3">
                            <PaperClipIcon className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                            <div className="min-w-0 flex-auto">
                              {file.publicUrl ? (
                                <a
                                  href={file.publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 truncate"
                                  title={file.original_name}
                                >
                                  {file.original_name}
                                </a>
                              ) : (
                                <span className="text-sm text-gray-500 truncate" title={file.original_name}>
                                  {file.original_name} (Processing)
                                </span>
                              )}
                               <p className="text-xs text-gray-500">
                                {file.size_bytes !== null && file.size_bytes !== undefined ? formatFileSize(file.size_bytes) : 'N/A'}
                                {file.mime_type && ` • ${file.mime_type}`}
                              </p>
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0 flex items-center gap-x-3">
                            {file.publicUrl && (
                              <a
                                href={file.publicUrl}
                                download={file.original_name}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                              >
                                <DocumentArrowDownIcon className="-ml-0.5 h-4 w-4 text-gray-500" aria-hidden="true" />
                                Download
                              </a>
                            )}
                            {!file.publicUrl && file.error === 'not_found' && (
                               <span className="text-xs text-yellow-600 italic">File not in storage</span>
                            )}
                            {!file.publicUrl && file.error === 'generic' && (
                               <span className="text-xs text-red-600 italic">Download error</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                // === EXISTING Logic for Designer Files OR Non-Web-Design Client Files ===
                <>
                  {filteredAndSortedFiles().length > 0 ? (
                    fileViewMode === 'list' ? (
                      <ul className="divide-y divide-gray-200">
                        {filteredAndSortedFiles().map((file, index) => (
                          <li key={index} className="py-4 flex justify-between items-center">
                            <div className="flex items-center">
                              {getFileIcon(file)}
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  Uploaded {formatDate(file.upload_date)} • {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleFileDownload(file.url, file.name)}
                                disabled={isSubmitting}
                              >
                                Download
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                onClick={() => handleFileDelete(file.url, file.name)}
                                disabled={isSubmitting}
                              >
                                Delete
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {filteredAndSortedFiles().map((file, index) => (
                          <div 
                            key={index} 
                            className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-center justify-center bg-gray-50 h-36 p-4">
                              {isViewableImage(file) ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <img 
                                    src={`/api/projects/files/download?path=${encodeURIComponent(file.url)}&preview=true`}
                                    alt={file.name}
                                    className="max-h-full max-w-full object-contain"
                                    loading="lazy"
                                    onError={(e) => {
                                      // If image fails to load, show file icon
                                      const target = e.target as HTMLImageElement;
                                      if (target.parentElement) {
                                        // Hide the broken image
                                        target.style.display = 'none';
                                        
                                        // Create container for icon
                                        const iconContainer = document.createElement('div');
                                        iconContainer.className = 'flex flex-col items-center justify-center h-full';
                                        
                                        // Create icon element based on file type
                                        const iconType = getFileType(file);
                                        const iconColor = 
                                          iconType === 'image' ? 'text-blue-500' : 
                                          iconType === 'pdf' ? 'text-red-500' : 
                                          iconType === 'document' ? 'text-blue-600' : 
                                          iconType === 'spreadsheet' ? 'text-green-600' : 
                                          iconType === 'presentation' ? 'text-orange-500' : 
                                          iconType === 'archive' ? 'text-yellow-500' : 'text-gray-400';
                                        
                                        iconContainer.innerHTML = `
                                          <svg class="h-12 w-12 ${iconColor}" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                                          </svg>
                                          <span class="mt-2 text-xs text-gray-500 uppercase">${file.name.split('.').pop() || ''}</span>
                                        `;
                                        
                                        target.parentElement.appendChild(iconContainer);
                                      }
                                    }}
                                  />
                                </div>
                              ) : isImage(file) ? (
                                // Special handling for non-web image formats like HEIC
                                <div className="flex flex-col items-center justify-center h-full">
                                  <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path>
                                  </svg>
                                  <span className="mt-2 text-xs text-gray-500">IMAGE</span>
                                  <span className="text-xs text-gray-500 uppercase">{file.name.split('.').pop()}</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full">
                                  {getFileIcon(file)}
                                  <span className="mt-2 text-xs text-gray-500 uppercase">{file.name.split('.').pop()}</span>
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-white shadow-sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleFileDownload(file.url, file.name);
                                }}
                                disabled={isSubmitting}
                              >
                                Download
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-white shadow-sm text-red-600 hover:text-red-800 hover:bg-red-50"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleFileDelete(file.url, file.name);
                                }}
                                disabled={isSubmitting}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8">
                      <DocumentIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-gray-900">
                        {filesSubTab === 'designer' 
                          ? 'No designer files uploaded yet' 
                          : "The client hasn't uploaded any files for this project"
                        }
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {filesSubTab === 'designer'
                          ? 'Upload files to share with the client'
                          : 'The client hasn\'t uploaded any files for this project'
                        }
                      </p>
                      {filesSubTab === 'designer' && (
                        <Button 
                          className="mt-4" 
                          onClick={handleFileUpload}
                          disabled={isSubmitting}
                        >
                          Upload Files
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Notes</CardTitle>
              <CardDescription>Add notes and comments about the project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Textarea 
                  placeholder="Add a note..." 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-[120px]"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="privateNote"
                      checked={isPrivateNote}
                      onChange={(e) => setIsPrivateNote(e.target.checked)}
                      className="mr-2 h-4 w-4"
                    />
                    <label htmlFor="privateNote" className="text-sm text-gray-500">
                      Private note (only visible to you)
                    </label>
                  </div>
                  <Button 
                    disabled={!note.trim() || isSubmitting}
                    onClick={handleAddNote}
                  >
                    Add Note
                  </Button>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes History</h3>
                
                {notes.length > 0 ? (
                  <ul className="space-y-4">
                    {notes.map((noteItem) => (
                      <li key={noteItem.id} className="p-4 border border-gray-200 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="whitespace-pre-wrap text-sm text-gray-700">{noteItem.content}</p>
                            <div className="mt-2 text-xs text-gray-500 flex items-center">
                              {formatDate(noteItem.created_at)}
                              {((noteItem as any).is_private) && (
                                <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">Private</span>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDeleteNote(noteItem.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No notes available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 