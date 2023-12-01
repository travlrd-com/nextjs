#!/bin/bash

# Load environment variables
set -o allexport
source .env.local
set +o allexport

# Check arguments
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 [source_project] [target_project]"
  exit 1
fi

SOURCE_PROJECT=$1
TARGET_PROJECT=$2

# Check if source and target projects are valid
if [ "$SOURCE_PROJECT" != "staging" ] && [ "$SOURCE_PROJECT" != "production" ]; then
  echo "Invalid source project: $SOURCE_PROJECT"
  exit 1
fi

if [ "$TARGET_PROJECT" != "staging" ] && [ "$TARGET_PROJECT" != "production" ]; then
  echo "Invalid target project: $TARGET_PROJECT"
  exit 1
fi

# Set project IDs and passwords based on arguments
if [ "$SOURCE_PROJECT" == "staging" ]; then
  SOURCE_PROJECT_ID=$SUPABASE_STAGING_PROJECT_ID
  SOURCE_DB_PASSWORD=$SUPABASE_STAGING_DB_PASSWORD
else
  SOURCE_PROJECT_ID=$SUPABASE_PRODUCTION_PROJECT_ID
  SOURCE_DB_PASSWORD=$SUPABASE_PRODUCTION_DB_PASSWORD
fi

if [ "$TARGET_PROJECT" == "staging" ]; then
  TARGET_PROJECT_ID=$SUPABASE_STAGING_PROJECT_ID
  TARGET_DB_PASSWORD=$SUPABASE_STAGING_DB_PASSWORD
else
  TARGET_PROJECT_ID=$SUPABASE_PRODUCTION_PROJECT_ID
  TARGET_DB_PASSWORD=$SUPABASE_PRODUCTION_DB_PASSWORD
fi

# Commands to generate migration files from the specified source project
npx supabase link --project-ref $SOURCE_PROJECT_ID --password $SOURCE_DB_PASSWORD
npx supabase db pull
echo "Migrations generated successfully from project $SOURCE_PROJECT_ID!"

# Commands to apply migration files to the specified target project
npx supabase link --project-ref $TARGET_PROJECT_ID --password $TARGET_DB_PASSWORD
npx supabase db push
echo "Migrations applied successfully to project $TARGET_PROJECT_ID!"

# Commands to generate TypeScript definitions from the target project
npx npx supabase gen types typescript --project-id $TARGET_PROJECT_ID --schema public >lib/database.types.ts
echo "TypeScript definitions generated successfully from project $TARGET_PROJECT_ID!"

echo "Synchronization completed."
