# Authentication Utilities

This document provides an overview of the authentication utilities available in the application. These utilities are designed to simplify common authentication-related tasks and provide a consistent way to handle authentication across the application.

## Server Actions vs. Utility Functions

The application uses two main approaches for authentication:

1. **Server Actions** (`src/actions/auth.ts`): These are the primary functions for handling authentication operations like login, signup, password reset, etc. They are designed to be used in forms and handle redirects.

2. **Utility Functions** (`src/utils/auth-utils.ts`): These are helper functions that build on the server actions but provide more specific functionality for common auth-related tasks. They are designed to be used in server components and other server-side code.

## Available Utility Functions

### User Management

- `getUser()`: Gets the current authenticated user
- `getSession()`: Gets the current session
- `isAuthenticated()`: Checks if the user is authenticated
- `requireAuthentication(redirectTo?)`: Requires authentication, redirects to login if not authenticated
- `getUserProfile(userId?)`: Gets the user's profile data
- `isEmailVerified()`: Checks if the user's email is verified
- `getUserMetadata()`: Gets user metadata

### Role Management

- `checkRole(requiredRole, redirectTo?)`: Checks if the current user has a specific role
- `requireAdmin(redirectTo?)`: Requires admin role, redirects if not admin

### Resource Ownership

- `isResourceOwner(table, resourceId, userIdField?)`: Checks if the current user owns a resource
- `requireResourceOwnership(table, resourceId, userIdField?, redirectTo?)`: Requires ownership of a resource, redirects if not owner

## Usage Examples

### Protecting a Page with Authentication

```typescript
// In a server component
import { requireAuthentication } from '@/utils/auth-utils';

export default async function ProtectedPage() {
  // This will redirect to login if not authenticated
  const user = await requireAuthentication();
  
  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      {/* Rest of the page */}
    </div>
  );
}
```

### Checking Admin Status

```typescript
// In a server component
import { requireAdmin } from '@/utils/auth-utils';

export default async function AdminPage() {
  // This will redirect to home if not an admin
  await requireAdmin('/');
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Admin content */}
    </div>
  );
}
```

### Checking Resource Ownership

```typescript
// In a server component
import { requireResourceOwnership } from '@/utils/auth-utils';

export default async function EditResourcePage({ params }) {
  const { id } = params;
  
  // This will redirect to home if not the owner
  await requireResourceOwnership('resources', id, 'user_id', '/');
  
  return (
    <div>
      <h1>Edit Resource</h1>
      {/* Edit form */}
    </div>
  );
}
```

## Best Practices

1. **Use Server Components**: These utilities are designed to be used in server components. They won't work in client components.

2. **Error Handling**: All utilities include error handling, but you should still handle errors in your components.

3. **Redirects**: Many utilities include redirect functionality. Make sure you understand where users will be redirected to.

4. **Performance**: These utilities are designed to be efficient, but be mindful of making multiple calls in a single request.

5. **Security**: Always validate user input and permissions on the server side, even if you're also doing it on the client side. 