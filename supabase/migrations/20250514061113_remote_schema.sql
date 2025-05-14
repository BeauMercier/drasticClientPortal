

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "auth_helpers";


ALTER SCHEMA "auth_helpers" OWNER TO "postgres";


COMMENT ON SCHEMA "auth_helpers" IS 'Schema for auth helper functions that avoid RLS recursion';



CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."bir_status" AS ENUM (
    'pending',
    'submitted',
    'approved'
);


ALTER TYPE "public"."bir_status" OWNER TO "postgres";


CREATE TYPE "public"."project_type_for_revision" AS ENUM (
    'web_design',
    'logo_design',
    'social_graphics'
);


ALTER TYPE "public"."project_type_for_revision" OWNER TO "postgres";


CREATE TYPE "public"."revision_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'current'
);


ALTER TYPE "public"."revision_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "auth_helpers"."get_user_role"("user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "auth_helpers"."get_user_role"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "auth_helpers"."get_user_role"("user_id" "uuid") IS 'Gets user role directly from auth metadata, avoiding RLS tables entirely';



CREATE OR REPLACE FUNCTION "auth_helpers"."is_designer_assigned_to_project"("d_id" "uuid", "p_id" "uuid", "p_type" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "auth_helpers"."is_designer_assigned_to_project"("d_id" "uuid", "p_id" "uuid", "p_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "auth_helpers"."is_designer_assigned_to_project"("d_id" "uuid", "p_id" "uuid", "p_type" "text") IS 'Checks project assignment bypassing RLS';



CREATE OR REPLACE FUNCTION "public"."admin_delete_user"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$ 
BEGIN 
  DELETE FROM auth.users WHERE id = user_id; 
END; 
$$;


ALTER FUNCTION "public"."admin_delete_user"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_user_role"("user_id" "uuid", "new_role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_update_user_role"("user_id" "uuid", "new_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."backfill_missing_profiles"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."backfill_missing_profiles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_policy_if_not_exists"("policy_name" "text", "table_name" "text", "command" "text", "using_expr" "text" DEFAULT NULL::"text", "check_expr" "text" DEFAULT NULL::"text", "target_roles" "text" DEFAULT 'public'::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
  $$;


ALTER FUNCTION "public"."create_policy_if_not_exists"("policy_name" "text", "table_name" "text", "command" "text", "using_expr" "text", "check_expr" "text", "target_roles" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_profile_for_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."create_profile_for_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enable_rls_if_not_enabled"("table_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
    $$;


ALTER FUNCTION "public"."enable_rls_if_not_enabled"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."ensure_user_profile"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "company" "text",
    "role" "text" DEFAULT 'guest'::"text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "business_name" "text",
    "mobile" "text",
    "preferred_contact" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "position" "text",
    "business_website" "text",
    "website_dashboard_url" "text",
    "email" "text",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'designer'::"text", 'client'::"text", 'guest'::"text"])))
);

ALTER TABLE ONLY "public"."profiles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles - RLS CURRENTLY DISABLED DUE TO RECURSION ISSUE. Use safe_profiles view, get_my_profile() function, or admin_profiles view instead.';



CREATE OR REPLACE FUNCTION "public"."get_my_profile"() RETURNS SETOF "public"."profiles"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.profiles
  WHERE id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."get_my_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  -- Call auth_helpers schema function to avoid recursion
  RETURN auth_helpers.get_user_role(user_id);
END;
$$;


ALTER FUNCTION "public"."get_user_role"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_role"("user_id" "uuid") IS 'Gets user role safely from auth metadata, avoiding RLS recursion';



