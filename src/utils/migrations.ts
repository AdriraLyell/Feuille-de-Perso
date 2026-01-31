
import { CharacterSheetData, SkillCategoryKey, LibrarySkillEntry } from '../types';
import { INITIAL_DATA } from '../data/initialState';

// --- MIGRATION LOGIC ---
export const migrateData = (parsed: any): CharacterSheetData => {
    // Migration 1: Ensure page2 exists if loading old data
    if (!parsed.page2) {
        parsed = { ...parsed, page2: INITIAL_DATA.page2 };
    }

    // Migration Terminology: Vertus -> Avantages, Defauts -> Desavantages
    if (parsed.page2.vertus && !parsed.page2.avantages) {
        parsed.page2.avantages = parsed.page2.vertus;
        delete parsed.page2.vertus;
    }
    if (parsed.page2.defauts && !parsed.page2.desavantages) {
        parsed.page2.desavantages = parsed.page2.defauts;
        delete parsed.page2.defauts;
    }

    // Migration 2: Convert old string[] to object[] (Apply to new names)
    if (parsed.page2.avantages && parsed.page2.avantages.length > 0 && typeof parsed.page2.avantages[0] === 'string') {
        parsed.page2.avantages = parsed.page2.avantages.map((s: string) => ({ name: s || '', value: '' }));
    }
    if (parsed.page2.desavantages && parsed.page2.desavantages.length > 0 && typeof parsed.page2.desavantages[0] === 'string') {
        parsed.page2.desavantages = parsed.page2.desavantages.map((s: string) => ({ name: s || '', value: '' }));
    }

    // Fix: Ensure correct array lengths if old data was shorter
    if (parsed.page2.avantages && parsed.page2.avantages.length < 28) {
            const diff = 28 - parsed.page2.avantages.length;
            parsed.page2.avantages = [...parsed.page2.avantages, ...Array(diff).fill(null).map(() => ({ name: '', value: '' }))];
    } else if (!parsed.page2.avantages) {
            parsed.page2.avantages = Array(28).fill(null).map(() => ({ name: '', value: '' }));
    }

    if (parsed.page2.desavantages && parsed.page2.desavantages.length < 28) {
            const diff = 28 - parsed.page2.desavantages.length;
            parsed.page2.desavantages = [...parsed.page2.desavantages, ...Array(diff).fill(null).map(() => ({ name: '', value: '' }))];
    } else if (!parsed.page2.desavantages) {
            parsed.page2.desavantages = Array(28).fill(null).map(() => ({ name: '', value: '' }));
    }

    // Migration 3: Convert old counters structure to new DotEntry structure
    if (parsed.counters && !parsed.counters.volonte.id) {
        const oldCounters = parsed.counters;
        parsed.counters = {
            volonte: { id: 'volonte', name: 'Volonté', value: oldCounters.volonte.max || 3, creationValue: 3, max: 10, current: 0 },
            confiance: { id: 'confiance', name: 'Confiance', value: oldCounters.confiance.max || 3, creationValue: 3, max: 10, current: 0 },
            custom: INITIAL_DATA.counters.custom // Reset custom/valets to default new structure
        };
    }
    
    // Migration 3b: Ensure counters have 'current' property (for squares)
    if (parsed.counters) {
        if (typeof parsed.counters.volonte.current === 'undefined') parsed.counters.volonte.current = 0;
        if (typeof parsed.counters.confiance.current === 'undefined') parsed.counters.confiance.current = 0;
        if (parsed.counters.custom) {
            parsed.counters.custom = parsed.counters.custom.map((c: any) => ({
                ...c,
                current: typeof c.current !== 'undefined' ? c.current : 0
            }));
        }
    }
    
    // Migration 17: Remove "Valets / Dames / Rois" if present (User requested removal)
    if (parsed.counters && parsed.counters.custom) {
        parsed.counters.custom = parsed.counters.custom.filter((c: any) => 
            c.name !== "Valets / Dames / Rois"
        );
    }

    // Migration 4 & 22: Convert old Attribute structure AND add attributeSettings
    if (parsed.attributes) {
        const categories = ['physique', 'mental', 'social'];
        let needsConversion = false;
        let needsTypeConversion = false;

        categories.forEach(cat => {
            if (parsed.attributes[cat] && parsed.attributes[cat].length > 0) {
                if (typeof parsed.attributes[cat][0].val1 === 'undefined') {
                    needsConversion = true;
                }
                if (typeof parsed.attributes[cat][0].val1 === 'number') {
                    needsTypeConversion = true;
                }
            }
        });

        if (needsConversion) {
            const convertAttributes = (list: any[]) => {
                return list.map(item => ({
                    id: item.id || Math.random().toString(36).substr(2, 9),
                    name: item.name,
                    val1: "", // Convert to string (default empty)
                    val2: "",
                    val3: "",
                    creationVal1: 0,
                    creationVal2: 0,
                    creationVal3: 0,
                }));
            };
            parsed.attributes = {
                physique: convertAttributes(parsed.attributes.physique),
                mental: convertAttributes(parsed.attributes.mental),
                social: convertAttributes(parsed.attributes.social),
            };
        } else if (needsTypeConversion) {
            const convertType = (list: any[]) => {
                return list.map(item => ({
                    ...item,
                    val1: item.val1 === 0 ? "" : item.val1.toString(),
                    val2: item.val2 === 0 ? "" : item.val2.toString(),
                    val3: item.val3 === 0 ? "" : item.val3.toString(),
                }));
            };
            Object.keys(parsed.attributes).forEach(key => {
                parsed.attributes[key] = convertType(parsed.attributes[key]);
            });
            if (parsed.secondaryAttributes) {
                Object.keys(parsed.secondaryAttributes).forEach(key => {
                    parsed.secondaryAttributes[key] = convertType(parsed.secondaryAttributes[key]);
                });
            }
        }
    }
    
    if (!parsed.attributeSettings) {
        parsed.attributeSettings = INITIAL_DATA.attributeSettings;
    }
    
    if (!parsed.attributes) {
        parsed.attributes = {};
    }
    if (!parsed.attributes.physique) parsed.attributes.physique = INITIAL_DATA.attributes.physique;
    if (!parsed.attributes.mental) parsed.attributes.mental = INITIAL_DATA.attributes.mental;
    if (!parsed.attributes.social) parsed.attributes.social = INITIAL_DATA.attributes.social;

    if (typeof parsed.secondaryAttributesActive === 'undefined') {
        parsed.secondaryAttributesActive = false;
    }
    if (!parsed.secondaryAttributes) {
        parsed.secondaryAttributes = JSON.parse(JSON.stringify(INITIAL_DATA.secondaryAttributes));
    }
    if (parsed.attributeSettings) {
        parsed.attributeSettings.forEach((cat: any) => {
            if (!parsed.secondaryAttributes[cat.id]) {
                parsed.secondaryAttributes[cat.id] = [
                    { id: Math.random().toString(36).substr(2, 9), name: 'Secondaire 1', val1: "", val2: "", val3: "" },
                    { id: Math.random().toString(36).substr(2, 9), name: 'Secondaire 2', val1: "", val2: "", val3: "" }
                ];
            }
        });
    }

    const notebookFields = ['lieux_importants', 'contacts', 'connaissances', 'valeurs_monetaires'];
    notebookFields.forEach(field => {
            if (Array.isArray(parsed.page2[field])) {
                parsed.page2[field] = parsed.page2[field].filter((x:any) => x && x.trim() !== '').join('\n');
            } 
            else if (typeof parsed.page2[field] !== 'string') {
                parsed.page2[field] = '';
            }
    });

    if (parsed.page2.personalite) {
            delete parsed.page2.personalite;
    }

    if (parsed.page2.reputation) {
            if (parsed.page2.reputation.length < 7) {
                const diff = 7 - parsed.page2.reputation.length;
                parsed.page2.reputation = [
                    ...parsed.page2.reputation, 
                    ...Array(diff).fill({ reputation: '', lieu: '', valeur: '' })
                ];
            }
    } else {
            parsed.page2.reputation = Array(7).fill({ reputation: '', lieu: '', valeur: '' });
    }

    if (Array.isArray(parsed.page2.notes)) {
            parsed.page2.notes = parsed.page2.notes.filter((n: string) => n && n.trim() !== '').join('\n');
    } else if (typeof parsed.page2.notes !== 'string') {
            parsed.page2.notes = '';
    }

    if (Array.isArray(parsed.page2.equipement)) {
            parsed.page2.equipement = parsed.page2.equipement.filter((n: string) => n && n.trim() !== '').join('\n');
    } else if (typeof parsed.page2.equipement !== 'string') {
            parsed.page2.equipement = '';
    }

    if (typeof parsed.page2.characterImage === 'undefined') {
        parsed.page2.characterImage = '';
    }

    if (Array.isArray(parsed.page2.armes_list)) {
        parsed.page2.armes_list = parsed.page2.armes_list.filter((n: string) => n && n.trim() !== '').join('\n');
    } else if (typeof parsed.page2.armes_list !== 'string') {
        parsed.page2.armes_list = '';
    }

    if (!parsed.specializations) {
        parsed.specializations = {};
    }

    if (!parsed.xpLogs) {
        parsed.xpLogs = [];
    }

    if (parsed.xpLogs && parsed.xpLogs.length > 0) {
            parsed.xpLogs = parsed.xpLogs.map((log: any) => {
                const newLog = { ...log };
                if (typeof newLog.mj === 'undefined') {
                    newLog.mj = '';
                }
                if (typeof newLog.spendingLocation === 'undefined') {
                    newLog.spendingLocation = '';
                }
                return newLog;
            });
    }
    
    if (!parsed.imposedSpecializations) {
        parsed.imposedSpecializations = {};
    }

    if (!parsed.appLogs) {
        parsed.appLogs = [];
    }
    
    if (!parsed.creationConfig) {
        parsed.creationConfig = INITIAL_DATA.creationConfig;
    }
    
    if (!parsed.theme) {
        parsed.theme = INITIAL_DATA.theme;
    }

    if (typeof parsed.creationConfig.attributeMin === 'undefined') {
        parsed.creationConfig.attributeMin = INITIAL_DATA.creationConfig.attributeMin;
    }
    if (typeof parsed.creationConfig.attributeMax === 'undefined') {
        parsed.creationConfig.attributeMax = INITIAL_DATA.creationConfig.attributeMax;
    }
    if (typeof parsed.creationConfig.attributeCost === 'undefined') {
        parsed.creationConfig.attributeCost = INITIAL_DATA.creationConfig.attributeCost;
    }
    
    if (!parsed.creationConfig.cardConfig) {
        parsed.creationConfig.cardConfig = INITIAL_DATA.creationConfig.cardConfig;
    }
    
    if (!parsed.library) {
        parsed.library = [];
    }

    if (parsed.library) {
        parsed.library = parsed.library.map((l: any) => ({
            ...l,
            type: l.type === 'vertu' ? 'avantage' : (l.type === 'defaut' ? 'desavantage' : l.type),
            tags: Array.isArray(l.tags) ? l.tags : []
        }));
    }

    // --- MIGRATION: SKILL LIBRARY PRE-FILL ---
    if (!parsed.skillLibrary) {
        parsed.skillLibrary = [];
        // Harvest skills from the CURRENT sheet data (parsed) to populate library
        const initialSkillList: LibrarySkillEntry[] = [];
        const seenNames = new Set<string>();

        // Ensure skills object exists before iterating
        if (parsed.skills) {
            Object.keys(parsed.skills).forEach(cat => {
                if (cat === 'arrieres_plans') return; 
                // @ts-ignore
                const skills = parsed.skills[cat] || [];
                skills.forEach((skill: any) => {
                    if (skill.name && skill.name.trim() !== '') {
                        const normalized = skill.name.trim().toLowerCase();
                        if (!seenNames.has(normalized)) {
                            seenNames.add(normalized);
                            initialSkillList.push({
                                id: Math.random().toString(36).substr(2, 9),
                                name: skill.name,
                                defaultCategory: cat,
                                description: ""
                            });
                        }
                    }
                });
            });
        }
        initialSkillList.sort((a, b) => a.name.localeCompare(b.name));
        parsed.skillLibrary = initialSkillList;
    }

    if (!parsed.campaignNotes) {
        parsed.campaignNotes = [];
    }

    if (parsed.campaignNotes) {
        parsed.campaignNotes = parsed.campaignNotes.map((note: any) => {
            if (note.imageId && (!note.images || note.images.length === 0)) {
                note.images = [{
                    id: Math.random().toString(36).substr(2, 9),
                    imageId: note.imageId,
                    config: note.imageConfig || { width: 200, height: 200, marginTop: 0, align: 'right' }
                }];
                delete note.imageId;
                delete note.imageConfig;
            }
            if (!note.images) note.images = [];
            return note;
        });
    }

    if (!parsed.partyNotes) {
        parsed.partyNotes = INITIAL_DATA.partyNotes;
    }
    
    if (parsed.partyNotes && !parsed.partyNotes.staticColWidths) {
        parsed.partyNotes.staticColWidths = INITIAL_DATA.partyNotes.staticColWidths;
    }

    if (!parsed.skills) {
        parsed.skills = {};
    }
    
    const requiredSkillCats: SkillCategoryKey[] = [
        'talents', 'competences', 'competences_col_2', 'connaissances',
        'competences2', 'autres_competences', 'autres', 'arrieres_plans'
    ];
    
    requiredSkillCats.forEach(cat => {
        if (!parsed.skills[cat]) {
            // @ts-ignore
            parsed.skills[cat] = INITIAL_DATA.skills[cat] || [];
        }
    });

    const ensureCreationValue = (list: any[]) => {
        return list.map(item => {
            if (typeof item.creationValue === 'undefined') return { ...item, creationValue: 0 };
            return item;
        });
    };
    
    Object.keys(parsed.skills).forEach(key => {
        parsed.skills[key] = ensureCreationValue(parsed.skills[key]);
    });
    
    if (parsed.counters) {
        if (typeof parsed.counters.volonte.creationValue === 'undefined') parsed.counters.volonte.creationValue = 3;
        if (typeof parsed.counters.confiance.creationValue === 'undefined') parsed.counters.confiance.creationValue = 3;
        parsed.counters.custom = ensureCreationValue(parsed.counters.custom);
    }

    return parsed as CharacterSheetData;
};
