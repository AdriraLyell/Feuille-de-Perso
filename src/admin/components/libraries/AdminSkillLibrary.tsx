
import React, { useState, useMemo } from 'react';
import { RulesData } from '../../../types/rules';
import { LibrarySkillEntry } from '../../../types';
import { Search, Plus, GraduationCap, Save, AlertOctagon, HelpCircle, X, Layers, Edit2, Trash2, UploadCloud } from 'lucide-react';
import ThematicModal from '../../../components/ui/ThematicModal';
import { CATEGORY_HELP } from '../../../data/constants';
import { smartIncludes } from '../../../utils/stringUtils';
import { publishFileToGitHub } from '../../../services/githubService';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

interface AdminSkillLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminSkillLibrary: React.FC<AdminSkillLibraryProps> = ({ rules, onUpdate }) => {
    const list = rules.libraries?.skills || [];

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState<LibrarySkillEntry | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showCategoryHelp, setShowCategoryHelp] = useState(false);

    const filteredList = useMemo(() => {
        return list
            .filter(s => smartIncludes(s.name, searchTerm) || (s.description && smartIncludes(s.description, searchTerm)))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [list, searchTerm]);

    const [showPublishConfirm, setShowPublishConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const handleOpenNew = () => {
        setError(null);
        setEditingSkill({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            description: '',
            defaultCategory: '',
            isVariable: false
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (skill: LibrarySkillEntry) => {
        setError(null);
        setEditingSkill({ ...skill });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setShowDeleteConfirm(id);
    };

    const confirmDelete = () => {
        if (!showDeleteConfirm) return;
        onUpdate({
            ...rules,
            libraries: { ...rules.libraries, skills: list.filter(s => s.id !== showDeleteConfirm) }
        });
        setShowDeleteConfirm(null);
    };

    const handleSave = () => {
        if (!editingSkill) return;
        if (!editingSkill.name.trim()) { setError("Le nom est requis."); return; }

        const duplicate = list.find(s => s.id !== editingSkill.id && s.name.trim().toLowerCase() === editingSkill.name.trim().toLowerCase());
        if (duplicate) { setError("Une compétence portant ce nom existe déjà."); return; }

        const newList = list.some(s => s.id === editingSkill.id)
            ? list.map(s => s.id === editingSkill.id ? editingSkill : s)
            : [...list, editingSkill];

        // Sort
        newList.sort((a, b) => a.name.localeCompare(b.name));

        onUpdate({
            ...rules,
            libraries: { ...rules.libraries, skills: newList }
        });
        setIsModalOpen(false);
        setEditingSkill(null);
    };

    const handlePublishClick = () => {
        const token = localStorage.getItem('GITHUB_TOKEN');
        const owner = localStorage.getItem('GITHUB_OWNER');
        const repo = localStorage.getItem('GITHUB_REPO');

        if (!token || !owner || !repo) {
            alert("Veuillez d'abord configurer vos identifiants GitHub via le bouton 'Publier' du menu principal.");
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
                    type: 'skills'
                },
                data: list
            }, null, 2);

            const result = await publishFileToGitHub(
                'public/data/skills.json',
                content,
                `update(skills): Mise à jour bibliothèque compétences v${rules.version}`,
                { token, owner, repo, branch: 'main' }
            );

            if (result.success) {
                alert("Bibliothèque de compétences publiée avec succès !");
            } else {
                alert("Erreur lors de la publication : " + result.message);
            }
        } catch (e) {
            alert("Erreur inattendue : " + (e as Error).message);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-[calc(100vh-180px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <GraduationCap className="text-amber-600" /> Réserve de Compétences
                    </h2>
                    <p className="text-slate-500 text-sm">Définissez les compétences standards que les joueurs pourront importer.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePublishClick}
                        className="bg-purple-700 text-white px-3 py-2 rounded font-bold hover:bg-purple-800 transition-colors flex items-center gap-2 text-sm"
                        title="Publier skills.json"
                    >
                        <UploadCloud size={16} /> Publier JSON
                    </button>
                    <button
                        onClick={handleOpenNew}
                        className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} /> Nouvelle Compétence
                    </button>
                </div>
            </div>

            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:border-amber-500 outline-none"
                    placeholder="Rechercher une compétence..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex-grow overflow-y-auto bg-slate-50 border border-slate-200 rounded p-4 custom-scrollbar">
                {list.length === 0 ? (
                    <div className="text-center text-slate-400 py-20 italic">La réserve est vide.</div>
                ) : filteredList.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 italic">Aucun résultat.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredList.map(skill => (
                            <div key={skill.id} className="bg-white border border-slate-200 rounded p-3 hover:shadow-md transition-shadow group flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            {skill.isVariable && <span title="Compétence à variantes"><Layers size={14} className="text-blue-500 shrink-0" /></span>}
                                            <span className="font-bold text-slate-800 truncate" title={skill.name}>{skill.name}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                                            <button onClick={() => handleOpenEdit(skill)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(skill.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    {skill.description && <p className="text-xs text-slate-500 italic line-clamp-2 mb-2">{skill.description}</p>}
                                </div>
                                {skill.defaultCategory && (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 self-start">
                                        {CATEGORY_HELP.find(c => c.code === skill.defaultCategory)?.label || skill.defaultCategory}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && editingSkill && (
                <ThematicModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingSkill.id ? 'Modifier Compétence' : 'Nouvelle Compétence'}
                    icon={<GraduationCap size={20} />}
                    size={showCategoryHelp ? 'lg' : 'md'}
                    footer={
                        <>
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded">Annuler</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded font-bold shadow hover:bg-blue-700 flex items-center gap-2">
                                <Save size={16} /> Enregistrer
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col lg:flex-row gap-8 py-2">
                        {/* Editor Form */}
                        <div className="flex-grow flex flex-col gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom</label>
                                <input
                                    className="w-full border border-slate-300 rounded px-3 py-2 font-bold focus:border-blue-500 outline-none"
                                    value={editingSkill.name}
                                    onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm min-h-[100px] focus:border-blue-500 outline-none resize-none"
                                    value={editingSkill.description || ''}
                                    onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Catégorie par défaut</label>
                                    <button onClick={() => setShowCategoryHelp(!showCategoryHelp)} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                                        <HelpCircle size={12} /> Aide
                                    </button>
                                </div>
                                <select
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                    value={editingSkill.defaultCategory || ''}
                                    onChange={(e) => setEditingSkill({ ...editingSkill, defaultCategory: e.target.value })}
                                >
                                    <option value="">-- Aucune --</option>
                                    {CATEGORY_HELP.map(cat => (
                                        <option key={cat.code} value={cat.code}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isVariableSkill"
                                    className="w-4 h-4 text-blue-600 rounded"
                                    checked={editingSkill.isVariable || false}
                                    onChange={(e) => setEditingSkill({ ...editingSkill, isVariable: e.target.checked })}
                                />
                                <label htmlFor="isVariableSkill" className="cursor-pointer select-none">
                                    <span className="block text-sm font-bold text-blue-900">Compétence à Variantes</span>
                                    <span className="block text-xs text-blue-700">Cochez si le joueur doit préciser quelque chose (ex: "Artisanat : Forge").</span>
                                </label>
                            </div>
                            {error && (
                                <div className="bg-red-50 text-red-800 text-xs p-3 rounded border border-red-200 font-bold flex items-center gap-2">
                                    <AlertOctagon size={16} /> {error}
                                </div>
                            )}
                        </div>

                        {/* Help Panel */}
                        {showCategoryHelp && (
                            <div className="w-full lg:w-72 shrink-0 animate-in slide-in-from-right-4 duration-300 bg-slate-50 p-4 rounded border border-slate-200">
                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                                    <h4 className="font-bold text-slate-700 text-sm">Codes Catégories</h4>
                                    <button onClick={() => setShowCategoryHelp(false)}><X size={14} /></button>
                                </div>
                                <div className="space-y-2 text-xs">
                                    {CATEGORY_HELP.map(cat => (
                                        <div key={cat.code} className="grid grid-cols-[1fr_2fr] gap-2">
                                            <code className="bg-slate-200 px-1 rounded font-mono text-slate-700">{cat.code}</code>
                                            <span className="text-slate-500">{cat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ThematicModal>
            )}

            <ConfirmationModal
                isOpen={showPublishConfirm}
                onClose={() => setShowPublishConfirm(false)}
                onConfirm={executePublish}
                title="Publier la bibliothèque ?"
                message="Vous êtes sur le point de mettre à jour le fichier skills.json public. Cela rendra les nouvelles compétences accessibles à tous les joueurs."
                confirmLabel="Publier maintenant"
                type="warning"
            />

            <ConfirmationModal
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Supprimer la compétence ?"
                message="Cette action est irréversible pour la base de données (mais nécessitera une publication pour être effective en ligne)."
                confirmLabel="Supprimer"
                type="danger"
            />
        </div>
    );
};

export default AdminSkillLibrary;
