create schema if not exists "auth_helpers";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION auth_helpers.get_user_role(user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  -- Get role directly from auth.users metadata
  RETURN (
    SELECT COALESCE((raw_user_meta_data->>'role')::TEXT, 'unknown')
    FROM auth.users
    WHERE id = user_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'unknown';
END;
$function$
;

CREATE OR REPLACE FUNCTION auth_helpers.is_designer_assigned_to_project(d_id uuid, p_id uuid, p_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_assigned BOOLEAN;
BEGIN
  -- Use row_security = off to bypass RLS
  SET LOCAL row_security = off;

  -- Check direct assignment
  SELECT EXISTS (
    SELECT 1 FROM public.project_assignments
    WHERE designer_id = d_id
      AND project_id = p_id
      AND project_type::TEXT = p_type
  ) INTO is_assigned;

  RETURN is_assigned;
END;
$function$
;


create type "public"."bir_status" as enum ('pending', 'submitted', 'approved');

create type "public"."project_type_for_revision" as enum ('web_design', 'logo_design', 'social_graphics');

create type "public"."revision_status" as enum ('pending', 'approved', 'rejected', 'current');

create table "public"."billing_invoices" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "amount" numeric(10,2) not null,
    "currency" text default 'USD'::text,
    "status" text default 'pending'::text,
    "invoice_number" text,
    "description" text,
    "due_date" date not null,
    "paid_at" timestamp with time zone,
    "payment_method" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."billing_invoices" enable row level security;

create table "public"."bir_file" (
    "id" uuid not null default gen_random_uuid(),
    "bir_id" uuid not null,
    "file_type" text not null,
    "original_name" text not null,
    "storage_path" text not null,
    "mime_type" text not null,
    "size_bytes" integer not null,
    "uploaded_at" timestamp with time zone not null default now()
);


alter table "public"."bir_file" enable row level security;

create table "public"."business_information_requests" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "project_type" text not null,
    "client_id" uuid not null,
    "status" bir_status not null default 'pending'::bir_status,
    "answers" jsonb not null,
    "submitted_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."business_information_requests" enable row level security;

create table "public"."business_profiles" (
    "id" uuid not null,
    "company_name" text,
    "business_type" text,
    "industry" text,
    "company_website" text,
    "primary_contact_name" text,
    "position_title" text,
    "email_address" text,
    "phone_number" text,
    "street_address" text,
    "city" text,
    "state_province" text,
    "postal_code" text,
    "country" text,
    "monday_start" time without time zone,
    "monday_end" time without time zone,
    "tuesday_start" time without time zone,
    "tuesday_end" time without time zone,
    "wednesday_start" time without time zone,
    "wednesday_end" time without time zone,
    "thursday_start" time without time zone,
    "thursday_end" time without time zone,
    "friday_start" time without time zone,
    "friday_end" time without time zone,
    "saturday_closed" boolean default true,
    "sunday_closed" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."business_profiles" enable row level security;

create table "public"."designer_projects" (
    "id" uuid not null default gen_random_uuid(),
    "designer_id" uuid,
    "project_id" uuid not null,
    "project_type" text not null,
    "assigned_at" timestamp with time zone default now(),
    "assigned_by" uuid
);


create table "public"."designer_tasks" (
    "id" uuid not null default uuid_generate_v4(),
    "title" text not null,
    "description" text,
    "status" text not null default 'todo'::text,
    "priority" text not null default 'medium'::text,
    "due_date" timestamp with time zone,
    "designer_id" uuid not null,
    "project_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."designer_tasks" enable row level security;

create table "public"."logo_design_projects" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "title" text not null,
    "description" text,
    "status" text default 'pending'::text,
    "industry" text,
    "color_preferences" text,
    "style_preferences" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_placeholder" boolean default false,
    "active" boolean default false,
    "current_stage" text,
    "discovery_date" timestamp with time zone,
    "concept_development_date" timestamp with time zone,
    "refinement_date" timestamp with time zone,
    "finalization_date" timestamp with time zone,
    "delivery_date" timestamp with time zone,
    "deadline" timestamp with time zone,
    "requirements" text,
    "stage" character varying(50) default 'intake'::character varying,
    "designer_email" character varying(255),
    "logo_type" character varying(100),
    "brand_colors" text,
    "logo_text" character varying(255),
    "owner" jsonb,
    "designer" jsonb,
    "technical_requirements" text,
    "brand_guidelines" text,
    "design_preferences" text,
    "logo_usage" text,
    "target_market" text,
    "competitors" text,
    "color_psychology" text,
    "symbol_preferences" text,
    "typography_preferences" text,
    "file_formats_needed" text,
    "brand_personality" text,
    "brand_values" text,
    "logo_versions_needed" text,
    "designer_notes" text,
    "admin_notes" text,
    "revision_count" integer default 0,
    "feedback_history" jsonb,
    "approval_date" timestamp with time zone
);


alter table "public"."logo_design_projects" enable row level security;

create table "public"."management_analytics" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "analytics_service" text,
    "property_id" text,
    "connected_at" timestamp with time zone,
    "tracking_code" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."management_analytics" enable row level security;

create table "public"."management_google_ads" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "ads_account_id" text,
    "monthly_budget" numeric,
    "campaign_status" text,
    "start_date" date,
    "end_date" date,
    "primary_keywords" text[],
    "target_audience" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."management_google_ads" enable row level security;

create table "public"."management_website" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "domain_name" text not null,
    "hosting_provider" text,
    "ssl_status" text,
    "cms_type" text,
    "monthly_maintenance" boolean default false,
    "renewal_date" date,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."management_website" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "full_name" text,
    "avatar_url" text,
    "company" text,
    "role" text default 'guest'::text,
    "phone" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "business_name" text,
    "mobile" text,
    "preferred_contact" text,
    "address" text,
    "city" text,
    "state" text,
    "zip" text,
    "position" text,
    "business_website" text,
    "website_dashboard_url" text,
    "email" text
);


alter table "public"."profiles" enable row level security;

create table "public"."project_assignments" (
    "id" uuid not null default gen_random_uuid(),
    "project_type" text not null,
    "project_id" uuid not null,
    "designer_id" uuid,
    "assigned_by_id" uuid,
    "assigned_at" timestamp with time zone default now()
);


alter table "public"."project_assignments" enable row level security;

create table "public"."project_notes" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "project_type" text not null,
    "designer_id" uuid not null,
    "content" text not null,
    "is_private" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."project_notes" enable row level security;

create table "public"."project_revisions" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "project_type" project_type_for_revision not null,
    "version" integer not null,
    "title" text not null,
    "description" text,
    "status" revision_status not null default 'pending'::revision_status,
    "feedback" text,
    "created_by" uuid,
    "approved_by" uuid,
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."project_revisions" enable row level security;

create table "public"."projects" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "created_by" uuid,
    "client_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."projects" enable row level security;

create table "public"."revision_comments" (
    "id" uuid not null default gen_random_uuid(),
    "revision_id" uuid,
    "user_id" uuid,
    "comment" text not null,
    "position_x" double precision,
    "position_y" double precision,
    "file_id" uuid,
    "resolved" boolean default false,
    "resolved_by" uuid,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."revision_comments" enable row level security;

create table "public"."revision_files" (
    "id" uuid not null default gen_random_uuid(),
    "revision_id" uuid,
    "file_path" text not null,
    "file_name" text not null,
    "file_type" text,
    "file_size" integer,
    "is_primary" boolean default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "bucket" text,
    "mockup_type" text,
    "external_url" text,
    "is_external" boolean default false,
    "uploaded_by" uuid
);


alter table "public"."revision_files" enable row level security;

create table "public"."revision_notes" (
    "id" uuid not null default gen_random_uuid(),
    "revision_id" uuid not null,
    "content" text,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."revision_notes" enable row level security;

create table "public"."social_graphics_projects" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "title" text not null,
    "description" text,
    "social_platform" text,
    "content_type" text,
    "status" text default 'pending'::text,
    "dimensions" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_placeholder" boolean default false,
    "active" boolean default false,
    "current_stage" text,
    "discovery_date" timestamp with time zone,
    "concept_development_date" timestamp with time zone,
    "refinement_date" timestamp with time zone,
    "finalization_date" timestamp with time zone,
    "delivery_date" timestamp with time zone,
    "deadline" timestamp with time zone,
    "requirements" text,
    "stage" character varying(50) default 'intake'::character varying,
    "designer_email" character varying(255),
    "platforms" character varying(255),
    "brand_guidelines" text,
    "owner" jsonb,
    "designer" jsonb,
    "technical_requirements" text,
    "design_preferences" text,
    "campaign_goals" text,
    "target_audience_demographics" text,
    "posting_frequency" text,
    "caption_requirements" text,
    "hashtag_strategy" text,
    "image_text_ratio" text,
    "animation_requirements" text,
    "video_requirements" text,
    "call_to_action" text,
    "platform_specific_requirements" text,
    "seasonal_themes" text,
    "integration_with_website" text,
    "designer_notes" text,
    "admin_notes" text,
    "revision_count" integer default 0,
    "feedback_history" jsonb,
    "approval_date" timestamp with time zone
);


alter table "public"."social_graphics_projects" enable row level security;

create table "public"."support_messages" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_id" uuid,
    "sender_id" uuid,
    "message" text not null,
    "attachment_path" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."support_messages" enable row level security;

create table "public"."support_tickets" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "subject" text not null,
    "description" text,
    "status" text default 'open'::text,
    "priority" text default 'medium'::text,
    "assigned_to" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "resolved_at" timestamp with time zone
);


alter table "public"."support_tickets" enable row level security;

create table "public"."task_attachments" (
    "id" uuid not null default gen_random_uuid(),
    "task_id" uuid,
    "file_path" text not null,
    "file_name" text not null,
    "file_size" integer,
    "file_type" text,
    "created_by" uuid,
    "created_at" timestamp with time zone default now()
);


alter table "public"."task_attachments" enable row level security;

create table "public"."task_comments" (
    "id" uuid not null default gen_random_uuid(),
    "task_id" uuid,
    "user_id" uuid,
    "content" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."task_comments" enable row level security;

create table "public"."test_rls" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "data" text
);


alter table "public"."test_rls" enable row level security;

create table "public"."user_files" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "file_path" text not null,
    "file_name" text not null,
    "file_type" text,
    "file_size" bigint,
    "description" text,
    "project_type" text,
    "project_id" uuid,
    "uploaded_at" timestamp with time zone default now()
);


alter table "public"."user_files" enable row level security;

create table "public"."web_design_projects" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "title" text not null,
    "description" text,
    "status" text default 'pending'::text,
    "site_type" text,
    "domain_name" text,
    "hosting_provider" text,
    "expected_launch_date" date,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_placeholder" boolean default false,
    "active" boolean default false,
    "current_stage" text,
    "discovery_date" timestamp with time zone,
    "concept_development_date" timestamp with time zone,
    "refinement_date" timestamp with time zone,
    "finalization_date" timestamp with time zone,
    "delivery_date" timestamp with time zone,
    "deadline" timestamp with time zone,
    "requirements" text,
    "stage" character varying(50) default 'intake'::character varying,
    "website_type" character varying(100),
    "target_audience" text,
    "color_preferences" text,
    "existing_branding" boolean default false,
    "desired_features" text,
    "current_website_url" character varying(255),
    "hosting_preferences" character varying(100),
    "designer_email" character varying(255),
    "owner" jsonb,
    "designer" jsonb,
    "technical_requirements" text,
    "seo_requirements" text,
    "brand_guidelines" text,
    "design_preferences" text,
    "site_goals" text,
    "timeline_expectations" text,
    "responsive_design_needs" text,
    "target_devices" text,
    "accessibility_requirements" text,
    "analytics_requirements" text,
    "marketing_integration" text,
    "ecommerce_needs" boolean default false,
    "payment_gateways" text,
    "social_media_integration" text,
    "content_management_needs" text,
    "multilingual_support" boolean default false,
    "security_requirements" text,
    "content_strategy" text,
    "number_of_pages" integer,
    "form_requirements" text,
    "preferred_platforms" text,
    "custom_functionality" text,
    "user_account_system" boolean default false,
    "maintenance_requirements" text,
    "budget_range" text,
    "designer_notes" text,
    "admin_notes" text,
    "revision_count" integer default 0,
    "feedback_history" jsonb,
    "approval_date" timestamp with time zone
);


alter table "public"."web_design_projects" enable row level security;

CREATE UNIQUE INDEX billing_invoices_pkey ON public.billing_invoices USING btree (id);

CREATE UNIQUE INDEX bir_file_pkey ON public.bir_file USING btree (id);

CREATE UNIQUE INDEX bir_file_storage_path_key ON public.bir_file USING btree (storage_path);

CREATE UNIQUE INDEX business_information_requests_pkey ON public.business_information_requests USING btree (id);

CREATE UNIQUE INDEX business_information_requests_project_id_key ON public.business_information_requests USING btree (project_id);

CREATE UNIQUE INDEX business_profiles_pkey ON public.business_profiles USING btree (id);

CREATE UNIQUE INDEX designer_projects_designer_id_project_id_project_type_key ON public.designer_projects USING btree (designer_id, project_id, project_type);

CREATE UNIQUE INDEX designer_projects_pkey ON public.designer_projects USING btree (id);

CREATE UNIQUE INDEX designer_tasks_pkey ON public.designer_tasks USING btree (id);

CREATE INDEX idx_billing_invoices_user_id ON public.billing_invoices USING btree (user_id);

CREATE INDEX idx_bir_client ON public.business_information_requests USING btree (client_id);

CREATE INDEX idx_bir_file_bir_id ON public.bir_file USING btree (bir_id);

CREATE INDEX idx_bir_project ON public.business_information_requests USING btree (project_id, project_type);

CREATE INDEX idx_bir_status ON public.business_information_requests USING btree (status);

CREATE INDEX idx_logo_design_projects_user_id ON public.logo_design_projects USING btree (user_id);

CREATE INDEX idx_management_analytics_user_id ON public.management_analytics USING btree (user_id);

CREATE INDEX idx_management_google_ads_user_id ON public.management_google_ads USING btree (user_id);

CREATE INDEX idx_management_website_user_id ON public.management_website USING btree (user_id);

CREATE INDEX idx_project_assignments_designer ON public.project_assignments USING btree (designer_id);

CREATE INDEX idx_project_assignments_project ON public.project_assignments USING btree (project_type, project_id);

CREATE INDEX idx_project_notes_designer ON public.project_notes USING btree (designer_id);

CREATE INDEX idx_project_notes_project ON public.project_notes USING btree (project_id, project_type);

CREATE INDEX idx_project_revisions_created_by ON public.project_revisions USING btree (created_by);

CREATE INDEX idx_project_revisions_project ON public.project_revisions USING btree (project_id);

CREATE INDEX idx_project_revisions_status ON public.project_revisions USING btree (status);

CREATE INDEX idx_project_revisions_type ON public.project_revisions USING btree (project_type);

CREATE INDEX idx_revision_files_is_external ON public.revision_files USING btree (is_external);

CREATE INDEX idx_revision_files_mockup_type ON public.revision_files USING btree (mockup_type);

CREATE INDEX idx_revision_files_revision_id ON public.revision_files USING btree (revision_id);

CREATE INDEX idx_revision_files_uploaded_by ON public.revision_files USING btree (uploaded_by);

CREATE INDEX idx_social_graphics_projects_user_id ON public.social_graphics_projects USING btree (user_id);

CREATE INDEX idx_support_messages_sender_id ON public.support_messages USING btree (sender_id);

CREATE INDEX idx_support_messages_ticket_id ON public.support_messages USING btree (ticket_id);

CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets USING btree (assigned_to);

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id);

