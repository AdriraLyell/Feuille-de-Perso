import React, { useState, useMemo } from 'react';
import { Search, Plus, Award, Edit2, Trash2, HelpCircle, Save, X, AlertTriangle, Layers, UploadCloud } from 'lucide-react';
import { RulesData } from '../../../types/rules';
import { LibrarySpecializationEntry } from '../../../types';
import { smartIncludes } from '../../../utils/stringUtils';
import ThematicModal from '../../../components/ui/ThematicModal';
import { useNotification } from '../../../context/NotificationContext';
import { publishFileToGitHub } from '../../../services/githubService';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

interface AdminSpecializationLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminSpecializationLibrary: React.FC<AdminSpecializationLibraryProps> = ({ rules, onUpdate }) => {
    const addLog = useNotification();

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<LibrarySpecializationEntry | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [skillSearch, setSkillSearch] = useState('');
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const library = rules.libraries.specializations || [];

    // Flatten all skills for mapping (Admin sees all skills in rules)
    // But wait, rules.libraries.skills contains the official skills.
    // We should also consider the structure of rules.skills (categories).
    // Actually, in Admin, we mostly care about `rules.libraries.skills` (the official reserve) 
    // AND the base skills defined in `rules.skills`.

    const allSkills = useMemo(() => {
        const skills: { id: string, name: string }[] = [];

        // 1. From Categories (Base Skills Definitions)
        if (rules.definitions && rules.definitions.skills) {
            Object.values(rules.definitions.skills).forEach(categorySkills => {
                categorySkills.forEach(skillName => {
                    if (skillName && skillName.trim() !== '') {
                        // For base skills in rules, we don't have IDs. 
                        // We use the Name as the ID. The Player side must handle this loose coupling.
                        skills.push({ id: skillName, name: skillName });
                    }
                });
            });
        }

        // 2. From Official Library (Reserve)
        if (rules.libraries && rules.libraries.skills) {
            rules.libraries.skills.forEach(skill => {
                if (!skills.some(s => s.id === skill.id)) {
                    skills.push({ id: skill.id, name: skill.name });
                }
            });
        }

        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }, [rules.definitions, rules.libraries.skills]);

    // Filtered skills for modal selection
    const filteredSkillsForModal = useMemo(() => {
        return allSkills.filter(s =>
            smartIncludes(s.name, skillSearch) || (editingEntry?.skillIds.includes(s.id))
        );
    }, [allSkills, skillSearch, editingEntry?.skillIds]);

