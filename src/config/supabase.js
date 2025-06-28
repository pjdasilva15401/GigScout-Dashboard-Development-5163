import { createClient } from '@supabase/supabase-js'

// These would be your actual Supabase project credentials
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For now, we'll use mock data until you set up your Supabase project
export const isSupabaseConfigured = false