"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";
import { env } from "./env.public";



export function createSupabaseForClientComponent() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
