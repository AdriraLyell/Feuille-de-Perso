
import React, { useState, useMemo } from 'react';
import { CharacterSheetData, LibraryEntry, TraitEntry } from '../../types';
import { Check, X, ArrowRight, RefreshCw, PlusCircle, AlertCircle } from 'lucide-react';

interface TraitImportModalProps {
    data: CharacterSheetData;
    onClose: () => void;
    onImport: (entries: LibraryEntry[]) => void;
}

const TraitImportModal: React.FC<TraitImportModalProps> = ({ data, onClose, onImport }) => {
    // Combine Avantages and Desavantages from sheet
    const sheetTraits = useMemo(() => {
        const traits: { entry: TraitEntry, type: 'avantage' | 'desavantage', id: string, status: 'new' | 'update' | 'same' }[] = [];

        const processList = (list: TraitEntry[], type: 'avantage' | 'desavantage') => {
            list.forEach((t, i) => {
                if (!t.name.trim()) return;

                // Check if exists in library (by name AND type)
                const existingLibEntry = (data.library || []).find(l =>
                    l.name.toLowerCase() === t.name.trim().toLowerCase() &&
                    l.type === type
                );

                let status: 'new' | 'update' | 'same' = 'new';
                if (existingLibEntry) {
                    // Check if content is different (Value, Description, Tag)
                    const isDifferent =
                        existingLibEntry.cost !== t.value ||
                        (existingLibEntry.description || '') !== (t.description || '') ||
                        (existingLibEntry.tags?.[0] || '') !== (t.tag || '');

                    status = isDifferent ? 'update' : 'same';
                }

                traits.push({
                    entry: t,
                    type,
                    id: `${type}-${i}`, // Temporary ID for selection
                    status
                });
            });
        };

        processList(data.page2.avantages, 'avantage');
        processList(data.page2.desavantages, 'desavantage');

        return traits;
    }, [data.page2, data.library]);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (selectedIds.length === sheetTraits.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(sheetTraits.map(t => t.id));
        }
    };

    const handleImport = () => {
        const selectedTraits = sheetTraits.filter(t => selectedIds.includes(t.id));

        const libraryEntries: LibraryEntry[] = selectedTraits.map(t => {
            // Find existing to reuse ID if updating
            const existing = (data.library || []).find(l => l.name.toLowerCase() === t.entry.name.toLowerCase() && l.type === t.type);

            return {
                id: existing ? existing.id : Math.random().toString(36).substr(2, 9),
                type: t.type,
                name: t.entry.name,
                cost: t.entry.value,
                pointsLabel: `${t.entry.value} points`,
                description: t.entry.description || '',
                tags: t.entry.tag ? [t.entry.tag] : [],
                effects: existing ? existing.effects : [] // Preserve effects on update? Or clear? Strategy: Preserve.
            };
        });

        onImport(libraryEntries);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
                <div className="p-4 bg-blue-700 text-white flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2"><ArrowRight size={20} /> Importer depuis la Fiche</h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors"><X size={24} /></button>
                </div>

                <div className="p-4 bg-blue-50 border-b border-blue-100 text-blue-800 text-sm flex items-start gap-3">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p>
                        Sélectionnez les traits présents sur votre fiche de personnage que vous souhaitez ajouter ou mettre à jour dans la bibliothèque.
                        Les traits marqués "<span className="font-bold">Mise à jour</span>" existent déjà mais ont des valeurs différentes sur votre fiche.
                    </p>
                </div>

                <div className="flex-grow overflow-y-auto p-2 bg-gray-50">
                    {sheetTraits.length === 0 ? (
                        <div className="text-center text-gray-400 py-10 italic">Aucun trait trouvé sur la fiche.</div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                                <input type="checkbox" checked={selectedIds.length === sheetTraits.length && sheetTraits.length > 0} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="text-sm font-bold text-gray-700">Tout sélectionner ({sheetTraits.length})</span>
                            </div>

                            {sheetTraits.map(item => (
                                <div key={item.id} onClick={() => toggleSelection(item.id)} className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => { }} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none" />

                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${item.type === 'avantage' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {item.type === 'avantage' ? 'AV' : 'DÉS'}
                                            </span>
                                            <span className="font-bold text-gray-900 truncate">{item.entry.name}</span>
                                            <span className="font-mono text-xs bg-gray-100 px-1.5 rounded border border-gray-200">{item.entry.value} pts</span>
                                        </div>
                                        {item.entry.description && <p className="text-xs text-gray-600 truncate">{item.entry.description}</p>}
                                        {item.entry.tag && <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded border border-slate-200">{item.entry.tag}</span>}
                                    </div>

                                    <div className="shrink-0">
                                        {item.status === 'new' && <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"><PlusCircle size={12} /> Nouveau</span>}
                                        {item.status === 'update' && <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><RefreshCw size={12} /> Mise à jour</span>}
                                        {item.status === 'same' && <span className="text-xs text-gray-400 px-2">Identique</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">Annuler</button>
                    <button
                        onClick={handleImport}
                        disabled={selectedIds.length === 0}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                    >
                        <Check size={18} /> Importer ({selectedIds.length})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TraitImportModal;