CREATE OR REPLACE FUNCTION "public"."is_designer_assigned_to_project"("d_id" "uuid", "p_id" "uuid", "p_type" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN auth_helpers.is_designer_assigned_to_project(d_id, p_id, p_type);
END;
$$;


ALTER FUNCTION "public"."is_designer_assigned_to_project"("d_id" "uuid", "p_id" "uuid", "p_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_designer_assigned_to_project"("d_id" "uuid", "p_id" "uuid", "p_type" "text") IS 'Safely checks if a designer is assigned to a project';



CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_profile_role_to_auth_users"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."sync_profile_role_to_auth_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_user_role_with_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE profiles
  SET role = NEW.raw_user_meta_data->>'role'
  WHERE id = NEW.id AND NEW.raw_user_meta_data->>'role' IS NOT NULL;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_user_role_with_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_access_to_profile"("profile_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."user_has_access_to_profile"("profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_profiles" AS
 SELECT "profiles"."id",
    "profiles"."full_name",
    "profiles"."avatar_url",
    "profiles"."company",
    "profiles"."role",
    "profiles"."phone",
    "profiles"."created_at",
    "profiles"."updated_at",
    "profiles"."business_name",
    "profiles"."mobile",
    "profiles"."preferred_contact",
    "profiles"."address",
    "profiles"."city",
    "profiles"."state",
    "profiles"."zip",
    "profiles"."position",
    "profiles"."business_website",
    "profiles"."website_dashboard_url",
    "profiles"."email"
   FROM "public"."profiles";


ALTER TABLE "public"."admin_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "invoice_number" "text",
    "description" "text",
    "due_date" "date" NOT NULL,
    "paid_at" timestamp with time zone,
    "payment_method" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "billing_invoices_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'overdue'::"text", 'cancelled'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."billing_invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bir_file" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bir_id" "uuid" NOT NULL,
    "file_type" "text" NOT NULL,
    "original_name" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "mime_type" "text" NOT NULL,
    "size_bytes" integer NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."bir_file" OWNER TO "postgres";


COMMENT ON TABLE "public"."bir_file" IS 'Stores metadata for files uploaded specifically for a Business Information Request.';



COMMENT ON COLUMN "public"."bir_file"."bir_id" IS 'Links to the parent Business Information Request.';



COMMENT ON COLUMN "public"."bir_file"."file_type" IS 'Categorizes the purpose of the file (e.g., logo, photo).';



COMMENT ON COLUMN "public"."bir_file"."original_name" IS 'The original filename as uploaded by the user.';



COMMENT ON COLUMN "public"."bir_file"."storage_path" IS 'The path to the file object within the storage bucket (e.g., bir-files/{bir_id}/{uuid}.ext).';



COMMENT ON COLUMN "public"."bir_file"."mime_type" IS 'The MIME type of the uploaded file (e.g., image/png).';



COMMENT ON COLUMN "public"."bir_file"."size_bytes" IS 'The size of the file in bytes.';



COMMENT ON COLUMN "public"."bir_file"."uploaded_at" IS 'Timestamp when the file was uploaded.';



CREATE TABLE IF NOT EXISTS "public"."business_information_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "project_type" "text" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "status" "public"."bir_status" DEFAULT 'pending'::"public"."bir_status" NOT NULL,
    "answers" "jsonb" NOT NULL,
    "submitted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."business_information_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_profiles" (
    "id" "uuid" NOT NULL,
    "company_name" "text",
    "business_type" "text",
    "industry" "text",
    "company_website" "text",
    "primary_contact_name" "text",
    "position_title" "text",
    "email_address" "text",
    "phone_number" "text",
    "street_address" "text",
    "city" "text",
    "state_province" "text",
    "postal_code" "text",
    "country" "text",
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
    "saturday_closed" boolean DEFAULT true,
    "sunday_closed" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."business_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."designer_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "designer_id" "uuid",
    "project_id" "uuid" NOT NULL,
    "project_type" "text" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "assigned_by" "uuid",
    CONSTRAINT "designer_projects_project_type_check" CHECK (("project_type" = ANY (ARRAY['web_design'::"text", 'logo_design'::"text", 'social_graphics'::"text"])))
);


ALTER TABLE "public"."designer_projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."designer_tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'todo'::"text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "due_date" timestamp with time zone,
    "designer_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."designer_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logo_design_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "industry" "text",
    "color_preferences" "text",
    "style_preferences" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_placeholder" boolean DEFAULT false,
    "active" boolean DEFAULT false,
    "current_stage" "text",
    "discovery_date" timestamp with time zone,
    "concept_development_date" timestamp with time zone,
    "refinement_date" timestamp with time zone,
    "finalization_date" timestamp with time zone,
    "delivery_date" timestamp with time zone,
    "deadline" timestamp with time zone,
    "requirements" "text",
    "stage" character varying(50) DEFAULT 'intake'::character varying,
    "designer_email" character varying(255),
    "logo_type" character varying(100),
    "brand_colors" "text",
    "logo_text" character varying(255),
    "owner" "jsonb",
    "designer" "jsonb",
    "technical_requirements" "text",
    "brand_guidelines" "text",
    "design_preferences" "text",
    "logo_usage" "text",
    "target_market" "text",
    "competitors" "text",
    "color_psychology" "text",
    "symbol_preferences" "text",
    "typography_preferences" "text",
    "file_formats_needed" "text",
    "brand_personality" "text",
    "brand_values" "text",
    "logo_versions_needed" "text",
    "designer_notes" "text",
    "admin_notes" "text",
    "revision_count" integer DEFAULT 0,
    "feedback_history" "jsonb",
    "approval_date" timestamp with time zone,
    CONSTRAINT "logo_design_projects_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'on_hold'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."logo_design_projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."management_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "analytics_service" "text",
    "property_id" "text",
    "connected_at" timestamp with time zone,
    "tracking_code" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "management_analytics_analytics_service_check" CHECK (("analytics_service" = ANY (ARRAY['google_analytics'::"text", 'matomo'::"text", 'plausible'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."management_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."management_google_ads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "ads_account_id" "text",
    "monthly_budget" numeric,
    "campaign_status" "text",
    "start_date" "date",
    "end_date" "date",
    "primary_keywords" "text"[],
    "target_audience" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "management_google_ads_campaign_status_check" CHECK (("campaign_status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'removed'::"text"])))
);


ALTER TABLE "public"."management_google_ads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."management_website" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "domain_name" "text" NOT NULL,
    "hosting_provider" "text",
    "ssl_status" "text",
    "cms_type" "text",
    "monthly_maintenance" boolean DEFAULT false,
    "renewal_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "management_website_ssl_status_check" CHECK (("ssl_status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'none'::"text"])))
);


ALTER TABLE "public"."management_website" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_type" "text" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "designer_id" "uuid",
    "assigned_by_id" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_assignments_project_type_check" CHECK (("project_type" = ANY (ARRAY['web_design'::"text", 'logo_design'::"text", 'social_graphics'::"text"])))
);


ALTER TABLE "public"."project_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "project_type" "text" NOT NULL,
    "designer_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_private" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_revisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "project_type" "public"."project_type_for_revision" NOT NULL,
    "version" integer NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."revision_status" DEFAULT 'pending'::"public"."revision_status" NOT NULL,
    "feedback" "text",
    "created_by" "uuid",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_revisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "client_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."revision_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "revision_id" "uuid",
    "user_id" "uuid",
    "comment" "text" NOT NULL,
    "position_x" double precision,
    "position_y" double precision,
    "file_id" "uuid",
    "resolved" boolean DEFAULT false,
    "resolved_by" "uuid",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."revision_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."revision_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "revision_id" "uuid",
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_type" "text",
    "file_size" integer,
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bucket" "text",
    "mockup_type" "text",
    "external_url" "text",
    "is_external" boolean DEFAULT false,
    "uploaded_by" "uuid",
    CONSTRAINT "revision_files_mockup_type_check" CHECK (("mockup_type" = ANY (ARRAY['image'::"text", 'figma'::"text", 'wordpress'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."revision_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."revision_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "revision_id" "uuid" NOT NULL,
    "content" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."revision_notes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."safe_profiles" AS
 SELECT "p"."id",
    "p"."role",
    "p"."email",
    "p"."full_name",
    "p"."avatar_url",
    "p"."created_at",
    "p"."updated_at"
   FROM "public"."profiles" "p";


ALTER TABLE "public"."safe_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."social_graphics_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "social_platform" "text",
    "content_type" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "dimensions" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_placeholder" boolean DEFAULT false,
    "active" boolean DEFAULT false,
    "current_stage" "text",
    "discovery_date" timestamp with time zone,
    "concept_development_date" timestamp with time zone,
    "refinement_date" timestamp with time zone,
    "finalization_date" timestamp with time zone,
    "delivery_date" timestamp with time zone,
    "deadline" timestamp with time zone,
    "requirements" "text",
    "stage" character varying(50) DEFAULT 'intake'::character varying,
    "designer_email" character varying(255),
    "platforms" character varying(255),
    "brand_guidelines" "text",
    "owner" "jsonb",
    "designer" "jsonb",
    "technical_requirements" "text",
    "design_preferences" "text",
    "campaign_goals" "text",
    "target_audience_demographics" "text",
    "posting_frequency" "text",
    "caption_requirements" "text",
    "hashtag_strategy" "text",
    "image_text_ratio" "text",
    "animation_requirements" "text",
    "video_requirements" "text",
    "call_to_action" "text",
    "platform_specific_requirements" "text",
    "seasonal_themes" "text",
    "integration_with_website" "text",
    "designer_notes" "text",
    "admin_notes" "text",
    "revision_count" integer DEFAULT 0,
    "feedback_history" "jsonb",
    "approval_date" timestamp with time zone,
    CONSTRAINT "social_graphics_projects_content_type_check" CHECK (("content_type" = ANY (ARRAY['post'::"text", 'story'::"text", 'banner'::"text", 'profile'::"text", 'ad'::"text", 'other'::"text"]))),
    CONSTRAINT "social_graphics_projects_social_platform_check" CHECK (("social_platform" = ANY (ARRAY['facebook'::"text", 'instagram'::"text", 'twitter'::"text", 'linkedin'::"text", 'tiktok'::"text", 'youtube'::"text", 'other'::"text"]))),
    CONSTRAINT "social_graphics_projects_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'on_hold'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."social_graphics_projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid",
    "sender_id" "uuid",
    "message" "text" NOT NULL,
    "attachment_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."support_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "subject" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'open'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "assigned_to" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    CONSTRAINT "support_tickets_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid",
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" integer,
    "file_type" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."task_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid",
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."task_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."test_rls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "data" "text"
);

ALTER TABLE ONLY "public"."test_rls" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."test_rls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_type" "text",
    "file_size" bigint,
    "description" "text",
    "project_type" "text",
    "project_id" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_files_project_type_check" CHECK (("project_type" = ANY (ARRAY['web_design'::"text", 'social_graphics'::"text", 'logo_design'::"text", 'general'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."user_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."web_design_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "site_type" "text",
    "domain_name" "text",
    "hosting_provider" "text",
    "expected_launch_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_placeholder" boolean DEFAULT false,
    "active" boolean DEFAULT false,
    "current_stage" "text",
    "discovery_date" timestamp with time zone,
    "concept_development_date" timestamp with time zone,
    "refinement_date" timestamp with time zone,
    "finalization_date" timestamp with time zone,
    "delivery_date" timestamp with time zone,
    "deadline" timestamp with time zone,
    "requirements" "text",
    "stage" character varying(50) DEFAULT 'intake'::character varying,
    "website_type" character varying(100),
    "target_audience" "text",
    "color_preferences" "text",
    "existing_branding" boolean DEFAULT false,
    "desired_features" "text",
    "current_website_url" character varying(255),
    "hosting_preferences" character varying(100),
    "designer_email" character varying(255),
    "owner" "jsonb",
    "designer" "jsonb",
    "technical_requirements" "text",
    "seo_requirements" "text",
    "brand_guidelines" "text",
    "design_preferences" "text",
    "site_goals" "text",
    "timeline_expectations" "text",
    "responsive_design_needs" "text",
    "target_devices" "text",
    "accessibility_requirements" "text",
    "analytics_requirements" "text",
    "marketing_integration" "text",
    "ecommerce_needs" boolean DEFAULT false,
    "payment_gateways" "text",
    "social_media_integration" "text",
    "content_management_needs" "text",
    "multilingual_support" boolean DEFAULT false,
    "security_requirements" "text",
    "content_strategy" "text",
    "number_of_pages" integer,
    "form_requirements" "text",
    "preferred_platforms" "text",
    "custom_functionality" "text",
    "user_account_system" boolean DEFAULT false,
    "maintenance_requirements" "text",
    "budget_range" "text",
    "designer_notes" "text",
    "admin_notes" "text",
    "revision_count" integer DEFAULT 0,
    "feedback_history" "jsonb",
    "approval_date" timestamp with time zone,
    CONSTRAINT "web_design_projects_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'on_hold'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."web_design_projects" OWNER TO "postgres";


ALTER TABLE ONLY "public"."billing_invoices"
    ADD CONSTRAINT "billing_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bir_file"
    ADD CONSTRAINT "bir_file_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bir_file"
    ADD CONSTRAINT "bir_file_storage_path_key" UNIQUE ("storage_path");



ALTER TABLE ONLY "public"."business_information_requests"
    ADD CONSTRAINT "business_information_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_information_requests"
    ADD CONSTRAINT "business_information_requests_project_id_key" UNIQUE ("project_id");



ALTER TABLE ONLY "public"."business_profiles"
    ADD CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."designer_projects"
    ADD CONSTRAINT "designer_projects_designer_id_project_id_project_type_key" UNIQUE ("designer_id", "project_id", "project_type");



ALTER TABLE ONLY "public"."designer_projects"
    ADD CONSTRAINT "designer_projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."designer_tasks"
    ADD CONSTRAINT "designer_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logo_design_projects"
    ADD CONSTRAINT "logo_design_projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."management_analytics"
    ADD CONSTRAINT "management_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."management_google_ads"
    ADD CONSTRAINT "management_google_ads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."management_website"
    ADD CONSTRAINT "management_website_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_project_type_project_id_key" UNIQUE ("project_type", "project_id");



ALTER TABLE ONLY "public"."project_notes"
    ADD CONSTRAINT "project_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_revisions"
    ADD CONSTRAINT "project_revisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."revision_comments"
    ADD CONSTRAINT "revision_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."revision_files"
    ADD CONSTRAINT "revision_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."revision_notes"
    ADD CONSTRAINT "revision_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_graphics_projects"
    ADD CONSTRAINT "social_graphics_projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."test_rls"
    ADD CONSTRAINT "test_rls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_files"
    ADD CONSTRAINT "user_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."web_design_projects"
    ADD CONSTRAINT "web_design_projects_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_billing_invoices_user_id" ON "public"."billing_invoices" USING "btree" ("user_id");



CREATE INDEX "idx_bir_client" ON "public"."business_information_requests" USING "btree" ("client_id");



CREATE INDEX "idx_bir_file_bir_id" ON "public"."bir_file" USING "btree" ("bir_id");



CREATE INDEX "idx_bir_project" ON "public"."business_information_requests" USING "btree" ("project_id", "project_type");



CREATE INDEX "idx_bir_status" ON "public"."business_information_requests" USING "btree" ("status");



CREATE INDEX "idx_logo_design_projects_user_id" ON "public"."logo_design_projects" USING "btree" ("user_id");



CREATE INDEX "idx_management_analytics_user_id" ON "public"."management_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_management_google_ads_user_id" ON "public"."management_google_ads" USING "btree" ("user_id");



CREATE INDEX "idx_management_website_user_id" ON "public"."management_website" USING "btree" ("user_id");



CREATE INDEX "idx_project_assignments_designer" ON "public"."project_assignments" USING "btree" ("designer_id");



CREATE INDEX "idx_project_assignments_project" ON "public"."project_assignments" USING "btree" ("project_type", "project_id");



CREATE INDEX "idx_project_notes_designer" ON "public"."project_notes" USING "btree" ("designer_id");



CREATE INDEX "idx_project_notes_project" ON "public"."project_notes" USING "btree" ("project_id", "project_type");



CREATE INDEX "idx_project_revisions_created_by" ON "public"."project_revisions" USING "btree" ("created_by");



CREATE INDEX "idx_project_revisions_project" ON "public"."project_revisions" USING "btree" ("project_id");



CREATE INDEX "idx_project_revisions_status" ON "public"."project_revisions" USING "btree" ("status");



CREATE INDEX "idx_project_revisions_type" ON "public"."project_revisions" USING "btree" ("project_type");



CREATE INDEX "idx_revision_files_is_external" ON "public"."revision_files" USING "btree" ("is_external");



CREATE INDEX "idx_revision_files_mockup_type" ON "public"."revision_files" USING "btree" ("mockup_type");



CREATE INDEX "idx_revision_files_revision_id" ON "public"."revision_files" USING "btree" ("revision_id");



CREATE INDEX "idx_revision_files_uploaded_by" ON "public"."revision_files" USING "btree" ("uploaded_by");



CREATE INDEX "idx_social_graphics_projects_user_id" ON "public"."social_graphics_projects" USING "btree" ("user_id");



CREATE INDEX "idx_support_messages_sender_id" ON "public"."support_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_support_messages_ticket_id" ON "public"."support_messages" USING "btree" ("ticket_id");



CREATE INDEX "idx_support_tickets_assigned_to" ON "public"."support_tickets" USING "btree" ("assigned_to");



CREATE INDEX "idx_support_tickets_user_id" ON "public"."support_tickets" USING "btree" ("user_id");



CREATE INDEX "idx_user_files_user_id" ON "public"."user_files" USING "btree" ("user_id");



CREATE INDEX "idx_web_design_projects_user_id" ON "public"."web_design_projects" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "set_revision_notes_updated_at" BEFORE UPDATE ON "public"."revision_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "sync_profile_role_to_auth_users" AFTER UPDATE OF "role" ON "public"."profiles" FOR EACH ROW WHEN (("old"."role" IS DISTINCT FROM "new"."role")) EXECUTE FUNCTION "public"."sync_profile_role_to_auth_users"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at_bir" BEFORE UPDATE ON "public"."business_information_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_designer_tasks_timestamp" BEFORE UPDATE ON "public"."designer_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_column"();



CREATE OR REPLACE TRIGGER "update_project_notes_timestamp" BEFORE UPDATE ON "public"."project_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "update_project_revisions_updated_at" BEFORE UPDATE ON "public"."project_revisions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_revision_comments_updated_at" BEFORE UPDATE ON "public"."revision_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_revision_files_updated_at" BEFORE UPDATE ON "public"."revision_files" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_task_comments_timestamp" BEFORE UPDATE ON "public"."task_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_column"();



ALTER TABLE ONLY "public"."billing_invoices"
    ADD CONSTRAINT "billing_invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bir_file"
    ADD CONSTRAINT "bir_file_bir_id_fkey" FOREIGN KEY ("bir_id") REFERENCES "public"."business_information_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_profiles"
    ADD CONSTRAINT "business_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."designer_projects"
    ADD CONSTRAINT "designer_projects_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."designer_projects"
    ADD CONSTRAINT "designer_projects_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."designer_tasks"
    ADD CONSTRAINT "designer_tasks_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."business_information_requests"
    ADD CONSTRAINT "fk_bir_client" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."logo_design_projects"
    ADD CONSTRAINT "logo_design_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."management_analytics"
    ADD CONSTRAINT "management_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."management_google_ads"
    ADD CONSTRAINT "management_google_ads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."management_website"
    ADD CONSTRAINT "management_website_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_revisions"
    ADD CONSTRAINT "project_revisions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_revisions"
    ADD CONSTRAINT "project_revisions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."revision_comments"
    ADD CONSTRAINT "revision_comments_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."revision_files"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."revision_comments"
    ADD CONSTRAINT "revision_comments_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."revision_comments"
    ADD CONSTRAINT "revision_comments_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "public"."project_revisions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."revision_comments"
    ADD CONSTRAINT "revision_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."revision_files"
    ADD CONSTRAINT "revision_files_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "public"."project_revisions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."revision_files"
    ADD CONSTRAINT "revision_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."revision_notes"
    ADD CONSTRAINT "revision_notes_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "public"."project_revisions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."social_graphics_projects"
    ADD CONSTRAINT "social_graphics_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."designer_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."designer_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_files"
    ADD CONSTRAINT "user_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."web_design_projects"
    ADD CONSTRAINT "web_design_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can access all profiles" ON "public"."profiles" TO "authenticated" USING (("auth_helpers"."get_user_role"("auth"."uid"()) = 'admin'::"text"));



CREATE POLICY "Admins have full access to projects" ON "public"."projects" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Allow assigned designers view access" ON "public"."user_files" FOR SELECT TO "authenticated" USING ((("auth_helpers"."get_user_role"("auth"."uid"()) = 'designer'::"text") AND ("project_id" IS NOT NULL) AND ("project_type" IS NOT NULL) AND "auth_helpers"."is_designer_assigned_to_project"("auth"."uid"(), "project_id", "project_type")));



CREATE POLICY "Allow authenticated users to delete their own files" ON "public"."revision_files" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to insert" ON "public"."user_files" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow authenticated users to insert files" ON "public"."revision_files" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update their own files" ON "public"."revision_files" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to view files" ON "public"."revision_files" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow full access for authenticated users" ON "public"."revision_notes" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow full access to admins" ON "public"."user_files" TO "authenticated" USING (("auth_helpers"."get_user_role"("auth"."uid"()) = 'admin'::"text")) WITH CHECK (("auth_helpers"."get_user_role"("auth"."uid"()) = 'admin'::"text"));



CREATE POLICY "Allow users to delete own files" ON "public"."user_files" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to select own files" ON "public"."user_files" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to update own files" ON "public"."user_files" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Clients can view their projects" ON "public"."projects" FOR SELECT USING (((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'client'::"text") AND ("client_id" = "auth"."uid"())));



CREATE POLICY "Designers can access their projects" ON "public"."projects" USING (((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'designer'::"text") AND (("created_by" = "auth"."uid"()) OR ("client_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = 'client'::"text"))))));



CREATE POLICY "Designers can create notes for their projects" ON "public"."project_notes" FOR INSERT WITH CHECK ((("designer_id" = "auth"."uid"()) AND ("project_id" IN ( SELECT "designer_projects"."project_id"
   FROM "public"."designer_projects"
  WHERE (("designer_projects"."designer_id" = "auth"."uid"()) AND ("designer_projects"."project_type" = "project_notes"."project_type"))))));



CREATE POLICY "Designers can delete their own notes" ON "public"."project_notes" FOR DELETE USING (("designer_id" = "auth"."uid"()));



CREATE POLICY "Designers can update their own notes" ON "public"."project_notes" FOR UPDATE USING (("designer_id" = "auth"."uid"()));



CREATE POLICY "Designers can view assigned client profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("auth_helpers"."get_user_role"("auth"."uid"()) = 'designer'::"text") AND ("role" = 'client'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."project_assignments" "pa"
  WHERE (("pa"."designer_id" = "auth"."uid"()) AND ((EXISTS ( SELECT 1
           FROM "public"."web_design_projects" "wdp"
          WHERE (("wdp"."id" = "pa"."project_id") AND ("pa"."project_type" = 'web_design'::"text") AND ("wdp"."user_id" = "profiles"."id")))) OR (EXISTS ( SELECT 1
           FROM "public"."logo_design_projects" "ldp"
          WHERE (("ldp"."id" = "pa"."project_id") AND ("pa"."project_type" = 'logo_design'::"text") AND ("ldp"."user_id" = "profiles"."id")))) OR (EXISTS ( SELECT 1
           FROM "public"."social_graphics_projects" "sgp"
          WHERE (("sgp"."id" = "pa"."project_id") AND ("pa"."project_type" = 'social_graphics'::"text") AND ("sgp"."user_id" = "profiles"."id"))))))))));



CREATE POLICY "Designers can view assigned logo design projects" ON "public"."logo_design_projects" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."designer_projects"
  WHERE (("designer_projects"."project_id" = "logo_design_projects"."id") AND ("designer_projects"."project_type" = 'logo_design'::"text") AND ("designer_projects"."designer_id" = "auth"."uid"())))));



CREATE POLICY "Designers can view assigned social graphics projects" ON "public"."social_graphics_projects" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."designer_projects"
  WHERE (("designer_projects"."project_id" = "social_graphics_projects"."id") AND ("designer_projects"."project_type" = 'social_graphics'::"text") AND ("designer_projects"."designer_id" = "auth"."uid"())))));



