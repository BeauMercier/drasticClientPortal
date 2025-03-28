import { createClient, SupabaseClient } from '@supabase/supabase-js';
// TODO: Import types from a central location (e.g., 'src/lib/types') when import issues are resolved.
// import { UserRole, TicketStatus, ... } from './types'; 
// import { createServiceRoleClient } from './supabase/client'; // No longer needed if using single admin client

// --- Temporary Type Definitions (Keep for now) ---
// Define necessary types since the imports are problematic

// UserRole and TicketStatus Enums (assuming these exist)
export enum UserRole {
  ADMIN = 'admin',
  CLIENT = 'client',
  DESIGNER = 'designer',
  GUEST = 'guest', // Added for default case
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

// Project Types
interface ProjectBase {
  id: string;
  name: string; // Changed from title if applicable, check DB schema
  description?: string;
  status: string;
  client_id: string;
  designer_id?: string; // Added optional designer_id
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

interface WebDesignProject extends ProjectBase {
  type: 'web_design';
}

interface SocialGraphicsProject extends ProjectBase {
  type: 'social_graphics';
}

interface LogoDesignProject extends ProjectBase {
  type: 'logo_design';
}

// Project Parameter Types
interface CreateProjectParams {
  name: string; // Changed from title if applicable
  description?: string;
  status?: string; // Consider a specific status enum/type
  client_id: string;
  metadata?: Record<string, any>;
}

interface CreateWebDesignProjectParams extends CreateProjectParams {
  type: 'web_design';
}

interface UpdateWebDesignProjectParams {
  name?: string; // Changed from title if applicable
  description?: string;
  status?: string; // Consider a specific status enum/type
  metadata?: Record<string, any>;
  designer_id?: string | null; // Allow updating/removing designer
}

interface CreateSocialGraphicsProjectParams extends CreateProjectParams {
  type: 'social_graphics';
}

interface UpdateSocialGraphicsProjectParams {
  name?: string; // Changed from title if applicable
  description?: string;
  status?: string; // Consider a specific status enum/type
  metadata?: Record<string, any>;
  designer_id?: string | null; // Allow updating/removing designer
}

interface CreateLogoDesignProjectParams extends CreateProjectParams {
  type: 'logo_design';
}

interface UpdateLogoDesignProjectParams {
  name?: string; // Changed from title if applicable
  description?: string;
  status?: string; // Consider a specific status enum/type
  metadata?: Record<string, any>;
  designer_id?: string | null; // Allow updating/removing designer
}

// Support Ticket Types
interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus; // Use Enum
  created_at: string;
  updated_at?: string;
  client_id: string;
  assignee_id?: string; // Use assignee_id consistently
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_staff: boolean; // Indicates if message is from staff/admin/designer
}

interface CreateSupportTicketParams {
  title: string;
  description: string;
  client_id: string;
  status?: TicketStatus; // Allow setting initial status, default to OPEN
}

interface UpdateSupportTicketParams {
  title?: string;
  description?: string;
  status?: TicketStatus;
  assignee_id?: string | null; // Allow updating/removing assignee
}

interface CreateSupportMessageParams {
  ticket_id: string;
  sender_id: string;
  content: string;
  is_staff: boolean;
}

// Billing Types
type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

interface BillingInvoice {
  id: string;
  client_id: string;
  amount: number;
  status: InvoiceStatus;
  due_date: string;
  paid_at?: string;
  created_at: string;
  description?: string;
  items?: Array<{
    description: string;
    amount: number;
    quantity: number;
  }>;
}

interface CreateInvoiceParams {
  client_id: string;
  amount: number;
  due_date: string;
  description?: string;
  status?: InvoiceStatus; // Allow setting initial status, default to draft/pending
  items?: Array<{
    description: string;
    amount: number;
    quantity: number;
  }>;
}

interface UpdateInvoiceParams {
  status?: InvoiceStatus;
  amount?: number; // Allow amount updates?
  due_date?: string;
  paid_at?: string | null; // Use null for unsetting
  description?: string;
  items?: Array<{
    description: string;
    amount: number;
    quantity: number;
  }>;
}

// User Management Types
export interface UserProfile {
  id: string; // Corresponds to auth.users.id
  role: UserRole;
  full_name?: string;
  company?: string;
  updated_at?: string;
  // Add any other profile fields here
}

export interface UserData extends UserProfile {
  email: string;
  created_at: string; // From auth.users
  last_sign_in_at?: string; // From auth.users
}

export interface CreateUserParams {
  email: string;
  password: string;
  role: UserRole;
  full_name?: string;
  company?: string;
  // Add other profile fields if needed during creation
}

export interface UpdateUserParams {
  // User ID is passed separately to the function
  role?: UserRole;
  full_name?: string;
  company?: string;
  // Add other updatable profile fields
}

// Designer Task Types
type TaskStatus = 'todo' | 'in_progress' | 'completed';
type TaskPriority = 'high' | 'medium' | 'low';
type ProjectType = 'web_design' | 'logo_design' | 'social_graphics';

interface DesignerTask {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string;
    designer_id: string;
    project_id?: string;
    project_type?: ProjectType;
    created_at: string;
    updated_at?: string;
}

interface CreateDesignerTaskParams {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  designer_id: string;
  project_id?: string;
  project_type?: ProjectType;
}

interface UpdateDesignerTaskParams {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string;
    // designer_id?: string; // Reassigning tasks might need specific logic
    // project_id?: string; // Changing linked project?
    // project_type?: ProjectType;
}


// --- Supabase Admin Client Initialization ---

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('FATAL ERROR: Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  // In a real app, you might want to throw an error here or prevent the app from starting.
}

// Create a single Supabase client instance with the service role key
// This should be used for ALL admin operations in this file.
const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl || 'http://localhost:54321', // Provide a default for type safety, but rely on the check above
  supabaseServiceKey || 'dummy-key',     // Provide a default for type safety
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      // Detect session automatically based on environment - crucial for server-side
      detectSessionInUrl: false 
    }
  }
);

