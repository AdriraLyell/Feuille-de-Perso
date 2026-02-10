import { LibraryEntry, LibrarySkillEntry, LibrarySpecializationEntry, LibraryBackgroundEntry, LibraryCounterEntry } from './system';

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

export type SkillBehavior = 'Compétence' | 'Secondaire' | 'Arrière-plan' | 'Compteur';

export interface SkillCategoryConfig {
    id: string;               // Ex: Col_Comp_1
    behavior: SkillBehavior;
    label: string;            // Titre affiché
    description?: string;     // Info-bulle optionnelle
    allowSpecializations: boolean;
    costConfig: {
        factor: number;
        type: 'triangular' | 'linear';
    };
}

export interface RulesCounterDefinition {
    id: string;
    name: string;
    max: number;
    xpCost: number; // Cost per point. <= 0 means cannot be bought with XP
    value?: number; // Starting value (Legacy compatibility)
    defaultValue?: number; // Starting value (New system)
    description?: string; // New: Description for tooltip
}

export interface RulesData {
    version: string;
    settingId?: string; // ID de la campagne source (si chargé depuis DB)
    settingName?: string; // Nom de la campagne source
    source?: 'database' | 'file' | 'api' | 'legacy'; // Source des règles
    lastUpdated?: number;
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
        skills: Record<string, string[]>; // Keep for data mapping compatibility (Legacy)
        skillCategories: SkillCategoryConfig[]; // NEW: Tableau ordonné des colonnes
        counters: Record<string, RulesCounterDefinition>; // Dynamic Counters
        backgrounds: string[]; // List of available backgrounds
        labels: Record<string, string>;   // Category ID -> Display Label (Legacy)
    };
    libraries: {
        traits: LibraryEntry[];
        skills: LibrarySkillEntry[];
        backgrounds: LibraryBackgroundEntry[]; // Unified Backgrounds
        counters: LibraryCounterEntry[]; // Unified Counters
        specializations: LibrarySpecializationEntry[];
    };
}
export interface GameSettingSummary {
    id: string;
    name: string;
    version: string;
    last_updated: string;
    is_public: boolean;
}

export interface GameSetting {
    id: string;
    name: string;
    version: string;
    lastUpdated: number;
    isPublic: boolean;
    rules: RulesData;
}
