import { test, expect } from '@playwright/test';

test.describe('Password Reset Flow', () => {
  test('should request password reset', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button:has-text("Send Reset Link")');
    
    // Wait for success message to appear
    await page.waitForSelector('.alert-success', { timeout: 10000 });
    
    // Check for success message
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('If an account exists');
  });
  
  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button:has-text("Send Reset Link")');
    
    // Wait for error message to appear
    await page.waitForSelector('.alert-danger', { timeout: 10000 });
    
    // Check for validation error
    const errorMessage = await page.textContent('.alert-danger');
    expect(errorMessage).toContain('email');
  });
  
  test('should update password with valid reset link', async ({ page }) => {
    // Note: This test assumes you have a way to generate or mock a valid reset link
    // In a real test, you might need to intercept the email or use a test API
    const resetToken = 'test-reset-token';
    await page.goto(`/update-password?token=${resetToken}`);
    
    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
    await page.click('button:has-text("Update Password")');
    
    // Check for success message and redirect
    await expect(page).toHaveURL('/login');
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Password');
  });
  
  test('should show error for password mismatch', async ({ page }) => {
    const resetToken = 'test-reset-token';
    await page.goto(`/update-password?token=${resetToken}`);
    
    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    await page.click('button:has-text("Update Password")');
    
    // Wait for error message to appear
    await page.waitForSelector('.alert-danger', { timeout: 10000 });
    
    // Check for error message
    const errorMessage = await page.textContent('.alert-danger');
    expect(errorMessage).toContain('match');
  });
}); 