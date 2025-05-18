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
import BusinessInfoGate from '@/features/bir/BusinessInfoGate'; // Ensure this import is present
import { FILES_BUCKET } from '@/lib/api/storage'; // Import FILES_BUCKET

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
  
  // State for combined project files (general + BIR)
  const [allProjectFiles, setAllProjectFiles] = useState<ProjectFile[]>([]);

  const { id, type } = params; // Destructure params early
  const isWebDesign = type === 'web_design';

  const { 
    bir, // Ensure 'bir' is destructured
    signedBirFiles, 
    isLoading: isLoadingBir, 
    error: birError 
  } = useBir(isWebDesign ? id : undefined);
  
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
        
        // Fetch general project files (this will be merged with BIR files later)
        // This function now updates the 'files' state which is just one source.
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

  // Function to fetch project files (general files from client-files bucket)
  const fetchProjectFiles = async (retryCount = 0) => {
    try {
      console.log(`Fetching general project files (attempt ${retryCount + 1})...`);
      const filesResponse = await fetch(`/api/projects/files?projectId=${id}&projectType=${type}`, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        console.log('Successfully fetched general files:', filesData.length);
        
        // Map general files to ProjectFile structure, assume 'designer' for now if not specified by API
        // The API currently does not return uploaded_by for these general files.
        const generalFilesMapped = filesData.map((file: any, index: number) => ({
          id: file.id || file.name, // Use name as fallback id if actual id is missing
          name: file.name,
          size: file.metadata?.size || 0,
          type: file.metadata?.mimetype || 'application/octet-stream',
          // Use 'id' (projectId) and 'type' (projectType) from params for the path
          url: `${FILES_BUCKET}/${type}/${id}/${file.name}`, 
          project_id: id,
          upload_date: file.created_at || new Date().toISOString(),
          // Mock uploaded_by for general files. This needs a proper backend solution.
          // For now, let's assume non-BIR files fetched this way are designer uploads unless API says otherwise.
          uploaded_by: file.uploaded_by || 'designer' 
        }));
        
        setFiles(generalFilesMapped); // Temporarily set to 'files' state for merging logic below
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

  // This effect merges general files (from 'files' state) and BIR files (from 'signedBirFiles')
  // into 'allProjectFiles' state which the UI will use.
  useEffect(() => {
    const birFilesMapped: ProjectFile[] = (signedBirFiles || []).map(birFile => ({
      id: birFile.id,
      name: birFile.original_name,
      size: birFile.size_bytes || 0,
      type: birFile.mime_type || 'application/octet-stream',
      // Use publicUrl if available (signed), otherwise construct a placeholder or indicate it needs signing
      url: birFile.publicUrl || `bir-file://${birFile.storage_path}`,
      project_id: id,
      upload_date: birFile.uploaded_at || new Date().toISOString(),
      uploaded_by: 'client', // BIR files are always client-uploaded
    }));

    console.log('[FileMergeEffect] General files to merge:', files);
    console.log('[FileMergeEffect] BIR files to merge:', birFilesMapped);

    // Simple concatenation merge. Add de-duplication if necessary based on a unique key (e.g., URL or name+path)
    // For now, assuming file names/paths are unique enough across these two sources for this project.
    setAllProjectFiles([...files, ...birFilesMapped]);

  }, [files, signedBirFiles, id]); // Rerun when general files or BIR files change

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
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateString; // fallback
    }
  };

  const getProjectTypeDisplay = (projectType: string) => {
    const typeMap: { [key: string]: string } = {
      web_design: 'Web Design',
      logo_design: 'Logo Design',
      social_graphics: 'Social Graphics'
    };
    return typeMap[projectType as keyof typeof typeMap] || projectType;
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'on_hold': return 'bg-yellow-500 text-black';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
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

  // Filter and sort files - NOW USES allProjectFiles
  const filteredAndSortedFiles = () => {
    console.log('[FilesTab] Full files array before filtering (allProjectFiles):', JSON.parse(JSON.stringify(allProjectFiles)));
    console.log('[FilesTab] current filesSubTab:', filesSubTab);

    let filtered = [...allProjectFiles]; // Use allProjectFiles
    
    // Filter by owner (designer or client)
    filtered = filtered.filter(file => 
      filesSubTab === 'designer' 
        ? file.uploaded_by === 'designer' 
        : file.uploaded_by === 'client'
    );
    console.log('[FilesTab] Files after uploaded_by filter:', JSON.parse(JSON.stringify(filtered)));
    
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
    // THIS NOW USES allProjectFiles
    const subTabFiles = allProjectFiles.filter(file => 
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
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* Project Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{project?.title || 'Project Title'}</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          <span>Client: {(project?.client && (project.client as any)?.full_name) || 'N/A'}</span>
          <span className="mx-2">|</span>
          <span>Due Date: {(project?.due_date && formatDate(String(project.due_date))) || 'N/A'}</span>
        </div>
        {(project?.status && <Badge className={cn("mt-2", getStatusColor(project.status))}>{project.status}</Badge>) || <Badge className={cn("mt-2", getStatusColor('unknown'))}>Unknown Status</Badge>}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="revisions">Revisions</TabsTrigger>
          {isWebDesign && <TabsTrigger value="bir">Business Info</TabsTrigger>}
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>Key details about this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Project Type:</h3>
                <p>{getProjectTypeDisplay(type)}</p>
              </div>
              <div>
                <h3 className="font-semibold">Description:</h3>
                <p>{project?.description || 'No description provided.'}</p>
              </div>
              <div>
                <h3 className="font-semibold">Status:</h3>
                <p>{project?.status ? <Badge className={cn(getStatusColor(project.status))}>{project.status}</Badge> : 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-semibold">Client:</h3>
                <p>{(project?.client && (project.client as any)?.full_name) || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-semibold">Due Date:</h3>
                <p>{(project?.due_date && formatDate(String(project.due_date))) || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-semibold">Created Date:</h3>
                <p>{(project?.created_at && formatDate(String(project.created_at))) || 'N/A'}</p>
              </div>
              {/* Add more project details as needed */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Project Notes</CardTitle>
              <CardDescription>Internal and client-visible notes for this project.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Textarea
                  placeholder="Add a new note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mb-2"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isPrivateNote}
                      onChange={(e) => setIsPrivateNote(e.target.checked)}
                    />
                    <span>Private (Designer only)</span>
                  </label>
                  <Button onClick={handleAddNote} disabled={isSubmitting || !note.trim()}>
                    {isSubmitting ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {notes.length === 0 && <p>No notes yet.</p>}
                {notes.map((n) => (
                  <Card key={n.id} className={cn(n.is_private && "bg-blue-50 border-blue-200")}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{n.content}</p>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(n.id)} disabled={isSubmitting}>
                          Delete
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        By: {n.created_by ? `User ID ${n.created_by.substring(0,8)}...` : 'Unknown'} on {formatDate(n.created_at)}
                        {n.is_private && <Badge variant="outline" className="ml-2 border-blue-500 text-blue-700">Private</Badge>}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Project Files</CardTitle>
              <CardDescription>Manage files uploaded by the designer and the client.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <Tabs value={filesSubTab} onValueChange={(value) => setFilesSubTab(value as 'designer' | 'client')} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="designer">Designer Uploads ({getFileTypeCounts().all > 0 && allProjectFiles.filter(f=>f.uploaded_by === 'designer').length})</TabsTrigger>
                    <TabsTrigger value="client">Client Uploads ({getFileTypeCounts().all > 0 && allProjectFiles.filter(f=>f.uploaded_by === 'client').length})</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button onClick={handleFileUpload} disabled={isSubmitting}>
                  <PaperClipIcon className="h-4 w-4 mr-2" /> Upload Files
                </Button>
              </div>

              {/* File Filters and View Options */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="Filter by type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types ({getFileTypeCounts().all})</SelectItem>
                    {Object.entries(getFileTypeCounts()).map(([type, count]) =>
                      type !== 'all' && count > 0 && (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'date' | 'size')}>
                  <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Sort by Date</SelectItem>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="size">Sort by Size</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                  <SelectTrigger><SelectValue placeholder="Order" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-4 text-right">
                <Button variant="outline" onClick={() => setFileViewMode(fileViewMode === 'list' ? 'gallery' : 'list')}>
                  {fileViewMode === 'list' ? 'Switch to Gallery View' : 'Switch to List View'}
                </Button>
              </div>

              {/* File Display Area */}
              {filteredAndSortedFiles().length === 0 ? (
                <p>No files found for the current filter.</p>
              ) : fileViewMode === 'list' ? (
                <div className="space-y-2">
                  {filteredAndSortedFiles().map((file) => {
                    console.log(`[FilesTab] Rendering List Item: ${file.name}, Uploaded By: ${file.uploaded_by}`);
                    return (
                      <Card key={file.id || file.url} className="flex items-center p-3">
                        <div className="mr-3 shrink-0">{getFileIcon(file)}</div>
                        <div className="flex-grow">
                          <p className="font-medium truncate" title={file.name}>{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size || 0)} - Uploaded: {formatDate(file.upload_date)}
                            {file.uploaded_by && ` by ${file.uploaded_by.charAt(0).toUpperCase() + file.uploaded_by.slice(1)}`}
                          </p>
                        </div>
                        <div className="ml-2 space-x-1 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => handleFileDownload(file.url, file.name)} disabled={isSubmitting}>
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleFileDelete(file.url, file.name)} disabled={isSubmitting}>
                            Delete
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : ( // Gallery View
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredAndSortedFiles().map((file) => {
                    console.log(`[FilesTab] Rendering Gallery Item: ${file.name}, Uploaded By: ${file.uploaded_by}`);
                    return (
                      <Card key={file.id || file.url} className="group relative aspect-square flex flex-col items-center justify-center overflow-hidden">
                        {isViewableImage(file) && file.url ? (
                          <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="p-2 text-center">
                            {getFileIcon(file)}
                            <p className="mt-1 text-xs truncate" title={file.name}>{file.name}</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 p-2">
                          <p className="text-white text-xs text-center truncate w-full mb-1" title={file.name}>{file.name}</p>
                          <div className="flex space-x-1">
                            <Button variant="outline" size="icon" className="bg-white/80 hover:bg-white" onClick={() => handleFileDownload(file.url, file.name)} disabled={isSubmitting}>
                              <DownloadIcon className="h-4 w-4 text-gray-700" />
                            </Button>
                            <Button variant="destructive" size="icon" className="bg-red-500/80 hover:bg-red-500" onClick={() => handleFileDelete(file.url, file.name)} disabled={isSubmitting}>
                              <span className="text-white">X</span>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revisions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Revisions</CardTitle>
                <CardDescription>Track design iterations and feedback.</CardDescription>
              </div>
              <Button onClick={() => { setShowRevisionForm(!showRevisionForm); setIsEditingRevision(false); setCurrentRevisionId(null); setNewRevision({title: '', description: '', notes: '', selectedFiles: [], links: [{url:'', title:''}], status: 'pending'}); }}>
                {showRevisionForm && !isEditingRevision ? 'Cancel' : 'Add New Revision'}
              </Button>
            </CardHeader>
            <CardContent>
              {showRevisionForm && (
                <Card className="mb-6 p-4">
                  <h3 className="text-lg font-semibold mb-3">{isEditingRevision ? 'Edit Revision' : 'Create New Revision'}</h3>
                  <div className="space-y-3">
                    <input type="text" placeholder="Revision Title" value={newRevision.title} onChange={e => setNewRevision({...newRevision, title: e.target.value})} className="w-full p-2 border rounded" />
                    <Textarea placeholder="Description" value={newRevision.description} onChange={e => setNewRevision({...newRevision, description: e.target.value})} className="w-full p-2 border rounded" />
                    {/* We might add more fields here like file selection, links etc. later */}
                    <Select value={newRevision.status} onValueChange={status => setNewRevision({...newRevision, status: status as RevisionStatus})}>
                        <SelectTrigger><SelectValue placeholder="Set Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="current">Current</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAddRevision} disabled={isSubmitting || !newRevision.title}>
                      {isSubmitting ? (isEditingRevision ? 'Updating...' : 'Saving...') : (isEditingRevision ? 'Update Revision' : 'Save Revision')}
                    </Button>
                  </div>
                </Card>
              )}

              <div className="space-y-4">
                {revisions.length === 0 && !showRevisionForm && <p>No revisions yet.</p>}
                {revisions.map(rev => (
                  <Card key={rev.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{rev.title} (v{rev.version})</CardTitle>
                        <Badge className={cn(getRevisionStatusColor(rev.status))}>{formatRevisionStatus(rev.status)}</Badge>
                      </div>
                      <CardDescription>Created: {formatDate(rev.created_at)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {rev.description && <p className="mb-2">{rev.description}</p>}
                      {/* Display associated files and links here if available */}
                      <div className="mt-2 space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditRevision(rev)} disabled={isSubmitting}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteRevision(rev.id)} disabled={isSubmitting}>Delete</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {isWebDesign && (
          <TabsContent value="bir">
            <Card>
              <CardHeader>
                <CardTitle>Business Information Request</CardTitle>
                <CardDescription>
                  Review the information and files submitted by the client.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  console.log('[DesignerPage][BIR Tab] Attempting to render content. isLoadingBir:', isLoadingBir, 'birError:', birError);
                  if (isLoadingBir) {
                    return <p>Loading Business Information...</p>;
                  }
                  if (birError) {
                    return <p className="text-destructive">Error loading Business Information: {birError.message}</p>;
                  }
                  // Only render BusinessInfoGate if not loading and no error
                  return (
                    <BusinessInfoGate
                      projectId={id} 
                      projectType={type} 
                    />
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 