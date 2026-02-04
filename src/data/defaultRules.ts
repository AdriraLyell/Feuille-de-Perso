
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
            attributeFactor: 5,
            skillFactor: 3,
            specializationFactor: 2
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
            "physique": ["Force", "Dextérité", "Vigueur"],
            "social": ["Charisme", "Manipulation", "Apparence"],
            "mental": ["Intelligence", "Astuce", "Perception"]
        },
        secondaryAttributes: {},
        skills: {
            "physique": [],
            "social": [],
            "mental": []
        },
        counters: {
            "pv": { id: "pv", name: "Points de Vie", max: 10, xpCost: 0 },
            "volonte": { id: "volonte", name: "Volonté", max: 10, xpCost: 0 }
        },
        backgrounds: ["Ressources", "Alliés", "Contacts", "Mentor"],
        labels: {
            "physique": "Physique",
            "social": "Social",
            "mental": "Mental"
        }
    },
    theme: {
        creationColor: "#1d4ed8",
        xpColor: "#b45309"
    },
    libraries: {
        traits: [],
        skills: [],
        specializations: []
    }
};