CREATE POLICY "Designers can view assigned web design projects" ON "public"."web_design_projects" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."designer_projects"
  WHERE (("designer_projects"."project_id" = "web_design_projects"."id") AND ("designer_projects"."project_type" = 'web_design'::"text") AND ("designer_projects"."designer_id" = "auth"."uid"())))));



CREATE POLICY "Project owners can view their notes" ON "public"."project_notes" FOR SELECT USING ((("project_id" IN ( SELECT "web_design_projects"."id"
   FROM "public"."web_design_projects"
  WHERE ("web_design_projects"."user_id" = "auth"."uid"())
UNION ALL
 SELECT "logo_design_projects"."id"
   FROM "public"."logo_design_projects"
  WHERE ("logo_design_projects"."user_id" = "auth"."uid"())
UNION ALL
 SELECT "social_graphics_projects"."id"
   FROM "public"."social_graphics_projects"
  WHERE ("social_graphics_projects"."user_id" = "auth"."uid"()))) OR ("designer_id" = "auth"."uid"())));



CREATE POLICY "TEMP Allow assigned designer SELECT" ON "public"."designer_tasks" FOR SELECT TO "authenticated" USING (("designer_id" = "auth"."uid"()));



CREATE POLICY "TEMP Allow assigned designer SELECT assignments" ON "public"."project_assignments" FOR SELECT TO "authenticated" USING (("designer_id" = "auth"."uid"()));



