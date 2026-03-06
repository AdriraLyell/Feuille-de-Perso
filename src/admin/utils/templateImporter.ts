import { DotEntry, LibrarySkillEntry, LibraryFormulaEntry, LibraryEntry, LibrarySpecializationEntry, LibraryBackgroundEntry, LibraryCounterEntry } from '../../types';
import { RulesData } from '../../types/rules';
import { generateDefaultRules } from './rulesLoader';

/**
 * Tries to detect if the JSON is a Full Backup or a Direct Sheet Export
 * and returns the CharacterSheetData if found.
 */
const normalizeInput = (json: unknown): Record<string, unknown> | null => {
    if (!json || typeof json !== 'object' || json === null) return null;
    const data = json as Record<string, unknown>;

    // 1. Direct CharacterSheetData
    if (data.header && data.attributes && data.skills) {
        return data;
    }

    // 2. Full Backup Wrapper (legacy or specific export)
    if (data.data && typeof data.data === 'object' && (data.data as Record<string, unknown>).header && (data.data as Record<string, unknown>).attributes) {
        return data.data as Record<string, unknown>;
    }

    if (data.creationConfig && data.skills) {
        return data;
    }

    // 4. Specialized Library Export (e.g. skills_campaign.json)
    if (data.meta && typeof data.meta === 'object' && data.data && Array.isArray(data.data) && (data.meta as Record<string, unknown>).type === 'skills') {
        // Wrap for normalization
        return {
            header: { character_name: 'Library' },
            attributes: {},
            skills: {},
            skillLibrary: data.data
        };
    }

    // 5. Direct Library Export (e.g. { libraries: { traits: [] } })
    if (data.libraries && typeof data.libraries === 'object') {
        const libs = data.libraries as Record<string, unknown>;
        return {
            header: { character_name: 'Library' },
            attributes: {},
            skills: {},
            library: libs.traits || [],
            skillLibrary: libs.skills || libs.skillLibrary || [],
            specializationLibrary: libs.specializations || [],
            backgroundLibrary: libs.backgrounds || libs.backgroundLibrary || [],
            counterLibrary: libs.counters || libs.counterLibrary || [],
            mysticAbilities: libs.mysticAbilities || [],
            formulaLibrary: libs.formulas || []
        };
    }

    return null;
};

/**
 * Extracts configuration and definitions from a Character Sheet
 * to update the Admin Rules.
 */
