# Project Root Structure

```
.
├── .cursor/
├── .git/
├── .github/
├── .husky/
├── .next/
├── .specstory/
├── .vercel/
├── docs/
├── node_modules/
├── public/
├── scripts/
├── src/
│   ├── .DS_Store
│   ├── app/
│   │   ├── .DS_Store
│   │   ├── (admin)/
│   │   │   ├── admin/
│   │   │   │   ├── billing/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── designers/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── projects/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── AdminProjectDetailsModal.tsx
│   │   │   │   │   │   └── ProjectFileList.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── types.ts
│   │   │   │   │   └── view/
│   │   │   │   │       └── [projectId]/
│   │   │   │   │           └── page.tsx
│   │   │   │   ├── support/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── users/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (client)/
│   │   │   ├── client/
│   │   │   │   ├── billing/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── files/
│   │   │   │   ├── my-profile/
│   │   │   │   │   ├── .DS_Store
│   │   │   │   │   ├── business-info/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── my-info/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── projects/
│   │   │   │   │   ├── .DS_Store
│   │   │   │   │   ├── logo-design/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── social-graphics/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── web-design/
│   │   │   │   │       ├── [id]/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       └── page.tsx
│   │   │   │   └── settings/
│   │   │   └── layout.tsx
│   │   ├── (designer)/
│   │   │   ├── designer/
│   │   │   │   ├── calendar/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── projects/
│   │   │   │   │   ├── [type]/
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── web-design/
│   │   │   │   │       └── [id]/
│   │   │   │   │           └── page.tsx
│   │   │   │   └── tasks/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── .DS_Store
│   │   │   ├── admin/
│   │   │   │   ├── check-env/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── debug/
│   │   │   │   │   ├── create-designer/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── delete-user/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── designers/
│   │   │   │   │   └── workload/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── list-users/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── project-files/
│   │   │   │   │   └── [projectType]/
│   │   │   │   │       └── [projectId]/
│   │   │   │   │           └── route.ts
│   │   │   │   ├── projects/
│   │   │   │   │   ├── [projectType]/
│   │   │   │   │   │   └── [projectId]/
│   │   │   │   │   │       └── files/
│   │   │   │   │   ├── [type]/
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── assignment/
│   │   │   │   │   │       │   └── route.ts
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   ├── activate-all/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── assign-designer/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── assignments/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── delete/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── force-create/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── logo_design/
│   │   │   │   │   │   └── [projectId]/
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── social_graphics/
│   │   │   │   │   │   └── [projectId]/
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   ├── toggle-active/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── toggle-status/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── update/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── update-stage/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── web_design/
│   │   │   │   │       └── [projectId]/
│   │   │   │   │           └── route.ts
│   │   │   │   ├── register-designer/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── security/
│   │   │   │   │   └── rls-setup/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── test-service-key/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── users/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── users-workaround/
│   │   │   ├── auth/
│   │   │   │   ├── check/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── logout/
│   │   │   │   │   └── route.ts
│   │   │   │   └── session/
│   │   │   │       └── route.ts
│   │   │   ├── bir/
│   │   │   │   ├── create-upload-url/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── file/
│   │   │   │   │   └── [fileId]/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── record-file/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── route.ts
│   │   │   │   └── upload/
│   │   │   │       └── route.ts
│   │   │   ├── business-profile/
│   │   │   │   └── route.ts
│   │   │   ├── client/
│   │   │   │   ├── active-projects/
│   │   │   │   │   └── route.ts
│   │   │   │   └── all-user-files/
│   │   │   ├── env-debug/
│   │   │   │   └── route.ts
│   │   │   ├── files/
│   │   │   │   └── url/
│   │   │   │       └── route.ts
│   │   │   ├── projects/
│   │   │   │   ├── [projectId]/
│   │   │   │   │   └── user-files/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── files/
│   │   │   │   │   ├── delete/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── download/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── upload/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── logo_design/
│   │   │   │   │   └── [projectId]/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── revisions/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── social_graphics/
│   │   │   │   │   └── [projectId]/
│   │   │   │   │       └── route.ts
│   │   │   │   └── web_design/
│   │   │   │       └── [projectId]/
│   │   │   │           └── route.ts
│   │   │   └── user-files/
│   │   │       └── [userFileId]/
│   │   │           └── route.ts
│   │   ├── debug-env/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── management/
│   │   │   ├── .DS_Store
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   ├── google-ads/
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── website/
│   │   │       └── page.tsx
│   │   ├── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── update-password/
│   │       └── page.tsx
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminSidebar.tsx
│   │   │   └── DesignerWorkloadDashboard.tsx
│   │   ├── BirFileUploader.tsx
│   │   ├── client/
│   │   │   └── ClientSidebar.tsx
│   │   ├── EnvFallback.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── FileList/
│   │   ├── layout/
│   │   │   └── DashboardLayout.tsx
│   │   ├── projects/
│   │   │   ├── ProjectTimeline.tsx
│   │   │   └── StageSelect.tsx
│   │   ├── providers/
│   │   │   └── ReactQueryProvider.tsx
│   │   ├── Sidebar/
│   │   │   └── index.tsx
│   │   └── ui/
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── coming-soon.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form/
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── skeleton.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       └── use-toast.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   │   └── index.ts
│   │   │   ├── components/
│   │   │   │   ├── index.ts
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── PasswordResetForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── UpdatePasswordForm.tsx
│   │   │   ├── contexts/
│   │   │   │   ├── AuthContext.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── index.ts
│   │   │   │   └── useAuth.ts
│   │   │   ├── index.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── billing/
│   │   │   ├── api/
│   │   │   │   └── index.ts
│   │   │   ├── components/
│   │   │   │   ├── index.ts
│   │   │   │   └── InvoiceList.tsx
│   │   │   ├── contexts/
│   │   │   ├── hooks/
│   │   │   │   ├── index.ts
│   │   │   │   └── useBilling.ts
│   │   │   ├── index.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── bir/
│   │   │   ├── __mocks__/
│   │   │   │   └── makeMockBir.ts
│   │   │   ├── birStepConfig.ts
│   │   │   ├── BirSummary.tsx
│   │   │   ├── BusinessInfoGate.test.tsx
│   │   │   ├── BusinessInfoGate.tsx
│   │   │   ├── components/
│   │   │   │   └── BirStatusBanner.tsx
│   │   │   ├── index.ts
│   │   │   ├── MultiStepBirForm.tsx
│   │   │   ├── steps/
│   │   │   │   ├── CompanyDetailsStep.tsx
│   │   │   │   ├── ContactPresenceStep.tsx
│   │   │   │   ├── FileUploadStep.tsx
│   │   │   │   ├── FinalCommentsStep.tsx
│   │   │   │   ├── OfficialInfoStep.tsx
│   │   │   │   ├── SupportingInfoStep.tsx
│   │   │   │   └── WebsiteSpecificsStep.tsx
│   │   │   └── useBir.ts
│   │   ├── files/
│   │   │   ├── api/
│   │   │   │   └── index.ts
│   │   │   ├── components/
│   │   │   │   └── RecentFiles.tsx
│   │   │   ├── contexts/
│   │   │   ├── hooks/
│   │   │   │   ├── index.ts
│   │   │   │   └── useFileStorage.ts
│   │   │   ├── index.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   └── projects/
│   │       ├── api/
│   │       │   └── index.ts
│   │       ├── components/
│   │       │   └── ProjectList.tsx
│   │       ├── contexts/
│   │       ├── hooks/
│   │       │   ├── index.ts
│   │       │   ├── useProject.ts
│   │       │   ├── useProjectRealtime.ts
│   │       │   └── useProjects.ts
│   │       ├── index.ts
│   │       └── types/
│   │           └── index.ts
│   ├── lib/
│   │   ├── api/
│   │   │   ├── admin.ts
│   │   │   ├── API_ARCHITECTURE.md
│   │   │   ├── bir.ts
│   │   │   ├── client-api.ts
│   │   │   ├── client.ts
│   │   │   ├── index.ts
│   │   │   ├── schema.ts
│   │   │   ├── server-business-api.ts
│   │   │   ├── server-utils.ts
│   │   │   ├── server.ts
│   │   │   └── storage.ts
│   │   ├── config/
│   │   │   ├── auth-config.ts
│   │   │   └── index.ts
│   │   ├── database.types.ts
│   │   ├── database.types.ts.
│   │   ├── db/
│   │   │   ├── apply-migrations.js
│   │   │   ├── apply-migrations.mjs
│   │   │   ├── create_web_design_projects.sql
│   │   │   ├── enhanced_schema.sql
│   │   │   ├── migrations/
│   │   │   │   ├── 00006_create_business_profiles.sql
│   │   │   │   ├── 02_add_timeline_fields.sql
│   │   │   │   ├── 05_revision_file_schema_update.sql
│   │   │   │   ├── 20250326000000_create_designer_tasks.sql
│   │   │   │   ├── 20250326000001_create_get_user_role_function.sql
│   │   │   │   ├── 20250328000000_implement_rls_policies.sql
│   │   │   │   ├── admin_delete_user.sql
│   │   │   │   ├── designer_tasks.sql
│   │   │   │   ├── permanent_rls_fix.sql
│   │   │   │   ├── permanent_rls_fix_for_all_tables.sql
│   │   │   │   └── safe_implement_rls_policies.sql
│   │   │   └── schema.sql
│   │   ├── env.ts
│   │   ├── logger.ts
│   │   ├── supabase/
│   │   │   ├── admin.ts
│   │   │   ├── api-auth.ts
│   │   │   ├── apply-migrations.js
│   │   │   ├── apply-migrations.mjs
│   │   │   ├── auth-helpers.ts
│   │   │   ├── auth-timeout.md
│   │   │   ├── auth-timeout.ts
│   │   │   └── SECURITY_RECOMMENDATIONS.md
│   │   ├── supabaseServer.ts
│   │   ├── types/
│   │   │   ├── api.ts
│   │   │   ├── billing/
│   │   │   ├── billing.ts
│   │   │   ├── bir.ts
│   │   │   ├── common.ts
│   │   │   ├── dbHelpers.ts
│   │   │   ├── file.ts
│   │   │   ├── index.ts
│   │   │   ├── project/
│   │   │   ├── project.ts
│   │   │   ├── support/
│   │   │   ├── support.ts
│   │   │   ├── task.ts
│   │   │   ├── user/
│   │   │   └── user.ts
│   │   ├── utils/
│   │   │   ├── cn.ts
│   │   │   ├── date/
│   │   │   ├── formatFileSize.ts
│   │   │   ├── formatting/
│   │   │   ├── getFileIcon.tsx
│   │   │   ├── index.ts
│   │   │   ├── user.ts
│   │   │   └── validation/
│   │   ├── utils.ts
│   │   └── validation/
│   │       ├── bir.test.ts
│   │       └── bir.ts
│   ├── middleware.ts
│   ├── shared/
│   │   ├── contexts/
│   │   │   ├── index.ts
│   │   │   └── UIContext.tsx
│   │   ├── index.ts
│   │   ├── types/
│   │   └── ui/
│   │       ├── atoms/
│   │       │   ├── Button.tsx
│   │       │   ├── index.ts
│   │       │   ├── Input.tsx
│   │       │   └── ThemeToggle.tsx
│   │       ├── buttons/
│   │       ├── feedback/
│   │       ├── forms/
│   │       ├── index.ts
│   │       ├── layout/
│   │       │   ├── AppLayout.tsx
│   │       │   ├── components/
│   │       │   ├── Header/
│   │       │   │   ├── ActionButton.tsx
│   │       │   │   ├── index.tsx
│   │       │   │   ├── Notifications.tsx
│   │       │   │   ├── NotificationsMenu.tsx
│   │       │   │   ├── PageTitle.tsx
│   │       │   │   ├── QuickActions.tsx
│   │       │   │   ├── types.ts
│   │       │   │   └── UserProfileMenu.tsx
│   │       │   └── Header.tsx
│   │       └── molecules/
│   │           ├── Card.tsx
│   │           └── index.ts
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       └── global.d.ts
├── supabase/
├── tests/
├── .DS_Store
├── .eslintignore
├── .eslintrc.json
├── .gitignore
├── .lintstagedrc.js
├── components.json
├── eslint-report.json
├── file_output.txt
├── ind_files_by_rule.py
├── lint_output.txt
├── next-env.d.ts
├── next.config.js
├── package-lock.json
├── package.json
├── PLANNING.md
├── postcss.config.js
├── README.md
├── script.py
├── tailwind.config.js
├── TASK.MD
├── tsconfig.json
├── tsconfig.typedoc.json
└── vitest.config.ts
``` 