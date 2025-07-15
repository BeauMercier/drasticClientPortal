/**
 * This is the main entry point for the API library.
 * It provides a structured way to access different parts of the API.
 */

import * as clientApi from './client-api';
import * as storageApi from './storage';
import { supabase, createClient } from './client';

export const api = {
  client: clientApi,
  storage: storageApi,
};

export { supabase, createClient };

export * from '../types/api'; 