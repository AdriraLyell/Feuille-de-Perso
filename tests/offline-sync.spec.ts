import { test, expect } from '@playwright/test';

test.describe('Offline Sync Integration', () => {

    test('should persist rules and survive reload via cache', async ({ page, context }) => {
        // Log all browser console messages to terminal
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[APP]') || text.includes('[TEST]')) {
                console.log(`[BROWSER]: ${text}`);
            }
        });

        // Robust mock data to satisfy migrations and Zod schemas
        const mockRules = {
            version: "E2E-TEST-OFFLINE-100",
            settingId: "e2e-offline-setting",
            configurations: {
                theme: { primaryColor: "#0000ff" },
                minStat: 0,
                maxStat: 10
            },
            definitions: {
                skills: { "force": { name: "Force", category: "physique" } },
                backgrounds: [],
                counters: {
                    "volonte": { name: "Volonté", max: 10 },
                    "confiance": { name: "Confiance", max: 10 }
                }
            },
            libraries: {
                traits: [],
                skills: [],
                specializations: [],
                backgrounds: [],
                counters: [
                    { id: "volonte", name: "Volonté", value: 3, max: 10 },
                    { id: "confiance", name: "Confiance", value: 3, max: 10 }
                ]
            }
        };

        // 1. Initial Load (Online)
        await page.route('**/*rules.json*', async route => {
            console.log(`[TEST]: Mocking Rules Fetch: ${route.request().url()}`);
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockRules)
            });
        });

        console.log('[TEST]: Navigating to App...');
        await page.goto('/');

        // Verify that the mocked rules are active
        await expect.poll(async () => {
            return await page.evaluate(() => (window as any).rulesStatus?.version);
        }, { timeout: 15000 }).toBe('E2E-TEST-OFFLINE-100');
        console.log('[TEST]: Online Rules verified.');

        // Wait to ensure IndexedDB write finish
        await page.waitForTimeout(2000);

        // 2. Simulate Offline
        console.log('[TEST]: Simulating Offline state...');

        // Mock navigator.onLine for our App logic
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'onLine', { get: () => false });
        });

        // Fail all external fetches but allow localhost
        await page.route('**', async route => {
            const url = route.request().url();
            if (url.includes('localhost') || url.includes('data:')) {
                await route.continue();
            } else {
                await route.abort('internetdisconnected');
            }
        });

        console.log('[TEST]: Reloading (Offline mode)...');
        await page.reload();

        // Verify that the App loaded even offline
        await expect(page).toHaveTitle(/Seigneurs des Mystères/);

        // Verify that rules were loaded from Cache
        await expect.poll(async () => {
            const status = await page.evaluate(() => (window as any).rulesStatus);
            if (status?.loaded) console.log(`[TEST]: Rules recovered from cache (v${status.version})`);
            return status?.version;
        }, { timeout: 15000 }).toBe('E2E-TEST-OFFLINE-100');

        console.log('[TEST]: Offline Persistence SUCCESS.');
    });

});
