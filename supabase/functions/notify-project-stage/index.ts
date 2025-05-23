// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

/* eslint-disable no-console */
/*  deno-lint-ignore-file no-explicit-any */

/*
  Edge-runtime typings (keeps Deno/VS Code happy)
  https://jsr.io/@supabase/functions-js
*/
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// @deno-types="https://esm.sh/@supabase/supabase-js@2.42.3/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.3";

/*
  Env vars expected (set via `supabase secrets set …`)

  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  PROJECT_STAGE_WEBHOOK_SECRET   // optional but strongly recommended
*/

Deno.serve(async (req) => {
  console.log("--- notify-project-stage INVOKED (v2) ---"); // Entry log with version

  // ── 1. Optional shared-secret verification ───────────────────────────────
  const SIGNING_SECRET = Deno.env.get("PROJECT_STAGE_WEBHOOK_SECRET");
  if (SIGNING_SECRET) {
    const incomingSecret = req.headers.get("x-webhook-secret");
    if (incomingSecret !== SIGNING_SECRET) {
      console.error("Webhook secret mismatch!");
      return new Response("unauthorised", { status: 401 });
    }
    console.log("Webhook secret VERIFIED.");
  }

  // ── 2. Parse payload and derive information ─────────────────────────────
  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    console.error("Failed to parse JSON payload:", e);
    return new Response("invalid json payload", { status: 400 });
  }

  if (!body.record || !body.table) {
    console.error("Payload missing 'record' or 'table' field.");
    return new Response("invalid payload structure", { status: 400 });
  }

  const newStage = body.record.current_stage ?? body.record.stage;
  const oldStage = body.old_record?.current_stage ?? body.old_record?.stage;

  if (newStage === oldStage) {
    console.log("Stage unchanged. Exiting with 200 OK.");
    return new Response("stage unchanged", { status: 200 });
  }

  const projectTitle = body.record.title ?? body.record.name ?? "Project";
  const userId = body.record.user_id; // Ensure this is the correct field for user ID

  if (!userId) {
    console.error("Missing user_id in record.");
    return new Response("missing user_id", { status: 400 });
  }

  // Derive projectType from the table name
  const projectType = (body.table as string)
    .replace('_projects', '')
    .replaceAll('_', '-');

  // Build the link
  const link = `/client/projects/${projectType}/${body.record.id}`;
  console.log('🚀 new notification link:', link); // For verification

  // ── 3. Init service-role client  ──────────────────────────────────────────
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── 4. Insert notification  ───────────────────────────────────────────────
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type: 'info',
    trigger_event: 'project_stage_updated', // Added this back as it's good for categorization
    title: `${projectType.replace('-', ' ')} stage updated`, // Use projectType in title
    message: `Your project "${projectTitle}" moved to ${newStage}.`, // Use 'message' to align with hook, use projectTitle
    link: link
  });

  if (error) {
    console.error('⛔️ notification insert failed:', error);
    return new Response('db error: ' + error.message, { status: 500 });
  }

  console.info(
    `✅ notification sent → user ${userId} (project ${body.record.id}, type ${projectType}, stage ${newStage})`
  );
  return new Response('ok', { status: 200 });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/notify-project-stage' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
