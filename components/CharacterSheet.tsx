
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { CharacterSheetData, DotEntry, AttributeEntry, CombatEntry, SkillCategoryKey, TraitEffect } from '../types';
import DotRating from './DotRating';
import { UserPlus, AlertTriangle } from 'lucide-react';

interface Props {
  data: CharacterSheetData;
  onChange: (newData: CharacterSheetData) => void;
  isLandscape?: boolean;
  onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void;
}

// --- Sub-components defined OUTSIDE to prevent remounting on re-renders ---

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="bg-slate-200 text-slate-800 text-center font-bold text-xs border-y border-stone-400 uppercase py-0.5 tracking-wide shadow-sm">
    {title}
  </div>
);

const HeaderInput: React.FC<{ 
  label: string; 
  value: string; 
  onChange: (val: string) => void; 
  className?: string;
}> = ({ label, value, onChange, className = '' }) => (
  <div className={`flex items-baseline px-2 py-0.5 h-full ${className}`}>
    <span className="text-[10px] font-bold mr-1 whitespace-nowrap uppercase text-stone-500 tracking-wider shrink-0 leading-none">{label} :</span>
    <input 
      className="sheet-input text-sm w-full min-w-0" // min-w-0 allows flex shrink
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
    />
  </div>
);

interface BonusInfo {
    value: number;
    sources: string[];
}

const AttributeRow: React.FC<{ 
    entry: AttributeEntry, 
    category: string,
    onUpdate: (category: string, id: string, field: 'val1' | 'val2' | 'val3', value: string) => void;
    bonus?: BonusInfo;
}> = ({ entry, category, onUpdate, bonus }) => {
    const ref1 = useRef<HTMLInputElement>(null);
    const ref2 = useRef<HTMLInputElement>(null);
    const ref3 = useRef<HTMLInputElement>(null);

    const bonusValue = bonus?.value || 0;
    
    // Parse strings safely for total calculation
    const v1 = parseInt(entry.val1) || 0;
    const v2 = parseInt(entry.val2) || 0;
    const v3 = parseInt(entry.val3) || 0;
    
    const baseTotal = v1 + v2 + v3;
    const total = baseTotal + bonusValue;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextRef?: React.RefObject<HTMLInputElement>) => {
        if (e.key === 'Enter') {
             e.preventDefault();
             if (nextRef && nextRef.current) {
                 nextRef.current.focus();
             } else {
                 e.currentTarget.blur();
             }
        }
    };

    // Construct tooltip text
    let tooltip = `Total : ${total}`;
    if (bonusValue !== 0 && bonus) {
        tooltip = `Base : ${baseTotal}\nModificateurs : ${bonusValue > 0 ? '+' : ''}${bonusValue}\n\nSources :\n${bonus.sources.map(s => `- ${s}`).join('\n')}`;
    }

    return (
      <div className="flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs hover:bg-stone-50 transition-colors">
          <span className="w-24 truncate font-semibold text-stone-700">{entry.name}</span>
          <div className="flex items-center gap-1 flex-grow justify-end">
              <input 
                  ref={ref1}
                  className="w-6 h-5 text-center border-b border-stone-300 focus:border-blue-500 outline-none bg-transparent font-handwriting text-ink text-sm hover:bg-white/50 no-spinner"
                  value={entry.val1}
                  onChange={(e) => onUpdate(category, entry.id, 'val1', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, ref2)}
                  onFocus={(e) => e.target.select()}
                  placeholder=""
                  type="text"
                  inputMode="numeric"
              />
              <span className="text-stone-400 font-handwriting">+</span>
              <input 
                  ref={ref2}
                  className="w-6 h-5 text-center border-b border-stone-300 focus:border-blue-500 outline-none bg-transparent font-handwriting text-ink text-sm hover:bg-white/50 no-spinner"
                  value={entry.val2}
                  onChange={(e) => onUpdate(category, entry.id, 'val2', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, ref3)}
                  onFocus={(e) => e.target.select()}
                  placeholder=""
                  type="text"
                  inputMode="numeric"
              />
              <span className="text-stone-400 font-handwriting">+</span>
              <input 
                  ref={ref3}
                  className="w-6 h-5 text-center border-b border-stone-300 focus:border-blue-500 outline-none bg-transparent font-handwriting text-ink text-sm hover:bg-white/50 no-spinner"
                  value={entry.val3}
                  onChange={(e) => onUpdate(category, entry.id, 'val3', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e)}
                  onFocus={(e) => e.target.select()}
                  placeholder=""
                  type="text"
                  inputMode="numeric"
              />
              
              <span className="text-stone-400 font-handwriting">=</span>
              <div 
                className={`w-7 h-5 flex items-center justify-center font-bold rounded border shadow-sm ml-1 font-handwriting text-sm cursor-help transition-colors ${
                    bonusValue > 0 ? 'bg-green-100 text-green-900 border-green-300' :
                    bonusValue < 0 ? 'bg-red-100 text-red-900 border-red-300' :
                    'bg-blue-50 text-blue-900 border-blue-100'
                }`}
                title={tooltip}
              >
                  {total}
              </div>
          </div>
      </div>
    );
};