CREATE POLICY "TEMP Allow assigned designer SELECT logo" ON "public"."logo_design_projects" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."project_assignments" "pa"
  WHERE (("pa"."designer_id" = "auth"."uid"()) AND ("pa"."project_id" = "logo_design_projects"."id") AND ("pa"."project_type" = 'logo_design'::"text")))));



CREATE POLICY "TEMP Allow assigned designer SELECT social" ON "public"."social_graphics_projects" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."project_assignments" "pa"
  WHERE (("pa"."designer_id" = "auth"."uid"()) AND ("pa"."project_id" = "social_graphics_projects"."id") AND ("pa"."project_type" = 'social_graphics'::"text")))));



CREATE POLICY "TEMP Allow assigned designer SELECT web" ON "public"."web_design_projects" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."project_assignments" "pa"
  WHERE (("pa"."designer_id" = "auth"."uid"()) AND ("pa"."project_id" = "web_design_projects"."id") AND ("pa"."project_type" = 'web_design'::"text")))));



CREATE POLICY "Users can create messages for their tickets" ON "public"."support_messages" FOR INSERT WITH CHECK ((("ticket_id" IN ( SELECT "support_tickets"."id"
   FROM "public"."support_tickets"
  WHERE (("support_tickets"."user_id" = "auth"."uid"()) OR ("support_tickets"."assigned_to" = "auth"."uid"())))) AND ("sender_id" = "auth"."uid"())));



