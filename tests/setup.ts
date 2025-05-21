// This file is intentionally left blank for now.
// It can be used for global test setup, like importing jest-dom matchers.
import '@testing-library/jest-dom';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local or .env at the project root
// Vitest runs from the project root, so path.resolve should work as expected.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false }); // override:false ensures .env.local takes precedence

console.log('Test setup: Attempted to load .env files.');
console.log('Test setup: NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Loaded' : 'NOT LOADED');
console.log('Test setup: NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'NOT LOADED'); 