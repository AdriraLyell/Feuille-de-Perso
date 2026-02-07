/**
 * Re-export all migration functions from the new modular structure.
 * This file is kept for backward compatibility with existing imports.
 * 
 * @deprecated Import directly from './migrations' folder instead.
 * @example import { migrateData } from '../utils/migrations';
 */

export {
    migrateData,
    migrateRulesToV2,
    LEGACY_SKILL_MAP,
    ATTRIBUTE_ID_MAP,
    migrateAttributeId
} from './migrations/index';
