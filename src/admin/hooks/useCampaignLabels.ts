import { useState, useEffect, useMemo } from 'react';
import { CampaignService } from '../../services/CampaignService';
import { RulesData } from '../../types/rules';
import { logger } from '../../utils/logger';

export function useCampaignLabels(settingId?: string) {
    const [rules, setRules] = useState<RulesData | null>(null);

    useEffect(() => {
        if (!settingId || settingId === 'orphan') return;

        const load = async () => {
            try {
                const data = await CampaignService.loadSetting(settingId);
                setRules(data);
            } catch (e) {
                logger.error("Failed to load campaign labels", e);
            }
        };
        load();
    }, [settingId]);

    const categoryMap = useMemo(() => {
        const map: Record<string, string> = {};
        if (rules?.definitions.skillCategories) {
            rules.definitions.skillCategories.forEach(cat => {
                map[cat.id] = cat.label;
            });
        }
        return map;
    }, [rules]);

    const getCategoryLabel = (id: string) => {
        return categoryMap[id] || id;
    };

    return { getCategoryLabel, rules };
}
