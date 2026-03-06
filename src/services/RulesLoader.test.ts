import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { loadRules } from './RulesLoader';
import { GithubRateLimiter } from '../utils/githubUtils';
import { OfflineStorageService } from './OfflineStorageService';
import { CampaignService } from './CampaignService';
import { defaultRules } from '../data/defaultRules';

// Mocks
vi.mock('../utils/githubUtils', () => ({
    GithubRateLimiter: {
        isOffline: vi.fn(),
        isLimited: vi.fn(),
        setLimited: vi.fn()
    }
}));

vi.mock('./OfflineStorageService', () => ({
    OfflineStorageService: {
        getActiveRules: vi.fn(),
        getRulesBySettingId: vi.fn(),
        saveRules: vi.fn()
    }
}));

vi.mock('./CampaignService', () => ({
    CampaignService: {
        loadSetting: vi.fn()
    }
}));

vi.mock('../utils/logger', () => ({
    logger: {
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

// Global fetch mock
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RulesLoader', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockFetch.mockReset();

        // Default mocks
        (GithubRateLimiter.isOffline as Mock).mockReturnValue(false);
        (GithubRateLimiter.isLimited as Mock).mockReturnValue(false);
        (GithubRateLimiter.setLimited as Mock).mockImplementation(() => { });
        (OfflineStorageService.getActiveRules as Mock).mockResolvedValue(null);
        (OfflineStorageService.getRulesBySettingId as Mock).mockResolvedValue(null);
        (OfflineStorageService.saveRules as Mock).mockResolvedValue(true);
        (CampaignService.loadSetting as Mock).mockResolvedValue(null);
    });

    describe('Offline Mode', () => {
        beforeEach(() => {
            (GithubRateLimiter.isOffline as Mock).mockReturnValue(true);
        });

        it('should load active rules from cache when offline and no settingId', async () => {
            const mockCachedRules = { ...defaultRules, source: 'cache_test', version: '1.0.0' };
            (OfflineStorageService.getActiveRules as Mock).mockResolvedValue(mockCachedRules);

            const result = await loadRules();

            expect(OfflineStorageService.getActiveRules).toHaveBeenCalled();
            expect(result).toEqual({ ...mockCachedRules, source: 'cache' });
        });

        it('should load specific setting from cache when offline and settingId provided', async () => {
            const settingId = 'test-setting-id';
            const mockCachedRules = { ...defaultRules, settingId, version: '1.0.0' };
            (OfflineStorageService.getRulesBySettingId as Mock).mockResolvedValue(mockCachedRules);

            const result = await loadRules(settingId);

            expect(OfflineStorageService.getRulesBySettingId).toHaveBeenCalledWith(settingId);
            expect(result).toEqual({ ...mockCachedRules, source: 'cache' });
        });

        it('should fallback to default rules when offline and no cache', async () => {
            (OfflineStorageService.getActiveRules as Mock).mockResolvedValue(null);

            const result = await loadRules();

            expect(result).toEqual(defaultRules);
        });
    });

    describe('Online Mode - GitHub API Strategy', () => {
        it('should fetch from GitHub API if not rate limited', async () => {
            const mockApiRules = { ...defaultRules, version: '2.0.0' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockApiRules
            });

            const result = await loadRules();

            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('api.github.com'), expect.anything());
            expect(result).toEqual({ ...mockApiRules, source: 'api' });
        });

        it('should handle API rate limit (403) and fallback to Raw CDN', async () => {
            // API Fails with 403
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403
            });

            // Raw CDN Success
            const mockRawRules = { ...defaultRules, version: '3.0.0' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockRawRules
            });

            const result = await loadRules();

            expect(GithubRateLimiter.setLimited).toHaveBeenCalled();
            expect(result).toEqual({ ...mockRawRules, source: 'api' });
        });

        it('should skip API if already rate limited', async () => {
            (GithubRateLimiter.isLimited as Mock).mockReturnValue(true);

            // Raw CDN Success
            const mockRawRules = { ...defaultRules, version: '4.0.0' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockRawRules
            });

            const result = await loadRules();

            // Verify call URL instead of strict count
            const callUrls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string);
            const hasApi = callUrls.some((url: string) => url.includes('api.github.com'));
            const hasRaw = callUrls.some((url: string) => url.includes('raw.githubusercontent.com'));

            expect(hasApi).toBe(false);
            expect(hasRaw).toBe(true);
            expect(result).toEqual({ ...mockRawRules, source: 'api' });
        });
    });

    describe('Last Resort', () => {
        it('should fallback to general cache if online fetch fails', async () => {
            // API Fails
            mockFetch.mockRejectedValueOnce(new Error('Network Error'));
            // Raw Fails
            mockFetch.mockRejectedValueOnce(new Error('Network Error'));

            const mockCachedRules = { ...defaultRules, version: 'cache-v1' };
            (OfflineStorageService.getActiveRules as Mock).mockResolvedValue(mockCachedRules);

            const result = await loadRules();

            expect(OfflineStorageService.getActiveRules).toHaveBeenCalled();
            expect(result).toEqual(mockCachedRules);
        });

        it('should return defaultRules if absolutely all else fails', async () => {
            // API Fails
            mockFetch.mockRejectedValueOnce(new Error('Network Error'));
            // Raw Fails
            mockFetch.mockRejectedValueOnce(new Error('Network Error'));

            // Cache Fails
            (OfflineStorageService.getActiveRules as Mock).mockResolvedValue(null);

            const result = await loadRules();

            expect(result).toEqual(defaultRules);
        });
    });
});
