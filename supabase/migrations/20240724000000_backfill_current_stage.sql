-- Migration: Backfill projects.current_stage from boolean flags

-- This script assumes the target table is 'projects' and it has the boolean columns:
-- discovery_completed, initial_design_completed, revisions_completed, 
-- approval_completed, delivery_completed, and business_info_submitted.
-- It also assumes the target 'current_stage' column accepts:
-- 'discovery', 'concept-development', 'refinement', 'finalization', 'delivery'.

DO $$
DECLARE
    tbl text;
BEGIN
    -- iterate over each project-type table that has current_stage + *_date cols
    FOREACH tbl IN ARRAY ARRAY[
        'public.web_design_projects',
        'public.logo_design_projects',
        'public.social_graphics_projects'
    ]
    LOOP
        EXECUTE format($fmt$
            UPDATE %I
            SET current_stage = COALESCE(
                CASE
                    WHEN delivery_date          IS NOT NULL THEN 'delivery'
                    WHEN finalization_date      IS NOT NULL THEN 'finalization'
                    WHEN refinement_date        IS NOT NULL THEN 'refinement'
                    WHEN concept_development_date IS NOT NULL THEN 'concept-development'
                    WHEN discovery_date         IS NOT NULL THEN 'discovery'
                    ELSE NULL
                END,
                CASE lower(stage)
                    WHEN 'intake'             THEN 'discovery'
                    WHEN 'initial_design'
                         OR 'design'         THEN 'concept-development'
                    WHEN 'revisions'          THEN 'refinement'
                    WHEN 'approval'           THEN 'finalization'
                    WHEN 'delivery'           THEN 'delivery'
                    ELSE 'uninitialized'
                END,
                current_stage  -- keep existing if already populated and not one of the 'reset' values
            )
            WHERE current_stage IS NULL
               OR current_stage = ''
               OR current_stage = 'uninitialized'; -- Only update if current_stage is not meaningfully set
        $fmt$, tbl); -- Pass table name to format
    END LOOP;
END$$;

-- Notes:
-- 1. This script uses `updated_at` as a fallback for stage dates. If more precise historical dates for stage completions
--    were recorded elsewhere (e.g., in an audit log or separate date fields not yet considered), those would be better.
-- 2. The order of WHEN clauses in the CASE statement for current_stage is crucial: from latest stage to earliest.
-- 3. If your project table is named differently (e.g., `web_design_projects`), change `public.projects` accordingly.
-- 4. If your boolean flags have different names, adjust them throughout the script.
-- 5. This script is idempotent due to the WHERE clause; running it multiple times won't harm already correct data. 