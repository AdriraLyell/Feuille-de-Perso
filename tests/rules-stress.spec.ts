import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Rules Loading Stress Tests', () => {

    test('should fallback to CDN when API is rate-limited (403)', async ({ page }) => {
        page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`));

        // Mock API Failure
        await page.route('**/api.github.com/**', async route => {
            console.log('[TEST]: API FAIL (403)');
            await route.fulfill({ status: 403 });
        });

        // Mock CDN Success
        await page.route('**/raw.githubusercontent.com/**', async route => {
            console.log('[TEST]: CDN SUCCESS');
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    version: "STRESS-CDN",
                    configurations: { theme: {} },
                    definitions: { skills: {}, backgrounds: [], counters: {} },
                    libraries: { traits: [], skills: [], specializations: [], backgrounds: [], counters: [] }
                })
            });
        });

        await page.goto('/');

        await expect.poll(async () => {
            return await page.evaluate(() => (window as any).rulesStatus?.version);
        }, { timeout: 15000 }).toBe('STRESS-CDN');
    });

    test('should fallback to Cache when network is totally dead', async ({ page }) => {
        page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`));

        // 1. Success load to fill cache
        await page.route('**/*rules.json*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    version: "STRESS-CACHE",
                    settingId: "stress-id",
                    configurations: { theme: {} }, definitions: { skills: {}, backgrounds: [], counters: {} }, libraries: { traits: [], skills: [], specializations: [], backgrounds: [], counters: [] }
                })
            });
        });

        await page.goto('/');
        await expect.poll(() => page.evaluate(() => (window as any).rulesStatus?.version)).toBe('STRESS-CACHE');
        await page.waitForTimeout(2000);

        // 2. Failure load
        await page.route('**/*rules.json*', async route => {
            console.log('[TEST]: NETWORK DEAD');
            await route.abort('internetdisconnected');
        });

        await page.reload();

        await expect.poll(async () => {
            return await page.evaluate(() => (window as any).rulesStatus?.version);
        }, { timeout: 15000 }).toBe('STRESS-CACHE');
    });

    test('should fallback to Defaults when nothing else exists', async ({ page }) => {
        page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`));

        // 1. Go to page and WIPE storage
        await page.goto('/');
        await page.evaluate(async () => {
            localStorage.clear();
            sessionStorage.clear();
            const dbs = await window.indexedDB.databases();
            dbs.forEach(db => { if (db.name) window.indexedDB.deleteDatabase(db.name); });
        });

        // 2. Reload with no network
        await page.route('**/*rules.json*', async route => {
            await route.abort('failed');
        });

        await page.reload();

        await expect.poll(async () => {
            const status = await page.evaluate(() => (window as any).rulesStatus);
            if (status) console.log(`[TEST]: Last Resort Status: ${status.loaded ? 'OK' : 'FAIL'} (v${status.version})`);
            return status?.version;
        }, { timeout: 15000 }).toBe('1.0.0');
    });

});
