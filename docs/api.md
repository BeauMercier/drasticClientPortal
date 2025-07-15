# API Routes

This document lists the expected base API routes. The CI check ensures this list matches the directories in `src/app/api/`.

- `/api/admin`
- `/api/bir`
  - **Purpose**: Handles all data operations for the text-based content of the Business Information Request (BIR).
  - **Endpoints**:
    - `GET /api/bir?projectId=[uuid]`: Fetches the BIR data for a specific project.
    - `POST /api/bir`: Creates a new BIR record.
    - `PATCH /api/bir`: Updates an existing BIR record.
  - **Important Note on 403 Errors**: This endpoint is protected by Supabase Row Level Security (RLS) policies. A "403 Forbidden" error will be returned if the request violates these policies. A common cause for this, which has been addressed on the client-side, is sending a request with an invalid or missing `client_id` when creating a new BIR. The client form (`MultiStepBirForm.tsx`) now includes logic to prevent save actions until user data is fully loaded, mitigating this issue.
- `/api/client`
- `/api/files`
- `/api/projects`
- `/api/user-files`
- `/api/auth`
- `/api/business-profile`
- `/api/env-debug`
- `/api/notifications`
  - **Purpose**: Manages user notifications, including fetching, marking as read, and real-time updates.
  - **Endpoints**:
    - `GET /api/notifications`: Fetches a list of notifications for the authenticated user.
    - `POST /api/notifications/[id]/read`: Marks a specific notification as read.
    - `POST /api/notifications/read-all`: Marks all of a user's unread notifications as read. 