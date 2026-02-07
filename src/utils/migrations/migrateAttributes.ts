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
    // 1. Initialize attributes if missing
    if (!parsed.attributes) {
        parsed.attributes = {};
    }

    // 2. Rename legacy IDs to generic IDs (pave_attributs_x) FIRST
    // This ensures we keep existing data even if it was under old names
    const renamedAttributes: any = {};
    Object.keys(parsed.attributes).forEach(oldId => {
        const val = parsed.attributes[oldId];
        if (typeof val !== 'undefined') {
            const newId = migrateAttributeId(oldId);
            // Only move if not already present or if we are renaming from a legacy key
            if (!renamedAttributes[newId] || ATTRIBUTE_ID_MAP[oldId]) {
                renamedAttributes[newId] = val;
            }
        }
    });
    parsed.attributes = renamedAttributes;

    // 3. Inject missing categories from INITIAL_DATA (now that keys are unified)
    Object.keys(INITIAL_DATA.attributes).forEach(key => {
        if (!parsed.attributes[key]) {
            parsed.attributes[key] = INITIAL_DATA.attributes[key];
        }
    });

    // 4. Type conversion (numeric -> string) and structure fix
    const convertType = (list: any[]) => {
        if (!Array.isArray(list)) return list;
        return list.map(item => {
            // Very old structure might not have val1
            if (typeof item.val1 === 'undefined') {
                return {
                    id: item.id || Math.random().toString(36).substr(2, 9),
                    name: item.name,
                    val1: "0",
                    val2: "",
                    val3: "",
                    creationVal1: 0,
                    creationVal2: 0,
                    creationVal3: 0,
                };
            }
            // Numeric to string conversion
            return {
                ...item,
                val1: typeof item.val1 === 'number' ? item.val1.toString() : (item.val1 || "0"),
                val2: typeof item.val2 === 'number' ? item.val2.toString() : (item.val2 || ""),
                val3: typeof item.val3 === 'number' ? item.val3.toString() : (item.val3 || ""),
            };
        });
    };

    Object.keys(parsed.attributes).forEach(key => {
        parsed.attributes[key] = convertType(parsed.attributes[key]);
    });

    // 5. Secondary attributes handling
    if (typeof parsed.secondaryAttributesActive === 'undefined') {
        parsed.secondaryAttributesActive = false;
    }
    if (!parsed.secondaryAttributes) {
        parsed.secondaryAttributes = JSON.parse(JSON.stringify(INITIAL_DATA.secondaryAttributes));
    }

    // Rename secondary IDs
    const renamedSec: any = {};
    Object.keys(parsed.secondaryAttributes).forEach(oldId => {
        renamedSec[migrateAttributeId(oldId)] = parsed.secondaryAttributes[oldId];
    });
    parsed.secondaryAttributes = renamedSec;

    // Convert types for secondary
    Object.keys(parsed.secondaryAttributes).forEach(key => {
        parsed.secondaryAttributes[key] = convertType(parsed.secondaryAttributes[key]);
    });

    // 6. Attribute settings
    if (!parsed.attributeSettings) {
        parsed.attributeSettings = INITIAL_DATA.attributeSettings;
    }

    // Migrate attribute settings IDs
    if (parsed.attributeSettings) {
        parsed.attributeSettings = parsed.attributeSettings.map((s: any) => ({
            ...s,
            id: migrateAttributeId(s.id)
        }));
    }

    // Ensure default categories exist if someone deleted them in older versions
    const required = ['pave_attributs_1', 'pave_attributs_2', 'pave_attributs_3'];
    required.forEach(req => {
        if (!parsed.attributes[req]) {
            parsed.attributes[req] = INITIAL_DATA.attributes[req];
        }
    });
};

