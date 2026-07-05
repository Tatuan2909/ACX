import { createClient } from "@supabase/supabase-js";

// These come from your Supabase project → Settings → API.
// They're read from the .env file (see .env.example) — never hardcode
// real keys directly in this file if this repo is ever made public.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[ACX] Missing Supabase env vars. Copy .env.example to .env and fill in " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project settings."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
