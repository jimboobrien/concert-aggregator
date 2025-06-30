# Deployment Scripts

This directory contains scripts to help with deploying and managing the application.

## Deploying Migrations to Supabase

The `deploy-migrations.mjs` script helps you deploy database migrations to your remote Supabase instance.

### Prerequisites

1. Install the Supabase CLI if you haven't already:
   ```
   npm install -g supabase
   ```

2. Get your Supabase access token from https://app.supabase.com/account/tokens

3. Get your Supabase project reference from the project settings page

### Usage

Run the script:

```bash
node scripts/deploy-migrations.mjs
```

Or directly:

```bash
./scripts/deploy-migrations.mjs
```

The script will:

1. List all migration files that will be applied
2. Ask for your Supabase project reference
3. Ask for your Supabase access token (if not set as an environment variable)
4. Confirm before applying the migrations
5. Apply the migrations to your remote Supabase instance

### Environment Variables

You can set the following environment variables to avoid being prompted:

- `SUPABASE_ACCESS_TOKEN`: Your Supabase access token

Example:

```bash
export SUPABASE_ACCESS_TOKEN=your_token_here
./scripts/deploy-migrations.mjs
```

## Troubleshooting

If you encounter any issues:

1. Make sure your Supabase CLI is up to date
2. Check that your access token is valid
3. Verify that your project reference is correct
4. Look for any error messages in the output

For more detailed information about Supabase migrations, see the [Supabase CLI documentation](https://supabase.com/docs/reference/cli/usage#supabase-db-push). 