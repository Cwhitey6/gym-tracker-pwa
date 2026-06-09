/**
 * supabase.js
 * 
 * Creates and exports the Supabase client that the rest of the app uses
 * to talk to the database. The single place that knows where the database 
 * lives and how to authenticate with it.
 * 
 * The anon key is safe to expose in frontend code as long as Row Level
 * Security (RLS) is enabled on all tables in Supabase, which it is.
 * RLS makes sure users can only ever access their own data even if
 * someone got hold of this key.
 */

import { createClient } from '@supabase/supabase-js'

// Supabase project URL and anon public key
// Specific to the gym-tracker project on supabase.com
const supabaseUrl = 'https://swilxyaxopwacbipzpxk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3aWx4eWF4b3B3YWNiaXB6cHhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODQ0OTQsImV4cCI6MjA5NjQ2MDQ5NH0.sGMkU3FjKQYqAsOoZmWeSqCd1FN3t2s0CHqZLcK502s'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // keep the session alive between app opens
    persistSession:     true,
    // automatically refresh the auth token before it expires
    autoRefreshToken:   true,
    // OAuth redirects aren't used so this can stay off
    detectSessionInUrl: false,
    // store the session in localStorage so it survives app restarts
    storage:            window.localStorage,
  }
})