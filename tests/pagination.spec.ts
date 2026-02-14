import { test, expect } from '@playwright/test';

test('journal pagination should work with contentEditable', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto('/');

    // Select Hors Ligne to enter the app
    await page.click('text=Hors Ligne');
    await page.waitForTimeout(1000);

    // Create character
    const createBtn = page.locator('button').first();
    await createBtn.click();
    await page.waitForTimeout(1000);

    const nameInput = page.locator('input').first();
    await nameInput.fill('TestChar');
    await page.waitForTimeout(500);

    const okBtn = page.locator('button').nth(2);
    await okBtn.click();
    await page.waitForTimeout(2000);

    // Navigate to Campaign Notes
    await page.click('text=Notes de Campagne');

    // Wait for the journal to load (wait for the editor to be mounted)
    await page.waitForSelector('.ProseMirror', { timeout: 20000 });

    const editor = page.locator('.ProseMirror').first();
    if (await editor.isVisible()) {
        await editor.click();

        let content = '';
        for (let i = 0; i < 45; i++) {
            content += `Line ${i + 1}\n`;
        }

        await page.keyboard.type(content);
        await page.waitForTimeout(5000);

        // Check if pagination happened (looking for journal-page class added to background cards)
        const pages = page.locator('.journal-page');
        const count = await pages.count();
        console.log(`Found ${count} journal pages after typing 45 lines`);

        // We add 1 for the Table of Contents page, so expecting more than 2 total pages
        expect(count).toBeGreaterThan(2);
        console.log('✅ Pagination works!');
    } else {
        console.log('❌ No editor found');
        expect(false).toBe(true); // Force fail
    }
});
