# Supabase Integration

This directory contains all Supabase-related code and configuration for the Concerts application.

## Directory Structure

- **migrations/**: SQL migration files for database schema and functions
  - Contains all table definitions, functions, and database structure
  - Named with timestamps for versioning

- **functions/**: Supabase Edge Functions
  - **_shared/**: Common utilities shared between functions
  - **artist-recommendations/**: Function for generating artist recommendations
  - **send-email-with-sendgrid/**: Function for sending emails via SendGrid

- **Utility files**:
  - **admin.ts**: Admin-level utility functions
  - **admin-client.ts**: Admin client creation for server-side operations
  - **client.ts**: Browser client creation for client-side operations
  - **server.ts**: Server client creation for server-side operations
  - **middleware.ts**: Authentication middleware
  - **env-helper.ts**: Environment variable helpers
  - **check-env-vars.ts**: Environment variable validation

## Usage

These utilities provide a consistent way to interact with Supabase throughout the application.

For server components:
```typescript
import { createClient } from '@/utils/supabase/server';

// In an async function
const supabase = await createClient();
```

For client components:
```typescript
import { createClient } from '@/utils/supabase/client';

// Direct use (no await needed)
const supabase = createClient();
```

For admin operations (server-side only):
```typescript
import { createAdminClient } from '@/utils/supabase/admin-client';

// In a server action or API route
const supabase = createAdminClient();
``` 