export const extractRulesFromCharacter = (
    inputJson: unknown,
    currentRules: RulesData
): { rules: RulesData; report: { success: string[]; warnings: string[] } } => {
    const sheet = normalizeInput(inputJson);
    const warnings: string[] = [];
    const success: string[] = [];

    if (!sheet) {
        throw new Error("Format de fichier non reconnu. Veuillez importer un JSON de Personnage ou de Template (Système).");
    }

    const newRules: RulesData = JSON.parse(JSON.stringify(currentRules));

    // Ensure libraries structure exists
    if (!newRules.libraries) {
        newRules.libraries = {
            traits: [],
            skills: [],
            specializations: [],
            backgrounds: [],
            counters: [],
            mysticAbilities: []
        };
    }

    // 1. Import Creation Config
    if (sheet.creationConfig) {
        const sheetCreationConfig = sheet.creationConfig as Record<string, unknown>;
        newRules.configurations.creation = {
            ...newRules.configurations.creation,
            ...sheetCreationConfig,
            // Deep merge rank slots if present
            rankSlots: (sheetCreationConfig.rankSlots as any) || newRules.configurations.creation.rankSlots
        } as any;
        success.push("Configuration de Création (Points, Mode)");
    } else {
        warnings.push("Configuration de Création manquante (ignoré).");
    }

    // 2. Import XP Costs
    if (sheet.xpCosts) {
        newRules.configurations.xpCosts = {
            ...newRules.configurations.xpCosts,
            ...(sheet.xpCosts as any)
        };
        success.push("Configuration des Coûts XP (Multiplicateurs)");
    } else {
        // Fallback: If not present in sheet (old version), keep current rules
        warnings.push("Coûts XP (Multiplicateurs) manquants dans le fichier (ignoré).");
    }


    // 4. Import Attributes Definitions
    if (sheet.attributes) {
        const newAttrs: Record<string, string[]> = {};
        const sheetAttributes = sheet.attributes as Record<string, unknown[]>;
        Object.keys(sheetAttributes).forEach(cat => {
            const list = sheetAttributes[cat];
            if (Array.isArray(list)) {
                newAttrs[cat] = list.map((a: any) => String(a.name || a));
            }
        });

        // Also Secondary Attributes if active
        if (sheet.secondaryAttributesActive && sheet.secondaryAttributes) {
            const newSecAttrs: Record<string, string[]> = {};
            const sheetSecondaryAttributes = sheet.secondaryAttributes as Record<string, unknown[]>;
            Object.keys(sheetSecondaryAttributes).forEach(cat => {
                const list = sheetSecondaryAttributes[cat];
                if (Array.isArray(list)) {
                    newSecAttrs[cat] = list.map((a: any) => String(a.name || a));
                }
            });
            newRules.definitions.secondaryAttributes = newSecAttrs;

            // Sync with Global Config Flag
            newRules.configurations.global.secondaryAttributes = true;

            success.push("Définitions des Attributs (Primaires et Secondaires)");
        } else {
            // Ensure flag is false if not active
            newRules.configurations.global.secondaryAttributes = false;
            success.push("Définitions des Attributs (Primaires)");
        }

        newRules.definitions.attributes = newAttrs;
    }

    // 5. Import Skills Definitions
    if (sheet.skills) {
        const newSkills: Record<string, string[]> = {};
        Object.keys(sheet.skills).forEach(cat => {
            const list = (sheet.skills as Record<string, DotEntry[]>)[cat];
            if (Array.isArray(list)) {
                newSkills[cat] = list
                    .map((s: DotEntry) => s.name ? s.name : "") // Keep name or empty string for spacer
                    .filter((name: string) => name !== undefined && name !== null); // Only filter real nulls
            }
        });
        newRules.definitions.skills = newSkills;
        success.push(`Définitions des Compétences (${Object.keys(newSkills).length} catégories)`);
    }

    // 6. Import Backgrounds (Arrières-Plans)
    if (sheet.skills && (sheet.skills as Record<string, DotEntry[]>).arrieres_plans) {
        const bgList = (sheet.skills as Record<string, DotEntry[]>).arrieres_plans
            .filter((s: DotEntry) => s.name && s.name.trim() !== "")
            .map((s: DotEntry) => s.name);

        newRules.definitions.backgrounds = bgList;
        success.push(`Définitions Arrière-Plans (${bgList.length} items)`);
    }

    // 7. Import Counters (Best Effort)
    if (sheet.counters) {
        const rulesCounters: Record<string, import('../../types/rules').RulesCounterDefinition> = {};
        const countersMap = sheet.counters as Record<string, unknown>;
        Object.keys(countersMap).forEach(key => {
            if (key === 'custom') return;
            const c = countersMap[key] as Record<string, unknown>;
            if (c && !Array.isArray(c)) {
                rulesCounters[key] = {
                    id: key,
                    name: String(c.name || key),
                    max: Number(c.value || 10), // On sheet, value is the Max dots
                    xpCost: 5 // Default if unknown
                };
            }
        });

        // If we are updating rules, we might want to keep existing config if keys match?
        // But here we are overwriting.
        newRules.definitions.counters = rulesCounters;
        success.push(`Définitions Compteurs (${Object.keys(rulesCounters).length} items detected)`);
    }

    // Import Background Cost config
    if (sheet.creationConfig && (sheet.creationConfig as Record<string, unknown>).backgroundCost !== undefined) {
        newRules.configurations.creation.backgroundCost = (sheet.creationConfig as Record<string, any>).backgroundCost;
    }


    // 8. Import Libraries (Traits & Skills)
    // We treat the sheet's library/skillLibrary as candidates
    if (sheet.library && Array.isArray(sheet.library)) {
        newRules.libraries.traits = sheet.library as LibraryEntry[];
        success.push(`Bibliothèque de Traits (${sheet.library.length} items)`);
    }

    if (sheet.skillLibrary && Array.isArray(sheet.skillLibrary)) {
        newRules.libraries.skills = sheet.skillLibrary as LibrarySkillEntry[];
        success.push(`Réserve de Compétences (${sheet.skillLibrary.length} items)`);
    }

    if (sheet.specializationLibrary && Array.isArray(sheet.specializationLibrary)) {
        newRules.libraries.specializations = sheet.specializationLibrary as LibrarySpecializationEntry[];
        success.push(`Bibliothèque de Spécialisations (${sheet.specializationLibrary.length} items)`);
    }

    if (sheet.backgroundLibrary && Array.isArray(sheet.backgroundLibrary)) {
        newRules.libraries.backgrounds = sheet.backgroundLibrary as LibraryBackgroundEntry[];
        success.push(`Bibliothèque d'Arrière-Plans (${sheet.backgroundLibrary.length} items)`);
    }

    if (sheet.backgroundLibrary && Array.isArray(sheet.backgroundLibrary)) {
        newRules.libraries.backgrounds = sheet.backgroundLibrary as LibraryBackgroundEntry[];
        success.push(`Bibliothèque d'Arrière-Plans (${sheet.backgroundLibrary.length} items)`);
    }

    if (sheet.counterLibrary && Array.isArray(sheet.counterLibrary)) {
        newRules.libraries.counters = sheet.counterLibrary as LibraryCounterEntry[];
        success.push(`Bibliothèque de Compteurs (${sheet.counterLibrary.length} items)`);
    }

    if (sheet.mysticAbilities && Array.isArray(sheet.mysticAbilities)) {
        newRules.libraries.mysticAbilities = sheet.mysticAbilities as LibrarySkillEntry[];
        success.push(`Bibliothèque d'Habilités Mystiques (${sheet.mysticAbilities.length} items)`);
    }

    if (sheet.formulaLibrary && Array.isArray(sheet.formulaLibrary)) {
        newRules.libraries.formulas = sheet.formulaLibrary as LibraryFormulaEntry[];
        success.push(`Bibliothèque de Formules (${sheet.formulaLibrary.length} items)`);
    }

    return { rules: newRules, report: { success, warnings } };
};