CREATE POLICY "Users can insert own business profile" ON "public"."business_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own logo design projects" ON "public"."logo_design_projects" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own social graphics projects" ON "public"."social_graphics_projects" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own support tickets" ON "public"."support_tickets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own web design projects" ON "public"."web_design_projects" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own business profile" ON "public"."business_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own logo design projects" ON "public"."logo_design_projects" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can update own social graphics projects" ON "public"."social_graphics_projects" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own web design projects" ON "public"."web_design_projects" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view messages for their tickets" ON "public"."support_messages" FOR SELECT USING (("ticket_id" IN ( SELECT "support_tickets"."id"
   FROM "public"."support_tickets"
  WHERE (("support_tickets"."user_id" = "auth"."uid"()) OR ("support_tickets"."assigned_to" = "auth"."uid"())))));



CREATE POLICY "Users can view own business profile" ON "public"."business_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own logo design projects" ON "public"."logo_design_projects" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view own social graphics projects" ON "public"."social_graphics_projects" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own support tickets" ON "public"."support_tickets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own web design projects" ON "public"."web_design_projects" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "admin_all" ON "public"."project_revisions" TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "admin_all_comments" ON "public"."revision_comments" TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "admin_all_files" ON "public"."revision_files" TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



ALTER TABLE "public"."billing_invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bir_admin_all" ON "public"."business_information_requests" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"text"));



