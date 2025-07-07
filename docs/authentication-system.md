# Authentication System Documentation

This document provides a comprehensive overview of the authentication system implemented in the Concerts application. The system is built on Supabase Auth and uses Next.js Server Actions for secure authentication flows.

## Architecture Overview

The authentication system follows a server-centric approach using Next.js Server Actions for all authentication operations. This architecture provides several benefits:

1. **Secure Cookie Handling**: Server Actions properly handle cookies within the Next.js App Router framework
2. **Centralized Authentication Logic**: All auth logic is centralized in dedicated files
3. **Type Safety**: TypeScript ensures type safety throughout the authentication flow
4. **Proper Error Handling**: Consistent error handling across all authentication operations

### Key Components

- **Server Actions** (`src/actions/auth.ts`): Core authentication operations (login, signup, etc.)
- **Utility Functions** (`src/utils/auth-utils.ts`): Helper functions for common auth-related tasks
- **Middleware** (`middleware.ts`): Route protection and session management
- **Admin Guards** (`src/components/AdminGuard.tsx`): Component for protecting admin-only routes

## Authentication Flow

### User Registration and Login

1. User submits registration form
2. Server action validates the input and creates the user in Supabase
3. User receives confirmation email
4. User confirms email and is redirected to login
5. User submits login form
6. Server action authenticates the user and sets session cookies
7. User is redirected to the intended destination

### Password Reset Flow

1. User requests password reset
2. Server action sends password reset email
3. User clicks link in email and is redirected to update password page
4. User submits new password
5. Server action updates the password and signs the user out
6. User is redirected to login with success message

### Session Management

1. Middleware checks for valid session on protected routes
2. If session is invalid or expired, user is redirected to login
3. Session is refreshed automatically when needed
4. Logout action clears the session and redirects to login

## Server Actions

The following server actions are available in `src/actions/auth.ts`:

### User Authentication

```typescript
// Login with email and password
export async function login(formData: FormData)

// Register a new user
export async function signup(formData: FormData)

// Request password reset email
export async function requestPasswordReset(formData: FormData)

// Update password after reset
export async function updatePassword(formData: FormData)

// Log out the current user
export async function logout(formData?: FormData)

// API-compatible logout function
export async function logoutApi(request: Request)
```

### User Profile Management

```typescript
// Update user profile information
export async function updateProfile(formData: FormData)
```

### Role Management

```typescript
// Check if the current user has admin role
export async function isAdmin(): Promise<boolean>

// Check if the current user has a specific role
export async function hasRole(role: string): Promise<boolean>

// Assign a role to a user (admin only)
export async function assignRole(userId: string, role: string): Promise<boolean>
```

### Helper Functions

```typescript
// Get the current authenticated user
export async function getCurrentUser()

// Require authentication, redirect if not authenticated
export async function requireAuth(redirectTo?: string)
```

## Utility Functions

The following utility functions are available in `src/utils/auth-utils.ts`:

### User Management

```typescript
// Get the current authenticated user
export async function getUser(): Promise<User | null>

// Get the current session
export async function getSession()

// Check if the user is authenticated
export async function isAuthenticated(): Promise<boolean>

// Require authentication, redirect if not authenticated
export async function requireAuthentication(redirectTo?: string)

// Get the user's profile data
export async function getUserProfile(userId?: string)

// Check if the user's email is verified
export async function isEmailVerified(): Promise<boolean>

// Get user metadata
export async function getUserMetadata()
```

### Role Management

```typescript
// Check if the current user has a specific role
export async function checkRole(requiredRole: string, redirectTo?: string): Promise<boolean>

// Require admin role, redirect if not admin
export async function requireAdmin(redirectTo: string = '/')
```

### Resource Ownership

```typescript
// Check if the current user owns a resource
export async function isResourceOwner(
  table: string,
  resourceId: string,
  userIdField: string = 'user_id'
): Promise<boolean>

// Require ownership of a resource, redirect if not owner
export async function requireResourceOwnership(
  table: string,
  resourceId: string,
  userIdField: string = 'user_id',
  redirectTo: string = '/'
): Promise<boolean>
```

## Usage Examples

### Login Form

```tsx
// app/login/page.tsx
import { login } from '@/actions/auth';

export default function LoginPage() {
  return (
    <form action={login}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <button type="submit">Log In</button>
    </form>
  );
}
```

### Protected Page (Server Component)

```tsx
// app/protected/page.tsx
import { requireAuthentication } from '@/utils/auth-utils';

export default async function ProtectedPage() {
  const user = await requireAuthentication();
  
  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      {/* Protected content */}
    </div>
  );
}
```

### Admin-Only Page (Server Component)

```tsx
// app/admin/page.tsx
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

### Logout Button

```tsx
// components/LogoutButton.tsx
'use client';

import { logout } from '@/actions/auth';

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit">Log Out</button>
    </form>
  );
}
```

### Profile Update Form

```tsx
// app/profile/page.tsx
import { updateProfile } from '@/actions/auth';
import { getUserProfile } from '@/utils/auth-utils';

export default async function ProfilePage() {
  const profile = await getUserProfile();
  
  return (
    <form action={updateProfile}>
      <input type="text" name="fullName" defaultValue={profile?.full_name || ''} />
      <input type="text" name="username" defaultValue={profile?.username || ''} />
      <button type="submit">Update Profile</button>
    </form>
  );
}
```

## Best Practices

1. **Always Use Server Actions for Auth Operations**: Never handle authentication directly in components.

2. **Validate All Inputs**: Always validate user inputs on the server side, even if you're also doing it on the client side.

3. **Handle Errors Gracefully**: Provide user-friendly error messages and log detailed errors for debugging.

4. **Use Redirects Carefully**: Make sure redirects take users to appropriate pages after authentication operations.

5. **Check Authentication Status**: Always check authentication status before displaying protected content.

6. **Use Type Safety**: Leverage TypeScript to ensure type safety throughout the authentication flow.

7. **Follow Security Best Practices**:
   - Use HTTPS for all requests
   - Implement proper CSRF protection
   - Set appropriate cookie security options
   - Validate all user inputs
   - Use proper password hashing (handled by Supabase)
   - Implement rate limiting for login attempts

## Troubleshooting

### Common Issues

1. **Session Not Persisting**: Make sure cookies are being set correctly and the middleware is configured properly.

2. **Redirect Loops**: Check that your middleware and authentication checks aren't creating redirect loops.

3. **CSRF Errors**: Ensure forms are using the proper CSRF protection mechanisms.

4. **Cookie Issues**: Check that cookies are being set with the correct domain, path, and security options.

### Debugging Tips

1. Check the browser console for any errors related to authentication.

2. Use the Network tab in browser dev tools to inspect authentication requests and responses.

3. Check server logs for detailed error messages.

4. Verify that environment variables are set correctly.

## Security Considerations

1. **Password Security**: Passwords are securely hashed by Supabase using industry-standard algorithms.

2. **Session Management**: Sessions are managed securely using JWT tokens stored in HTTP-only cookies.

3. **CSRF Protection**: Next.js provides built-in CSRF protection for forms.

4. **Rate Limiting**: Implement rate limiting for login attempts to prevent brute force attacks.

5. **Input Validation**: All user inputs are validated on the server side to prevent injection attacks.

## Future Enhancements

1. **Multi-factor Authentication**: Add support for multi-factor authentication.

2. **Social Logins**: Implement social login providers (Google, GitHub, etc.).

3. **Role-Based Access Control**: Enhance the role system with more granular permissions.

4. **Audit Logging**: Add comprehensive audit logging for authentication events.

5. **Session Management UI**: Add a UI for users to manage their active sessions. 