import { test, expect } from '@playwright/test';

test('journal overflow should split precisely', async ({ page }) => {
    // Increase timeout for slow dev server
    test.setTimeout(90000);

    // Capture console logs
    page.on('console', msg => {
        if (msg.text().includes('Overflow Check')) {
            console.log('--- BROWSER LOG ---', msg.text());
        }
    });

    await page.goto('http://localhost:5173/');

    // 1. Select Mode Hors Ligne
    await page.click('text=Mode Hors Ligne');

    // 2. Click on the Campaign Notes tab
    await page.click('text=Notes de Campagne');

    // Wait for the journal to load
    await page.waitForSelector('.journal-page', { timeout: 20000 });

    const editor = page.locator('[contenteditable]').first();
    await editor.click();

    // Type content (45 lines to be sure)
    let content = '';
    for (let i = 0; i < 45; i++) {
        content += `Line ${i + 1}\n`;
    }

    await editor.fill('');
    await page.keyboard.type(content);

    // Wait for pagination
    await page.waitForTimeout(10000);

    const pages = page.locator('.journal-page');
    const count = await pages.count();
    console.log(`Detected ${count} pages.`);

    expect(count).toBeGreaterThan(1);
});
