import { INITIAL_DATA } from '../../data/initialState';
import { MigratableData } from './registry';

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
        const parts = oldId.split('_');
        if (parts.length >= 2) {
            const num = parseInt(parts[1]);
            if (!isNaN(num)) return `pave_attributs_${num}`;
        }
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
export const migrateAttributes = (parsed: MigratableData): void => {
    // 1. Initialize attributes if missing
    if (!parsed.attributes) {
        parsed.attributes = {};
    }

    const rawAttributes = parsed.attributes as Record<string, unknown>;

    // 2. Rename legacy IDs to generic IDs (pave_attributs_x) FIRST
    const renamedAttributes: Record<string, unknown> = {};
    Object.keys(rawAttributes).forEach(oldId => {
        const val = rawAttributes[oldId];
        if (typeof val !== 'undefined') {
            const newId = migrateAttributeId(oldId);
            if (!renamedAttributes[newId] || ATTRIBUTE_ID_MAP[oldId]) {
                renamedAttributes[newId] = val;
            }
        }
    });

    // 3. Inject missing categories from INITIAL_DATA
    Object.keys(INITIAL_DATA.attributes).forEach(key => {
        if (!renamedAttributes[key]) {
            renamedAttributes[key] = INITIAL_DATA.attributes[key];
        }
    });
    parsed.attributes = renamedAttributes;

    // 4. Type conversion (numeric -> string) and structure fix
    const convertType = (list: unknown) => {
        if (!Array.isArray(list)) return list;
        return list.map(itemRaw => {
            const item = itemRaw as { 
                id?: string; 
                name?: string; 
                val1?: string | number; 
                val2?: string | number; 
                val3?: string | number;
            };
            if (!item) return item;
            if (typeof item.val1 === 'undefined') {
                return {
                    id: item.id || Math.random().toString(36).substring(2, 11),
                    name: item.name || '',
                    val1: "0",
                    val2: "",
                    val3: "",
                    creationVal1: 0,
                    creationVal2: 0,
                    creationVal3: 0,
                };
            }
            return {
                ...item,
                val1: typeof item.val1 === 'number' ? item.val1.toString() : (item.val1 || "0"),
                val2: typeof item.val2 === 'number' ? item.val2.toString() : (item.val2 || ""),
                val3: typeof item.val3 === 'number' ? item.val3.toString() : (item.val3 || ""),
            };
        });
    };

    Object.keys(renamedAttributes).forEach(key => {
        renamedAttributes[key] = convertType(renamedAttributes[key]);
    });

    // 5. Secondary attributes handling
    if (typeof parsed.secondaryAttributesActive === 'undefined') {
        parsed.secondaryAttributesActive = false;
    }
    if (!parsed.secondaryAttributes) {
        parsed.secondaryAttributes = JSON.parse(JSON.stringify(INITIAL_DATA.secondaryAttributes));
    }

    const rawSecondary = parsed.secondaryAttributes as Record<string, unknown>;
    const renamedSec: Record<string, unknown> = {};
    Object.keys(rawSecondary).forEach(oldId => {
        renamedSec[migrateAttributeId(oldId)] = rawSecondary[oldId];
    });

    Object.keys(renamedSec).forEach(key => {
        renamedSec[key] = convertType(renamedSec[key]);
    });
    parsed.secondaryAttributes = renamedSec;

    // 6. Attribute settings
    if (!parsed.attributeSettings) {
        parsed.attributeSettings = INITIAL_DATA.attributeSettings;
    }

    if (Array.isArray(parsed.attributeSettings)) {
        parsed.attributeSettings = parsed.attributeSettings.map(sRaw => {
            const s = sRaw as { id: string };
            return {
                ...s,
                id: migrateAttributeId(s.id)
            };
        });
    }

    // Ensure default categories exist
    const required = ['pave_attributs_1', 'pave_attributs_2', 'pave_attributs_3'];
    required.forEach(req => {
        if (!renamedAttributes[req]) {
            renamedAttributes[req] = INITIAL_DATA.attributes[req];
        }
    });
};

