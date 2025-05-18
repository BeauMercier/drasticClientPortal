/* --------------------------------------------------------------------------
   /api/bir  – Business-Information-Request endpoint
   -------------------------------------------------------------------------- */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { birInsertSchema, birUpdateSchema } from '@/lib/validation/bir';
import {
    fetchBirByProject,
    upsertBir,
    updateBir,
} from '@/lib/api/bir';
import { requireAuth, createApiClient } from '@/lib/api/server-utils'; // Import createApiClient
import { UserRole } from '@/lib/types/user'; // Corrected import for UserRole

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

function jsonOK(data: unknown, status = 200) {
    return NextResponse.json(data, { status });
}

function jsonError(message: string, status = 400) {
    return NextResponse.json({ error: message }, { status });
}

/* --------------------------------------------------------------------------
   GET  – ?projectId=<uuid>
   -------------------------------------------------------------------------- */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId)
        return jsonError('Missing required query param "projectId"' , 400);

    try {
        // Ensure user is authenticated (has valid JWT). RLS handles specific project access.
        await requireAuth(); // No req needed
        const supabase = createApiClient(); // Create authenticated client
        const bir = await fetchBirByProject(supabase, projectId); // Pass client
        
        // Handle case where BIR doesn't exist for the project yet
        if (!bir) {
             return jsonOK(null, 200); // Return null or empty object, 200 OK
        } 

        return jsonOK(bir);
    } catch (err: any) {
        console.error('[GET /api/bir] ', err);
        // Handle auth errors specifically if needed, otherwise rely on requireAuth throwing
        if (err.message === 'Authentication required' || err.message?.includes('denied')) {
             return jsonError('Unauthorized', 401);
        }
        return jsonError(err.message ?? 'Unexpected error fetching BIR', 500);
    }
}

/* --------------------------------------------------------------------------
   POST  – Create / upsert
   Body must pass birInsertSchema
   -------------------------------------------------------------------------- */
export async function POST(req: Request) {
    try {
        // Ensure authenticated and get user ID
        const { user, error: authError } = await requireAuth(); // No req needed
        if (authError || !user) {
             return jsonError(authError || 'Authentication required', 401);
        }
        
        const supabase = createApiClient(); // Create authenticated client

        const raw = await req.json();
        
        // Validate input, ensuring the client_id matches the authenticated user
        const dto = birInsertSchema.parse({
            ...raw,
            client_id: user.id, // Enforce client_id from authenticated user
            project_type: 'web_design', // Ensure project_type is set correctly
        });

        const bir = await upsertBir(supabase, dto); // Pass client and validated DTO

        // If BIR upsert was successful and status is 'submitted', update the corresponding web_design_project stage
        if (bir && bir.project_id && bir.status === 'submitted') {
            try {
                const projectUpdateData = {
                    current_stage: 'discovery',
                    discovery_date: new Date().toISOString(),
                    updated_at: new Date().toISOString(), // Also update the project's updated_at
                };

                const { error: projectUpdateError } = await supabase
                    .from('web_design_projects')
                    .update(projectUpdateData)
                    .eq('id', bir.project_id);

                if (projectUpdateError) {
                    console.error('[POST /api/bir] Error updating web_design_project stage to discovery:', projectUpdateError);
                    // Decide if this should be a critical error. For now, log and continue.
                } else {
                    console.log(`[POST /api/bir] Project ${bir.project_id} stage updated to discovery.`);
                }
            } catch (projectUpdateCatchError) {
                console.error('[POST /api/bir] Exception updating project stage to discovery:', projectUpdateCatchError);
            }
        }

        return jsonOK(bir, 201); // 201 Created or updated
    } catch (err: any) {
        console.error('[POST /api/bir] ', err);
        if (err instanceof ZodError) {
            return jsonError(`Validation Error: ${err.errors.map(e => e.message).join(', ')}`, 422);
        }
        // Handle potential DB errors from upsert (e.g., RLS, constraints)
         if (err.message?.includes('denied') || err.message?.includes('violates row-level security policy')) {
             return jsonError('Forbidden: You do not have permission to perform this action.', 403);
        }
         if (err.message?.includes('violates foreign key constraint')) {
             return jsonError('Invalid Project ID or Client ID.', 400);
        }
        return jsonError(err.message ?? 'Unexpected error creating/updating BIR', 500);
    }
}

/* --------------------------------------------------------------------------
   PATCH  – Update existing BIR (e.g., answers or status)
   Body must pass birUpdateSchema
   -------------------------------------------------------------------------- */
export async function PATCH(req: Request) {
    try {
        const { user, error: authError } = await requireAuth(); 
        if (!user) { // Combined check: if no user, authError should exist or be a generic message
            return jsonError(authError || 'Authentication required', 401);
        }
        const supabase = createApiClient(); 

        const raw = await req.json();
        const dto = birUpdateSchema.parse(raw);

        if (dto.status === 'approved') {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileError || !profile) {
                console.error('[PATCH /api/bir] Error fetching user profile for role check:', profileError);
                return jsonError('Could not verify user role for approval.', 500);
            }

            // Compare with the actual string value for the admin role
            if (profile.role !== 'admin') { 
                return jsonError('Only admins can approve BIRs.', 403);
            }
        }

        const bir = await updateBir(supabase, dto);
        return jsonOK(bir);
    } catch (err: any) {
        console.error('[PATCH /api/bir] ', err);
        if (err instanceof ZodError) {
             return jsonError(`Validation Error: ${err.errors.map(e => e.message).join(', ')}`, 422);
        }
         // Handle specific errors like record not found/access denied from updateBir
         if (err.message?.includes('not found or access denied')) {
             return jsonError(err.message, 404); // Or 403 depending on context
        }
        if (err.message === 'No valid fields provided for update.') {
            return jsonError(err.message, 400);
        }
        if (err.message?.includes('denied') || err.message?.includes('violates row-level security policy')) {
             return jsonError('Forbidden: You do not have permission to perform this action.', 403);
        }
        return jsonError(err.message ?? 'Unexpected error updating BIR', 500);
    }
} 