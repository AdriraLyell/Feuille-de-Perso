
import React, { useMemo, useState } from 'react';
import { CharacterSheetData, DotEntry, AttributeEntry, CombatEntry, SkillCategoryKey, BonusInfo } from '../types';
import { UserPlus, AlertTriangle, Sliders, Check } from 'lucide-react';
import { resetCharacterValues } from '../utils/characterUtils'; // Updated path
import { calculateCardValue } from '../utils/mechanics'; // Updated path

// Imports des sous-composants refactorisés
import { SectionHeader, HeaderInput } from './sheet/Shared';
import { AttributeBlock } from './sheet/AttributeBlock';
import { SkillBlock } from './sheet/SkillBlock';
import { useNotification } from '../context/NotificationContext';
import { useCharacter } from '../context/CharacterContext';
import { CombatSection } from './sheet/CombatSection';
import { CountersSection } from './sheet/CountersSection';

interface Props {
    isLandscape?: boolean;
}

const CharacterSheet: React.FC<Props> = ({ isLandscape = false }) => {
    const { data, updateData: onChange, addLog: onAddLog } = useCharacter();
    const [showCreationWarning, setShowCreationWarning] = useState(false);

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
            onChange({ ...data, counters: { ...data.counters, custom: newCustom } });
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

    const cardValue = calculateCardValue(data);

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
                blocks: [] as { title: string, items: DotEntry[], cat: string }[],
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

    const getAttributesGridClass = () => {
        const count = attributeCategories.length;
        if (count === 1) return 'grid-cols-1';
        if (count === 2) return 'grid-cols-2';
        if (count === 3) return 'grid-cols-3';
        if (count === 4) return 'grid-cols-4';
        return 'grid-cols-3'; // fallback
    };

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
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${creationActive
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
                                        theme={data.theme}
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
                                theme={data.theme}
                            />
                        </div>
                        <div className="flex-none border-b border-stone-400 overflow-hidden">
                            <CombatSection data={data} updateCombatWeapon={updateCombatWeapon} updateArmor={updateArmor} />
                        </div>
                        <div className="flex-grow overflow-hidden">
                            <CountersSection data={data} updateCounter={updateCounter} isLandscape={isLandscape} />
                        </div>
                    </div>
                </div>
            ) : (
                /* --- Portrait Layout (Standard) --- */
                <>
                    <div className="grid grid-cols-4 border-b-2 border-stone-800 h-auto">
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Talents" items={data.skills.talents || []} cat="talents" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Compétences" items={data.skills.competences || []} cat="competences" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Compétences" items={data.skills.competences_col_2 || []} cat="competences_col_2" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                        <div>
                            <SkillBlock title="Connaissances" items={data.skills.connaissances || []} cat="connaissances" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 border-b-2 border-stone-800 flex-grow min-h-[200px]">
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Autres Compétences" items={data.skills.autres_competences || []} cat="autres_competences" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Compétences Secondaires" items={data.skills.competences2 || []} cat="competences2" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Autres" items={data.skills.autres || []} cat="autres" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                        <div>
                            <SkillBlock title="Arrières Plans" items={data.skills.arrieres_plans || []} cat="arrieres_plans" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2">
                        <div className="border-r-2 border-stone-800 flex flex-col">
                            <CombatSection data={data} updateCombatWeapon={updateCombatWeapon} updateArmor={updateArmor} />
                        </div>
                        <div className="flex flex-col">
                            <CountersSection data={data} updateCounter={updateCounter} isLandscape={isLandscape} />
                        </div>
                    </div>
                </>
            )}

            {/* Creation Mode Activation Warning Modal */}
            {showCreationWarning && (
                <div className="fixed inset-0 bg-stone-950/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm no-print animate-in fade-in duration-200">
                    <div className="bg-[#fdfbf7] rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-400 relative">
                        {/* Paper Texture hint */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

                        {/* Header */}
                        <div className="bg-stone-900 p-6 flex items-center gap-4 border-b-4 border-amber-600 relative z-10">
                            <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center text-amber-500 border-2 border-amber-600 shadow-lg shrink-0">
                                <UserPlus size={32} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-amber-50 font-serif tracking-wide uppercase">Nouvelle Session</h3>
                                <p className="text-stone-400 text-sm font-medium">Initialisation du protocole de création</p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-8 relative z-10">

                            {/* Warning Block */}
                            <div className="bg-red-50 border-l-8 border-red-600 p-6 mb-8 shadow-sm">
                                <h4 className="text-red-900 font-bold text-lg mb-2 flex items-center gap-2 uppercase tracking-wide font-serif">
                                    <AlertTriangle size={24} /> Avertissement
                                </h4>
                                <p className="text-red-800 text-base leading-relaxed">
                                    L'activation du mode création va <strong>effacer irréversiblement</strong> les données actuelles du personnage (Identité, XP, Valeurs) pour repartir d'une feuille vierge.
                                </p>
                                <p className="text-red-700 text-sm mt-2 italic">
                                    La structure (noms des compétences) et la bibliothèque seront conservées.
                                </p>
                            </div>

                            {/* Settings Recap */}
                            <div className="bg-white border border-stone-200 p-6 rounded-sm shadow-inner">
                                <h4 className="text-stone-500 font-bold text-xs uppercase tracking-widest mb-4 border-b border-stone-200 pb-2 flex items-center gap-2">
                                    <Sliders size={14} /> Paramètres de la session
                                </h4>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1">
                                        <span className="block text-xs font-bold text-stone-400 uppercase">Mode de Création</span>
                                        <span className="block text-2xl font-serif font-bold text-indigo-900">
                                            {data.creationConfig.mode === 'points' ? 'Par Points (XP)' : 'Par Rangs'}
                                        </span>
                                    </div>

                                    {data.creationConfig.mode === 'points' ? (
                                        <>
                                            <div>
                                                <span className="block text-xs font-bold text-stone-400 uppercase">Budget</span>
                                                {(!data.creationConfig.pointsDistributionMode || data.creationConfig.pointsDistributionMode === 'global') ? (
                                                    <span className="block text-xl font-mono font-bold text-stone-700">{data.creationConfig.startingXP} XP (Global)</span>
                                                ) : (
                                                    <div className="text-sm font-medium text-stone-700 space-y-1 mt-1">
                                                        <div className="flex justify-between border-b border-dotted border-stone-300"><span>Attributs:</span> <b>{data.creationConfig.pointsBuckets?.attributes} XP</b></div>
                                                        <div className="flex justify-between border-b border-dotted border-stone-300"><span>Compétences:</span> <b>{data.creationConfig.pointsBuckets?.skills} XP</b></div>
                                                        <div className="flex justify-between"><span>Arr. Plans:</span> <b>{data.creationConfig.pointsBuckets?.backgrounds} XP</b></div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <span className="block text-xs font-bold text-stone-400 uppercase">Budgets</span>
                                                <div className="text-sm font-medium text-stone-700 mt-1">
                                                    <span className="mr-3">Attributs: <b>{data.creationConfig.attributePoints}</b></span>
                                                    <span>Arr. Plans: <b>{data.creationConfig.backgroundPoints}</b></span>
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="block text-xs font-bold text-stone-400 uppercase mb-1">Rangs</span>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map(r => (
                                                        <div key={r} className="bg-stone-100 border border-stone-300 px-3 py-1 rounded text-center">
                                                            <div className="text-[10px] text-stone-500 font-bold uppercase">R{r}</div>
                                                            {/* @ts-ignore */}
                                                            <div className="font-mono font-bold text-lg text-stone-800">{data.creationConfig.rankSlots[r]}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="bg-stone-100 p-6 flex justify-end gap-4 border-t border-stone-300 relative z-10">
                            <button
                                onClick={() => setShowCreationWarning(false)}
                                className="px-6 py-3 bg-white border border-stone-300 text-stone-600 font-bold rounded hover:bg-stone-50 transition-colors uppercase tracking-wide text-sm"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={executeCreationActivation}
                                className="px-8 py-3 bg-green-700 text-green-50 font-bold rounded shadow-lg hover:bg-green-800 hover:shadow-xl transition-all uppercase tracking-wide text-sm flex items-center gap-2"
                            >
                                <Check size={18} />
                                Confirmer et Réinitialiser
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CharacterSheet;