CREATE INDEX idx_user_files_user_id ON public.user_files USING btree (user_id);

CREATE INDEX idx_web_design_projects_user_id ON public.web_design_projects USING btree (user_id);

CREATE UNIQUE INDEX logo_design_projects_pkey ON public.logo_design_projects USING btree (id);

CREATE UNIQUE INDEX management_analytics_pkey ON public.management_analytics USING btree (id);

CREATE UNIQUE INDEX management_google_ads_pkey ON public.management_google_ads USING btree (id);

CREATE UNIQUE INDEX management_website_pkey ON public.management_website USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX project_assignments_pkey ON public.project_assignments USING btree (id);

CREATE UNIQUE INDEX project_assignments_project_type_project_id_key ON public.project_assignments USING btree (project_type, project_id);

CREATE UNIQUE INDEX project_notes_pkey ON public.project_notes USING btree (id);

CREATE UNIQUE INDEX project_revisions_pkey ON public.project_revisions USING btree (id);

CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (id);

CREATE UNIQUE INDEX revision_comments_pkey ON public.revision_comments USING btree (id);

CREATE UNIQUE INDEX revision_files_pkey ON public.revision_files USING btree (id);

CREATE UNIQUE INDEX revision_notes_pkey ON public.revision_notes USING btree (id);

CREATE UNIQUE INDEX social_graphics_projects_pkey ON public.social_graphics_projects USING btree (id);

CREATE UNIQUE INDEX support_messages_pkey ON public.support_messages USING btree (id);

CREATE UNIQUE INDEX support_tickets_pkey ON public.support_tickets USING btree (id);

CREATE UNIQUE INDEX task_attachments_pkey ON public.task_attachments USING btree (id);

CREATE UNIQUE INDEX task_comments_pkey ON public.task_comments USING btree (id);

CREATE UNIQUE INDEX test_rls_pkey ON public.test_rls USING btree (id);

CREATE UNIQUE INDEX user_files_pkey ON public.user_files USING btree (id);

CREATE UNIQUE INDEX web_design_projects_pkey ON public.web_design_projects USING btree (id);

alter table "public"."billing_invoices" add constraint "billing_invoices_pkey" PRIMARY KEY using index "billing_invoices_pkey";

alter table "public"."bir_file" add constraint "bir_file_pkey" PRIMARY KEY using index "bir_file_pkey";

alter table "public"."business_information_requests" add constraint "business_information_requests_pkey" PRIMARY KEY using index "business_information_requests_pkey";

alter table "public"."business_profiles" add constraint "business_profiles_pkey" PRIMARY KEY using index "business_profiles_pkey";

alter table "public"."designer_projects" add constraint "designer_projects_pkey" PRIMARY KEY using index "designer_projects_pkey";

alter table "public"."designer_tasks" add constraint "designer_tasks_pkey" PRIMARY KEY using index "designer_tasks_pkey";

alter table "public"."logo_design_projects" add constraint "logo_design_projects_pkey" PRIMARY KEY using index "logo_design_projects_pkey";

alter table "public"."management_analytics" add constraint "management_analytics_pkey" PRIMARY KEY using index "management_analytics_pkey";

alter table "public"."management_google_ads" add constraint "management_google_ads_pkey" PRIMARY KEY using index "management_google_ads_pkey";

alter table "public"."management_website" add constraint "management_website_pkey" PRIMARY KEY using index "management_website_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."project_assignments" add constraint "project_assignments_pkey" PRIMARY KEY using index "project_assignments_pkey";

alter table "public"."project_notes" add constraint "project_notes_pkey" PRIMARY KEY using index "project_notes_pkey";

alter table "public"."project_revisions" add constraint "project_revisions_pkey" PRIMARY KEY using index "project_revisions_pkey";

alter table "public"."projects" add constraint "projects_pkey" PRIMARY KEY using index "projects_pkey";

alter table "public"."revision_comments" add constraint "revision_comments_pkey" PRIMARY KEY using index "revision_comments_pkey";

