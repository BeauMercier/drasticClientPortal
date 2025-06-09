import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminProject } from "../types"; // Assuming types.ts is in the parent directory
import { format } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area"; // Uncommented
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  open: boolean;
  onClose: () => void;
  project: AdminProject | null;
  onBirApproved?: () => void; // Callback to refresh project list
}

// Helper function for safe date formatting (can be moved to a utils file)
const safeFormatDate = (dateInput: string | null | undefined, formatString: string = 'PPP p'): string => {
  if (!dateInput) {
    return 'N/A';
  }
  try {
    return format(new Date(dateInput), formatString);
  } catch (error) {
    return 'Invalid Date';
  }
};

// New component for displaying BIR answers
const BirDetails = ({ answers }: { answers: any }) => {
  if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
    return <p className="text-sm text-gray-500">No BIR answers submitted or answers are empty.</p>;
  }

  // A simple formatter for answer values
  const formatAnswer = (value: any) => {
    if (value === null || value === undefined || value === '') return <span className="text-gray-400 italic">Not provided</span>;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  return (
    <div className="space-y-2 mt-2">
      {Object.entries(answers).map(([key, value]) => (
        <div key={key} className="text-sm">
          <p className="font-medium capitalize">{key.replace(/_/g, ' ')}:</p>
          <p className="pl-2 text-gray-700">{formatAnswer(value)}</p>
        </div>
      ))}
    </div>
  );
};

export default function AdminProjectDetailsModal({ open, onClose, project, onBirApproved }: Props) {
  console.log('[AdminProjectDetailsModal] Initial project prop:', project);
  console.log('[AdminProjectDetailsModal] Initial project.bir:', project?.bir);

  const { 
    data: detailedProject, 
    isLoading: isLoadingDetails,
    error: detailsError 
  } = useQuery({
    queryKey: ['adminProjectDetails', project?.id, project?.type],
    queryFn: async () => {
      if (!project) return null;
      const response = await fetch(`/api/admin/projects/${project.type}/${project.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project details');
      }
      return response.json();
    },
    enabled: !!project && open, // Only run the query if there is a project and the modal is open
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const displayProject = detailedProject || project;

  const { mutate: approveBirMutate, isPending: isApprovingBir } = useMutation<unknown, Error, void, unknown>({
    mutationFn: async () => {
      if (!displayProject?.birId) {
        throw new Error('BIR ID is missing.');
      }
      const response = await fetch('/api/bir', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: displayProject.birId, // birUpdateSchema expects 'id' for the BIR's ID
          status: 'approved',
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to approve BIR (unparseable error).' }));
        throw new Error(errorData.message || `Failed to approve BIR: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('BIR approved successfully!');
      if (onBirApproved) {
        onBirApproved();
      }
      onClose(); // Close the modal
    },
    onError: (error: Error) => {
      toast.error(`BIR Approval Failed: ${error.message}`);
    },
  });

  console.log('[AdminProjectDetailsModal] After useQuery - detailedProject:', detailedProject);
  console.log('[AdminProjectDetailsModal] After useQuery - detailedProject.bir:', detailedProject?.bir);
  console.log('[AdminProjectDetailsModal] Final displayProject.bir:', displayProject.bir);

  if (!displayProject) return null;

  const handleApproveBir = () => {
    if (displayProject && displayProject.birId && displayProject.birStatus === 'submitted') {
      approveBirMutate();
    }
  };

  const renderContent = () => {
    if (isLoadingDetails) {
      return (
        <div className="space-y-4 p-1">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="pt-4 mt-4 border-t">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-full mt-2" />
          </div>
        </div>
      );
    }

    if (detailsError) {
      return <p className="text-red-500">Error: {detailsError.message}</p>;
    }

    console.log('BIR object in modal:', displayProject.bir);

    return (
      <div className="space-y-4 p-1">
        <div>
          <h4 className="font-semibold mb-1">Client Information</h4>
          <p><strong>Name:</strong> {displayProject.client_name || 'N/A'}</p>
          <p><strong>Email:</strong> {displayProject.client_email || 'N/A'}</p>
          <p><strong>Company:</strong> {displayProject.client_company || 'N/A'}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Project Details</h4>
          <p><strong>Status:</strong> <Badge variant={displayProject.status === 'completed' ? 'default' : 'secondary'}>{displayProject.status}</Badge></p>
          <p><strong>Description:</strong> {displayProject.description || 'No description provided.'}</p>
          <p><strong>Due Date:</strong> {safeFormatDate(displayProject.due_date)}</p>
          <p><strong>Created At:</strong> {safeFormatDate(displayProject.created_at)}</p>
          <p><strong>Last Updated:</strong> {safeFormatDate(displayProject.updated_at)}</p>
        </div>

        {displayProject.designer_name && (
          <div>
            <h4 className="font-semibold mb-1">Assigned Designer</h4>
            <p><strong>Name:</strong> {displayProject.designer_name}</p>
            {displayProject.designer_email && <p><strong>Email:</strong> {displayProject.designer_email}</p>}
          </div>
        )}

        {displayProject.type === 'web_design' && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">Business Information Request (BIR)</h4>
              <Badge variant={displayProject.birStatus === 'approved' ? 'default' : displayProject.birStatus === 'submitted' ? 'outline' : 'secondary'}>
                {displayProject.birStatus ?? 'Not submitted'}
              </Badge>
            </div>
            
            {displayProject.bir && <BirDetails answers={displayProject.bir.answers} />}
            
            {displayProject.birStatus === 'submitted' && displayProject.birId && (
              <Button
                size="sm"
                variant="default"
                disabled={isApprovingBir}
                onClick={handleApproveBir}
                className="mt-4"
              >
                {isApprovingBir ? 'Approving…' : 'Approve BIR'}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project?.title || 'Project Details'}</DialogTitle>
          <DialogDescription>
            Project Type: {project?.type.replace('_', ' ') || ''}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
          {renderContent()}
        </ScrollArea>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 