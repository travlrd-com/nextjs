import { z } from "zod";

// NOTE - On the client Next.js bakes into the code the env variables starting with NEXT_
// by replacing the `process.env.NEXT_PUBLIC_ENV_VARIABLE` name in the code with the actual value

export const feature = {
  // NEXT_PUBLIC_FEATURE_FLAG_SOMETHING: z.enum(['', 'on']).optional().parse(process.env.NEXT_PUBLIC_FEATURE_FLAG_SOMETHING),
  // NEXT_PUBLIC_FEATURE_FLAG_SOMETHING_ELSE: z.enum(['', 'on']).optional().parse(process.env.NEXT_PUBLIC_FEATURE_FLAG_SOMETHING_ELSE),


};
