import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";
import { env } from "./env.client";


export const supabaseBrowserClient = createBrowserClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);