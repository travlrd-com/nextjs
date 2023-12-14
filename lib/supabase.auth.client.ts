import { supabaseForClientComponent } from "@/lib/supabase.client";
import * as Supabase from "@supabase/supabase-js";
import { env } from "./env.server";


export async function authenticateUsingGoogle() {
  return await supabaseForClientComponent.auth.signInWithOAuth({
    provider: "google",
    options: {
      // The redirectTo url has to be added to the Supabase settings:
      // https://supabase.com/dashboard/project/_/auth/url-configuration
      redirectTo: `${env.NEXT_PUBLIC_ORIGIN}/api/supabase/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
}


export async function authenticateUsingPassword(credentials: Supabase.SignInWithPasswordCredentials) {
  return await supabaseForClientComponent.auth.signInWithPassword(credentials);
}