alter table "public"."revision_files" add constraint "revision_files_pkey" PRIMARY KEY using index "revision_files_pkey";

alter table "public"."revision_notes" add constraint "revision_notes_pkey" PRIMARY KEY using index "revision_notes_pkey";

alter table "public"."social_graphics_projects" add constraint "social_graphics_projects_pkey" PRIMARY KEY using index "social_graphics_projects_pkey";

alter table "public"."support_messages" add constraint "support_messages_pkey" PRIMARY KEY using index "support_messages_pkey";

alter table "public"."support_tickets" add constraint "support_tickets_pkey" PRIMARY KEY using index "support_tickets_pkey";

alter table "public"."task_attachments" add constraint "task_attachments_pkey" PRIMARY KEY using index "task_attachments_pkey";

alter table "public"."task_comments" add constraint "task_comments_pkey" PRIMARY KEY using index "task_comments_pkey";

alter table "public"."test_rls" add constraint "test_rls_pkey" PRIMARY KEY using index "test_rls_pkey";

alter table "public"."user_files" add constraint "user_files_pkey" PRIMARY KEY using index "user_files_pkey";

alter table "public"."web_design_projects" add constraint "web_design_projects_pkey" PRIMARY KEY using index "web_design_projects_pkey";

alter table "public"."billing_invoices" add constraint "billing_invoices_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text, 'failed'::text]))) not valid;

alter table "public"."billing_invoices" validate constraint "billing_invoices_status_check";

alter table "public"."billing_invoices" add constraint "billing_invoices_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."billing_invoices" validate constraint "billing_invoices_user_id_fkey";

alter table "public"."bir_file" add constraint "bir_file_bir_id_fkey" FOREIGN KEY (bir_id) REFERENCES business_information_requests(id) ON DELETE CASCADE not valid;

alter table "public"."bir_file" validate constraint "bir_file_bir_id_fkey";

alter table "public"."bir_file" add constraint "bir_file_storage_path_key" UNIQUE using index "bir_file_storage_path_key";

alter table "public"."business_information_requests" add constraint "business_information_requests_project_id_key" UNIQUE using index "business_information_requests_project_id_key";

alter table "public"."business_information_requests" add constraint "fk_bir_client" FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."business_information_requests" validate constraint "fk_bir_client";

alter table "public"."business_profiles" add constraint "business_profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."business_profiles" validate constraint "business_profiles_id_fkey";

alter table "public"."designer_projects" add constraint "designer_projects_assigned_by_fkey" FOREIGN KEY (assigned_by) REFERENCES auth.users(id) not valid;

alter table "public"."designer_projects" validate constraint "designer_projects_assigned_by_fkey";

