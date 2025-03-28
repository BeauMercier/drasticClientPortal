import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { isDesigner } from '@/lib/utils';
import logger from '@/lib/logger';

// Create a module-specific logger
const log = logger.forModule('DesignerAssignment');

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  app_metadata?: {
    role?: string;
  } | string;
}

interface DesignerAssignmentProps {
  projectId: string;
  projectType: string;
  projectName?: string;
}

export function DesignerAssignment({ projectId, projectType, projectName }: DesignerAssignmentProps) {
  const [designers, setDesigners] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [currentDesignerId, setCurrentDesignerId] = useState<string | null>(null);
  const [currentDesigner, setCurrentDesigner] = useState<UserProfile | null>(null);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(true);
  const [isLoadingDesigners, setIsLoadingDesigners] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [designersError, setDesignersError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch current assignment
  useEffect(() => {
    async function fetchCurrentAssignment() {
      try {
        setIsLoadingAssignment(true);
        setAssignmentError(null);
        
        // Try first endpoint format
        let assignmentResponse = await fetch(
          `/api/admin/projects/${projectType}/${projectId}/assignment`,
          { credentials: 'include' }
        );
        
        // If that fails, try the alternate format
        if (!assignmentResponse.ok) {
          assignmentResponse = await fetch(
            `/api/admin/projects/assignments?projectId=${projectId}&projectType=${projectType}`,
            { credentials: 'include' }
          );
        }

        if (!assignmentResponse.ok) {
          // If both fail, handle the error but don't throw - we can still show the form
          console.error('Failed to fetch current assignment');
          setAssignmentError('Failed to fetch current assignment. You can still assign a designer.');
          return;
        }

        const data = await assignmentResponse.json();
        
        // Check different possible response structures
        if (data.designerId) {
          setCurrentDesignerId(data.designerId);
        } else if (data.assignment && data.assignment.designerId) {
          setCurrentDesignerId(data.assignment.designerId);
        } else if (Array.isArray(data) && data.length > 0 && data[0].designerId) {
          setCurrentDesignerId(data[0].designerId);
        } else {
          // No assignment found is a valid state, not an error
          setCurrentDesignerId(null);
        }
      } catch (error) {
        console.error('Error fetching assignment:', error);
        setAssignmentError('Failed to fetch current assignment. You can still assign a designer.');
      } finally {
        setIsLoadingAssignment(false);
      }
    }

    fetchCurrentAssignment();
  }, [projectId, projectType]);

  // Fetch designers
  useEffect(() => {
    async function fetchDesigners() {
      try {
        setIsLoadingDesigners(true);
        setDesignersError(null);
        
        // Fetch from the users endpoint
        const designersResponse = await fetch('/api/admin/users', {
          credentials: 'include'
        });

        if (!designersResponse.ok) {
          log.error('Failed to fetch designers', {
            data: { status: designersResponse.status, statusText: designersResponse.statusText }
          });
          throw new Error(`Failed to fetch designers: ${designersResponse.status}`);
        }

        const designersData = await designersResponse.json() as UserProfile[];
        
        // Store all users
        setAllUsers(designersData);
        
        log.debug('API Response - All users', { data: { count: designersData.length } });
        
        // Filter users to get only designers using our utility function
        const filteredDesigners = designersData.filter(user => isDesigner(user));
        
        log.debug('Filtered designers using utility', { data: { count: filteredDesigners.length } });
        
        // If no designers found with those roles, set a warning but don't show all users yet
        if (filteredDesigners.length === 0) {
          log.warn('No designers found. User can choose to show all users.');
          setDesigners([]);
          setDesignersError('No users with designer role found. You can choose to show all users instead.');
        } else {
          setDesigners(filteredDesigners);
        }
      } catch (error) {
        log.error('Error fetching designers', { 
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
        setDesignersError('Failed to fetch designers. Please try again later.');
      } finally {
        setIsLoadingDesigners(false);
      }
    }

    fetchDesigners();
  }, []);

  // Effect to update currentDesigner when currentDesignerId changes
  useEffect(() => {
    if (!currentDesignerId) {
      setCurrentDesigner(null);
      return;
    }

    log.debug(`Attempting to find designer with ID: ${currentDesignerId}`);
    
    // Debug current arrays
    log.debug('Current designers and users arrays', { 
      data: { designers: designers.length, allUsers: allUsers.length }
    });

    // Look for designer in existing arrays first
    const designerFromArray = [...designers, ...allUsers].find(d => d.id === currentDesignerId);
    
    if (designerFromArray) {
      log.debug('Found designer in local arrays', {
        data: { id: designerFromArray.id, email: designerFromArray.email }
      });
      setCurrentDesigner(designerFromArray);
      return;
    }

    // If not found, fetch from API - try multiple endpoint formats
    log.info(`Designer not found in arrays, fetching from API for ID ${currentDesignerId}`);
    
    // First try the users endpoint
    fetch(`/api/admin/users`, { credentials: 'include' })
      .then(response => {
        if (!response.ok) {
          log.error('Failed to fetch users list', { data: { status: response.status } });
          // Try the specific user endpoint as fallback
          return fetch(`/api/admin/users/${currentDesignerId}`, { credentials: 'include' });
        }
        return response.json().then(data => {
          // Success with users list, find our user
          log.debug('Fetched all users, looking for designer', { data: { count: Array.isArray(data) ? data.length : 0 } });
          const user = Array.isArray(data) ? data.find(u => u.id === currentDesignerId) : null;
          if (user) {
            log.debug('Found designer in users list', { data: { id: user.id, email: user.email } });
            return user;
          }
          throw new Error('User not found in users list');
        });
      })
      .then(data => {
        if (data.ok === false) {
          // This is from the second fetch
          log.error('Failed to fetch specific user', { data: { status: data.status } });
          throw new Error('Failed to fetch user details');
        }
        
        if (!data.id) {
          // This may be a response object, not data
          return data.json();
        }
        
        return data; // Already JSON
      })
      .then(data => {
        log.debug('Successfully fetched user data', { data: { id: data.id, email: data.email } });
        
        // Save to current designer
        setCurrentDesigner(data);
        
        // Also add to our arrays for future reference
        setAllUsers(prev => {
          // Don't add duplicates
          if (prev.some(u => u.id === data.id)) return prev;
          return [...prev, data];
        });
        
        if (isDesigner(data)) {
          setDesigners(prev => {
            // Don't add duplicates
            if (prev.some(u => u.id === data.id)) return prev;
            return [...prev, data];
          });
        }
      })
      .catch(error => {
        log.error('Error fetching designer details', { 
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
        // Add fallback solution - create a minimal designer object so something displays
        setCurrentDesigner({
          id: currentDesignerId,
          email: 'unknown@email.com',
          role: 'designer'
        } as UserProfile);
        
        toast({
          title: 'Warning',
          description: 'Could not load complete designer information, using partial data',
          variant: 'default',
        });
      });
  }, [currentDesignerId, designers, allUsers, toast]);

  const handleAssign = async (designerId: string) => {
    if (!designerId) return;
    
    try {
      setIsSaving(true);
      
      // Find the designer in our arrays before making the API call
      const selectedDesigner = [...designers, ...allUsers].find(d => d.id === designerId);
      
      if (selectedDesigner) {
        // Pre-set the current designer for immediate feedback
        setCurrentDesigner(selectedDesigner);
      }

      const response = await fetch(`/api/admin/projects/${projectType}/${projectId}/assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          designerId,
          // Include designer info in the request in case backend needs it
          designerInfo: selectedDesigner 
        }),
        credentials: 'include',
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to assign designer');
      }

      // Set even without finding designer - the effect will handle fetching
      setCurrentDesignerId(designerId);
      
      toast({
        title: 'Success',
        description: 'Designer has been assigned to the project',
      });
    } catch (error) {
      // Reset current designer if assignment failed
      setCurrentDesigner(null);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign designer',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!currentDesignerId) return;
    
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/admin/projects/${projectType}/${projectId}/assignment`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to remove designer assignment');
      }

      setCurrentDesignerId(null);
      setCurrentDesigner(null);
      toast({
        title: 'Success',
        description: 'Designer has been removed from the project',
      });
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove designer assignment',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Updated to use currentDesigner state
  const getDesignerName = () => {
    if (!currentDesigner) {
      return currentDesignerId ? 'Loading designer...' : 'No designer assigned';
    }
    
    return currentDesigner.full_name || currentDesigner.email || 'Unknown Designer';
  };

  const isLoading = isLoadingAssignment || isLoadingDesigners;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Designer Assignment</CardTitle>
        <CardDescription>
          {projectName ? `Assign a designer to "${projectName}"` : 'Assign a designer to this project'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div 
              className="animate-spin rounded-full border-2 border-current border-t-transparent h-8 w-8" 
              role="status" 
              aria-label="Loading"
            >
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Show prominent button to toggle all users */}
            <div className="mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-dashed"
                onClick={() => setShowAllUsers(!showAllUsers)}
              >
                {showAllUsers ? 'Show Only Designers' : 'Show All Users (Including Non-Designers)'}
              </Button>
            </div>
            
            {/* Debugging info for development */}
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700 text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>Total Users: {allUsers.length}</p>
              <p>Detected Designers: {designers.length}</p>
              <p>Current Mode: {showAllUsers ? 'Showing All Users' : 'Showing Only Designers'}</p>
            </div>
            
            {(assignmentError || designersError) && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
                {assignmentError && <p>{assignmentError}</p>}
                {designersError && (
                  <div>
                    <p>{designersError}</p>
                    {designers.length === 0 && !showAllUsers && (
                      <button 
                        className="mt-2 text-sm text-blue-700 underline"
                        onClick={() => setShowAllUsers(true)}
                      >
                        Show all users as options
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {showAllUsers && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-blue-800">
                <p className="text-sm">
                  <strong>Showing all users</strong> - Not just designers. 
                  <button 
                    className="ml-2 text-blue-700 underline"
                    onClick={() => setShowAllUsers(false)}
                  >
                    Show only designers
                  </button>
                </p>
              </div>
            )}
            
            {currentDesignerId ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium mb-1">Currently Assigned:</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">
                      {getDesignerName()}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRemove}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Removing...' : 'Remove'}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Reassign to another designer:</p>
                  <div className="flex space-x-2">
                    <Select onValueChange={handleAssign} disabled={isSaving}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a designer" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-md max-h-60 overflow-y-auto">
                        {designers.length === 0 && !showAllUsers ? (
                          <div className="p-2 text-center text-muted-foreground">No designers available</div>
                        ) : (
                          (showAllUsers ? allUsers : designers).map(designer => (
                            <SelectItem 
                              key={designer.id} 
                              value={designer.id} 
                              className={designer.id === currentDesignerId ? "opacity-50 pointer-events-none" : ""}
                            >
                              <div className="flex items-center">
                                <span className="truncate max-w-[180px]">
                                  {designer.full_name || designer.email || 'Unknown'}
                                </span>
                                {showAllUsers && (
                                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-800">
                                    {designer.role || 'No Role'}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm">No designer is currently assigned to this project.</p>
                
                <div className="flex space-x-2">
                  <Select onValueChange={handleAssign} disabled={isSaving || (designers.length === 0 && !showAllUsers)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a designer" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-md max-h-60 overflow-y-auto">
                      {designers.length === 0 && !showAllUsers ? (
                        <div className="p-2 text-center text-muted-foreground">No designers available</div>
                      ) : (
                        (showAllUsers ? allUsers : designers).map(designer => (
                          <SelectItem 
                            key={designer.id} 
                            value={designer.id}
                          >
                            <div className="flex items-center">
                              <span className="truncate max-w-[180px]">
                                {designer.full_name || designer.email || 'Unknown'}
                              </span>
                              {showAllUsers && (
                                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-800">
                                  {designer.role || 'No Role'}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {designers.length === 0 && (
                  <p className="text-sm text-amber-600">
                    No designers available for assignment. <a href="/admin/designers/create" className="underline font-bold">Create a designer user</a> first.
                  </p>
                )}
              </div>
            )}
          </>
        )}
        
        <div className="text-sm text-gray-500 mt-6 pt-3 border-t flex justify-between">
          <a href="/admin/designers/workload" target="_blank" className="text-blue-600 hover:underline">
            View designer workloads →
          </a>
          <a href="/admin/designers/create" className="text-blue-600 hover:underline font-semibold">
            + Add New Designer
          </a>
        </div>
        
        <div className="text-xs text-gray-400 mt-3 pt-2 border-t">
          <p>Issues assigning designers? Try these tools:</p>
          <div className="flex gap-2 mt-1">
            <a href="/admin/debug/users" className="text-blue-500 hover:underline">Debug Users</a>
            <span>•</span>
            <a href="/admin/debug/create-designer" className="text-blue-500 hover:underline">Create Test Designer</a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 