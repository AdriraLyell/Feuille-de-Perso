
import React, { useState, useEffect } from 'react';
import { CharacterSheetData, DotEntry, SkillCategoryKey, AttributeEntry, CombatEntry, ReputationEntry, ThemeConfig } from '../types';
import { Trash2, Plus, RefreshCw, Minus, GripVertical, Save, AlertTriangle, List, Tag, UserPlus, Circle, Calculator, Info, CreditCard, Sliders, BookOpen, LayoutGrid, Zap, Play, X, CheckSquare, Square, Palette, RotateCcw } from 'lucide-react';
import { INITIAL_DATA, DEFAULT_THEME } from '../constants';

interface SettingsViewProps {
  data: CharacterSheetData;
  onUpdate: (newData: CharacterSheetData) => void;
  onClose: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ data, onUpdate, onClose, onDirtyChange, onAddLog }) => {
  const [localData, setLocalData] = useState<CharacterSheetData>(JSON.parse(JSON.stringify(data)));
  const [draggedItem, setDraggedItem] = useState<{ category: string; index: number } | null>(null);
  
  // Modal States
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPresetConfirm, setShowPresetConfirm] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<any>(null);

  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const [newlyAddedSpec, setNewlyAddedSpec] = useState<{ skillId: string; index: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'skills' | 'attributes' | 'specializations' | 'creation'>('skills');
  const [focusedValue, setFocusedValue] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Helper to get friendly name
  const getCategoryLabel = (cat: string) => {
    switch(cat) {
        case 'talents': return 'Talents (Col 1)';
        case 'competences': return 'Compétences (Col 2)';
        case 'competences_col_2': return 'Compétences (Col 3)';
        case 'connaissances': return 'Connaissances (Col 4)';
        case 'autres_competences': return 'Autres Compétences';
        case 'competences2': return 'Compétences Secondaires';
        case 'autres': return 'Autres';
        case 'arrieres_plans': return 'Arrières Plans';
        case 'counters': return 'Compteurs';
        default: return cat;
    }
  };

  const getSkillContext = (skillId: string) => {
      if (!localData.skills) return { name: "Inconnu", categoryLabel: "Inconnu" };
      for (const cat of Object.keys(localData.skills)) {
          const list = localData.skills[cat as SkillCategoryKey];
          if (Array.isArray(list)) {
              const found = list.find(s => s.id === skillId);
              if (found) {
                  return { 
                      name: found.name, 
                      categoryLabel: getCategoryLabel(cat) 
                  };
              }
          }
      }
      return { name: "Inconnu", categoryLabel: "Inconnu" };
  };

  // Helper to compare data excluding volatile/computed fields
  const getComparableData = (d: CharacterSheetData) => {
      const { appLogs, xpLogs, experience, ...rest } = d;
      return rest;
  };

  // Effect to detect unsaved changes
  useEffect(() => {
    const dirty = JSON.stringify(getComparableData(localData)) !== JSON.stringify(getComparableData(data));
    setIsDirty(dirty);
    if (onDirtyChange) {
        onDirtyChange(dirty);
    }
  }, [localData, data, onDirtyChange]);

  const performReset = () => {
    setLocalData(JSON.parse(JSON.stringify(INITIAL_DATA)));
    setShowResetConfirm(false);
    onAddLog("Réinitialisation complète de la fiche aux valeurs par défaut", 'danger', 'settings');
  };

  // Define default attribute names for known categories
  const DEFAULT_ATTRIBUTES: Record<string, string[]> = {
      'physique': ['Force', 'Constitution', 'Agilité', 'Dextérité', 'Perception'],
      'mental': ['Volonté', 'Stabilité', 'Astuce/Subtilité', 'Intellect', 'Intuition'],
      'social': ['Charisme', 'Calme', 'Mimétisme', 'Communication', 'Empathie'],
      'mystique': ['Puissance', 'Résistance', 'Souplesse', 'Précision', 'Sensibilité']
  };

  // --- Attribute Config Handlers ---
  
  // PRESETS DEFINITION
  const ATTRIBUTE_PRESETS = [
      {
          name: "Standard (Classique)",
          desc: "3 Pavés de 4 Attributs",
          structure: [
              { id: 'physique', label: 'Physique', attrs: ['Force', 'Constitution', 'Dextérité', 'Agilité'] },
              { id: 'mental', label: 'Mental', attrs: ['Intellect', 'Volonté', 'Intuition', 'Perception'] },
              { id: 'social', label: 'Social', attrs: ['Charisme', 'Empathie', 'Apparence', 'Communication'] }
          ]
      },
      {
          name: "Complet (Mystique)",
          desc: "4 Pavés de 5 Attributs",
          structure: [
              { id: 'physique', label: 'Physique', attrs: ['Force', 'Constitution', 'Agilité', 'Dextérité', 'Perception'] },
              { id: 'mental', label: 'Mental', attrs: ['Volonté', 'Stabilité', 'Astuce/Subtilité', 'Intellect', 'Intuition'] },
              { id: 'social', label: 'Social', attrs: ['Charisme', 'Calme', 'Mimétisme', 'Communication', 'Empathie'] },
              { id: 'mystique', label: 'Mystique', attrs: ['Puissance', 'Résistance', 'Souplesse', 'Précision', 'Sensibilité'] }
          ]
      }
  ];

  const requestPresetLoad = (preset: typeof ATTRIBUTE_PRESETS[0]) => {
      setPendingPreset(preset);
      setShowPresetConfirm(true);
  };

  const executePresetLoad = () => {
      if (!pendingPreset) return;

      const newSettings: any[] = [];
      const newAttributes: any = {};

      pendingPreset.structure.forEach((cat: any) => {
          newSettings.push({ id: cat.id, label: cat.label });
          newAttributes[cat.id] = cat.attrs.map((name: string) => ({
              id: Math.random().toString(36).substr(2, 9),
              name: name,
              val1: "", val2: "", val3: "", // Changed to string
              creationVal1: 0, creationVal2: 0, creationVal3: 0
          }));
      });

      setLocalData({
          ...localData,
          attributeSettings: newSettings,
          attributes: newAttributes
      });
      
      onAddLog(`Préréglage attributs appliqué : ${pendingPreset.name}`, 'success', 'settings');
      setShowPresetConfirm(false);
      setPendingPreset(null);
  };

  const handleCategoryCountChange = (count: number) => {
      // Default definitions
      const defaultDefs = [
          { id: 'physique', label: 'Physique' },
          { id: 'mental', label: 'Mental' },
          { id: 'social', label: 'Social' },
          { id: 'mystique', label: 'Mystique' }
      ];

      const currentDefs = [...localData.attributeSettings];
      const currentAttributes = { ...localData.attributes };
      
      // Determine current attribute count per category (based on the first one)
      const firstCat = currentDefs[0]?.id;
      const currentAttrCount = firstCat && currentAttributes[firstCat] ? currentAttributes[firstCat].length : 4;

      if (count > currentDefs.length) {
          // Add categories
          for (let i = currentDefs.length; i < count; i++) {
              let defToAdd = defaultDefs[i];
              // If we exceed predefined categories, create generic one
              if (!defToAdd) {
                  defToAdd = { id: `cat_${i+1}`, label: `Pavé ${i+1}` };
              }
              
              // Ensure ID uniqueness if modifying beyond defaults
              if (currentDefs.some(d => d.id === defToAdd.id)) {
                   defToAdd = { ...defToAdd, id: `${defToAdd.id}_${Math.random().toString(36).substr(2, 4)}` };
              }
              currentDefs.push(defToAdd);
              
              // Initialize attributes for new category with consistent count
              currentAttributes[defToAdd.id] = Array(currentAttrCount).fill(null).map((_, idx) => {
                  let attrName = `Attribut ${idx + 1}`;
                  // Try to find default name based on category ID (e.g. 'physique')
                  // We split by underscore to handle potential generated IDs like 'physique_ab12' if duplication occurred, 
                  // though standard defaults are clean.
                  const baseId = defToAdd.id.split('_')[0];
                  if (DEFAULT_ATTRIBUTES[baseId] && DEFAULT_ATTRIBUTES[baseId][idx]) {
                      attrName = DEFAULT_ATTRIBUTES[baseId][idx];
                  }

                  return {
                    id: Math.random().toString(36).substr(2, 9),
                    name: attrName,
                    val1: "", val2: "", val3: "" // Changed to string
                  };
              });
          }
      } else if (count < currentDefs.length) {
          // Remove categories (from the end)
          const removed = currentDefs.splice(count);
          removed.forEach(def => {
              delete currentAttributes[def.id];
          });
      }

      setLocalData({
          ...localData,
          attributeSettings: currentDefs,
          attributes: currentAttributes
      });
  };

  // Global handler for ALL categories at once
  const handleGlobalAttributeCountChange = (count: number) => {
      const newAttributes = { ...localData.attributes };
      
      Object.keys(newAttributes).forEach(catId => {
          const attrs = [...(newAttributes[catId] || [])];
          if (count > attrs.length) {
              const diff = count - attrs.length;
              for (let i = 0; i < diff; i++) {
                  const idx = attrs.length;
                  let attrName = `Attribut ${idx + 1}`;
                  
                  // Try to find default name
                  const baseId = catId.split('_')[0];
                  if (DEFAULT_ATTRIBUTES[baseId] && DEFAULT_ATTRIBUTES[baseId][idx]) {
                      attrName = DEFAULT_ATTRIBUTES[baseId][idx];
                  }

                  attrs.push({
                      id: Math.random().toString(36).substr(2, 9),
                      name: attrName,
                      val1: "", val2: "", val3: "" // Changed to string
                  });
              }
          } else if (count < attrs.length) {
              attrs.splice(count);
          }
          newAttributes[catId] = attrs;
      });

      setLocalData({
          ...localData,
          attributes: newAttributes
      });
  };

  const updateCategoryLabel = (id: string, label: string) => {
      const newSettings = localData.attributeSettings.map(def => 
          def.id === id ? { ...def, label } : def
      );
      setLocalData({ ...localData, attributeSettings: newSettings });
  };

  const updateAttributeName = (catId: string, attrId: string, name: string) => {
      const catAttrs = localData.attributes[catId];
      if (!catAttrs) return;

      const newAttrs = catAttrs.map(attr => 
          attr.id === attrId ? { ...attr, name } : attr
      );
      setLocalData({
          ...localData,
          attributes: {
              ...localData.attributes,
              [catId]: newAttrs
          }
      });
  };

  // --- Secondary Attributes Handler ---
  const toggleSecondaryAttributes = () => {
      const isActive = !localData.secondaryAttributesActive;
      
      let newSecondary = { ...localData.secondaryAttributes };
      
      // If activating for the first time or if missing structure
      if (isActive) {
          localData.attributeSettings.forEach(cat => {
              if (!newSecondary[cat.id]) {
                  newSecondary[cat.id] = [
                      { id: Math.random().toString(36).substr(2, 9), name: 'Secondaire 1', val1: "", val2: "", val3: "" },
                      { id: Math.random().toString(36).substr(2, 9), name: 'Secondaire 2', val1: "", val2: "", val3: "" }
                  ];
              }
          });
      }

      setLocalData({
          ...localData,
          secondaryAttributesActive: isActive,
          secondaryAttributes: newSecondary
      });
  };

  const updateSecondaryAttributeName = (catId: string, index: number, name: string) => {
      const newSecAttrs = [...(localData.secondaryAttributes[catId] || [])];
      if (newSecAttrs[index]) {
          newSecAttrs[index] = { ...newSecAttrs[index], name };
          setLocalData({
              ...localData,
              secondaryAttributes: {
                  ...localData.secondaryAttributes,
                  [catId]: newSecAttrs
              }
          });
      }
  };

  // --- Creation Config Handlers ---
  const updateCreationConfig = (field: string, value: any) => {
      setLocalData(prev => ({
          ...prev,
          creationConfig: {
              ...prev.creationConfig,
              [field]: value
          }
      }));
      onAddLog(`Config Création modifiée : ${field}`, 'info', 'settings');
  };
  
  const updateCardConfig = (field: string, value: any) => {
      setLocalData(prev => ({
          ...prev,
          creationConfig: {
              ...prev.creationConfig,
              cardConfig: {
                  ...prev.creationConfig.cardConfig,
                  [field]: value
              }
          }
      }));
  };

  const updateRankSlot = (rank: number, value: number) => {
      setLocalData(prev => ({
          ...prev,
          creationConfig: {
              ...prev.creationConfig,
              rankSlots: {
                  ...prev.creationConfig.rankSlots,
                  [rank]: value
              }
          }
      }));
  };

  const calculateConfigurationCost = () => {
      const { attributePoints, backgroundPoints, rankSlots } = localData.creationConfig;
      let total = 0;

      // Attributes (approx 6 XP per point)
      total += (attributePoints || 0) * 6;

      // Backgrounds (2 XP per point)
      total += (backgroundPoints || 0) * 2;

      // Ranks
      // Formula: (Rank * (Rank + 1)) / 2
      [1, 2, 3, 4, 5].forEach(rank => {
           // @ts-ignore
           const count = rankSlots[rank] || 0;
           const costPerSkill = (rank * (rank + 1)) / 2;
           total += count * costPerSkill;
      });

      return total;
  };

  // --- Theme Handlers ---
  const updateTheme = (field: keyof ThemeConfig, value: string) => {
      setLocalData(prev => ({
          ...prev,
          theme: {
              ...prev.theme,
              [field]: value
          }
      }));
  };

  const resetTheme = () => {
      setLocalData(prev => ({
          ...prev,
          theme: DEFAULT_THEME
      }));
      onAddLog('Thème réinitialisé aux couleurs par défaut.', 'info', 'settings');
  };

  // --- Skill/Counter CRUD ---
  const updateSkillName = (category: SkillCategoryKey, id: string, newName: string) => {
    const list = localData.skills[category];
    if (!list) return;

    setLocalData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: list.map(item =>
          item.id === id ? { ...item, name: newName } : item
        )
      }
    }));
  };

  const removeSkill = (category: SkillCategoryKey, id: string) => {
    const list = localData.skills[category];
    if (!list) return;

    const skillName = list.find(s => s.id === id)?.name || 'Inconnue';
    setLocalData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: list.filter(item => item.id !== id)
      }
    }));
    onAddLog(`Suppression : "${skillName}" dans [${getCategoryLabel(category)}]`, 'danger', 'settings');
  };

  const addSkill = (category: SkillCategoryKey, isSpacer = false, defaultName = 'Nouvelle Compétence') => {
    const list = localData.skills[category] || [];
    const newId = Math.random().toString(36).substr(2, 9);
    const newSkill: DotEntry = {
      id: newId,
      name: isSpacer ? '' : defaultName,
      value: 0,
      creationValue: 0,
      max: 5
    };
    setLocalData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: [...list, newSkill]
      }
    }));
    if (!isSpacer) {
        setNewlyAddedId(newId);
        onAddLog(`Ajout : Nouvelle compétence dans [${getCategoryLabel(category)}]`, 'success', 'settings');
    } else {
        onAddLog(`Ajout : Espaceur dans [${getCategoryLabel(category)}]`, 'info', 'settings');
    }
  };

  // --- Specialization Handlers ---
  const updateSpecialization = (skillId: string, index: number, value: string) => {
      const currentSpecs = localData.imposedSpecializations[skillId] || [];
      const newSpecs = [...currentSpecs];
      newSpecs[index] = value;
      setLocalData(prev => ({
          ...prev,
          imposedSpecializations: {
              ...prev.imposedSpecializations,
              [skillId]: newSpecs
          }
      }));
  };

  const addSpecialization = (skillId: string) => {
      const currentSpecs = localData.imposedSpecializations[skillId] || [];
      const newSpecs = [...currentSpecs, ""];
      setLocalData(prev => ({
          ...prev,
          imposedSpecializations: {
              ...prev.imposedSpecializations,
              [skillId]: newSpecs
          }
      }));
      setNewlyAddedSpec({ skillId, index: currentSpecs.length });
      const { name, categoryLabel } = getSkillContext(skillId);
      onAddLog(`Ajout : Spécialisation pour "${name}" [${categoryLabel}]`, 'success', 'settings');
  };

  const removeSpecialization = (skillId: string, index: number) => {
      const currentSpecs = localData.imposedSpecializations[skillId] || [];
      const specName = currentSpecs[index];
      const newSpecs = currentSpecs.filter((_, i) => i !== index);
      setLocalData(prev => ({
          ...prev,
          imposedSpecializations: {
              ...prev.imposedSpecializations,
              [skillId]: newSpecs
          }
      }));
      const { name, categoryLabel } = getSkillContext(skillId);
      onAddLog(`Suppression : Spécialisation "${specName || '(vide)'}" pour "${name}" [${categoryLabel}]`, 'danger', 'settings');
  };

  // --- Counters Handlers ---
  const updateCounterName = (id: string, newName: string) => {
      const custom = localData.counters.custom;
      if (!custom) return;

      setLocalData(prev => ({
          ...prev,
          counters: {
              ...prev.counters,
              custom: custom.map(c => c.id === id ? { ...c, name: newName } : c)
          }
      }));
  };

  const removeCounter = (id: string) => {
      const custom = localData.counters.custom;
      if (!custom) return;

      const counterName = custom.find(c => c.id === id)?.name;
      setLocalData(prev => ({
          ...prev,
          counters: {
              ...prev.counters,
              custom: custom.filter(c => c.id !== id)
          }
      }));
      onAddLog(`Suppression Compteur : ${counterName}`, 'danger', 'settings');
  };

  const addCounter = (defaultName = 'Nouveau Compteur') => {
       const newId = Math.random().toString(36).substr(2, 9);
       const custom = localData.counters.custom || [];
       const newCounter: DotEntry = {
            id: newId,
            name: defaultName,
            value: 0,
            creationValue: 0,
            max: 10
       };
       setLocalData(prev => ({
            ...prev,
            counters: {
                ...prev.counters,
                custom: [...custom, newCounter]
            }
       }));
       setNewlyAddedId(newId);
       onAddLog(`Ajout : Compteur personnalisé`, 'success', 'settings');
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, category: string, index: number) => {
    setDraggedItem({ category, index });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent, targetCategory: string, targetIndex: number) => {
    e.preventDefault(); 
    if (!draggedItem) return;
    if (draggedItem.category === targetCategory && draggedItem.index === targetIndex) return;

    const sourceCategory = draggedItem.category;
    const sourceIndex = draggedItem.index;

    if (sourceCategory === 'counters') {
         if (targetCategory !== 'counters') return; 
         const newList = [...(localData.counters.custom || [])];
         const [itemToMove] = newList.splice(sourceIndex, 1);
         newList.splice(targetIndex, 0, itemToMove);
         setLocalData({ ...localData, counters: { ...localData.counters, custom: newList } });
         setDraggedItem({ category: targetCategory, index: targetIndex });
         return;
    }

    const newSkills = { ...localData.skills };
    const sourceList = [...(newSkills[sourceCategory as SkillCategoryKey] || [])];
    const targetList = (sourceCategory === targetCategory) ? sourceList : [...(newSkills[targetCategory as SkillCategoryKey] || [])];

    const [itemToMove] = sourceList.splice(sourceIndex, 1);
    targetList.splice(targetIndex, 0, itemToMove);

    newSkills[sourceCategory as SkillCategoryKey] = sourceList;
    if (sourceCategory !== targetCategory) {
        newSkills[targetCategory as SkillCategoryKey] = targetList;
    }

    setLocalData({ ...localData, skills: newSkills });
    setDraggedItem({ category: targetCategory, index: targetIndex });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const renderAttributeEditor = () => {
    const categories = localData.attributeSettings || [];
    const count = categories.length;
    
    // Find global attribute count from the first category
    const firstCatId = categories[0]?.id;
    const globalAttrCount = firstCatId && localData.attributes[firstCatId] 
        ? localData.attributes[firstCatId].length 
        : 4;

    return (
        <div className="bg-white p-6 rounded shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
             <h3 className="font-bold text-lg mb-6 text-gray-800 border-b pb-4 flex items-center gap-2">
                <LayoutGrid className="text-blue-600" />
                Configuration des Attributs
            </h3>

            {/* Quick Slots (Presets) */}
            <div className="mb-8">
                <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <Zap size={16} className="text-yellow-500" /> Emplacements Rapides (Préréglages)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ATTRIBUTE_PRESETS.map((preset, idx) => (
                        <button
                            key={idx}
                            onClick={() => requestPresetLoad(preset)}
                            className="bg-gray-50 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md rounded-lg p-3 text-left transition-all group flex items-start gap-3"
                        >
                            <div className="bg-white p-2 rounded-full border border-gray-200 group-hover:border-blue-200 group-hover:text-blue-600 text-gray-400">
                                <Play size={16} className="ml-0.5" />
                            </div>
                            <div>
                                <span className="block font-bold text-gray-800 text-sm group-hover:text-blue-700">{preset.name}</span>
                                <span className="block text-xs text-gray-500">{preset.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Option Secondary Attributes */}
            <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-purple-800 text-sm flex items-center gap-2">
                        <CheckSquare size={16} /> Attributs Secondaires Optionnels
                    </h4>
                    <p className="text-xs text-purple-600 mt-1">
                        Active 2 attributs supplémentaires par pavé, séparés par une ligne de démarcation.
                    </p>
                </div>
                <button
                    onClick={toggleSecondaryAttributes}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${localData.secondaryAttributesActive ? 'bg-purple-600' : 'bg-gray-300'}`}
                >
                    <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ${localData.secondaryAttributesActive ? 'translate-x-6' : ''}`} />
                </button>
            </div>

            {/* Global Settings (Cats & Attrs Count) */}
            <div className="mb-8 bg-gray-50 p-4 rounded border border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Category Count */}
                <div className="flex flex-col gap-2">
                    <span className="font-bold text-gray-700 text-sm">Nombre de pavés :</span>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(n => (
                            <button
                                key={n}
                                onClick={() => handleCategoryCountChange(n)}
                                className={`w-10 h-10 rounded-full font-bold text-lg transition-all ${
                                    count === n 
                                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 scale-110' 
                                    : 'bg-white border border-gray-300 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                                }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Attributes Count (Global) */}
                <div className="flex flex-col gap-2">
                    <span className="font-bold text-gray-700 text-sm">Nombre d'attributs (par pavé) :</span>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button
                                key={n}
                                onClick={() => handleGlobalAttributeCountChange(n)}
                                className={`w-10 h-10 rounded-full font-bold text-lg transition-all ${
                                    globalAttrCount === n 
                                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 scale-110' 
                                    : 'bg-white border border-gray-300 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                                }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Attribute Cost */}
                <div className="flex flex-col gap-2">
                    <label className="block text-sm font-bold text-gray-700">Coût XP (Attributs)</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={localData.creationConfig.attributeCost ?? 6}
                            onChange={(e) => updateCreationConfig('attributeCost', parseInt(e.target.value) || 0)}
                            className="w-20 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div title="Coût en expérience pour augmenter un attribut de 1 point (Défaut: 6)" className="text-xs text-gray-500 italic flex items-center gap-1">
                            <Info size={14} className="text-blue-400" />
                            <span>/ point</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Cards Grid - Enforced Single Row */}
            <div className={`grid gap-4 grid-cols-1 md:grid-cols-${count}`}>
                {categories.map((cat, idx) => {
                    const attrs = localData.attributes[cat.id] || [];
                    const secondaryAttrs = localData.secondaryAttributesActive ? (localData.secondaryAttributes[cat.id] || []) : [];

                    return (
                        <div key={cat.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
                             {/* Header / Name */}
                             <div className="bg-slate-100 p-3 border-b border-gray-200">
                                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                                     Pavé {idx + 1}
                                 </label>
                                 <input 
                                    id={`cat-label-${idx}`}
                                    value={cat.label}
                                    onChange={(e) => updateCategoryLabel(cat.id, e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full font-bold text-lg bg-white border border-gray-300 rounded px-2 py-1 shadow-inner focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-900 transition-all"
                                    placeholder="Nom du pavé"
                                 />
                             </div>

                             {/* Attributes List */}
                             <div className="p-3 space-y-2 flex-grow bg-slate-50/50">
                                 {attrs.map((attr, aIdx) => (
                                     <div key={attr.id} className="flex items-center gap-2">
                                         <span className="text-xs text-gray-400 w-4 font-mono select-none">{aIdx+1}</span>
                                         <input 
                                            value={attr.name}
                                            onChange={(e) => updateAttributeName(cat.id, attr.id, e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            className="flex-grow text-sm border border-gray-300 rounded px-2 py-1 focus:border-blue-500 outline-none bg-white shadow-sm font-medium text-gray-800"
                                            placeholder={`Attribut ${aIdx+1}`}
                                         />
                                     </div>
                                 ))}

                                 {/* Secondary Attributes (Separated) */}
                                 {localData.secondaryAttributesActive && secondaryAttrs.length > 0 && (
                                     <>
                                        <hr className="my-3 border-dashed border-gray-300" />
                                        <div className="text-[10px] text-gray-400 font-bold uppercase text-center mb-2 tracking-wide">Secondaires</div>
                                        {secondaryAttrs.map((sAttr, sIdx) => (
                                            <div key={sAttr.id} className="flex items-center gap-2">
                                                <span className="text-xs text-purple-400 w-4 font-mono select-none">+{sIdx+1}</span>
                                                <input 
                                                    value={sAttr.name}
                                                    onChange={(e) => updateSecondaryAttributeName(cat.id, sIdx, e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    className="flex-grow text-sm border border-purple-200 rounded px-2 py-1 focus:border-purple-500 outline-none bg-white shadow-sm font-medium text-gray-800"
                                                    placeholder={`Attr. Secondaire ${sIdx+1}`}
                                                />
                                            </div>
                                        ))}
                                     </>
                                 )}
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const renderCategoryEditor = (title: string, category: string, heightClass = 'h-full', defaultItemName = 'Nouvelle Compétence') => {
    const isCounters = category === 'counters';
    // Use optional chaining fallback to prevent undefined array errors
    // @ts-ignore
    const list: DotEntry[] = isCounters ? (localData.counters?.custom || []) : (localData.skills?.[category as SkillCategoryKey] || []);

    return (
      <div className={`bg-white p-4 rounded shadow flex flex-col ${heightClass}`}>
        <h3 className="font-bold text-sm mb-4 text-gray-800 border-b pb-2 flex justify-between items-center">
          {title}
          <div className="flex gap-1">
               {!isCounters && (
                   <button
                    onClick={() => addSkill(category as SkillCategoryKey, true)}
                    className="text-[10px] bg-gray-500 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-600 transition-colors"
                    title="Ajouter un espaceur"
                    >
                        <Minus size={12} /> Espace
                    </button>
               )}
              <button
                  onClick={() => isCounters ? addCounter(defaultItemName) : addSkill(category as SkillCategoryKey, false, defaultItemName)}
                  className="text-[10px] bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-green-700 transition-colors"
              >
                  <Plus size={12} /> Ajouter
              </button>
          </div>
        </h3>
        <div className="flex-grow overflow-y-auto space-y-2 pr-1 max-h-[500px] min-h-[50px]">
          {list.length === 0 && !isCounters && (
               <div 
                  className="h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs transition-colors hover:bg-gray-50 hover:border-blue-400"
                  onDragEnter={(e) => handleDragEnter(e, category, 0)}
                  onDragOver={handleDragOver}
               >
                  Vide
               </div>
          )}
          {list.map((item, index) => {
            const isDragging = draggedItem?.category === category && draggedItem?.index === index;
            return (
              <div 
                key={item.id} 
                className={`flex items-center gap-2 text-sm group transition-all duration-200 ${isDragging ? 'opacity-50 bg-gray-50' : 'opacity-100'}`}
                draggable
                onDragStart={(e) => handleDragStart(e, category, index)}
                onDragEnter={(e) => handleDragEnter(e, category, index)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                 <div className="cursor-grab text-gray-300 hover:text-gray-600 active:cursor-grabbing p-1">
                    <GripVertical size={16} />
                 </div>
                 <span className="text-gray-400 text-xs w-4 text-center select-none">{index + 1}</span>
                 {item.name === '' ? (
                     <div className="flex-grow h-8 bg-gray-100 border border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400 italic cursor-default select-none">
                        Vide
                     </div>
                 ) : (
                    <input
                    type="text"
                    autoFocus={item.id === newlyAddedId}
                    value={item.name}
                    onFocus={(e) => {
                        setFocusedValue(e.target.value);
                        if (e.target.value === defaultItemName) {
                            e.target.select();
                        }
                    }}
                    onBlur={(e) => {
                        if (item.id === newlyAddedId) {
                            setNewlyAddedId(null);
                        }
                        if (focusedValue !== null && e.target.value !== focusedValue) {
                            const label = isCounters ? "Compteurs" : getCategoryLabel(category);
                            onAddLog(`Modification : "${focusedValue}" renommé en "${e.target.value}" dans [${label}]`, 'info', 'settings');
                        }
                        setFocusedValue(null);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.currentTarget.blur();
                        }
                    }}
                    onChange={(e) => isCounters ? updateCounterName(item.id, e.target.value) : updateSkillName(category as SkillCategoryKey, item.id, e.target.value)}
                    className="border p-1 rounded w-full focus:border-blue-500 outline-none"
                    />
                 )}
                <button
                  onClick={() => isCounters ? removeCounter(item.id) : removeSkill(category as SkillCategoryKey, item.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  const renderSpecializationEditor = (title: string, category: string) => {
    // @ts-ignore
    const skills: DotEntry[] = localData.skills?.[category as SkillCategoryKey] || [];

    return (
      <div className="bg-white p-4 rounded shadow flex flex-col h-full">
         <h3 className="font-bold text-sm mb-4 text-gray-800 border-b pb-2">{title}</h3>
         <div className="flex-grow overflow-y-auto space-y-4 pr-1 max-h-[500px]">
             {skills.filter(s => s.name && s.name.trim() !== '').map(skill => {
                 const specs = localData.imposedSpecializations[skill.id] || [];
                 return (
                     <div key={skill.id} className="border border-gray-100 rounded p-2 bg-gray-50/50">
                         <div className="flex justify-between items-center mb-2">
                             <span className="font-bold text-xs text-gray-700">{skill.name}</span>
                             <button 
                                onClick={() => addSpecialization(skill.id)}
                                className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                             >
                                 <Plus size={10} /> Ajouter
                             </button>
                         </div>
                         <div className="space-y-1">
                             {specs.length === 0 && <div className="text-[10px] text-gray-400 italic">Aucune spécialisation imposée.</div>}
                             {specs.map((spec, idx) => (
                                 <div key={idx} className="flex gap-1 items-center">
                                     <input 
                                        value={spec}
                                        onChange={(e) => updateSpecialization(skill.id, idx, e.target.value)}
                                        className="flex-grow text-xs border border-gray-300 rounded px-1 py-0.5 focus:border-blue-500 outline-none"
                                        placeholder="Spécialisation..."
                                     />
                                     <button 
                                        onClick={() => removeSpecialization(skill.id, idx)}
                                        className="text-red-400 hover:text-red-600 p-0.5"
                                     >
                                         <X size={12} />
                                     </button>
                                 </div>
                             ))}
                         </div>
                     </div>
                 );
             })}
             {skills.length === 0 && <div className="text-xs text-gray-400 italic text-center py-4">Aucune compétence dans cette catégorie.</div>}
         </div>
      </div>
    );
  };
  
  const renderCreationEditor = () => {
      const config = localData.creationConfig;
      if (!config) return null; // Safety
      const theme = localData.theme || DEFAULT_THEME;

      return (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              {/* Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  
                  {/* General Settings */}
                  <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                      <h4 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                          <Sliders size={18} /> Paramètres de Création
                      </h4>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Méthode de Création</label>
                              <div className="flex bg-gray-100 p-1 rounded-lg">
                                  <button 
                                      onClick={() => updateCreationConfig('mode', 'rangs')}
                                      className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${config.mode === 'rangs' ? 'bg-white text-blue-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                  >
                                      Par Rangs (Slots)
                                  </button>
                                  <button 
                                      onClick={() => updateCreationConfig('mode', 'points')}
                                      className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${config.mode === 'points' ? 'bg-white text-blue-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                  >
                                      Par Points (XP)
                                  </button>
                              </div>
                          </div>

                          {config.mode === 'points' && (
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">XP de Départ</label>
                                  <input 
                                      type="number" 
                                      value={config.startingXP || 0}
                                      onChange={(e) => updateCreationConfig('startingXP', parseInt(e.target.value) || 0)}
                                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                              </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Pts Attributs</label>
                                  <input 
                                      type="number" 
                                      value={config.attributePoints || 0}
                                      onChange={(e) => updateCreationConfig('attributePoints', parseInt(e.target.value) || 0)}
                                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Pts Arr. Plans</label>
                                  <input 
                                      type="number" 
                                      value={config.backgroundPoints || 0}
                                      onChange={(e) => updateCreationConfig('backgroundPoints', parseInt(e.target.value) || 0)}
                                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-200">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Attr. Min (Défaut -2)</label>
                                  <input 
                                      type="number" 
                                      value={config.attributeMin ?? -2}
                                      onChange={(e) => updateCreationConfig('attributeMin', parseInt(e.target.value))}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Attr. Max (Défaut 3)</label>
                                  <input 
                                      type="number" 
                                      value={config.attributeMax ?? 3}
                                      onChange={(e) => updateCreationConfig('attributeMax', parseInt(e.target.value))}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                  />
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Right Column: Rank Slots or Colors */}
                  <div className="flex flex-col gap-6">

                      {/* Rank Slots Configuration (Only if mode is 'rangs') */}
                      {config.mode === 'rangs' && (
                          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                              <h4 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                  <List size={18} /> Répartition des Rangs
                              </h4>
                              <div className="space-y-3">
                                  {[5, 4, 3, 2, 1].map(rank => (
                                      <div key={rank} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                          <span className="font-bold text-gray-600">Rang {rank}</span>
                                          <div className="flex items-center gap-2">
                                              <input 
                                                  type="number"
                                                  // @ts-ignore
                                                  value={config.rankSlots[rank] || 0}
                                                  onChange={(e) => updateRankSlot(rank, parseInt(e.target.value) || 0)}
                                                  className="w-20 border border-gray-300 rounded px-2 py-1 text-center font-mono focus:border-blue-500 outline-none"
                                              />
                                              <span className="text-sm text-gray-400">rangs</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      {/* Theme / Colors Configuration */}
                      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                           <div className="flex items-center justify-between border-b pb-2 mb-4">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Palette size={18} /> Configuration des Couleurs
                                </h4>
                                <button
                                    onClick={resetTheme}
                                    className="text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                    title="Remettre les couleurs par défaut"
                                >
                                    <RotateCcw size={12} /> Défaut
                                </button>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Pts Création</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={theme.creationColor}
                                            onChange={(e) => updateTheme('creationColor', e.target.value)}
                                            className="w-10 h-10 border-none rounded cursor-pointer bg-transparent"
                                        />
                                        <div className="flex-grow flex flex-col justify-center">
                                            <div className="flex gap-1">
                                                <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: theme.creationColor }}></span>
                                                <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: theme.creationColor }}></span>
                                                <span className="w-3 h-3 rounded-full border border-stone-400 bg-transparent"></span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">{theme.creationColor}</span>
                                        </div>
                                    </div>
                               </div>

                               <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Pts Standard / XP</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={theme.xpColor}
                                            onChange={(e) => updateTheme('xpColor', e.target.value)}
                                            className="w-10 h-10 border-none rounded cursor-pointer bg-transparent"
                                        />
                                        <div className="flex-grow flex flex-col justify-center">
                                            <div className="flex gap-1">
                                                <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: theme.xpColor }}></span>
                                                <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: theme.xpColor }}></span>
                                                <span className="w-3 h-3 rounded-full border border-stone-400 bg-transparent"></span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">{theme.xpColor}</span>
                                        </div>
                                    </div>
                               </div>
                           </div>
                      </div>

                  </div>

              </div>

              {/* Separator */}
              <hr className="border-gray-200" />

              {/* Card System Configuration - INDEPENDENT FROM CREATION MODE */}
              <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                  <div className="flex items-center justify-between border-b pb-2 mb-4">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                          <CreditCard size={18} /> Système de Carte (Calcul Automatique)
                      </h4>
                      <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500">{config.cardConfig?.active ? 'ACTIF' : 'INACTIF'}</span>
                          <button 
                              onClick={() => updateCardConfig('active', !config.cardConfig?.active)}
                              className={`w-10 h-5 rounded-full p-0.5 transition-colors ${config.cardConfig?.active ? 'bg-blue-500' : 'bg-gray-300'}`}
                          >
                              <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${config.cardConfig?.active ? 'translate-x-5' : ''}`} />
                          </button>
                      </div>
                  </div>

                  <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity ${config.cardConfig?.active ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Compétences à retenir</label>
                          <div className="flex items-center gap-2">
                              <input 
                                  type="number"
                                  value={config.cardConfig?.bestSkillsCount ?? 6}
                                  onChange={(e) => updateCardConfig('bestSkillsCount', parseInt(e.target.value))}
                                  className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                              />
                              <div title="Nombre de meilleures compétences utilisées pour la moyenne">
                                  <Info size={16} className="text-gray-400" />
                              </div>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Incrément par Palier</label>
                          <input 
                              type="number"
                              step="0.1"
                              value={config.cardConfig?.increment ?? 0.5}
                              onChange={(e) => updateCardConfig('increment', parseFloat(e.target.value))}
                              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Seuil de Base (Valet)</label>
                          <input 
                              type="number"
                              step="0.1"
                              value={config.cardConfig?.baseStart ?? 2}
                              onChange={(e) => updateCardConfig('baseStart', parseFloat(e.target.value))}
                              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                          />
                      </div>
                  </div>
              </div>

          </div>
      );
  };

  return (
    <div className="px-6 pb-20 max-w-[1400px] mx-auto relative">
      <div className="sticky top-14 z-40 mb-8 flex justify-center no-print pointer-events-none">
        <div className="pointer-events-auto flex gap-2 bg-white/90 backdrop-blur p-1.5 rounded-full shadow-lg border border-gray-200 items-center animate-in fade-in slide-in-from-top-4 duration-300 flex-wrap justify-center">
            <button onClick={() => setActiveTab('attributes')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'attributes' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><LayoutGrid size={16} /> Attributs</button>
            <button onClick={() => setActiveTab('skills')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'skills' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><List size={16} /> Compétences</button>
            <button onClick={() => setActiveTab('specializations')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'specializations' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Tag size={16} /> Spécialisations Imposées</button>
            <button onClick={() => setActiveTab('creation')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'creation' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><UserPlus size={16} /> Paramètres</button>
            <div className="w-px h-5 bg-gray-300 mx-1"></div>
            <button onClick={() => setShowResetConfirm(true)} className="px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors" title="Réinitialiser tout à zéro"><RefreshCw size={16} /> <span className="hidden sm:inline">Réinitialiser</span></button>
            <button onClick={() => { onUpdate(localData); onAddLog('Modifications de la structure sauvegardées', 'success', 'settings'); }} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 text-white shadow-md hover:scale-[1.02] transition-all ${isDirty ? 'bg-amber-600 hover:bg-amber-700 animate-pulse' : 'bg-green-600 hover:bg-green-700'}`} title={isDirty ? "Des modifications sont en attente de validation" : "La structure est à jour"}><Save size={16} /> Sauvegarder</button>
        </div>
      </div>
      
      <div className="space-y-8 min-h-[400px]">
         {activeTab === 'attributes' && renderAttributeEditor()}

         {activeTab === 'skills' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                 <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {renderCategoryEditor("Talents (Col 1)", "talents")}
                        {renderCategoryEditor("Compétences (Col 2)", "competences")}
                        {renderCategoryEditor("Compétences (Col 3)", "competences_col_2")}
                        {renderCategoryEditor("Connaissances (Col 4)", "connaissances")}
                    </div>
                 </div>
                 <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {renderCategoryEditor("Autres Compétences", "autres_competences")}
                        {renderCategoryEditor("Compétences Secondaires", "competences2")}
                        {renderCategoryEditor("Autres", "autres")}
                        {renderCategoryEditor("Arrières Plans", "arrieres_plans", "h-full", "Nouvel Arrière Plan")}
                    </div>
                 </div>
                 <div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         {renderCategoryEditor("Compteurs", "counters", "h-full", "Nouveau Compteur")}
                     </div>
                 </div>
             </div>
         )}

         {activeTab === 'specializations' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                 <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {renderSpecializationEditor("Talents (Col 1)", "talents")}
                        {renderSpecializationEditor("Compétences (Col 2)", "competences")}
                        {renderSpecializationEditor("Compétences (Col 3)", "competences_col_2")}
                        {renderSpecializationEditor("Connaissances (Col 4)", "connaissances")}
                    </div>
                 </div>
                 <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {renderSpecializationEditor("Autres Compétences", "autres_competences")}
                        {renderSpecializationEditor("Autres", "autres")}
                    </div>
                 </div>
             </div>
         )}

         {activeTab === 'creation' && renderCreationEditor()}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                <div className="bg-red-50 p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                         <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmer la réinitialisation</h3>
                    <p className="text-gray-600 text-sm">
                        Êtes-vous sûr de vouloir réinitialiser toute la fiche aux valeurs par défaut ? <br/>
                        <span className="font-bold text-red-600 mt-2 block">Toutes les données actuelles et la structure personnalisée seront définitivement perdues.</span>
                    </p>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-100">
                    <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">Annuler</button>
                    <button onClick={performReset} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm transition-colors">Oui, tout effacer</button>
                </div>
            </div>
        </div>
      )}

      {/* Attribute Preset Confirmation Modal */}
      {showPresetConfirm && pendingPreset && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                <div className="bg-yellow-50 p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-yellow-700">
                         <Zap size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Charger le préréglage ?</h3>
                    <div className="bg-white p-3 rounded border border-yellow-200 shadow-sm w-full mb-4">
                        <span className="block font-bold text-gray-800">{pendingPreset.name}</span>
                        <span className="text-xs text-gray-500">{pendingPreset.desc}</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Cette action va remplacer <span className="font-bold">toute</span> votre configuration d'attributs actuelle (catégories, noms et valeurs).
                        <span className="font-bold text-red-600 mt-2 block">Les valeurs d'attributs existantes seront perdues.</span>
                    </p>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-100">
                    <button 
                        onClick={() => { setShowPresetConfirm(false); setPendingPreset(null); }} 
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={executePresetLoad} 
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium shadow-sm transition-colors"
                    >
                        Confirmer le chargement
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
