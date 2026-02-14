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

    // Create first journal entry by clicking "Nouvelle Page"
    const newPageBtn = page.locator('button').filter({ hasText: /Nouvelle|New/ }).first();
    if (await newPageBtn.isVisible()) {
        await newPageBtn.click();
        await page.waitForTimeout(1500);
    }

    // Type content (45 lines to trigger pagination)
    const editor = page.locator('[contenteditable]').first();
    if (await editor.isVisible()) {
        await editor.click();

        let content = '';
        for (let i = 0; i < 45; i++) {
            content += `Line ${i + 1}\n`;
        }

        await editor.type(content);
        await page.waitForTimeout(3000);

        // Check if pagination happened
        const pages = page.locator('.journal-page');
        const count = await pages.count();
        console.log(`Found ${count} journal pages after typing 45 lines`);

        // The test passes if we have more than 1 page after typing
        expect(count).toBeGreaterThan(1);
        console.log('✅ Pagination works!');
    } else {
        console.log('❌ No editor found');
        expect(false).toBe(true); // Force fail
    }
});
