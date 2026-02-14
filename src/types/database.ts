import { TraitEffect } from './primitives';

/**
 * Database model for traits (avantages/défauts)
 */
export interface DBTrait {
    id: string;
    setting_id: string | null; // Global if null
    name: string;
    description?: string;
    points?: number;
    category?: string;
    type?: string;           // 'avantage' | 'desavantage'
    tags?: string[];
    is_variable?: boolean;
    effects?: TraitEffect[];         // JSONB: List of effects
    created_at?: string;
    updated_at?: string;
}

/**
 * Database model for skills (compétences)
 */
export interface DBSkill {
    id: string;
    setting_id: string | null;
    name: string;
    description?: string;
    defaultCategory?: string; // Default placement
    is_variable?: boolean;
    default_min_level?: number;
    created_at?: string;
    updated_at?: string;
}

export interface DBSpecialization {
    id: string;
    setting_id: string | null;
    name: string;
    description?: string;
    skill_ids: string[];
    default_min_level: number;
    created_at?: string;
    updated_at?: string;
}

/**
 * Database model for backgrounds (arrières-plans)
 */
export interface DBBackground {
    id: string;
    setting_id: string | null;
    name: string;
    description?: string;
    defaultCategory?: string;
    is_variable?: boolean;
    created_at?: string;
    updated_at?: string;
}

/**
 * Database model for counters (compteurs)
 */
export interface DBCounter {
    id: string;
    setting_id: string | null;
    name: string;
    description?: string;
    maxValue?: number;
    defaultValue?: number;
    xpCost?: number;
    defaultCategory?: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Database model for game settings/campaigns
 */
export interface DBGameSetting {
    id: string;
    name: string;
    version: string;
    last_updated: string;
    configurations: Record<string, any>; // JSONB
    definitions: Record<string, any>; // JSONB
    is_public: boolean;
    created_at?: string;
    updated_at?: string;
}

/**
 * Relationship: Settings to Traits
 */
export interface RelSettingTrait {
    setting_id: string;
    trait_id: string;
    is_active: boolean;
}

/**
 * Relationship: Settings to Skills
 */
export interface RelSettingSkill {
    setting_id: string;
    skill_id: string;
    default_category: string;
    is_active: boolean;
}

/**
 * Relationship: Settings to Backgrounds
 */
export interface RelSettingBackground {
    setting_id: string;
    background_id: string;
    default_category: string;
    is_active: boolean;
}

/**
 * Relationship: Settings to Counters
 */
export interface RelSettingCounter {
    setting_id: string;
    counter_id: string;
    default_category: string;
    is_active: boolean;
}

/**
 * Relationship: Settings to Specializations
 */
export interface RelSettingSpecialization {
    setting_id: string;
    specialization_id: string;
    is_active: boolean;
}

/**
 * Trait variant names (aliases)
 */
export interface DBTraitVariant {
    id: string;
    setting_id: string | null;
    trait_id: string;
    name: string;
}

/**
 * Skill variant names (aliases)
 */
export interface DBSkillVariant {
    id: string;
    setting_id: string | null;
    skill_id: string;
    name: string;
}

/**
 * Background variant names (aliases)
 */
export interface DBBackgroundVariant {
    id: string;
    setting_id: string | null;
    background_id: string;
    name: string;
}