alter table "public"."designer_projects" add constraint "designer_projects_designer_id_fkey" FOREIGN KEY (designer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."designer_projects" validate constraint "designer_projects_designer_id_fkey";

alter table "public"."designer_projects" add constraint "designer_projects_designer_id_project_id_project_type_key" UNIQUE using index "designer_projects_designer_id_project_id_project_type_key";

alter table "public"."designer_projects" add constraint "designer_projects_project_type_check" CHECK ((project_type = ANY (ARRAY['web_design'::text, 'logo_design'::text, 'social_graphics'::text]))) not valid;

alter table "public"."designer_projects" validate constraint "designer_projects_project_type_check";

alter table "public"."designer_tasks" add constraint "designer_tasks_designer_id_fkey" FOREIGN KEY (designer_id) REFERENCES auth.users(id) not valid;

alter table "public"."designer_tasks" validate constraint "designer_tasks_designer_id_fkey";

alter table "public"."logo_design_projects" add constraint "logo_design_projects_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'on_hold'::text, 'cancelled'::text]))) not valid;

alter table "public"."logo_design_projects" validate constraint "logo_design_projects_status_check";

alter table "public"."logo_design_projects" add constraint "logo_design_projects_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."logo_design_projects" validate constraint "logo_design_projects_user_id_fkey";

alter table "public"."management_analytics" add constraint "management_analytics_analytics_service_check" CHECK ((analytics_service = ANY (ARRAY['google_analytics'::text, 'matomo'::text, 'plausible'::text, 'other'::text]))) not valid;

alter table "public"."management_analytics" validate constraint "management_analytics_analytics_service_check";

alter table "public"."management_analytics" add constraint "management_analytics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."management_analytics" validate constraint "management_analytics_user_id_fkey";

alter table "public"."management_google_ads" add constraint "management_google_ads_campaign_status_check" CHECK ((campaign_status = ANY (ARRAY['active'::text, 'paused'::text, 'removed'::text]))) not valid;

alter table "public"."management_google_ads" validate constraint "management_google_ads_campaign_status_check";

alter table "public"."management_google_ads" add constraint "management_google_ads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."management_google_ads" validate constraint "management_google_ads_user_id_fkey";

alter table "public"."management_website" add constraint "management_website_ssl_status_check" CHECK ((ssl_status = ANY (ARRAY['active'::text, 'expired'::text, 'none'::text]))) not valid;

alter table "public"."management_website" validate constraint "management_website_ssl_status_check";

alter table "public"."management_website" add constraint "management_website_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."management_website" validate constraint "management_website_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'designer'::text, 'client'::text, 'guest'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."project_assignments" add constraint "project_assignments_assigned_by_id_fkey" FOREIGN KEY (assigned_by_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."project_assignments" validate constraint "project_assignments_assigned_by_id_fkey";

alter table "public"."project_assignments" add constraint "project_assignments_designer_id_fkey" FOREIGN KEY (designer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."project_assignments" validate constraint "project_assignments_designer_id_fkey";

alter table "public"."project_assignments" add constraint "project_assignments_project_type_check" CHECK ((project_type = ANY (ARRAY['web_design'::text, 'logo_design'::text, 'social_graphics'::text]))) not valid;

alter table "public"."project_assignments" validate constraint "project_assignments_project_type_check";

alter table "public"."project_assignments" add constraint "project_assignments_project_type_project_id_key" UNIQUE using index "project_assignments_project_type_project_id_key";

alter table "public"."project_revisions" add constraint "project_revisions_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES auth.users(id) not valid;

alter table "public"."project_revisions" validate constraint "project_revisions_approved_by_fkey";

alter table "public"."project_revisions" add constraint "project_revisions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."project_revisions" validate constraint "project_revisions_created_by_fkey";

alter table "public"."projects" add constraint "projects_client_id_fkey" FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."projects" validate constraint "projects_client_id_fkey";

alter table "public"."projects" add constraint "projects_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."projects" validate constraint "projects_created_by_fkey";

alter table "public"."revision_comments" add constraint "revision_comments_file_id_fkey" FOREIGN KEY (file_id) REFERENCES revision_files(id) ON DELETE SET NULL not valid;

alter table "public"."revision_comments" validate constraint "revision_comments_file_id_fkey";

alter table "public"."revision_comments" add constraint "revision_comments_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES auth.users(id) not valid;

alter table "public"."revision_comments" validate constraint "revision_comments_resolved_by_fkey";

alter table "public"."revision_comments" add constraint "revision_comments_revision_id_fkey" FOREIGN KEY (revision_id) REFERENCES project_revisions(id) ON DELETE CASCADE not valid;

alter table "public"."revision_comments" validate constraint "revision_comments_revision_id_fkey";

alter table "public"."revision_comments" add constraint "revision_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."revision_comments" validate constraint "revision_comments_user_id_fkey";

alter table "public"."revision_files" add constraint "revision_files_mockup_type_check" CHECK ((mockup_type = ANY (ARRAY['image'::text, 'figma'::text, 'wordpress'::text, 'other'::text]))) not valid;

alter table "public"."revision_files" validate constraint "revision_files_mockup_type_check";

alter table "public"."revision_files" add constraint "revision_files_revision_id_fkey" FOREIGN KEY (revision_id) REFERENCES project_revisions(id) ON DELETE CASCADE not valid;

alter table "public"."revision_files" validate constraint "revision_files_revision_id_fkey";

alter table "public"."revision_files" add constraint "revision_files_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."revision_files" validate constraint "revision_files_uploaded_by_fkey";

alter table "public"."revision_notes" add constraint "revision_notes_revision_id_fkey" FOREIGN KEY (revision_id) REFERENCES project_revisions(id) ON DELETE CASCADE not valid;

alter table "public"."revision_notes" validate constraint "revision_notes_revision_id_fkey";

alter table "public"."social_graphics_projects" add constraint "social_graphics_projects_content_type_check" CHECK ((content_type = ANY (ARRAY['post'::text, 'story'::text, 'banner'::text, 'profile'::text, 'ad'::text, 'other'::text]))) not valid;

alter table "public"."social_graphics_projects" validate constraint "social_graphics_projects_content_type_check";

alter table "public"."social_graphics_projects" add constraint "social_graphics_projects_social_platform_check" CHECK ((social_platform = ANY (ARRAY['facebook'::text, 'instagram'::text, 'twitter'::text, 'linkedin'::text, 'tiktok'::text, 'youtube'::text, 'other'::text]))) not valid;

alter table "public"."social_graphics_projects" validate constraint "social_graphics_projects_social_platform_check";

alter table "public"."social_graphics_projects" add constraint "social_graphics_projects_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'on_hold'::text, 'cancelled'::text]))) not valid;

alter table "public"."social_graphics_projects" validate constraint "social_graphics_projects_status_check";

alter table "public"."social_graphics_projects" add constraint "social_graphics_projects_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."social_graphics_projects" validate constraint "social_graphics_projects_user_id_fkey";

alter table "public"."support_messages" add constraint "support_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."support_messages" validate constraint "support_messages_sender_id_fkey";

alter table "public"."support_messages" add constraint "support_messages_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."support_messages" validate constraint "support_messages_ticket_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_assigned_to_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_priority_check";

alter table "public"."support_tickets" add constraint "support_tickets_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text]))) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_status_check";

alter table "public"."support_tickets" add constraint "support_tickets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_user_id_fkey";

alter table "public"."task_attachments" add constraint "task_attachments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."task_attachments" validate constraint "task_attachments_created_by_fkey";

alter table "public"."task_attachments" add constraint "task_attachments_task_id_fkey" FOREIGN KEY (task_id) REFERENCES designer_tasks(id) ON DELETE CASCADE not valid;

alter table "public"."task_attachments" validate constraint "task_attachments_task_id_fkey";

alter table "public"."task_comments" add constraint "task_comments_task_id_fkey" FOREIGN KEY (task_id) REFERENCES designer_tasks(id) ON DELETE CASCADE not valid;

alter table "public"."task_comments" validate constraint "task_comments_task_id_fkey";

alter table "public"."task_comments" add constraint "task_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."task_comments" validate constraint "task_comments_user_id_fkey";

alter table "public"."user_files" add constraint "user_files_project_type_check" CHECK ((project_type = ANY (ARRAY['web_design'::text, 'social_graphics'::text, 'logo_design'::text, 'general'::text, 'other'::text]))) not valid;

alter table "public"."user_files" validate constraint "user_files_project_type_check";

alter table "public"."user_files" add constraint "user_files_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_files" validate constraint "user_files_user_id_fkey";

alter table "public"."web_design_projects" add constraint "web_design_projects_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'on_hold'::text, 'cancelled'::text]))) not valid;

alter table "public"."web_design_projects" validate constraint "web_design_projects_status_check";

alter table "public"."web_design_projects" add constraint "web_design_projects_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."web_design_projects" validate constraint "web_design_projects_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ 
BEGIN 
  DELETE FROM auth.users WHERE id = user_id; 
END; 
$function$
;

create or replace view "public"."admin_profiles" as  SELECT profiles.id,
    profiles.full_name,
    profiles.avatar_url,
    profiles.company,
    profiles.role,
    profiles.phone,
    profiles.created_at,
    profiles.updated_at,
    profiles.business_name,
    profiles.mobile,
    profiles.preferred_contact,
    profiles.address,
    profiles.city,
    profiles.state,
    profiles.zip,
    profiles."position",
    profiles.business_website,
    profiles.website_dashboard_url,
    profiles.email
   FROM profiles;


CREATE OR REPLACE FUNCTION public.admin_update_user_role(user_id uuid, new_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update the auth.users table
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(new_role)
  )
  WHERE id = user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.backfill_missing_profiles()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, role, email, created_at, updated_at)
  SELECT 
    au.id, 
    COALESCE(au.raw_user_meta_data->>'role', 'guest'),
    au.email,
    NOW(),
    NOW()
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_policy_if_not_exists(policy_name text, table_name text, command text, using_expr text DEFAULT NULL::text, check_expr text DEFAULT NULL::text, target_roles text DEFAULT 'public'::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
  DECLARE
    policy_exists BOOLEAN;
    table_exists BOOLEAN;
    target_schema_name TEXT := 'public'; -- Assuming public schema, adjust if needed
  BEGIN
    -- Check if the target table exists in the specified schema
    SELECT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = table_name
        AND n.nspname = target_schema_name
        AND c.relkind IN ('r', 'p') -- 'r' for relation (table), 'p' for partitioned table
    ) INTO table_exists;

    IF NOT table_exists THEN
        RAISE WARNING 'Table %.% not found, skipping policy creation for %', target_schema_name, table_name, policy_name;
        RETURN;
    END IF;

    -- Check if the policy already exists on the specific table using schema and table name
    SELECT EXISTS(
      SELECT 1 FROM pg_policies p -- Use the standard pg_policies view
      WHERE p.policyname = policy_name
      AND p.schemaname = target_schema_name -- Correct check: use schemaname
      AND p.tablename = table_name        -- Correct check: use tablename
    ) INTO policy_exists;

    -- If it doesn't exist, create it
    IF NOT policy_exists THEN
      RAISE NOTICE 'Creating policy "%" on table %.% ...', policy_name, target_schema_name, table_name;
      EXECUTE format(
        -- Ensure schema qualification in the CREATE POLICY statement as well
        'CREATE POLICY %I ON %I.%I FOR %s TO %s %s %s',
        policy_name,
        target_schema_name, -- Schema for the table
        table_name,
        command,
        target_roles, -- Use the parameter for roles
        CASE WHEN using_expr IS NOT NULL AND using_expr <> '' THEN 'USING (' || using_expr || ')' ELSE '' END,
        CASE WHEN check_expr IS NOT NULL AND check_expr <> '' THEN 'WITH CHECK (' || check_expr || ')' ELSE '' END
      );
    ELSE
       RAISE NOTICE 'Policy "%" on table %.% already exists, skipping.', policy_name, target_schema_name, table_name;
    END IF;
  END;
  $function$
;

CREATE OR REPLACE FUNCTION public.create_profile_for_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (
      id,
      role,
      full_name,
      email,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'role', 'guest'),
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enable_rls_if_not_enabled(table_name text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
    DECLARE
      rls_enabled BOOLEAN;
      target_schema_name TEXT := 'public'; -- Assuming public schema, adjust if needed
    BEGIN
      -- Check if RLS is already enabled
      SELECT c.relrowsecurity INTO rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = table_name
      AND n.nspname = target_schema_name; -- Use schema name

      -- If RLS status not found (table missing?), exit gracefully
      IF NOT FOUND THEN
        RAISE WARNING 'Table %.% not found, cannot enable RLS.', target_schema_name, table_name;
        RETURN;
      END IF;

      -- If it's not enabled, enable it
      IF NOT rls_enabled THEN
        RAISE NOTICE 'Enabling RLS on table "%"...', table_name;
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', target_schema_name, table_name); -- Add schema qualification
      ELSE
        RAISE NOTICE 'RLS already enabled on table "%", skipping.', table_name;
      END IF;
    END;
    $function$
;

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Check if profile exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    -- Create new profile with admin role
    INSERT INTO profiles (id, role, created_at, updated_at)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'guest'), NOW(), NOW());
  ELSE
    -- Update existing profile
    UPDATE profiles 
    SET role = COALESCE(NEW.raw_user_meta_data->>'role', 'guest'),
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_profile()
 RETURNS SETOF profiles
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.profiles
  WHERE id = auth.uid();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  -- Call auth_helpers schema function to avoid recursion
  RETURN auth_helpers.get_user_role(user_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_designer_assigned_to_project(d_id uuid, p_id uuid, p_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN auth_helpers.is_designer_assigned_to_project(d_id, p_id, p_type);
END;
$function$
;

create or replace view "public"."safe_profiles" as  SELECT p.id,
    p.role,
    p.email,
    p.full_name,
    p.avatar_url,
    p.created_at,
    p.updated_at
   FROM profiles p;


CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_profile_role_to_auth_users()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Update the auth.users user_metadata with the new role from profiles
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(NEW.role)
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_user_role_with_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE profiles
  SET role = NEW.raw_user_meta_data->>'role'
  WHERE id = NEW.id AND NEW.raw_user_meta_data->>'role' IS NOT NULL;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_timestamp_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_has_access_to_profile(profile_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user's role from auth metadata
  SELECT COALESCE((raw_user_meta_data->>'role')::TEXT, 'unknown')
  INTO user_role
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Check if user has access
  RETURN 
    -- User can access their own profile
    profile_id = auth.uid() OR
    -- Admins can access all profiles
    user_role = 'admin' OR
    -- Designers can access profiles based on project assignments
    (user_role = 'designer' AND EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.web_design_projects wdp ON p.id = wdp.user_id
      JOIN public.project_assignments pa ON wdp.id = pa.project_id 
      WHERE pa.designer_id = auth.uid() AND p.id = profile_id
    ));
END;
$function$
;

grant delete on table "public"."billing_invoices" to "anon";

grant insert on table "public"."billing_invoices" to "anon";

grant references on table "public"."billing_invoices" to "anon";

grant select on table "public"."billing_invoices" to "anon";

grant trigger on table "public"."billing_invoices" to "anon";

grant truncate on table "public"."billing_invoices" to "anon";

grant update on table "public"."billing_invoices" to "anon";

grant delete on table "public"."billing_invoices" to "authenticated";

grant insert on table "public"."billing_invoices" to "authenticated";

grant references on table "public"."billing_invoices" to "authenticated";

grant select on table "public"."billing_invoices" to "authenticated";

grant trigger on table "public"."billing_invoices" to "authenticated";

grant truncate on table "public"."billing_invoices" to "authenticated";

grant update on table "public"."billing_invoices" to "authenticated";

grant delete on table "public"."billing_invoices" to "service_role";

grant insert on table "public"."billing_invoices" to "service_role";

grant references on table "public"."billing_invoices" to "service_role";

grant select on table "public"."billing_invoices" to "service_role";

grant trigger on table "public"."billing_invoices" to "service_role";

grant truncate on table "public"."billing_invoices" to "service_role";

grant update on table "public"."billing_invoices" to "service_role";

grant delete on table "public"."bir_file" to "anon";

grant insert on table "public"."bir_file" to "anon";

grant references on table "public"."bir_file" to "anon";

grant select on table "public"."bir_file" to "anon";

grant trigger on table "public"."bir_file" to "anon";

grant truncate on table "public"."bir_file" to "anon";

grant update on table "public"."bir_file" to "anon";

grant delete on table "public"."bir_file" to "authenticated";

grant insert on table "public"."bir_file" to "authenticated";

grant references on table "public"."bir_file" to "authenticated";

grant select on table "public"."bir_file" to "authenticated";

grant trigger on table "public"."bir_file" to "authenticated";

grant truncate on table "public"."bir_file" to "authenticated";

grant update on table "public"."bir_file" to "authenticated";

grant delete on table "public"."bir_file" to "service_role";

grant insert on table "public"."bir_file" to "service_role";

grant references on table "public"."bir_file" to "service_role";

grant select on table "public"."bir_file" to "service_role";

grant trigger on table "public"."bir_file" to "service_role";

grant truncate on table "public"."bir_file" to "service_role";

grant update on table "public"."bir_file" to "service_role";

grant delete on table "public"."business_information_requests" to "anon";

grant insert on table "public"."business_information_requests" to "anon";

grant references on table "public"."business_information_requests" to "anon";

grant select on table "public"."business_information_requests" to "anon";

grant trigger on table "public"."business_information_requests" to "anon";

grant truncate on table "public"."business_information_requests" to "anon";

grant update on table "public"."business_information_requests" to "anon";

grant delete on table "public"."business_information_requests" to "authenticated";

grant insert on table "public"."business_information_requests" to "authenticated";

grant references on table "public"."business_information_requests" to "authenticated";

grant select on table "public"."business_information_requests" to "authenticated";

grant trigger on table "public"."business_information_requests" to "authenticated";

grant truncate on table "public"."business_information_requests" to "authenticated";

grant update on table "public"."business_information_requests" to "authenticated";

grant delete on table "public"."business_information_requests" to "service_role";

grant insert on table "public"."business_information_requests" to "service_role";

grant references on table "public"."business_information_requests" to "service_role";

grant select on table "public"."business_information_requests" to "service_role";

grant trigger on table "public"."business_information_requests" to "service_role";

grant truncate on table "public"."business_information_requests" to "service_role";

grant update on table "public"."business_information_requests" to "service_role";

grant delete on table "public"."business_profiles" to "anon";

grant insert on table "public"."business_profiles" to "anon";

grant references on table "public"."business_profiles" to "anon";

grant select on table "public"."business_profiles" to "anon";

grant trigger on table "public"."business_profiles" to "anon";

grant truncate on table "public"."business_profiles" to "anon";

grant update on table "public"."business_profiles" to "anon";

grant delete on table "public"."business_profiles" to "authenticated";

grant insert on table "public"."business_profiles" to "authenticated";

grant references on table "public"."business_profiles" to "authenticated";

grant select on table "public"."business_profiles" to "authenticated";

grant trigger on table "public"."business_profiles" to "authenticated";

grant truncate on table "public"."business_profiles" to "authenticated";

grant update on table "public"."business_profiles" to "authenticated";

grant delete on table "public"."business_profiles" to "service_role";

grant insert on table "public"."business_profiles" to "service_role";

grant references on table "public"."business_profiles" to "service_role";

grant select on table "public"."business_profiles" to "service_role";

grant trigger on table "public"."business_profiles" to "service_role";

grant truncate on table "public"."business_profiles" to "service_role";

grant update on table "public"."business_profiles" to "service_role";

grant delete on table "public"."designer_projects" to "anon";

grant insert on table "public"."designer_projects" to "anon";

grant references on table "public"."designer_projects" to "anon";

grant select on table "public"."designer_projects" to "anon";

grant trigger on table "public"."designer_projects" to "anon";

grant truncate on table "public"."designer_projects" to "anon";

grant update on table "public"."designer_projects" to "anon";

grant delete on table "public"."designer_projects" to "authenticated";

grant insert on table "public"."designer_projects" to "authenticated";

grant references on table "public"."designer_projects" to "authenticated";

grant select on table "public"."designer_projects" to "authenticated";

grant trigger on table "public"."designer_projects" to "authenticated";

grant truncate on table "public"."designer_projects" to "authenticated";

grant update on table "public"."designer_projects" to "authenticated";

grant delete on table "public"."designer_projects" to "service_role";

grant insert on table "public"."designer_projects" to "service_role";

grant references on table "public"."designer_projects" to "service_role";

grant select on table "public"."designer_projects" to "service_role";

grant trigger on table "public"."designer_projects" to "service_role";

grant truncate on table "public"."designer_projects" to "service_role";

grant update on table "public"."designer_projects" to "service_role";

grant delete on table "public"."designer_tasks" to "anon";

grant insert on table "public"."designer_tasks" to "anon";

grant references on table "public"."designer_tasks" to "anon";

grant select on table "public"."designer_tasks" to "anon";

grant trigger on table "public"."designer_tasks" to "anon";

grant truncate on table "public"."designer_tasks" to "anon";

grant update on table "public"."designer_tasks" to "anon";

grant delete on table "public"."designer_tasks" to "authenticated";

grant insert on table "public"."designer_tasks" to "authenticated";

grant references on table "public"."designer_tasks" to "authenticated";

grant select on table "public"."designer_tasks" to "authenticated";

grant trigger on table "public"."designer_tasks" to "authenticated";

grant truncate on table "public"."designer_tasks" to "authenticated";

grant update on table "public"."designer_tasks" to "authenticated";

grant delete on table "public"."designer_tasks" to "service_role";

grant insert on table "public"."designer_tasks" to "service_role";

grant references on table "public"."designer_tasks" to "service_role";

grant select on table "public"."designer_tasks" to "service_role";

grant trigger on table "public"."designer_tasks" to "service_role";

grant truncate on table "public"."designer_tasks" to "service_role";

grant update on table "public"."designer_tasks" to "service_role";

grant delete on table "public"."logo_design_projects" to "anon";

grant insert on table "public"."logo_design_projects" to "anon";

grant references on table "public"."logo_design_projects" to "anon";

grant select on table "public"."logo_design_projects" to "anon";

grant trigger on table "public"."logo_design_projects" to "anon";

grant truncate on table "public"."logo_design_projects" to "anon";

grant update on table "public"."logo_design_projects" to "anon";

grant delete on table "public"."logo_design_projects" to "authenticated";

grant insert on table "public"."logo_design_projects" to "authenticated";

grant references on table "public"."logo_design_projects" to "authenticated";

grant select on table "public"."logo_design_projects" to "authenticated";

grant trigger on table "public"."logo_design_projects" to "authenticated";

grant truncate on table "public"."logo_design_projects" to "authenticated";

grant update on table "public"."logo_design_projects" to "authenticated";

grant delete on table "public"."logo_design_projects" to "service_role";

grant insert on table "public"."logo_design_projects" to "service_role";

grant references on table "public"."logo_design_projects" to "service_role";

grant select on table "public"."logo_design_projects" to "service_role";

grant trigger on table "public"."logo_design_projects" to "service_role";

grant truncate on table "public"."logo_design_projects" to "service_role";

grant update on table "public"."logo_design_projects" to "service_role";

grant delete on table "public"."management_analytics" to "anon";

grant insert on table "public"."management_analytics" to "anon";

grant references on table "public"."management_analytics" to "anon";

grant select on table "public"."management_analytics" to "anon";

grant trigger on table "public"."management_analytics" to "anon";

grant truncate on table "public"."management_analytics" to "anon";

grant update on table "public"."management_analytics" to "anon";

grant delete on table "public"."management_analytics" to "authenticated";

grant insert on table "public"."management_analytics" to "authenticated";

grant references on table "public"."management_analytics" to "authenticated";

grant select on table "public"."management_analytics" to "authenticated";

grant trigger on table "public"."management_analytics" to "authenticated";

grant truncate on table "public"."management_analytics" to "authenticated";

grant update on table "public"."management_analytics" to "authenticated";

grant delete on table "public"."management_analytics" to "service_role";

grant insert on table "public"."management_analytics" to "service_role";

grant references on table "public"."management_analytics" to "service_role";

grant select on table "public"."management_analytics" to "service_role";

grant trigger on table "public"."management_analytics" to "service_role";

grant truncate on table "public"."management_analytics" to "service_role";

grant update on table "public"."management_analytics" to "service_role";

grant delete on table "public"."management_google_ads" to "anon";

grant insert on table "public"."management_google_ads" to "anon";

grant references on table "public"."management_google_ads" to "anon";

grant select on table "public"."management_google_ads" to "anon";

grant trigger on table "public"."management_google_ads" to "anon";

grant truncate on table "public"."management_google_ads" to "anon";

grant update on table "public"."management_google_ads" to "anon";

grant delete on table "public"."management_google_ads" to "authenticated";

grant insert on table "public"."management_google_ads" to "authenticated";

grant references on table "public"."management_google_ads" to "authenticated";

grant select on table "public"."management_google_ads" to "authenticated";

grant trigger on table "public"."management_google_ads" to "authenticated";

grant truncate on table "public"."management_google_ads" to "authenticated";

grant update on table "public"."management_google_ads" to "authenticated";

grant delete on table "public"."management_google_ads" to "service_role";

grant insert on table "public"."management_google_ads" to "service_role";

grant references on table "public"."management_google_ads" to "service_role";

grant select on table "public"."management_google_ads" to "service_role";

grant trigger on table "public"."management_google_ads" to "service_role";

grant truncate on table "public"."management_google_ads" to "service_role";

grant update on table "public"."management_google_ads" to "service_role";

grant delete on table "public"."management_website" to "anon";

grant insert on table "public"."management_website" to "anon";

grant references on table "public"."management_website" to "anon";

grant select on table "public"."management_website" to "anon";

grant trigger on table "public"."management_website" to "anon";

grant truncate on table "public"."management_website" to "anon";

grant update on table "public"."management_website" to "anon";

grant delete on table "public"."management_website" to "authenticated";

grant insert on table "public"."management_website" to "authenticated";

grant references on table "public"."management_website" to "authenticated";

grant select on table "public"."management_website" to "authenticated";

grant trigger on table "public"."management_website" to "authenticated";

grant truncate on table "public"."management_website" to "authenticated";

grant update on table "public"."management_website" to "authenticated";

grant delete on table "public"."management_website" to "service_role";

grant insert on table "public"."management_website" to "service_role";

grant references on table "public"."management_website" to "service_role";

grant select on table "public"."management_website" to "service_role";

grant trigger on table "public"."management_website" to "service_role";

grant truncate on table "public"."management_website" to "service_role";

grant update on table "public"."management_website" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."project_assignments" to "anon";

grant insert on table "public"."project_assignments" to "anon";

grant references on table "public"."project_assignments" to "anon";

grant select on table "public"."project_assignments" to "anon";

grant trigger on table "public"."project_assignments" to "anon";

grant truncate on table "public"."project_assignments" to "anon";

grant update on table "public"."project_assignments" to "anon";

grant delete on table "public"."project_assignments" to "authenticated";

grant insert on table "public"."project_assignments" to "authenticated";

grant references on table "public"."project_assignments" to "authenticated";

grant select on table "public"."project_assignments" to "authenticated";

grant trigger on table "public"."project_assignments" to "authenticated";

grant truncate on table "public"."project_assignments" to "authenticated";

grant update on table "public"."project_assignments" to "authenticated";

grant delete on table "public"."project_assignments" to "service_role";

grant insert on table "public"."project_assignments" to "service_role";

grant references on table "public"."project_assignments" to "service_role";

grant select on table "public"."project_assignments" to "service_role";

grant trigger on table "public"."project_assignments" to "service_role";

grant truncate on table "public"."project_assignments" to "service_role";

grant update on table "public"."project_assignments" to "service_role";

grant delete on table "public"."project_notes" to "anon";

grant insert on table "public"."project_notes" to "anon";

grant references on table "public"."project_notes" to "anon";

grant select on table "public"."project_notes" to "anon";

grant trigger on table "public"."project_notes" to "anon";

grant truncate on table "public"."project_notes" to "anon";

grant update on table "public"."project_notes" to "anon";

grant delete on table "public"."project_notes" to "authenticated";

grant insert on table "public"."project_notes" to "authenticated";

grant references on table "public"."project_notes" to "authenticated";

grant select on table "public"."project_notes" to "authenticated";

grant trigger on table "public"."project_notes" to "authenticated";

grant truncate on table "public"."project_notes" to "authenticated";

grant update on table "public"."project_notes" to "authenticated";

grant delete on table "public"."project_notes" to "service_role";

grant insert on table "public"."project_notes" to "service_role";

grant references on table "public"."project_notes" to "service_role";

grant select on table "public"."project_notes" to "service_role";

grant trigger on table "public"."project_notes" to "service_role";

grant truncate on table "public"."project_notes" to "service_role";

grant update on table "public"."project_notes" to "service_role";

grant delete on table "public"."project_revisions" to "anon";

grant insert on table "public"."project_revisions" to "anon";

grant references on table "public"."project_revisions" to "anon";

grant select on table "public"."project_revisions" to "anon";

grant trigger on table "public"."project_revisions" to "anon";

grant truncate on table "public"."project_revisions" to "anon";

grant update on table "public"."project_revisions" to "anon";

grant delete on table "public"."project_revisions" to "authenticated";

grant insert on table "public"."project_revisions" to "authenticated";

grant references on table "public"."project_revisions" to "authenticated";

grant select on table "public"."project_revisions" to "authenticated";

grant trigger on table "public"."project_revisions" to "authenticated";

grant truncate on table "public"."project_revisions" to "authenticated";

grant update on table "public"."project_revisions" to "authenticated";

grant delete on table "public"."project_revisions" to "service_role";

grant insert on table "public"."project_revisions" to "service_role";

grant references on table "public"."project_revisions" to "service_role";

grant select on table "public"."project_revisions" to "service_role";

grant trigger on table "public"."project_revisions" to "service_role";

grant truncate on table "public"."project_revisions" to "service_role";

grant update on table "public"."project_revisions" to "service_role";

grant delete on table "public"."projects" to "anon";

grant insert on table "public"."projects" to "anon";

grant references on table "public"."projects" to "anon";

grant select on table "public"."projects" to "anon";

grant trigger on table "public"."projects" to "anon";

grant truncate on table "public"."projects" to "anon";

grant update on table "public"."projects" to "anon";

grant delete on table "public"."projects" to "authenticated";

grant insert on table "public"."projects" to "authenticated";

grant references on table "public"."projects" to "authenticated";

grant select on table "public"."projects" to "authenticated";

grant trigger on table "public"."projects" to "authenticated";

grant truncate on table "public"."projects" to "authenticated";

grant update on table "public"."projects" to "authenticated";

grant delete on table "public"."projects" to "service_role";

grant insert on table "public"."projects" to "service_role";

grant references on table "public"."projects" to "service_role";

grant select on table "public"."projects" to "service_role";

grant trigger on table "public"."projects" to "service_role";

grant truncate on table "public"."projects" to "service_role";

grant update on table "public"."projects" to "service_role";

grant delete on table "public"."revision_comments" to "anon";

grant insert on table "public"."revision_comments" to "anon";

grant references on table "public"."revision_comments" to "anon";

grant select on table "public"."revision_comments" to "anon";

grant trigger on table "public"."revision_comments" to "anon";

grant truncate on table "public"."revision_comments" to "anon";

grant update on table "public"."revision_comments" to "anon";

grant delete on table "public"."revision_comments" to "authenticated";

grant insert on table "public"."revision_comments" to "authenticated";

grant references on table "public"."revision_comments" to "authenticated";

grant select on table "public"."revision_comments" to "authenticated";

grant trigger on table "public"."revision_comments" to "authenticated";

grant truncate on table "public"."revision_comments" to "authenticated";

grant update on table "public"."revision_comments" to "authenticated";

grant delete on table "public"."revision_comments" to "service_role";

grant insert on table "public"."revision_comments" to "service_role";

grant references on table "public"."revision_comments" to "service_role";

grant select on table "public"."revision_comments" to "service_role";

grant trigger on table "public"."revision_comments" to "service_role";

grant truncate on table "public"."revision_comments" to "service_role";

grant update on table "public"."revision_comments" to "service_role";

grant delete on table "public"."revision_files" to "anon";

grant insert on table "public"."revision_files" to "anon";

grant references on table "public"."revision_files" to "anon";

grant select on table "public"."revision_files" to "anon";

grant trigger on table "public"."revision_files" to "anon";

grant truncate on table "public"."revision_files" to "anon";

grant update on table "public"."revision_files" to "anon";

grant delete on table "public"."revision_files" to "authenticated";

grant insert on table "public"."revision_files" to "authenticated";

grant references on table "public"."revision_files" to "authenticated";

grant select on table "public"."revision_files" to "authenticated";

grant trigger on table "public"."revision_files" to "authenticated";

grant truncate on table "public"."revision_files" to "authenticated";

grant update on table "public"."revision_files" to "authenticated";

grant delete on table "public"."revision_files" to "service_role";

grant insert on table "public"."revision_files" to "service_role";

grant references on table "public"."revision_files" to "service_role";

grant select on table "public"."revision_files" to "service_role";

grant trigger on table "public"."revision_files" to "service_role";

grant truncate on table "public"."revision_files" to "service_role";

grant update on table "public"."revision_files" to "service_role";

grant delete on table "public"."revision_notes" to "anon";

grant insert on table "public"."revision_notes" to "anon";

grant references on table "public"."revision_notes" to "anon";

grant select on table "public"."revision_notes" to "anon";

grant trigger on table "public"."revision_notes" to "anon";

grant truncate on table "public"."revision_notes" to "anon";

grant update on table "public"."revision_notes" to "anon";

grant delete on table "public"."revision_notes" to "authenticated";

grant insert on table "public"."revision_notes" to "authenticated";

grant references on table "public"."revision_notes" to "authenticated";

grant select on table "public"."revision_notes" to "authenticated";

grant trigger on table "public"."revision_notes" to "authenticated";

grant truncate on table "public"."revision_notes" to "authenticated";

grant update on table "public"."revision_notes" to "authenticated";

grant delete on table "public"."revision_notes" to "service_role";

grant insert on table "public"."revision_notes" to "service_role";

grant references on table "public"."revision_notes" to "service_role";

grant select on table "public"."revision_notes" to "service_role";

grant trigger on table "public"."revision_notes" to "service_role";

grant truncate on table "public"."revision_notes" to "service_role";

grant update on table "public"."revision_notes" to "service_role";

grant delete on table "public"."social_graphics_projects" to "anon";

grant insert on table "public"."social_graphics_projects" to "anon";

grant references on table "public"."social_graphics_projects" to "anon";

grant select on table "public"."social_graphics_projects" to "anon";

grant trigger on table "public"."social_graphics_projects" to "anon";

grant truncate on table "public"."social_graphics_projects" to "anon";

grant update on table "public"."social_graphics_projects" to "anon";

grant delete on table "public"."social_graphics_projects" to "authenticated";

grant insert on table "public"."social_graphics_projects" to "authenticated";

grant references on table "public"."social_graphics_projects" to "authenticated";

grant select on table "public"."social_graphics_projects" to "authenticated";

grant trigger on table "public"."social_graphics_projects" to "authenticated";

grant truncate on table "public"."social_graphics_projects" to "authenticated";

grant update on table "public"."social_graphics_projects" to "authenticated";

grant delete on table "public"."social_graphics_projects" to "service_role";

grant insert on table "public"."social_graphics_projects" to "service_role";

grant references on table "public"."social_graphics_projects" to "service_role";

grant select on table "public"."social_graphics_projects" to "service_role";

grant trigger on table "public"."social_graphics_projects" to "service_role";

grant truncate on table "public"."social_graphics_projects" to "service_role";

grant update on table "public"."social_graphics_projects" to "service_role";

grant delete on table "public"."support_messages" to "anon";

grant insert on table "public"."support_messages" to "anon";

grant references on table "public"."support_messages" to "anon";

grant select on table "public"."support_messages" to "anon";

grant trigger on table "public"."support_messages" to "anon";

grant truncate on table "public"."support_messages" to "anon";

grant update on table "public"."support_messages" to "anon";

grant delete on table "public"."support_messages" to "authenticated";

grant insert on table "public"."support_messages" to "authenticated";

grant references on table "public"."support_messages" to "authenticated";

grant select on table "public"."support_messages" to "authenticated";

grant trigger on table "public"."support_messages" to "authenticated";

grant truncate on table "public"."support_messages" to "authenticated";

grant update on table "public"."support_messages" to "authenticated";

grant delete on table "public"."support_messages" to "service_role";

grant insert on table "public"."support_messages" to "service_role";

grant references on table "public"."support_messages" to "service_role";

grant select on table "public"."support_messages" to "service_role";

grant trigger on table "public"."support_messages" to "service_role";

grant truncate on table "public"."support_messages" to "service_role";

grant update on table "public"."support_messages" to "service_role";

grant delete on table "public"."support_tickets" to "anon";

grant insert on table "public"."support_tickets" to "anon";

grant references on table "public"."support_tickets" to "anon";

grant select on table "public"."support_tickets" to "anon";

grant trigger on table "public"."support_tickets" to "anon";

grant truncate on table "public"."support_tickets" to "anon";

grant update on table "public"."support_tickets" to "anon";

grant delete on table "public"."support_tickets" to "authenticated";

grant insert on table "public"."support_tickets" to "authenticated";

grant references on table "public"."support_tickets" to "authenticated";

grant select on table "public"."support_tickets" to "authenticated";

grant trigger on table "public"."support_tickets" to "authenticated";

grant truncate on table "public"."support_tickets" to "authenticated";

grant update on table "public"."support_tickets" to "authenticated";

grant delete on table "public"."support_tickets" to "service_role";

grant insert on table "public"."support_tickets" to "service_role";

grant references on table "public"."support_tickets" to "service_role";

grant select on table "public"."support_tickets" to "service_role";

grant trigger on table "public"."support_tickets" to "service_role";

grant truncate on table "public"."support_tickets" to "service_role";

grant update on table "public"."support_tickets" to "service_role";

grant delete on table "public"."task_attachments" to "anon";

grant insert on table "public"."task_attachments" to "anon";

grant references on table "public"."task_attachments" to "anon";

grant select on table "public"."task_attachments" to "anon";

grant trigger on table "public"."task_attachments" to "anon";

grant truncate on table "public"."task_attachments" to "anon";

grant update on table "public"."task_attachments" to "anon";

grant delete on table "public"."task_attachments" to "authenticated";

grant insert on table "public"."task_attachments" to "authenticated";

grant references on table "public"."task_attachments" to "authenticated";

grant select on table "public"."task_attachments" to "authenticated";

grant trigger on table "public"."task_attachments" to "authenticated";

grant truncate on table "public"."task_attachments" to "authenticated";

grant update on table "public"."task_attachments" to "authenticated";

grant delete on table "public"."task_attachments" to "service_role";

grant insert on table "public"."task_attachments" to "service_role";

grant references on table "public"."task_attachments" to "service_role";

grant select on table "public"."task_attachments" to "service_role";

grant trigger on table "public"."task_attachments" to "service_role";

grant truncate on table "public"."task_attachments" to "service_role";

grant update on table "public"."task_attachments" to "service_role";

grant delete on table "public"."task_comments" to "anon";

grant insert on table "public"."task_comments" to "anon";

grant references on table "public"."task_comments" to "anon";

grant select on table "public"."task_comments" to "anon";

grant trigger on table "public"."task_comments" to "anon";

grant truncate on table "public"."task_comments" to "anon";

grant update on table "public"."task_comments" to "anon";

grant delete on table "public"."task_comments" to "authenticated";

grant insert on table "public"."task_comments" to "authenticated";

grant references on table "public"."task_comments" to "authenticated";

grant select on table "public"."task_comments" to "authenticated";

grant trigger on table "public"."task_comments" to "authenticated";

grant truncate on table "public"."task_comments" to "authenticated";

grant update on table "public"."task_comments" to "authenticated";

grant delete on table "public"."task_comments" to "service_role";

grant insert on table "public"."task_comments" to "service_role";

grant references on table "public"."task_comments" to "service_role";

grant select on table "public"."task_comments" to "service_role";

grant trigger on table "public"."task_comments" to "service_role";

grant truncate on table "public"."task_comments" to "service_role";

grant update on table "public"."task_comments" to "service_role";

grant delete on table "public"."test_rls" to "anon";

grant insert on table "public"."test_rls" to "anon";

grant references on table "public"."test_rls" to "anon";

grant select on table "public"."test_rls" to "anon";

grant trigger on table "public"."test_rls" to "anon";

grant truncate on table "public"."test_rls" to "anon";

grant update on table "public"."test_rls" to "anon";

grant delete on table "public"."test_rls" to "authenticated";

grant insert on table "public"."test_rls" to "authenticated";

grant references on table "public"."test_rls" to "authenticated";

grant select on table "public"."test_rls" to "authenticated";

grant trigger on table "public"."test_rls" to "authenticated";

grant truncate on table "public"."test_rls" to "authenticated";

grant update on table "public"."test_rls" to "authenticated";

grant delete on table "public"."test_rls" to "service_role";

grant insert on table "public"."test_rls" to "service_role";

grant references on table "public"."test_rls" to "service_role";

grant select on table "public"."test_rls" to "service_role";

grant trigger on table "public"."test_rls" to "service_role";

grant truncate on table "public"."test_rls" to "service_role";

grant update on table "public"."test_rls" to "service_role";

grant delete on table "public"."user_files" to "anon";

grant insert on table "public"."user_files" to "anon";

grant references on table "public"."user_files" to "anon";

grant select on table "public"."user_files" to "anon";

grant trigger on table "public"."user_files" to "anon";

grant truncate on table "public"."user_files" to "anon";

grant update on table "public"."user_files" to "anon";

grant delete on table "public"."user_files" to "authenticated";

grant insert on table "public"."user_files" to "authenticated";

grant references on table "public"."user_files" to "authenticated";

grant select on table "public"."user_files" to "authenticated";

grant trigger on table "public"."user_files" to "authenticated";

grant truncate on table "public"."user_files" to "authenticated";

grant update on table "public"."user_files" to "authenticated";

grant delete on table "public"."user_files" to "service_role";

grant insert on table "public"."user_files" to "service_role";

grant references on table "public"."user_files" to "service_role";

grant select on table "public"."user_files" to "service_role";

grant trigger on table "public"."user_files" to "service_role";

grant truncate on table "public"."user_files" to "service_role";

grant update on table "public"."user_files" to "service_role";

grant delete on table "public"."web_design_projects" to "anon";

grant insert on table "public"."web_design_projects" to "anon";

grant references on table "public"."web_design_projects" to "anon";

grant select on table "public"."web_design_projects" to "anon";

grant trigger on table "public"."web_design_projects" to "anon";

grant truncate on table "public"."web_design_projects" to "anon";

grant update on table "public"."web_design_projects" to "anon";

grant delete on table "public"."web_design_projects" to "authenticated";

grant insert on table "public"."web_design_projects" to "authenticated";

grant references on table "public"."web_design_projects" to "authenticated";

grant select on table "public"."web_design_projects" to "authenticated";

grant trigger on table "public"."web_design_projects" to "authenticated";

grant truncate on table "public"."web_design_projects" to "authenticated";

grant update on table "public"."web_design_projects" to "authenticated";

grant delete on table "public"."web_design_projects" to "service_role";

grant insert on table "public"."web_design_projects" to "service_role";

grant references on table "public"."web_design_projects" to "service_role";

grant select on table "public"."web_design_projects" to "service_role";

grant trigger on table "public"."web_design_projects" to "service_role";

grant truncate on table "public"."web_design_projects" to "service_role";

grant update on table "public"."web_design_projects" to "service_role";

create policy "client can delete own file"
on "public"."bir_file"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM business_information_requests bir
  WHERE ((bir.id = bir_file.bir_id) AND (bir.client_id = auth.uid())))));


