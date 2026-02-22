import { INITIAL_DATA } from '../../data/initialState';

/**
 * Migration: Default values
 * - Initialize header
 * - Initialize xpLogs, appLogs, creationConfig, theme
 * - Initialize campaign notes, party notes
 * - Handle xpLogs mj and spendingLocation fields
 * - Campaign notes image migration (imageId → images[])
 */
export const migrateDefaults = (parsed: any): void => {
    // Initialize header
    if (!parsed.header) {
        parsed.header = INITIAL_DATA.header;
    }

    // Initialize xpLogs
    if (!parsed.xpLogs) {
        parsed.xpLogs = [];
    }

    // Migrate xpLogs entries
    if (parsed.xpLogs && parsed.xpLogs.length > 0) {
        parsed.xpLogs = parsed.xpLogs.map((log: any) => {
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
    if (!parsed.appLogs) {
        parsed.appLogs = [];
    } else if (Array.isArray(parsed.appLogs) && parsed.appLogs.length > 50) {
        // Purge old logs if the array has grown too large
        parsed.appLogs = parsed.appLogs.slice(0, 50);
    }

    // Initialize creationConfig
    if (!parsed.creationConfig) {
        parsed.creationConfig = INITIAL_DATA.creationConfig;
    }
    if (typeof parsed.creationConfig.attributeMin === 'undefined') {
        parsed.creationConfig.attributeMin = INITIAL_DATA.creationConfig.attributeMin;
    }
    if (typeof parsed.creationConfig.attributeMax === 'undefined') {
        parsed.creationConfig.attributeMax = INITIAL_DATA.creationConfig.attributeMax;
    }
    if (typeof parsed.creationConfig.attributeCost === 'undefined') {
        parsed.creationConfig.attributeCost = INITIAL_DATA.creationConfig.attributeCost;
    }
    if (!parsed.creationConfig.cardConfig) {
        parsed.creationConfig.cardConfig = INITIAL_DATA.creationConfig.cardConfig;
    }

    // Initialize theme
    if (!parsed.theme) {
        parsed.theme = INITIAL_DATA.theme;
    }

    // Initialize campaign notes
    if (!parsed.campaignNotes) {
        parsed.campaignNotes = [];
    }

    // Migrate campaign notes images
    if (parsed.campaignNotes) {
        parsed.campaignNotes = parsed.campaignNotes.map((note: any) => {
            if (note.imageId && (!note.images || note.images.length === 0)) {
                note.images = [{
                    id: Math.random().toString(36).substr(2, 9),
                    imageId: note.imageId,
                    config: note.imageConfig || { width: 200, height: 200, marginTop: 0, align: 'right' }
                }];
                delete note.imageId;
                delete note.imageConfig;
            }
            if (!note.images) note.images = [];
            return note;
        });
    }

    // Initialize party notes
    if (!parsed.partyNotes) {
        parsed.partyNotes = INITIAL_DATA.partyNotes;
    }
    if (parsed.partyNotes && !parsed.partyNotes.staticColWidths) {
        parsed.partyNotes.staticColWidths = INITIAL_DATA.partyNotes?.staticColWidths;
    }
};
