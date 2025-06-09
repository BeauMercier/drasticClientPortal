import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
                              process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  try {
    console.log('--- Running debugBir.ts ---');
    const projectId = 'bb3d6f35-76d1-419d-9836-c95c2981ec14';
    console.log(`Querying for projectId: ${projectId}`);

    const { data, error } = await supabase
      .from('web_design_projects')
      .select(`
        *,
        bir:business_information_requests ( * )
      `)
      .eq('id', projectId)
      .single();

    console.log('RAW RESULT:', { error, data });
  } catch(e) {
    console.error('--- SCRIPT FAILED ---');
    console.error(e);
  } finally {
    console.log('--- Script finished ---');
  }
})(); 