/**
 * Helper function to check if the admin client is configured correctly.
 * Call this early in server startup or in a health check endpoint.
 */
export const checkAdminClient = async (): Promise<{ success: boolean; error?: string; count?: number }> => {
  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: 'Missing Supabase environment variables.' };
  }
  try {
    // Attempt a simple query that requires admin/service privileges
    const { count, error } = await supabaseAdmin
        .from('profiles') // Assuming 'profiles' table exists
        .select('*', { count: 'exact', head: true });

    if (error) throw error;
    console.log('Supabase Admin Client connected successfully.');
    return { success: true, count: count ?? undefined };
  } catch (error: any) {
    console.error('Supabase Admin Client connection error:', error.message);
    return { success: false, error: error.message };
  }
};

// =========================================
//      User Management Functions
// =========================================
// These functions use the service role and should ONLY be called server-side.

/**
 * List all users combining Auth data and Profile data.
 */
export const listUsers = async (): Promise<UserData[]> => {
  try {
    // 1. Get users from Auth
    const { data: authUsersData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        // Add pagination if needed for large numbers of users
        // page: 1, perPage: 100 
    });

    if (authError) {
      throw new Error(`Error fetching users from auth: ${authError.message}`);
    }
    if (!authUsersData?.users) {
        return []; // No users found
    }

    const authUsers = authUsersData.users;
    const userIds = authUsers.map(user => user.id);

    if (userIds.length === 0) {
        return [];
    }

    // 2. Get corresponding profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select<string, UserProfile>('id, role, full_name, company, updated_at') // Select specific profile fields
      .in('id', userIds);

    if (profilesError) {
      // Log the error but attempt to continue with auth data only
      console.error(`Error fetching profiles: ${profilesError.message}`);
      // Depending on requirements, you might want to throw here instead
    }

    // 3. Merge Auth and Profile data
    const users = authUsers.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id);

      // Determine role: Profile first, then metadata, then default 'guest'
      const role = profile?.role ?? authUser.user_metadata?.role ?? UserRole.GUEST;
      // Determine full_name: Profile first, then metadata
      const full_name = profile?.full_name ?? authUser.user_metadata?.full_name ?? undefined;

      return {
        id: authUser.id,
        email: authUser.email || '', // Ensure email is not undefined
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        // --- Profile Data ---
        role: role as UserRole,
        full_name: full_name as string | undefined,
        company: profile?.company ?? undefined, // Get company only from profile
        updated_at: profile?.updated_at ?? undefined,
      };
    });

    return users;
  } catch (error) {
    console.error('Error in listUsers:', error);
    throw error; // Re-throw the error for the caller to handle
  }
};

