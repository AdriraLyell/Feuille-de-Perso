import { supabase } from './supabase';
import { AttributePreset } from '../types/system';

export const AttributeService = {
    /**
     * List all available attribute presets
     */
    async listAttributePresets(): Promise<AttributePreset[] | null> {
        const { data, error } = await supabase
            .from('attribute_presets')
            .select('*')
            .order('is_official', { ascending: false })
            .order('name', { ascending: true });

        if (error) {
            console.error('Error listing attribute presets:', error);
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
            .from('attribute_presets')
            .insert([{
                name,
                description,
                structure,
                has_secondary: hasSecondary,
                is_official: false
            }]);

        if (error) {
            console.error('Error saving attribute preset:', error);
            return false;
        }
        return true;
    },

    /**
     * Delete an attribute preset (only if not official)
     */
    async deleteAttributePreset(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('attribute_presets')
            .delete()
            .eq('id', id)
            .eq('is_official', false); // Safety check

        if (error) {
            console.error('Error deleting attribute preset:', error);
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
            .from('attribute_presets')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating attribute preset:', error);
            return false;
        }
        return true;
    }
};
