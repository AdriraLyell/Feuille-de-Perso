import { test, expect } from '@playwright/test';

test('app loads and shows title', async ({ page }) => {
    await page.goto('/');

    // Verify the page loads
    await expect(page.locator('body')).toBeVisible();
});

test('admin page loads', async ({ page }) => {
    await page.goto('/admin.html');

    // Verify admin page loads
    await expect(page).toHaveURL(/admin.html/);
});
