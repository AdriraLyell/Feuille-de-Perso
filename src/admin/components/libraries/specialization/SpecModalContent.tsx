import React from 'react';
import { Search, X } from 'lucide-react';
import { LibrarySpecializationEntry } from '../../../../types';

interface SpecModalContentProps {
    editingEntry: LibrarySpecializationEntry;
    setEditingEntry: (entry: LibrarySpecializationEntry) => void;
    skillSearch: string;
    setSkillSearch: (val: string) => void;
    filteredSkillsForModal: { id: string, name: string }[];
    error: string | null;
}

export const SpecModalContent: React.FC<SpecModalContentProps> = ({
    editingEntry,
    setEditingEntry,
    skillSearch,
    setSkillSearch,
    filteredSkillsForModal,
    error
}) => {
    return (
        <div className="flex flex-col gap-4 py-2">
            <div>
                <label htmlFor="spec-name" className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Nom</label>
                <input
                    id="spec-name"
                    className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 font-black font-serif text-[#1c1917] bg-white/50 focus:border-amber-500 outline-none shadow-sm"
                    value={editingEntry.name}
                    onChange={(e) => setEditingEntry({ ...editingEntry, name: e.target.value })}
                />
            </div>

            <div>
                <label htmlFor="spec-skills" className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Compétences associées</label>
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
                                checked={editingEntry.skillIds.includes(skill.id)}
                                onChange={(e) => {
                                    const ids = e.target.checked
                                        ? [...editingEntry.skillIds, skill.id]
                                        : editingEntry.skillIds.filter(id => id !== skill.id);
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
                <label htmlFor="spec-min-level" className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Seuil minimum par défaut</label>
                <input
                    id="spec-min-level"
                    type="number"
                    min="0"
                    max="5"
                    className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 text-sm bg-white/50 focus:border-amber-500 outline-none shadow-sm"
                    value={editingEntry.defaultMinLevel}
                    onChange={(e) => setEditingEntry({ ...editingEntry, defaultMinLevel: parseInt(e.target.value) || 0 })}
                />
                <p className="text-[10px] text-[#5c4d41]/60 mt-1 italic">Niveau de compétence requis pour débloquer cette spécialisation.</p>
            </div>

            <div className="flex items-start gap-3 bg-amber-50/50 p-3 rounded border border-amber-200/50">
                <input
                    id="spec-imposed"
                    type="checkbox"
                    className="mt-1 rounded border-[#bfae85]/50 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    checked={editingEntry.isImposed || false}
                    onChange={(e) => setEditingEntry({ ...editingEntry, isImposed: e.target.checked })}
                />
                <div className="flex flex-col">
                    <label htmlFor="spec-imposed" className="text-xs font-bold text-amber-900 cursor-pointer">Spécialisation Imposée ?</label>
                    <p className="text-[10px] text-amber-800/70 italic leading-tight mt-0.5">
                        Si coché, cette spécialisation s'ajoutera automatiquement sur la fiche de tous les personnages si le seuil est atteint.
                    </p>
                </div>
            </div>

            <div>
                <label htmlFor="spec-description" className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Description</label>
                <textarea
                    id="spec-description"
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
    );
};
