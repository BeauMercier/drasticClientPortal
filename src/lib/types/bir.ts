// src/lib/types/bir.ts
import type { Database } from '@/lib/database.types'; // Supabase generated types

/* 1. Enums ------------------------------------------------------- */
// Use 'as const' for strict typing and immutability
export const BirStatusArray = ['pending', 'submitted', 'approved'] as const;
// Derive the type from the array values
export type BirStatus = (typeof BirStatusArray)[number];

/* 2. Row Type exactly as stored in Supabase ---------------------- */
export type BirRow =
  Database['public']['Tables']['business_information_requests']['Row'];

/* 3. Insert / Update payloads ------------------------------------ */
export type BirInsert =
  Database['public']['Tables']['business_information_requests']['Insert'];

export type BirUpdate =
  Database['public']['Tables']['business_information_requests']['Update'];

/* 4. Client-side shape (denormalised helper) --------------------- */
export interface Bir extends BirRow {
  /* Add anything you plan to JOIN in – e.g. project title */
  project_title?: string;
}

/* 5. Utility guards ---------------------------------------------- */
// Update guard to work with 'as const' array (no cast needed)
export const isBirStatus = (val: unknown): val is BirStatus =>
  typeof val === 'string' && (BirStatusArray as readonly string[]).includes(val);

// NEW: Enum for BIR file types (moved from API route)
export enum BirFileType {
  Logo = 'logo',
  StyleGuide = 'style_guide',
  Photo = 'photo',
  Certificate = 'certificate',
  Misc = 'misc',
}

// Placeholder type for BirFileRow until types are regenerated and verified
// TODO: Remove once Database['public']['Tables']['bir_file']['Row'] is confirmed working
export type BirFileRowPlaceholder = {
  id: string;
  bir_id: string;
  file_type: string; // Use BirFileType enum ideally
  original_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
};

// Type combining BirFileRow with a potential signed URL
export type SignedBirFilePlaceholder = BirFileRowPlaceholder & { publicUrl?: string }; 