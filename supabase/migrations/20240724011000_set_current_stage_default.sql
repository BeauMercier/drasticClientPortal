-- 20240724011000_set_current_stage_default.sql
-- Adds a defensive default value to current_stage on all project tables.

ALTER TABLE public.web_design_projects
  ALTER COLUMN current_stage SET DEFAULT 'uninitialized';

ALTER TABLE public.logo_design_projects
  ALTER COLUMN current_stage SET DEFAULT 'uninitialized';

ALTER TABLE public.social_graphics_projects
  ALTER COLUMN current_stage SET DEFAULT 'uninitialized'; 