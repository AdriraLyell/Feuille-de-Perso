
import { RulesData } from '../types/rules';

export const defaultRules: RulesData = {
    version: "1.0.0",
    lastUpdated: Date.now(),
    configurations: {
        global: {
            maxAttributeScore: 5,
            maxSkillScore: 5,
            secondaryAttributes: false
        },
        creation: {
            mode: "rangs",
            startingXP: 0,
            attributePoints: 15,
            backgroundPoints: 5,
            attributeMin: 1,
            attributeMax: 3,
            attributeCost: 1,
            backgroundCost: 1,
            rankSlots: { "1": 5, "2": 4, "3": 3, "4": 2, "5": 1 }
        },
        xpCosts: {
            attributeFactor: 6,
            skillFactor: 1,
            specializationFactor: 0
        },
        cards: {
            active: false,
            baseStart: 2,
            increment: 0.5,
            bestSkillsCount: 6,
            ranks: ["E", "D", "C", "B", "A", "S"],
            counts: ["1", "2", "3", "4", "5", "6+"],
            maxLabel: "S"
        }
    },
    definitions: {
        attributes: {
            "pave_attributs_1": ["Force", "Constitution", "Dextérité", "Agilité"],
            "pave_attributs_2": ["Intellect", "Volonté", "Intuition", "Perception"],
            "pave_attributs_3": ["Charisme", "Empathie", "Apparence", "Communication"]
        },
        secondaryAttributes: {
            "pave_attributs_1": ["Corpulence", "Beauté"],
            "pave_attributs_2": ["Conscience", "Attraction"],
            "pave_attributs_3": ["Présence", "Charme"],
            "pave_attributs_4": ["Aura", "Fascination"]
        },
        skillCategories: [
            { id: "Col_Comp_1", label: "Talents", behavior: "Compétence", allowSpecializations: true, costConfig: { factor: 1, type: "triangular" }, description: "Aptitudes innées et réflexes." },
            { id: "Col_Comp_2", label: "Compétences", behavior: "Compétence", allowSpecializations: true, costConfig: { factor: 1, type: "triangular" }, description: "Savoir-faire acquis par l'entraînement." },
            { id: "Col_Comp_3", label: "Compétences", behavior: "Compétence", allowSpecializations: true, costConfig: { factor: 1, type: "triangular" } },
            { id: "Col_Comp_4", label: "Connaissances", behavior: "Compétence", allowSpecializations: true, costConfig: { factor: 1, type: "triangular" }, description: "Érudition et culture générale." },
            { id: "Col_Comp_5", label: "Autres Compétences", behavior: "Compétence", allowSpecializations: true, costConfig: { factor: 1, type: "triangular" } },
            { id: "Col_Comp_6", label: "Secondaire", behavior: "Secondaire", allowSpecializations: false, costConfig: { factor: 0.5, type: "triangular" } },
            { id: "Col_Comp_7", label: "Autres", behavior: "Compétence", allowSpecializations: true, costConfig: { factor: 1, type: "triangular" } },
            { id: "Col_Comp_8", label: "Arrière-plans", behavior: "Arrière-plan", allowSpecializations: false, costConfig: { factor: 1, type: "linear" } },
            { id: "Col_Comp_9", label: "Compteurs", behavior: "Compteur", allowSpecializations: false, costConfig: { factor: 1, type: "linear" } }
        ],
        skills: {
            "Col_Comp_1": [],
            "Col_Comp_2": [],
            "Col_Comp_3": [],
            "Col_Comp_4": [],
            "Col_Comp_5": [],
            "Col_Comp_6": [],
            "Col_Comp_7": [],
            "Col_Comp_8": [],
            "Col_Comp_9": ["Volonté", "Confiance"]
        },
        counters: {
            "volonte": { id: "volonte", name: "Volonté", max: 10, xpCost: 0 },
            "confiance": { id: "confiance", name: "Confiance", max: 10, xpCost: 0 }
        },
        backgrounds: ["Ressources", "Alliés", "Contacts", "Mentor"],
        labels: {
            "pave_attributs_1": "Physique",
            "pave_attributs_2": "Mental",
            "pave_attributs_3": "Social"
        }
    },
    libraries: {
        traits: [],
        skills: [],
        specializations: [],
        backgrounds: [],
        counters: []
    }
};
