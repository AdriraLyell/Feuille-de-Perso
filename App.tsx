
import React, { useState, useEffect } from 'react';
import CharacterSheet from './components/CharacterSheet';
import CharacterSheetPage2 from './components/CharacterSheetPage2';
import CharacterSheetSpecializations from './components/CharacterSheetSpecializations';
import CharacterSheetXP from './components/CharacterSheetXP';
import CampaignNotes from './components/CampaignNotes';
import SettingsView from './components/SettingsView';
import ImportExportModal from './components/ImportExportModal';
import PrintSelectionModal from './components/PrintSelectionModal';
import ChangelogModal from './components/ChangelogModal';
import UserGuideModal from './components/UserGuideModal'; // Import Guide
import CreationHUD from './components/CreationHUD';
import TraitLibrary from './components/TraitLibrary';
import { CharacterSheetData, SkillCategoryKey, AttributeCategoryKey, LogEntry, DotEntry, TraitEffect } from './types';
import { INITIAL_DATA, APP_VERSION } from './constants';
import { Settings, Printer, FileText, Layers, FileType, AlertTriangle, List, Monitor, Smartphone, ArrowRightLeft, TrendingUp, History, Clock, X, Trash2, Save, ScrollText, HelpCircle, BookOpen, Book } from 'lucide-react';

