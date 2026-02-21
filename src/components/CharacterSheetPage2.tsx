
import React from 'react';
import { CharacterSheetData, TraitEntry, LibraryEntry } from '../types';
import { BookOpen, X } from 'lucide-react';
import TraitLibrary from './TraitLibrary';
import { useCharacter } from '../context/CharacterContext';

import { useRules } from '../context/RulesContext';

// Imports Refactorisés
import { LEGACY_SKILL_MAP } from '../utils/migrations/migrateSkills';
import NotebookInput from './shared/NotebookInput';
import CharacterImageWidget from './shared/CharacterImageWidget';
import TraitRow from './sheet/page2/TraitRow';
import { Page2SectionHeader } from './sheet/page2/Page2Components';
import { useTraitEditor } from '../hooks/sheet/useTraitEditor';
import { useReputationManager } from '../hooks/sheet/useReputationManager';
import MysticSkillWizard from './sheet/ui/MysticSkillWizard';
import TraitEditModal from './sheet/page2/TraitEditModal';

interface Props {
    isLandscape?: boolean;
}

const CharacterSheetPage2: React.FC<Props> = ({ isLandscape = false }) => {
    const { data, updateData: onChange, addLog: onAddLog, recordXPTransaction } = useCharacter();
    const { rules } = useRules();

    const {
        multiSelectTarget, setMultiSelectTarget,
        removeTrait,
        handleMultiAdd
    } = useTraitEditor(data, rules, onChange, onAddLog, recordXPTransaction);

    const {
        updateReputationEntry,
        handleReputationKeyDown
    } = useReputationManager(data, onChange, onAddLog);

    // Mystic Wizard State
    const [wizardState, setWizardState] = React.useState<{ isOpen: boolean, mysticAbilityId: string | null, mysticAbilityName: string }>({
        isOpen: false,
        mysticAbilityId: null,
        mysticAbilityName: ''
    });

    const [editingTrait, setEditingTrait] = React.useState<{ type: 'avantages' | 'desavantages', index: number, trait: TraitEntry } | null>(null);

    // Wrapped handleMultiAdd to detect Mystic Ability link
    const handleMultiAddWrapper = (instances: { entry: LibraryEntry; variant?: string; cost?: string }[]) => {
        let mysticId: string | undefined;
        let mysticName: string | undefined;

        // Pre-process instances to inject missing mysticAbilityId
        const processedInstances = instances.map(instance => {
            // 1. Existing ID
            if (instance.entry.mysticAbilityId) {
                mysticId = instance.entry.mysticAbilityId;
                mysticName = instance.entry.name;
                return instance;
            }

            // 2. Fallback: Search by Name
            if (rules?.libraries?.mysticAbilities && rules.configurations?.creation?.mysticAbilities?.active) {
                const match = rules.libraries.mysticAbilities.find(
                    ma => ma.name.toLowerCase().trim() === instance.entry.name.toLowerCase().trim()
                );
                if (match) {
                    mysticId = match.id;
                    mysticName = match.name;
                    // Return patched instance
                    return {
                        ...instance,
                        entry: {
                            ...instance.entry,
                            mysticAbilityId: match.id
                        }
                    };
                }
            }
            return instance;
        });

        // Add the processed instances (with patched IDs)
        handleMultiAdd(processedInstances);

        if (mysticId && mysticName && rules?.configurations?.creation?.mysticAbilities?.active) {
            // Open Wizard
            setTimeout(() => {
                setWizardState({
                    isOpen: true,
                    mysticAbilityId: mysticId!,
                    mysticAbilityName: mysticName!
                });
            }, 100);
        }
    };

    const handleWizardConfirm = (skillIds: string[]) => {
        if (!wizardState.mysticAbilityId) return;

        // Add skills to sheet
        const newSkills = { ...data.skills };
        const newLibrary = [...(data.skillLibrary || [])];
        const libSkills = rules?.libraries?.skills || [];

        let addedCount = 0;

        skillIds.forEach(id => {
            const skillDef = libSkills.find(s => s.id === id);
            if (!skillDef) return;

            // Fallback placement logic
            let category = '';

            // 1. Check direct skill default category
            if (skillDef.defaultCategory) {
                category = LEGACY_SKILL_MAP[skillDef.defaultCategory] || skillDef.defaultCategory;
            }
            // 2. Check parent mystic ability default category
            else {
                const parentAbility = rules?.libraries?.mysticAbilities?.find(ma => ma.id === (skillDef.mysticAbilityId || wizardState.mysticAbilityId));
                if (parentAbility?.defaultCategory) {
                    category = LEGACY_SKILL_MAP[parentAbility.defaultCategory] || parentAbility.defaultCategory;
                }
            }

            // 3. Last resort: Hardcoded naming logic
            if (!category) {
                const nameLower = skillDef.name.toLowerCase();
                const isMartialArt = nameLower.includes('art martia');
                const isMystic = isMartialArt || wizardState.mysticAbilityName;

                if (isMystic) {
                    const mysticConfig = rules?.configurations?.creation?.mysticAbilities;
                    if (isMartialArt) {
                        category = mysticConfig?.defaultMartialArtsCategory || 'Col_Comp_7';
                    } else {
                        category = mysticConfig?.defaultMysticOtherCategory || 'Col_Comp_5';
                    }
                } else {
                    category = 'competences'; // Default fallback for everything else
                }
            }

            if (!newSkills[category]) newSkills[category] = [];

            // Check if already exists
            const existing = newSkills[category].find(s => s.name === skillDef.name);
            if (!existing) {
                // Add to skills
                newSkills[category].push({
                    id: crypto.randomUUID(),
                    name: skillDef.name,
                    value: 0,
                    creationValue: 0, // Initially learned at level 0
                    max: 5,
                    variant: skillDef.isVariable ? '' : undefined,
                    description: skillDef.description || undefined,
                    definitionId: skillDef.id, // Lien vers la bibliothèque pour l'enrichissement des couleurs
                    mysticAbilityId: skillDef.mysticAbilityId || wizardState.mysticAbilityId || undefined
                } as any);

                // Add to local library if not present
                if (!newLibrary.find(l => l.id === skillDef.id)) {
                    newLibrary.push(skillDef);
                }
                addedCount++;
            }
        });

        if (addedCount > 0) {
            onChange({
                ...data,
                skills: newSkills,
                skillLibrary: newLibrary
            });
            onAddLog(`Ajout de ${addedCount} compétence(s) mystique(s) liée(s) à ${wizardState.mysticAbilityName}`, 'info', 'sheet', 'Compétences');
        }

        // Close wizard (even if 0 added, user confirmed)
        setWizardState(prev => ({ ...prev, isOpen: false }));
    };

    const updateStringField = (field: keyof CharacterSheetData['page2'], value: string) => {
        onChange({ ...data, page2: { ...data.page2, [field]: value } });
        onAddLog(`Modification ${String(field)}`, 'info', 'sheet', `${String(field)}`);
    };

    const handleSaveTrait = (updatedTrait: TraitEntry) => {
        if (!editingTrait) return;

        const { type, index } = editingTrait;
        const oldTrait = data.page2[type][index];
        const newList = [...data.page2[type]];
        newList[index] = updatedTrait;

        // Log XP if changed and post-creation
        if (updatedTrait.isPostCreation && updatedTrait.value !== oldTrait.value) {
            const oldVal = parseInt(oldTrait.value) || 0;
            const newVal = parseInt(updatedTrait.value) || 0;
            const traitCostFactor = rules?.configurations?.xpCosts?.traitCost ?? (data.xpCosts?.traitCost ?? 5);
            const diff = Math.abs(newVal - oldVal);

            if (diff !== 0) {
                recordXPTransaction({
                    type: newVal > oldVal ? 'spend' : 'refund',
                    description: `Modification Trait : ${updatedTrait.name} (${oldVal} → ${newVal})`,
                    amount: diff * traitCostFactor,
                    source: 'XP Libre'
                });
            }
        } else if (type === 'desavantages' && oldTrait.creationValue !== undefined && updatedTrait.value !== oldTrait.value) {
            // Special case: rachat de désavantage
            const oldVal = parseInt(oldTrait.value) || 0;
            const newVal = parseInt(updatedTrait.value) || 0;
            const traitCostFactor = rules?.configurations?.xpCosts?.traitCost ?? (data.xpCosts?.traitCost ?? 5);
            const diff = Math.abs(newVal - oldVal);

            if (diff !== 0) {
                recordXPTransaction({
                    type: newVal < oldVal ? 'spend' : 'refund', // Réduire un désavantage coûte de l'XP
                    description: `Réduction Désavantage : ${updatedTrait.name} (${oldVal} → ${newVal})`,
                    amount: diff * traitCostFactor,
                    source: 'XP Libre'
                });
            }
        }

        // Mettre à jour le compteur auto si le variant a changé
        let newCounters = data.counters;
        if (
            updatedTrait.associatedCounterId &&
            updatedTrait.variant !== oldTrait.variant
        ) {
            const traitDef = rules?.libraries?.traits?.find(t => t.id === updatedTrait.definitionId);
            const counterEffect = traitDef?.effects?.find(e => e.type === 'auto_counter');

            const baseCounterName = counterEffect?.target?.trim();
            const variantName = updatedTrait.variant?.trim();
            let newCounterName = '';
            if (baseCounterName) {
                newCounterName = variantName ? `${baseCounterName} (${variantName})` : baseCounterName;
            } else {
                newCounterName = variantName || updatedTrait.name;
            }

            const customCounters = data.counters.custom.map(c =>
                c.id === updatedTrait.associatedCounterId ? { ...c, name: newCounterName } : c
            );
            newCounters = { ...data.counters, custom: customCounters };
            onAddLog(`Compteur mis à jour : ${newCounterName}`, 'info', 'sheet');
        }

        onChange({ ...data, page2: { ...data.page2, [type]: newList }, counters: newCounters });
        onAddLog(`Modification ${type === 'avantages' ? 'Avantage' : 'Désavantage'} : ${updatedTrait.name}`, 'info', 'sheet');
        setEditingTrait(null);
    };

    const handleImageLog = React.useCallback((msg: string, type: 'success' | 'danger') => {
        onAddLog(msg, type, 'sheet');
    }, [onAddLog]);

    const updateCharacterImageId = React.useCallback((id: string) => {
        onChange((prev: CharacterSheetData) => ({
            ...prev,
            page2: { ...prev.page2, characterImageId: id, characterImage: '' }
        }));
    }, [onChange]);

    const calculateTotal = (list: TraitEntry[]) => list.reduce((acc, item) => acc + (parseInt(item.value) || 0), 0);

    const AvantagesColumn = (
        <div className="col-span-1 border-r border-stone-400 p-1.5 flex flex-col h-full overflow-hidden">
            <Page2SectionHeader title="Avantages" total={calculateTotal(data.page2.avantages)} onOpenLibrary={() => setMultiSelectTarget('avantages')} totalColor="text-green-700 bg-green-50 border-green-200" />
            <div className="space-y-0.5 flex-grow overflow-auto min-h-0 custom-scrollbar">
                {data.page2.avantages.map((item, i) => (
                    <TraitRow
                        key={i}
                        item={item}
                        onClick={() => {
                            if (!item.name.trim()) setMultiSelectTarget('avantages');
                            else setEditingTrait({ type: 'avantages', index: i, trait: item });
                        }}
                        onRemove={(e) => {
                            e.stopPropagation();
                            removeTrait('avantages', i);
                        }}
                        onManageMystic={(e) => {
                            e.stopPropagation();
                            if (item.mysticAbilityId) {
                                setWizardState({
                                    isOpen: true,
                                    mysticAbilityId: item.mysticAbilityId,
                                    mysticAbilityName: item.name
                                });
                            }
                        }}
                    />
                ))}
            </div>
        </div>
    );

    const DesavantagesColumn = (
        <div className="col-span-1 p-1.5 flex flex-col h-full overflow-hidden">
            <Page2SectionHeader title="Désavantages" total={calculateTotal(data.page2.desavantages)} onOpenLibrary={() => setMultiSelectTarget('desavantages')} totalColor="text-red-700 bg-red-50 border-red-200" />
            <div className="space-y-0.5 flex-grow overflow-auto min-h-0 custom-scrollbar">
                {data.page2.desavantages.map((item, i) => (
                    <TraitRow
                        key={i}
                        item={item}
                        onClick={() => {
                            if (!item.name.trim()) setMultiSelectTarget('desavantages');
                            else setEditingTrait({ type: 'desavantages', index: i, trait: item });
                        }}
                        onRemove={(e) => {
                            e.stopPropagation();
                            removeTrait('desavantages', i);
                        }}
                    />
                ))}
            </div>
        </div>
    );

    const ReputationHeader = () => (
        <div className="bg-slate-200 text-slate-800 text-xs border-y border-stone-500 uppercase py-0.5 tracking-wide mb-0.5 flex items-center min-h-[1.5rem] shadow-sm font-bold shrink-0">
            <span className="w-1/2 text-center pl-1">Réputation</span>
            <span className="w-1/4 text-center border-l border-stone-400">Lieu</span>
            <span className="w-1/4 text-center border-l border-stone-400">Valeur</span>
        </div>
    );

    return (
        <>
            {isLandscape ? (
                <div className="sheet-container landscape flex flex-col overflow-hidden">
                    <div className="grid grid-cols-4 border-b-2 border-stone-800 h-[35%] overflow-hidden">
                        <div className="border-r border-stone-400 p-0 flex flex-col h-full overflow-hidden bg-stone-50"><CharacterImageWidget imageId={data.page2.characterImageId} legacyImage={data.page2.characterImage} onImageUpdate={updateCharacterImageId} onAddLog={handleImageLog} /></div>
                        <div className="border-r border-stone-400 p-1.5 flex flex-col gap-2 h-full overflow-hidden">
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden"><Page2SectionHeader title="Lieux Importants" /><div className="flex-grow relative min-h-0"><NotebookInput value={data.page2.lieux_importants} onChange={(v) => updateStringField('lieux_importants', v)} /></div></div>
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden"><Page2SectionHeader title="Contacts" /><div className="flex-grow relative min-h-0"><NotebookInput value={data.page2.contacts} onChange={(v) => updateStringField('contacts', v)} /></div></div>
                        </div>
                        <div className="border-r border-stone-400 p-1.5 flex flex-col gap-2 h-full overflow-hidden">
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden"><Page2SectionHeader title="Connaissances" /><div className="flex-grow relative min-h-0"><NotebookInput value={data.page2.connaissances} onChange={(v) => updateStringField('connaissances', v)} /></div></div>
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden"><ReputationHeader /><div className="flex-grow overflow-y-auto custom-scrollbar">{data.page2.reputation.map((rep, i) => (
                                <div key={i} className="flex h-[22px] items-end shrink-0 border-b border-stone-200">
                                    <input id={`rep-row-${i}-rep`} className="w-1/2 bg-transparent font-handwriting text-ink text-sm h-full px-1 focus:outline-none" value={rep.reputation} onChange={(e) => updateReputationEntry(i, 'reputation', e.target.value)} onKeyDown={(e) => handleReputationKeyDown(e, i, 'reputation')} />
                                    <input id={`rep-row-${i}-lieu`} className="w-1/4 bg-transparent font-handwriting text-ink text-sm h-full border-l border-stone-200 px-1 focus:outline-none" value={rep.lieu} onChange={(e) => updateReputationEntry(i, 'lieu', e.target.value)} onKeyDown={(e) => handleReputationKeyDown(e, i, 'lieu')} />
                                    <input id={`rep-row-${i}-val`} className="w-1/4 bg-transparent font-handwriting text-ink text-sm h-full border-l border-stone-200 px-1 focus:outline-none" value={rep.valeur} onChange={(e) => updateReputationEntry(i, 'valeur', e.target.value)} onKeyDown={(e) => handleReputationKeyDown(e, i, 'valeur')} />
                                </div>))}</div>
                            </div>
                        </div>
                        <div className="p-1.5 flex flex-col gap-2 h-full overflow-hidden">
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden"><Page2SectionHeader title="Valeurs Monétaires" /><div className="flex-grow relative min-h-0"><NotebookInput value={data.page2.valeurs_monetaires} onChange={(v) => updateStringField('valeurs_monetaires', v)} /></div></div>
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden"><Page2SectionHeader title="Armes" /><div className="flex-grow relative min-h-0"><NotebookInput value={data.page2.armes_list} onChange={(v) => updateStringField('armes_list', v)} /></div></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 h-[65%] overflow-hidden">
                        {AvantagesColumn}
                        <div className="border-l border-stone-400 -ml-[1px] h-full overflow-hidden">{DesavantagesColumn}</div>
                        <div className="col-span-1 border-r border-l border-stone-400 p-1.5 flex flex-col h-full overflow-hidden"><Page2SectionHeader title="Equipement" /><div className="flex-grow min-h-0"><NotebookInput value={data.page2.equipement} onChange={(v) => updateStringField('equipement', v)} /></div></div>
                        <div className="col-span-1 p-1.5 flex flex-col h-full overflow-hidden"><Page2SectionHeader title="Notes" /><div className="flex-grow min-h-0"><NotebookInput value={data.page2.notes} onChange={(v) => updateStringField('notes', v)} /></div></div>
                    </div>
                </div>
            ) : (
                <div className="sheet-container flex flex-col">
                    <div className="flex border-b border-stone-400 h-[400px] shrink-0 overflow-hidden">
                        <div className="w-[35%] border-r border-stone-400 bg-stone-50 p-0 flex flex-col overflow-hidden"><CharacterImageWidget imageId={data.page2.characterImageId} legacyImage={data.page2.characterImage} onImageUpdate={updateCharacterImageId} onAddLog={handleImageLog} /></div>
                        <div className="w-[65%] flex flex-col overflow-hidden">
                            <div className="h-1/3 flex border-b border-stone-400">
                                <div className="w-1/2 border-r border-stone-400 p-1 flex flex-col"><Page2SectionHeader title="Lieux Importants" /><div className="flex-grow relative min-h-0 overflow-hidden"><NotebookInput value={data.page2.lieux_importants} onChange={(v) => updateStringField('lieux_importants', v)} /></div></div>
                                <div className="w-1/2 p-1 flex flex-col"><Page2SectionHeader title="Contacts" /><div className="flex-grow relative min-h-0 overflow-hidden"><NotebookInput value={data.page2.contacts} onChange={(v) => updateStringField('contacts', v)} /></div></div>
                            </div>
                            <div className="h-1/3 flex border-b border-stone-400">
                                <div className="w-1/2 border-r border-stone-400 p-1 flex flex-col"><Page2SectionHeader title="Connaissances" /><div className="flex-grow relative min-h-0 overflow-hidden"><NotebookInput value={data.page2.connaissances} onChange={(v) => updateStringField('connaissances', v)} /></div></div>
                                <div className="w-1/2 p-1 flex flex-col overflow-hidden"><ReputationHeader /><div className="flex-grow overflow-y-auto custom-scrollbar">{data.page2.reputation.map((rep, i) => (
                                    <div key={i} className="flex h-[22px] items-end border-b border-stone-200">
                                        <input id={`rep-row-${i}-rep`} className="w-1/2 bg-transparent font-handwriting text-ink text-sm h-full px-1 focus:outline-none" value={rep.reputation} onChange={(e) => updateReputationEntry(i, 'reputation', e.target.value)} onKeyDown={(e) => handleReputationKeyDown(e, i, 'reputation')} />
                                        <input id={`rep-row-${i}-lieu`} className="w-1/4 bg-transparent font-handwriting text-ink text-sm h-full border-l border-stone-200 px-1 focus:outline-none" value={rep.lieu} onChange={(e) => updateReputationEntry(i, 'lieu', e.target.value)} onKeyDown={(e) => handleReputationKeyDown(e, i, 'lieu')} />
                                        <input id={`rep-row-${i}-val`} className="w-1/4 bg-transparent font-handwriting text-ink text-sm h-full border-l border-stone-200 px-1 focus:outline-none" value={rep.valeur} onChange={(e) => updateReputationEntry(i, 'valeur', e.target.value)} onKeyDown={(e) => handleReputationKeyDown(e, i, 'valeur')} />
                                    </div>))}</div>
                                </div>
                            </div>
                            <div className="h-1/3 flex">
                                <div className="w-1/2 border-r border-stone-400 p-1 flex flex-col"><Page2SectionHeader title="Valeurs Monétaires" /><div className="flex-grow relative min-h-0 overflow-hidden"><NotebookInput value={data.page2.valeurs_monetaires} onChange={(v) => updateStringField('valeurs_monetaires', v)} /></div></div>
                                <div className="w-1/2 p-1 flex flex-col"><Page2SectionHeader title="Armes" /><div className="flex-grow relative min-h-0 overflow-hidden"><NotebookInput value={data.page2.armes_list} onChange={(v) => updateStringField('armes_list', v)} /></div></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex h-[720px] overflow-hidden shrink-0 border-b border-stone-400">
                        <div className="w-[67.5%] border-r border-stone-400 flex flex-col"><Page2SectionHeader title="Traits - Signes Particuliers" /><div className="grid grid-cols-2 flex-grow overflow-hidden min-h-0">{AvantagesColumn}<div className="border-l border-stone-400 -ml-[1px] h-full overflow-hidden">{DesavantagesColumn}</div></div></div>
                        <div className="w-[32.5%] flex flex-col h-full overflow-hidden"><Page2SectionHeader title="Equipement" /><div className="p-1.5 flex-grow min-h-0"><NotebookInput value={data.page2.equipement} onChange={(v) => updateStringField('equipement', v)} /></div></div>
                    </div>
                    <div className="flex-grow border-t border-stone-400 p-1.5 flex flex-col shrink-0 min-h-[440px]"><Page2SectionHeader title="Notes" /><div className="flex-grow min-h-0 mt-1 flex flex-col"><NotebookInput className="flex-grow" value={data.page2.notes} onChange={(v) => updateStringField('notes', v)} /></div></div>
                </div>
            )}


            {multiSelectTarget && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden">
                        <div className={`p-4 border-b flex justify-between items-center text-white ${multiSelectTarget === 'avantages' ? 'bg-green-700' : 'bg-red-700'}`}>
                            <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen size={20} />Ajouter des {multiSelectTarget === 'avantages' ? 'Avantages' : 'Désavantages'}</h3>
                            <button onClick={() => setMultiSelectTarget(null)} className="hover:bg-white/20 p-1 rounded transition-colors"><X size={24} /></button>
                        </div>
                        <div className="flex-grow overflow-hidden relative"><TraitLibrary data={data} onUpdate={onChange} isEditable={false} defaultFilter={multiSelectTarget === 'avantages' ? 'avantage' : 'desavantage'} onMultiSelect={handleMultiAddWrapper} hidePossessed={true} lockFilter={true} /></div>
                    </div>
                </div>
            )}

            {wizardState.isOpen && wizardState.mysticAbilityId && rules && (
                <MysticSkillWizard
                    isOpen={wizardState.isOpen}
                    onClose={() => setWizardState(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={handleWizardConfirm}
                    mysticAbilityId={wizardState.mysticAbilityId}
                    mysticAbilityName={wizardState.mysticAbilityName}
                    sheet={data}
                    rules={rules}
                />
            )}

            {editingTrait && (
                <TraitEditModal
                    isOpen={!!editingTrait}
                    onClose={() => setEditingTrait(null)}
                    trait={editingTrait.trait}
                    onSave={handleSaveTrait}
                    type={editingTrait.type}
                />
            )}
        </>
    );
};

export default CharacterSheetPage2;