/**
 * Normalizes a CharacterSheetData object to a RulesData template.
 */
export const templateFromSheet = (json: unknown): { rules: RulesData, report: { success: string[], warnings: string[] } } | null => {
    const sheet = normalizeInput(json);
    if (!sheet) return null;

    const success: string[] = [];
    const warnings: string[] = [];

    const newRules = generateDefaultRules();

    // 1. Extract Name & Info
    const header = (sheet.header || {}) as Record<string, unknown>;
    newRules.settingName = String(header.character_name || header.name || 'Template Importé');

    // 2. Extract Libraries if present
    if (sheet.library && Array.isArray(sheet.library)) {
        newRules.libraries.traits = sheet.library as LibraryEntry[];
        success.push(`Bibliothèque de Traits (${sheet.library.length} items)`);
    }

    if (sheet.skillLibrary && Array.isArray(sheet.skillLibrary)) {
        newRules.libraries.skills = sheet.skillLibrary as LibrarySkillEntry[];
        success.push(`Bibliothèque de Compétences (${sheet.skillLibrary.length} items)`);
    }

    if (sheet.specializationLibrary && Array.isArray(sheet.specializationLibrary)) {
        newRules.libraries.specializations = sheet.specializationLibrary as LibrarySpecializationEntry[];
        success.push(`Bibliothèque de Spécialisations (${sheet.specializationLibrary.length} items)`);
    }

    if (sheet.backgroundLibrary && Array.isArray(sheet.backgroundLibrary)) {
        newRules.libraries.backgrounds = sheet.backgroundLibrary as LibraryBackgroundEntry[];
        success.push(`Bibliothèque d'Arrière-plans (${sheet.backgroundLibrary.length} items)`);
    }

    if (sheet.counterLibrary && Array.isArray(sheet.counterLibrary)) {
        newRules.libraries.counters = sheet.counterLibrary as LibraryCounterEntry[];
        success.push(`Bibliothèque de Compteurs (${sheet.counterLibrary.length} items)`);
    }

    if (sheet.mysticAbilities && Array.isArray(sheet.mysticAbilities)) {
        newRules.libraries.mysticAbilities = sheet.mysticAbilities as LibrarySkillEntry[];
        success.push(`Bibliothèque Mystique (${sheet.mysticAbilities.length} items)`);
    }

    if (sheet.formulaLibrary && Array.isArray(sheet.formulaLibrary)) {
        newRules.libraries.formulas = sheet.formulaLibrary as LibraryFormulaEntry[];
        success.push(`Bibliothèque de Formules (${sheet.formulaLibrary.length} items)`);
    }

    return { rules: newRules, report: { success, warnings } };
};
