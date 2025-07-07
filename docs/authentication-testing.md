# Authentication System Testing Plan

This document outlines the test plan for the authentication system in the Concerts application. It covers all authentication flows, including login, signup, password reset, admin role checks, profile updates, and artist/venue following.

## Test Environment Setup

### Prerequisites

- Supabase project with auth enabled
- Test user accounts:
  - Regular user: `test@example.com` / `Test1234!`
  - Admin user: `admin@example.com` / `Admin1234!`
- Test data:
  - Artists: At least 3 test artists in the database
  - Venues: At least 3 test venues in the database

### Environment Variables

Ensure the following environment variables are set:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Test Cases

### 1. Login/Signup Flow

#### 1.1 User Registration

| Test ID | Description | Steps | Expected Result | Status |
|---------|-------------|-------|----------------|--------|
| REG-01 | Register with valid credentials | 1. Navigate to `/login`<br>2. Click "Sign up" link<br>3. Enter valid email and password<br>4. Submit form | User receives confirmation email | ✅ |
| REG-02 | Register with invalid email | 1. Navigate to `/login`<br>2. Click "Sign up" link<br>3. Enter invalid email and valid password<br>4. Submit form | Form shows validation error for email | ✅ |
| REG-03 | Register with weak password | 1. Navigate to `/login`<br>2. Click "Sign up" link<br>3. Enter valid email and weak password<br>4. Submit form | Form shows validation error for password | ✅ |
| REG-04 | Register with existing email | 1. Navigate to `/login`<br>2. Click "Sign up" link<br>3. Enter existing email and valid password<br>4. Submit form | Error message about existing account | ✅ |
| REG-05 | Email confirmation | 1. Register with valid credentials<br>2. Open confirmation email<br>3. Click confirmation link | User is redirected to login page with success message | ✅ |

#### 1.2 User Login

| Test ID | Description | Steps | Expected Result | Status |
|---------|-------------|-------|----------------|--------|
| LOG-01 | Login with valid credentials | 1. Navigate to `/login`<br>2. Enter valid email and password<br>3. Submit form | User is logged in and redirected to account page | ✅ |
| LOG-02 | Login with invalid email | 1. Navigate to `/login`<br>2. Enter invalid email<br>3. Submit form | Form shows validation error for email | ✅ |
| LOG-03 | Login with incorrect password | 1. Navigate to `/login`<br>2. Enter valid email and incorrect password<br>3. Submit form | Error message about invalid credentials | ✅ |
| LOG-04 | Login with non-existent account | 1. Navigate to `/login`<br>2. Enter non-existent email and password<br>3. Submit form | Error message about invalid credentials | ✅ |
| LOG-05 | Login with redirect parameter | 1. Navigate to `/login?redirectTo=/profile`<br>2. Enter valid credentials<br>3. Submit form | User is redirected to profile page after login | ✅ |

#### 1.3 Logout

| Test ID | Description | Steps | Expected Result | Status |
|---------|-------------|-------|----------------|--------|
| LOUT-01 | Logout from account page | 1. Login with valid credentials<br>2. Navigate to account page<br>3. Click logout button | User is logged out and redirected to login page | ✅ |
| LOUT-02 | Logout from navbar | 1. Login with valid credentials<br>2. Click logout in navbar | User is logged out and redirected to login page | ✅ |
| LOUT-03 | Session expiration | 1. Login with valid credentials<br>2. Wait for session to expire<br>3. Try to access protected page | User is redirected to login page | ✅ |

### 2. Password Reset Flow

| Test ID | Description | Steps | Expected Result | Status |
|---------|-------------|-------|----------------|--------|
| PWR-01 | Request password reset with valid email | 1. Navigate to `/forgot-password`<br>2. Enter valid email<br>3. Submit form | Success message shown | ✅ |
| PWR-02 | Request password reset with invalid email | 1. Navigate to `/forgot-password`<br>2. Enter invalid email<br>3. Submit form | Validation error shown | ✅ |
| PWR-03 | Request password reset with non-existent email | 1. Navigate to `/forgot-password`<br>2. Enter non-existent email<br>3. Submit form | Same success message shown (security) | ✅ |
| PWR-04 | Reset password with valid link | 1. Request password reset<br>2. Open reset email<br>3. Click reset link<br>4. Enter new password<br>5. Submit form | Password updated, redirected to login | ✅ |
| PWR-05 | Reset password with weak password | 1. Follow reset link<br>2. Enter weak password<br>3. Submit form | Validation error shown | ✅ |
| PWR-06 | Reset password with expired link | 1. Follow expired reset link<br>2. Enter new password<br>3. Submit form | Error message about expired link | ✅ |

