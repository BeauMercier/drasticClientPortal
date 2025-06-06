import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminProject } from "../types"; // Assuming types.ts is in the parent directory
import { format } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area"; // Uncommented
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

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

export default function AdminProjectDetailsModal({ open, onClose, project, onBirApproved }: Props) {
  const { mutate: approveBirMutate, isPending: isApprovingBir } = useMutation<unknown, Error, void, unknown>({
    mutationFn: async () => {
      if (!project?.birId) {
        throw new Error('BIR ID is missing.');
      }
      const response = await fetch('/api/bir', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: project.birId, // birUpdateSchema expects 'id' for the BIR's ID
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

  if (!project) return null;

  const handleApproveBir = () => {
    if (project && project.birId && project.birStatus === 'submitted') {
      approveBirMutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project.title} (Details)</DialogTitle>
          <DialogDescription>
            Project Type: {project.type.replace('_', ' ')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
          <div className="space-y-4 p-1">
            <div>
              <h4 className="font-semibold mb-1">Client Information</h4>
              <p><strong>Name:</strong> {project.client_name || 'N/A'}</p>
              <p><strong>Email:</strong> {project.client_email || 'N/A'}</p>
              <p><strong>Company:</strong> {project.client_company || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Project Details</h4>
              <p><strong>Status:</strong> <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>{project.status}</Badge></p>
              <p><strong>Description:</strong> {project.description || 'No description provided.'}</p>
              <p><strong>Due Date:</strong> {safeFormatDate(project.due_date)}</p>
              <p><strong>Created At:</strong> {safeFormatDate(project.created_at)}</p>
              <p><strong>Last Updated:</strong> {safeFormatDate(project.updated_at)}</p>
            </div>

            {project.designer_name && (
              <div>
                <h4 className="font-semibold mb-1">Assigned Designer</h4>
                <p><strong>Name:</strong> {project.designer_name}</p>
                {project.designer_email && <p><strong>Email:</strong> {project.designer_email}</p>}
              </div>
            )}

            {project.type === 'web_design' && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold mb-2">Business Information Request (BIR)</h4>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <Badge variant={project.birStatus === 'approved' ? 'default' : project.birStatus === 'submitted' ? 'outline' : 'secondary'}>
                    {project.birStatus ?? 'Not submitted'}
                  </Badge>
                </p>
                {project.birId && <p><span className="font-medium">BIR ID:</span> {project.birId}</p>}

                {project.birStatus === 'submitted' && project.birId && (
                  <Button
                    size="sm"
                    variant="default" // Changed from primary to default, check your variants
                    disabled={isApprovingBir}
                    onClick={handleApproveBir}
                    className="mt-2"
                  >
                    {isApprovingBir ? 'Approving…' : 'Approve BIR'}
                  </Button>
                )}
              </div>
            )}

          </div>
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