create policy "client can read own files"
on "public"."bir_file"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM business_information_requests bir
  WHERE ((bir.id = bir_file.bir_id) AND (bir.client_id = auth.uid())))));


create policy "client can update own file"
on "public"."bir_file"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM business_information_requests bir
  WHERE ((bir.id = bir_file.bir_id) AND (bir.client_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM business_information_requests bir
  WHERE ((bir.id = bir_file.bir_id) AND (bir.client_id = auth.uid())))));


create policy "client can upload file to own BIR"
on "public"."bir_file"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM business_information_requests bir
  WHERE ((bir.id = bir_file.bir_id) AND (bir.client_id = auth.uid())))));


create policy "bir_admin_all"
on "public"."business_information_requests"
as permissive
for all
to public
using ((get_user_role(auth.uid()) = 'admin'::text));


create policy "bir_client_rw"
on "public"."business_information_requests"
as permissive
for all
to public
using (((get_user_role(auth.uid()) = 'client'::text) AND (client_id = auth.uid())));


create policy "bir_designer_read"
on "public"."business_information_requests"
as permissive
for select
to public
using (((get_user_role(auth.uid()) = 'designer'::text) AND is_designer_assigned_to_project(auth.uid(), project_id, project_type)));


create policy "Users can insert own business profile"
on "public"."business_profiles"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "Users can update own business profile"
on "public"."business_profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can view own business profile"
on "public"."business_profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "TEMP Allow assigned designer SELECT"
on "public"."designer_tasks"
as permissive
for select
to authenticated
using ((designer_id = auth.uid()));