CREATE POLICY "bir_client_rw" ON "public"."business_information_requests" USING ((("public"."get_user_role"("auth"."uid"()) = 'client'::"text") AND ("client_id" = "auth"."uid"())));



CREATE POLICY "bir_designer_read" ON "public"."business_information_requests" FOR SELECT USING ((("public"."get_user_role"("auth"."uid"()) = 'designer'::"text") AND "public"."is_designer_assigned_to_project"("auth"."uid"(), "project_id", "project_type")));



ALTER TABLE "public"."bir_file" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_information_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client can delete own file" ON "public"."bir_file" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."business_information_requests" "bir"
  WHERE (("bir"."id" = "bir_file"."bir_id") AND ("bir"."client_id" = "auth"."uid"())))));



CREATE POLICY "client can read own files" ON "public"."bir_file" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."business_information_requests" "bir"
  WHERE (("bir"."id" = "bir_file"."bir_id") AND ("bir"."client_id" = "auth"."uid"())))));



CREATE POLICY "client can update own file" ON "public"."bir_file" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."business_information_requests" "bir"
  WHERE (("bir"."id" = "bir_file"."bir_id") AND ("bir"."client_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."business_information_requests" "bir"
  WHERE (("bir"."id" = "bir_file"."bir_id") AND ("bir"."client_id" = "auth"."uid"())))));



