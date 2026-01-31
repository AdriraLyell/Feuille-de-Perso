
import React, { useState, useEffect } from 'react';
import { CharacterSheetData, ReputationEntry, TraitEntry, LibraryEntry } from '../types';
import { BookOpen, X, Edit, Trash2, Check, CheckSquare } from 'lucide-react';
import TraitLibrary from './TraitLibrary';
import { useCharacter } from '../context/CharacterContext';

// Imports Refactorisés
import { useNotification } from '../context/NotificationContext';
import NotebookInput from './shared/NotebookInput';
import CharacterImageWidget from './shared/CharacterImageWidget';
import TraitRow from './sheet/page2/TraitRow';
import { Page2SectionHeader } from './sheet/page2/Page2Components';

interface Props {
    isLandscape?: boolean;
}

const CharacterSheetPage2: React.FC<Props> = ({ isLandscape = false }) => {
    const { data, updateData: onChange, addLog: onAddLog } = useCharacter();
    const [editingSlot, setEditingSlot] = useState<{ type: 'avantages' | 'desavantages', index: number } | null>(null);
    const [multiSelectTarget, setMultiSelectTarget] = useState<'avantages' | 'desavantages' | null>(null);
    const [focusNewReputation, setFocusNewReputation] = useState<number | null>(null);
    const [editorName, setEditorName] = useState('');
    const [editorValue, setEditorValue] = useState('');

    useEffect(() => {
        if (editingSlot) {
            const item = data.page2[editingSlot.type][editingSlot.index];
            setEditorName(item.name);
            setEditorValue(item.value);
        }
    }, [editingSlot, data.page2]);

    useEffect(() => {
        if (focusNewReputation !== null) {
            const element = document.getElementById(`rep-row-${focusNewReputation}-rep`);
            if (element) { element.focus(); setFocusNewReputation(null); }
        }
    }, [focusNewReputation, data.page2.reputation]);

    const updateStringField = (field: keyof CharacterSheetData['page2'], value: string) => {
        onChange({ ...data, page2: { ...data.page2, [field]: value } });
        onAddLog(`Modification ${String(field)}`, 'info', 'sheet', `${String(field)}`);
    };

    const updateCharacterImageId = (id: string) => {
        onChange({ ...data, page2: { ...data.page2, characterImageId: id, characterImage: '' } });
    };

    const saveTraitFromEditor = () => {
        if (!editingSlot) return;
        const newList = [...data.page2[editingSlot.type]];
        newList[editingSlot.index] = { name: editorName, value: editorValue };
        onChange({ ...data, page2: { ...data.page2, [editingSlot.type]: newList } });
        onAddLog(`Modification ${editingSlot.type === 'avantages' ? 'Avantage' : 'Désavantage'}`, 'info', 'sheet');
        setEditingSlot(null);
    };

    const handleMultiAdd = (entries: LibraryEntry[]) => {
        if (!multiSelectTarget) return;
        const currentList = [...data.page2[multiSelectTarget]];
        let addedCount = 0;
        let listIndex = 0;
        entries.forEach(entry => {
            while (listIndex < currentList.length && currentList[listIndex].name.trim() !== '') { listIndex++; }
            if (listIndex < currentList.length) {
                currentList[listIndex] = { name: entry.name, value: entry.cost };
                addedCount++;
            }
        });
        if (addedCount > 0) {
            onChange({ ...data, page2: { ...data.page2, [multiSelectTarget]: currentList } });
            onAddLog(`Ajout de ${addedCount} traits.`, 'success', 'sheet');
        }
        setMultiSelectTarget(null);
    };

    const updateReputationEntry = (index: number, key: keyof ReputationEntry, value: string) => {
        const newList = [...data.page2.reputation];
        newList[index] = { ...newList[index], [key]: value };
        onChange({ ...data, page2: { ...data.page2, reputation: newList } });
        onAddLog(`Modification Réputation`, 'info', 'sheet', `reputation_${index}_${String(key)}`);
    };

    const handleReputationKeyDown = (e: React.KeyboardEvent, index: number, field: 'reputation' | 'lieu' | 'valeur') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (field === 'reputation') document.getElementById(`rep-row-${index}-lieu`)?.focus();
            else if (field === 'lieu') document.getElementById(`rep-row-${index}-val`)?.focus();
            else if (field === 'valeur' && index < data.page2.reputation.length - 1) document.getElementById(`rep-row-${index + 1}-rep`)?.focus();
        }
    };

    const calculateTotal = (list: TraitEntry[]) => list.reduce((acc, item) => acc + (parseInt(item.value) || 0), 0);

    const AvantagesColumn = (
        <div className="col-span-1 border-r border-stone-400 p-1.5 flex flex-col h-full overflow-hidden">
            <Page2SectionHeader title="Avantages" total={calculateTotal(data.page2.avantages)} totalColor="text-green-700 bg-green-50 border-green-200" onOpenLibrary={() => setMultiSelectTarget('avantages')} />
            <div className="space-y-0.5 flex-grow overflow-auto min-h-0 custom-scrollbar">{data.page2.avantages.map((item, i) => (<TraitRow key={i} item={item} onClick={() => setEditingSlot({ type: 'avantages', index: i })} />))}</div>
        </div>
    );

    const DesavantagesColumn = (
        <div className="col-span-1 p-1.5 flex flex-col h-full overflow-hidden">
            <Page2SectionHeader title="Désavantages" total={calculateTotal(data.page2.desavantages)} totalColor="text-red-700 bg-red-50 border-red-200" onOpenLibrary={() => setMultiSelectTarget('desavantages')} />
            <div className="space-y-0.5 flex-grow overflow-auto min-h-0 custom-scrollbar">{data.page2.desavantages.map((item, i) => (<TraitRow key={i} item={item} onClick={() => setEditingSlot({ type: 'desavantages', index: i })} />))}</div>
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
                    <div className="flex-grow border-t border-stone-400 p-1.5 flex flex-col shrink-0 min-h-0"><Page2SectionHeader title="Notes" /><div className="flex-grow min-h-0 mt-1"><NotebookInput value={data.page2.notes} onChange={(v) => updateStringField('notes', v)} /></div></div>
                </div>
            )}

            {editingSlot && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl h-[85vh] flex flex-col overflow-hidden">
                        <div className={`p-4 border-b flex justify-between items-center text-white shrink-0 ${editingSlot.type === 'avantages' ? 'bg-green-700' : 'bg-red-700'}`}>
                            <h3 className="font-bold text-lg flex items-center gap-2"><Edit size={20} />Éditer {editingSlot.type === 'avantages' ? 'Avantage' : 'Désavantage'}</h3>
                            <button onClick={() => setEditingSlot(null)} className="hover:bg-white/20 p-1 rounded"><X size={24} /></button>
                        </div>
                        <div className="flex-grow flex flex-col overflow-hidden min-h-0">
                            <div className="p-5 bg-gray-50 border-b border-gray-200 shrink-0">
                                <div className="flex gap-4 items-end mb-4">
                                    <div className="flex-grow"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom du Trait</label><input className="w-full border border-gray-300 rounded px-3 py-2 font-bold text-gray-900 focus:border-blue-500 outline-none" value={editorName} onChange={(e) => setEditorName(e.target.value)} autoFocus /></div>
                                    <div className="w-20"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valeur</label><input className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-center focus:border-blue-500 outline-none" value={editorValue} onChange={(e) => setEditorValue(e.target.value)} /></div>
                                </div>
                                <div className="flex justify-end"><button onClick={() => { setEditorName(''); setEditorValue(''); }} className="text-gray-500 text-xs hover:text-red-600 px-3 py-1.5 flex items-center gap-1 hover:bg-red-50 rounded"><Trash2 size={14} /> Vider</button></div>
                            </div>
                            <div className="flex-grow flex flex-col min-h-0 border-t border-gray-200">
                                <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center justify-between text-blue-800 text-sm font-bold shrink-0">
                                    <div className="flex items-center gap-2"><BookOpen size={16} />Bibliothèque</div>
                                    <button onClick={() => { const target = editingSlot.type; setEditingSlot(null); setMultiSelectTarget(target); }} className="text-xs bg-white border border-blue-200 hover:bg-blue-100 px-2 py-1 rounded text-blue-700 flex items-center gap-1 shadow-sm"><CheckSquare size={12} /> Sélection multiple</button>
                                </div>
                                <div className="flex-grow overflow-hidden relative"><TraitLibrary data={data} onUpdate={onChange} onSelect={(e) => { setEditorName(e.name); setEditorValue(e.cost); }} isEditable={false} defaultFilter={editingSlot.type === 'avantages' ? 'avantage' : 'desavantage'} /></div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-between items-center shrink-0">
                            <button onClick={() => setEditingSlot(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Annuler</button>
                            <button onClick={saveTraitFromEditor} className={`px-6 py-2 text-white rounded-lg font-bold shadow-md flex items-center gap-2 transition-transform hover:scale-105 ${editingSlot.type === 'avantages' ? 'bg-green-700' : 'bg-red-700'}`}><Check size={18} />Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}

            {multiSelectTarget && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden">
                        <div className={`p-4 border-b flex justify-between items-center text-white ${multiSelectTarget === 'avantages' ? 'bg-green-700' : 'bg-red-700'}`}>
                            <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen size={20} />Ajouter des {multiSelectTarget === 'avantages' ? 'Avantages' : 'Désavantages'}</h3>
                            <button onClick={() => setMultiSelectTarget(null)} className="hover:bg-white/20 p-1 rounded transition-colors"><X size={24} /></button>
                        </div>
                        <div className="flex-grow overflow-hidden relative"><TraitLibrary data={data} onUpdate={onChange} isEditable={false} defaultFilter={multiSelectTarget === 'avantages' ? 'avantage' : 'desavantage'} onMultiSelect={handleMultiAdd} /></div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CharacterSheetPage2;