// Migration Logic Extracted for Reusability (Import/Init)
const migrateData = (parsed: any): CharacterSheetData => {
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
    // Check if attributes exist and if they are in old format (or missing IDs for safe measure)
    if (parsed.attributes) {
        const categories = ['physique', 'mental', 'social'];
        let needsConversion = false;
        
        categories.forEach(cat => {
            if (parsed.attributes[cat] && parsed.attributes[cat].length > 0 && typeof parsed.attributes[cat][0].val1 === 'undefined') {
                needsConversion = true;
            }
        });

        if (needsConversion) {
            const convertAttributes = (list: any[]) => {
                return list.map(item => ({
                    id: item.id || Math.random().toString(36).substr(2, 9),
                    name: item.name,
                    val1: item.value || 0,
                    val2: 0,
                    val3: 0,
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
        }
    }
    
    // Migration 22: Ensure attributeSettings exists (for Dynamic Attributes)
    if (!parsed.attributeSettings) {
        parsed.attributeSettings = INITIAL_DATA.attributeSettings;
    }
    
    // FIX: Ensure attributes object exists regardless of settings
    if (!parsed.attributes) {
        parsed.attributes = {};
    }
    // Ensure default categories exist if empty
    if (!parsed.attributes.physique) parsed.attributes.physique = INITIAL_DATA.attributes.physique;
    if (!parsed.attributes.mental) parsed.attributes.mental = INITIAL_DATA.attributes.mental;
    if (!parsed.attributes.social) parsed.attributes.social = INITIAL_DATA.attributes.social;

    // Migration 24: Add Secondary Attributes
    if (typeof parsed.secondaryAttributesActive === 'undefined') {
        parsed.secondaryAttributesActive = false;
    }
    if (!parsed.secondaryAttributes) {
        parsed.secondaryAttributes = JSON.parse(JSON.stringify(INITIAL_DATA.secondaryAttributes));
    }
    // Ensure generic secondary attrs exist for all existing categories if missing (e.g. custom ones)
    if (parsed.attributeSettings) {
        parsed.attributeSettings.forEach((cat: any) => {
            if (!parsed.secondaryAttributes[cat.id]) {
                parsed.secondaryAttributes[cat.id] = [
                    { id: Math.random().toString(36).substr(2, 9), name: 'Secondaire 1', val1: 0, val2: 0, val3: 0 },
                    { id: Math.random().toString(36).substr(2, 9), name: 'Secondaire 2', val1: 0, val2: 0, val3: 0 }
                ];
            }
        });
    }

    // Migration 5: Page 2 restructuring (Personnalité -> Lieux/Contacts, Reputation Split)
    // Migration 11 (Unified): Convert array fields to string for Notebook style
    const notebookFields = ['lieux_importants', 'contacts', 'connaissances', 'valeurs_monetaires'];
    
    notebookFields.forEach(field => {
            // If it's an array (old format), join it to string
            if (Array.isArray(parsed.page2[field])) {
                parsed.page2[field] = parsed.page2[field].filter((x:any) => x && x.trim() !== '').join('\n');
            } 
            // If it doesn't exist or is invalid, init as empty string
            else if (typeof parsed.page2[field] !== 'string') {
                parsed.page2[field] = '';
            }
    });

    if (parsed.page2.personalite) {
            delete parsed.page2.personalite;
    }

    // Migration 7: Increase Reputation to 7 lines (previously 3 or 6)
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

    // Migration 9: Convert Notes from string[] to string
    if (Array.isArray(parsed.page2.notes)) {
            parsed.page2.notes = parsed.page2.notes.filter((n: string) => n && n.trim() !== '').join('\n');
    } else if (typeof parsed.page2.notes !== 'string') {
            parsed.page2.notes = '';
    }

    // Migration 10: Convert Equipement from string[] to string
    if (Array.isArray(parsed.page2.equipement)) {
            parsed.page2.equipement = parsed.page2.equipement.filter((n: string) => n && n.trim() !== '').join('\n');
    } else if (typeof parsed.page2.equipement !== 'string') {
            parsed.page2.equipement = '';
    }

    // Migration 29: Add Character Image
    if (typeof parsed.page2.characterImage === 'undefined') {
        parsed.page2.characterImage = '';
    }

    // Migration 30: Convert Armes List from string[] to string
    if (Array.isArray(parsed.page2.armes_list)) {
        parsed.page2.armes_list = parsed.page2.armes_list.filter((n: string) => n && n.trim() !== '').join('\n');
    } else if (typeof parsed.page2.armes_list !== 'string') {
        parsed.page2.armes_list = '';
    }

    // Migration 8: Add Specializations
    if (!parsed.specializations) {
        parsed.specializations = {};
    }

    // Migration 12: Add XP Logs
    if (!parsed.xpLogs) {
        parsed.xpLogs = [];
    }

    // Migration 13 & 25: Add MJ and Spending Location to XP logs
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
    
    // Migration 14: Add imposedSpecializations
    if (!parsed.imposedSpecializations) {
        parsed.imposedSpecializations = {};
    }

    // Migration 15: Add App Logs
    if (!parsed.appLogs) {
        parsed.appLogs = [];
    }
    
    // Migration 16: Add Creation Config and creationValue to skills/counters/attributes if missing
    if (!parsed.creationConfig) {
        parsed.creationConfig = INITIAL_DATA.creationConfig;
    }
    
    // Migration 19: Add attribute limits to creationConfig if missing
    if (typeof parsed.creationConfig.attributeMin === 'undefined') {
        parsed.creationConfig.attributeMin = INITIAL_DATA.creationConfig.attributeMin;
    }
    if (typeof parsed.creationConfig.attributeMax === 'undefined') {
        parsed.creationConfig.attributeMax = INITIAL_DATA.creationConfig.attributeMax;
    }
    // New: Attribute Cost
    if (typeof parsed.creationConfig.attributeCost === 'undefined') {
        parsed.creationConfig.attributeCost = INITIAL_DATA.creationConfig.attributeCost;
    }
    
    // Migration 18: Add Card Config
    if (!parsed.creationConfig.cardConfig) {
        parsed.creationConfig.cardConfig = INITIAL_DATA.creationConfig.cardConfig;
    }
    
    // Migration 20: Add Library
    if (!parsed.library) {
        parsed.library = [];
    }

    // Migration Terminology Library: Vertu->Avantage, Defaut->Desavantage
    if (parsed.library) {
        parsed.library = parsed.library.map((l: any) => ({
            ...l,
            type: l.type === 'vertu' ? 'avantage' : (l.type === 'defaut' ? 'desavantage' : l.type),
            tags: Array.isArray(l.tags) ? l.tags : []
        }));
    }

    // Migration 26: Add Campaign Notes
    if (!parsed.campaignNotes) {
        parsed.campaignNotes = [];
    }

    // Migration 27: Add Party Notes
    if (!parsed.partyNotes) {
        parsed.partyNotes = INITIAL_DATA.partyNotes;
    }
    
    // Migration 28: Add Static Column Widths if missing
    if (parsed.partyNotes && !parsed.partyNotes.staticColWidths) {
        parsed.partyNotes.staticColWidths = INITIAL_DATA.partyNotes.staticColWidths;
    }

    // Migration 23: Ensure all skill categories are present
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

    // Helper to ensure creationValue exists
    const ensureCreationValue = (list: any[]) => {
        return list.map(item => {
            if (typeof item.creationValue === 'undefined') return { ...item, creationValue: 0 }; // Assume 0 for old skills
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

function App() {
  // --- State ---
  const [data, setData] = useState<CharacterSheetData>(() => {
    const saved = localStorage.getItem('rpg-sheet-data');
    if (saved) {
        try {
            const migrated = migrateData(JSON.parse(saved));
            // FORCE DISABLE CREATION MODE ON LOAD
            if (migrated.creationConfig) {
                migrated.creationConfig.active = false;
            }
            return migrated;
        } catch (e) {
            console.error("Error migrating data", e);
            return INITIAL_DATA;
        }
    }
    return INITIAL_DATA;
  });

  // State to track the last "Saved/Exported" state to show visual indicators
  const [lastSavedState, setLastSavedState] = useState<string>("");

  const [mode, setMode] = useState<'sheet' | 'settings' | 'library'>('sheet');
  const [pendingMode, setPendingMode] = useState<'sheet' | 'settings' | 'library' | null>(null);

  const [sheetTab, setSheetTab] = useState<'p1' | 'specs' | 'p2' | 'xp' | 'notes'>('p1');
  const [isLandscape, setIsLandscape] = useState(false);
  
  // Unsaved changes state (Settings specific)
  const [isSettingsDirty, setIsSettingsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Import / Export Modal State
  const [showImportExport, setShowImportExport] = useState(false);
  
  // Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [pagesToPrint, setPagesToPrint] = useState({ p1: true, specs: false, p2: true, xp: false, notes: false });

  // Changelog & Guide Modal State
  const [showChangelog, setShowChangelog] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  
  // Global Logs are now in `data.appLogs`
  const [showLogs, setShowLogs] = useState(false);
  const [historyTab, setHistoryTab] = useState<'sheet' | 'settings'>('sheet');

  const addLog = (message: string, type: 'success' | 'danger' | 'info' = 'info', category: 'sheet' | 'settings' | 'both' = 'sheet', deduplicationId?: string) => {
    setData(prev => {
        const logs = prev.appLogs || [];
        const lastLog = logs[0];

        // Deduplication logic
        if (deduplicationId && lastLog && lastLog.deduplicationId === deduplicationId) {
             const updatedLog = {
                 ...lastLog,
                 message, 
                 timestamp: new Date().toLocaleTimeString() 
             };
             return { ...prev, appLogs: [updatedLog, ...logs.slice(1)] };
        }

        const newLog: LogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            message,
            type,
            category,
            deduplicationId
        };

        return { ...prev, appLogs: [newLog, ...logs] };
    });
  };

  const clearCurrentLogs = () => {
    setData(prev => ({
        ...prev,
        appLogs: prev.appLogs.filter(log => log.category !== historyTab)
    }));
  };

  const filteredLogs = (data.appLogs || []).filter(log => {
      if (log.category === 'both') return true;
      return log.category === historyTab;
  });

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('rpg-sheet-data', JSON.stringify(data));
  }, [data]);

  // Initialize Reference State for Unsaved Indicator
  useEffect(() => {
    setLastSavedState(JSON.stringify(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if current data differs from last saved/exported state
  const hasUnsavedChanges = lastSavedState && JSON.stringify(data) !== lastSavedState;

  // --- Experience Calculation Effect (UPDATED FOR CREATION LOGIC AND TRAIT EFFECTS) ---
  useEffect(() => {
    
    // 0. Extract Active Effects from Traits (Avantages/Désavantages)
    const activeEffects: TraitEffect[] = [];
    
    // Helper to find effects in library based on trait name
    const findEffects = (traitName: string) => {
        if (!traitName) return;
        const entry = data.library?.find(l => l.name.trim().toLowerCase() === traitName.trim().toLowerCase());
        if (entry && entry.effects) {
            entry.effects.forEach(e => activeEffects.push(e));
        }
    };

    data.page2.avantages.forEach(t => findEffects(t.name));
    data.page2.desavantages.forEach(t => findEffects(t.name));

    // Calculate Bonus XP from Traits
    const traitXPBonus = activeEffects
        .filter(e => e.type === 'xp_bonus')
        .reduce((sum, e) => sum + e.value, 0);

    // 1. Calculate Spent XP
    const calculateTotalSpent = (currentData: CharacterSheetData) => {
        let total = 0;
        const triangular = (n: number) => (n * (n + 1)) / 2;

        const getSpentForValue = (value: number, creationValue: number = 0) => {
            if (value === 0) return 0; // SAFETY: If currently 0, cost is 0 regardless of history.
            if (value <= creationValue) return 0;
            // Cost is Total Cost for current value MINUS Total Cost for creation value
            // Example: Creation 2 (Cost 3), Current 4 (Cost 10). Spent = 10 - 3 = 7.
            return triangular(value) - triangular(creationValue);
        };

        // Logic for Free Skill Rank Effect
        const getFreeRankLimit = (skillName: string) => {
            const effect = activeEffects.find(e => 
                e.type === 'free_skill_rank' && 
                e.target && 
                skillName.trim().toLowerCase() === e.target.trim().toLowerCase()
            );
            return effect ? effect.value : 0;
        };

        // Logic for Attribute Bonus Effect (Free Dots)
        const getAttributeBonus = (attrName: string) => {
            const effect = activeEffects.find(e => 
                e.type === 'attribute_bonus' && 
                e.target && 
                attrName.trim().toLowerCase() === e.target.trim().toLowerCase()
            );
            return effect ? effect.value : 0;
        };

        const standardCategories: SkillCategoryKey[] = [
            'talents', 'competences', 'competences_col_2', 'connaissances', 
            'autres_competences', 'autres'
        ];

        standardCategories.forEach(key => {
            const skillList = currentData.skills[key];
            if (Array.isArray(skillList)) {
                skillList.forEach(skill => {
                    // Let's assume Free Rank overrides standard calculation:
                    // Effectively, treat 'freeRankLimit' as a base offset similar to creationValue, but dynamic.
                    const freeLimit = getFreeRankLimit(skill.name);
                    const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);
                    
                    total += getSpentForValue(skill.value, effectiveCreationValue);
                });
            }
        });

        const secondSkills = currentData.skills.competences2;
        if (Array.isArray(secondSkills)) {
            secondSkills.forEach(skill => {
                 const freeLimit = getFreeRankLimit(skill.name);
                 const effectiveCreationValue = Math.max(skill.creationValue || 0, freeLimit);
                 const cost = getSpentForValue(skill.value, effectiveCreationValue);
                 total += cost / 2;
            });
        }

        const backgroundSkills = currentData.skills.arrieres_plans;
        if (Array.isArray(backgroundSkills)) {
            backgroundSkills.forEach(skill => {
                if (skill.value === 0) return; 
                const diff = Math.max(0, skill.value - (skill.creationValue || 0));
                total += diff * 2;
            });
        }

        // Loop over dynamic attributes
        // Get configured cost or default to 6
        const attrCostMult = currentData.creationConfig.attributeCost || 6;

        if (currentData.attributeSettings) {
            currentData.attributeSettings.forEach(cat => {
                // Main attributes
                const attrs = currentData.attributes[cat.id];
                // Optional Secondary Attributes
                const secAttrs = currentData.secondaryAttributesActive ? currentData.secondaryAttributes[cat.id] : [];
                
                const allAttrs = [...(attrs || []), ...(secAttrs || [])];

                if (allAttrs) {
                    allAttrs.forEach(attr => {
                        const val = attr.val1 || 0;
                        if (val === 0) return;
                        
                        // Check for attribute bonus logic
                        const bonus = getAttributeBonus(attr.name);
                        const effectiveCreation = (attr.creationVal1 || 0) + bonus;
                        
                        const diff1 = Math.max(0, val - effectiveCreation);
                        
                        total += diff1 * attrCostMult;
                    });
                }
            });
        }

        return total;
    };

    const calculateTotalGain = (currentData: CharacterSheetData) => {
        return (currentData.xpLogs || []).reduce((sum, entry) => sum + (entry.amount || 0), 0);
    };

    const spent = calculateTotalSpent(data);
    const gainFromLogs = calculateTotalGain(data);
    
    // Total Gain = Logs + Traits Bonus
    const totalGain = gainFromLogs + traitXPBonus;
    
    // Display String can show breakdown if there is a bonus
    const gainString = traitXPBonus > 0 
        ? `${gainFromLogs} (+${traitXPBonus})` 
        : gainFromLogs.toString();

    const rest = totalGain - spent;

    if (data.experience.spent !== spent.toString() || 
        data.experience.rest !== rest.toString() ||
        data.experience.gain !== gainString) {
        
        setData(prev => ({
            ...prev,
            experience: {
                ...prev.experience,
                gain: gainString,
                spent: spent.toString(),
                rest: rest.toString()
            }
        }));
    }

  }, [data.skills, data.attributes, data.secondaryAttributes, data.secondaryAttributesActive, data.xpLogs, data.attributeSettings, data.creationConfig.attributeCost, data.page2.avantages, data.page2.desavantages, data.library]);

  // --- Handlers ---
  const handlePrintRequest = () => {
      setShowPrintModal(true);
  };

  const handlePrintConfirm = (selection: { p1: boolean, specs: boolean, p2: boolean, xp: boolean, notes: boolean }) => {
    setPagesToPrint(selection);
    setShowPrintModal(false);
    
    setTimeout(() => {
        if (isLandscape) {
            const style = document.createElement('style');
            style.innerHTML = `@page { size: landscape; margin: 0; }`;
            style.id = 'print-landscape-style';
            document.head.appendChild(style);
        } else {
            const style = document.createElement('style');
            style.innerHTML = `@page { size: A4 portrait; margin: 0; }`;
            style.id = 'print-portrait-style';
            document.head.appendChild(style);
        }
        window.print();
        
        document.getElementById('print-landscape-style')?.remove();
        document.getElementById('print-portrait-style')?.remove();
    }, 500);
  };

  const handleSwitchMode = (targetMode: 'sheet' | 'settings' | 'library') => {
    if (mode === targetMode) return;
    
    if (mode === 'settings' && isSettingsDirty) {
        setPendingMode(targetMode);
        setShowDiscardConfirm(true);
    } else {
        setMode(targetMode);
    }
  };

  const confirmDiscard = () => {
      setIsSettingsDirty(false);
      setShowDiscardConfirm(false);
      if (pendingMode) {
          setMode(pendingMode);
          setPendingMode(null);
      } else {
          setMode('sheet');
      }
  };

  const handleValidateCreation = () => {
      // 1. Deactivate creation mode
      setData(prev => ({
          ...prev,
          creationConfig: {
              ...prev.creationConfig,
              active: false
          }
      }));
      addLog("Création de personnage validée. Mode création désactivé.", 'success', 'sheet');
  };
  
  return (
    <div className="min-h-screen pb-10">
      {/* Navigation / Toolbar (Hidden in Print) */}
      <nav className="bg-gray-800 text-white px-4 shadow-md no-print sticky top-0 z-50 h-14 flex items-center">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center w-full">
          {/* Left: Logo Area -> Now Portrait/Landscape Switcher */}
          <div className="flex items-center gap-2 font-bold text-lg mr-4">
             {/* Portrait/Landscape Button moved here */}
             <button
                onClick={() => setIsLandscape(!isLandscape)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                    isLandscape 
                    ? 'bg-indigo-600 text-white border border-indigo-400' 
                    : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                }`}
                title={isLandscape ? "Passer en Portrait" : "Passer en Paysage"}
             >
                {isLandscape ? <Monitor size={18} /> : <Smartphone size={18} className="rotate-90" />}
                <span className="hidden md:inline">{isLandscape ? "Paysage" : "Portrait"}</span>
             </button>
          </div>

          {/* Center: Main Navigation Tabs */}
          <div className="flex items-center gap-2 mr-auto">
             <button 
                onClick={() => handleSwitchMode('sheet')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all font-bold ${
                    mode === 'sheet' 
                    ? 'bg-blue-600 text-white shadow-lg ring-1 ring-blue-400 scale-105' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
                title="Voir la fiche"
             >
                <FileText size={18} />
                <span className="hidden lg:inline">Fiche de Personnage</span>
             </button>

          </div>

          {/* Right: Actions */}
          <div className="flex gap-2 items-center">
             
             {/* Import / Export Button (Reverted to standard style) */}
             <button 
                onClick={() => setShowImportExport(true)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                title="Sauvegarder / Charger (Fichier)"
            >
                <ArrowRightLeft size={18} /> 
                <span className="hidden lg:inline">Sauvegarder / Charger</span>
            </button>

            {/* Library Button */}
            <button 
                onClick={() => handleSwitchMode('library')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all font-bold ${
                    mode === 'library' 
                    ? 'bg-blue-600 text-white shadow-lg ring-1 ring-blue-400 scale-105' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
                title="Bibliothèque de traits"
            >
                <BookOpen size={18} /> <span className="hidden lg:inline">Bibliothèque de Traits</span>
            </button>

            {/* Configurer Button */}
            <button 
                onClick={() => handleSwitchMode('settings')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all font-bold ${
                    mode === 'settings' 
                    ? 'bg-blue-600 text-white shadow-lg ring-1 ring-blue-400 scale-105' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
                title="Configurer la structure"
            >
                <Settings size={18} /> <span className="hidden lg:inline">Configurer la Fiche</span>
            </button>

            <button 
               onClick={handlePrintRequest}
               className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
               title="Imprimer"
             >
               <Printer size={18} />
             </button>

            <button
                onClick={() => setShowLogs(!showLogs)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                    showLogs ? 'bg-gray-200 text-gray-900' : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                }`}
                title="Historique des actions"
            >
                <History size={18} />
            </button>
            
            <button 
               onClick={() => setShowUserGuide(true)}
               className="ml-2 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border border-teal-500 shadow-sm"
               title="Guide utilisateur"
             >
               <HelpCircle size={18} /> 
               <span className="text-xs font-bold hidden xl:inline">Guide</span>
             </button>

            <button 
               onClick={() => setShowChangelog(true)}
               className="bg-indigo-800 hover:bg-indigo-700 text-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border border-indigo-700"
               title="Journal des modifications"
             >
               <ScrollText size={18} /> 
               <span className="text-xs font-mono font-bold">v{APP_VERSION}</span>
             </button>
          </div>
        </div>
      </nav>

      {/* Logs Panel (Hidden in Print) */}
      <div 
        className={`fixed right-0 top-14 bottom-0 w-80 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 z-[60] flex flex-col no-print ${
            showLogs ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
          {/* Header */}
          <div className="bg-gray-100 border-b border-gray-200">
             <div className="p-3 flex justify-between items-center">
                <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2">
                    <Clock size={16} /> Historique
                </h4>
                <div className="flex items-center gap-1">
                    {filteredLogs.length > 0 && (
                        <button 
                            onClick={clearCurrentLogs} 
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors"
                            title="Vider la liste actuelle"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <button onClick={() => setShowLogs(false)} className="text-gray-500 hover:bg-gray-200 rounded p-1">
                        <X size={16} />
                    </button>
                </div>
             </div>
             {/* Tabs */}
             <div className="flex text-sm font-medium border-t border-gray-200">
                 <button 
                    onClick={() => setHistoryTab('sheet')}
                    className={`flex-1 py-2 text-center transition-colors border-b-2 ${historyTab === 'sheet' ? 'border-blue-500 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                 >
                     Fiche
                 </button>
                 <button 
                    onClick={() => setHistoryTab('settings')}
                    className={`flex-1 py-2 text-center transition-colors border-b-2 ${historyTab === 'settings' ? 'border-blue-500 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                 >
                     Configuration
                 </button>
             </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-50">
              {filteredLogs.length === 0 && (
                  <div className="text-center text-gray-400 text-xs italic mt-4 flex flex-col items-center gap-2">
                     <Clock size={24} className="opacity-20" />
                     <p>Aucune action enregistrée pour {historyTab === 'sheet' ? 'la fiche' : 'la configuration'}</p>
                  </div>
              )}
              {filteredLogs.map((log) => (
                  <div key={log.id} className={`p-2 rounded border text-xs shadow-sm flex flex-col gap-1 animate-in slide-in-from-right-2 fade-in duration-300 ${
                      log.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                      log.type === 'danger' ? 'bg-red-50 border-red-200 text-red-800' :
                      'bg-white border-gray-200 text-gray-700'
                  }`}>
                      <div className="flex justify-between items-center opacity-70 border-b border-black/5 pb-1 mb-1">
                          <span className="font-mono text-[10px]">{log.timestamp}</span>
                      </div>
                      <p>{log.message}</p>
                  </div>
              ))}
          </div>
      </div>

      {/* Main Content (Hidden in Print via CSS) */}
      <main className={`mt-4 flex flex-col items-center gap-4 w-full main-content-area ${data.creationConfig?.active ? 'pb-40' : ''}`}>
        {mode === 'sheet' ? (
           <>
             {/* Sub Navigation for Sheets - Sticky */}
             <div className="sticky top-14 z-40 mb-2 no-print w-full flex justify-center pointer-events-none">
                 <div className="pointer-events-auto flex gap-4 bg-white/90 backdrop-blur p-1.5 rounded-full shadow-lg border border-gray-200 flex-wrap justify-center">
                    <button
                        onClick={() => setSheetTab('p1')}
                        className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'p1' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Layers size={16} /> Personnage
                    </button>
                    <button
                        onClick={() => setSheetTab('specs')}
                        className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'specs' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <List size={16} /> Spécialisations
                    </button>
                    <button
                        onClick={() => setSheetTab('p2')}
                        className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'p2' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <FileType size={16} /> Détails & Equipement
                    </button>
                    <button
                        onClick={() => setSheetTab('xp')}
                        className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'xp' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <TrendingUp size={16} /> Gestion XP
                    </button>
                    <button
                        onClick={() => setSheetTab('notes')}
                        className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'notes' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Book size={16} /> Notes de Campagne
                    </button>
                 </div>
             </div>

             {/* Standard Screen View - Uses existing logic for toggling */}
             <div className="w-full overflow-x-auto flex px-2 md:px-0 pb-8">
                 <div className={`${sheetTab === 'p1' ? 'block' : 'hidden'} mx-auto`}>
                    <CharacterSheet data={data} onChange={setData} isLandscape={isLandscape} onAddLog={addLog} />
                 </div>
                 <div className={`${sheetTab === 'specs' ? 'block' : 'hidden'} mx-auto`}>
                    <CharacterSheetSpecializations data={data} onChange={setData} isLandscape={isLandscape} onAddLog={addLog} />
                 </div>
                 <div className={`${sheetTab === 'p2' ? 'block' : 'hidden'} mx-auto`}>
                    <CharacterSheetPage2 data={data} onChange={setData} isLandscape={isLandscape} onAddLog={addLog} />
                 </div>
                 <div className={`${sheetTab === 'xp' ? 'block' : 'hidden'} mx-auto`}>
                    <CharacterSheetXP data={data} onChange={setData} isLandscape={isLandscape} onAddLog={addLog} />
                 </div>
                 <div className={`${sheetTab === 'notes' ? 'block' : 'hidden'} mx-auto`}>
                    <CampaignNotes data={data} onChange={setData} isLandscape={isLandscape} onAddLog={addLog} />
                 </div>
             </div>

             {/* Creation Mode HUD */}
             {data.creationConfig?.active && (
                 <CreationHUD data={data} onValidate={handleValidateCreation} />
             )}

           </>
        ) : mode === 'library' ? (
            <div className="max-w-4xl mx-auto w-full p-4 h-[calc(100vh-80px)]">
                <TraitLibrary data={data} onUpdate={setData} />
            </div>
        ) : (
           <SettingsView 
              data={data} 
              onUpdate={(newData) => {
                  setData(prev => ({ ...newData, appLogs: prev.appLogs }));
              }} 
              onClose={() => setMode('sheet')} 
              onDirtyChange={setIsSettingsDirty}
              onAddLog={addLog}
            />
        )}
      </main>

      {/* 
        --------------------------------------------------------
        PRINT DEDICATED AREA
        This area is HIDDEN on screen, and ONLY VISIBLE on Print.
        It renders EXACTLY the selected pages, one after another.
        CSS handles the page breaking automatically via :last-child
        --------------------------------------------------------
      */}
      <div id="printable-area" className="hidden">
           {pagesToPrint.p1 && (
               <div className="print-sheet-wrapper">
                    <CharacterSheet data={data} onChange={setData} isLandscape={isLandscape} onAddLog={addLog} />
               </div>
           )}
           {pagesToPrint.specs && (
               <div className="print-sheet-wrapper">
                    <CharacterSheetSpecializations data={data} onChange={setData} isLandscape={isLandscape} onAddLog={addLog} />
               </div>
           )}
           {pagesToPrint.p2 && (
               <div className="print-sheet-wrapper">
                    <CharacterSheetPage2 data={data} onChange={setData} isLandscape={isLandscape} onAddLog={addLog} />
               </div>
           )}
           {pagesToPrint.xp && (
               <div className="print-sheet-wrapper">
                    <CharacterSheetXP data={data} onChange={setData} isLandscape={isLandscape} onAddLog={addLog} />
               </div>
           )}
           {pagesToPrint.notes && (
               <div className="print-sheet-wrapper">
                    <CampaignNotes data={data} onChange={setData} isLandscape={isLandscape} onAddLog={addLog} />
               </div>
           )}
      </div>

      {/* Import / Export Modal */}
      <ImportExportModal 
        isOpen={showImportExport} 
        onClose={() => setShowImportExport(false)} 
        data={data}
        onImport={(newData) => {
            const migrated = migrateData(newData);
            setData(migrated);
            setShowImportExport(false);
            setMode('sheet');
            setIsSettingsDirty(false);
        }}
        onAddLog={addLog}
      />

      {/* Print Selection Modal */}
      <PrintSelectionModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        onConfirm={handlePrintConfirm}
      />

      {/* Settings Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Modifications non sauvegardées</h3>
                    <p className="text-gray-600 text-sm">
                        Vous avez modifié la structure de la fiche sans sauvegarder. 
                        Si vous quittez maintenant, ces changements seront perdus.
                    </p>
                    <div className="flex gap-3 w-full mt-2">
                        <button 
                            onClick={() => setShowDiscardConfirm(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button 
                            onClick={confirmDiscard}
                            className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700"
                        >
                            Quitter sans sauver
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {/* Changelog Modal */}
      <ChangelogModal 
        isOpen={showChangelog} 
        onClose={() => setShowChangelog(false)} 
      />

      {/* User Guide Modal */}
      <UserGuideModal 
        isOpen={showUserGuide}
        onClose={() => setShowUserGuide(false)}
      />

    </div>
  );
}

export default App;
