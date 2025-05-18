export interface AdminProject {
  id: string;
  title: string;
  description: string | null;
  status: string;
  client_id: string;
  client_name: string | null;
  client_email: string | null;
  client_company: string | null;
  due_date: string | null; // Assuming due_date is used, adjust if it's deadline
  created_at: string;
  updated_at: string;
  type: 'web_design' | 'logo_design' | 'social_graphics'; // Corrected social_media to social_graphics based on API
  designer_id?: string | null; 
  designer_name?: string | null;
  designer_email?: string | null;
  birId?: string | null;
  birStatus?: 'pending' | 'submitted' | 'approved' | null;
} 