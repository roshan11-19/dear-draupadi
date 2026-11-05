import { createClient } from '@supabase/supabase-js';

// Credentials matching your Supabase project
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hzspfkhtamzjtezxutfx.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6c3Bma2h0YW16anRlenh1dGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNTk3NjAsImV4cCI6MjEwMzYzNTc2MH0.pqUnZVLjSGalXRQRviCous8CufuRref0rx4zXr1AVZc';
export const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Public Supabase Client (RLS Protected)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Client for administrative operations (falls back to safe public client if service key not provided in server env)
export const supabaseAdmin = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : supabase;