### 3. Admin Role Checks

| Test ID | Description | Steps | Expected Result | Status |
|---------|-------------|-------|----------------|--------|
| ADM-01 | Access admin page as admin | 1. Login as admin user<br>2. Navigate to `/admin` | Admin dashboard displayed | ✅ |
| ADM-02 | Access admin page as regular user | 1. Login as regular user<br>2. Try to navigate to `/admin` | Redirected to home page | ✅ |
| ADM-03 | Access admin API as admin | 1. Login as admin user<br>2. Make API request to admin endpoint | Request succeeds | ✅ |
| ADM-04 | Access admin API as regular user | 1. Login as regular user<br>2. Make API request to admin endpoint | Request fails with 403 error | ✅ |
| ADM-05 | Assign role as admin | 1. Login as admin user<br>2. Navigate to user management<br>3. Assign role to user | Role assigned successfully | ✅ |
| ADM-06 | Assign role as regular user | 1. Login as regular user<br>2. Try to assign role via API | Request fails with 403 error | ✅ |

### 4. Profile Updates

| Test ID | Description | Steps | Expected Result | Status |
|---------|-------------|-------|----------------|--------|
| PRO-01 | Update profile with valid data | 1. Login as regular user<br>2. Navigate to profile page<br>3. Update profile with valid data<br>4. Submit form | Profile updated successfully | ✅ |
| PRO-02 | Update profile with invalid username | 1. Login as regular user<br>2. Navigate to profile page<br>3. Update username with invalid format<br>4. Submit form | Validation error shown | ✅ |
| PRO-03 | Update profile with taken username | 1. Login as regular user<br>2. Navigate to profile page<br>3. Update username to one that's already taken<br>4. Submit form | Error message about taken username | ✅ |
| PRO-04 | Update profile with invalid avatar URL | 1. Login as regular user<br>2. Navigate to profile page<br>3. Update avatar URL with invalid format<br>4. Submit form | Validation error shown | ✅ |
| PRO-05 | View profile as unauthenticated user | 1. Logout if logged in<br>2. Try to navigate to profile page | Redirected to login page | ✅ |

### 5. Artist/Venue Following

#### 5.1 Artist Following

| Test ID | Description | Steps | Expected Result | Status |
|---------|-------------|-------|----------------|--------|
| ART-01 | Follow artist as authenticated user | 1. Login as regular user<br>2. Navigate to artist page<br>3. Click follow button | Artist followed successfully | ✅ |
| ART-02 | Unfollow artist | 1. Login as regular user<br>2. Navigate to followed artist page<br>3. Click unfollow button | Artist unfollowed successfully | ✅ |
| ART-03 | Follow artist as unauthenticated user | 1. Logout if logged in<br>2. Navigate to artist page<br>3. Click follow button | Redirected to login page | ✅ |
| ART-04 | View followed artists | 1. Login as regular user<br>2. Follow several artists<br>3. Navigate to profile page | Followed artists displayed correctly | ✅ |
| ART-05 | Follow non-existent artist | 1. Login as regular user<br>2. Try to follow artist with invalid ID via API | Error response returned | ✅ |

#### 5.2 Venue Following

| Test ID | Description | Steps | Expected Result | Status |
|---------|-------------|-------|----------------|--------|
| VEN-01 | Follow venue as authenticated user | 1. Login as regular user<br>2. Navigate to venue page<br>3. Click follow button | Venue followed successfully | ✅ |
| VEN-02 | Unfollow venue | 1. Login as regular user<br>2. Navigate to followed venue page<br>3. Click unfollow button | Venue unfollowed successfully | ✅ |
| VEN-03 | Follow venue as unauthenticated user | 1. Logout if logged in<br>2. Navigate to venue page<br>3. Click follow button | Redirected to login page | ✅ |
| VEN-04 | View followed venues | 1. Login as regular user<br>2. Follow several venues<br>3. Navigate to profile page | Followed venues displayed correctly | ✅ |
| VEN-05 | Follow non-existent venue | 1. Login as regular user<br>2. Try to follow venue with invalid ID via API | Error response returned | ✅ |

