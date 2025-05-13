## Tasks

### April 2, 2024

- [x] Refactor client routes to use `/client` prefix and implement dedicated client sidebar
    - Moved client pages from `src/app/(client)/*` to `src/app/(client)/client/*`.
    - Created `src/app/(client)/client/page.tsx` as the main dashboard page.
    - Updated middleware expectations for client routes.
    - Created dedicated `src/components/client/ClientSidebar.tsx`, styled like `AdminSidebar`.
    - Updated `src/app/(client)/layout.tsx` to use `ClientSidebar`.
    - Fixed broken relative imports in refactored client pages.

- [x] Move `src/app/projects` route into client group (`src/app/(client)/client/projects`).
    - Fixed relative imports in `projects/page.tsx`.
    - Updated `href` paths in `projects/page.tsx` and sub-pages (`logo-design`, `social-graphics`, `web-design`) to include `/client` prefix.
- [x] Add "Projects" link to `ClientSidebar`.
- [x] Implement client-side upload functionality on Web Design project detail page (`src/app/(client)/client/projects/web-design/[id]/page.tsx`).
    - Updated `handleFileUpload` to call `/api/projects/files/upload` with `FormData`.
    - Added toast notifications for upload status.
    - Added placeholder `reloadProjectData` function call.

### [Current Date]

- [x] Deprecated and removed the `/client/settings` page (`src/app/(client)/client/settings/page.tsx`).
- [x] Updated `PLANNING.md` and `README.md` to remove references to the settings page.

### Discovered During Work

- TODO: Implement actual data fetching and content for `src/app/(client)/client/page.tsx`.
- TODO: Verify if pages under `/client/my-profile` (my-info, business-info) should have separate sidebar links or be accessed via tabs/sections within the `/client/my-profile` page.
- TODO: Update API route `/api/projects/files/upload` to insert metadata into `user_files` table after storage upload.
- TODO: Implement `reloadProjectData` function in `src/app/(client)/client/projects/web-design/[id]/page.tsx` to correctly refetch project details and files.
- TODO: Implement API route to fetch project-specific files from `user_files` table (e.g., `/api/projects/[projectId]/user-files`), respecting RLS.
- TODO: Update client project detail pages (`web-design`, `logo-design`, `social-graphics`) to fetch and display files using the new API route.
- TODO: Implement download functionality for project files on client detail pages (using `/api/files/url`).
- TODO: Implement delete functionality for project files on client detail pages (requires new API route and RLS check - user can delete own files).
- TODO: Review and refine RLS policies on `user_files` table to ensure correct access for clients, assigned designers, and admins.

- [x] Update API route `/api/projects/files/upload` to insert metadata into `user_files` table after storage upload.
- [x] Implement API route `/api/projects/[projectId]/user-files` to fetch project-specific files from `user_files` table, respecting RLS.
- [x] Implement API route `/api/user-files/[userFileId]` to handle deletion of `user_files` record and corresponding storage object, respecting RLS.
- [x] Implement fetching, display, download, and delete functionality for project files (`user_files`) on Web Design project detail page.
- [x] Add and refine Database RLS policies for `user_files` table (SELECT, INSERT, UPDATE, DELETE for users, admins, designers).
- [x] Add and refine Storage RLS policies for `project-files` bucket (INSERT, SELECT).
- [x] Fix infinite loop on `/client/files` page caused by `FileList` component's `useEffect` hooks.
    - Stabilized dependencies for initial load effect.
    - Prevented unnecessary state updates in preview URL effect.
- [x] Fix download functionality on `/client/files` page by correcting client-side parsing of `/api/files/url` response.

- TODO: Implement `reloadProjectData` function fully in `src/app/(client)/client/projects/web-design/[id]/page.tsx` (currently logs only).
- TODO: Replicate project file fetching/display/download/delete functionality for Logo Design and Social Graphics project detail pages.
- TODO: Implement the general file upload on `/client/files` page (via `FileContext`) to also insert metadata into the `user_files` table (with `project_id=NULL`).

### Feature: Business Information Request (BIR)

*This feature replaces the external Zoho form with an integrated, project-specific form.*

- [ ] **Refactor: Convert BIR to Multi-Step Form** (Current Date - as per PLANNING.md)
    - [x] Create directory `src/features/bir/steps/`. (Done)
    - [x] Define `birStepConfig.ts` (optional, for step definitions). (Done)
    - [x] Create individual step components (e.g., `OfficialInfoStep.tsx`, `ContactPresenceStep.tsx`, etc.). (Done: OfficialInfoStep, ContactPresenceStep, CompanyDetailsStep, SupportingInfoStep, WebsiteSpecificsStep, FinalCommentsStep)
    - [ ] Create `MultiStepBirForm.tsx` orchestrator.
    - [ ] Create `FileUploadStep.tsx`.
    - [ ] Update `BusinessInfoGate.tsx` to use `MultiStepBirForm.tsx`.
    - [ ] Implement UI/UX enhancements (stepper, validation).
    - [ ] Clean up old `BirForm.tsx`.

