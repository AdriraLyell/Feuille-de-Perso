import React, { useMemo } from 'react';
import { Award, X, Search, Save } from 'lucide-react';
import { LibrarySpecializationEntry } from '../../../types';
import { smartIncludes } from '../../../utils/stringUtils';

interface SpecializationEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingEntry: LibrarySpecializationEntry;
    setEditingEntry: (entry: LibrarySpecializationEntry) => void;
    handleSave: () => void;
    allSkills: { id: string, name: string }[];
    skillSearch: string;
    setSkillSearch: (s: string) => void;
    error: string | null;
    isExisting: boolean;
}

const SpecializationEditModal: React.FC<SpecializationEditModalProps> = ({
    isOpen,
    onClose,
    editingEntry,
    setEditingEntry,
    handleSave,
    allSkills,
    skillSearch,
    setSkillSearch,
    error,
    isExisting
}) => {
    const filteredSkillsForModal = useMemo(() => {
        return allSkills.filter(s =>
            smartIncludes(s.name, skillSearch) || (editingEntry?.skillIds.includes(s.id))
        );
    }, [allSkills, skillSearch, editingEntry?.skillIds]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in duration-200 border-2 border-[#bfae85]/50">
                <div className="p-4 border-b border-[#bfae85]/50 flex justify-between items-center text-white bg-amber-700/90">
                    <h3 className="font-bold text-lg flex items-center gap-2 font-serif tracking-wide">
                        <Award size={20} />
                        {isExisting ? 'Éditer Spécialisation' : 'Nouvelle Spécialisation (Copie)'}
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 bg-[#fdfbf7] flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                    <div>
                        <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Nom</label>
                        <input
                            className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 font-black font-serif text-[#1c1917] bg-white/50 focus:border-amber-500 outline-none shadow-sm"
                            value={editingEntry.name}
                            onChange={(e) => setEditingEntry({ ...editingEntry, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Compétences associées</label>
                        <div className="relative mb-2">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#5c4d41]/60" />
                            <input
                                className="w-full pl-7 pr-2 py-1 text-[11px] border border-[#bfae85]/50 rounded-sm focus:border-amber-500 outline-none bg-white/50"
                                placeholder="Filtrer les compétences..."
                                value={skillSearch}
                                onChange={(e) => setSkillSearch(e.target.value)}
                            />
                            {skillSearch && (
                                <button
                                    onClick={() => setSkillSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5c4d41]/60 hover:text-gray-600"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-[#bfae85]/50 rounded-sm p-2 bg-white/30 custom-scrollbar">
                            {filteredSkillsForModal.length === 0 ? (
                                <div className="col-span-2 text-center py-2 text-[10px] text-[#5c4d41]/60 italic">Aucun résultat.</div>
                            ) : filteredSkillsForModal.map(skill => (
                                <label key={skill.id} className={`flex items-center gap-2 text-xs cursor-pointer hover:bg-stone-100/50 p-1 rounded transition-colors ${editingEntry.skillIds.includes(skill.id) ? 'bg-amber-100/30' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={editingEntry.skillIds.includes(skill.id) || editingEntry.skillIds.includes(skill.name)}
                                        onChange={(e) => {
                                            const ids = e.target.checked
                                                ? [...editingEntry.skillIds, skill.id]
                                                : editingEntry.skillIds.filter(id => id !== skill.id && id !== skill.name);
                                            setEditingEntry({ ...editingEntry, skillIds: ids });
                                        }}
                                        className="rounded border-[#bfae85]/50 text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className={`truncate ${editingEntry.skillIds.includes(skill.id) ? 'font-bold text-amber-900' : 'text-[#4a3b32]'}`}>{skill.name}</span>
                                </label>
                            ))}
                        </div>
                        {editingEntry.skillIds.length > 0 && (
                            <div className="mt-1 text-[9px] text-[#5c4d41]/60 italic">
                                {editingEntry.skillIds.length} compétence(s) sélectionnée(s)
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Seuil minimum par défaut (MJ)</label>
                        <div className="flex gap-4 items-center">
                            <input
                                type="number"
                                min="0"
                                max="5"
                                className="w-20 border border-[#bfae85]/50 rounded-sm px-3 py-2 text-sm bg-white/50 focus:border-amber-500 outline-none shadow-sm"
                                value={editingEntry.defaultMinLevel}
                                onChange={(e) => setEditingEntry({ ...editingEntry, defaultMinLevel: parseInt(e.target.value) || 0 })}
                            />

                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={editingEntry.isImposed}
                                        onChange={(e) => setEditingEntry({ ...editingEntry, isImposed: e.target.checked })}
                                        className="rounded border-[#bfae85]/50 text-amber-600 focus:ring-amber-500 w-4 h-4"
                                    />
                                </div>
                                <span className="text-xs font-bold text-[#4a3b32] group-hover:text-amber-700 transition-colors flex items-center gap-1">
                                    Spécialisation Imposée ?
                                </span>
                            </label>
                        </div>
                        <p className="text-[10px] text-[#5c4d41]/60 mt-1 italic">Si coché, elle sera ajoutée automatiquement dès que le seuil est atteint.</p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Description</label>
                        <textarea
                            className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 text-sm bg-white/50 min-h-[80px] focus:border-amber-500 outline-none resize-none shadow-sm italic text-[#4a3b32]"
                            value={editingEntry.description || ''}
                            onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-xs p-2 rounded border border-red-200 font-bold">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-[#bfae85]/30 bg-stone-100/30 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold">Annuler</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-[#5c4d41] text-white rounded-sm font-bold shadow-md hover:bg-[#4a3b32] flex items-center gap-2">
                        <Save size={16} /> Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpecializationEditModal;
