import { test, expect } from '@playwright/test';

test.describe('Profile Update', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Ensure we're logged in
    await expect(page).toHaveURL('/account');
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
  
  test('should show validation error for invalid username', async ({ page }) => {
    await page.goto('/profile');
    
    // Enter invalid username (with special characters)
    await page.fill('input[name="username"]', 'test@user!');
    await page.click('button[type="submit"]');
    
    // Check for validation error
    const errorMessage = await page.textContent('[data-test="error-message"]');
    expect(errorMessage).toContain('Username can only contain');
  });
  
  test('should show error for duplicate username', async ({ page }) => {
    await page.goto('/profile');
    
    // Try to use a username that's already taken
    await page.fill('input[name="username"]', 'existinguser');
    await page.click('button[type="submit"]');
    
    // Check for error message
    const errorMessage = await page.textContent('[data-test="error-message"]');
    expect(errorMessage).toContain('Username already exists');
  });
}); 