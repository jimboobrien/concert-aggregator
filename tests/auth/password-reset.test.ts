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
  
  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    
    // Check for validation error
    const errorMessage = await page.textContent('[data-test="error-message"]');
    expect(errorMessage).toContain('valid email');
  });
  
  test('should update password with valid reset link', async ({ page }) => {
    // Note: This test assumes you have a way to generate or mock a valid reset link
    // In a real test, you might need to intercept the email or use a test API
    const resetToken = 'test-reset-token';
    await page.goto(`/update-password?token=${resetToken}`);
    
    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
    await page.click('button[type="submit"]');
    
    // Check for success message and redirect
    await expect(page).toHaveURL('/login');
    const successMessage = await page.textContent('[data-test="success-message"]');
    expect(successMessage).toContain('Password has been updated');
  });
  
  test('should show error for password mismatch', async ({ page }) => {
    const resetToken = 'test-reset-token';
    await page.goto(`/update-password?token=${resetToken}`);
    
    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    await page.click('button[type="submit"]');
    
    // Check for error message
    const errorMessage = await page.textContent('[data-test="error-message"]');
    expect(errorMessage).toContain('Passwords do not match');
  });
}); 