create policy "Designers can view assigned logo design projects"
on "public"."logo_design_projects"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM designer_projects
  WHERE ((designer_projects.project_id = logo_design_projects.id) AND (designer_projects.project_type = 'logo_design'::text) AND (designer_projects.designer_id = auth.uid())))));


create policy "TEMP Allow assigned designer SELECT logo"
on "public"."logo_design_projects"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM project_assignments pa
  WHERE ((pa.designer_id = auth.uid()) AND (pa.project_id = logo_design_projects.id) AND (pa.project_type = 'logo_design'::text)))));


create policy "Users can insert own logo design projects"
on "public"."logo_design_projects"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own logo design projects"
on "public"."logo_design_projects"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view own logo design projects"
on "public"."logo_design_projects"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Admins can access all profiles"
on "public"."profiles"
as permissive
for all
to authenticated
using ((auth_helpers.get_user_role(auth.uid()) = 'admin'::text));


create policy "Designers can view assigned client profiles"
on "public"."profiles"
as permissive
for select
to authenticated
using (((auth_helpers.get_user_role(auth.uid()) = 'designer'::text) AND (role = 'client'::text) AND (EXISTS ( SELECT 1
   FROM project_assignments pa
  WHERE ((pa.designer_id = auth.uid()) AND ((EXISTS ( SELECT 1
           FROM web_design_projects wdp
          WHERE ((wdp.id = pa.project_id) AND (pa.project_type = 'web_design'::text) AND (wdp.user_id = profiles.id)))) OR (EXISTS ( SELECT 1
           FROM logo_design_projects ldp
          WHERE ((ldp.id = pa.project_id) AND (pa.project_type = 'logo_design'::text) AND (ldp.user_id = profiles.id)))) OR (EXISTS ( SELECT 1
           FROM social_graphics_projects sgp
          WHERE ((sgp.id = pa.project_id) AND (pa.project_type = 'social_graphics'::text) AND (sgp.user_id = profiles.id))))))))));


