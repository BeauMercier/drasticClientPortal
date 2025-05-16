-- Migration: add NOT NULL + CHECK constraints to current_stage on project tables
-- Timestamp: 20240724001000

------------------------------------------------------------
-- This migration assumes the back-fill script has already
-- populated `current_stage` correctly on all rows.
--
-- Strategy
--   1.  Add a CHECK constraint as NOT VALID (no immediate full
--       table scan or lock, safe for prod deploys).
--   2.  Set the column NOT NULL (will error if any NULL slipped
--       through - fail-fast, because that means back-fill missed
--       something).
--   3.  VALIDATE the CHECK constraint (single scan once data is
--       in a consistent state).
--
-- The CHECK list mirrors the ProjectStage union type in
-- src/lib/types/project.ts. Adjust if that enum grows.
------------------------------------------------------------

DO $$
DECLARE
    tbl text;
    schema_name text;
    table_name  text;
    constraint_name text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'public.web_design_projects',
        'public.logo_design_projects',
        'public.social_graphics_projects'
    ] LOOP
        schema_name     := split_part(tbl, '.', 1);
        table_name      := split_part(tbl, '.', 2);
        constraint_name := 'chk_' || table_name || '_current_stage';

        ------------------------------------------------------------------
        -- 0. Patch remaining NULLs to 'uninitialized'
        ------------------------------------------------------------------
        EXECUTE
            'UPDATE ' || quote_ident(schema_name) || '.' || quote_ident(table_name) ||
            ' SET current_stage = ''uninitialized'' WHERE current_stage IS NULL';

        ------------------------------------------------------------------
        -- 1. ADD CHECK … NOT VALID
        ------------------------------------------------------------------
        EXECUTE
            'ALTER TABLE ' || quote_ident(schema_name) || '.' || quote_ident(table_name) ||
            ' ADD CONSTRAINT ' || quote_ident(constraint_name) ||
            ' CHECK (current_stage IN (''uninitialized'', ''discovery'',' ||
            ' ''concept-development'', ''refinement'', ''finalization'', ''delivery'')) NOT VALID';

        ------------------------------------------------------------------
        -- 2. SET NOT NULL
        ------------------------------------------------------------------
        EXECUTE
            'ALTER TABLE ' || quote_ident(schema_name) || '.' || quote_ident(table_name) ||
            ' ALTER COLUMN current_stage SET NOT NULL';

        ------------------------------------------------------------------
        -- 3. VALIDATE the CHECK constraint
        ------------------------------------------------------------------
        EXECUTE
            'ALTER TABLE ' || quote_ident(schema_name) || '.' || quote_ident(table_name) ||
            ' VALIDATE CONSTRAINT ' || quote_ident(constraint_name);
    END LOOP;
END$$; 