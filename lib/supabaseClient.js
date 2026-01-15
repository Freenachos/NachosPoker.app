import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// ARTICLES API
// ============================================

export const articlesApi = {
  // Fetch all published articles (public)
  async getPublished() {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Fetch ALL articles including drafts (authenticated only)
  async getAll() {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Fetch single article by slug
  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new article
  async create(article) {
    const { data, error } = await supabase
      .from('articles')
      .insert([{
        title: article.title,
        slug: article.slug,
        category: article.category,
        excerpt: article.excerpt,
        read_time: article.readTime,
        thumbnail: article.thumbnail,
        thumbnail_url: article.thumbnailUrl || null,
        blocks: article.blocks,
        published: article.published || false
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update existing article
  async update(id, article) {
    const { data, error } = await supabase
      .from('articles')
      .update({
        title: article.title,
        slug: article.slug,
        category: article.category,
        excerpt: article.excerpt,
        read_time: article.readTime,
        thumbnail: article.thumbnail,
        thumbnail_url: article.thumbnailUrl || null,
        blocks: article.blocks,
        published: article.published,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete article
  async delete(id) {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// ============================================
// AUTH API
// ============================================

export const authApi = {
  // Sign in with email/password
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Listen for auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};
