import { test, expect } from '@playwright/test';

test('journal overflow should split precisely', async ({ page }) => {
    await page.goto('/');

    // Select Hors Ligne to enter the app
    await page.click('text=Hors Ligne');

    // Click on the Campaign Notes tab
    await page.click('text=Notes de Campagne');

    // Wait for the editor to be mounted
    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 20000 });
    await editor.click();

    // Insert 100 lines of content instantly (instead of typing char by char)
    const content = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`).join('\n');
    await page.keyboard.insertText(content);

    // Wait for pagination to complete by polling for journal pages
    await expect.poll(async () => {
        return await page.locator('.journal-page').count();
    }, {
        message: 'Expected more than 2 journal pages after inserting 100 lines',
        timeout: 15000,
    }).toBeGreaterThan(2);
});