const AttributeBlock: React.FC<{ 
  title: string; 
  items: AttributeEntry[]; 
  cat: string; 
  onUpdate: (category: string, id: string, field: 'val1' | 'val2' | 'val3', value: string) => void;
  bonuses: Record<string, BonusInfo>;
  secondaryItems?: AttributeEntry[];
}> = ({ title, items, cat, onUpdate, bonuses, secondaryItems }) => {
  return (
      <div className="flex flex-col border-r last:border-r-0 border-stone-400 h-full">
        <SectionHeader title={title} />
        <div className="flex-grow p-0">
          {(items || []).map(item => (
            <AttributeRow 
               key={item.id} 
               entry={item} 
               category={cat} 
               onUpdate={onUpdate}
               bonus={bonuses[item.name.trim().toLowerCase()]}
            />
          ))}
          
          {secondaryItems && secondaryItems.length > 0 && (
              <>
                {/* Visual Demarcation */}
                <div className="h-px bg-stone-300 border-t border-dotted border-stone-400 mx-1 my-0.5"></div>
                {secondaryItems.map(item => (
                    <AttributeRow 
                        key={item.id} 
                        entry={item} 
                        category={cat} 
                        onUpdate={onUpdate}
                        bonus={bonuses[item.name.trim().toLowerCase()]}
                    />
                ))}
              </>
          )}
        </div>
      </div>
  );
};

const DotRow: React.FC<{ 
  entry: DotEntry; 
  category: string; 
  onUpdate: (section: 'skills', category: string, id: string, value: number) => void;
  specializations?: string[];
}> = ({ entry, category, onUpdate, specializations = [] }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Spacer logic
    if (!entry.name) {
       return <div className="h-5 border-b border-transparent"></div>;
    }

    const validSpecs = specializations.filter(s => s && s.trim() !== '');
    const hasSpecs = validSpecs.length > 0;

    return (
        <div 
            className="flex justify-between items-center px-2 border-b border-dotted border-stone-300 h-5 hover:bg-stone-50 transition-colors relative group"
            onMouseLeave={() => setIsOpen(false)}
        >
          <span 
            className={`text-xs truncate w-[60%] font-medium transition-colors ${hasSpecs ? 'text-blue-900 font-semibold cursor-help' : 'text-stone-700 cursor-default'}`}
            onClick={() => hasSpecs && setIsOpen(true)}
          >
              {entry.name}
              {hasSpecs && <span className="text-[9px] align-top ml-0.5 text-blue-400">*</span>}
          </span>
          
          {/* Tooltip for Specializations */}
          {isOpen && hasSpecs && (
              <div className="absolute z-[100] left-4 bottom-full mb-1 w-max max-w-[200px] bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl animate-in fade-in zoom-in duration-150 pointer-events-none">
                  <div className="font-bold border-b border-slate-600 mb-1 pb-1 text-slate-300">
                      Spécialisations
                  </div>
                  <ul className="list-disc list-inside space-y-0.5">
                      {validSpecs.map((s, i) => (
                          <li key={i} className="truncate">{s}</li>
                      ))}
                  </ul>
                  {/* Arrow */}
                  <div className="absolute left-6 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800"></div>
              </div>
          )}

          <DotRating 
            value={entry.value}
            creationValue={entry.creationValue} 
            onChange={(val) => onUpdate('skills', category, entry.id, val)} 
            className="scale-90 origin-right"
          />
        </div>
    );
};

const SkillBlock: React.FC<{ 
  title: string; 
  items: DotEntry[]; 
  cat: string;
  onUpdate: (section: 'skills', category: string, id: string, value: number) => void;
  userSpecs?: Record<string, string[]>;
  imposedSpecs?: Record<string, string[]>;
}> = ({ title, items, cat, onUpdate, userSpecs = {}, imposedSpecs = {} }) => (
    <div className="flex flex-col h-full">
        <SectionHeader title={title} />
        <div className="flex-grow py-1">
            {(items || []).map(item => {
                // Combine specs for this specific item
                const uSpecs = userSpecs[item.id] || [];
                const iSpecs = imposedSpecs[item.id] || [];
                // Imposed specs first, then user specs
                const combinedSpecs = [...iSpecs, ...uSpecs];

                return (
                    <DotRow 
                        key={item.id} 
                        entry={item} 
                        category={cat} 
                        onUpdate={onUpdate} 
                        specializations={combinedSpecs}
                    />
                );
            })}
        </div>
    </div>
  );

