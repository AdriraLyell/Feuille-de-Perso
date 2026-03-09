import { DotEntry, LibrarySkillEntry, LibraryFormulaEntry, LibraryEntry, LibrarySpecializationEntry, LibraryBackgroundEntry, LibraryCounterEntry } from '../../types';
import { RulesData, RulesCreationConfig, RulesXPCosts } from '../../types/rules';
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

interface ExtractOptions {
    skipDefinitions?: boolean; // If true, only extract libraries and config, not structural layout
}

/**
 * Extracts configuration and definitions from a Character Sheet
 * to update the Admin Rules.
 */
export const extractRulesFromCharacter = (
    inputJson: unknown,
    currentRules: RulesData,
    options: ExtractOptions = {}
): { rules: RulesData; report: { success: string[]; warnings: string[] } } => {
    const sheet = normalizeInput(inputJson);
    const warnings: string[] = [];
    const success: string[] = [];
    const skipDefinitions = options.skipDefinitions || false;

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
            rankSlots: (sheetCreationConfig.rankSlots as Record<number, number>) || newRules.configurations.creation.rankSlots
        } as unknown as RulesCreationConfig;
        success.push("Configuration de Création (Points, Mode)");
    } else {
        warnings.push("Configuration de Création manquante (ignoré).");
    }

    // 2. Import XP Costs
    if (sheet.xpCosts) {
        newRules.configurations.xpCosts = {
            ...newRules.configurations.xpCosts,
            ...(sheet.xpCosts as RulesXPCosts)
        };
        success.push("Configuration des Coûts XP (Multiplicateurs)");
    } else {
        // Fallback: If not present in sheet (old version), keep current rules
        warnings.push("Coûts XP (Multiplicateurs) manquants dans le fichier (ignoré).");
    }


    // 4. Import Attributes Definitions
    if (sheet.attributes && !skipDefinitions) {
        const newAttributes = Object.fromEntries(
            Object.entries(sheet.attributes).map(([cat, attrs]) => [
                cat,
                (attrs as import('../../types').AttributeEntry[]).map((a: import('../../types').AttributeEntry) => a.name)
            ])
        );
        newRules.definitions.attributes = {
            ...newRules.definitions.attributes,
            ...newAttributes
        };

        // Also Secondary Attributes if active
        if (sheet.secondaryAttributesActive && sheet.secondaryAttributes) {
            const newSecondary = Object.fromEntries(
                Object.entries(sheet.secondaryAttributes).map(([cat, attrs]) => [
                    cat,
                    (attrs as import('../../types').AttributeEntry[]).map((a: import('../../types').AttributeEntry) => a.name)
                ])
            );
            newRules.definitions.secondaryAttributes = {
                ...newRules.definitions.secondaryAttributes,
                ...newSecondary
            };
            // Sync with Global Config Flag
            newRules.configurations.global.secondaryAttributes = true;
            success.push("Définitions des Attributs (Primaires et Secondaires)");
        } else {
            // Ensure flag is false if not active
            newRules.configurations.global.secondaryAttributes = false;
            success.push("Définitions des Attributs (Primaires)");
        }
    }

    // 5. Import Skills Definitions
    if (sheet.skills && !skipDefinitions) {
        const extractedSkills: Record<string, string[]> = {};
        Object.keys(sheet.skills).forEach(cat => {
            const list = (sheet.skills as Record<string, DotEntry[]>)[cat];
            if (Array.isArray(list)) {
                extractedSkills[cat] = list
                    .map((s: DotEntry) => s.name ? s.name : "") // Keep name or empty string for spacer
                    .filter((name: string) => name !== undefined && name !== null); // Only filter real nulls
            }
        });
        
        // MERGE instead of replace the whole record
        newRules.definitions.skills = {
            ...newRules.definitions.skills,
            ...extractedSkills
        };
        success.push(`Définitions des Compétences (${Object.keys(extractedSkills).length} catégories mises à jour)`);
    }

    // 6. Import Backgrounds (Arrières-Plans)
    if (sheet.skills && (sheet.skills as Record<string, DotEntry[]>).arrieres_plans && !skipDefinitions) {
        const bgList = (sheet.skills as Record<string, DotEntry[]>).arrieres_plans
            .filter((s: DotEntry) => s.name && s.name.trim() !== "")
            .map((s: DotEntry) => s.name);

        newRules.definitions.backgrounds = bgList;
        success.push(`Définitions Arrière-Plans (${bgList.length} items)`);
    }

    // 7. Import Counters (Best Effort)
    if (sheet.counters && !skipDefinitions) {
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

        // MERGE instead of replace
        newRules.definitions.counters = {
            ...newRules.definitions.counters,
            ...rulesCounters
        };
        success.push(`Définitions Compteurs (${Object.keys(rulesCounters).length} items detected)`);
    }

    // Import Background Cost config
    if (sheet.creationConfig && (sheet.creationConfig as Record<string, unknown>).backgroundCost !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        success.push(`Bibliothèque de Spécialités (${sheet.specializationLibrary.length} items)`);
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

    // 9. Extract Suggestions into Candidate Libraries
    if (sheet.suggestions && Array.isArray(sheet.suggestions)) {
        const suggestions = sheet.suggestions as import('../../types').SuggestionEntry[];
        
        const extractedSkills: import('../../types').LibrarySkillEntry[] = [];
        const extractedBackgrounds: import('../../types').LibrarySkillEntry[] = [];
        const extractedSpecs: import('../../types').LibrarySpecializationEntry[] = [];
        const extractedTraits: import('../../types').LibraryEntry[] = [];

        suggestions.forEach(s => {
            if (s.type === 'skill') {
                extractedSkills.push({
                    id: s.id,
                    name: s.name,
                    defaultCategory: s.category,
                    description: s.description || null,
                    isActive: true
                });
            } else if (s.type === 'background') {
                extractedBackgrounds.push({
                    id: s.id,
                    name: s.name,
                    defaultCategory: s.category,
                    description: s.description || null,
                    isActive: true
                });
            } else if (s.type === 'specialization') {
                extractedSpecs.push({
                    id: s.id,
                    name: s.name,
                    skillIds: s.parentId ? [s.parentId] : [],
                    defaultMinLevel: 0,
                    description: s.description,
                    isActive: true
                });
            } else if (s.type === 'trait') {
                extractedTraits.push({
                    id: s.id,
                    name: s.name,
                    type: (s.category?.toLowerCase().includes('désavantage') || s.category?.toLowerCase().includes('défaut')) ? 'desavantage' : 'avantage',
                    description: s.description || null,
                    tags: s.tags || null,
                    effects: s.effects || null,
                    pointsLabel: s.pointsLabel,
                    cost: s.cost ? String(s.cost) : undefined,
                    isActive: true
                });
            }
        });

        if (extractedSkills.length > 0) {
            newRules.libraries.skills = [...(newRules.libraries.skills || []), ...extractedSkills];
            success.push(`Extraction de ${extractedSkills.length} Compétence(s) suggérée(s)`);
        }
        if (extractedBackgrounds.length > 0) {
            newRules.libraries.backgrounds = [...(newRules.libraries.backgrounds || []), ...extractedBackgrounds];
            success.push(`Extraction de ${extractedBackgrounds.length} Historique(s) suggéré(s)`);
        }
        if (extractedSpecs.length > 0) {
            newRules.libraries.specializations = [...(newRules.libraries.specializations || []), ...extractedSpecs];
            success.push(`Extraction de ${extractedSpecs.length} Spécialité(s) suggérée(s)`);
        }
        if (extractedTraits.length > 0) {
            newRules.libraries.traits = [...(newRules.libraries.traits || []), ...extractedTraits];
            success.push(`Extraction de ${extractedTraits.length} Trait(s) suggéré(s)`);
        }
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
        success.push(`Bibliothèque de Spécialités (${sheet.specializationLibrary.length} items)`);
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
