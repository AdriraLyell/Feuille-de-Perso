import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CharacterSheetData, TraitEntry, LibraryEntry, DotEntry } from '../types';
import { useCharacter } from '../context/CharacterContext';
import { useRules } from '../context/RulesContext';

// Icons
import { BookOpen, X } from 'lucide-react';

// Refactored Imports
import { LEGACY_SKILL_MAP } from '../utils/migrations/migrateSkills';
import { useTraitEditor } from '../hooks/sheet/useTraitEditor';
import { useReputationManager } from '../hooks/sheet/useReputationManager';
import MysticSkillWizard from './sheet/ui/MysticSkillWizard';
import MasterSkillWizard from './sheet/ui/MasterSkillWizard';
import TraitEditModal from './sheet/page2/TraitEditModal';
import TraitLibrary from './TraitLibrary';

import CharacterImageWidget from './shared/CharacterImageWidget';
import NotebookInput from './shared/NotebookInput';
import { Page2SectionHeader } from './sheet/page2/Page2Components';
import { IdentityBoxes, NotesBoxes } from './sheet/page2/Page2SidebarBoxes';
import { TraitsColumn } from './sheet/page2/TraitsColumn';

interface Props {
    isLandscape?: boolean;
}

type WizardQueueItem =
    | { type: 'mystic', payload: { mysticAbilityId: string, mysticAbilityName: string } }
    | { type: 'master', payload: { traitName: string, traitType: 'avantages' | 'desavantages' } };

