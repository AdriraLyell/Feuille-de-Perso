
import { CharacterSheetData, DotEntry, AttributeEntry } from '../../types';
import { RulesData } from '../../types/rules';

/**
 * Tries to detect if the JSON is a Full Backup or a Direct Sheet Export
 * and returns the CharacterSheetData if found.
 */
const normalizeInput = (json: any): CharacterSheetData | null => {
    // 1. Direct CharacterSheetData
    if (json.header && json.attributes && json.skills) {
        return json as CharacterSheetData;
    }

    // 2. Full Backup Wrapper (legacy or specific export)
    // Sometimes exports are wrapped in { data: ... } or similar depending on version
    if (json.data && json.data.header && json.data.attributes) {
        return json.data as CharacterSheetData;
    }

    // 3. "System" or "Template" export from ExportPanel
    // They are essentially CharacterSheetData but might be missing some runtime fields
    // Checks for essential config fields
    if (json.creationConfig && json.skills) {
        return json as CharacterSheetData;
    }

    return null;
};

/**
 * Extracts configuration and definitions from a Character Sheet
 * to update the Admin Rules.
 */
export const extractRulesFromCharacter = (
    inputJson: any,
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
        newRules.libraries = { traits: [], skills: [], specializations: [] };
    }

    // 1. Import Creation Config
    if (sheet.creationConfig) {
        newRules.configurations.creation = {
            ...newRules.configurations.creation,
            ...sheet.creationConfig,
            // Deep merge rank slots if present
            rankSlots: sheet.creationConfig.rankSlots || newRules.configurations.creation.rankSlots
        };
        success.push("Configuration de Création (Points, Mode)");
    } else {
        warnings.push("Configuration de Création manquante (ignoré).");
    }

    // 2. Import XP Costs
    if (sheet.xpCosts) {
        newRules.configurations.xpCosts = {
            ...newRules.configurations.xpCosts,
            ...sheet.xpCosts
        };
        success.push("Configuration des Coûts XP (Facteurs)");
    } else {
        // Fallback: If not present in sheet (old version), keep current rules
        warnings.push("Coûts XP manquants dans le fichier (ignoré).");
    }

    // 3. Import Theme
    if (sheet.theme) {
        newRules.theme = {
            ...newRules.theme,
            ...sheet.theme
        };
        success.push("Thème Visuel (Couleurs)");
    }

    // 4. Import Attributes Definitions
    if (sheet.attributes) {
        const newAttrs: Record<string, string[]> = {};
        Object.keys(sheet.attributes).forEach(cat => {
            const list = sheet.attributes[cat];
            if (Array.isArray(list)) {
                newAttrs[cat] = list.map((a: AttributeEntry) => a.name);
            }
        });

        // Also Secondary Attributes if active
        if (sheet.secondaryAttributesActive && sheet.secondaryAttributes) {
            const newSecAttrs: Record<string, string[]> = {};
            Object.keys(sheet.secondaryAttributes).forEach(cat => {
                const list = sheet.secondaryAttributes[cat];
                if (Array.isArray(list)) {
                    newSecAttrs[cat] = list.map((a: AttributeEntry) => a.name);
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
            // @ts-ignore
            const list = sheet.skills[cat];
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
    if (sheet.skills && sheet.skills.arrieres_plans) {
        // @ts-ignore
        const bgList = sheet.skills.arrieres_plans
            .filter((s: DotEntry) => s.name && s.name.trim() !== "")
            .map((s: DotEntry) => s.name);

        newRules.definitions.backgrounds = bgList;
        success.push(`Définitions Arrière-Plans (${bgList.length} items)`);
    }

    // 7. Import Counters (Best Effort)
    if (sheet.counters) {
        const rulesCounters: Record<string, any> = {};
        Object.keys(sheet.counters).forEach(key => {
            if (key === 'custom') return;
            // @ts-ignore
            const c = sheet.counters[key];
            if (c && !Array.isArray(c)) {
                rulesCounters[key] = {
                    id: key,
                    name: c.name || key,
                    max: c.value || 10, // On sheet, value is the Max dots
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
    if (sheet.creationConfig && sheet.creationConfig.backgroundCost !== undefined) {
        newRules.configurations.creation.backgroundCost = sheet.creationConfig.backgroundCost;
    }


    // 8. Import Libraries (Traits & Skills)
    // We treat the sheet's library/skillLibrary as candidates
    if (sheet.library && Array.isArray(sheet.library)) {
        newRules.libraries.traits = sheet.library;
        success.push(`Bibliothèque de Traits (${sheet.library.length} items)`);
    }

    if (sheet.skillLibrary && Array.isArray(sheet.skillLibrary)) {
        newRules.libraries.skills = sheet.skillLibrary;
        success.push(`Réserve de Compétences (${sheet.skillLibrary.length} items)`);
    }

    if (sheet.specializationLibrary && Array.isArray(sheet.specializationLibrary)) {
        newRules.libraries.specializations = sheet.specializationLibrary;
        success.push(`Bibliothèque de Spécialisations (${sheet.specializationLibrary.length} items)`);
    }

    return { rules: newRules, report: { success, warnings } };
};
