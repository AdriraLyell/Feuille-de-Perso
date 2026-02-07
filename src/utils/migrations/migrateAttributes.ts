import { INITIAL_DATA } from '../../data/initialState';

/**
 * Map of legacy attribute IDs to generic IDs
 */
export const ATTRIBUTE_ID_MAP: Record<string, string> = {
    'physique': 'pave_attributs_1',
    'mental': 'pave_attributs_2',
    'social': 'pave_attributs_3',
    'mystique': 'pave_attributs_4',
    'spirituel': 'pave_attributs_5',
    'martial': 'pave_attributs_6'
};

/**
 * Convert legacy attribute ID to generic ID
 */
export const migrateAttributeId = (oldId: string): string => {
    if (ATTRIBUTE_ID_MAP[oldId]) return ATTRIBUTE_ID_MAP[oldId];
    if (oldId.startsWith('cat_')) {
        const num = parseInt(oldId.split('_')[1]);
        if (!isNaN(num)) return `pave_attributs_${num}`;
    }
    return oldId;
};

/**
 * Migration: Attributes
 * - Convert numeric values to strings
 * - Initialize missing categories from INITIAL_DATA
 * - Rename legacy IDs to generic IDs (pave_attributs_x)
 * - Handle secondary attributes
 */
export const migrateAttributes = (parsed: any): void => {
    // Initialize attributes if missing
    if (!parsed.attributes) {
        parsed.attributes = {};
    }

    // Inject missing categories from INITIAL_DATA
    Object.keys(INITIAL_DATA.attributes).forEach(key => {
        if (!parsed.attributes[key]) {
            parsed.attributes[key] = INITIAL_DATA.attributes[key];
        }
    });

    // Check for type conversions
    const categories = ['physique', 'mental', 'social'];
    let needsConversion = false;
    let needsTypeConversion = false;

    categories.forEach(cat => {
        if (parsed.attributes[cat] && parsed.attributes[cat].length > 0) {
            if (typeof parsed.attributes[cat][0].val1 === 'undefined') {
                needsConversion = true;
            }
            if (typeof parsed.attributes[cat][0].val1 === 'number') {
                needsTypeConversion = true;
            }
        }
    });

    // Convert very old structure (no val1)
    if (needsConversion) {
        const convertAttributes = (list: any[]) => {
            return list.map(item => ({
                id: item.id || Math.random().toString(36).substr(2, 9),
                name: item.name,
                val1: "",
                val2: "",
                val3: "",
                creationVal1: 0,
                creationVal2: 0,
                creationVal3: 0,
            }));
        };
        parsed.attributes = {
            physique: convertAttributes(parsed.attributes.physique || []),
            mental: convertAttributes(parsed.attributes.mental || []),
            social: convertAttributes(parsed.attributes.social || []),
        };
    }
    // Convert numeric values to strings
    else if (needsTypeConversion) {
        const convertType = (list: any[]) => {
            return list.map(item => ({
                ...item,
                val1: item.val1 === 0 ? "" : item.val1.toString(),
                val2: item.val2 === 0 ? "" : item.val2.toString(),
                val3: item.val3 === 0 ? "" : item.val3.toString(),
            }));
        };
        Object.keys(parsed.attributes).forEach(key => {
            if (Array.isArray(parsed.attributes[key])) {
                parsed.attributes[key] = convertType(parsed.attributes[key]);
            }
        });
        if (parsed.secondaryAttributes) {
            Object.keys(parsed.secondaryAttributes).forEach(key => {
                if (Array.isArray(parsed.secondaryAttributes[key])) {
                    parsed.secondaryAttributes[key] = convertType(parsed.secondaryAttributes[key]);
                }
            });
        }
    }

    // Initialize attribute settings
    if (!parsed.attributeSettings) {
        parsed.attributeSettings = INITIAL_DATA.attributeSettings;
    }

    // Ensure default categories exist
    if (!parsed.attributes.physique) parsed.attributes.physique = INITIAL_DATA.attributes.physique;
    if (!parsed.attributes.mental) parsed.attributes.mental = INITIAL_DATA.attributes.mental;
    if (!parsed.attributes.social) parsed.attributes.social = INITIAL_DATA.attributes.social;

    // Initialize secondary attributes
    if (typeof parsed.secondaryAttributesActive === 'undefined') {
        parsed.secondaryAttributesActive = false;
    }
    if (!parsed.secondaryAttributes) {
        parsed.secondaryAttributes = JSON.parse(JSON.stringify(INITIAL_DATA.secondaryAttributes));
    }
    if (parsed.attributeSettings) {
        parsed.attributeSettings.forEach((cat: any) => {
            if (!parsed.secondaryAttributes[cat.id]) {
                parsed.secondaryAttributes[cat.id] = [
                    { id: Math.random().toString(36).substr(2, 9), name: 'Secondaire 1', val1: "", val2: "", val3: "" },
                    { id: Math.random().toString(36).substr(2, 9), name: 'Secondaire 2', val1: "", val2: "", val3: "" }
                ];
            }
        });
    }

    // Rename to generic IDs (pave_attributs_x)
    const newAttributes: any = {};
    Object.keys(parsed.attributes).forEach(oldId => {
        const val = parsed.attributes[oldId];
        if (typeof val !== 'undefined') {
            newAttributes[migrateAttributeId(oldId)] = val;
        }
    });
    parsed.attributes = newAttributes;

    // Migrate secondary attributes IDs
    if (parsed.secondaryAttributes) {
        const newSec: any = {};
        Object.keys(parsed.secondaryAttributes).forEach(oldId => {
            newSec[migrateAttributeId(oldId)] = parsed.secondaryAttributes[oldId];
        });
        parsed.secondaryAttributes = newSec;
    }

    // Migrate attribute settings IDs
    if (parsed.attributeSettings) {
        parsed.attributeSettings = parsed.attributeSettings.map((s: any) => ({
            ...s,
            id: migrateAttributeId(s.id)
        }));
    }
};
