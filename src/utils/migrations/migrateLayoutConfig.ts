import { MigratableData } from './registry';

/**
 * Migration 8: Initialize Layout Configuration
 * - Ensures activeLayout and layoutConfigs exist
 */
export const migrateLayoutConfig = (data: MigratableData): void => {
    if (!data.layoutConfigs) {
        data.layoutConfigs = {};
    }
};
