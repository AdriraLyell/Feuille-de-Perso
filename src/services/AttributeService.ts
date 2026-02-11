import { supabase } from './supabase';
import { AttributePreset } from '../types/system';
import { ErrorService } from './ErrorService';
import { TABLE_ATTRIBUTE_PRESETS } from '../constants/db';

export const AttributeService = {
    /**
     * List all available attribute presets
     */
    async listAttributePresets(): Promise<AttributePreset[] | null> {
        const { data, error } = await supabase
            .from(TABLE_ATTRIBUTE_PRESETS)
            .select('*')
            .order('is_official', { ascending: false })
            .order('name', { ascending: true });

        if (error) {
            ErrorService.handleError(error, { context: 'AttributeService.listAttributePresets' });
            return null;
        }

        // Map DB snake_case to TS camelCase if needed (though here it seems we use it directly or it was already mapped)
        // Let's ensure mapping for consistency
        return (data || []).map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            hasSecondary: p.has_secondary,
            structure: p.structure,
            isOfficial: p.is_official
        }));
    },

    /**
     * Save a new attribute preset
     */
    async saveAttributePreset(name: string, description: string, structure: any, hasSecondary: boolean): Promise<boolean> {
        const { error } = await supabase
            .from(TABLE_ATTRIBUTE_PRESETS)
            .insert([{
                name,
                description,
                structure,
                has_secondary: hasSecondary,
                is_official: false
            }]);

        if (error) {
            ErrorService.handleError(error, { context: 'AttributeService.saveAttributePreset', userMessage: "Impossible de sauvegarder le preset." });
            return false;
        }
        return true;
    },

    /**
     * Delete an attribute preset (only if not official)
     */
    async deleteAttributePreset(id: string): Promise<boolean> {
        const { error } = await supabase
            .from(TABLE_ATTRIBUTE_PRESETS)
            .delete()
            .eq('id', id)
            .eq('is_official', false); // Safety check

        if (error) {
            ErrorService.handleError(error, { context: 'AttributeService.deleteAttributePreset', userMessage: "Impossible de supprimer le preset." });
            return false;
        }
        return true;
    },

    /**
     * Update an attribute preset metadata
     */
    async updateAttributePreset(id: string, updates: { name?: string; description?: string }): Promise<boolean> {
        // Map camelCase to snake_case if needed (none here as name/description are same)
        const { error } = await supabase
            .from(TABLE_ATTRIBUTE_PRESETS)
            .update(updates)
            .eq('id', id);

        if (error) {
            ErrorService.handleError(error, { context: 'AttributeService.updateAttributePreset', userMessage: "Impossible de mettre à jour le preset." });
            return false;
        }
        return true;
    }
};
