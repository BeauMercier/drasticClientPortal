'use client';

import { useEffect } from 'react';
import supabase from '@/lib/api/client'; // Adjusted import path
import { useSWRConfig } from 'swr';

/**
 * Subscribes to Supabase realtime updates for a specific project table and triggers SWR mutation.
 *
 * @param projectId The ID of the project to listen for updates on.
 * @param projectType The type of the project (e.g., 'web_design', 'logo_design'), used to construct the SWR key.
 * @param tableName The actual Supabase table name to listen to (e.g., 'web_design_projects').
 */
export function useProjectRealtime(
  projectId?: string,
  projectType?: string,
  tableName?: string,
) {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!projectId || !tableName || !projectType) {
      return;
    }

    const channel = supabase
      .channel(`project-updates-${tableName}-${projectId}`) // Unique channel name
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes: insert, update, delete
          schema: 'public',
          table: tableName,
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          console.log(`Realtime event on ${tableName} for ${projectId}:`, payload);
          // Mutate the SWR key used by useProject
          mutate(`/api/projects/${projectType}/${projectId}`);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${tableName} updates for project ${projectId}`);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Supabase channel error for ${tableName} project ${projectId}:`, err || status);
        }
      });

    return () => {
      console.log(`Unsubscribing from ${tableName} updates for project ${projectId}`);
      supabase.removeChannel(channel);
    };
  }, [projectId, tableName, projectType, mutate]);
} 