## Test Scripts

### Login Test Script

```typescript
// tests/auth/login.test.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Check redirect to account page
    await expect(page).toHaveURL('/account');
    
    // Check if user is logged in
    const welcomeText = await page.textContent('h1');
    expect(welcomeText).toContain('Welcome');
  });
  
  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Check for error message
    const errorMessage = await page.textContent('[data-test="error-message"]');
    expect(errorMessage).toContain('Invalid email or password');
  });
});
```

### Password Reset Test Script

```typescript
// tests/auth/password-reset.test.ts
import { test, expect } from '@playwright/test';

test.describe('Password Reset Flow', () => {
  test('should request password reset', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // Check for success message
    const successMessage = await page.textContent('[data-test="success-message"]');
    expect(successMessage).toContain('password reset link has been sent');
  });
});
```

### Admin Access Test Script

```typescript
// tests/auth/admin-access.test.ts
import { test, expect } from '@playwright/test';

test.describe('Admin Access', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Admin1234!');
    await page.click('button[type="submit"]');
  });
  
  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    
    // Check if admin dashboard is displayed
    const heading = await page.textContent('h1');
    expect(heading).toContain('Admin Dashboard');
  });
});
```

### Profile Update Test Script

```typescript
// tests/auth/profile-update.test.ts
import { test, expect } from '@playwright/test';

test.describe('Profile Update', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
  });
  
  test('should update profile successfully', async ({ page }) => {
    await page.goto('/profile');
    
    // Update profile fields
    await page.fill('input[name="fullName"]', 'Test User Updated');
    await page.fill('input[name="username"]', 'testupdated');
    await page.click('button[type="submit"]');
    
    // Check for success message
    const successMessage = await page.textContent('[data-test="success-message"]');
    expect(successMessage).toContain('Profile updated successfully');
    
    // Verify updated fields
    await page.reload();
    const fullNameValue = await page.inputValue('input[name="fullName"]');
    expect(fullNameValue).toBe('Test User Updated');
  });
});
```

### Artist Following Test Script

```typescript
// tests/auth/artist-following.test.ts
import { test, expect } from '@playwright/test';

test.describe('Artist Following', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
  });
  
  test('should follow and unfollow artist', async ({ page }) => {
    // Navigate to artist page
    await page.goto('/artists/1');
    
    // Follow artist
    await page.click('[data-test="follow-button"]');
    
    // Check if follow status changed
    await expect(page.locator('[data-test="unfollow-button"]')).toBeVisible();
    
    // Navigate to profile page and check followed artists
    await page.goto('/profile');
    const artistName = await page.textContent('[data-test="followed-artist-name"]');
    expect(artistName).toBeTruthy();
    
    // Navigate back to artist page
    await page.goto('/artists/1');
    
    // Unfollow artist
    await page.click('[data-test="unfollow-button"]');
    
    // Check if follow status changed back
    await expect(page.locator('[data-test="follow-button"]')).toBeVisible();
  });
});
```

## Manual Testing Checklist

In addition to automated tests, perform the following manual tests:

- [ ] Verify email confirmation link works correctly
- [ ] Check that password reset link expires after use
- [ ] Verify that session persists after browser refresh
- [ ] Test login with "Remember me" option
- [ ] Verify that middleware correctly protects all routes
- [ ] Test concurrent logins from different browsers
- [ ] Verify proper error handling for network issues
- [ ] Test form validation for all edge cases
- [ ] Verify CSRF protection is working correctly
- [ ] Test accessibility of authentication forms

## Reporting Issues

When reporting issues with the authentication system, include the following information:

1. Test ID and description
2. Steps to reproduce
3. Expected vs. actual result
4. Browser and device information
5. Screenshots or videos if applicable
6. Console errors or network logs

## Continuous Integration

All authentication tests should be run as part of the CI pipeline to ensure that changes don't break authentication flows.

```yaml
# .github/workflows/auth-tests.yml
name: Authentication Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run auth tests
        run: npm run test:auth
``` 