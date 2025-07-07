import { test, expect } from '@playwright/test';

test.describe('Admin Access', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Admin1234!');
    await page.click('button[type="submit"]');
    
    // Wait for login redirect - could go to dashboard or account
    await page.waitForURL(/\/(dashboard|account)/);
  });
  
  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Check if admin dashboard is displayed
    const heading = await page.textContent('h1');
    expect(heading).toContain('Admin Dashboard');
  });
  
  test('should access admin artist management', async ({ page }) => {
    await page.goto('/admin/artist-management');
    
    // Check if artist management page is accessible
    const heading = await page.textContent('h1');
    expect(heading).toContain('Artist Management');
  });
  
  test('should access admin venue management', async ({ page }) => {
    await page.goto('/admin/venue-management');
    
    // Check if venue management page is accessible
    const heading = await page.textContent('h1');
    expect(heading).toContain('Venue Management');
  });

  test('should access admin user management', async ({ page }) => {
    await page.goto('/admin/user-management');
    
    // Check if user management page is accessible
    const heading = await page.textContent('h1');
    expect(heading).toContain('User Management');
  });

  test('should show admin dropdown in navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if admin dropdown is visible
    await expect(page.locator('text=Admin')).toBeVisible();
    
    // Click admin dropdown
    await page.click('text=Admin');
    
    // Check if admin menu items are visible
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(page.locator('text=Artist Management')).toBeVisible();
    await expect(page.locator('text=Venue Management')).toBeVisible();
    await expect(page.locator('text=User Management')).toBeVisible();
  });
});

test.describe('Regular User Admin Access', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Wait for login redirect - could go to dashboard or account
    await page.waitForURL(/\/(dashboard|account)/);
  });
  
  test('should be redirected when trying to access admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Should be redirected to home page
    await expect(page).toHaveURL('/');
  });

  test('should be redirected when trying to access artist management', async ({ page }) => {
    await page.goto('/admin/artist-management');
    
    // Should be redirected to home page
    await expect(page).toHaveURL('/');
  });

  test('should be redirected when trying to access venue management', async ({ page }) => {
    await page.goto('/admin/venue-management');
    
    // Should be redirected to home page
    await expect(page).toHaveURL('/');
  });

  test('should be redirected when trying to access user management', async ({ page }) => {
    await page.goto('/admin/user-management');
    
    // Should be redirected to home page
    await expect(page).toHaveURL('/');
  });

  test('should not show admin dropdown in navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Admin dropdown should not be visible for regular users
    await expect(page.locator('text=Admin')).not.toBeVisible();
  });
}); 