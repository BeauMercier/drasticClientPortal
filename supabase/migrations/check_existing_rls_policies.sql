-- Check existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM 
    pg_policies
ORDER BY 
    tablename, policyname;

-- Check which tables have RLS enabled
SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name,
    CASE WHEN c.relrowsecurity THEN 'RLS enabled' ELSE 'RLS disabled' END AS rls_status
FROM 
    pg_class c
JOIN 
    pg_namespace n ON n.oid = c.relnamespace
WHERE 
    c.relkind = 'r' -- Only tables
    AND n.nspname = 'public' -- Only tables in public schema
ORDER BY 
    schema_name, table_name;

-- Check if helper functions exist
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_result(p.oid) AS result_type,
    pg_get_function_arguments(p.oid) AS argument_types,
    CASE WHEN p.proisagg THEN 'aggregate' ELSE 'normal' END AS function_type
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON n.oid = p.pronamespace
WHERE 
    p.proname IN ('get_user_role', 'is_designer_assigned_to_project')
    AND n.nspname = 'public'
ORDER BY 
    function_name; 