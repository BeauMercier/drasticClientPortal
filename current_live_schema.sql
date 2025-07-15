-- Schema generated from live database inspection on 2025-07-16
-- Note: This script defines table structures based on the provided query output. 
-- It does not include advanced constraints, indexes, or foreign key relationships.

CREATE TABLE "public"."admin_profiles" (
    "id" uuid,
    "full_name" text,
    "avatar_url" text,
    "company" text,
    "role" text,
    "phone" text,
    "created_at" timestamptz,
    "updated_at" timestamptz,
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

CREATE TABLE "public"."billing_invoices" (
    "id" uuid NOT NULL,
    "user_id" uuid,
    "amount" numeric(10,2) NOT NULL,
    "currency" text,
    "status" text,
    "invoice_number" text,
    "description" text,
    "due_date" date NOT NULL,
    "paid_at" timestamptz,
    "payment_method" text,
    "created_at" timestamptz
);

CREATE TABLE "public"."bir_file" (
    "id" uuid NOT NULL,
    "bir_id" uuid NOT NULL,
    "file_type" text NOT NULL,
    "original_name" text NOT NULL,
    "storage_path" text NOT NULL,
    "mime_type" text NOT NULL,
    "size_bytes" integer NOT NULL,
    "uploaded_at" timestamptz NOT NULL
);

CREATE TABLE "public"."business_information_requests" (
    "id" uuid NOT NULL,
    "project_id" uuid NOT NULL,
    "project_type" text NOT NULL,
    "client_id" uuid NOT NULL,
    "status" text NOT NULL, -- Changed from public.bir_status to text for simplicity
    "answers" jsonb NOT NULL,
    "submitted_at" timestamptz,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL
);

CREATE TABLE "public"."business_profiles" (
    "id" uuid NOT NULL,
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
    "monday_start" time,
    "monday_end" time,
    "tuesday_start" time,
    "tuesday_end" time,
    "wednesday_start" time,
    "wednesday_end" time,
    "thursday_start" time,
    "thursday_end" time,
    "friday_start" time,
    "friday_end" time,
    "saturday_closed" boolean,
    "sunday_closed" boolean,
    "created_at" timestamptz,
    "updated_at" timestamptz
);

CREATE TABLE "public"."designer_projects" (
    "id" uuid NOT NULL,
    "designer_id" uuid,
    "project_id" uuid NOT NULL,
    "project_type" text NOT NULL,
    "assigned_at" timestamptz,
    "assigned_by" uuid
);

CREATE TABLE "public"."designer_tasks" (
    "id" uuid NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "status" text NOT NULL,
    "priority" text NOT NULL,
    "due_date" timestamptz,
    "designer_id" uuid NOT NULL,
    "project_id" uuid,
    "created_at" timestamptz
); 