- [x] **Planning:** Confirm final BIR field list & validations with stakeholders. ⚠
- [x] **Database:** Write migration script (`supabase/migrations/..._add_business_information_requests.sql`) for `business_information_requests` table, FKs, enum, trigger, indexes.
- [x] **Database:** Apply migration using `supabase db push` (or standard migration process).
- [x] **Database:** Implement RLS policies for `business_information_requests` (Admin, Client, Designer access) including `project_type = 'web_design'` constraint.
- [x] **Database:** Verify RLS policies work correctly using PostgREST API calls for various user roles (Admin, Client A, Client B, Designer C).
- [x] **Types:** Create `src/lib/types/bir.ts` with `BirStatus` enum, `BirRow`, `BirInsert`, `BirUpdate`, and `Bir` interface.
- [x] **Types:** Run `supabase gen types typescript --local > src/lib/database.types.ts` to update generated types.
- [x] **Backend (API Helpers):** Create `src/lib/api/bir.ts` with low-level Supabase data access functions (`fetchBirByProject`, `upsertBir`, `updateBir`).
- [x] **Backend (API Route):** Implement API route `src/app/api/bir/route.ts` with GET, POST, PATCH handlers using helpers and auth checks.
- [x] **Frontend:** Define Zod schema for BIR fields (`src/lib/validation/bir.ts`).
- [x] **Validation:** Define Zod schemas in `src/lib/validation/bir.ts` (`birStatusSchema`, `birInsertSchema`, `birUpdateSchema`) and derive DTO types.
- [x] **Frontend:** Create data fetching hook `useBir(projectId)` (`src/features/bir/useBir.ts`).
- [x] **Frontend:** Create `src/features/bir/BusinessInfoForm.tsx` component (RHF, ShadCN inputs, basic save logic).
- [x] **Frontend:** Create `src/features/bir/BusinessInfoSummary.tsx` component (read-only view).
- [x] **Frontend:** Create `src/features/bir/BusinessInfoGate.tsx` to manage display logic (form vs. summary) based on `useBir` data and user role.
- [x] **Frontend:** Integrate `BusinessInfoGate` into the **client** web design project detail page component (`src/app/(client)/client/projects/web_design/[id]/page.tsx`).
- [x] **Frontend:** Integrate `BusinessInfoGate` into the **designer** web design project detail page component (`src/app/(designer)/designer/projects/web_design/[id]/page.tsx`) (Note: Page uses placeholder data fetching).
- [x] **QA:** Basic form submission/update verified (Client view). Data saves correctly to DB after UNIQUE constraint added.
- [x] **Build Fix:** Resolved Vercel build error caused by client components importing server-only API route files by moving shared `BirFileType` enum to `src/lib/types/bir.ts` and correcting import paths. Resolved TypeScript error in `BusinessInfoGate.tsx` by passing `mutateBir` prop to `BirForm`.

- [x] **File Upload - DB Migration:** Create `bir_file` table (`supabase/migrations/..._add_bir_file_table.sql`). (User to confirm applied)
- [x] **File Upload - API Route:** Create `POST /api/bir/upload` endpoint.
- [x] **File Upload - Client Component:** Create `BirFileUploader.tsx`.
- [x] **File Upload - Form Integration:** Add `BirFileUploader` instances to `BirForm.tsx`.
- [x] **File Upload - Summary Display:** Update `useBir` hook and `BirSummary.tsx` to fetch and display files with signed URLs.
- [x] **File Upload - RLS & Storage Policies:** Create migration (`..._bir_file_rls.sql`) for `bir_file` RLS and `storage.objects` policies. (User to confirm applied)
- [ ] **File Upload - Type Regeneration:** Regenerate Supabase types (`npx supabase gen types ...`) and remove placeholder types/casts. (User to confirm completion)

- [ ] **Backend:** (Optional) Implement PATCH `/status` handler for admin/designer approval.
- [ ] **Backend:** Add unit/integration tests for the new API routes (using Jest/Vitest).
- [ ] **Frontend:** Create mutation hooks `useSaveBir()` (POST/PUT) and `useApproveBir()` (PATCH). (*Note: Basic POST/PATCH logic implemented within `BirForm.tsx` for now. Refactor into dedicated hooks if complexity increases.*)
- [ ] **Frontend:** Refine "Other Social Links" input in `BirForm.tsx`.
- [ ] **Designer Page:** Implement actual data fetching for the designer web design project detail page.
- [ ] **QA:** Test the entire flow thoroughly: form display logic, submission, validation, file handling, role-based access (client, designer, admin), mobile responsiveness.
- [ ] **UI Polishing:** Refine styles, layout, component usage (e.g., status badges), and add more specific field validation messages in `BirForm.tsx`.
- [ ] **Documentation:** Update `README.md` and `PLANNING.md` with details about the BIR file upload feature.
- [ ] **Documentation:** Update onboarding guides for clients explaining the new process.
- [ ] **Deployment:** Consider releasing behind a feature flag (`NEXT_PUBLIC_ENABLE_BIR=true`).
- [ ] **Notifications (Optional):** Implement Edge Function/Realtime listener to notify relevant users on BIR submission.