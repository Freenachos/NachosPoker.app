import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Articles API placeholder
export const articlesApi = {
  getAll: async () => {
    // TODO: Implement with your Supabase table
    return { data: [], error: null };
  },
  getById: async (id) => {
    return { data: null, error: null };
  },
  create: async (article) => {
    return { data: null, error: null };
  },
  update: async (id, article) => {
    return { data: null, error: null };
  },
  delete: async (id) => {
    return { data: null, error: null };
  },
};

// Auth API placeholder
export const authApi = {
  signIn: async (email, password) => {
    return { data: null, error: null };
  },
  signOut: async () => {
    return { error: null };
  },
  getUser: async () => {
    return { data: null, error: null };
  },
};