const CharacterSheetPage2: React.FC<Props> = ({ isLandscape = false }) => {
    const { data, resolvedData } = useCharacterState();
    const { updateData: onChange, addLog: onAddLog, recordXPTransaction } = useCharacterActions();
    const { rules } = useRules();

    // Wizards Queue State
    const [wizardQueue, setWizardQueue] = useState<WizardQueueItem[]>([]);
    const multiSelectTargetRef = useRef<'avantages' | 'desavantages' | null>(null);

    const [editingTrait, setEditingTrait] = useState<{ type: 'avantages' | 'desavantages', index: number, trait: TraitEntry } | null>(null);

    // Hooks
    const {
        multiSelectTarget, setMultiSelectTarget,
        removeTrait,
        handleMultiAdd,
        applyMasterSkill
    } = useTraitEditor(data, rules, onChange, onAddLog, recordXPTransaction, (items) => {
        setWizardQueue(prev => [
            ...prev,
            ...items.map(it => ({ type: 'master' as const, payload: it }))
        ]);
    });

    useEffect(() => {
        if (multiSelectTarget !== null) {
            multiSelectTargetRef.current = multiSelectTarget;
        }
    }, [multiSelectTarget]);

    const {
        updateReputationEntry,
        handleReputationKeyDown
    } = useReputationManager(data, onChange, onAddLog);

    // Handlers
    const handleMultiAddWrapper = (instances: { entry: LibraryEntry; variant?: string; cost?: string }[]) => {
        const newMysticWizards: WizardQueueItem[] = [];

        const processedInstances = instances.map(instance => {
            let mId = instance.entry.mysticAbilityId;
            let mName = instance.entry.name;

            if (!mId && rules?.libraries?.mysticAbilities && rules.configurations?.creation?.mysticAbilities?.active) {
                const match = rules.libraries.mysticAbilities.find(
                    ma => ma.name.toLowerCase().trim() === instance.entry.name.toLowerCase().trim()
                );
                if (match) {
                    mId = match.id;
                    mName = match.name;
                }
            }

            if (mId && mName && rules?.configurations?.creation?.mysticAbilities?.active) {
                newMysticWizards.push({ type: 'mystic', payload: { mysticAbilityId: mId, mysticAbilityName: mName } });
                return { ...instance, entry: { ...instance.entry, mysticAbilityId: mId } };
            }
            return instance;
        });

        handleMultiAdd(processedInstances);

        if (newMysticWizards.length > 0) {
            setTimeout(() => {
                setWizardQueue(prev => [...prev, ...newMysticWizards]);
            }, 100);
        }
    };

    const handleWizardConfirm = (skillIds: string[]) => {
        const currentWizard = wizardQueue[0];
        if (!currentWizard || currentWizard.type !== 'mystic') return;

        const { mysticAbilityId, mysticAbilityName } = currentWizard.payload;

        const newSkills = { ...data.skills };
        const newLibrary = [...(data.skillLibrary || [])];
        const libSkills = rules?.libraries?.skills || [];

        let addedCount = 0;

        skillIds.forEach(id => {
            const skillDef = libSkills.find(s => s.id === id);
            if (!skillDef) return;

            let category = '';
            if (skillDef.defaultCategory) {
                category = LEGACY_SKILL_MAP[skillDef.defaultCategory] || skillDef.defaultCategory;
            } else {
                const parentAbility = rules?.libraries?.mysticAbilities?.find(ma => ma.id === (skillDef.mysticAbilityId || mysticAbilityId));
                if (parentAbility?.defaultCategory) {
                    category = LEGACY_SKILL_MAP[parentAbility.defaultCategory] || parentAbility.defaultCategory;
                }
            }

            if (!category) {
                const nameLower = skillDef.name.toLowerCase();
                const isMartialArt = nameLower.includes('art martia');
                if (isMartialArt || mysticAbilityName) {
                    const mysticConfig = rules?.configurations?.creation?.mysticAbilities;
                    category = isMartialArt ? (mysticConfig?.defaultMartialArtsCategory || 'Col_Comp_7') : (mysticConfig?.defaultMysticOtherCategory || 'Col_Comp_5');
                } else {
                    category = 'competences';
                }
            }

            if (!newSkills[category]) newSkills[category] = [];
            const existing = newSkills[category].find(s => s.name === skillDef.name);
            if (!existing) {
                newSkills[category].push({
                    id: crypto.randomUUID(),
                    name: skillDef.name,
                    value: 0,
                    creationValue: 0,
                    max: 5,
                    variant: skillDef.isVariable ? '' : undefined,
                    description: skillDef.description || undefined,
                    definitionId: skillDef.id,
                    mysticAbilityId: skillDef.mysticAbilityId || mysticAbilityId || undefined
                } as DotEntry);

                if (!newLibrary.find(l => l.id === skillDef.id)) {
                    newLibrary.push(skillDef);
                }
                addedCount++;
            }
        });

        if (addedCount > 0) {
            onChange({ ...data, skills: newSkills, skillLibrary: newLibrary });
            onAddLog(`Ajout de ${addedCount} compétence(s) mystique(s) (${mysticAbilityName})`, 'info', 'sheet');
        }

        // Remove current from queue
        setWizardQueue(prev => prev.slice(1));
    };

    const updateStringField = (field: keyof CharacterSheetData['page2'], value: string) => {
        onChange({ ...data, page2: { ...data.page2, [field]: value } });
    };

    const handleSaveTrait = (updatedTrait: TraitEntry) => {
        if (!editingTrait) return;
        const { type, index } = editingTrait;
        const newList = [...data.page2[type]];
        newList[index] = updatedTrait;

        // Note: XP Logic could be here or in a hook. Kept simple for now.
        onChange({ ...data, page2: { ...data.page2, [type]: newList } });
        setEditingTrait(null);
    };

    const handleMasterSkillConfirm = useCallback((categoryId: string, skillName: string) => {
        const currentWizard = wizardQueue[0];
        if (!currentWizard || currentWizard.type !== 'master') return;

        const updated = applyMasterSkill(data, currentWizard.payload.traitType, currentWizard.payload.traitName, categoryId, skillName);
        onChange(updated);

        // Remove current from queue
        setWizardQueue(prev => prev.slice(1));
    }, [wizardQueue, applyMasterSkill, data, onChange]);

    const calculateTotal = (list: TraitEntry[]) => list.reduce((acc, item) => acc + (parseInt(item.value) || 0), 0);

    const avantagesTotal = useMemo(() => calculateTotal(resolvedData.page2.avantages), [resolvedData.page2.avantages]);
    const desavantagesTotal = useMemo(() => calculateTotal(resolvedData.page2.desavantages), [resolvedData.page2.desavantages]);

    const handleImageLog = React.useCallback((msg: string, type: 'success' | 'danger') => {
        onAddLog(msg, type, 'sheet');
    }, [onAddLog]);

    const updateCharacterImageId = React.useCallback((id: string) => {
        onChange((prev: CharacterSheetData) => ({
            ...prev,
            page2: { ...prev.page2, characterImageId: id, characterImage: '' }
        }));
    }, [onChange]);

    const commonTraitsProps = {
        onTraitClick: (index: number, item: TraitEntry, type: 'avantages' | 'desavantages') => {
            if (!item.name.trim()) setMultiSelectTarget(type);
            else setEditingTrait({ type, index, trait: item });
        },
        onRemove: (type: 'avantages' | 'desavantages', index: number) => removeTrait(type, index)
    };

    const activeWizard = wizardQueue[0];

    return (
        <>
            {isLandscape ? (
                <div className="sheet-container landscape flex flex-col overflow-hidden">
                    <div className="grid grid-cols-4 border-b-2 border-stone-800 h-[35%] overflow-hidden">
                        <div className="border-r border-stone-400 p-0 flex flex-col h-full overflow-hidden bg-stone-50">
                            <CharacterImageWidget imageId={data.page2.characterImageId} legacyImage={data.page2.characterImage} onImageUpdate={updateCharacterImageId} onAddLog={handleImageLog} />
                        </div>
                        <div className="border-r border-stone-400 p-1.5 flex flex-col gap-2 h-full overflow-hidden">
                            <IdentityBoxes data={data} updateStringField={updateStringField} />
                        </div>
                        <div className="col-span-2 p-1.5 flex flex-col gap-2 h-full overflow-hidden">
                            <NotesBoxes data={data} updateStringField={updateStringField} updateReputationEntry={updateReputationEntry} handleReputationKeyDown={handleReputationKeyDown} />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 h-[65%] overflow-hidden">
                        <TraitsColumn
                            title="Avantages"
                            traits={resolvedData.page2.avantages}
                            type="avantages"
                            total={avantagesTotal}
                            totalColor="text-green-700 bg-green-50 border-green-200"
                            onOpenLibrary={() => setMultiSelectTarget('avantages')}
                            onTraitClick={(i, trait) => commonTraitsProps.onTraitClick(i, trait, 'avantages')}
                            onRemove={(i) => commonTraitsProps.onRemove('avantages', i)}
                            onManageMystic={(i, trait) => {
                                if (trait.mysticAbilityId) setWizardQueue(prev => [...prev, { type: 'mystic', payload: { mysticAbilityId: trait.mysticAbilityId!, mysticAbilityName: trait.name } }]);
                            }}
                            className="col-span-1 border-r border-stone-400"
                        />
                        <TraitsColumn
                            title="Désavantages"
                            traits={resolvedData.page2.desavantages}
                            type="desavantages"
                            total={desavantagesTotal}
                            totalColor="text-red-700 bg-red-50 border-red-200"
                            onOpenLibrary={() => setMultiSelectTarget('desavantages')}
                            onTraitClick={(i, trait) => commonTraitsProps.onTraitClick(i, trait, 'desavantages')}
                            onRemove={(i) => commonTraitsProps.onRemove('desavantages', i)}
                            className="col-span-1 border-l border-stone-400 -ml-[1px]"
                        />
                        <div className="col-span-2 px-1.5 pb-1.5 flex flex-col h-full overflow-hidden border-l border-stone-400">
                            <Page2SectionHeader title="Notes du Personnage" />
                            <div className="flex-grow min-h-0">
                                <NotebookInput value={data.page2.notes} onChange={(v) => updateStringField('notes', v)} />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="sheet-container flex flex-col">
                    <div className="flex border-b border-stone-400 h-[400px] shrink-0 overflow-hidden">
                        <div className="w-[35%] border-r border-stone-400 bg-stone-50 p-0 flex flex-col overflow-hidden">
                            <CharacterImageWidget imageId={data.page2.characterImageId} legacyImage={data.page2.characterImage} onImageUpdate={updateCharacterImageId} onAddLog={handleImageLog} />
                        </div>
                        <div className="w-[65%] flex flex-col overflow-hidden">
                            <div className="h-1/2 flex border-b border-stone-400">
                                <IdentityBoxes data={data} updateStringField={updateStringField} />
                            </div>
                            <div className="h-1/2 flex">
                                <NotesBoxes data={data} updateStringField={updateStringField} updateReputationEntry={updateReputationEntry} handleReputationKeyDown={handleReputationKeyDown} />
                            </div>
                        </div>
                    </div>
                    <div className="flex h-[720px] overflow-hidden shrink-0 border-b border-stone-400">
                        <div className="w-[67.5%] border-r border-stone-400 flex flex-col">
                            <Page2SectionHeader title="Traits - Signes Particuliers" />
                            <div className="grid grid-cols-2 flex-grow overflow-hidden min-h-0">
                                <TraitsColumn
                                    title="Avantages"
                                    traits={resolvedData.page2.avantages}
                                    type="avantages"
                                    total={avantagesTotal}
                                    totalColor="text-green-700 bg-green-50 border-green-200"
                                    onOpenLibrary={() => setMultiSelectTarget('avantages')}
                                    onTraitClick={(i, trait) => commonTraitsProps.onTraitClick(i, trait, 'avantages')}
                                    onRemove={(i) => commonTraitsProps.onRemove('avantages', i)}
                                    onManageMystic={(i, trait) => {
                                        if (trait.mysticAbilityId) setWizardQueue(prev => [...prev, { type: 'mystic', payload: { mysticAbilityId: trait.mysticAbilityId!, mysticAbilityName: trait.name } }]);
                                    }}
                                    className="border-r border-stone-400 bg-white"
                                />
                                <TraitsColumn
                                    title="Désavantages"
                                    traits={resolvedData.page2.desavantages}
                                    type="desavantages"
                                    total={desavantagesTotal}
                                    totalColor="text-red-700 bg-red-50 border-red-200"
                                    onOpenLibrary={() => setMultiSelectTarget('desavantages')}
                                    onTraitClick={(i, trait) => commonTraitsProps.onTraitClick(i, trait, 'desavantages')}
                                    onRemove={(i) => commonTraitsProps.onRemove('desavantages', i)}
                                    className="border-l border-stone-400 -ml-[1px] bg-white"
                                />
                            </div>
                        </div>
                        <div className="w-[32.5%] flex flex-col h-full overflow-hidden">
                            <Page2SectionHeader title="Notes du Personnage" />
                            <div className="p-1.5 flex-grow min-h-0">
                                <NotebookInput className="h-full" value={data.page2.notes} onChange={(v) => updateStringField('notes', v)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Modals */}
            {editingTrait && (
                <TraitEditModal
                    isOpen={!!editingTrait}
                    onClose={() => setEditingTrait(null)}
                    trait={editingTrait.trait}
                    onSave={handleSaveTrait}
                    type={editingTrait.type}
                />
            )}

            {multiSelectTarget && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden">
                        <div className={`p-4 border-b flex justify-between items-center text-white ${multiSelectTarget === 'avantages' ? 'bg-green-700' : 'bg-red-700'}`}>
                            <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen size={20} />Ajouter des {multiSelectTarget === 'avantages' ? 'Avantages' : 'Désavantages'}</h3>
                            <button onClick={() => setMultiSelectTarget(null)} className="hover:bg-white/20 p-1 rounded transition-colors"><X size={24} /></button>
                        </div>
                        <div className="flex-grow overflow-hidden relative">
                            <TraitLibrary data={data} onUpdate={onChange} isEditable={false} defaultFilter={multiSelectTarget === 'avantages' ? 'avantage' : 'desavantage'} onMultiSelect={handleMultiAddWrapper} hidePossessed={true} lockFilter={true} />
                        </div>
                    </div>
                </div>
            )}

            {activeWizard?.type === 'mystic' && rules && (
                <MysticSkillWizard
                    isOpen={true}
                    onClose={() => setWizardQueue(prev => prev.slice(1))}
                    onConfirm={handleWizardConfirm}
                    mysticAbilityId={activeWizard.payload.mysticAbilityId}
                    mysticAbilityName={activeWizard.payload.mysticAbilityName}
                    sheet={data}
                    rules={rules}
                />
            )}

            {activeWizard?.type === 'master' && rules && (
                <MasterSkillWizard
                    isOpen={true}
                    traitName={activeWizard.payload.traitName}
                    onClose={() => setWizardQueue(prev => prev.slice(1))}
                    onConfirm={handleMasterSkillConfirm}
                    sheet={data}
                    rules={rules}
                />
            )}
        </>
    );
};

export default CharacterSheetPage2;
