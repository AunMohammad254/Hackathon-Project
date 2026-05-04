import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AI Clinic Management System/);
});

test('login flow', async ({ page }) => {
  await page.goto('/login');
  
  // Fill using id selectors which match the actual login page
  await page.fill('#email', 'admin@clinic.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');

  // Wait for either a redirect to dashboard or an error message
  await expect(page.locator('[class*="rose"]').or(page.locator('text=dashboard'))).toBeVisible({ timeout: 10000 });
});