    // Compute derived list
    const filteredLibrary = useMemo(() => {
        return (rules.libraries.specializations || []).filter(s =>
            smartIncludes(s.name, searchTerm) ||
            (s.description && smartIncludes(s.description, searchTerm))
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [rules.libraries.specializations, searchTerm]);


    // Handlers
    const handleOpenNew = () => {
        setError(null);
        setEditingEntry({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            skillIds: [],
            defaultMinLevel: 1,
            description: ''
        });
        setSkillSearch('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (entry: LibrarySpecializationEntry) => {
        setError(null);
        setSkillSearch('');
        setEditingEntry({ ...entry });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string, name: string) => {
        setShowDeleteConfirm(id);
    };

    const confirmDelete = () => {
        if (!showDeleteConfirm) return;
        const currentList = rules.libraries.specializations || [];
        const deletedEntry = currentList.find(s => s.id === showDeleteConfirm);
        onUpdate({
            ...rules,
            libraries: {
                ...rules.libraries,
                specializations: currentList.filter(s => s.id !== showDeleteConfirm)
            }
        });
        addLog(`Spécialisation officielle "${deletedEntry?.name}" supprimée.`, 'info', 'settings');
        setShowDeleteConfirm(null);
    };

    const handleSave = () => {
        if (!editingEntry) return;

        if (!editingEntry.name.trim()) {
            setError("Le nom est requis.");
            return;
        }

        const currentList = rules.libraries.specializations || [];
        const duplicate = currentList.find(s =>
            s.id !== editingEntry.id &&
            s.name.trim().toLowerCase() === editingEntry.name.trim().toLowerCase()
        );

        if (duplicate) {
            setError("Une spécialisation portant ce nom existe déjà.");
            return;
        }

        let newList;
        const exists = currentList.some(s => s.id === editingEntry.id);
        if (exists) {
            newList = currentList.map(s => s.id === editingEntry.id ? editingEntry : s);
        } else {
            newList = [...currentList, editingEntry];
        }

        onUpdate({
            ...rules,
            libraries: {
                ...rules.libraries,
                specializations: newList
            }
        });

        addLog(`Spécialisation officielle "${editingEntry.name}" enregistrée.`, 'success', 'settings');
        setIsModalOpen(false);
        setEditingEntry(null);
    };

    const handlePublishClick = () => {
        const token = localStorage.getItem('GITHUB_TOKEN');
        const owner = localStorage.getItem('GITHUB_OWNER');
        const repo = localStorage.getItem('GITHUB_REPO');

        if (!token || !owner || !repo) {
            addLog("Veuillez d'abord configurer vos identifiants GitHub via le bouton 'Publier' du menu principal.", 'danger', 'settings');
            return;
        }
        setShowPublishConfirm(true);
    };

    const executePublish = async () => {
        const token = localStorage.getItem('GITHUB_TOKEN') || '';
        const owner = localStorage.getItem('GITHUB_OWNER') || '';
        const repo = localStorage.getItem('GITHUB_REPO') || '';

        try {
            const content = JSON.stringify({
                meta: {
                    version: rules.version,
                    date: new Date().toISOString(),
                    type: 'specializations'
                },
                data: rules.libraries.specializations || []
            }, null, 2);

            const result = await publishFileToGitHub(
                'public/data/specializations.json',
                content,
                `update(specs): Mise à jour bibliothèque spécialisations v${rules.version}`,
                { token, owner, repo, branch: 'main' }
            );

            if (result.success) {
                addLog('Bibliothèque de spécialisations publiée avec succès !', 'success', 'settings');
            } else {
                addLog("Erreur lors de la publication : " + result.message, 'danger', 'settings');
            }
        } catch (e) {
            addLog("Erreur inattendue lors de la publication : " + (e as Error).message, 'danger', 'settings');
        } finally {
            setShowPublishConfirm(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#fdfbf7] rounded-sm shadow-sm border border-[#bfae85]/50 overflow-hidden relative min-h-[500px]">
            {/* Toolbar */}
            <div className="p-4 bg-stone-100/30 border-b border-[#bfae85]/30 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div className="relative flex-grow max-w-md w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a3b32]/50" />
                    <input
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-[#bfae85]/50 rounded-sm focus:border-amber-500 outline-none text-[#1c1917] placeholder-[#4a3b32]/40 bg-white/80"
                        placeholder="Rechercher une spécialisation..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handlePublishClick}
                        className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap flex-1 sm:flex-initial justify-center"
                        title="Publier specializations.json"
                    >
                        <UploadCloud size={14} /> Publier JSON
                    </button>
                    <button
                        onClick={handleOpenNew}
                        className="bg-[#5c4d41] hover:bg-[#4a3b32] text-white px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap flex-1 sm:flex-initial justify-center"
                    >
                        <Plus size={14} /> Créer
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                {library.length === 0 ? (
                    <div className="text-center text-[#5c4d41]/60 py-10 italic px-4 text-sm flex flex-col items-center">
                        <Award size={48} className="opacity-20 mb-2" />
                        <p>La bibliothèque de spécialisations officielles est vide.</p>
                        <p className="text-xs mt-2 text-[#5c4d41]/80 italic">Ajoutez des spécialisations standards proposées à tous les joueurs.</p>
                    </div>
                ) : filteredLibrary.length === 0 ? (
                    <div className="text-center text-[#5c4d41]/60 py-10 italic">Aucun résultat.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredLibrary.map(entry => {
                            return (
                                <div
                                    key={entry.id}
                                    className="border rounded-sm p-3 transition-all bg-white/60 group flex flex-col justify-between border-[#bfae85]/30 hover:border-amber-400/50 hover:shadow-sm"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-serif font-black uppercase text-xs tracking-wide text-[#4a3b32]">
                                                {entry.name}
                                            </span>

                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenEdit(entry)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDelete(entry.id, entry.name)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        {entry.description && (
                                            <p className="text-[10px] text-[#5c4d41] italic line-clamp-2 mb-2 leading-tight opacity-80">{entry.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {entry.skillIds.map(sid => {
                                                const s = allSkills.find(sk => sk.id === sid);
                                                return (
                                                    <span key={sid} className="text-[9px] bg-stone-100/50 text-[#5c4d41] px-1.5 py-0.5 rounded-sm border border-[#bfae85]/20">
                                                        {s ? s.name : sid}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="mt-2 text-[10px] text-[#5c4d41]/60 flex justify-between items-center border-t border-[#bfae85]/20 pt-1">
                                        <span>Seuil : <span className="font-bold text-amber-700">{entry.defaultMinLevel}</span></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <ThematicModal
                isOpen={isModalOpen && !!editingEntry}
                onClose={() => setIsModalOpen(false)}
                title={library.some(e => e.id === editingEntry?.id) ? 'Éditer Spécialisation' : 'Nouvelle Spécialisation'}
                icon={<Award size={20} />}
                size="md"
                footer={
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold">Annuler</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-[#5c4d41] text-white rounded-sm font-bold shadow-md hover:bg-[#4a3b32] flex items-center gap-2">
                            <Save size={16} /> Enregistrer
                        </button>
                    </>
                }
            >
                {editingEntry && (
                    <div className="flex flex-col gap-4 py-2">
                        <div>
                            <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Nom</label>
                            <input
                                className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 font-black font-serif text-[#1c1917] bg-white/50 focus:border-amber-500 outline-none shadow-sm"
                                value={editingEntry.name}
                                onChange={(e) => setEditingEntry({ ...editingEntry, name: e.target.value })}
                                autoFocus
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
                            <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Seuil minimum par défaut</label>
                            <input
                                type="number"
                                min="0"
                                max="5"
                                className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 text-sm bg-white/50 focus:border-amber-500 outline-none shadow-sm"
                                value={editingEntry.defaultMinLevel}
                                onChange={(e) => setEditingEntry({ ...editingEntry, defaultMinLevel: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-[10px] text-[#5c4d41]/60 mt-1 italic">Niveau de compétence requis pour débloquer cette spécialisation.</p>
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
                )}
            </ThematicModal>



            <ConfirmationModal
                isOpen={showPublishConfirm}
                onClose={() => setShowPublishConfirm(false)}
                onConfirm={executePublish}
                title="Publier les spécialisations ?"
                message="Vous allez mettre à jour le fichier specializations.json public."
                confirmLabel="Publier"
                type="warning"
            />

            <ConfirmationModal
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Supprimer la spécialisation ?"
                message="Cette action supprimera définitivement l'entrée de la base admin."
                confirmLabel="Supprimer"
                type="danger"
            />
        </div>
    );
};

export default AdminSpecializationLibrary;
