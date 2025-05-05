export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      billing_invoices: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          due_date: string
          id: string
          invoice_number: string | null
          paid_at: string | null
          payment_method: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date: string
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bir_file: {
        Row: {
          bir_id: string
          file_type: string
          id: string
          mime_type: string
          original_name: string
          size_bytes: number
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          bir_id: string
          file_type: string
          id?: string
          mime_type: string
          original_name: string
          size_bytes: number
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          bir_id?: string
          file_type?: string
          id?: string
          mime_type?: string
          original_name?: string
          size_bytes?: number
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bir_file_bir_id_fkey"
            columns: ["bir_id"]
            isOneToOne: false
            referencedRelation: "business_information_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      business_information_requests: {
        Row: {
          answers: Json
          client_id: string
          created_at: string
          id: string
          project_id: string
          project_type: string
          status: Database["public"]["Enums"]["bir_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          answers: Json
          client_id: string
          created_at?: string
          id?: string
          project_id: string
          project_type: string
          status?: Database["public"]["Enums"]["bir_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          answers?: Json
          client_id?: string
          created_at?: string
          id?: string
          project_id?: string
          project_type?: string
          status?: Database["public"]["Enums"]["bir_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_bir_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bir_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bir_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          business_type: string | null
          city: string | null
          company_name: string | null
          company_website: string | null
          country: string | null
          created_at: string | null
          email_address: string | null
          friday_end: string | null
          friday_start: string | null
          id: string
          industry: string | null
          monday_end: string | null
          monday_start: string | null
          phone_number: string | null
          position_title: string | null
          postal_code: string | null
          primary_contact_name: string | null
          saturday_closed: boolean | null
          state_province: string | null
          street_address: string | null
          sunday_closed: boolean | null
          thursday_end: string | null
          thursday_start: string | null
          tuesday_end: string | null
          tuesday_start: string | null
          updated_at: string | null
          wednesday_end: string | null
          wednesday_start: string | null
        }
        Insert: {
          business_type?: string | null
          city?: string | null
          company_name?: string | null
          company_website?: string | null
          country?: string | null
          created_at?: string | null
          email_address?: string | null
          friday_end?: string | null
          friday_start?: string | null
          id: string
          industry?: string | null
          monday_end?: string | null
          monday_start?: string | null
          phone_number?: string | null
          position_title?: string | null
          postal_code?: string | null
          primary_contact_name?: string | null
          saturday_closed?: boolean | null
          state_province?: string | null
          street_address?: string | null
          sunday_closed?: boolean | null
          thursday_end?: string | null
          thursday_start?: string | null
          tuesday_end?: string | null
          tuesday_start?: string | null
          updated_at?: string | null
          wednesday_end?: string | null
          wednesday_start?: string | null
        }
        Update: {
          business_type?: string | null
          city?: string | null
          company_name?: string | null
          company_website?: string | null
          country?: string | null
          created_at?: string | null
          email_address?: string | null
          friday_end?: string | null
          friday_start?: string | null
          id?: string
          industry?: string | null
          monday_end?: string | null
          monday_start?: string | null
          phone_number?: string | null
          position_title?: string | null
          postal_code?: string | null
          primary_contact_name?: string | null
          saturday_closed?: boolean | null
          state_province?: string | null
          street_address?: string | null
          sunday_closed?: boolean | null
          thursday_end?: string | null
          thursday_start?: string | null
          tuesday_end?: string | null
          tuesday_start?: string | null
          updated_at?: string | null
          wednesday_end?: string | null
          wednesday_start?: string | null
        }
        Relationships: []
      }
      designer_projects: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          designer_id: string | null
          id: string
          project_id: string
          project_type: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          designer_id?: string | null
          id?: string
          project_id: string
          project_type: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          designer_id?: string | null
          id?: string
          project_id?: string
          project_type?: string
        }
        Relationships: []
      }
      designer_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          designer_id: string
          due_date: string | null
          id: string
          priority: string
          project_id: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          designer_id: string
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          designer_id?: string
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      logo_design_projects: {
        Row: {
          active: boolean | null
          admin_notes: string | null
          approval_date: string | null
          brand_colors: string | null
          brand_guidelines: string | null
          brand_personality: string | null
          brand_values: string | null
          color_preferences: string | null
          color_psychology: string | null
          competitors: string | null
          concept_development_date: string | null
          created_at: string | null
          current_stage: string | null
          deadline: string | null
          delivery_date: string | null
          description: string | null
          design_preferences: string | null
          designer: Json | null
          designer_email: string | null
          designer_notes: string | null
          discovery_date: string | null
          feedback_history: Json | null
          file_formats_needed: string | null
          finalization_date: string | null
          id: string
          industry: string | null
          is_placeholder: boolean | null
          logo_text: string | null
          logo_type: string | null
          logo_usage: string | null
          logo_versions_needed: string | null
          owner: Json | null
          refinement_date: string | null
          requirements: string | null
          revision_count: number | null
          stage: string | null
          status: string | null
          style_preferences: string | null
          symbol_preferences: string | null
          target_market: string | null
          technical_requirements: string | null
          title: string
          typography_preferences: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          admin_notes?: string | null
          approval_date?: string | null
          brand_colors?: string | null
          brand_guidelines?: string | null
          brand_personality?: string | null
          brand_values?: string | null
          color_preferences?: string | null
          color_psychology?: string | null
          competitors?: string | null
          concept_development_date?: string | null
          created_at?: string | null
          current_stage?: string | null
          deadline?: string | null
          delivery_date?: string | null
          description?: string | null
          design_preferences?: string | null
          designer?: Json | null
          designer_email?: string | null
          designer_notes?: string | null
          discovery_date?: string | null
          feedback_history?: Json | null
          file_formats_needed?: string | null
          finalization_date?: string | null
          id?: string
          industry?: string | null
          is_placeholder?: boolean | null
          logo_text?: string | null
          logo_type?: string | null
          logo_usage?: string | null
          logo_versions_needed?: string | null
          owner?: Json | null
          refinement_date?: string | null
          requirements?: string | null
          revision_count?: number | null
          stage?: string | null
          status?: string | null
          style_preferences?: string | null
          symbol_preferences?: string | null
          target_market?: string | null
          technical_requirements?: string | null
          title: string
          typography_preferences?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          admin_notes?: string | null
          approval_date?: string | null
          brand_colors?: string | null
          brand_guidelines?: string | null
          brand_personality?: string | null
          brand_values?: string | null
          color_preferences?: string | null
          color_psychology?: string | null
          competitors?: string | null
          concept_development_date?: string | null
          created_at?: string | null
          current_stage?: string | null
          deadline?: string | null
          delivery_date?: string | null
          description?: string | null
          design_preferences?: string | null
          designer?: Json | null
          designer_email?: string | null
          designer_notes?: string | null
          discovery_date?: string | null
          feedback_history?: Json | null
          file_formats_needed?: string | null
          finalization_date?: string | null
          id?: string
          industry?: string | null
          is_placeholder?: boolean | null
          logo_text?: string | null
          logo_type?: string | null
          logo_usage?: string | null
          logo_versions_needed?: string | null
          owner?: Json | null
          refinement_date?: string | null
          requirements?: string | null
          revision_count?: number | null
          stage?: string | null
          status?: string | null
          style_preferences?: string | null
          symbol_preferences?: string | null
          target_market?: string | null
          technical_requirements?: string | null
          title?: string
          typography_preferences?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logo_design_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logo_design_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logo_design_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      management_analytics: {
        Row: {
          analytics_service: string | null
          connected_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          property_id: string | null
          tracking_code: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analytics_service?: string | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          tracking_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analytics_service?: string | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          tracking_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      management_google_ads: {
        Row: {
          ads_account_id: string | null
          campaign_status: string | null
          created_at: string | null
          end_date: string | null
          id: string
          monthly_budget: number | null
          notes: string | null
          primary_keywords: string[] | null
          start_date: string | null
          target_audience: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ads_account_id?: string | null
          campaign_status?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          monthly_budget?: number | null
          notes?: string | null
          primary_keywords?: string[] | null
          start_date?: string | null
          target_audience?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ads_account_id?: string | null
          campaign_status?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          monthly_budget?: number | null
          notes?: string | null
          primary_keywords?: string[] | null
          start_date?: string | null
          target_audience?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_google_ads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_google_ads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_google_ads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      management_website: {
        Row: {
          cms_type: string | null
          created_at: string | null
          domain_name: string
          hosting_provider: string | null
          id: string
          monthly_maintenance: boolean | null
          notes: string | null
          renewal_date: string | null
          ssl_status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cms_type?: string | null
          created_at?: string | null
          domain_name: string
          hosting_provider?: string | null
          id?: string
          monthly_maintenance?: boolean | null
          notes?: string | null
          renewal_date?: string | null
          ssl_status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cms_type?: string | null
          created_at?: string | null
          domain_name?: string
          hosting_provider?: string | null
          id?: string
          monthly_maintenance?: boolean | null
          notes?: string | null
          renewal_date?: string | null
          ssl_status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_website_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_website_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_website_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          business_name: string | null
          business_website: string | null
          city: string | null
          company: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          mobile: string | null
          phone: string | null
          position: string | null
          preferred_contact: string | null
          role: string | null
          state: string | null
          updated_at: string | null
          website_dashboard_url: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          business_name?: string | null
          business_website?: string | null
          city?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          mobile?: string | null
          phone?: string | null
          position?: string | null
          preferred_contact?: string | null
          role?: string | null
          state?: string | null
          updated_at?: string | null
          website_dashboard_url?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          business_name?: string | null
          business_website?: string | null
          city?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          mobile?: string | null
          phone?: string | null
          position?: string | null
          preferred_contact?: string | null
          role?: string | null
          state?: string | null
          updated_at?: string | null
          website_dashboard_url?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      project_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by_id: string | null
          designer_id: string | null
          id: string
          project_id: string
          project_type: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by_id?: string | null
          designer_id?: string | null
          id?: string
          project_id: string
          project_type: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by_id?: string | null
          designer_id?: string | null
          id?: string
          project_id?: string
          project_type?: string
        }
        Relationships: []
      }
      project_notes: {
        Row: {
          content: string
          created_at: string | null
          designer_id: string
          id: string
          is_private: boolean | null
          project_id: string
          project_type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          designer_id: string
          id?: string
          is_private?: boolean | null
          project_id: string
          project_type: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          designer_id?: string
          id?: string
          is_private?: boolean | null
          project_id?: string
          project_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_revisions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          feedback: string | null
          id: string
          project_id: string
          project_type: Database["public"]["Enums"]["project_type_for_revision"]
          status: Database["public"]["Enums"]["revision_status"]
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          feedback?: string | null
          id?: string
          project_id: string
          project_type: Database["public"]["Enums"]["project_type_for_revision"]
          status?: Database["public"]["Enums"]["revision_status"]
          title: string
          updated_at?: string
          version: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          feedback?: string | null
          id?: string
          project_id?: string
          project_type?: Database["public"]["Enums"]["project_type_for_revision"]
          status?: Database["public"]["Enums"]["revision_status"]
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      revision_comments: {
        Row: {
          comment: string
          created_at: string
          file_id: string | null
          id: string
          position_x: number | null
          position_y: number | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          revision_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          file_id?: string | null
          id?: string
          position_x?: number | null
          position_y?: number | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          revision_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          file_id?: string | null
          id?: string
          position_x?: number | null
          position_y?: number | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          revision_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revision_comments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "revision_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_comments_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "project_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_files: {
        Row: {
          bucket: string | null
          created_at: string
          external_url: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_external: boolean | null
          is_primary: boolean | null
          mockup_type: string | null
          revision_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          bucket?: string | null
          created_at?: string
          external_url?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_external?: boolean | null
          is_primary?: boolean | null
          mockup_type?: string | null
          revision_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          bucket?: string | null
          created_at?: string
          external_url?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_external?: boolean | null
          is_primary?: boolean | null
          mockup_type?: string | null
          revision_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revision_files_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "project_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_notes: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          revision_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          revision_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          revision_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revision_notes_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "project_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      social_graphics_projects: {
        Row: {
          active: boolean | null
          admin_notes: string | null
          animation_requirements: string | null
          approval_date: string | null
          brand_guidelines: string | null
          call_to_action: string | null
          campaign_goals: string | null
          caption_requirements: string | null
          concept_development_date: string | null
          content_type: string | null
          created_at: string | null
          current_stage: string | null
          deadline: string | null
          delivery_date: string | null
          description: string | null
          design_preferences: string | null
          designer: Json | null
          designer_email: string | null
          designer_notes: string | null
          dimensions: string | null
          discovery_date: string | null
          feedback_history: Json | null
          finalization_date: string | null
          hashtag_strategy: string | null
          id: string
          image_text_ratio: string | null
          integration_with_website: string | null
          is_placeholder: boolean | null
          owner: Json | null
          platform_specific_requirements: string | null
          platforms: string | null
          posting_frequency: string | null
          refinement_date: string | null
          requirements: string | null
          revision_count: number | null
          seasonal_themes: string | null
          social_platform: string | null
          stage: string | null
          status: string | null
          target_audience_demographics: string | null
          technical_requirements: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          video_requirements: string | null
        }
        Insert: {
          active?: boolean | null
          admin_notes?: string | null
          animation_requirements?: string | null
          approval_date?: string | null
          brand_guidelines?: string | null
          call_to_action?: string | null
          campaign_goals?: string | null
          caption_requirements?: string | null
          concept_development_date?: string | null
          content_type?: string | null
          created_at?: string | null
          current_stage?: string | null
          deadline?: string | null
          delivery_date?: string | null
          description?: string | null
          design_preferences?: string | null
          designer?: Json | null
          designer_email?: string | null
          designer_notes?: string | null
          dimensions?: string | null
          discovery_date?: string | null
          feedback_history?: Json | null
          finalization_date?: string | null
          hashtag_strategy?: string | null
          id?: string
          image_text_ratio?: string | null
          integration_with_website?: string | null
          is_placeholder?: boolean | null
          owner?: Json | null
          platform_specific_requirements?: string | null
          platforms?: string | null
          posting_frequency?: string | null
          refinement_date?: string | null
          requirements?: string | null
          revision_count?: number | null
          seasonal_themes?: string | null
          social_platform?: string | null
          stage?: string | null
          status?: string | null
          target_audience_demographics?: string | null
          technical_requirements?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          video_requirements?: string | null
        }
        Update: {
          active?: boolean | null
          admin_notes?: string | null
          animation_requirements?: string | null
          approval_date?: string | null
          brand_guidelines?: string | null
          call_to_action?: string | null
          campaign_goals?: string | null
          caption_requirements?: string | null
          concept_development_date?: string | null
          content_type?: string | null
          created_at?: string | null
          current_stage?: string | null
          deadline?: string | null
          delivery_date?: string | null
          description?: string | null
          design_preferences?: string | null
          designer?: Json | null
          designer_email?: string | null
          designer_notes?: string | null
          dimensions?: string | null
          discovery_date?: string | null
          feedback_history?: Json | null
          finalization_date?: string | null
          hashtag_strategy?: string | null
          id?: string
          image_text_ratio?: string | null
          integration_with_website?: string | null
          is_placeholder?: boolean | null
          owner?: Json | null
          platform_specific_requirements?: string | null
          platforms?: string | null
          posting_frequency?: string | null
          refinement_date?: string | null
          requirements?: string | null
          revision_count?: number | null
          seasonal_themes?: string | null
          social_platform?: string | null
          stage?: string | null
          status?: string | null
          target_audience_demographics?: string | null
          technical_requirements?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          video_requirements?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_graphics_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_graphics_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_graphics_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          attachment_path: string | null
          created_at: string | null
          id: string
          message: string
          sender_id: string | null
          ticket_id: string | null
        }
        Insert: {
          attachment_path?: string | null
          created_at?: string | null
          id?: string
          message: string
          sender_id?: string | null
          ticket_id?: string | null
        }
        Update: {
          attachment_path?: string | null
          created_at?: string | null
          id?: string
          message?: string
          sender_id?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string | null
          created_by: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          task_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          task_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "designer_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          task_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "designer_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      test_rls: {
        Row: {
          data: string | null
          id: string
          user_id: string
        }
        Insert: {
          data?: string | null
          id?: string
          user_id: string
        }
        Update: {
          data?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_files: {
        Row: {
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          project_id: string | null
          project_type: string | null
          uploaded_at: string | null
          user_id: string | null
        }
        Insert: {
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string | null
          project_type?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Update: {
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string | null
          project_type?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      web_design_projects: {
        Row: {
          accessibility_requirements: string | null
          active: boolean | null
          admin_notes: string | null
          analytics_requirements: string | null
          approval_date: string | null
          brand_guidelines: string | null
          budget_range: string | null
          color_preferences: string | null
          concept_development_date: string | null
          content_management_needs: string | null
          content_strategy: string | null
          created_at: string | null
          current_stage: string | null
          current_website_url: string | null
          custom_functionality: string | null
          deadline: string | null
          delivery_date: string | null
          description: string | null
          design_preferences: string | null
          designer: Json | null
          designer_email: string | null
          designer_notes: string | null
          desired_features: string | null
          discovery_date: string | null
          domain_name: string | null
          ecommerce_needs: boolean | null
          existing_branding: boolean | null
          expected_launch_date: string | null
          feedback_history: Json | null
          finalization_date: string | null
          form_requirements: string | null
          hosting_preferences: string | null
          hosting_provider: string | null
          id: string
          is_placeholder: boolean | null
          maintenance_requirements: string | null
          marketing_integration: string | null
          multilingual_support: boolean | null
          number_of_pages: number | null
          owner: Json | null
          payment_gateways: string | null
          preferred_platforms: string | null
          refinement_date: string | null
          requirements: string | null
          responsive_design_needs: string | null
          revision_count: number | null
          security_requirements: string | null
          seo_requirements: string | null
          site_goals: string | null
          site_type: string | null
          social_media_integration: string | null
          stage: string | null
          status: string | null
          target_audience: string | null
          target_devices: string | null
          technical_requirements: string | null
          timeline_expectations: string | null
          title: string
          updated_at: string | null
          user_account_system: boolean | null
          user_id: string | null
          website_type: string | null
        }
        Insert: {
          accessibility_requirements?: string | null
          active?: boolean | null
          admin_notes?: string | null
          analytics_requirements?: string | null
          approval_date?: string | null
          brand_guidelines?: string | null
          budget_range?: string | null
          color_preferences?: string | null
          concept_development_date?: string | null
          content_management_needs?: string | null
          content_strategy?: string | null
          created_at?: string | null
          current_stage?: string | null
          current_website_url?: string | null
          custom_functionality?: string | null
          deadline?: string | null
          delivery_date?: string | null
          description?: string | null
          design_preferences?: string | null
          designer?: Json | null
          designer_email?: string | null
          designer_notes?: string | null
          desired_features?: string | null
          discovery_date?: string | null
          domain_name?: string | null
          ecommerce_needs?: boolean | null
          existing_branding?: boolean | null
          expected_launch_date?: string | null
          feedback_history?: Json | null
          finalization_date?: string | null
          form_requirements?: string | null
          hosting_preferences?: string | null
          hosting_provider?: string | null
          id?: string
          is_placeholder?: boolean | null
          maintenance_requirements?: string | null
          marketing_integration?: string | null
          multilingual_support?: boolean | null
          number_of_pages?: number | null
          owner?: Json | null
          payment_gateways?: string | null
          preferred_platforms?: string | null
          refinement_date?: string | null
          requirements?: string | null
          responsive_design_needs?: string | null
          revision_count?: number | null
          security_requirements?: string | null
          seo_requirements?: string | null
          site_goals?: string | null
          site_type?: string | null
          social_media_integration?: string | null
          stage?: string | null
          status?: string | null
          target_audience?: string | null
          target_devices?: string | null
          technical_requirements?: string | null
          timeline_expectations?: string | null
          title: string
          updated_at?: string | null
          user_account_system?: boolean | null
          user_id?: string | null
          website_type?: string | null
        }
        Update: {
          accessibility_requirements?: string | null
          active?: boolean | null
          admin_notes?: string | null
          analytics_requirements?: string | null
          approval_date?: string | null
          brand_guidelines?: string | null
          budget_range?: string | null
          color_preferences?: string | null
          concept_development_date?: string | null
          content_management_needs?: string | null
          content_strategy?: string | null
          created_at?: string | null
          current_stage?: string | null
          current_website_url?: string | null
          custom_functionality?: string | null
          deadline?: string | null
          delivery_date?: string | null
          description?: string | null
          design_preferences?: string | null
          designer?: Json | null
          designer_email?: string | null
          designer_notes?: string | null
          desired_features?: string | null
          discovery_date?: string | null
          domain_name?: string | null
          ecommerce_needs?: boolean | null
          existing_branding?: boolean | null
          expected_launch_date?: string | null
          feedback_history?: Json | null
          finalization_date?: string | null
          form_requirements?: string | null
          hosting_preferences?: string | null
          hosting_provider?: string | null
          id?: string
          is_placeholder?: boolean | null
          maintenance_requirements?: string | null
          marketing_integration?: string | null
          multilingual_support?: boolean | null
          number_of_pages?: number | null
          owner?: Json | null
          payment_gateways?: string | null
          preferred_platforms?: string | null
          refinement_date?: string | null
          requirements?: string | null
          responsive_design_needs?: string | null
          revision_count?: number | null
          security_requirements?: string | null
          seo_requirements?: string | null
          site_goals?: string | null
          site_type?: string | null
          social_media_integration?: string | null
          stage?: string | null
          status?: string | null
          target_audience?: string | null
          target_devices?: string | null
          technical_requirements?: string | null
          timeline_expectations?: string | null
          title?: string
          updated_at?: string | null
          user_account_system?: boolean | null
          user_id?: string | null
          website_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_design_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_design_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_design_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          business_name: string | null
          business_website: string | null
          city: string | null
          company: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          mobile: string | null
          phone: string | null
          position: string | null
          preferred_contact: string | null
          role: string | null
          state: string | null
          updated_at: string | null
          website_dashboard_url: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          business_name?: string | null
          business_website?: string | null
          city?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          mobile?: string | null
          phone?: string | null
          position?: string | null
          preferred_contact?: string | null
          role?: string | null
          state?: string | null
          updated_at?: string | null
          website_dashboard_url?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          business_name?: string | null
          business_website?: string | null
          city?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          mobile?: string | null
          phone?: string | null
          position?: string | null
          preferred_contact?: string | null
          role?: string | null
          state?: string | null
          updated_at?: string | null
          website_dashboard_url?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      safe_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_delete_user: {
        Args: { user_id: string }
        Returns: undefined
      }
      admin_update_user_role: {
        Args: { user_id: string; new_role: string }
        Returns: undefined
      }
      backfill_missing_profiles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_policy_if_not_exists: {
        Args: {
          policy_name: string
          table_name: string
          command: string
          using_expr?: string
          check_expr?: string
          target_roles?: string
        }
        Returns: undefined
      }
      enable_rls_if_not_enabled: {
        Args: { table_name: string }
        Returns: undefined
      }
      get_my_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string | null
          avatar_url: string | null
          business_name: string | null
          business_website: string | null
          city: string | null
          company: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          mobile: string | null
          phone: string | null
          position: string | null
          preferred_contact: string | null
          role: string | null
          state: string | null
          updated_at: string | null
          website_dashboard_url: string | null
          zip: string | null
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      is_designer_assigned_to_project: {
        Args: { d_id: string; p_id: string; p_type: string }
        Returns: boolean
      }
      user_has_access_to_profile: {
        Args: { profile_id: string }
        Returns: boolean
      }
    }
    Enums: {
      bir_status: "pending" | "submitted" | "approved"
      project_type_for_revision:
        | "web_design"
        | "logo_design"
        | "social_graphics"
      revision_status: "pending" | "approved" | "rejected" | "current"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; name: string; owner: string; metadata: Json }
        Returns: undefined
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      bir_status: ["pending", "submitted", "approved"],
      project_type_for_revision: [
        "web_design",
        "logo_design",
        "social_graphics",
      ],
      revision_status: ["pending", "approved", "rejected", "current"],
    },
  },
  storage: {
    Enums: {},
  },
} as const
