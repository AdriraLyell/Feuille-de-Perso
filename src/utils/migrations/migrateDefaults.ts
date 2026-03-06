import { INITIAL_DATA } from '../../data/initialState';
import { MigratableData } from './registry';

/**
 * Migration: Default values
 * - Initialize header
 * - Initialize xpLogs, appLogs, creationConfig, theme
 * - Initialize campaign notes, party notes
 * - Handle xpLogs mj and spendingLocation fields
 * - Campaign notes image migration (imageId → images[])
 */
export const migrateDefaults = (parsed: MigratableData): void => {
    // Initialize header
    if (!parsed.header) {
        parsed.header = INITIAL_DATA.header;
    }

    // Initialize xpLogs
    const data = parsed as Record<string, unknown>;
    if (!Array.isArray(data.xpLogs)) {
        data.xpLogs = [];
    }

    // Migrate xpLogs entries
    const xpLogs = data.xpLogs as Record<string, unknown>[];
    if (xpLogs.length > 0) {
        data.xpLogs = xpLogs.map((log) => {
            const newLog = { ...log };
            if (typeof newLog.mj === 'undefined') {
                newLog.mj = '';
            }
            if (typeof newLog.spendingLocation === 'undefined') {
                newLog.spendingLocation = '';
            }
            return newLog;
        });
    }

    // Initialize appLogs
    if (!Array.isArray(parsed.appLogs)) {
        parsed.appLogs = [];
    } else if (parsed.appLogs.length > 50) {
        // Purge old logs if the array has grown too large
        parsed.appLogs = parsed.appLogs.slice(0, 50);
    }

    // Initialize creationConfig
    if (!parsed.creationConfig) {
        parsed.creationConfig = INITIAL_DATA.creationConfig;
    }

    const creationConfig = parsed.creationConfig as Record<string, unknown>;
    if (typeof creationConfig.attributeMin === 'undefined') {
        creationConfig.attributeMin = INITIAL_DATA.creationConfig.attributeMin;
    }
    if (typeof creationConfig.attributeMax === 'undefined') {
        creationConfig.attributeMax = INITIAL_DATA.creationConfig.attributeMax;
    }
    if (typeof creationConfig.attributeCost === 'undefined') {
        creationConfig.attributeCost = INITIAL_DATA.creationConfig.attributeCost;
    }
    if (!creationConfig.cardConfig) {
        creationConfig.cardConfig = INITIAL_DATA.creationConfig.cardConfig;
    }

    // Initialize theme
    if (!parsed.theme) {
        parsed.theme = INITIAL_DATA.theme;
    }

    // Initialize campaign notes
    if (!Array.isArray(parsed.campaignNotes)) {
        parsed.campaignNotes = [];
    } else {
        // Migrate campaign notes images
        const notes = parsed.campaignNotes as Record<string, unknown>[];
        parsed.campaignNotes = notes.map((note) => {
            if (note.imageId && (!Array.isArray(note.images) || note.images.length === 0)) {
                note.images = [{
                    id: Math.random().toString(36).substring(2, 11),
                    imageId: note.imageId,
                    config: note.imageConfig || { width: 200, height: 200, marginTop: 0, align: 'right' }
                }];
                delete note.imageId;
                delete note.imageConfig;
            }
            if (!Array.isArray(note.images)) note.images = [];
            return note;
        });
    }

    // Initialize party notes
    if (!parsed.partyNotes) {
        parsed.partyNotes = INITIAL_DATA.partyNotes;
    } else {
        const partyNotes = parsed.partyNotes as Record<string, unknown>;
        if (!partyNotes.staticColWidths) {
            partyNotes.staticColWidths = INITIAL_DATA.partyNotes?.staticColWidths;
        }
    }
};

