
import React, { useState, useMemo } from 'react';
import { CharacterSheetData, LibrarySkillEntry } from '../types';
import { BookOpen, GraduationCap, Plus, Search, Trash2, Edit2, X, Save, CheckCircle2, Download, AlertTriangle, HelpCircle, AlertOctagon } from 'lucide-react';
import TraitLibrary from './TraitLibrary';
import { useCharacter } from '../context/CharacterContext'; // Import Context
import { useNotification } from '../context/NotificationContext';

const CATEGORY_HELP = [
    { code: 'talents', label: 'Talents', loc: 'Colonne 1 (Gauche)' },
    { code: 'competences', label: 'Compétences', loc: 'Colonne 2 (Centre-Gauche)' },
    { code: 'competences_col_2', label: 'Compétences (Suite)', loc: 'Colonne 3 (Centre-Droite)' },
    { code: 'connaissances', label: 'Connaissances', loc: 'Colonne 4 (Droite)' },
    { code: 'autres_competences', label: 'Autres Compétences', loc: 'Bas de page (Gauche)' },
    { code: 'competences2', label: 'Compétences Secondaires', loc: 'Bas de page (Centre)' },
    { code: 'autres', label: 'Autres', loc: 'Bas de page (Droite)' },
    { code: 'arrieres_plans', label: 'Arrières-Plans', loc: 'Bas de page (Droite)' },
];

