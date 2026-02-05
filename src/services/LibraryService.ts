import { supabase } from './supabase';
import { RulesData } from '../types/rules';

export const LibraryService = {
    /**
     * Persist initial libraries for a new setting
     */
    async persistInitialLibraries(settingId: string, initialRules: Partial<RulesData>) {
        if (!initialRules.libraries) return;

        // A. Traits
        if (initialRules.libraries.traits && initialRules.libraries.traits.length > 0) {
            const traitsPayload = initialRules.libraries.traits.map(t => ({
                setting_id: settingId,
                id: t.id,
                type: t.type,
                name: t.name,
                cost: t.cost,
                description: t.description,
                tags: t.tags || [],
                is_variable: (t as any).isVariable,
                effects: (t as any).effects || []
            }));
            await supabase.from('libraries_traits').insert(traitsPayload);
        }

        // B. Skills (Enhanced: Link Global vs Create Local)
        if (initialRules.libraries.skills && initialRules.libraries.skills.length > 0) {
            const { data: globalSkills } = await supabase
                .from('libraries_skills')
                .select('id, name')
                .is('setting_id', null);

            const globalSkillMap = new Map((globalSkills || []).map(s => [s.name.trim().toLowerCase(), s.id]));
            const skillsPayload: any[] = [];
            const linksPayload: any[] = [];

            initialRules.libraries.skills.forEach(s => {
                const normalizedName = s.name.trim().toLowerCase();
                if (globalSkillMap.has(normalizedName)) {
                    linksPayload.push({
                        setting_id: settingId,
                        skill_id: globalSkillMap.get(normalizedName),
                        is_active: true
                    });
                } else {
                    skillsPayload.push({
                        setting_id: settingId,
                        id: s.id,
                        name: s.name,
                        description: s.description,
                        default_category: (s as any).defaultCategory,
                        is_variable: (s as any).isVariable
                    });
                }
            });

            if (skillsPayload.length > 0) await supabase.from('libraries_skills').insert(skillsPayload);
            if (linksPayload.length > 0) await supabase.from('rel_setting_skills').insert(linksPayload);
        }

        // C. Specializations
        if (initialRules.libraries.specializations && initialRules.libraries.specializations.length > 0) {
            const specsPayload = initialRules.libraries.specializations.map(s => ({
                setting_id: settingId,
                id: s.id,
                name: s.name,
                description: s.description,
                skill_ids: (s as any).skillIds || [],
                default_min_level: (s as any).defaultMinLevel
            }));
            await supabase.from('libraries_specializations').insert(specsPayload);
        }

        // D. Backgrounds
        const layoutBgNames = initialRules.definitions?.skills?.['arrieres_plans'] || [];
        const libBgNames = initialRules.libraries?.backgrounds?.map(b => b.name) || [];
        const targetBgNames = new Set([...layoutBgNames, ...libBgNames].map(n => n.trim().toLowerCase()).filter(n => n !== ""));

        if (targetBgNames.size > 0) {
            const { data: globalBgs } = await supabase.from('libraries_backgrounds').select('id, name').is('setting_id', null);
            const globalBgMap = new Map((globalBgs || []).map(b => [b.name.trim().toLowerCase(), b.id]));
            const bgPayload: any[] = [];
            const bgLinksPayload: any[] = [];
            const processedNames = new Set<string>();

            if (initialRules.libraries?.backgrounds) {
                initialRules.libraries.backgrounds.forEach(b => {
                    const normalized = b.name.trim().toLowerCase();
                    if (processedNames.has(normalized)) return;
                    processedNames.add(normalized);
                    if (globalBgMap.has(normalized)) {
                        bgLinksPayload.push({ setting_id: settingId, background_id: globalBgMap.get(normalized), is_active: true });
                    } else {
                        bgPayload.push({ setting_id: settingId, id: b.id, name: b.name, description: b.description, is_variable: (b as any).isVariable });
                    }
                });
            }
            if (bgPayload.length > 0) await supabase.from('libraries_backgrounds').insert(bgPayload);
            if (bgLinksPayload.length > 0) await supabase.from('rel_setting_backgrounds').insert(bgLinksPayload);
        }

        // E. Counters
        const layoutCounterNames = Object.values(initialRules.definitions?.counters || {}).map((c: any) => c.name);
        const libCounterNames = initialRules.libraries?.counters?.map(c => c.name) || [];
        const targetCounterNames = new Set([...layoutCounterNames, ...libCounterNames].map(n => n.trim().toLowerCase()));

        if (targetCounterNames.size > 0) {
            const { data: globalCounters } = await supabase.from('libraries_counters').select('id, name').is('setting_id', null);
            const globalCounterMap = new Map((globalCounters || []).map(c => [c.name.trim().toLowerCase(), c.id]));
            const counterPayload: any[] = [];
            const counterLinksPayload: any[] = [];
            const processedNames = new Set<string>();

            if (initialRules.libraries?.counters) {
                initialRules.libraries.counters.forEach(c => {
                    const normalized = c.name.trim().toLowerCase();
                    if (processedNames.has(normalized)) return;
                    processedNames.add(normalized);
                    if (globalCounterMap.has(normalized)) {
                        counterLinksPayload.push({ setting_id: settingId, counter_id: globalCounterMap.get(normalized), is_active: true });
                    } else {
                        counterPayload.push({ setting_id: settingId, id: c.id, name: c.name, max_value: (c as any).maxValue, default_value: (c as any).defaultValue, xp_cost: (c as any).xpCost });
                    }
                });
            }
            if (counterPayload.length > 0) await supabase.from('libraries_counters').insert(counterPayload);
            if (counterLinksPayload.length > 0) await supabase.from('rel_setting_counters').insert(counterLinksPayload);
        }
    },

    /**
     * Load libraries for a specific setting and map them to RulesData format
     */
    async loadLibraries(settingId: string): Promise<RulesData['libraries']> {
        const [traitsRes, skillsRes, specsRes, relSkillsRes, bgsRes, relBgsRes, countersRes, relCountersRes] = await Promise.all([
            supabase.from('libraries_traits').select('*').eq('setting_id', settingId),
            supabase.from('libraries_skills').select('*').or(`setting_id.eq.${settingId},setting_id.is.null`),
            supabase.from('libraries_specializations').select('*').eq('setting_id', settingId),
            supabase.from('rel_setting_skills').select('skill_id').eq('setting_id', settingId),
            supabase.from('libraries_backgrounds').select('*').or(`setting_id.eq.${settingId},setting_id.is.null`),
            supabase.from('rel_setting_backgrounds').select('background_id').eq('setting_id', settingId),
            supabase.from('libraries_counters').select('*').or(`setting_id.eq.${settingId},setting_id.is.null`),
            supabase.from('rel_setting_counters').select('counter_id').eq('setting_id', settingId)
        ]);

        const activeSkillIds = new Set((relSkillsRes.data || []).map((r: any) => r.skill_id));
        const activeBgIds = new Set((relBgsRes.data || []).map((r: any) => r.background_id));
        const activeCounterIds = new Set((relCountersRes.data || []).map((r: any) => r.counter_id));

        const mapTrait = (t: any) => ({
            id: t.id,
            type: t.type,
            name: t.name,
            cost: t.cost,
            description: t.description,
            tags: t.tags || [],
            isVariable: t.is_variable,
            effects: t.effects || []
        });

        const mapSkill = (s: any, activeIds: Set<string>, sid: string) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            defaultCategory: s.default_category,
            isVariable: s.is_variable,
            isGlobal: s.setting_id === null,
            isActive: activeIds.has(s.id) || s.setting_id === sid
        });

        const mapSpec = (s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            skillIds: s.skill_ids || [],
            defaultMinLevel: s.default_min_level
        });

        const mapBg = (b: any, activeIds: Set<string>, sid: string) => ({
            id: b.id,
            name: b.name,
            description: b.description,
            isVariable: b.is_variable,
            isGlobal: b.setting_id === null,
            isActive: activeIds.has(b.id) || b.setting_id === sid
        });

        const mapCounter = (c: any, activeIds: Set<string>, sid: string) => ({
            id: c.id,
            name: c.name,
            maxValue: c.max_value,
            defaultValue: c.default_value,
            xpCost: c.xp_cost,
            isGlobal: c.setting_id === null,
            isActive: activeIds.has(c.id) || c.setting_id === sid
        });

        return {
            traits: (traitsRes.data || []).map(mapTrait),
            skills: (() => {
                const mappedGlobals = (skillsRes.data || []).filter(s => s.setting_id === null).map(s => mapSkill(s, activeSkillIds, settingId));
                const mappedLocals = (skillsRes.data || []).filter(s => s.setting_id === settingId).map(s => mapSkill(s, activeSkillIds, settingId));
                const skillMap = new Map();
                mappedGlobals.forEach(s => skillMap.set(s.name.trim().toLowerCase(), s));
                mappedLocals.forEach(s => skillMap.set(s.name.trim().toLowerCase(), s));
                return Array.from(skillMap.values()).sort((a, b) => (a as any).name.localeCompare((b as any).name));
            })(),
            specializations: (specsRes.data || []).map(mapSpec),
            backgrounds: (() => {
                const mappedGlobals = (bgsRes.data || []).filter(b => b.setting_id === null).map(b => mapBg(b, activeBgIds, settingId));
                const mappedLocals = (bgsRes.data || []).filter(b => b.setting_id === settingId).map(b => mapBg(b, activeBgIds, settingId));
                const bgMap = new Map();
                mappedGlobals.forEach(b => bgMap.set(b.name.trim().toLowerCase(), b));
                mappedLocals.forEach(b => bgMap.set(b.name.trim().toLowerCase(), b));
                return Array.from(bgMap.values()).sort((a, b) => (a as any).name.localeCompare((b as any).name));
            })(),
            counters: (() => {
                const mappedGlobals = (countersRes.data || []).filter(c => c.setting_id === null).map(c => mapCounter(c, activeCounterIds, settingId));
                const mappedLocals = (countersRes.data || []).filter(c => c.setting_id === settingId).map(c => mapCounter(c, activeCounterIds, settingId));
                const cMap = new Map();
                mappedGlobals.forEach(c => cMap.set(c.name.trim().toLowerCase(), c));
                mappedLocals.forEach(c => cMap.set(c.name.trim().toLowerCase(), c));
                return Array.from(cMap.values()).sort((a, b) => (a as any).name.localeCompare((b as any).name));
            })()
        };
    },

    /**
     * Delete and Re-insert libraries (Standard Sync Strategy)
     */
    async syncLibraries(settingId: string, rules: RulesData) {
        // A. Traits
        await supabase.from('libraries_traits').delete().eq('setting_id', settingId);
        if (rules.libraries.traits.length > 0) {
            const traitsPayload = rules.libraries.traits.map(t => ({
                setting_id: settingId,
                id: t.id,
                type: t.type,
                name: t.name,
                cost: t.cost,
                description: t.description,
                tags: t.tags,
                is_variable: (t as any).isVariable,
                effects: (t as any).effects
            }));
            await supabase.from('libraries_traits').insert(traitsPayload);
        }

        // B. Skills
        const localSkillsToSave = rules.libraries.skills.filter(s => !s.isGlobal);
        const activeGlobalSkillIds = rules.libraries.skills.filter(s => s.isGlobal && s.isActive !== false).map(s => s.id);

        await supabase.from('libraries_skills').delete().eq('setting_id', settingId);
        if (localSkillsToSave.length > 0) {
            const skillsPayload = localSkillsToSave.map(s => ({
                setting_id: settingId,
                id: s.id,
                name: s.name,
                description: s.description,
                default_category: s.defaultCategory,
                is_variable: s.isVariable
            }));
            await supabase.from('libraries_skills').insert(skillsPayload);
        }

        await supabase.from('rel_setting_skills').delete().eq('setting_id', settingId);
        if (activeGlobalSkillIds.length > 0) {
            const relPayload = activeGlobalSkillIds.map(skillId => ({ setting_id: settingId, skill_id: skillId, is_active: true }));
            await supabase.from('rel_setting_skills').insert(relPayload);
        }

        // C. Specializations
        await supabase.from('libraries_specializations').delete().eq('setting_id', settingId);
        if (rules.libraries.specializations.length > 0) {
            const specsPayload = rules.libraries.specializations.map(s => ({
                setting_id: settingId,
                id: s.id,
                name: s.name,
                description: s.description,
                skill_ids: s.skillIds,
                default_min_level: s.defaultMinLevel
            }));
            await supabase.from('libraries_specializations').insert(specsPayload);
        }

        // D. Backgrounds
        const localBgsToSave = rules.libraries.backgrounds.filter(b => !b.isGlobal);
        const activeGlobalBgIds = rules.libraries.backgrounds.filter(b => b.isGlobal && b.isActive !== false).map(b => b.id);

        await supabase.from('libraries_backgrounds').delete().eq('setting_id', settingId);
        if (localBgsToSave.length > 0) {
            const bgPayload = localBgsToSave.map(b => ({ setting_id: settingId, id: b.id, name: b.name, description: b.description, is_variable: b.isVariable }));
            await supabase.from('libraries_backgrounds').insert(bgPayload);
        }

        await supabase.from('rel_setting_backgrounds').delete().eq('setting_id', settingId);
        if (activeGlobalBgIds.length > 0) {
            const relPayload = activeGlobalBgIds.map(bid => ({ setting_id: settingId, background_id: bid, is_active: true }));
            await supabase.from('rel_setting_backgrounds').insert(relPayload);
        }

        // E. Counters
        const localCountersToSave = rules.libraries.counters.filter(c => !c.isGlobal);
        const activeGlobalCounterIds = rules.libraries.counters.filter(c => c.isGlobal && c.isActive !== false).map(c => c.id);

        await supabase.from('libraries_counters').delete().eq('setting_id', settingId);
        if (localCountersToSave.length > 0) {
            const ctrPayload = localCountersToSave.map(c => ({ setting_id: settingId, id: c.id, name: c.name, max_value: (c as any).maxValue, default_value: (c as any).defaultValue, xp_cost: (c as any).xpCost }));
            await supabase.from('libraries_counters').insert(ctrPayload);
        }

        await supabase.from('rel_setting_counters').delete().eq('setting_id', settingId);
        if (activeGlobalCounterIds.length > 0) {
            const relPayload = activeGlobalCounterIds.map(cid => ({ setting_id: settingId, counter_id: cid, is_active: true }));
            await supabase.from('rel_setting_counters').insert(relPayload);
        }
    }
};
