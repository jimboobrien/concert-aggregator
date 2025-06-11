# TypeScript Issues with Next.js 15

## Overview

Next.js 15 introduced a change in how route parameters are handled, particularly in dynamic routes and API routes. Parameters (`params`) in page components and route handlers are now expected to be awaitable Promises rather than direct objects, which can cause TypeScript errors during build.

## Symptoms

When running `npm run build`, you might encounter TypeScript errors like:

```
Type error: Type '{ params: { id: string; }; }' does not satisfy the constraint 'PageProps'.
Types of property 'params' are incompatible.
Type '{ id: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]
```

or 

```
Type error: Route "src/app/api/artists/[id]/follow/route.ts" has an invalid "POST" export:
Type "{ params: { id: string; }; }" is not a valid type for the function's second argument.
```

## Solutions

### 1. For Page Components (Recommended)

Page components should be updated to handle async parameters:

```tsx
// Before (Next.js 14)
export default function MyPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  return <div>ID: {params.id}</div>
}

// After (Next.js 15)
export default async function MyPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params;
  return <div>ID: {resolvedParams.id}</div>
}
```

### 2. For API Route Handlers

The route handler function signature should be:

```tsx
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Use params.id
}
```

### 3. Temporary Workaround

If you need to ship a build quickly, you can temporarily ignore TypeScript errors by adding this to your `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    // Temporary workaround for build errors
    // Only use during development or if the errors can't be fixed immediately
    ignoreBuildErrors: true,
  },
};
```

**Note:** This is not recommended for production as it bypasses TypeScript's type checking, potentially hiding real issues.

## References

- [Next.js 15 Build Fails: 'params' type mismatch (Promise) on dynamic routes](https://github.com/vercel/next.js/issues/77609)
- [Params/Search params resolved as promise in Next.js 15](https://medium.com/@ayonaalex2/params-search-params-resolved-as-promise-in-next-js-15-444317307481)
- [Next.js Documentation: Dynamic Route Segments](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) 