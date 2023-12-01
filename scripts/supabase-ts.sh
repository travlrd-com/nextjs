#!/bin/bash

# Load environment variables
set -o allexport
source .env.local
set +o allexport

# Commands to generate TypeScript definitions from the target project
npx npx supabase gen types typescript --project-id $NEXT_PUBLIC_SUPABASE_PROJECT_ID --schema public >lib/database.types.ts
echo "TypeScript definitions generated successfully from project $NEXT_PUBLIC_SUPABASE_PROJECT_ID!"
