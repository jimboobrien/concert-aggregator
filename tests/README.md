# Authentication Testing

This directory contains automated tests for the authentication system in the Concerts application. The tests are written using [Playwright](https://playwright.dev/), a modern end-to-end testing framework.

## Test Structure

- `auth/login.test.ts` - Tests for login functionality
- `auth/password-reset.test.ts` - Tests for password reset functionality
- `auth/admin-access.test.ts` - Tests for admin role checks
- `auth/profile-update.test.ts` - Tests for profile updates
- `auth/artist-following.test.ts` - Tests for artist following functionality
- `auth/venue-following.test.ts` - Tests for venue following functionality

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

3. Set up environment variables (create a `.env.local` file):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Set up test data:
   - Create test user accounts:
     - Regular user: `test@example.com` / `Test1234!`
     - Admin user: `admin@example.com` / `Admin1234!`
   - Create test artists and venues in the database

### Running All Authentication Tests

```bash
npm run test:auth
```

### Running Specific Test Files

```bash
npx playwright test tests/auth/login.test.ts
```

### Running Tests in UI Mode

```bash
npm run test:ui
```

### Viewing Test Reports

```bash
npm run test:report
```

## Continuous Integration

Authentication tests are automatically run in GitHub Actions for:
- Push to main branch
- Pull requests to main branch

See the workflow configuration in `.github/workflows/auth-tests.yml`.

## Test Plan

For a comprehensive test plan covering all authentication flows, see [Authentication System Testing Plan](../docs/authentication-testing.md).

## Troubleshooting

### Common Issues

1. **Tests failing due to authentication errors**:
   - Check that your Supabase environment variables are correctly set
   - Ensure test user accounts exist in your Supabase project

2. **Element not found errors**:
   - Check that the data-test attributes match between tests and components
   - Verify that the page structure hasn't changed

3. **Timeout errors**:
   - Increase timeout in the test configuration
   - Check for performance issues in the application

### Debugging Tips

1. Use UI mode for visual debugging:
   ```bash
   npm run test:ui
   ```

2. Add `await page.pause()` in your test to pause execution at a specific point

3. Enable tracing for all tests:
   ```bash
   PLAYWRIGHT_TRACE=1 npm run test:auth
   ``` 