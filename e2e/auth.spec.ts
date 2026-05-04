import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AI Clinic Management System/);
});

test('login flow', async ({ page }) => {
  await page.goto('/login');
  
  // These are placeholders; actual IDs/roles depend on seeded data
  await page.fill('input[name="email"]', 'admin@clinic.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/.*dashboard/);
});
