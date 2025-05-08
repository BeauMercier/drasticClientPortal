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

// Type for BIR files, assuming types are regenerated
export type BirFileRow = Database['public']['Tables']['bir_file']['Row'];

/* 3. Insert / Update payloads ------------------------------------ */
export type BirInsert =
  Database['public']['Tables']['business_information_requests']['Insert'];

export type BirUpdate =
  Database['public']['Tables']['business_information_requests']['Update'];

// Insert/Update types for bir_file if needed (usually Row type is sufficient for reads)
export type BirFileInsert = Database['public']['Tables']['bir_file']['Insert'];
export type BirFileUpdate = Database['public']['Tables']['bir_file']['Update'];

/* 4. Client-side shape (denormalised helper) --------------------- */
export interface Bir extends BirRow {
  /* Add anything you plan to JOIN in – e.g. project title */
  project_title?: string;
}

/* 5. Utility guards ---------------------------------------------- */
// Update guard to work with 'as const' array (no cast needed)
export const isBirStatus = (val: unknown): val is BirStatus =>
  typeof val === 'string' && (BirStatusArray as readonly string[]).includes(val);

// Enum for BIR file types
export enum BirFileType {
  Logo = 'logo',
  StyleGuide = 'style_guide',
  Photo = 'photo',
  Certificate = 'certificate',
  Misc = 'misc',
}

// Type combining BirFileRow with a potential signed URL
export type SignedBirFile = BirFileRow & { publicUrl?: string }; 