create policy "Users can update own profile"
on "public"."profiles"
as permissive
for update
to authenticated
using ((id = auth.uid()))
with check ((id = auth.uid()));


create policy "Users can view own profile"
on "public"."profiles"
as permissive
for select
to authenticated
using ((id = auth.uid()));


create policy "TEMP Allow assigned designer SELECT assignments"
on "public"."project_assignments"
as permissive
for select
to authenticated
using ((designer_id = auth.uid()));


create policy "Designers can create notes for their projects"
on "public"."project_notes"
as permissive
for insert
to public
with check (((designer_id = auth.uid()) AND (project_id IN ( SELECT designer_projects.project_id
   FROM designer_projects
  WHERE ((designer_projects.designer_id = auth.uid()) AND (designer_projects.project_type = project_notes.project_type))))));


create policy "Designers can delete their own notes"
on "public"."project_notes"
as permissive
for delete
to public
using ((designer_id = auth.uid()));


create policy "Designers can update their own notes"
on "public"."project_notes"
as permissive
for update
to public
using ((designer_id = auth.uid()));


create policy "Project owners can view their notes"
on "public"."project_notes"
as permissive
for select
to public
using (((project_id IN ( SELECT web_design_projects.id
   FROM web_design_projects
  WHERE (web_design_projects.user_id = auth.uid())
UNION ALL
 SELECT logo_design_projects.id
   FROM logo_design_projects
  WHERE (logo_design_projects.user_id = auth.uid())
UNION ALL
 SELECT social_graphics_projects.id
   FROM social_graphics_projects
  WHERE (social_graphics_projects.user_id = auth.uid()))) OR (designer_id = auth.uid())));


