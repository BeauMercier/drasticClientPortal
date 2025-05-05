'use client';

import { useState, useEffect } from 'react';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Close as DialogPrimitiveClose } from "@radix-ui/react-dialog";
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
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, PlusCircle, Search, X, Edit, Trash2, MoreHorizontal, UserCog, Download, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface User {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  company?: string | null;
  role: string;
  phone?: string | null;
  mobile?: string | null;
  preferred_contact?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  position?: string | null;
  business_name?: string | null;
  business_website?: string | null;
  website_dashboard_url?: string | null;
  created_at: string;
  updated_at?: string | null;
  last_sign_in_at?: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<string>('all');
  const [sortBy, setSortBy] = useState<{ field: keyof User | string; direction: 'asc' | 'desc' }>({
    field: 'created_at',
    direction: 'desc',
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

  // User Detail View state
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    email: '',
    full_name: '',
    company: '',
    role: 'client',
    phone: '',
    mobile: '',
    preferred_contact: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    position: '',
    business_name: '',
    business_website: '',
    website_dashboard_url: '',
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // --- Password Reset State ---
  const [isPasswordResetting, setIsPasswordResetting] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState<string | null>(null);

  // Delete user states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [searchTerm, activeRole, users, sortBy]);

  const filterAndSortUsers = () => {
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
    setIsLoading(true);
    setError(null);
    try {
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
      if (!newUser.email || !newUser.role) {
        setFormError('Email and role are required');
        setIsSubmitting(false);
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

  const openDetailView = (user: User) => {
    setSelectedUser(user);
    setEditUserForm({
      email: user.email || '',
      full_name: user.full_name || '',
      company: user.company || '',
      role: user.role || 'client',
      phone: user.phone || '',
      mobile: user.mobile || '',
      preferred_contact: user.preferred_contact || 'email',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      zip: user.zip || '',
      position: user.position || '',
      business_name: user.business_name || '',
      business_website: user.business_website || '',
      website_dashboard_url: user.website_dashboard_url || '',
    });
    setEditFormError(null);
    setPasswordResetError(null);
    setPasswordResetSuccess(null);
    setIsDetailViewOpen(true);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setEditFormError(null);
    setIsEditSubmitting(true);

    try {
      if (!editUserForm.role || !editUserForm.email) {
        setEditFormError('Email and Role are required');
        setIsEditSubmitting(false);
        return;
      }

      const updatePayload = { ...editUserForm };

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update user ${selectedUser.email}`);
      }

      fetchUsers();
      setIsDetailViewOpen(false);

    } catch (err) {
      console.error('Error updating user:', err);
      setEditFormError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete user ${userToDelete.email}`);
      }

      setUsers(users.filter(u => u.id !== userToDelete.id));
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);

      if (selectedUser?.id === userToDelete?.id) {
        setIsDetailViewOpen(false);
        setSelectedUser(null);
      }

    } catch (err) {
      console.error('Error deleting user:', err);
      setDeleteError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSort = (field: keyof User | string) => {
    const direction = (sortBy.field === field && sortBy.direction === 'asc') ? 'desc' : 'asc';
    setSortBy({ field, direction });
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPpp');
    } catch {
      return 'Invalid Date';
    }
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
    if (!Array.isArray(users)) {
      console.error('Users is not an array:', users);
      return 0;
    }
    return users.filter(user => role === 'all' || user.role === role).length;
  };

  // --- Handle Password Reset --- 
  const handlePasswordReset = async () => {
    if (!selectedUser) return;

    setIsPasswordResetting(true);
    setPasswordResetError(null);
    setPasswordResetSuccess(null);

    try {
        // Assumes an API endpoint exists that takes the email and triggers Supabase password reset email
        const response = await fetch('/api/auth/request-password-reset', { // Or your specific endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: selectedUser.email }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to send password reset email');
        }

        setPasswordResetSuccess('Password reset email sent successfully!');
        // Optionally clear success message after a delay
        setTimeout(() => setPasswordResetSuccess(null), 5000);

    } catch (err) {
        console.error('Error sending password reset:', err);
        setPasswordResetError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
        setIsPasswordResetting(false);
    }
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
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle>User Management</CardTitle>
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New User
            </Button>
          </div>
          <div className="mt-4 flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, email, company..."
                className="pl-8 w-full md:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Tabs value={activeRole} onValueChange={setActiveRole} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All Roles</TabsTrigger>
                <TabsTrigger value="admin">Admins</TabsTrigger>
                <TabsTrigger value="designer">Designers</TabsTrigger>
                <TabsTrigger value="client">Clients</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-10">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Avatar</TableHead>
                  <TableHead onClick={() => handleSort('full_name')} className="cursor-pointer">
                    Name {sortBy.field === 'full_name' && (sortBy.direction === 'asc' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('email')} className="cursor-pointer">
                    Email {sortBy.field === 'email' && (sortBy.direction === 'asc' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('company')} className="cursor-pointer">
                    Company {sortBy.field === 'company' && (sortBy.direction === 'asc' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('role')} className="cursor-pointer">
                    Role {sortBy.field === 'role' && (sortBy.direction === 'asc' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('created_at')} className="cursor-pointer">
                    Joined {sortBy.field === 'created_at' && (sortBy.direction === 'asc' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('last_sign_in_at')} className="cursor-pointer">
                    Last Login {sortBy.field === 'last_sign_in_at' && (sortBy.direction === 'asc' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
                          <AvatarFallback>
                            {(user.full_name ? user.full_name.slice(0, 2) : user.email.slice(0, 2)).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.company || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          user.role === 'admin' ? 'destructive' :
                          user.role === 'designer' ? 'secondary' :
                          'outline'
                        }>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openDetailView(user)}>
                              <Eye className="mr-2 h-4 w-4" /> View/Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              <UserCog className="mr-2 h-4 w-4" /> Manage Permissions (TBD)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-700 focus:bg-red-50"
                              onClick={() => openDeleteDialog(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No users found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Manually create a new user account. They will need to use password reset if you don't provide a password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-email" className="text-right">Email</Label>
              <Input id="new-email" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right">Password</Label>
              <Input id="new-password" type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="col-span-3" placeholder="(Optional)"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-fullname" className="text-right">Full Name</Label>
              <Input id="new-fullname" value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-company" className="text-right">Company</Label>
              <Input id="new-company" value={newUser.company} onChange={(e) => setNewUser({...newUser, company: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-role" className="text-right">Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && <p className="col-span-4 text-sm text-red-600 text-center">{formError}</p>}
            <DialogFooter>
              <DialogPrimitiveClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogPrimitiveClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] max-h-[90vh] flex flex-col">
          {selectedUser && (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.avatar_url || undefined} alt={selectedUser.full_name || selectedUser.email} />
                    <AvatarFallback>
                      {(selectedUser.full_name ? selectedUser.full_name.slice(0, 2) : selectedUser.email.slice(0, 2)).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  Manage User: {selectedUser.full_name || selectedUser.email}
                </DialogTitle>
                <DialogDescription>
                  View and edit user details, manage projects, and more.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveChanges} className="space-y-6 py-4 pr-6 pl-6 -ml-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input id="edit-email" value={editUserForm.email} onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})} required disabled className="bg-muted/50" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Role</Label>
                    <Select value={editUserForm.role} onValueChange={(value) => setEditUserForm({...editUserForm, role: value})}>
                      <SelectTrigger id="edit-role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="designer">Designer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-fullname">Full Name</Label>
                    <Input id="edit-fullname" value={editUserForm.full_name} onChange={(e) => setEditUserForm({...editUserForm, full_name: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-company">Company</Label>
                    <Input id="edit-company" value={editUserForm.company} onChange={(e) => setEditUserForm({...editUserForm, company: e.target.value})} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-position">Position / Title</Label>
                    <Input id="edit-position" value={editUserForm.position} onChange={(e) => setEditUserForm({...editUserForm, position: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input id="edit-phone" type="tel" value={editUserForm.phone} onChange={(e) => setEditUserForm({...editUserForm, phone: e.target.value})} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-mobile">Mobile</Label>
                    <Input id="edit-mobile" type="tel" value={editUserForm.mobile} onChange={(e) => setEditUserForm({...editUserForm, mobile: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-preferred_contact">Preferred Contact</Label>
                    <Select value={editUserForm.preferred_contact} onValueChange={(value) => setEditUserForm({...editUserForm, preferred_contact: value})}>
                      <SelectTrigger id="edit-preferred_contact">
                        <SelectValue placeholder="Select preferred contact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <hr className="my-6"/>

                <h4 className="text-lg font-semibold mb-3">Business Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-business_name">Business Name</Label>
                    <Input id="edit-business_name" value={editUserForm.business_name} onChange={(e) => setEditUserForm({...editUserForm, business_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-business_website">Business Website</Label>
                    <Input id="edit-business_website" type="url" value={editUserForm.business_website} onChange={(e) => setEditUserForm({...editUserForm, business_website: e.target.value})} placeholder="https://example.com"/>
                  </div>
                   <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-website-dashboard">Website Dashboard URL</Label>
                    <Input id="edit-website-dashboard" type="url" value={editUserForm.website_dashboard_url} onChange={(e) => setEditUserForm({...editUserForm, website_dashboard_url: e.target.value})} placeholder="https://dashboard.example.com"/>
                  </div>
                </div>

                <hr className="my-6"/>

                <h4 className="text-lg font-semibold mb-3">Address</h4>
                <div className="space-y-2 mb-4">
                  <Label htmlFor="edit-address">Street Address</Label>
                  <Input id="edit-address" value={editUserForm.address} onChange={(e) => setEditUserForm({...editUserForm, address: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-city">City</Label>
                    <Input id="edit-city" value={editUserForm.city} onChange={(e) => setEditUserForm({...editUserForm, city: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-state">State / Province</Label>
                    <Input id="edit-state" value={editUserForm.state} onChange={(e) => setEditUserForm({...editUserForm, state: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-zip">ZIP / Postal Code</Label>
                    <Input id="edit-zip" value={editUserForm.zip} onChange={(e) => setEditUserForm({...editUserForm, zip: e.target.value})} />
                  </div>
                </div>

                <hr className="my-6"/>
                
                <h4 className="text-lg font-semibold mb-3">Password Management</h4>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Send a password reset link to the user's email.</p>
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={handlePasswordReset}
                    disabled={isPasswordResetting}
                  >
                    {isPasswordResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Send Reset Link
                  </Button>
                </div>
                {passwordResetError && <p className="text-sm text-red-600 mt-2">Error: {passwordResetError}</p>}
                {passwordResetSuccess && <p className="text-sm text-green-600 mt-2">{passwordResetSuccess}</p>}

                 {editFormError && <p className="col-span-full text-sm text-red-600 text-center mt-4">{editFormError}</p>}

                 <div className="flex justify-end pt-4 mt-4 border-t">
                    <Button type="submit" disabled={isEditSubmitting}>
                      {isEditSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save Changes
                    </Button>
                 </div>
               </form>
            </>
          )}
          {!selectedUser && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user{' '}
              <strong>{userToDelete?.full_name || userToDelete?.email}</strong>?
              This action cannot be undone. Associated data might be affected.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-red-600 text-center py-2">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 