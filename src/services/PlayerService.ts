
import { supabase } from './supabase';
import { RulesData } from '../types/rules';
import { CampaignService, GameSettingSummary } from './CampaignService';

export const PlayerService = {

    /**
     * List public settings available for players
     */
    async listPublicSettings(): Promise<GameSettingSummary[]> {
        const { data, error } = await supabase
            .from('game_settings')
            .select('id, name, version, last_updated, is_public')
            .eq('is_public', true)
            .order('last_updated', { ascending: false });

        if (error) {
            console.error('Error listing public settings:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Load a specific public setting
     * Re-uses AdminService logic but restricted logic could be applied here if needed.
     * For now, simpler is better: reuse AdminService.loadSetting as RLS protects us anyway.
     * (RLS says public users can only Select if is_public=true)
     */
    async loadSetting(id: string): Promise<RulesData | null> {
        return CampaignService.loadSetting(id);
    }
};