/**
 * Create a new user in Auth and their corresponding profile.
 */
export const createUser = async (params: CreateUserParams): Promise<UserData> => {
  const { email, password, role, full_name, company } = params;

  try {
    // 1. Create user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email for admin-created users
      user_metadata: {
        // Store role and potentially full_name in metadata as fallback/initial value
        role: role,
        full_name: full_name 
      }
    });

    if (authError) {
      throw new Error(`Error creating user in auth: ${authError.message}`);
    }
    if (!authData?.user) {
        throw new Error('User creation response did not contain user data.');
    }
    
    const user = authData.user;

    // 2. Create the user's profile
    // Use upsert to handle potential race conditions or re-attempts
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id, // Link profile to the auth user ID
        role: role,
        full_name: full_name,
        company: company,
        updated_at: new Date().toISOString(),
      })
      .select<string, UserProfile>('id, role, full_name, company, updated_at')
      .single();

    if (profileError) {
      // Log the error. Consider if you need to delete the auth user if profile creation fails.
      console.error(`Error creating/updating profile for user ${user.id}: ${profileError.message}`);
      // Optionally, attempt to delete the auth user for cleanup:
      // await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw new Error(`Error creating user profile: ${profileError.message}`);
    }
     if (!profileData) {
        throw new Error('Profile creation did not return data.');
     }

    // 3. Return combined data
    return {
      id: user.id,
      email: user.email!, // Email should exist after successful creation
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      role: profileData.role,
      full_name: profileData.full_name,
      company: profileData.company,
      updated_at: profileData.updated_at
    };
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
};

/**
 * Update a user's Auth metadata and Profile data.
 */
export const updateUser = async (userId: string, params: UpdateUserParams): Promise<void> => {
  const { role, full_name, company } = params;

  try {
    // 1. Update Auth User Metadata (if role or full_name provided)
    // Only include fields in metadata if they are explicitly being updated.
    const metadataUpdate: Record<string, any> = {};
    if (role !== undefined) metadataUpdate.role = role;
    if (full_name !== undefined) metadataUpdate.full_name = full_name;

    if (Object.keys(metadataUpdate).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { user_metadata: metadataUpdate }
      );
      if (authError) {
        throw new Error(`Error updating user auth metadata: ${authError.message}`);
      }
    }

    // 2. Update Profile Table
    // Only include fields in the profile update if they are explicitly provided.
    const profileUpdate: Partial<UserProfile> & { updated_at: string } = { updated_at: new Date().toISOString() };
    if (role !== undefined) profileUpdate.role = role;
    if (full_name !== undefined) profileUpdate.full_name = full_name;
    if (company !== undefined) profileUpdate.company = company;
    // Add other profile fields from UpdateUserParams here

    // Only run the update if there's something other than updated_at to change
    if (Object.keys(profileUpdate).length > 1) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId);

      if (profileError) {
        throw new Error(`Error updating user profile: ${profileError.message}`);
      }
    }
  } catch (error) {
    console.error(`Error in updateUser for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Delete a user from Auth. Profile deletion should be handled via cascade or trigger.
 * Ensure ON DELETE CASCADE is set on the 'profiles.id' foreign key constraint
 * referencing 'auth.users.id'.
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      // Handle specific errors, e.g., user not found might not be a critical failure
      // if (error.message.includes('User not found')) {
      //   console.warn(`Attempted to delete non-existent user: ${userId}`);
      //   return;
      // }
      throw new Error(`Error deleting user ${userId}: ${error.message}`);
    }
    console.log(`Successfully deleted user: ${userId}`);
  } catch (error) {
    console.error(`Error in deleteUser for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get a single user's profile by ID.
 * Use `listUsers` if you need combined auth/profile data for multiple users.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select<string, UserProfile>('id, role, full_name, company, updated_at') // Select specific fields
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle to return null instead of error if not found

    if (error) {
      throw new Error(`Error fetching profile for user ${userId}: ${error.message}`);
    }
    return data;
  } catch (error) {
    console.error(`Error in getUserProfile for user ${userId}:`, error);
    throw error;
  }
};