create policy "admin_all"
on "public"."project_revisions"
as permissive
for all
to authenticated
using (((auth.jwt() ->> 'role'::text) = 'admin'::text));


create policy "client_select"
on "public"."project_revisions"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = project_revisions.project_id) AND (p.client_id = auth.uid())))));


create policy "designer_all"
on "public"."project_revisions"
as permissive
for all
to authenticated
using (((auth.jwt() ->> 'role'::text) = 'designer'::text));


create policy "Admins have full access to projects"
on "public"."projects"
as permissive
for all
to public
using ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));


create policy "Clients can view their projects"
on "public"."projects"
as permissive
for select
to public
using (((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'client'::text) AND (client_id = auth.uid())));


create policy "Designers can access their projects"
on "public"."projects"
as permissive
for all
to public
using (((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'designer'::text) AND ((created_by = auth.uid()) OR (client_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.role = 'client'::text))))));


create policy "admin_all_comments"
on "public"."revision_comments"
as permissive
for all
to authenticated
using (((auth.jwt() ->> 'role'::text) = 'admin'::text));


create policy "user_own_comments"
on "public"."revision_comments"
as permissive
for all
to authenticated
using ((user_id = auth.uid()));


create policy "user_view_comments"
on "public"."revision_comments"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (project_revisions pr
     JOIN projects p ON ((pr.project_id = p.id)))
  WHERE ((pr.id = revision_comments.revision_id) AND ((p.client_id = auth.uid()) OR ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'designer'::text])))))));


create policy "Allow authenticated users to delete their own files"
on "public"."revision_files"
as permissive
for delete
to authenticated
using (true);


create policy "Allow authenticated users to insert files"
on "public"."revision_files"
as permissive
for insert
to authenticated
with check (true);


create policy "Allow authenticated users to update their own files"
on "public"."revision_files"
as permissive
for update
to authenticated
using (true)
with check (true);


create policy "Allow authenticated users to view files"
on "public"."revision_files"
as permissive
for select
to authenticated
using (true);


create policy "admin_all_files"
on "public"."revision_files"
as permissive
for all
to authenticated
using (((auth.jwt() ->> 'role'::text) = 'admin'::text));


create policy "client_select_files"
on "public"."revision_files"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (project_revisions pr
     JOIN projects p ON ((pr.project_id = p.id)))
  WHERE ((pr.id = revision_files.revision_id) AND (p.client_id = auth.uid())))));


create policy "designer_all_files"
on "public"."revision_files"
as permissive
for all
to authenticated
using (((auth.jwt() ->> 'role'::text) = 'designer'::text));


create policy "Allow full access for authenticated users"
on "public"."revision_notes"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Designers can view assigned social graphics projects"
on "public"."social_graphics_projects"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM designer_projects
  WHERE ((designer_projects.project_id = social_graphics_projects.id) AND (designer_projects.project_type = 'social_graphics'::text) AND (designer_projects.designer_id = auth.uid())))));


create policy "TEMP Allow assigned designer SELECT social"
on "public"."social_graphics_projects"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM project_assignments pa
  WHERE ((pa.designer_id = auth.uid()) AND (pa.project_id = social_graphics_projects.id) AND (pa.project_type = 'social_graphics'::text)))));


create policy "Users can insert own social graphics projects"
on "public"."social_graphics_projects"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own social graphics projects"
on "public"."social_graphics_projects"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view own social graphics projects"
on "public"."social_graphics_projects"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create messages for their tickets"
on "public"."support_messages"
as permissive
for insert
to public
with check (((ticket_id IN ( SELECT support_tickets.id
   FROM support_tickets
  WHERE ((support_tickets.user_id = auth.uid()) OR (support_tickets.assigned_to = auth.uid())))) AND (sender_id = auth.uid())));


create policy "Users can view messages for their tickets"
on "public"."support_messages"
as permissive
for select
to public
using ((ticket_id IN ( SELECT support_tickets.id
   FROM support_tickets
  WHERE ((support_tickets.user_id = auth.uid()) OR (support_tickets.assigned_to = auth.uid())))));


create policy "Users can insert own support tickets"
on "public"."support_tickets"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view own support tickets"
on "public"."support_tickets"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "test_policy"
on "public"."test_rls"
as permissive
for all
to public
using ((user_id = auth.uid()));


create policy "Allow assigned designers view access"
on "public"."user_files"
as permissive
for select
to authenticated
using (((auth_helpers.get_user_role(auth.uid()) = 'designer'::text) AND (project_id IS NOT NULL) AND (project_type IS NOT NULL) AND auth_helpers.is_designer_assigned_to_project(auth.uid(), project_id, project_type)));


create policy "Allow authenticated users to insert"
on "public"."user_files"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()));


create policy "Allow full access to admins"
on "public"."user_files"
as permissive
for all
to authenticated
using ((auth_helpers.get_user_role(auth.uid()) = 'admin'::text))
with check ((auth_helpers.get_user_role(auth.uid()) = 'admin'::text));


create policy "Allow users to delete own files"
on "public"."user_files"
as permissive
for delete
to authenticated
using ((user_id = auth.uid()));


create policy "Allow users to select own files"
on "public"."user_files"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "Allow users to update own files"
on "public"."user_files"
as permissive
for update
to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "Designers can view assigned web design projects"
on "public"."web_design_projects"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM designer_projects
  WHERE ((designer_projects.project_id = web_design_projects.id) AND (designer_projects.project_type = 'web_design'::text) AND (designer_projects.designer_id = auth.uid())))));


create policy "TEMP Allow assigned designer SELECT web"
on "public"."web_design_projects"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM project_assignments pa
  WHERE ((pa.designer_id = auth.uid()) AND (pa.project_id = web_design_projects.id) AND (pa.project_type = 'web_design'::text)))));


create policy "Users can insert own web design projects"
on "public"."web_design_projects"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own web design projects"
on "public"."web_design_projects"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view own web design projects"
on "public"."web_design_projects"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER trg_set_updated_at_bir BEFORE UPDATE ON public.business_information_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_designer_tasks_timestamp BEFORE UPDATE ON public.designer_tasks FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER sync_profile_role_to_auth_users AFTER UPDATE OF role ON public.profiles FOR EACH ROW WHEN ((old.role IS DISTINCT FROM new.role)) EXECUTE FUNCTION sync_profile_role_to_auth_users();

CREATE TRIGGER update_project_notes_timestamp BEFORE UPDATE ON public.project_notes FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_project_revisions_updated_at BEFORE UPDATE ON public.project_revisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revision_comments_updated_at BEFORE UPDATE ON public.revision_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revision_files_updated_at BEFORE UPDATE ON public.revision_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_revision_notes_updated_at BEFORE UPDATE ON public.revision_notes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER update_task_comments_timestamp BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();


