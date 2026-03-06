import React, { useState, useMemo } from 'react';
import { Search, Plus, Award, Save, UploadCloud, CheckCircle2, Circle, X } from 'lucide-react';
import { RulesData } from '../../../types/rules';
import { LibrarySpecializationEntry } from '../../../types';
import { smartIncludes } from '../../../utils/stringUtils';
import ThematicModal from '../../../components/ui/ThematicModal';
import { useNotification } from '../../../context/NotificationContext';
import { publishFileToGitHub } from '../../../services/githubService';
import { useItemUsageDetails } from '../../../hooks/admin/useItemUsageDetails';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

// Sub components
import { SpecListItem } from './specialization/SpecListItem';
import { SpecModalContent } from './specialization/SpecModalContent';

interface AdminSpecializationLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    globalUsage?: Record<string, number>;
}

const AdminSpecializationLibrary: React.FC<AdminSpecializationLibraryProps> = ({ rules, onUpdate, globalUsage = {} }) => {
    const addLog = useNotification();
    const { usageDetailsCache, loadDetails } = useItemUsageDetails('global', 'specialization');

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<LibrarySpecializationEntry | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('');
    const [skillFilterSearch, setSkillFilterSearch] = useState('');
    const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
    const [skillSearch, setSkillSearch] = useState('');
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const library = rules.libraries.specializations || [];

    const allSkills = useMemo(() => {
        const skills: { id: string, name: string }[] = [];

        // 1. From Categories (Base Skills Definitions - Legacy)
        if (rules.definitions && rules.definitions.skills) {
            Object.values(rules.definitions.skills).forEach(categorySkills => {
                categorySkills.forEach(skillName => {
                    if (skillName && skillName.trim() !== '') {
                        skills.push({ id: skillName, name: skillName });
                    }
                });
            });
        }

        // 2. From Official Library (Reserve)
        if (rules.libraries) {
            // Regular Skills
            if (rules.libraries.skills) {
                rules.libraries.skills.forEach(skill => {
                    if (!skills.some(s => s.id === skill.id)) {
                        skills.push({ id: skill.id, name: skill.name });
                    }
                });
            }

            // Mystic Abilities (Often used as parents for styles/specializations)
            if (rules.libraries.mysticAbilities) {
                rules.libraries.mysticAbilities.forEach(ma => {
                    if (!skills.some(s => s.id === ma.id)) {
                        skills.push({ id: ma.id, name: ma.name });
                    }
                });
            }

            // Backgrounds & Counters (Just in case)
            if (rules.libraries.backgrounds) {
                rules.libraries.backgrounds.forEach(bg => {
                    if (!skills.some(s => s.id === bg.id)) {
                        skills.push({ id: bg.id, name: bg.name });
                    }
                });
            }
        }

        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }, [rules.definitions, rules.libraries.skills, rules.libraries.mysticAbilities, rules.libraries.backgrounds]);

    const filteredSkillsForModal = useMemo(() => {
        return allSkills.filter(s =>
            smartIncludes(s.name, skillSearch) || (editingEntry?.skillIds.includes(s.id))
        );
    }, [allSkills, skillSearch, editingEntry?.skillIds]);

    const filteredSkillsForFilter = useMemo(() => {
        if (!skillFilterSearch.trim()) return [];
        return allSkills.filter(s => smartIncludes(s.name, skillFilterSearch));
    }, [allSkills, skillFilterSearch]);

    const filteredLibrary = useMemo(() => {
        return (rules.libraries.specializations || []).filter(s => {
            const matchesSearch = smartIncludes(s.name, searchTerm) ||
                (s.description && smartIncludes(s.description, searchTerm));
            const matchesSkill = !selectedSkillFilter || s.skillIds.includes(selectedSkillFilter);
            return matchesSearch && matchesSkill;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [rules.libraries.specializations, searchTerm, selectedSkillFilter]);


    // Handlers
    const handleOpenNew = () => {
        setError(null);
        setEditingEntry({
            id: crypto.randomUUID(),
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

    const handleDelete = (id: string) => {
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

    const handleToggle = (id: string, currentlyActive: boolean) => {
        const currentList = rules.libraries.specializations || [];
        const newList = currentList.map(s => s.id === id ? { ...s, isActive: !currentlyActive } : s);
        onUpdate({ ...rules, libraries: { ...rules.libraries, specializations: newList } });
    };

    const handleBulkSelect = (active: boolean) => {
        const visibleIds = new Set(filteredLibrary.map(s => s.id));
        const currentList = rules.libraries.specializations || [];
        const newList = currentList.map(item =>
            visibleIds.has(item.id) ? { ...item, isActive: active } : item
        );
        onUpdate({
            ...rules,
            libraries: {
                ...rules.libraries,
                specializations: newList
            }
        });
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
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search size={16} className="text-[#4a3b32]/50" />
                    </span>
                    <input
                        className="w-full pl-9 pr-9 py-1.5 text-sm border border-[#bfae85]/50 rounded-sm focus:border-amber-500 outline-none text-[#1c1917] placeholder-[#4a3b32]/40 bg-white/80"
                        placeholder="Rechercher une spécialisation..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a3b32]/40 hover:text-amber-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="relative w-full sm:w-64 shrink-0">
                    {selectedSkillFilter ? (
                        <div className="flex items-center justify-between gap-2 bg-amber-100/80 border border-amber-300/50 px-3 py-1.5 rounded-sm text-xs shadow-inner animate-in fade-in zoom-in duration-200">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] text-amber-700/70 font-bold uppercase tracking-tighter">Compétence parent</span>
                                <span className="text-amber-900 font-bold truncate leading-tight">
                                    {allSkills.find(s => s.id === selectedSkillFilter)?.name || selectedSkillFilter}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedSkillFilter('')}
                                className="text-amber-700 hover:text-amber-900 bg-amber-200/50 hover:bg-amber-200 p-1 rounded-full transition-colors shrink-0"
                                title="Enlever le filtre"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="relative h-[34px]">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search size={14} className="text-[#4a3b32]/50" />
                            </span>
                            <input
                                className="w-full pl-9 pr-3 py-1.5 text-sm border border-[#bfae85]/50 rounded-sm focus:border-amber-500 outline-none text-[#1c1917] placeholder-[#4a3b32]/40 bg-white/80 h-full"
                                placeholder="Filtrer par compétence..."
                                value={skillFilterSearch}
                                onChange={(e) => {
                                    setSkillFilterSearch(e.target.value);
                                    setShowSkillSuggestions(true);
                                }}
                                onFocus={() => setShowSkillSuggestions(true)}
                                onBlur={() => {
                                    // Delay to allow clicking on suggestion
                                    setTimeout(() => setShowSkillSuggestions(false), 200);
                                }}
                            />
                            {showSkillSuggestions && filteredSkillsForFilter.length > 0 && (
                                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#bfae85]/50 rounded-sm shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-1 duration-200">
                                    <div className="p-1.5 bg-stone-50 border-b border-[#bfae85]/20 text-[9px] font-bold text-[#bfae85] uppercase tracking-wider">
                                        Résultats de recherche
                                    </div>
                                    {filteredSkillsForFilter.map(skill => (
                                        <button
                                            key={skill.id}
                                            type="button"
                                            className="w-full text-left px-4 py-2 text-xs hover:bg-amber-100/50 text-[#1c1917] transition-colors border-b border-[#bfae85]/10 last:border-0 flex items-center justify-between group"
                                            onClick={() => {
                                                setSelectedSkillFilter(skill.id);
                                                setSkillFilterSearch('');
                                                setShowSkillSuggestions(false);
                                            }}
                                        >
                                            <span className="truncate group-hover:font-bold transition-all">{skill.name}</span>
                                            <Plus size={10} className="text-amber-600 opacity-0 group-hover:opacity-100" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Bulk Actions */}
                {library.length > 0 && (
                    <div className="flex gap-4 px-4 py-2 bg-stone-50/50 border-b border-[#bfae85]/20">
                        <button
                            onClick={() => handleBulkSelect(true)}
                            className="text-[10px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
                        >
                            <CheckCircle2 size={12} />
                            Tout activer {searchTerm ? `(${filteredLibrary.length})` : ''}
                        </button>
                        <button
                            onClick={() => handleBulkSelect(false)}
                            className="text-[10px] font-bold text-stone-500 hover:text-stone-700 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
                        >
                            <Circle size={12} />
                            Tout désactiver {searchTerm ? `(${filteredLibrary.length})` : ''}
                        </button>
                    </div>
                )}
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
                        {filteredLibrary.map(entry => (
                            <SpecListItem
                                key={entry.id}
                                entry={entry}
                                isLocked={(globalUsage[entry.id] || 0) > 0}
                                allSkills={allSkills}
                                onEdit={handleOpenEdit}
                                onDelete={handleDelete}
                                onToggle={handleToggle}
                                usageDetails={usageDetailsCache.get(entry.id)}
                                onLoadUsageDetails={loadDetails}
                            />
                        ))}
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
                    <SpecModalContent
                        editingEntry={editingEntry}
                        setEditingEntry={setEditingEntry}
                        skillSearch={skillSearch}
                        setSkillSearch={setSkillSearch}
                        filteredSkillsForModal={filteredSkillsForModal}
                        error={error}
                    />
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
