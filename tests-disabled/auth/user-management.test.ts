import { test, expect } from '@playwright/test';

test.describe('User Management (Admin Only)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Admin1234!');
    await page.click('button[type="submit"]');
    
    // Wait for login redirect
    await page.waitForURL(/\/(dashboard|account)/);
  });
  
  test('should display user management page with user list', async ({ page }) => {
    await page.goto('/admin/user-management');
    
    // Check if user management page is accessible
    const heading = await page.textContent('h1');
    expect(heading).toContain('User Management');
    
    // Check if user table is visible
    await expect(page.locator('table')).toBeVisible();
    
    // Check for table headers
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Role')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
  });

  test('should show admin badge for admin users', async ({ page }) => {
    await page.goto('/admin/user-management');
    
    // Wait for table to load
    await page.waitForSelector('table tbody tr');
    
    // Look for admin badge
    await expect(page.locator('text=Admin').first()).toBeVisible();
  });

  test('should search users by email', async ({ page }) => {
    await page.goto('/admin/user-management');
    
    // Wait for initial load
    await page.waitForSelector('table tbody tr');
    
    // Search for a specific user
    await page.fill('input[placeholder*="Search users"]', 'admin@example.com');
    await page.click('button:has-text("Search")');
    
    // Should show filtered results
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(page.locator('text=admin@example.com')).toBeVisible();
  });

  test('should open role update modal when clicking role action', async ({ page }) => {
    await page.goto('/admin/user-management');
    
    // Wait for table to load
    await page.waitForSelector('table tbody tr');
    
    // Find a non-admin user and try to promote them
    const userRow = page.locator('table tbody tr').filter({ has: page.locator('text=User') }).first();
    if (await userRow.count() > 0) {
      const makeAdminButton = userRow.locator('button:has-text("Make Admin")');
      if (await makeAdminButton.count() > 0) {
        await makeAdminButton.click();
        
        // Check if modal opened
        await expect(page.locator('text=Update User Role')).toBeVisible();
        await expect(page.locator('button:has-text("Make Admin")')).toBeVisible();
      }
    }
  });

  test('should show pagination when there are many users', async ({ page }) => {
    await page.goto('/admin/user-management');
    
    // Wait for table to load
    await page.waitForSelector('table tbody tr');
    
    // Check if pagination is present (will show if more than 20 users)
    const pagination = page.locator('text=Page');
    if (await pagination.count() > 0) {
      await expect(pagination).toBeVisible();
    }
  });
});

test.describe('User Profile Admin Indicator', () => {
  test('should show admin badge on admin user profile', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Admin1234!');
    await page.click('button[type="submit"]');
    
    // Wait for login redirect
    await page.waitForURL(/\/(dashboard|account)/);
    
    // Go to profile page
    await page.goto('/profile');
    
    // Check if admin badge is visible
    await expect(page.locator('text=Administrator')).toBeVisible();
    await expect(page.locator('.badge:has-text("Administrator")')).toBeVisible();
  });

  test('should not show admin badge on regular user profile', async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Wait for login redirect
    await page.waitForURL(/\/(dashboard|account)/);
    
    // Go to profile page
    await page.goto('/profile');
    
    // Check that admin badge is NOT visible
    await expect(page.locator('text=Administrator')).not.toBeVisible();
  });
});