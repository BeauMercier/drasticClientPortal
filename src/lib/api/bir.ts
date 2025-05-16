import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
// Import the DTO types derived from Zod schemas
import { BirInsertDTO, BirUpdateDTO } from '@/lib/validation/bir'; 
// Import the base Row type
import { BirRow, BirStatusArray } from '@/lib/types/bir';
import { birInsertSchema, birUpdateSchema } from '@/lib/validation/bir';

// Base Supabase table type, useful for constructing insert/update payloads
type BirTable = Database['public']['Tables']['business_information_requests'];

/**
 * Fetches the Business Information Request (BIR) for a specific project.
 * Relies on RLS for authorization.
 *
 * Args:
 *     supabase: An *authenticated* Supabase client instance.
 *     projectId: The UUID of the project.
 *
 * Returns:
 *     The BIR row if found, otherwise null.
 *
 * Throws:
 *     If there's a database error.
 */
export async function fetchBirByProject(
    supabase: SupabaseClient<Database>,
    projectId: string
): Promise<BirRow | null> {
    if (!projectId) {
        throw new Error('Project ID is required.');
    }

    const { data, error } = await supabase
        .from('business_information_requests')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle(); // Use maybeSingle as BIR might not exist yet

    if (error) {
        console.error('Error fetching BIR:', error);
        throw new Error(`Database error: ${error.message}`);
    }

    return data;
}

/**
 * Creates or updates a Business Information Request (BIR) record.
 * Validates input data using birInsertSchema.
 * Requires an authenticated Supabase client instance.
 *
 * Args:
 *     supabase: An *authenticated* Supabase client instance.
 *     birData: The data for the BIR (BirInsertDTO).
 *
 * Returns:
 *     The created or updated BIR row.
 *
 * Throws:
 *     If validation fails or there's a database error.
 */
export async function upsertBir(
    supabase: SupabaseClient<Database>,
    birData: BirInsertDTO
): Promise<BirRow> {
    // Validate input data against the schema
    const validationResult = birInsertSchema.safeParse(birData);
    if (!validationResult.success) {
        console.error('Validation errors:', validationResult.error.flatten());
        throw new Error(`Invalid BIR data: ${validationResult.error.message}`);
    }

    const validatedData = validationResult.data;

    // Determine the status
    let finalStatus: typeof BirStatusArray[number] = 'submitted'; // Default status
    if (validatedData.status && BirStatusArray.includes(validatedData.status)) {
        finalStatus = validatedData.status;
    }

    const dataToUpsert: BirTable['Insert'] = {
        project_id: validatedData.project_id,
        client_id: validatedData.client_id, 
        project_type: validatedData.project_type, 
        answers: validatedData.answers ?? {}, 
        status: finalStatus 
    };

    const { data, error } = await supabase
        .from('business_information_requests')
        .upsert(dataToUpsert, { onConflict: 'project_id' }) // Upsert based on project_id constraint
        .select('*')
        .single(); // Expect a single row back after upsert

    if (error) {
        console.error('Error upserting BIR:', error);
        throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
        // Should not happen with .single() unless RLS prevented seeing the result
        throw new Error('Failed to upsert BIR record or retrieve the result.');
    }

    // Cast the result to BirRow for type consistency, although it should match
    return data as BirRow;
}

/**
 * Updates specific fields of a Business Information Request (BIR) record.
 * Primarily intended for updating 'answers' or 'status'.
 * Validates input data using birUpdateSchema.
 * Requires an authenticated Supabase client instance.
 *
 * Args:
 *     supabase: An *authenticated* Supabase client instance.
 *     birUpdateData: The partial data for the BIR update (BirUpdateDTO).
 *
 * Returns:
 *     The updated BIR row.
 *
 * Throws:
 *     If validation fails or there's a database error.
 */
export async function updateBir(
    supabase: SupabaseClient<Database>,
    birUpdateData: BirUpdateDTO
): Promise<BirRow> {
    // Validate input data against the schema
    const validationResult = birUpdateSchema.safeParse(birUpdateData);
    if (!validationResult.success) {
        console.error('Validation errors:', validationResult.error.flatten());
        throw new Error(`Invalid BIR update data: ${validationResult.error.message}`);
    }

    const validatedData = validationResult.data;
    const birId = validatedData.id; // Extract ID from validated data

    // Map validated DTO to the database update type
    const dataToUpdate: BirTable['Update'] = {
        // Only include fields that were actually provided and validated
        ...(validatedData.answers !== undefined && { answers: validatedData.answers }),
        ...(validatedData.status !== undefined && { status: validatedData.status }),
        // updated_at is handled by the database trigger
    };

    // Ensure there's actually something to update after filtering
    if (Object.keys(dataToUpdate).length === 0) {
         throw new Error('No valid fields provided for update.');
    }

    const { data, error } = await supabase
        .from('business_information_requests')
        .update(dataToUpdate)
        .eq('id', birId)
        .select('*')
        .single(); // Expect a single row back after update

    if (error) {
        console.error('Error updating BIR:', error);
        // Handle specific errors like RLS violation or record not found (error.code)
        if (error.code === 'PGRST116') { // PostgREST code for "Resource not found or permission denied"
             throw new Error(`BIR record with ID ${birId} not found or access denied.`);
        }
        throw new Error(`Database error: ${error.message}`);
    }

     if (!data) {
        // Should not happen with .single() unless RLS prevented seeing the result
        throw new Error('Failed to update BIR record or retrieve the result.');
    }

    // Cast the result to BirRow for type consistency
    return data as BirRow;
}

// Optional: Add specific function for status update if needed,
// potentially with more specific role checks if RLS isn't sufficient.
// export async function updateBirStatus(...) {} 