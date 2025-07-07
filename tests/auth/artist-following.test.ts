import { test, expect } from '@playwright/test';

test.describe('Artist Following', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Ensure we're logged in
    await expect(page).toHaveURL('/account');
  });
  
  test('should follow and unfollow artist', async ({ page }) => {
    // Navigate to artist page
    await page.goto('/artists/1');
    
    // Check initial state (assuming not followed initially)
    const initialFollowButton = await page.locator('[data-test="follow-button"]');
    if (await initialFollowButton.isVisible()) {
      // Follow artist
      await initialFollowButton.click();
      
      // Check if follow status changed
      await expect(page.locator('[data-test="unfollow-button"]')).toBeVisible();
    } else {
      // Artist is already followed, unfollow first to test both actions
      await page.locator('[data-test="unfollow-button"]').click();
      await expect(page.locator('[data-test="follow-button"]')).toBeVisible();
      
      // Now follow again
      await page.locator('[data-test="follow-button"]').click();
      await expect(page.locator('[data-test="unfollow-button"]')).toBeVisible();
    }
    
    // Navigate to profile page and check followed artists
    await page.goto('/profile');
    const artistElement = await page.locator('[data-test="followed-artist-item"]').first();
    expect(await artistElement.isVisible()).toBeTruthy();
    
    // Navigate back to artist page
    await page.goto('/artists/1');
    
    // Unfollow artist
    await page.locator('[data-test="unfollow-button"]').click();
    
    // Check if follow status changed back
    await expect(page.locator('[data-test="follow-button"]')).toBeVisible();
  });
  
  test('should redirect to login when unauthenticated user tries to follow', async ({ browser }) => {
    // Create a new context (not logged in)
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to artist page
    await page.goto('/artists/1');
    
    // Try to follow artist
    await page.click('[data-test="follow-button"]');
    
    // Check if redirected to login
    await expect(page).toHaveURL(/.*login.*/);
    
    // Close the context
    await context.close();
  });
  
  test('should show followed artists on profile page', async ({ page }) => {
    // First ensure we follow at least one artist
    await page.goto('/artists/1');
    const followButton = await page.locator('[data-test="follow-button"]');
    if (await followButton.isVisible()) {
      await followButton.click();
    }
    
    // Navigate to profile page
    await page.goto('/profile');
    
    // Check if followed artists section is visible
    const followedArtistsSection = await page.locator('[data-test="followed-artists-section"]');
    expect(await followedArtistsSection.isVisible()).toBeTruthy();
    
    // Check if at least one artist is listed
    const artistItems = await page.locator('[data-test="followed-artist-item"]').count();
    expect(artistItems).toBeGreaterThan(0);
  });
}); 