npx supabase link --project-ref STAGING_PROJECT_ID --password ************
npx supabase db pull
npx supabase link --project-ref PRODUCTION_PROJECT_ID --password ************
npx supabase db push
pnpm run supabase:gen-types