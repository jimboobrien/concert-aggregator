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
  
  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Sign up');
    
    // Check redirect to signup form
    const heading = await page.textContent('h1');
    expect(heading).toContain('Sign up');
  });
  
  test('should redirect to requested page after login', async ({ page }) => {
    await page.goto('/login?redirectTo=/profile');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Check redirect to profile page
    await expect(page).toHaveURL('/profile');
  });
}); 