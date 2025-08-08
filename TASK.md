# Tasks

## Completed Tasks

- **(2025-08-07) - Dev-only redesigned client profile page (`/client/my-profile-v2`)**
  - Implemented a standalone page at `src/app/client/my-profile-v2/page.tsx` mirroring the new dashboard layout (fixed layered background, top bar with `DrasticLogo`, centered title, framed grid).
  - Combined profile section (avatar, name, company) with action buttons linking to `/client/my-profile` and `/client/my-profile/business-info`.
  - Added segmented-control tabs for Contact Information and Business Information, plus placeholders for Uploaded Media, All Projects, and Referrals.
  - Right column shows real notifications via `useNotifications` and two CTAs: Website Dashboard (uses `profile.website_dashboard_url` with `/client/projects/web-design` fallback) and Leads Portal (`https://leads.drasticdigital.com`).
  - Whitelisted the route in `src/middleware.ts` to bypass legacy `(client)` layout/auth for dev-only testing.
  - Resolved duplicate route conflict by ensuring only `src/app/client/my-profile-v2/page.tsx` exists; cleared Next.js cache.

- **(Session Date) - Comprehensive Redesign and Troubleshooting of V2 Client Dashboard**
  - **Objective**: To perform a detailed investigation and iterative redesign of the new client dashboard (`/client/new-dashboard`), and to diagnose and resolve significant build-level and runtime errors that emerged during the process.
  - **File Modified**: `src/app/client/new-dashboard/NewClientPage.tsx`
  - **Key Outcomes & Summary**:
    - **Iterative UI/UX Refinement**:
      - Performed dozens of iterative style and layout adjustments to all three columns of the dashboard based on user feedback.
      - **Left Column**: Adjusted profile picture size, button heights, menu item spacing, text styles (color, weight, size), separator line thickness and color, and icon visibility to achieve a compact, visually appealing layout.
      - **Middle Column**: Refined the layout and styling of the top "Design Projects" section and the bottom "Need Support?" banner, including borders, margins, image positioning, button styles, and text content. Unified typography across all components in this column.
      - **Right Column**: Enlarged the notification badge and added a separator line to the notifications panel for better visual hierarchy.
    - **Architectural Layout & Responsiveness (Major Fix)**:
      - **Problem**: The dashboard's main content area was built with viewport units (`vh`, `vw`), causing it to shrink, resize, and overlap other elements unpredictably on different screen sizes.
      - **Solution**: The layout was completely re-architected to use modern CSS. The `height` and `top` properties of the main content container now use `max()` to set a minimum pixel-based size while allowing fluid scaling on larger screens. The `aspect-ratio` property is used to maintain proportions automatically. This created a robust layout that is stable on small screens and responsive on large ones.
    - **Build & Environment Troubleshooting**:
      - **Problem**: Encountered a blank white screen and `404 Not Found` / `MODULE_NOT_FOUND` errors in the console, indicating a corrupted development environment.
      - **Solution**: Resolved the issue by performing a clean reinstall of project dependencies (`rm -rf .next node_modules package-lock.json` followed by `npm install`).
    - **Next.js Hydration Error (Critical Bug Fix)**:
      - **Problem**: A separate blank-screen issue was traced to a fatal client-side hydration error.
      - **Root Cause**: An anti-pattern was discovered where an inline `style` prop with `width`/`height` was being used on a Next.js `<Image>` component that also had the `fill` prop.
      - **Solution**: The `<Image>` was replaced with a `div` using a standard CSS `background-image`, which resolved the crash. A new linting rule was added to `.eslintrc.json` to prevent this from happening in the future.

---
(Previous tasks are listed below)

## Discovered During Work

- Populate "Uploaded Media" and "All Projects" tabs with real components/data sources.
- Consider inline editing or deep links to edit subforms within the dev page (optional).
- Confirm design polish (spacing, shadows, borders) against latest mockups.
- Optionally hide CTAs based on available URLs/permissions.

## Completed (Session) - Stability & Error Handling Improvements

- Added `src/app/global-error.tsx` to satisfy App Router error UI requirements and prevent blank screen with “missing required error components”.
- Set `ThemeProvider` default theme to `dark` in `src/app/layout.tsx`; wrapped `/client/new-dashboard` and `/client/my-profile-v2` roots in `div.dark` for consistent styling.
- Fixed JSX wrapper issues in V2 pages that caused "Unexpected token div" build errors.