CREATE POLICY "client can upload file to own BIR" ON "public"."bir_file" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."business_information_requests" "bir"
  WHERE (("bir"."id" = "bir_file"."bir_id") AND ("bir"."client_id" = "auth"."uid"())))));



CREATE POLICY "client_select" ON "public"."project_revisions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_revisions"."project_id") AND ("p"."client_id" = "auth"."uid"())))));



CREATE POLICY "client_select_files" ON "public"."revision_files" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."project_revisions" "pr"
     JOIN "public"."projects" "p" ON (("pr"."project_id" = "p"."id")))
  WHERE (("pr"."id" = "revision_files"."revision_id") AND ("p"."client_id" = "auth"."uid"())))));



CREATE POLICY "designer_all" ON "public"."project_revisions" TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'designer'::"text"));



CREATE POLICY "designer_all_files" ON "public"."revision_files" TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'designer'::"text"));



ALTER TABLE "public"."designer_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."logo_design_projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."management_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."management_google_ads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."management_website" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_revisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."revision_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."revision_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."revision_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."social_graphics_projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "test_policy" ON "public"."test_rls" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."test_rls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_files" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_own_comments" ON "public"."revision_comments" TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_view_comments" ON "public"."revision_comments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."project_revisions" "pr"
     JOIN "public"."projects" "p" ON (("pr"."project_id" = "p"."id")))
  WHERE (("pr"."id" = "revision_comments"."revision_id") AND (("p"."client_id" = "auth"."uid"()) OR (("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'designer'::"text"])))))));



ALTER TABLE "public"."web_design_projects" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "auth_helpers" TO "authenticated";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "auth_helpers"."get_user_role"("user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "auth_helpers"."is_designer_assigned_to_project"("d_id" "uuid", "p_id" "uuid", "p_type" "text") TO "authenticated";




















































































































































































GRANT ALL ON FUNCTION "public"."admin_delete_user"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_user"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_user"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_user_role"("user_id" "uuid", "new_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_user_role"("user_id" "uuid", "new_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_user_role"("user_id" "uuid", "new_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."backfill_missing_profiles"() TO "anon";
GRANT ALL ON FUNCTION "public"."backfill_missing_profiles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."backfill_missing_profiles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_policy_if_not_exists"("policy_name" "text", "table_name" "text", "command" "text", "using_expr" "text", "check_expr" "text", "target_roles" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_policy_if_not_exists"("policy_name" "text", "table_name" "text", "command" "text", "using_expr" "text", "check_expr" "text", "target_roles" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_policy_if_not_exists"("policy_name" "text", "table_name" "text", "command" "text", "using_expr" "text", "check_expr" "text", "target_roles" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_profile_for_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile_for_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_for_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enable_rls_if_not_enabled"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."enable_rls_if_not_enabled"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enable_rls_if_not_enabled"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_user_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_user_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_user_profile"() TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_designer_assigned_to_project"("d_id" "uuid", "p_id" "uuid", "p_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_designer_assigned_to_project"("d_id" "uuid", "p_id" "uuid", "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_designer_assigned_to_project"("d_id" "uuid", "p_id" "uuid", "p_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_profile_role_to_auth_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_profile_role_to_auth_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_profile_role_to_auth_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_user_role_with_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_user_role_with_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_user_role_with_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timestamp_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_access_to_profile"("profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_access_to_profile"("profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_access_to_profile"("profile_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."admin_profiles" TO "anon";
GRANT ALL ON TABLE "public"."admin_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."billing_invoices" TO "anon";
GRANT ALL ON TABLE "public"."billing_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."bir_file" TO "anon";
GRANT ALL ON TABLE "public"."bir_file" TO "authenticated";
GRANT ALL ON TABLE "public"."bir_file" TO "service_role";



GRANT ALL ON TABLE "public"."business_information_requests" TO "anon";
GRANT ALL ON TABLE "public"."business_information_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."business_information_requests" TO "service_role";



GRANT ALL ON TABLE "public"."business_profiles" TO "anon";
GRANT ALL ON TABLE "public"."business_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."business_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."designer_projects" TO "anon";
GRANT ALL ON TABLE "public"."designer_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."designer_projects" TO "service_role";



GRANT ALL ON TABLE "public"."designer_tasks" TO "anon";
GRANT ALL ON TABLE "public"."designer_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."designer_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."logo_design_projects" TO "anon";
GRANT ALL ON TABLE "public"."logo_design_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."logo_design_projects" TO "service_role";



GRANT ALL ON TABLE "public"."management_analytics" TO "anon";
GRANT ALL ON TABLE "public"."management_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."management_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."management_google_ads" TO "anon";
GRANT ALL ON TABLE "public"."management_google_ads" TO "authenticated";
GRANT ALL ON TABLE "public"."management_google_ads" TO "service_role";



GRANT ALL ON TABLE "public"."management_website" TO "anon";
GRANT ALL ON TABLE "public"."management_website" TO "authenticated";
GRANT ALL ON TABLE "public"."management_website" TO "service_role";



GRANT ALL ON TABLE "public"."project_assignments" TO "anon";
GRANT ALL ON TABLE "public"."project_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."project_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."project_notes" TO "anon";
GRANT ALL ON TABLE "public"."project_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."project_notes" TO "service_role";



GRANT ALL ON TABLE "public"."project_revisions" TO "anon";
GRANT ALL ON TABLE "public"."project_revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."project_revisions" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."revision_comments" TO "anon";
GRANT ALL ON TABLE "public"."revision_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."revision_comments" TO "service_role";



GRANT ALL ON TABLE "public"."revision_files" TO "anon";
GRANT ALL ON TABLE "public"."revision_files" TO "authenticated";
GRANT ALL ON TABLE "public"."revision_files" TO "service_role";



GRANT ALL ON TABLE "public"."revision_notes" TO "anon";
GRANT ALL ON TABLE "public"."revision_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."revision_notes" TO "service_role";



GRANT ALL ON TABLE "public"."safe_profiles" TO "anon";
GRANT ALL ON TABLE "public"."safe_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."safe_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."social_graphics_projects" TO "anon";
GRANT ALL ON TABLE "public"."social_graphics_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."social_graphics_projects" TO "service_role";



GRANT ALL ON TABLE "public"."support_messages" TO "anon";
GRANT ALL ON TABLE "public"."support_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."support_messages" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."task_attachments" TO "anon";
GRANT ALL ON TABLE "public"."task_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."task_comments" TO "anon";
GRANT ALL ON TABLE "public"."task_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_comments" TO "service_role";



GRANT ALL ON TABLE "public"."test_rls" TO "anon";
GRANT ALL ON TABLE "public"."test_rls" TO "authenticated";
GRANT ALL ON TABLE "public"."test_rls" TO "service_role";



GRANT ALL ON TABLE "public"."user_files" TO "anon";
GRANT ALL ON TABLE "public"."user_files" TO "authenticated";
GRANT ALL ON TABLE "public"."user_files" TO "service_role";



GRANT ALL ON TABLE "public"."web_design_projects" TO "anon";
GRANT ALL ON TABLE "public"."web_design_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."web_design_projects" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
