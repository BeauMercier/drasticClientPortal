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

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.2";

/*
  Env vars expected (set via `supabase secrets set …`)

  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  PROJECT_STAGE_WEBHOOK_SECRET   // optional but strongly recommended
*/

Deno.serve(async (req) => {
  // ── 1. Optional shared-secret verification ───────────────────────────────
  const SIGNING_SECRET = Deno.env.get("PROJECT_STAGE_WEBHOOK_SECRET");
  if (SIGNING_SECRET) {
    const incomingSecret = req.headers.get("x-webhook-secret");
    if (incomingSecret !== SIGNING_SECRET) {
      return new Response("unauthorised", { status: 401 });
    }
  }

  // ── 2. Parse and sanity-check payload (Supabase "db webhook" format) ──────
  const { record, old_record } = (await req.json()) as {
    record: any;
    old_record: any;
  };

  if (!record) return new Response("no record", { status: 400 });

  // Prefer new canonical column names but fall back to legacy ones
  const newStage = record.current_stage ?? record.stage;
  const oldStage = old_record?.current_stage ?? old_record?.stage;

  // No stage change → nothing to do
  if (newStage === oldStage) return new Response("stage unchanged", { status: 200 });

  const projectTitle = record.title ?? record.name ?? "Project";
  const userId = record.client_id;
  if (!userId) return new Response("missing client_id", { status: 400 });

  // ── 3. Init service-role client  ──────────────────────────────────────────
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── 4. Insert notification  ───────────────────────────────────────────────
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type: "info",
    trigger_event: "project_stage_updated",
    title: "Project stage updated",
    message: `"${projectTitle}" moved to ${newStage}.`,
    link: `/client/projects/${record.id}`,
  });

  if (error) {
    console.error("⛔️  notification insert failed:", error);
    return new Response("db error", { status: 500 });
  }

  console.info(
    `✅  notification sent → user ${userId} (project ${record.id}, stage ${newStage})`
  );
  return new Response("ok", { status: 200 });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/notify-project-stage' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
