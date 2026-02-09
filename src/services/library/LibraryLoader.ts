import { DatabaseService } from '../DatabaseService';
import { RulesData } from '../../types/rules';
import { LibraryMapper } from './LibraryMapper';

export const LibraryLoader = {
    /**
     * Load libraries for a specific setting and map them to RulesData format
     */
    async loadLibraries(settingId: string): Promise<RulesData['libraries']> {
        const orFilter = `setting_id.eq.${settingId},setting_id.is.null`;

        const [
            traits, skills, specs,
            relTraits, relSkills, relSpecs,
            backgrounds, relBackgrounds, counters, relCounters,
            traitVariants, skillVariants, bgVariants
        ] = await Promise.all([
            DatabaseService.fetchAll<any>('libraries_traits', { or: orFilter }, 'LibraryLoader.loadTraits'),
            DatabaseService.fetchAll<any>('libraries_skills', { or: orFilter }, 'LibraryLoader.loadSkills'),
            DatabaseService.fetchAll<any>('libraries_specializations', { or: orFilter }, 'LibraryLoader.loadSpecs'),
            DatabaseService.fetchAll<any>('rel_setting_traits', { eq: { setting_id: settingId } }, 'LibraryLoader.relTraits'),
            DatabaseService.fetchAll<any>('rel_setting_skills', { eq: { setting_id: settingId } }, 'LibraryLoader.relSkills'),
            DatabaseService.fetchAll<any>('rel_setting_specializations', { eq: { setting_id: settingId } }, 'LibraryLoader.relSpecs'),
            DatabaseService.fetchAll<any>('libraries_backgrounds', { or: orFilter }, 'LibraryLoader.loadBackgrounds'),
            DatabaseService.fetchAll<any>('rel_setting_backgrounds', { eq: { setting_id: settingId } }, 'LibraryLoader.relBackgrounds'),
            DatabaseService.fetchAll<any>('libraries_counters', { or: orFilter }, 'LibraryLoader.loadCounters'),
            DatabaseService.fetchAll<any>('rel_setting_counters', { eq: { setting_id: settingId } }, 'LibraryLoader.relCounters'),
            DatabaseService.fetchAll<any>('libraries_traits_variants', { or: orFilter, select: 'trait_id, name' }, 'LibraryLoader.loadTraitsVariants'),
            DatabaseService.fetchAll<any>('libraries_skills_variants', { or: orFilter, select: 'skill_id, name' }, 'LibraryLoader.loadSkillsVariants'),
            DatabaseService.fetchAll<any>('libraries_backgrounds_variants', { or: orFilter, select: 'background_id, name' }, 'LibraryLoader.loadBgVariants')
        ]);

        const traitVarMap = new Map<string, string[]>();
        traitVariants.forEach((v: any) => {
            const list = traitVarMap.get(v.trait_id) || [];
            if (!list.includes(v.name)) {
                list.push(v.name);
                traitVarMap.set(v.trait_id, list);
            }
        });

        const skillVarMap = new Map<string, string[]>();
        skillVariants.forEach((v: any) => {
            const list = skillVarMap.get(v.skill_id) || [];
            if (!list.includes(v.name)) {
                list.push(v.name);
                skillVarMap.set(v.skill_id, list);
            }
        });

        const bgVarMap = new Map<string, string[]>();
        bgVariants.forEach((v: any) => {
            const list = bgVarMap.get(v.background_id) || [];
            if (!list.includes(v.name)) {
                list.push(v.name);
                bgVarMap.set(v.background_id, list);
            }
        });

        const activeTraitIds = new Set(relTraits.map((r: any) => r.trait_id));
        const activeSkillIds = new Set(relSkills.map((r: any) => r.skill_id));
        const activeSpecIds = new Set(relSpecs.map((r: any) => r.specialization_id));
        const activeBgIds = new Set(relBackgrounds.map((r: any) => r.background_id));
        const activeCounterIds = new Set(relCounters.map((r: any) => r.counter_id));

        return {
            traits: (() => {
                const mappedGlobals = traits.filter(t => t.setting_id === null).map(t => LibraryMapper.mapTrait(t, activeTraitIds, settingId, traitVarMap.get(t.id)));
                const mappedLocals = traits.filter(t => t.setting_id === settingId).map(t => LibraryMapper.mapTrait(t, activeTraitIds, settingId, traitVarMap.get(t.id)));
                const traitMap = new Map();
                mappedGlobals.forEach(t => traitMap.set(t.name.trim().toLowerCase(), t));
                mappedLocals.forEach(t => traitMap.set(t.name.trim().toLowerCase(), t));
                return Array.from(traitMap.values()).sort((a, b) => (a as any).name.localeCompare((b as any).name));
            })(),
            skills: (() => {
                const mappedGlobals = skills.filter(s => s.setting_id === null).map(s => LibraryMapper.mapSkill(s, activeSkillIds, settingId, skillVarMap.get(s.id)));
                const mappedLocals = skills.filter(s => s.setting_id === settingId).map(s => LibraryMapper.mapSkill(s, activeSkillIds, settingId, skillVarMap.get(s.id)));
                const skillMap = new Map();
                mappedGlobals.forEach(s => skillMap.set(s.name.trim().toLowerCase(), s));
                mappedLocals.forEach(s => skillMap.set(s.name.trim().toLowerCase(), s));
                return Array.from(skillMap.values()).sort((a, b) => (a as any).name.localeCompare((b as any).name));
            })(),
            specializations: (() => {
                const mappedGlobals = specs.filter(s => s.setting_id === null).map(s => LibraryMapper.mapSpec(s, activeSpecIds, settingId));
                const mappedLocals = specs.filter(s => s.setting_id === settingId).map(s => LibraryMapper.mapSpec(s, activeSpecIds, settingId));
                const specMap = new Map();
                mappedGlobals.forEach(s => specMap.set(s.name.trim().toLowerCase(), s));
                mappedLocals.forEach(s => specMap.set(s.name.trim().toLowerCase(), s));
                return Array.from(specMap.values()).sort((a, b) => (a as any).name.localeCompare((b as any).name));
            })(),
            backgrounds: (() => {
                const mappedGlobals = backgrounds.filter(b => b.setting_id === null).map(b => LibraryMapper.mapBackground(b, activeBgIds, settingId, bgVarMap.get(b.id)));
                const mappedLocals = backgrounds.filter(b => b.setting_id === settingId).map(b => LibraryMapper.mapBackground(b, activeBgIds, settingId, bgVarMap.get(b.id)));
                const bgMap = new Map();
                mappedGlobals.forEach(b => bgMap.set(b.name.trim().toLowerCase(), b));
                mappedLocals.forEach(b => bgMap.set(b.name.trim().toLowerCase(), b));
                return Array.from(bgMap.values()).sort((a, b) => (a as any).name.localeCompare((b as any).name));
            })(),
            counters: (() => {
                const mappedGlobals = counters.filter(c => c.setting_id === null).map(c => LibraryMapper.mapCounter(c, activeCounterIds, settingId));
                const mappedLocals = counters.filter(c => c.setting_id === settingId).map(c => LibraryMapper.mapCounter(c, activeCounterIds, settingId));
                const cMap = new Map();
                mappedGlobals.forEach(c => cMap.set(c.name.trim().toLowerCase(), c));
                mappedLocals.forEach(c => cMap.set(c.name.trim().toLowerCase(), c));
                return Array.from(cMap.values()).sort((a, b) => (a as any).name.localeCompare((b as any).name));
            })()
        };
    }
};
