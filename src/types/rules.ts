export interface RulesThemeConfig {
    creationColor: string;
    xpColor: string;
    dotSymbol?: string;
}

import { LibraryEntry, LibrarySkillEntry, LibrarySpecializationEntry } from './system';

export interface RulesCreationConfig {
    mode: 'points' | 'rangs';
    startingXP: number;
    pointsDistributionMode?: 'global' | 'buckets';
    pointsBuckets?: {
        attributes: number;
        skills: number;
        backgrounds: number;
    };
    attributePoints?: number;
    backgroundPoints?: number;
    attributeMin: number;
    attributeMax: number;
    attributeCost?: number;
    backgroundCost?: number; // Default 2
    rankSlots: Record<string, number>;
    extendedSkills?: boolean;
}

export interface RulesXPCosts {
    attributeFactor: number;
    skillFactor: number;
    specializationFactor: number;
}

export interface RulesCardConfig {
    active: boolean;
    baseStart: number;
    increment: number;
    bestSkillsCount: number;
    ranks: string[];
    counts: string[];
    maxLabel: string;
}

export interface RulesCounterDefinition {
    id: string;
    name: string;
    max: number;
    xpCost: number; // Cost per point. <= 0 means cannot be bought with XP
}

export interface RulesData {
    version: string;
    configurations: {
        global: {
            maxAttributeScore: number;
            maxSkillScore: number;
            secondaryAttributes?: boolean;
        };
        creation: RulesCreationConfig;
        xpCosts: RulesXPCosts;
        cards: RulesCardConfig;
    };
    definitions: {
        attributes: Record<string, string[]>;
        secondaryAttributes: Record<string, string[]>;
        skills: Record<string, string[]>; // Categories -> List of skill names
        counters: Record<string, RulesCounterDefinition>; // Dynamic Counters
        backgrounds: string[]; // List of available backgrounds
        labels: Record<string, string>;   // Category ID -> Display Label
    };
    theme: RulesThemeConfig;
    libraries: {
        traits: LibraryEntry[];
        skills: LibrarySkillEntry[];
        specializations: LibrarySpecializationEntry[];
    };
}