const CharacterSheet: React.FC<Props> = ({ data, onChange, isLandscape = false, onAddLog }) => {
  const [showCreationWarning, setShowCreationWarning] = useState(false);

  // --- Reset Helper Logic (Duplicated from SettingsView logic to avoid circular deps or complex refactor) ---
  const resetCharacterValues = (source: CharacterSheetData): CharacterSheetData => {
      const clean = JSON.parse(JSON.stringify(source));
      
      // Reset Header (keep structure)
      Object.keys(clean.header).forEach((k: keyof typeof clean.header) => clean.header[k] = "");
      
      // Reset XP
      clean.experience = { gain: '0', spent: '0', rest: '0' };
      clean.xpLogs = [];
      clean.appLogs = [];

      // Attributes
      if (clean.attributes) {
          Object.keys(clean.attributes).forEach((cat: string) => {
              if (Array.isArray(clean.attributes[cat])) {
                  clean.attributes[cat].forEach((attr: any) => {
                      attr.val1 = ""; attr.val2 = ""; attr.val3 = "";
                      attr.creationVal1 = 0; attr.creationVal2 = 0; attr.creationVal3 = 0;
                  });
              }
          });
      }
      
      // Secondary Attributes
      if (clean.secondaryAttributes) {
          Object.keys(clean.secondaryAttributes).forEach((cat: string) => {
              if (Array.isArray(clean.secondaryAttributes[cat])) {
                  clean.secondaryAttributes[cat].forEach((attr: any) => {
                      attr.val1 = ""; attr.val2 = ""; attr.val3 = "";
                      attr.creationVal1 = 0; attr.creationVal2 = 0; attr.creationVal3 = 0;
                  });
              }
          });
      }

      // Skills
      Object.keys(clean.skills).forEach((cat: string) => {
          clean.skills[cat].forEach((skill: any) => {
              skill.value = 0;
              skill.creationValue = 0;
              if (typeof skill.current !== 'undefined') skill.current = 0;
          });
      });

      // Combat
      clean.combat.weapons.forEach((w: any) => { w.weapon=""; w.level=""; w.init=""; w.attack=""; w.damage=""; w.parry=""; });
      clean.combat.armor.forEach((a: any) => { a.type=""; a.protection=""; a.weight=""; });
      clean.combat.stats = { agility: '', dexterity: '', force: '', size: '' };

      // Page 2
      clean.page2.lieux_importants = "";
      clean.page2.contacts = "";
      clean.page2.reputation.forEach((r: any) => { r.reputation = ''; r.lieu = ''; r.valeur = ''; });
      clean.page2.connaissances = "";
      clean.page2.valeurs_monetaires = "";
      clean.page2.armes_list = "";
      clean.page2.avantages = Array(28).fill(null).map(() => ({ name: '', value: '' }));
      clean.page2.desavantages = Array(28).fill(null).map(() => ({ name: '', value: '' }));
      clean.page2.equipement = "";
      clean.page2.notes = "";
      clean.page2.characterImage = "";
      clean.page2.characterImageId = undefined;

      // Specializations
      clean.specializations = {};
      
      // Campaign Notes
      clean.campaignNotes = [];
      
      // Counters
      clean.counters.volonte.value = 3; clean.counters.volonte.creationValue = 3; clean.counters.volonte.current = 0;
      clean.counters.confiance.value = 3; clean.counters.confiance.creationValue = 3; clean.counters.confiance.current = 0;
      clean.counters.custom.forEach((c: any) => { c.value = 0; c.creationValue = 0; c.current = 0; });

      return clean;
  };

  const handleToggleCreationMode = () => {
      const isActive = data.creationConfig?.active;
      if (isActive) {
          // Simply deactivate
          onChange({
              ...data,
              creationConfig: {
                  ...data.creationConfig,
                  active: false
              }
          });
          onAddLog("Mode Création DÉSACTIVÉ", 'info', 'sheet');
      } else {
          // Ask for confirmation because it resets data
          setShowCreationWarning(true);
      }
  };

  const executeCreationActivation = () => {
      const resetData = resetCharacterValues(data);
      onChange({
          ...resetData,
          creationConfig: {
              ...resetData.creationConfig,
              active: true
          }
      });
      onAddLog("Mode Création ACTIVÉ - Fiche réinitialisée", 'success', 'sheet');
      setShowCreationWarning(false);
  };

  // --- Calculation: Attribute Bonuses from Traits ---
  const attributeBonuses = useMemo(() => {
      const bonuses: Record<string, BonusInfo> = {};
      const allTraits = [...(data.page2.avantages || []), ...(data.page2.desavantages || [])];

      allTraits.forEach(trait => {
          if (!trait.name) return;
          // Find corresponding library entry to get active effects
          const libEntry = data.library?.find(l => l.name.trim().toLowerCase() === trait.name.trim().toLowerCase());
          
          if (libEntry && libEntry.effects) {
              libEntry.effects.forEach(effect => {
                  if (effect.type === 'attribute_bonus' && effect.target) {
                      const targetName = effect.target.trim().toLowerCase();
                      
                      if (!bonuses[targetName]) {
                          bonuses[targetName] = { value: 0, sources: [] };
                      }
                      
                      bonuses[targetName].value += effect.value;
                      bonuses[targetName].sources.push(`${trait.name} (${effect.value > 0 ? '+' : ''}${effect.value})`);
                  }
              });
          }
      });
      return bonuses;
  }, [data.page2.avantages, data.page2.desavantages, data.library]);

  const updateHeader = (field: keyof typeof data.header, value: string) => {
    onChange({ ...data, header: { ...data.header, [field]: value } });
    onAddLog(`En-tête modifiée : ${String(field)} = "${value}"`, 'info', 'sheet', `header_${String(field)}`);
  };

  const updateDot = (section: 'skills', category: string, id: string, value: number) => {
    // @ts-ignore - dynamic access
    const list = data[section]?.[category] as DotEntry[];
    if (!list) return;

    const isCreationMode = data.creationConfig && data.creationConfig.active;
    
    // When in creation mode, update BOTH value and creationValue
    // When NOT in creation mode, update ONLY value
    const newList = list.map(item => {
        if (item.id !== id) return item;

        if (isCreationMode) {
            return { ...item, value, creationValue: value };
        } else {
            // Ensure we don't go BELOW creationValue unless user explicitly resets (which shouldn't happen via simple click usually)
            // But for now, allow standard editing.
            return { ...item, value };
        }
    });

    const itemName = list.find(item => item.id === id)?.name || 'Compétence';

    onChange({
      ...data,
      [section]: {
        // @ts-ignore
        ...data[section],
        [String(category)]: newList
      }
    });
    onAddLog(`Modification ${String(itemName)} : ${value}`, 'info', 'sheet', `dot_${String(id)}`);
  };

  const updateAttribute = (category: string, id: string, field: 'val1' | 'val2' | 'val3', value: string) => {
      // Check if it's a main attribute
      const mainList = data.attributes?.[String(category)];
      const mainIndex = mainList ? mainList.findIndex(item => item.id === id) : -1;

      // Determine numeric value for creation logic (safely)
      const numValue = parseInt(value) || 0;

      if (mainIndex !== -1 && mainList) {
          const isCreationMode = data.creationConfig && data.creationConfig.active;
          const newList = [...mainList];
          const item = newList[mainIndex];

          if (isCreationMode) {
              const creationKey = `creation${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof AttributeEntry;
              // Update string value AND creation number value
              newList[mainIndex] = { ...item, [field]: value, [creationKey]: numValue };
          } else {
              newList[mainIndex] = { ...item, [field]: value };
          }

          onChange({
              ...data,
              attributes: {
                  ...data.attributes,
                  [String(category)]: newList
              }
          });
          onAddLog(`Attribut ${item.name} modifié`, 'info', 'sheet', `attr_${String(id)}_${field}`);
          return;
      }

      // Check if it's a secondary attribute
      if (data.secondaryAttributes && data.secondaryAttributes[String(category)]) {
          const secList = data.secondaryAttributes[String(category)];
          const secIndex = secList.findIndex(item => item.id === id);

          if (secIndex !== -1) {
              const isCreationMode = data.creationConfig && data.creationConfig.active;
              const newList = [...secList];
              const item = newList[secIndex];

              if (isCreationMode) {
                  const creationKey = `creation${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof AttributeEntry;
                  newList[secIndex] = { ...item, [field]: value, [creationKey]: numValue };
              } else {
                  newList[secIndex] = { ...item, [field]: value };
              }

              onChange({
                  ...data,
                  secondaryAttributes: {
                      ...data.secondaryAttributes,
                      [String(category)]: newList
                  }
              });
              onAddLog(`Attribut ${item.name} modifié`, 'info', 'sheet', `attr_sec_${String(id)}_${field}`);
          }
      }
  };

  const updateExperience = (field: keyof typeof data.experience, value: string) => {
    onChange({ ...data, experience: { ...data.experience, [field]: value } });
  };

  const updateCombatWeapon = (id: string, field: keyof CombatEntry, value: string) => {
    const newWeapons = (data.combat.weapons || []).map(w => w.id === id ? { ...w, [field]: value } : w);
    onChange({ ...data, combat: { ...data.combat, weapons: newWeapons } });
    onAddLog(`Arme modifiée (${String(field)})`, 'info', 'sheet', `weapon_${String(id)}_${String(field)}`);
  };

  const updateArmor = (index: number, field: keyof typeof data.combat.armor[0], value: string) => {
    const newArmor = [...(data.combat.armor || [])];
    if (newArmor[index]) {
        newArmor[index] = { ...newArmor[index], [field]: value };
        onChange({ ...data, combat: { ...data.combat, armor: newArmor } });
        onAddLog(`Armure modifiée (${String(field)})`, 'info', 'sheet', `armor_${index}_${String(field)}`);
    }
  };

  const updateCounter = (id: string, value: number, isCustom = false, field: 'value' | 'current' = 'value') => {
      let counterName = '';
      const isCreationMode = data.creationConfig && data.creationConfig.active;

      if (isCustom) {
          const newCustom = (data.counters.custom || []).map(c => {
             if (c.id !== id) return c;
             const newItem = { ...c };

             if (field === 'value') {
                 newItem.value = value;
                 if (isCreationMode) newItem.creationValue = value;
                 // Clamp current usage if max reduced
                 if ((newItem.current || 0) > value) newItem.current = value;
             } else {
                 // Clamp usage to max
                 newItem.current = Math.min(value, newItem.value);
             }
             return newItem;
          });
          onChange({ ...data, counters: { ...data.counters, custom: newCustom }});
          counterName = (data.counters.custom || []).find(c => c.id === id)?.name || 'Compteur';
      } else {
          // @ts-ignore
          const current = data.counters[String(id)];
          const newItem = { ...current };

          if (field === 'value') {
              newItem.value = value;
              if (isCreationMode) newItem.creationValue = value;
              if ((newItem.current || 0) > value) newItem.current = value;
          } else {
              newItem.current = Math.min(value, newItem.value);
          }

          onChange({ 
              ...data, 
              counters: { 
                  ...data.counters, 
                  [String(id)]: newItem
              } 
          });
          // @ts-ignore
          counterName = data.counters[id].name;
      }
      onAddLog(`Modification ${String(counterName)} (${field === 'value' ? 'Maxi' : 'Utilisé'}) : ${value}`, 'info', 'sheet', `counter_${String(id)}_${String(field)}`);
  };

  // --- Card Calculation Logic ---
  const calculateCard = (): string | null => {
      // Check if feature is active
      const cardConfig = data.creationConfig?.cardConfig;
      if (!cardConfig || !cardConfig.active) return null;

      // 1. Gather all skills EXCLUDING background (arrieres_plans)
      const allSkills: number[] = [];
      Object.keys(data.skills).forEach(key => {
          if (key === 'arrieres_plans') return;
          // @ts-ignore
          const list = data.skills[key] || [];
          list.forEach((skill: DotEntry) => {
              if (skill.name && skill.value > 0) {
                  allSkills.push(skill.value);
              }
          });
      });

      // 2. Sort Descending
      allSkills.sort((a, b) => b - a);

      // 3. Take Top N
      const n = cardConfig.bestSkillsCount;
      const topSkills = allSkills.slice(0, n);
      
      // If not enough skills, treat missing as 0
      while (topSkills.length < n) {
          topSkills.push(0);
      }

      // 4. Calculate Average
      const sum = topSkills.reduce((a, b) => a + b, 0);
      const average = sum / n;

      // 5. Determine Card
      const delta = average - cardConfig.baseStart;
      const steps = Math.floor((delta + 0.0001) / cardConfig.increment);
      
      let cardName = "Aucune";
      
      if (steps >= 1) {
          const globalIndex = steps - 1; // 0-based index
          const rankIndex = Math.floor(globalIndex / 4); // 0=Valet, 1=Dame, 2=Roi
          const countIndex = globalIndex % 4; // 0=Un, 1=Deux, ...

          const counts = ["Un", "Deux", "Trois", "Quatre"];
          const ranksSingular = ["Valet", "Dame", "Roi"];
          const ranksPlural = ["Valets", "Dames", "Rois"];

          if (rankIndex < 3) {
              const countStr = counts[countIndex];
              const rankStr = countIndex === 0 ? ranksSingular[rankIndex] : ranksPlural[rankIndex];
              cardName = `${countStr} ${rankStr}`;
          } else {
              cardName = "Quatre Rois (Max)";
          }
      }

      return cardName;
  };

  const cardValue = calculateCard();

  // --- Dynamic Layout Calculation for Landscape Mode ---
  const getDynamicColumns = () => {
    // Helper to safely get items, defaulting to empty array if category missing
    const getItems = (cat: SkillCategoryKey) => data.skills[cat] || [];

    // Setup the 5 fixed-position columns with their anchor lists
    // We assume item height + header overhead (~2 items)
    const columns = [
        { 
            id: 0, 
            blocks: [{ title: 'Talents', items: getItems('talents'), cat: 'talents' }], 
            height: getItems('talents').length + 2 
        },
        { 
            id: 1, 
            blocks: [{ title: 'Compétences', items: getItems('competences'), cat: 'competences' }], 
            height: getItems('competences').length + 2 
        },
        { 
            id: 2, 
            blocks: [{ title: 'Compétences', items: getItems('competences_col_2'), cat: 'competences_col_2' }], 
            height: getItems('competences_col_2').length + 2 
        },
        { 
            id: 3, 
            blocks: [{ title: 'Connaissances', items: getItems('connaissances'), cat: 'connaissances' }], 
            height: getItems('connaissances').length + 2 
        },
        { 
            id: 4, 
            blocks: [] as {title: string, items: DotEntry[], cat: string}[], 
            height: 0 
        }
    ];

    // The floating widgets that need to be placed
    const floatingWidgets = [
        { title: 'Autres Compétences', items: getItems('autres_competences'), cat: 'autres_competences' },
        { title: 'Compétences Secondaires', items: getItems('competences2'), cat: 'competences2' },
        { title: 'Autres', items: getItems('autres'), cat: 'autres' },
    ];

    // Distribute them to the shortest column
    floatingWidgets.forEach(widget => {
        if (widget.items.length === 0) return; // Skip empty widgets if desired, or keep them to show headers

        // Find column with min height
        const targetCol = columns.reduce((prev, curr) => (prev.height < curr.height) ? prev : curr);
        
        targetCol.blocks.push(widget);
        targetCol.height += widget.items.length + 2;
    });

    return columns;
  };

  // --- Dynamic Attributes Calculation ---
  const attributeCategories = data.attributeSettings || [
      { id: 'physique', label: 'Physique' },
      { id: 'mental', label: 'Mental' },
      { id: 'social', label: 'Social' }
  ];

  // Logic to determine grid column size for attributes based on count
  // Total span available is 9 (out of 12).
  // 3 categories -> span 3 each (9/3)
  // 4 categories -> span 2 each? No, 2*4=8. Need better fitting.
  // Actually, standard Tailwind grid logic is better.
  const getAttributesGridClass = () => {
      const count = attributeCategories.length;
      if (count === 1) return 'grid-cols-1';
      if (count === 2) return 'grid-cols-2';
      if (count === 3) return 'grid-cols-3';
      if (count === 4) return 'grid-cols-4';
      return 'grid-cols-3'; // fallback
  };

  // --- Layout Renderers ---

  const renderCombatSection = () => (
      <div className="flex flex-col border-t border-stone-800 md:border-t-0 bg-stone-50/50">
          <SectionHeader title="Combat" />
          <div className="flex items-center text-[9px] font-bold border-b border-stone-400 bg-stone-200 text-stone-700 uppercase py-1 text-center tracking-tight">
             <div className="w-[35%] text-left pl-2">Arme</div>
             <div className="w-[10%] border-l border-stone-300">Niv.</div>
             <div className="w-[12%] border-l border-stone-300">Init.</div>
             <div className="w-[12%] border-l border-stone-300">Atk.</div>
             <div className="w-[18%] border-l border-stone-300">Dmg.</div>
             <div className="w-[13%] border-l border-stone-300">Par.</div>
          </div>
          
          <div className="flex-grow">
              {(data.combat.weapons || []).map((w) => (
              <div key={w.id} className="flex items-center text-xs border-b border-dotted border-stone-300 h-[22px] last:border-0 hover:bg-stone-100 transition-colors">
                  <div className="w-[35%] px-1 h-full">
                       <input className="w-full h-full bg-transparent font-bold focus:outline-none placeholder-stone-300 font-handwriting text-ink text-sm" placeholder="Arme..." value={w.weapon} onChange={(e) => updateCombatWeapon(w.id, 'weapon', e.target.value)} />
                  </div>
                  <div className="w-[10%] h-full border-l border-dotted border-stone-300">
                       <input className="w-full h-full bg-transparent text-center text-stone-400 text-xs focus:outline-none font-handwriting text-ink" value={w.level} onChange={(e) => updateCombatWeapon(w.id, 'level', e.target.value)} />
                  </div>
                  <div className="w-[12%] h-full border-l border-dotted border-stone-300">
                       <input className="w-full h-full bg-transparent text-center focus:outline-none font-handwriting text-ink text-sm" value={w.init} onChange={(e) => updateCombatWeapon(w.id, 'init', e.target.value)} />
                  </div>
                  <div className="w-[12%] h-full border-l border-dotted border-stone-300">
                       <input className="w-full h-full bg-transparent text-center focus:outline-none font-handwriting text-ink text-sm" value={w.attack} onChange={(e) => updateCombatWeapon(w.id, 'attack', e.target.value)} />
                  </div>
                  <div className="w-[18%] h-full border-l border-dotted border-stone-300 relative flex items-center justify-center">
                       <input className="w-full h-full bg-transparent text-center focus:outline-none font-handwriting text-ink text-sm" value={w.damage} onChange={(e) => updateCombatWeapon(w.id, 'damage', e.target.value)} />
                  </div>
                  <div className="w-[13%] h-full border-l border-dotted border-stone-300">
                       <input className="w-full h-full bg-transparent text-center focus:outline-none font-handwriting text-ink text-sm" value={w.parry} onChange={(e) => updateCombatWeapon(w.id, 'parry', e.target.value)} />
                  </div>
              </div>
              ))}
          </div>
          
          <div className="border-t border-stone-400 bg-stone-100 p-1">
               {(data.combat.armor || []).map((armor, i) => (
                   <div key={i} className="flex items-center h-[22px] text-xs border-b border-stone-300 last:border-0 border-dotted">
                      <span className="font-bold text-[9px] uppercase w-12 text-stone-700">Armure</span>
                      <input 
                          className="flex-grow bg-transparent border-b border-stone-300 px-1 font-semibold text-sm focus:border-blue-500 outline-none font-handwriting text-ink"
                          value={armor.type}
                          onChange={(e) => updateArmor(i, 'type', e.target.value)}
                      />
                      <div className="flex items-center ml-2 border-l border-stone-300 pl-2">
                           <span className="font-bold text-[9px] uppercase text-stone-500 mr-1">Prot.</span>
                           <input 
                              className="w-8 bg-transparent border-b border-dotted border-stone-300 text-center focus:border-blue-500 outline-none font-handwriting text-ink text-sm"
                              value={armor.protection}
                              onChange={(e) => updateArmor(i, 'protection', e.target.value)}
                           />
                      </div>
                      <div className="flex items-center ml-2 border-l border-stone-300 pl-2">
                           <span className="font-bold text-[9px] uppercase text-stone-500 mr-1">Poids</span>
                           <input 
                              className="w-8 bg-transparent border-b border-dotted border-stone-300 text-center focus:border-blue-500 outline-none font-handwriting text-ink text-sm"
                              value={armor.weight}
                              onChange={(e) => updateArmor(i, 'weight', e.target.value)}
                           />
                      </div>
                   </div>
               ))}
          </div>
      </div>
  );

  const renderCounterItem = (counter: DotEntry, isCustom: boolean) => (
      <div key={counter.id} className="col-span-1 border border-stone-300 bg-white rounded-sm shadow-sm flex items-center p-1 overflow-hidden h-9">
         {/* Title on the left */}
         <div className="w-16 shrink-0 font-bold text-[9px] uppercase tracking-tighter text-stone-800 border-r border-stone-200 mr-1 pr-1 h-full flex items-center break-words leading-none justify-center text-center">
             {counter.name}
         </div>
         
         {/* Right side stacks */}
         <div className="flex flex-col gap-0.5 flex-grow justify-center w-full">
             {/* Maxi */}
             <div className="flex items-center justify-end h-3 pr-1 gap-2">
                 <span className="text-[8px] text-stone-400 font-bold uppercase tracking-tight">Maxi</span>
                 <div className="relative w-[142px] h-3">
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 scale-[0.9] origin-right">
                        <DotRating 
                            value={counter.value} 
                            creationValue={counter.creationValue} 
                            max={10} 
                            onChange={(v) => updateCounter(counter.id, v, isCustom, 'value')} 
                         />
                     </div>
                 </div>
             </div>
             {/* Utilisé */}
             <div className="flex items-center justify-end h-3 pr-1 gap-2">
                 <span className="text-[8px] text-stone-400 font-bold uppercase tracking-tight">Utilisé</span>
                 <div className="relative w-[142px] h-3">
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 scale-[0.9] origin-right flex items-center space-x-1">
                        {Array.from({ length: 10 }).map((_, i) => {
                            if (i >= counter.value) {
                                return <div key={i} className="w-3 h-3" />;
                            }
                            const isChecked = i < (counter.current || 0);
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        const newVal = i + 1;
                                        const currentVal = counter.current || 0;
                                        updateCounter(counter.id, newVal === currentVal ? newVal - 1 : newVal, isCustom, 'current');
                                    }}
                                    className={`w-3 h-3 border border-stone-600 transition-colors ${isChecked ? 'bg-ink' : 'bg-white hover:bg-stone-100'}`}
                                    title="Point utilisé"
                                />
                            );
                        })}
                     </div>
                 </div>
             </div>
         </div>
      </div>
  );

  const renderCountersSection = () => (
      <div className="flex flex-col h-full border-l border-stone-400">
          <SectionHeader title="Compteurs" />
          <div className="p-1 flex-grow overflow-y-auto bg-stone-50/30">
             <div className={`grid gap-1 ${isLandscape ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {renderCounterItem(data.counters.volonte, false)}
                {renderCounterItem(data.counters.confiance, false)}
                {(data.counters.custom || []).map(c => renderCounterItem(c, true))}
             </div>
          </div>
      </div>
  );

  const creationActive = data.creationConfig?.active;

  return (
    <div className={`sheet-container ${isLandscape ? 'landscape' : ''}`}>
      {/* Main Title */}
      <div className="py-3 border-b-2 border-stone-800 bg-white relative flex justify-center items-center">
        <h1 className="text-4xl font-black text-center uppercase tracking-[0.2em] text-indigo-950 font-serif">
            Seigneurs des Mystères
        </h1>
        {/* Creation Mode Toggle Button */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center no-print">
             <button
                onClick={handleToggleCreationMode}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    creationActive 
                    ? 'bg-green-100 text-green-700 border border-green-300 shadow-sm' 
                    : 'bg-stone-100 text-stone-500 border border-stone-300 hover:bg-stone-200'
                }`}
                title={creationActive ? "Désactiver le Mode Création" : "Activer le Mode Création (Réinitialise la fiche !)"}
             >
                 <UserPlus size={16} />
                 <span>Mode Création</span>
                 <div className={`w-2 h-2 rounded-full ${creationActive ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}`} />
             </button>
        </div>
      </div>

      {/* New 2-Line Header Layout */}
      <div className="flex flex-col border-b-2 border-stone-800 text-xs">
          
          {/* Row 1: Identity */}
          <div className="flex border-b border-stone-400 h-10 bg-white">
              <HeaderInput label="Nom" value={data.header.name} onChange={(v) => updateHeader('name', v)} className="flex-grow-[2] border-r border-stone-300" />
              <HeaderInput label="Joueur" value={data.header.player} onChange={(v) => updateHeader('player', v)} className="flex-grow border-r border-stone-300" />
              <HeaderInput label="Chronique" value={data.header.chronicle} onChange={(v) => updateHeader('chronicle', v)} className="flex-grow border-r border-stone-300" />
              <HeaderInput label="Nature" value={data.header.nature} onChange={(v) => updateHeader('nature', v)} className="flex-grow border-r border-stone-300" />
              <HeaderInput label="Conduite" value={data.header.conduct} onChange={(v) => updateHeader('conduct', v)} className="flex-grow border-r border-stone-300" />
              <HeaderInput label="Statut" value={data.header.status} onChange={(v) => updateHeader('status', v)} className="flex-grow" />
          </div>

          {/* Row 2: Physical / Details */}
          <div className="flex h-10 bg-white">
              <HeaderInput label="Age" value={data.header.age} onChange={(v) => updateHeader('age', v)} className="w-[10%] border-r border-stone-300" />
              <HeaderInput label="Sexe" value={data.header.sex} onChange={(v) => updateHeader('sex', v)} className="w-[10%] border-r border-stone-300" />
              <HeaderInput label="Né(e) le" value={data.header.born} onChange={(v) => updateHeader('born', v)} className="flex-grow border-r border-stone-300" />
              <HeaderInput label="Taille" value={data.header.height} onChange={(v) => updateHeader('height', v)} className="w-[10%] border-r border-stone-300" />
              <HeaderInput label="Cheveux" value={data.header.hair} onChange={(v) => updateHeader('hair', v)} className="flex-grow border-r border-stone-300" />
              <HeaderInput label="Yeux" value={data.header.eyes} onChange={(v) => updateHeader('eyes', v)} className="flex-grow" />
          </div>

      </div>

      {/* Attributes Section */}
      <div className="grid grid-cols-12 border-b-2 border-stone-800">
        <div className={`col-span-10 grid ${getAttributesGridClass()}`}>
             {attributeCategories.map(cat => (
                 <AttributeBlock 
                    key={cat.id}
                    title={cat.label} 
                    items={data.attributes[cat.id] || []}
                    secondaryItems={data.secondaryAttributesActive ? data.secondaryAttributes[cat.id] : undefined}
                    cat={cat.id} 
                    onUpdate={updateAttribute}
                    bonuses={attributeBonuses}
                 />
             ))}
        </div>
        <div className="col-span-2 border-l border-stone-400 flex flex-col h-full bg-slate-50/50">
             <SectionHeader title="Experience" />
             <div className="flex-grow p-0">
                <div className="flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs bg-stone-100">
                    <span className="w-16 truncate font-bold text-stone-600 uppercase text-[10px]">Gain</span>
                    <div className="flex-grow flex justify-end">
                        <input 
                          readOnly
                          className="w-20 text-center border-b border-stone-300 focus:border-blue-500 outline-none bg-transparent font-handwriting font-bold text-ink text-sm" 
                          value={data.experience.gain} 
                        />
                    </div>
                </div>
                <div className="flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs">
                    <span className="w-16 truncate font-bold text-stone-400 uppercase text-[10px]">Dépensé</span>
                    <div className="flex-grow flex justify-end">
                        <input 
                          readOnly 
                          className="w-20 text-center border-b border-stone-300 text-stone-400 outline-none bg-transparent font-handwriting text-sm" 
                           value={data.experience.spent} 
                        />
                    </div>
                </div>
                <div className="flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs bg-blue-50">
                    <span className="w-16 truncate font-black text-blue-900 uppercase text-[10px]">Reste</span>
                    <div className="flex-grow flex justify-end">
                        <input 
                          readOnly 
                          className="w-20 text-center border-b border-blue-200 font-bold text-blue-900 outline-none bg-transparent font-handwriting text-lg" 
                          value={data.experience.rest} 
                        />
                    </div>
                </div>
                {cardValue && (
                     <div className="flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs bg-yellow-50">
                        <span className="w-16 truncate font-bold text-yellow-900 uppercase text-[10px]">Cartes</span>
                        <div className="flex-grow flex justify-end">
                            <input 
                            readOnly 
                            className="w-20 text-center border-b border-yellow-200 font-bold text-yellow-900 outline-none bg-transparent font-handwriting text-sm" 
                            value={cardValue} 
                            />
                        </div>
                    </div>
                )}
             </div>
        </div>
      </div>

      {isLandscape ? (
          /* --- Landscape Layout (6 Columns Dynamic) --- */
          <div className="flex-grow grid grid-cols-6 border-b-2 border-stone-800">
              {getDynamicColumns().map((col, idx) => (
                  <div key={idx} className="border-r border-stone-400 flex flex-col">
                      {col.blocks.map((block, bIdx) => (
                          <div key={bIdx} className={bIdx < col.blocks.length - 1 ? 'flex-grow border-b border-stone-300' : 'flex-grow'}>
                              <SkillBlock 
                                  title={block.title} 
                                  items={block.items} 
                                  cat={block.cat} 
                                  onUpdate={updateDot} 
                                  userSpecs={data.specializations}
                                  imposedSpecs={data.imposedSpecializations}
                              />
                          </div>
                      ))}
                  </div>
              ))}

              {/* Col 6: Arrières Plans & Combat & Counters (Fixed as per request) */}
              <div className="flex flex-col h-full">
                  <div className="flex-none border-b border-stone-400">
                       <SkillBlock 
                          title="Arrières Plans" 
                          items={data.skills.arrieres_plans || []} 
                          cat="arrieres_plans" 
                          onUpdate={updateDot}
                          userSpecs={data.specializations}
                          imposedSpecs={data.imposedSpecializations} 
                       />
                  </div>
                  <div className="flex-none border-b border-stone-400 overflow-hidden">
                       {renderCombatSection()}
                  </div>
                  <div className="flex-grow overflow-hidden">
                       {renderCountersSection()}
                  </div>
              </div>
          </div>
      ) : (
          /* --- Portrait Layout (Standard) --- */
          <>
            <div className="grid grid-cols-4 border-b-2 border-stone-800 h-auto">
                <div className="border-r border-stone-400">
                    <SkillBlock title="Talents" items={data.skills.talents || []} cat="talents" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} />
                </div>
                <div className="border-r border-stone-400">
                    <SkillBlock title="Compétences" items={data.skills.competences || []} cat="competences" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} />
                </div>
                <div className="border-r border-stone-400">
                    <SkillBlock title="Compétences" items={data.skills.competences_col_2 || []} cat="competences_col_2" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} />
                </div>
                <div>
                    <SkillBlock title="Connaissances" items={data.skills.connaissances || []} cat="connaissances" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} />
                </div>
            </div>

            <div className="grid grid-cols-4 border-b-2 border-stone-800 flex-grow min-h-[200px]">
                <div className="border-r border-stone-400">
                <SkillBlock title="Autres Compétences" items={data.skills.autres_competences || []} cat="autres_competences" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} />
                </div>
                <div className="border-r border-stone-400">
                <SkillBlock title="Compétences Secondaires" items={data.skills.competences2 || []} cat="competences2" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} />
                </div>
                <div className="border-r border-stone-400">
                <SkillBlock title="Autres" items={data.skills.autres || []} cat="autres" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} />
                </div>
                <div>
                <SkillBlock title="Arrières Plans" items={data.skills.arrieres_plans || []} cat="arrieres_plans" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} />
                </div>
            </div>

            <div className="grid grid-cols-2">
                <div className="border-r-2 border-stone-800 flex flex-col">
                    {renderCombatSection()}
                </div>
                <div className="flex flex-col">
                    {renderCountersSection()}
                </div>
            </div>
          </>
      )}

      {/* Creation Mode Activation Warning Modal */}
      {showCreationWarning && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm no-print">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                <div className="bg-blue-50 p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                         <UserPlus size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Activer le Mode Création ?</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        L'activation du mode création va <strong>réinitialiser toutes les valeurs</strong> du personnage actuel pour vous permettre de repartir de zéro.
                    </p>
                    <div className="bg-white p-3 rounded border border-blue-100 text-left text-xs text-blue-800 space-y-1 w-full">
                        <p className="font-bold border-b border-blue-50 pb-1 mb-1">Seront effacés :</p>
                        <ul className="list-disc list-inside">
                            <li>Identité (Nom, Chronique...)</li>
                            <li>Points d'Attributs et Compétences</li>
                            <li>Historique XP et Notes de Campagne</li>
                        </ul>
                        <p className="italic pt-1">La structure et la bibliothèque sont conservées.</p>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-100">
                    <button 
                        onClick={() => setShowCreationWarning(false)} 
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={executeCreationActivation} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
                    >
                        Réinitialiser et Activer
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CharacterSheet;
