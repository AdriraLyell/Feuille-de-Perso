import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampaignService } from './CampaignService';
import { OfflineStorageService } from './OfflineStorageService';
import { DatabaseService } from './DatabaseService';
import { LibraryService } from './LibraryService';
import { defaultRules } from '../data/defaultRules';
import { RulesData } from '../types/rules';

// Mock dependencies
vi.mock('./DatabaseService', () => ({
    DatabaseService: {
        fetchOne: vi.fn(),
        fetchAll: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteBy: vi.fn()
    }
}));

vi.mock('./LibraryService', () => ({
    LibraryService: {
        loadLibraries: vi.fn(),
        persistInitialLibraries: vi.fn(),
        syncLibraries: vi.fn()
    }
}));

// We will use a "fake" IndexedDB implementation for OfflineStorageService logic
// since idb-keyval uses browser APIs not available in Node easily without setup.
// We'll mock the module 'idb-keyval' itself.
const mockStore = new Map<string, any>();

vi.mock('idb-keyval', () => ({
    get: vi.fn((key) => Promise.resolve(mockStore.get(key as string))),
    set: vi.fn((key, val) => {
        mockStore.set(key as string, val);
        return Promise.resolve();
    }),
    entries: vi.fn(() => Promise.resolve(Array.from(mockStore.entries()))),
    del: vi.fn((key) => {
        mockStore.delete(key as string);
        return Promise.resolve();
    })
}));

describe('Integration: CampaignService & OfflineStorage', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        mockStore.clear();
    });

    it('should save loaded campaign to offline cache', async () => {
        const campaignId = 'camp-123';
        const mockDbSetting = {
            id: campaignId,
            name: 'Test Campaign',
            version: '1.0.0',
            updated_at: new Date().toISOString(),
            configurations: { ...defaultRules.configurations },
            definitions: { ...defaultRules.definitions },
            is_public: false,
            is_archived: false,
            show_metadata_to_players: true
        };

        const mockLibraries = {
            traits: [],
            skills: [],
            specializations: [],
            backgrounds: [],
            counters: []
        };

        // 1. Mock Database Response
        (DatabaseService.fetchOne as any).mockResolvedValue(mockDbSetting);
        (LibraryService.loadLibraries as any).mockResolvedValue(mockLibraries);

        // 2. Load Setting via CampaignService
        const setting = await CampaignService.loadSetting(campaignId);
        expect(setting).not.toBeNull();
        expect(setting?.settingId).toBe(campaignId);

        // 3. Manually trigger save to cache (usually done in RulesLoader or UI, but we test the Service interop here)
        // In the real app, RulesLoader calls CampaignService.loadSetting check then OfflineStorageService.saveRules.
        // Let's simulate that flow.

        if (setting) {
            await OfflineStorageService.saveRules(setting);
        }

        // 4. Verify Cache Content
        // Check "active" cache
        const activeRules = await OfflineStorageService.getActiveRules();
        expect(activeRules).toEqual(setting);
        expect(mockStore.get('rpg-rules-cache')).toBeDefined();

        // Check "specific" cache
        const specificRules = await OfflineStorageService.getRulesBySettingId(campaignId);
        expect(specificRules).toEqual(setting);
        expect(mockStore.get(`rpg-rules-${campaignId}`)).toBeDefined();
    });

    it('should retrieve campaign from offline cache when explicitly requested', async () => {
        const campaignId = 'offline-camp-456';
        const cachedRules: RulesData = {
            ...defaultRules,
            settingId: campaignId,
            settingName: 'Offline Campaign',
            version: '2.0.0'
        };

        // 1. Seed Cache
        await OfflineStorageService.saveRules(cachedRules);

        // 2. Retrieve from Cache
        const retrieved = await OfflineStorageService.getRulesBySettingId(campaignId);

        expect(retrieved).not.toBeNull();
        expect(retrieved?.settingName).toBe('Offline Campaign');
    });

    it('should list cached campaigns for offline switching', async () => {
        const c1: RulesData = { ...defaultRules, settingId: 'c1', settingName: 'Campaign One', version: '1.0' };
        const c2: RulesData = { ...defaultRules, settingId: 'c2', settingName: 'Campaign Two', version: '1.1' };

        await OfflineStorageService.saveRules(c1);
        await OfflineStorageService.saveRules(c2);

        const list = await OfflineStorageService.listCachedCampaigns();

        expect(list).toHaveLength(2);
        expect(list).toContainEqual({ id: 'c1', name: 'Campaign One', version: '1.0' });
        expect(list).toContainEqual({ id: 'c2', name: 'Campaign Two', version: '1.1' });
    });

    it('should handle updates: new fetch should overwrite cache', async () => {
        const campaignId = 'update-test';

        // 1. Initial State (Old Version in Cache)
        const oldRules: RulesData = { ...defaultRules, settingId: campaignId, version: '1.0' };
        await OfflineStorageService.saveRules(oldRules);

        // 2. New Version from DB
        const newDbSetting = {
            id: campaignId,
            name: 'Updated Campaign',
            version: '2.0',
            updated_at: new Date().toISOString(),
            configurations: { ...defaultRules.configurations },
            definitions: { ...defaultRules.definitions },
            is_public: true
        };
        (DatabaseService.fetchOne as any).mockResolvedValue(newDbSetting);
        (LibraryService.loadLibraries as any).mockResolvedValue({ traits: [], skills: [], specializations: [], backgrounds: [], counters: [] });

        // 3. Load & Save
        const newRules = await CampaignService.loadSetting(campaignId);
        expect(newRules).not.toBeNull();
        if (newRules) await OfflineStorageService.saveRules(newRules);

        // 4. Verify Cache Updated
        const cached = await OfflineStorageService.getRulesBySettingId(campaignId);
        expect(cached?.version).toBe('2.0');
    });
});
