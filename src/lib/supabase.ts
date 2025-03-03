import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with enhanced configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'st-josef-auth'
  },
  global: {
    headers: {
      // 'Content-Type': 'application/json'
     }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    timeout: 20000
  }
});

// Check connection status
export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('settings').select('id').limit(1).single();
    return !error;
  } catch {
    return false;
  }
};

// Enhanced retry helper with exponential backoff and jitter
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Check connection before attempting operation
      const isConnected = await checkConnection();
      if (!isConnected) {
        throw new Error('Unable to connect to Supabase. Please check your internet connection.');
      }

      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's an auth error or validation error
      if (error?.status === 401 || error?.status === 422) {
        throw error;
      }

      // Only retry on network errors, connection errors, or 5xx errors
      const isRetryable =
        error?.message?.includes('fetch') ||
        error?.message?.includes('connect') ||
        (error?.status && error?.status >= 500);

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 200;
      const delay = baseDelay * Math.pow(2, attempt) + jitter;
      await new Promise(resolve => setTimeout(resolve, delay));

      console.log(`Retrying operation (attempt ${attempt + 1} of ${maxRetries})...`);
    }
  }

  throw lastError;
}

// Helper to format error messages
export function formatError(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error_description) return error.error_description;
  return 'An unexpected error occurred. Please try again later.';
}