const LibraryView: React.FC = () => {
    const { data, updateData: onUpdate } = useCharacter(); // Use Context
    const [activeTab, setActiveTab] = useState<'traits' | 'skills'>('traits');
    const addLog = useNotification(); // Use Context

    // -- Skill Library Logic --
    const [skillSearch, setSkillSearch] = useState('');
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState<LibrarySkillEntry | null>(null);
    const [skillError, setSkillError] = useState<string | null>(null);

    // Import Confirmation Modal State
    const [showImportConfirm, setShowImportConfirm] = useState(false);

    // Help Modal State
    const [showCategoryHelp, setShowCategoryHelp] = useState(false);

    // Delete Confirmation Modal State
    const [skillToDelete, setSkillToDelete] = useState<LibrarySkillEntry | null>(null);

    const skillsList = data.skillLibrary || [];

    // Determine which skills are currently on the sheet
    const usedSkillNames = useMemo(() => {
        const names = new Set<string>();
        if (data.skills) {
            Object.keys(data.skills).forEach(key => {
                // @ts-ignore
                const list = data.skills[key] || [];
                list.forEach((s: any) => {
                    if (s.name && s.name.trim() !== '') {
                        names.add(s.name.trim().toLowerCase());
                    }
                });
            });
        }
        return names;
    }, [data.skills]);

    const filteredSkills = skillsList.filter(s =>
        s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(skillSearch.toLowerCase()))
    ).sort((a, b) => a.name.localeCompare(b.name));

    const handleOpenNewSkill = () => {
        setSkillError(null);
        setEditingSkill({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            description: ''
        });
        setIsSkillModalOpen(true);
    };

    const handleOpenEditSkill = (skill: LibrarySkillEntry) => {
        setSkillError(null);
        setEditingSkill({ ...skill });
        setIsSkillModalOpen(true);
    };

    const handleSaveSkill = () => {
        if (!editingSkill) return;
        if (!editingSkill.name.trim()) {
            setSkillError("Le nom de la compétence est requis.");
            return;
        }

        const duplicate = skillsList.find(s =>
            s.id !== editingSkill.id &&
            s.name.trim().toLowerCase() === editingSkill.name.trim().toLowerCase()
        );

        if (duplicate) {
            setSkillError("Une compétence portant ce nom existe déjà.");
            return;
        }

        const exists = skillsList.some(s => s.id === editingSkill.id);
        let newLibrary;
        if (exists) {
            newLibrary = skillsList.map(s => s.id === editingSkill.id ? editingSkill : s);
        } else {
            newLibrary = [...skillsList, editingSkill];
        }

        onUpdate({ ...data, skillLibrary: newLibrary });
        addLog(`Compétence "${editingSkill.name}" enregistrée dans la réserve.`, 'success', 'settings');
        setIsSkillModalOpen(false);
        setEditingSkill(null);
    };

    const handleDeleteRequest = (skill: LibrarySkillEntry) => {
        setSkillToDelete(skill);
    };

    const executeDeleteSkill = () => {
        if (!skillToDelete) return;

        onUpdate({ ...data, skillLibrary: skillsList.filter(s => s.id !== skillToDelete.id) });
        addLog(`Compétence "${skillToDelete.name}" supprimée de la réserve.`, 'info', 'settings');
        setSkillToDelete(null);
    };

    // Logic to import skills currently on the sheet into the library
    const executeImportFromSheet = () => {
        const currentLib = [...skillsList];
        const existingNames = new Set(currentLib.map(s => s.name.trim().toLowerCase()));
        let addedCount = 0;

        Object.keys(data.skills).forEach(key => {
            if (key === 'arrieres_plans') return; // Skip backgrounds

            // @ts-ignore
            const sheetSkills = data.skills[key] || [];
            sheetSkills.forEach((skill: any) => {
                const normalized = skill.name ? skill.name.trim() : "";
                if (normalized && !existingNames.has(normalized.toLowerCase())) {
                    currentLib.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: skill.name,
                        description: "",
                        defaultCategory: key // Store origin category as default
                    });
                    existingNames.add(normalized.toLowerCase());
                    addedCount++;
                }
            });
        });

        if (addedCount > 0) {
            // Sort alphabetically
            currentLib.sort((a, b) => a.name.localeCompare(b.name));
            onUpdate({ ...data, skillLibrary: currentLib });
            addLog(`${addedCount} compétence(s) importée(s) depuis la fiche.`, 'success', 'settings');
        } else {
            addLog("Toutes les compétences de la fiche sont déjà dans la réserve.", 'info', 'settings');
        }
        setShowImportConfirm(false);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded shadow-sm border border-gray-200 overflow-hidden relative">

            {/* Tabs Header */}
            <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
                <button
                    onClick={() => setActiveTab('traits')}
                    className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'traits'
                        ? 'border-blue-600 text-blue-700 bg-white'
                        : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        }`}
                >
                    <BookOpen size={18} />
                    Bibliothèque de Traits
                </button>
                <button
                    onClick={() => setActiveTab('skills')}
                    className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'skills'
                        ? 'border-purple-600 text-purple-700 bg-white'
                        : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        }`}
                >
                    <GraduationCap size={18} />
                    Réserve de Compétences
                </button>
            </div>

            {/* Content */}
            <div className="flex-grow min-h-0 relative">
                {activeTab === 'traits' && (
                    // Use existing component logic, wrapped to fit height
                    <div className="absolute inset-0">
                        <TraitLibrary data={data} onUpdate={onUpdate} isEditable={true} />
                    </div>
                )}

                {activeTab === 'skills' && (
                    <div className="absolute inset-0 flex flex-col bg-white">
                        {/* Skill Toolbar */}
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                            <div className="relative flex-grow max-w-md w-full flex gap-2">
                                <div className="relative flex-grow">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:border-purple-500 outline-none text-gray-800 placeholder-gray-400 bg-white"
                                        placeholder="Rechercher une compétence..."
                                        value={skillSearch}
                                        onChange={(e) => setSkillSearch(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => setShowCategoryHelp(true)}
                                    className="bg-white border border-gray-300 text-gray-500 hover:text-purple-600 hover:border-purple-300 px-2 rounded flex items-center justify-center transition-colors shadow-sm"
                                    title="Aide sur les catégories"
                                >
                                    <HelpCircle size={18} />
                                </button>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowImportConfirm(true)}
                                    className="bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap flex-1 sm:flex-initial justify-center"
                                    title="Ajouter toutes les compétences de la fiche à la réserve"
                                >
                                    <Download size={16} /> Importer de la fiche
                                </button>
                                <button
                                    onClick={handleOpenNewSkill}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap flex-1 sm:flex-initial justify-center"
                                >
                                    <Plus size={16} /> Créer
                                </button>
                            </div>
                        </div>

                        {/* Skill List */}
                        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                            {skillsList.length === 0 ? (
                                <div className="text-center text-gray-400 py-10 italic px-4 text-sm flex flex-col items-center">
                                    <GraduationCap size={48} className="opacity-20 mb-2" />
                                    <p>La réserve de compétences est vide.</p>
                                    <p className="text-xs mt-2">
                                        Utilisez le bouton <strong>"Importer de la fiche"</strong> pour la remplir automatiquement <br />
                                        avec vos compétences actuelles.
                                    </p>
                                </div>
                            ) : filteredSkills.length === 0 ? (
                                <div className="text-center text-gray-400 py-10 italic">Aucune compétence trouvée.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredSkills.map(skill => {
                                        const isUsed = usedSkillNames.has(skill.name.trim().toLowerCase());

                                        return (
                                            <div
                                                key={skill.id}
                                                className={`border rounded-lg p-3 transition-all bg-white group flex flex-col justify-between ${isUsed
                                                    ? 'border-green-200 bg-green-50/30'
                                                    : 'border-gray-200 hover:shadow-md hover:border-purple-300'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`font-bold text-sm ${isUsed ? 'text-green-800' : 'text-gray-800'}`}>
                                                            {skill.name}
                                                        </span>

                                                        {isUsed ? (
                                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-1 font-bold border border-green-200">
                                                                <CheckCircle2 size={10} /> Sur la fiche
                                                            </span>
                                                        ) : (
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => handleOpenEditSkill(skill)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={14} /></button>
                                                                <button onClick={() => handleDeleteRequest(skill)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {skill.description && (
                                                        <p className="text-xs text-gray-500 line-clamp-2" title={skill.description}>{skill.description}</p>
                                                    )}
                                                </div>
                                                {skill.defaultCategory && (
                                                    <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded self-start mt-2">
                                                        {skill.defaultCategory}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Category Help Modal */}
            {showCategoryHelp && (
                <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-200 bg-purple-50 flex justify-between items-center">
                            <h3 className="font-bold text-purple-900 flex items-center gap-2">
                                <HelpCircle size={20} /> Codes des Catégories
                            </h3>
                            <button onClick={() => setShowCategoryHelp(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded"><X size={20} /></button>
                        </div>
                        <div className="p-0 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 font-bold">Code Technique</th>
                                        <th className="px-4 py-3 font-bold">Emplacement sur la fiche</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {CATEGORY_HELP.map((cat, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 font-mono text-purple-700 font-bold text-xs">{cat.code}</td>
                                            <td className="px-4 py-2 text-gray-700">
                                                <div className="font-bold">{cat.label}</div>
                                                <div className="text-[10px] text-gray-400">{cat.loc}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-3 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
                            Ces codes permettent de trier automatiquement les compétences lorsqu'elles sont importées sur la fiche.
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {skillToDelete && (
                <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in duration-200 border-2 border-red-100">
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <Trash2 size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer la compétence ?</h3>
                            <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-4">
                                <span className="block font-bold text-gray-800 text-lg">{skillToDelete.name}</span>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Cette action est irréversible. La compétence sera retirée de la réserve.
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-200">
                            <button
                                onClick={() => setSkillToDelete(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-white transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={executeDeleteSkill}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} /> Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Confirmation Modal */}
            {showImportConfirm && (
                <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                                <Download size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Importer depuis la fiche ?</h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                Cette action va scanner votre fiche de personnage et ajouter toutes les compétences trouvées à la réserve.
                            </p>
                            <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg border border-yellow-200 text-left flex gap-2">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <span>Les doublons (compétences portant le même nom) seront ignorés pour éviter les répétitions.</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-200">
                            <button
                                onClick={() => setShowImportConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-white transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={executeImportFromSheet}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm transition-colors"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Skill Edit Modal */}
            {isSkillModalOpen && editingSkill && (
                <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center text-white bg-purple-700">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <GraduationCap size={20} />
                                {skillsList.some(s => s.id === editingSkill.id) ? 'Éditer Compétence' : 'Nouvelle Compétence'}
                            </h3>
                            <button onClick={() => setIsSkillModalOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 bg-gray-50 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-bold text-gray-900 bg-white focus:border-purple-500 outline-none"
                                    value={editingSkill.name}
                                    onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (Optionnelle)</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white min-h-[80px] focus:border-purple-500 outline-none resize-none"
                                    value={editingSkill.description || ''}
                                    onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })}
                                />
                            </div>
                            {skillError && (
                                <div className="bg-red-50 text-red-600 text-xs p-2 rounded border border-red-200 font-bold">
                                    {skillError}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsSkillModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded font-bold">Annuler</button>
                            <button onClick={handleSaveSkill} className="px-6 py-2 bg-purple-600 text-white rounded font-bold shadow-md hover:bg-purple-700 flex items-center gap-2">
                                <Save size={16} /> Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LibraryView;
