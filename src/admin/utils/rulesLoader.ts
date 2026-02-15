import { RulesData } from '../../types/rules';
import { INITIAL_DATA } from '../../data/initialState';
import { logger } from '../../utils/logger';
import { DotEntry, AttributeEntry } from '../../types';

declare global {
    interface Window {
        EXTERNAL_RULES?: RulesData;
    }
}

/**
 * Generates a default RulesData object based on the Application's hardcoded Initial State.
 * This serves as a fallback when no external rules.js is loaded (e.g. first deployment).
 */
export const generateDefaultRules = (): RulesData => {
    const data = INITIAL_DATA;

    // Helper to extract names
    const extractNames = (list: (DotEntry | AttributeEntry)[] | undefined): string[] => {
        if (!Array.isArray(list)) return [];
        return list.map(item => item.name || "");
    };

    // Construct Definitions
    const skillDefs: Record<string, string[]> = {};
    if (data.skills) {
        Object.keys(data.skills).forEach(key => {
            skillDefs[key] = extractNames(data.skills[key]);
        });
    }

    const attrDefs: Record<string, string[]> = {};
    if (data.attributes) {
        Object.keys(data.attributes).forEach(key => {
            attrDefs[key] = extractNames(data.attributes[key]);
        });
    }

    const secAttrDefs: Record<string, string[]> = {};
    if (data.secondaryAttributes) {
        Object.keys(data.secondaryAttributes).forEach(key => {
            secAttrDefs[key] = extractNames(data.secondaryAttributes[key]);
        });
    }

    const counterDefs: Record<string, any> = {};
    if (data.counters) {
        Object.keys(data.counters).forEach(key => {
            if (key === 'custom') return;
            const c = (data.counters as Record<string, any>)[key];
            if (c && !Array.isArray(c)) {
                counterDefs[key] = {
                    id: key,
                    name: c.name,
                    max: c.max, // Initial State max
                    xpCost: 5 // Default assumption
                };
            }
        });
    }

    const backgroundDefs = data.skills.arrieres_plans
        ? extractNames(data.skills.arrieres_plans).filter(n => n.trim() !== "")
        : [];

    return {
        settingId: "standard-rules",
        settingName: "Règles Standard",
        version: "2.12.55",
        configurations: {
            creation: data.creationConfig,

            xpCosts: {
                attributeFactor: 6,
                skillFactor: 1,
                specializationFactor: 0,
                traitCost: 5
            },
            cards: {
                ...data.creationConfig.cardConfig,
                ranks: ['Valet', 'Dame', 'Roi'],
                counts: ['Un', 'Deux', 'Trois', 'Quatre'],
                maxLabel: 'Quatre Rois (Max)'
            },
            global: {
                maxAttributeScore: 5,
                maxSkillScore: 5,
                secondaryAttributes: data.secondaryAttributesActive
            }
        },
        definitions: {
            attributes: attrDefs,
            secondaryAttributes: secAttrDefs,
            skills: skillDefs,
            skillCategories: [
                { id: 'Col_Comp_1', label: 'Talents', behavior: 'Compétence', allowSpecializations: true, costConfig: { factor: 1, type: 'triangular' } },
                { id: 'Col_Comp_2', label: 'Compétences', behavior: 'Compétence', allowSpecializations: true, costConfig: { factor: 1, type: 'triangular' } },
                { id: 'Col_Comp_3', label: 'Compétences (Suite)', behavior: 'Compétence', allowSpecializations: true, costConfig: { factor: 1, type: 'triangular' } },
                { id: 'Col_Comp_4', label: 'Connaissances', behavior: 'Compétence', allowSpecializations: true, costConfig: { factor: 1, type: 'triangular' } },
                { id: 'Col_Comp_5', label: 'Autres Compétences', behavior: 'Compétence', allowSpecializations: true, costConfig: { factor: 1, type: 'triangular' } },
                { id: 'Col_Comp_6', label: 'Compétences Secondaires', behavior: 'Secondaire', allowSpecializations: false, costConfig: { factor: 0.5, type: 'triangular' } },
                { id: 'Col_Comp_7', label: 'Autres', behavior: 'Secondaire', allowSpecializations: false, costConfig: { factor: 0.5, type: 'triangular' } },
                { id: 'Col_Comp_8', label: 'Arrières Plans', behavior: 'Arrière-plan', allowSpecializations: false, costConfig: { factor: 1, type: 'linear' } },
                { id: 'Col_Comp_9', label: 'Compteurs', behavior: 'Compteur', allowSpecializations: false, costConfig: { factor: 1, type: 'linear' } }
            ],
            backgrounds: backgroundDefs,
            counters: counterDefs,
            labels: {
                // Default Labels mapped to IDs
                talents: "Talents",
                competences: "Compétences",
                competences_col_2: "Compétences (Suite)",
                connaissances: "Connaissances",
                competences2: "Compétences Secondaires",
                autres_competences: "Autres Compétences",
                autres: "Autres"
            }
        },
        libraries: {
            traits: data.library || [],
            skills: data.skillLibrary || [],
            specializations: data.specializationLibrary || [],
            backgrounds: [],
            counters: []
        }
    };
};

export const loadRules = (): RulesData => {
    if (window.EXTERNAL_RULES) {
        return window.EXTERNAL_RULES;
    }

    logger.warn("rules.js not found. Loading fallback rules from Initial State.");
    return generateDefaultRules();
};
