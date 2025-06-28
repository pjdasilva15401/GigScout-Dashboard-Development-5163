import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fhpntyexyaomfyqflpdr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocG50eWV4eWFvbWZ5cWZscGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNzU3NTgsImV4cCI6MjA2NjY1MTc1OH0.qdNhZHam9ijSM5esGRI355U_AL04ruDpmiPAb8L8A9M'

if(SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables')
}

export default createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})