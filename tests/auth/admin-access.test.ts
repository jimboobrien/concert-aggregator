import { test, expect } from '@playwright/test';

test.describe('Admin Access', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Admin1234!');
    await page.click('button[type="submit"]');
    
    // Ensure we're logged in by checking for account page
    await expect(page).toHaveURL('/account');
  });
  
  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    
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
  
  test('should access admin venues page', async ({ page }) => {
    await page.goto('/admin/venues');
    
    // Check if venues page is accessible
    const heading = await page.textContent('h1');
    expect(heading).toContain('Venues');
  });
});

test.describe('Regular User Admin Access', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Ensure we're logged in by checking for account page
    await expect(page).toHaveURL('/account');
  });
  
  test('should be redirected when trying to access admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    
    // Check if redirected away from admin area
    await expect(page).not.toHaveURL('/admin');
    
    // Check for access denied message if there is one
    const errorMessage = await page.textContent('body');
    if (errorMessage) {
      expect(errorMessage.includes('access denied') || !page.url().includes('/admin')).toBeTruthy();
    } else {
      expect(page.url()).not.toContain('/admin');
    }
  });
}); 