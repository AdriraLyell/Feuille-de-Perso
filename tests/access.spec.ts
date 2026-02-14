import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
    });
});

test('app loads and shows title', async ({ page }) => {
    await page.goto('/');
    // Wait for the app to initialize and show the title
    await expect(page).toHaveTitle(/Seigneurs des Mystères - Fiche de Personnage/);
    // Ensure React has mounted by checking if #root is not empty
    await expect(page.locator('#root')).not.toBeEmpty();
});

test('admin page loads', async ({ page }) => {
    await page.goto('/admin.html');
    // Verify admin page loads and shows correct title
    await expect(page).toHaveTitle(/Seigneurs des Mystères - Administration/);
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(page).toHaveURL(/admin.html/);
});
