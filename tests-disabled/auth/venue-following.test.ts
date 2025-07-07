import { test, expect } from '@playwright/test';

test.describe('Venue Following', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Ensure we're logged in
    await expect(page).toHaveURL('/account');
  });
  
  test('should follow and unfollow venue', async ({ page }) => {
    // Navigate to venue page
    await page.goto('/venues/1');
    
    // Check initial state (assuming not followed initially)
    const initialFollowButton = await page.locator('[data-test="follow-button"]');
    if (await initialFollowButton.isVisible()) {
      // Follow venue
      await initialFollowButton.click();
      
      // Check if follow status changed
      await expect(page.locator('[data-test="unfollow-button"]')).toBeVisible();
    } else {
      // Venue is already followed, unfollow first to test both actions
      await page.locator('[data-test="unfollow-button"]').click();
      await expect(page.locator('[data-test="follow-button"]')).toBeVisible();
      
      // Now follow again
      await page.locator('[data-test="follow-button"]').click();
      await expect(page.locator('[data-test="unfollow-button"]')).toBeVisible();
    }
    
    // Navigate to profile page and check followed venues
    await page.goto('/profile');
    const venueElement = await page.locator('[data-test="followed-venue-item"]').first();
    expect(await venueElement.isVisible()).toBeTruthy();
    
    // Navigate back to venue page
    await page.goto('/venues/1');
    
    // Unfollow venue
    await page.locator('[data-test="unfollow-button"]').click();
    
    // Check if follow status changed back
    await expect(page.locator('[data-test="follow-button"]')).toBeVisible();
  });
  
  test('should redirect to login when unauthenticated user tries to follow', async ({ browser }) => {
    // Create a new context (not logged in)
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to venue page
    await page.goto('/venues/1');
    
    // Try to follow venue
    await page.click('[data-test="follow-button"]');
    
    // Check if redirected to login
    await expect(page).toHaveURL(/.*login.*/);
    
    // Close the context
    await context.close();
  });
  
  test('should show followed venues on profile page', async ({ page }) => {
    // First ensure we follow at least one venue
    await page.goto('/venues/1');
    const followButton = await page.locator('[data-test="follow-button"]');
    if (await followButton.isVisible()) {
      await followButton.click();
    }
    
    // Navigate to profile page
    await page.goto('/profile');
    
    // Check if followed venues section is visible
    const followedVenuesSection = await page.locator('[data-test="followed-venues-section"]');
    expect(await followedVenuesSection.isVisible()).toBeTruthy();
    
    // Check if at least one venue is listed
    const venueItems = await page.locator('[data-test="followed-venue-item"]').count();
    expect(venueItems).toBeGreaterThan(0);
  });
  
  test('should show error when trying to follow non-existent venue', async ({ request }) => {
    // Attempt to follow a non-existent venue via API
    const response = await request.post('/api/venues/999999/follow');
    
    // Check for error response
    expect(response.status()).toBe(404);
    const responseBody = await response.json();
    expect(responseBody.error).toBeTruthy();
  });
}); 