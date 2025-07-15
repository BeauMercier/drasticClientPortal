# API Architecture & Data Flow

This document outlines the architecture of the frontend API, the Supabase client implementation, and the data flow patterns used throughout the application.

## 1. Supabase Client: The Singleton Pattern

The core of our data layer is the Supabase client, which is implemented as a **singleton** to ensure a single, consistent connection is used across the entire application.

**File:** `src/lib/api/client.ts`

### Key Concepts:

-   **`createBrowserClient` from `@supabase/ssr`**: We use this special client factory to create an SSR-aware Supabase client. This client can securely access the user session from the `HttpOnly` cookie, which is essential for our authentication strategy. It seamlessly bridges the gap between server components (which can read the cookie) and client components (which cannot).
-   **Singleton Instance (`supabase`)**: The file creates a single, exported instance named `supabase`. **All new code should import and use this instance directly.**
    ```typescript
    import { supabase } from '@/lib/api/client';
    ```
-   **Backward Compatibility**: To support a large amount of legacy code without requiring a full, immediate refactor, two backward-compatibility exports exist:
    -   `createClient()`: A factory function that simply returns the singleton instance.
    -   `default export`: A default export of the singleton instance.
    These exist to prevent older files that use `createClient()` or `import supabase from...` from breaking the build. They should be phased out over time.

## 2. API Entry Point: Namespaced Structure

To avoid function name collisions and create a clear, organized API, we use a namespaced structure defined in our main API entry point.

**File:** `src/lib/api/index.ts`

### Key Concepts:

-   **Central `api` Object**: This file exports a primary `api` object that groups all client-safe functions by their domain.
-   **Namespaces**: The available namespaces are:
    -   `api.client`: Contains the bulk of client-facing functions, such as fetching projects or user profiles. (from `client-api.ts`)
    -   `api.storage`: Contains functions for interacting with Supabase Storage, like uploading files. (from `storage.ts`)
-   **Usage**: To use the API, import the `api` object and call functions from their respective namespaces.

    ```typescript
    import { api } from '@/lib/api';

    async function getUser() {
      const profile = await api.client.getUserProfile();
      // ...
    }
    ```
-   **Direct Supabase Access**: `index.ts` also re-exports the `supabase` singleton client for cases where direct Supabase access is needed (e.g., in a component's `useEffect` hook for real-time subscriptions).

## 3. Primary API Modules

-   **File:** `src/lib/api/client-api.ts`
    -   **Purpose**: This is the largest and most important API module for client-side operations. It contains a wide array of functions for fetching and manipulating data related to projects, users, BIRs, and more. If you need a function to get data for a client component, it's probably in this file.
-   **File:** `src/lib/api/storage.ts`
    -   **Purpose**: This module provides a simplified interface for interacting with Supabase Storage. It contains helper functions like `uploadFile`.

## 4. Authentication Flow & Session Management

The application's authentication flow is fundamentally tied to this API structure.

-   **Initial Load (SSR):** On the server, Next.js uses the Supabase client to read the `HttpOnly` session cookie and render the page with the correct user state.
-   **Client-Side Hydration:** When the page loads on the client, the `AuthContext` (`src/features/auth/contexts/AuthContext.tsx`) uses the singleton `supabase` client's `getSession()` method. The SSR-aware client securely retrieves the session from the server, hydrating the client-side user state without ever exposing the cookie to JavaScript.
-   **Real-time Updates:** The `AuthContext` also subscribes to `onAuthStateChange` to listen for real-time session updates (e.g., user logs out in another tab).

This architecture ensures a secure, stable, and consistent authentication experience across the entire application. 