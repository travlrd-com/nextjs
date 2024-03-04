// NOTE - This file is not client-side, but public. The code importing it should be usable both from the server and the client. --- viktor.tar, 2024-03-04
// "use client"
import { z } from "zod";

// NOTE - On the client Next.js bakes into the code the env variables starting with NEXT_
// by replacing the `process.env.NEXT_PUBLIC_ENV_VARIABLE` name in the code with the actual value

export const env = {
  NEXT_PUBLIC_ORIGIN: z.string().min(1).parse(process.env.NEXT_PUBLIC_ORIGIN),

  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1).parse(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).parse(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),

  // NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().min(1).parse(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
};
