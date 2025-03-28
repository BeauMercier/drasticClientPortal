'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, PlusCircle, Search, X, Edit, Trash2, MoreHorizontal, UserCog, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface User {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
  avatar_url?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<string>('all');
  const [sortBy, setSortBy] = useState<{ field: string; direction: 'asc' | 'desc' }>({ 
    field: 'created_at', 
    direction: 'desc' 
  });
  
  // Form state for new user
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    company: '',
    role: 'client'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit user states
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    full_name: '',
    company: '',
    role: ''
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Delete user states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Permissions management states
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [userForPermissions, setUserForPermissions] = useState<User | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, activeRole, users, sortBy]);

  const filterUsers = () => {
    let filtered = [...users];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.company && user.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by role
    if (activeRole !== 'all') {
      filtered = filtered.filter(user => user.role === activeRole);
    }
    
    // Sort the users
    filtered.sort((a, b) => {
      const fieldA = a[sortBy.field as keyof User] || '';
      const fieldB = b[sortBy.field as keyof User] || '';
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortBy.direction === 'asc' 
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }
      
      return 0;
    });
    
    setFilteredUsers(filtered);
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle both response formats (array or {users: array})
      const usersData = Array.isArray(data) ? data : data.users;
      
      if (!usersData || !Array.isArray(usersData)) {
        console.error('Invalid users data format:', data);
        throw new Error('Invalid response format: received non-array users data');
      }
      
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      // Set to empty arrays on error
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!newUser.email || !newUser.password || !newUser.role) {
        setFormError('Email, password, and role are required');
        return;
      }
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      
      // Reset form and close dialog
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        company: '',
        role: 'client'
      });
      setIsAddUserDialogOpen(false);
      
      // Refresh user list
      fetchUsers();
      
    } catch (err) {
      console.error('Error creating user:', err);
      setFormError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle opening the edit user dialog
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      full_name: user.full_name || '',
      company: user.company || '',
      role: user.role
    });
    setEditFormError(null);
    setIsEditUserDialogOpen(true);
  };

  // Handle saving the edited user details
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError(null);
    setIsEditSubmitting(true);

    try {
      if (!editingUser) return;
      
      // Validate required fields
      if (!editUserForm.role) {
        setEditFormError('Role is required');
        return;
      }

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: editUserForm.full_name,
          company: editUserForm.company,
          role: editUserForm.role
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      // Close dialog and refresh users
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
      fetchUsers();

    } catch (err) {
      console.error('Error updating user:', err);
      setEditFormError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Function to open delete dialog
  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteError(null); // Reset any previous error
    setIsDeleteDialogOpen(true);
  };

  // Confirm and process user deletion
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null); // Reset error at start
    
    try {
      // Check environment variables first
      console.log('Checking environment variables...');
      const envCheck = await fetch('/api/admin/check-env');
      const envData = await envCheck.json();
      
      if (!envData.hasServiceKey) {
        throw new Error('Missing server configuration: SUPABASE_SERVICE_ROLE_KEY is not set');
      }
      
      console.log(`Attempting to delete user ${userToDelete.id}...`);
      const response = await fetch(`/api/admin/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userToDelete.id
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Delete user API returned error:', data);
        throw new Error(data.error || 'Failed to delete user');
      }

      console.log('User deleted successfully');
      // Close dialog and refresh users
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();

    } catch (err) {
      console.error('Error deleting user:', err);
      // Set delete error message with detailed info
      setDeleteError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle opening permissions dialog
  const handleManagePermissions = (user: User) => {
    setUserForPermissions(user);
    // Default permissions would typically be fetched from an API
    setSelectedPermissions(['read:profile', 'write:profile']);
    setIsPermissionsDialogOpen(true);
  };

  // Save updated permissions
  const savePermissions = async () => {
    if (!userForPermissions) return;
    
    setIsUpdatingPermissions(true);
    try {
      const response = await fetch(`/api/admin/users/${userForPermissions.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: selectedPermissions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update permissions');
      }

      // Close dialog
      setIsPermissionsDialogOpen(false);
      setUserForPermissions(null);

    } catch (err) {
      console.error('Error updating permissions:', err);
      // Show error notification
    } finally {
      setIsUpdatingPermissions(false);
    }
  };

  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getUsersCountByRole = (role: string) => {
    // Make sure users is an array before filtering
    if (!Array.isArray(users)) {
      console.error('Users is not an array:', users);
      return 0;
    }
    return users.filter(user => role === 'all' || user.role === role).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-destructive/10 rounded-lg my-6">
        <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Users</h2>
        <p>{error}</p>
        <p className="mt-4">Please check your permissions or try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-0">
      <div className="flex justify-end mb-4">
        <div className="flex gap-4">
          <Button variant="outline" size="icon" className="bg-background">
            <Download className="h-4 w-4" />
          </Button>
          
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-none">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with the specified role.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddUser} className="grid gap-4 py-4">
                {formError && (
                  <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">
                    {formError}
                  </div>
                )}
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="full_name" className="text-right">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company" className="text-right">
                    Company
                  </Label>
                  <Input
                    id="company"
                    placeholder="Acme Inc."
                    value={newUser.company}
                    onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md">
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsAddUserDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* User stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden shadow-md">
          <CardHeader className="p-4 pb-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white">
            <CardTitle className="text-xl font-bold text-white">{getUsersCountByRole('all')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-sm font-medium">Total Users</p>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden shadow-md">
          <CardHeader className="p-4 pb-2 bg-gradient-to-r from-green-600 to-green-700 text-white">
            <CardTitle className="text-xl font-bold text-white">{getUsersCountByRole('client')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-sm font-medium">Clients</p>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden shadow-md">
          <CardHeader className="p-4 pb-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <CardTitle className="text-xl font-bold text-white">{getUsersCountByRole('designer')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-sm font-medium">Designers</p>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden shadow-md">
          <CardHeader className="p-4 pb-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="text-xl font-bold text-white">{getUsersCountByRole('admin')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-sm font-medium">Admins</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-md border-none">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Users</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-2.5"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              
              <Select value={sortBy.field} onValueChange={(val) => handleSort(val)}>
                <SelectTrigger className="w-full sm:w-44 bg-background">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md">
                  <SelectItem value="full_name">Sort by Name</SelectItem>
                  <SelectItem value="email">Sort by Email</SelectItem>
                  <SelectItem value="role">Sort by Role</SelectItem>
                  <SelectItem value="created_at">Sort by Date Created</SelectItem>
                  <SelectItem value="last_sign_in_at">Sort by Last Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Tabs value={activeRole} onValueChange={setActiveRole} className="w-full mt-6">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">All</TabsTrigger>
              <TabsTrigger value="client" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Clients</TabsTrigger>
              <TabsTrigger value="designer" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Designers</TabsTrigger>
              <TabsTrigger value="admin" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Admins</TabsTrigger>
              <TabsTrigger value="partner" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">Partners</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border overflow-hidden bg-background">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/80 hover:bg-muted">
                  <TableHead className="w-[250px]">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="hidden md:table-cell">Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border shadow-sm">
                            <AvatarImage src={user.avatar_url || ''} alt={user.full_name} />
                            <AvatarFallback className={`${
                              user.role === 'admin' 
                                ? 'bg-blue-600 text-white' 
                                : user.role === 'designer'
                                ? 'bg-purple-600 text-white'
                                : user.role === 'partner'
                                ? 'bg-amber-600 text-white'
                                : 'bg-green-600 text-white'
                            }`}>
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            {user.company && (
                              <div className="text-xs text-muted-foreground">{user.company}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`font-normal ${
                            user.role === 'admin' 
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200' 
                              : user.role === 'designer'
                              ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200'
                              : user.role === 'partner'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200'
                          }`}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {formatDate(user.last_sign_in_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border shadow-md">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManagePermissions(user)}>
                              <UserCog className="mr-2 h-4 w-4" />
                              Manage permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => openDeleteDialog(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        <div className="flex items-center justify-between py-4 px-6 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </Card>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveEdit} className="grid gap-4 py-4">
            {editFormError && (
              <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">
                {editFormError}
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-full-name" className="text-right">
                Full Name
              </Label>
              <Input
                id="edit-full-name"
                placeholder="John Doe"
                value={editUserForm.full_name}
                onChange={(e) => setEditUserForm({ ...editUserForm, full_name: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-company" className="text-right">
                Company
              </Label>
              <Input
                id="edit-company"
                placeholder="Acme Inc."
                value={editUserForm.company}
                onChange={(e) => setEditUserForm({ ...editUserForm, company: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Role
              </Label>
              <Select
                value={editUserForm.role}
                onValueChange={(value) => setEditUserForm({ ...editUserForm, role: value })}
              >
                <SelectTrigger id="edit-role" className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md">
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsEditUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isEditSubmitting}>
                {isEditSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deleteError && (
            <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm mt-2">
              {deleteError}
            </div>
          )}
          
          {userToDelete && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-9 w-9 border shadow-sm">
                  <AvatarImage src={userToDelete.avatar_url || ''} alt={userToDelete.full_name} />
                  <AvatarFallback className={`bg-${userToDelete.role === 'admin' ? 'blue' : userToDelete.role === 'designer' ? 'purple' : userToDelete.role === 'partner' ? 'amber' : 'green'}-600 text-white`}>
                    {getInitials(userToDelete.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{userToDelete.full_name || 'Unnamed User'}</p>
                  <p className="text-sm text-muted-foreground">{userToDelete.email}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Manage Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Control what actions this user can perform.
            </DialogDescription>
          </DialogHeader>
          
          {userForPermissions && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-9 w-9 border shadow-sm">
                  <AvatarImage src={userForPermissions.avatar_url || ''} alt={userForPermissions.full_name} />
                  <AvatarFallback className={`bg-${userForPermissions.role === 'admin' ? 'blue' : userForPermissions.role === 'designer' ? 'purple' : userForPermissions.role === 'partner' ? 'amber' : 'green'}-600 text-white`}>
                    {getInitials(userForPermissions.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{userForPermissions.full_name || 'Unnamed User'}</p>
                  <p className="text-sm text-muted-foreground">{userForPermissions.email}</p>
                </div>
              </div>
              
              <div className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="read-profile"
                      checked={selectedPermissions.includes('read:profile')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, 'read:profile']);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== 'read:profile'));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="read-profile" className="text-sm font-medium">Read Profile</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="write-profile"
                      checked={selectedPermissions.includes('write:profile')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, 'write:profile']);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== 'write:profile'));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="write-profile" className="text-sm font-medium">Write Profile</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="read-projects"
                      checked={selectedPermissions.includes('read:projects')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, 'read:projects']);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== 'read:projects'));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="read-projects" className="text-sm font-medium">Read Projects</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="write-projects"
                      checked={selectedPermissions.includes('write:projects')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, 'write:projects']);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== 'write:projects'));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="write-projects" className="text-sm font-medium">Write Projects</label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={savePermissions}
              disabled={isUpdatingPermissions}
            >
              {isUpdatingPermissions && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 