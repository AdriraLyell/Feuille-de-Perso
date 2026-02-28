import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:5173');

    // Wait a bit for JS to execute and potentially load/save things
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
        return localStorage.getItem('rpg-sheet-data');
    });

    fs.writeFileSync('rpg-sheet-data-dump.json', data || '{}');

    await browser.close();
    console.log('Dumped rpg-sheet-data to rpg-sheet-data-dump.json');
})();
