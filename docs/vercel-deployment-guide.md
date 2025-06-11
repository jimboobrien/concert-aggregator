# Vercel Deployment Guide

## Introduction

This document covers deployment of the Concert Aggregator application to Vercel, with a specific focus on handling timeout issues with the scraping functionality.

## Basic Deployment Steps

1. **Create a Vercel Account**
   - Sign up at [vercel.com](https://vercel.com) if you don't already have an account

2. **Connect to Git Repository**
   - Push your code to GitHub, GitLab, or Bitbucket
   - Connect your Vercel account to your repository

3. **Set Up Environment Variables**
   - Add all variables from your `.env.local` file:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - Any API keys for the scraping service

4. **Deploy**
   - Import your repository in the Vercel dashboard or use the CLI:
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

## Handling 504 Gateway Timeouts

### The Problem

The `/dashboard/import` feature is experiencing 504 Gateway Timeout errors in Vercel. This happens because the scraping operation takes too long (approximately 129 seconds locally) and exceeds Vercel's serverless function execution limits:

- **Hobby plan**: 10 seconds
- **Pro plan**: 60 seconds
- **Enterprise plan**: 900 seconds

Our logs show the import process taking around 129 seconds, which exceeds even the Pro plan limits.

### Solution Options

#### 1. Implement a Job Queue Pattern

Convert the current synchronous process into an asynchronous queue-based system:

```
Client Request → Create Job → Return Job ID → Process Job Asynchronously → Client Polls for Status
```

**Implementation Steps:**

1. Create a `scrape_jobs` table in Supabase:
   ```sql
   CREATE TABLE public.scrape_jobs (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     url TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'pending',
     result_path TEXT,
     error TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     user_id UUID REFERENCES auth.users(id)
   );
   ```

2. Create a job creation endpoint:
   ```typescript
   // app/api/scrape-jobs/route.ts
   export async function POST(request: Request) {
     const { url } = await request.json();
     const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser();
     
     if (!user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     
     const { data, error } = await supabase
       .from('scrape_jobs')
       .insert({ url, user_id: user.id, status: 'pending' })
       .select();
     
     if (error) {
       return NextResponse.json({ error: error.message }, { status: 500 });
     }
     
     // Trigger background processing
     // (We'll handle this in a separate step)
     
     return NextResponse.json({ jobId: data[0].id });
   }
   ```

3. Create a job status endpoint:
   ```typescript
   // app/api/scrape-jobs/[id]/route.ts
   export async function GET(
     request: Request,
     { params }: { params: { id: string } }
   ) {
     const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser();
     
     if (!user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     
     const { data, error } = await supabase
       .from('scrape_jobs')
       .select('*')
       .eq('id', params.id)
       .eq('user_id', user.id)
       .single();
     
     if (error) {
       return NextResponse.json({ error: error.message }, { status: 404 });
     }
     
     return NextResponse.json(data);
   }
   ```

4. Update the UI to use the job queue pattern:
   - Submit the scrape job
   - Show a loading state with the job ID
   - Poll for job status every few seconds
   - Display results when complete

#### 2. Use Vercel Cron Jobs

For scheduled scraping operations, Vercel's Cron Jobs feature can be utilized:

1. Create a `vercel.json` file:
   ```json
   {
     "crons": [
       {
         "path": "/api/scheduled-scrape",
         "schedule": "0 0 * * *"
       }
     ]
   }
   ```

2. Implement the cron endpoint:
   ```typescript
   // app/api/scheduled-scrape/route.ts
   export const dynamic = 'force-dynamic';
   
   export async function GET() {
     // Run your scrape operation
     // No timeouts since this is run on a schedule
     
     return NextResponse.json({ success: true });
   }
   ```

#### 3. Use Vercel Edge Functions

Edge Functions have higher timeout limits than serverless functions:

```typescript
// app/api/edge-scrape/route.ts
export const config = {
  runtime: 'edge'
};

export default async function handler(request) {
  // Your scraping code here
  // Edge functions have longer timeouts
}
```

#### 4. Use External Worker Services

For truly long-running jobs, consider:

- [Upstash QStash](https://upstash.com/docs/qstash/quickstart)
- [Inngest](https://www.inngest.com/)
- [Temporal](https://temporal.io/)
- A dedicated server or VPS for processing

### Recommended Approach

For our specific use case with scraping tasks that take ~129 seconds, we recommend implementing the Job Queue Pattern (Option 1) as it provides:

1. Immediate response to users
2. Background processing of time-intensive tasks
3. Status tracking and error handling
4. Works within Vercel's serverless constraints

## Monitoring and Debugging

- Use Vercel's Function Logs to identify timeouts and errors
- Add detailed logging in your application
- Consider implementing error tracking with services like Sentry

## Future Optimizations

- Implement caching for scraped data
- Add incremental scraping to reduce processing time
- Consider using a dedicated scraping service instead of building your own

## Conclusion

By implementing an asynchronous job queue pattern, we can work within Vercel's execution limits while still providing the scraping functionality our users need. This approach improves reliability and user experience by preventing timeout errors. 