// =========================================
//      Project Management Functions
// =========================================

// --- Web Design Projects ---
export const createWebDesignProject = async (projectData: CreateWebDesignProjectParams): Promise<WebDesignProject> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('web_design_projects')
      .insert({ ...projectData, type: 'web_design' }) // Ensure type is set
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating web design project:', error);
    throw error;
  }
};

export const getWebDesignProjects = async (clientId?: string): Promise<WebDesignProject[]> => {
  try {
    let query = supabaseAdmin.from('web_design_projects').select('*');
    if (clientId) {
      // Assuming the column name is 'client_id' based on types
      query = query.eq('client_id', clientId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching web design projects:', error);
    throw error;
  }
};

export const updateWebDesignProject = async (projectId: string, updates: UpdateWebDesignProjectParams): Promise<WebDesignProject> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('web_design_projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating web design project ${projectId}:`, error);
    throw error;
  }
};

export const deleteWebDesignProject = async (projectId: string): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('web_design_projects')
      .delete()
      .eq('id', projectId);
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting web design project ${projectId}:`, error);
    throw error;
  }
};

// --- Social Graphics Projects --- (Similar structure)
export const createSocialGraphicsProject = async (projectData: CreateSocialGraphicsProjectParams): Promise<SocialGraphicsProject> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('social_graphics_projects')
      .insert({ ...projectData, type: 'social_graphics' })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating social graphics project:', error);
    throw error;
  }
};

export const getSocialGraphicsProjects = async (clientId?: string): Promise<SocialGraphicsProject[]> => {
  try {
    let query = supabaseAdmin.from('social_graphics_projects').select('*');
    if (clientId) {
      query = query.eq('client_id', clientId); // Use client_id
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching social graphics projects:', error);
    throw error;
  }
};

export const updateSocialGraphicsProject = async (projectId: string, updates: UpdateSocialGraphicsProjectParams): Promise<SocialGraphicsProject> => {
   try {
    const { data, error } = await supabaseAdmin
      .from('social_graphics_projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating social graphics project ${projectId}:`, error);
    throw error;
  }
};

export const deleteSocialGraphicsProject = async (projectId: string): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('social_graphics_projects')
      .delete()
      .eq('id', projectId);
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting social graphics project ${projectId}:`, error);
    throw error;
  }
};

// --- Logo Design Projects --- (Similar structure)
export const createLogoDesignProject = async (projectData: CreateLogoDesignProjectParams): Promise<LogoDesignProject> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('logo_design_projects')
      .insert({ ...projectData, type: 'logo_design' })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating logo design project:', error);
    throw error;
  }
};

export const getLogoDesignProjects = async (clientId?: string): Promise<LogoDesignProject[]> => {
  try {
    let query = supabaseAdmin.from('logo_design_projects').select('*');
    if (clientId) {
      query = query.eq('client_id', clientId); // Use client_id
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching logo design projects:', error);
    throw error;
  }
};

export const updateLogoDesignProject = async (projectId: string, updates: UpdateLogoDesignProjectParams): Promise<LogoDesignProject> => {
   try {
    const { data, error } = await supabaseAdmin
      .from('logo_design_projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating logo design project ${projectId}:`, error);
    throw error;
  }
};

