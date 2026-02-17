
import React from 'react';
import { CharacterSheetData, TraitEntry } from '../types';
import { BookOpen, X, Edit, Trash2, Check, CheckSquare } from 'lucide-react';
import TraitLibrary from './TraitLibrary';
import { useCharacter } from '../context/CharacterContext';

import { useRules } from '../context/RulesContext';

// Imports Refactorisés
import NotebookInput from './shared/NotebookInput';
import CharacterImageWidget from './shared/CharacterImageWidget';
import TraitRow from './sheet/page2/TraitRow';
import { Page2SectionHeader } from './sheet/page2/Page2Components';
import { useTraitEditor } from '../hooks/sheet/useTraitEditor';
import { useReputationManager } from '../hooks/sheet/useReputationManager';

interface Props {
    isLandscape?: boolean;
}

const CharacterSheetPage2: React.FC<Props> = ({ isLandscape = false }) => {
    const { data, updateData: onChange, addLog: onAddLog } = useCharacter();
    const { rules } = useRules();

    const {
        multiSelectTarget, setMultiSelectTarget,
        removeTrait,
        handleMultiAdd
    } = useTraitEditor(data, rules, onChange, onAddLog);

    const {
        updateReputationEntry,
        handleReputationKeyDown
    } = useReputationManager(data, onChange, onAddLog);

    const updateStringField = (field: keyof CharacterSheetData['page2'], value: string) => {
        onChange({ ...data, page2: { ...data.page2, [field]: value } });
        onAddLog(`Modification ${String(field)}`, 'info', 'sheet', `${String(field)}`);
    };

    const updateCharacterImageId = (id: string) => {
        onChange({ ...data, page2: { ...data.page2, characterImageId: id, characterImage: '' } });
    };

    const calculateTotal = (list: TraitEntry[]) => list.reduce((acc, item) => acc + (parseInt(item.value) || 0), 0);

    const AvantagesColumn = (
        <div className="col-span-1 border-r border-stone-400 p-1.5 flex flex-col h-full overflow-hidden">
            <Page2SectionHeader title="Avantages" total={calculateTotal(data.page2.avantages)} onOpenLibrary={() => setMultiSelectTarget('avantages')} totalColor="text-green-700 bg-green-50 border-green-200" />
            <div className="space-y-0.5 flex-grow overflow-auto min-h-0 custom-scrollbar">
                {data.page2.avantages.map((item, i) => (
                    <TraitRow
                        key={i}
                        item={item}
                        onClick={() => setMultiSelectTarget('avantages')}
                        onRemove={(e) => {
                            e.stopPropagation();
                            removeTrait('avantages', i);
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
                        onClick={() => setMultiSelectTarget('desavantages')}
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
                        <div className="border-r border-stone-400 p-0 flex flex-col h-full overflow-hidden bg-stone-50"><CharacterImageWidget imageId={data.page2.characterImageId} legacyImage={data.page2.characterImage} onImageUpdate={updateCharacterImageId} onAddLog={(msg, type) => onAddLog(msg, type, 'sheet')} /></div>
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
                        <div className="w-[35%] border-r border-stone-400 bg-stone-50 p-0 flex flex-col overflow-hidden"><CharacterImageWidget imageId={data.page2.characterImageId} legacyImage={data.page2.characterImage} onImageUpdate={updateCharacterImageId} onAddLog={(msg, type) => onAddLog(msg, type, 'sheet')} /></div>
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
                        <div className="flex-grow overflow-hidden relative"><TraitLibrary data={data} onUpdate={onChange} isEditable={false} defaultFilter={multiSelectTarget === 'avantages' ? 'avantage' : 'desavantage'} onMultiSelect={handleMultiAdd} hidePossessed={true} lockFilter={true} /></div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CharacterSheetPage2;
