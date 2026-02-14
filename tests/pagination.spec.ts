import { test, expect } from '@playwright/test';

test('journal pagination should work with contentEditable', async ({ page }) => {
    await page.goto('/');

    // Select Hors Ligne to enter the app (uses default character)
    await page.click('text=Hors Ligne');

    // Wait for app to load with default character
    await page.waitForTimeout(2000);

    // Navigate to Campaign Notes
    await page.click('text=Notes de Campagne');

    // Wait for the editor to be mounted
    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 20000 });
    await editor.click();

    // Insert 100 lines instantly (instead of typing char by char)
    const content = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`).join('\n');
    await page.keyboard.insertText(content);

    // Wait for pagination to complete by polling
    const pages = page.locator('.journal-page');
    await expect.poll(async () => {
        return await pages.count();
    }, {
        message: 'Expected more than 2 journal pages after inserting 100 lines',
        timeout: 15000,
    }).toBeGreaterThan(2);
});