export const deleteLogoDesignProject = async (projectId: string): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('logo_design_projects')
      .delete()
      .eq('id', projectId);
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting logo design project ${projectId}:`, error);
    throw error;
  }
};


// =========================================
//      Support Ticket Functions
// =========================================

export const createSupportTicket = async (ticketData: CreateSupportTicketParams): Promise<SupportTicket> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        ...ticketData,
        status: ticketData.status || TicketStatus.OPEN, // Default to OPEN
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating support ticket:', error);
    throw error;
  }
};

export const getSupportTickets = async (clientId?: string, status?: TicketStatus): Promise<SupportTicket[]> => {
  try {
    let query = supabaseAdmin.from('support_tickets').select('*');
    if (clientId) {
      query = query.eq('client_id', clientId); // Use client_id
    }
    if (status) {
      query = query.eq('status', status);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    throw error;
  }
};

export const updateSupportTicket = async (ticketId: string, updates: UpdateSupportTicketParams): Promise<SupportTicket> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update({ ...updates, updated_at: new Date().toISOString() }) // Ensure updated_at is set
      .eq('id', ticketId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating support ticket ${ticketId}:`, error);
    throw error;
  }
};

// Specific function for assignment might be useful for clarity or additional logic
export const assignSupportTicket = async (ticketId: string, assigneeId: string): Promise<SupportTicket> => {
  try {
    // You might want to verify the assigneeId corresponds to a valid staff/designer user
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update({
        assignee_id: assigneeId, // Use assignee_id
        status: TicketStatus.IN_PROGRESS, // Automatically set status
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error assigning support ticket ${ticketId} to ${assigneeId}:`, error);
    throw error;
  }
};

export const addSupportMessage = async (messageData: CreateSupportMessageParams): Promise<SupportMessage> => {
  try {
    // Add validation if needed (e.g., check if ticket exists)
    const { data, error } = await supabaseAdmin
      .from('support_messages')
      .insert(messageData)
      .select()
      .single();
    if (error) throw error;
    // Optionally, update the parent ticket's updated_at timestamp
    // await updateSupportTicket(messageData.ticket_id, {}); 
    return data;
  } catch (error) {
    console.error(`Error adding message to support ticket ${messageData.ticket_id}:`, error);
    throw error;
  }
};

export const getSupportMessages = async (ticketId: string): Promise<SupportMessage[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching messages for support ticket ${ticketId}:`, error);
    throw error;
  }
};

// =========================================
//      Billing Functions
// =========================================

export const createInvoice = async (invoiceData: CreateInvoiceParams): Promise<BillingInvoice> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('billing_invoices')
      .insert({
        ...invoiceData,
        status: invoiceData.status || 'draft', // Default status
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

export const getUserInvoices = async (clientId: string): Promise<BillingInvoice[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('billing_invoices')
      .select('*')
      .eq('client_id', clientId) // Use client_id
      .order('due_date', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching invoices for client ${clientId}:`, error);
    throw error;
  }
};

// Combined update function for invoices
export const updateInvoice = async (invoiceId: string, updates: UpdateInvoiceParams): Promise<BillingInvoice> => {
  try {
    // Handle paid_at logic: set if status is 'paid' and paid_at is provided,
    // otherwise ensure it's null if status is not 'paid'.
    if (updates.status && updates.status !== 'paid') {
        updates.paid_at = null;
    } else if (updates.status === 'paid' && updates.paid_at === undefined) {
        // If setting to paid but not providing a date, set it to now.
        // Or require paid_at to be explicit? Decide based on requirements.
        // updates.paid_at = new Date().toISOString(); 
    }
    
    const { data, error } = await supabaseAdmin
      .from('billing_invoices')
      .update(updates)
      .eq('id', invoiceId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating invoice ${invoiceId}:`, error);
    throw error;
  }
};

// Kept specific function for status update if preferred, but updateInvoice covers it
// export const updateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus, paidAt?: string): Promise<BillingInvoice> => {
//   const updates: UpdateInvoiceParams = { status };
//   if (status === 'paid') {
//     updates.paid_at = paidAt || new Date().toISOString(); // Default to now if paid
//   } else {
//     updates.paid_at = null; // Ensure paid_at is null if not paid
//   }
//   return updateInvoice(invoiceId, updates);
// };


// =========================================
//      Designer & Task Functions
// =========================================

/**
 * Get all users with the 'designer' role from the profiles table.
 */
export const getDesigners = async (): Promise<Pick<UserProfile, 'id' | 'full_name'>[]> => {
  try {
    // Fetch only necessary fields
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name') // Fetch email only if needed elsewhere
      .eq('role', UserRole.DESIGNER);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching designers:', error);
    throw error;
  }
};

/**
 * Get the appropriate project table name based on type.
 */
const getProjectTableName = (projectType: ProjectType): string => {
  switch (projectType) {
    case 'web_design': return 'web_design_projects';
    case 'logo_design': return 'logo_design_projects';
    case 'social_graphics': return 'social_graphics_projects';
    default: throw new Error(`Invalid project type: ${projectType}`);
  }
};

/**
 * Assign a designer to a project by updating the project record.
 * Uses the single admin client.
 */
export const assignDesignerToProject = async (
  projectId: string,
  designerId: string,
  projectType: ProjectType
): Promise<ProjectBase | null> => { // Return type based on common fields
  try {
    // Optional: Verify designerId exists and has the 'designer' role
    const designer = await getUserProfile(designerId);
    if (!designer || designer.role !== UserRole.DESIGNER) {
        throw new Error(`User ${designerId} is not a valid designer.`);
    }

    const tableName = getProjectTableName(projectType);

    const { data, error } = await supabaseAdmin
      .from(tableName)
      .update({ designer_id: designerId })
      .eq('id', projectId)
      .select() // Select updated record
      .single(); // Expect only one record

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error assigning designer ${designerId} to project ${projectId} (${projectType}):`, error);
    throw error;
  }
};

/**
 * Remove designer assignment from a project.
 * Uses the single admin client.
 */
export const removeDesignerFromProject = async (
  projectId: string,
  projectType: ProjectType
): Promise<ProjectBase | null> => {
  try {
    const tableName = getProjectTableName(projectType);

    const { data, error } = await supabaseAdmin
      .from(tableName)
      .update({ designer_id: null }) // Set designer_id to null
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error removing designer from project ${projectId} (${projectType}):`, error);
    throw error;
  }
};

/**
 * Create a new task for a designer.
 */
export const createDesignerTask = async (taskData: CreateDesignerTaskParams): Promise<DesignerTask> => {
  try {
    const {
      title,
      description = '',
      status = 'todo',
      priority = 'medium',
      due_date,
      designer_id,
      project_id,
      project_type
    } = taskData;

    // 1. Verify the designer exists and has the correct role
    const { data: designerProfile, error: designerError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', designer_id)
      .eq('role', UserRole.DESIGNER)
      .maybeSingle();

    if (designerError) throw designerError;
    if (!designerProfile) {
      throw new Error(`Designer with ID ${designer_id} not found or user is not a designer.`);
    }

    // 2. If project is linked, verify project exists AND the designer is assigned to it.
    //    (Assuming designer_id is directly on the project table)
    if (project_id && project_type) {
      const tableName = getProjectTableName(project_type);
      const { data: project, error: projectError } = await supabaseAdmin
        .from(tableName)
        .select('id, designer_id') // Select designer_id for verification
        .eq('id', project_id)
        .maybeSingle();

      if (projectError) throw projectError;
      if (!project) {
        throw new Error(`Project with ID ${project_id} (${project_type}) not found.`);
      }
      // *** Crucial Check: Ensure the task's designer is assigned to the project ***
      // Allow admins to assign tasks even if designer isn't assigned? Or enforce?
      // Let's enforce for now:
      if (project.designer_id !== designer_id) {
         throw new Error(`Designer ${designer_id} is not assigned to project ${project_id} (${project_type}).`);
      }
      // If using a join table ('designer_projects') was intended, the verification logic here would be different.
    }

    // 3. Create the task
    const { data: task, error: insertError } = await supabaseAdmin
      .from('designer_tasks')
      .insert({
        title,
        description,
        status,
        priority,
        due_date,
        designer_id,
        project_id, // Will be null if not provided
        project_type // Will be null if not provided
      })
      .select()
      .single();

    if (insertError) throw insertError;
    if (!task) throw new Error("Task creation failed to return data.");

    return task;
  } catch (error) {
    console.error('Error creating designer task:', error);
    throw error;
  }
};

/**
 * Get all designer tasks, including designer and linked project information.
 */
export const getAllDesignerTasks = async () => { // Consider adding return type
  try {
    // Use JOINs to fetch related data in one query
    // Assumes Foreign Keys are set up correctly in Supabase:
    // - designer_tasks.designer_id -> profiles.id
    // - designer_tasks.project_id references ids in project tables (requires careful schema design or conditional logic)
    // The original query structure with multiple project joins is complex and relies on project_id being unique across tables,
    // or Supabase handling the non-matching joins gracefully (returning nulls). Let's keep that structure for now.

    const { data, error } = await supabaseAdmin
      .from('designer_tasks')
      .select(`
        *,
        designer:profiles!designer_tasks_designer_id_fkey (
          id,
          full_name
        ),
        web_project:web_design_projects (
          id,
          name 
        ),
        logo_project:logo_design_projects (
          id,
          name
        ),
        social_project:social_graphics_projects (
          id,
          name
        )
      `)
      // If project_id isn't a direct FK, you might need filters:
      // .eq('web_project.id', project_id) // This doesn't work directly in select like this.
      // A view or function in SQL might be cleaner for complex joins based on type.
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Process the results to create a unified 'project' field
    const processedTasks = data?.map(task => {
      let projectInfo = null;
      // Use the project_type field on the task to determine which related project data to use
      if (task.project_type === 'web_design' && task.web_project) {
        projectInfo = { id: task.web_project.id, name: task.web_project.name, type: 'web_design' as ProjectType };
      } else if (task.project_type === 'logo_design' && task.logo_project) {
        projectInfo = { id: task.logo_project.id, name: task.logo_project.name, type: 'logo_design' as ProjectType };
      } else if (task.project_type === 'social_graphics' && task.social_project) {
        projectInfo = { id: task.social_project.id, name: task.social_project.name, type: 'social_graphics' as ProjectType };
      }

      // Clean up the structure
      const { web_project, logo_project, social_project, ...taskData } = task;
      return {
        ...taskData,
        designer: task.designer, // Keep the fetched designer object
        project: projectInfo // Add the unified project object (or null)
      };
    }) || [];

    return processedTasks;
  } catch (error) {
    console.error('Error fetching all designer tasks:', error);
    throw error;
  }
};

/**
 * Update a designer task.
 */
export const updateDesignerTask = async (taskId: string, updates: UpdateDesignerTaskParams): Promise<DesignerTask> => {
  try {
    // Add validation if needed (e.g., check allowed status transitions)
    const { data, error } = await supabaseAdmin
      .from('designer_tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating designer task ${taskId}:`, error);
    throw error;
  }
};

/**
 * Delete a designer task.
 */
export const deleteDesignerTask = async (taskId: string): Promise<void> => {
    try {
        const { error } = await supabaseAdmin
            .from('designer_tasks')
            .delete()
            .eq('id', taskId);
        if (error) throw error;
    } catch(error) {
        console.error(`Error deleting designer task ${taskId}:`, error);
        throw error;
    }
}