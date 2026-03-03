import React from 'react';
import { Search, Plus, Eye, EyeOff, CheckCircle2, Globe, RefreshCw, Download, Layers, Edit2, Trash2, GraduationCap, Sparkles, X } from 'lucide-react';
import { LibrarySkillEntry } from '../../types';
import { MergedEntry } from '../../utils/libraryMerger';

interface SkillLibraryTabProps {
    skillsList: MergedEntry<LibrarySkillEntry>[];
    filteredSkills: MergedEntry<LibrarySkillEntry>[];
    usedSkillNames: Set<string>;
    skillSearch: string;
    setSkillSearch: (val: string) => void;
    hideKnownSkills: boolean;
    setHideKnownSkills: (val: boolean) => void;
    handleOfficialUpdateClick: () => void;
    setShowImportConfirm: (val: boolean) => void;
    handleOpenNewSkill: () => void;
    handleOpenEditSkill: (merged: MergedEntry<LibrarySkillEntry>) => void;
    handleDeleteRequest: (merged: MergedEntry<LibrarySkillEntry>) => void;
    getCategoryLabel: (code: string) => string;
    isEditable?: boolean;
}

const SkillLibraryTab: React.FC<SkillLibraryTabProps> = ({
    skillsList,
    filteredSkills,
    usedSkillNames,
    skillSearch,
    setSkillSearch,
    hideKnownSkills,
    setHideKnownSkills,
    handleOfficialUpdateClick,
    setShowImportConfirm,
    handleOpenNewSkill,
    handleOpenEditSkill,
    handleDeleteRequest,
    getCategoryLabel,
    isEditable = true
}) => {
    return (
        <div className="absolute inset-0 flex flex-col bg-[#fdfbf7]">
            {/* Skill Toolbar */}
            <div className="p-3 bg-stone-100/30 border-b border-[#bfae85]/30 grid grid-cols-1 lg:grid-cols-3 items-center gap-4 shrink-0">
                {/* Search Bar - Left */}
                <div className="relative w-full max-w-sm flex gap-2">
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search size={16} className="text-[#4a3b32]/50 pointer-events-none" />
                        </span>
                        <input
                            className="w-full pl-9 pr-9 py-1.5 text-sm border border-[#bfae85]/50 rounded-sm focus:border-amber-500 outline-none text-[#1c1917] placeholder-[#4a3b32]/40 bg-white/80"
                            placeholder="Rechercher une compétence..."
                            value={skillSearch}
                            onChange={(e) => setSkillSearch(e.target.value)}
                        />
                        {skillSearch && (
                            <button
                                onClick={() => setSkillSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4a3b32]/40 hover:text-amber-600 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setHideKnownSkills(!hideKnownSkills)}
                        className={`px-2 py-1.5 rounded-sm border transition-colors flex items-center justify-center ${hideKnownSkills ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-[#5c4d41] border-[#bfae85]/50 hover:bg-stone-50'}`}
                        title={hideKnownSkills ? "Afficher les compétences acquises" : "Masquer les compétences acquises"}
                    >
                        {hideKnownSkills ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                {/* Shared Legend - Center */}
                <div className="flex justify-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50/50 border border-green-200/50 rounded-full w-fit">
                        <CheckCircle2 size={10} className="text-green-600" />
                        <span className="text-[9px] font-bold text-green-800/70 uppercase tracking-tight whitespace-nowrap">Présent</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50/50 border border-blue-200/50 rounded-full w-fit">
                        <Globe size={10} className="text-indigo-600" />
                        <span className="text-[9px] font-bold text-indigo-800/70 uppercase tracking-tight whitespace-nowrap">Officiel</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50/50 border border-amber-200/50 rounded-full w-fit">
                        <Sparkles size={10} className="text-amber-600" />
                        <span className="text-[9px] font-bold text-amber-800/70 uppercase tracking-tight whitespace-nowrap">Mystique</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50/50 border border-blue-200/50 rounded-full w-fit">
                        <Layers size={10} className="text-blue-600" />
                        <span className="text-[9px] font-bold text-blue-800/70 uppercase tracking-tight whitespace-nowrap">Variant</span>
                    </div>
                </div>

                {/* Actions - Right */}
                {isEditable && (
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={handleOfficialUpdateClick}
                            className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                            title="Mettre à jour depuis le serveur officiel"
                        >
                            <RefreshCw size={14} /> Officiel
                        </button>
                        <button
                            onClick={() => setShowImportConfirm(true)}
                            className="bg-white/80 border border-[#bfae85]/50 text-[#5c4d41] hover:bg-stone-50 hover:text-[#1c1917] px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                            title="Ajouter toutes les compétences de la fiche à la réserve"
                        >
                            <Download size={14} /> Importer
                        </button>
                        <button
                            onClick={handleOpenNewSkill}
                            className="bg-[#5c4d41] hover:bg-[#4a3b32] text-white px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                        >
                            <Plus size={14} /> Créer
                        </button>
                    </div>
                )}
            </div>

            {/* Skill List */}
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                {skillsList.length === 0 ? (
                    <div className="text-center text-[#5c4d41]/60 py-10 italic px-4 text-sm flex flex-col items-center">
                        <GraduationCap size={48} className="opacity-20 mb-2" />
                        <p>La réserve de compétences est vide.</p>
                        <p className="text-xs mt-2 text-[#5c4d41]/80 italic">
                            Utilisez le bouton <strong>"Importer de la fiche"</strong> pour la remplir automatiquement <br />
                            avec vos compétences actuelles.
                        </p>
                    </div>
                ) : filteredSkills.length === 0 ? (
                    <div className="text-center text-[#5c4d41]/60 py-10 italic">Aucune compétence trouvée.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredSkills.map(merged => {
                            const skill = merged.entry;
                            const isUsed = usedSkillNames.has(skill.name.trim().toLowerCase());
                            const isOfficial = merged.source === 'official';

                            return (
                                <div
                                    key={skill.id}
                                    className={`border rounded-sm p-2 group flex flex-col justify-between transition-all bg-white/60 ${isUsed
                                        ? 'border-green-300/40 bg-green-50/10'
                                        : isOfficial ? 'border-blue-300/40 bg-blue-50/5' : 'border-[#bfae85]/30 hover:border-amber-400/50 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                {skill.isVariable && (
                                                    <span title="Compétence à variations">
                                                        <Layers size={10} className="text-blue-600 shrink-0" />
                                                    </span>
                                                )}
                                                {skill.mysticAbilityId && (
                                                    <span title="Habilité Mystique">
                                                        <Sparkles size={10} className="text-amber-500 shrink-0" />
                                                    </span>
                                                )}
                                                {isOfficial && (
                                                    <span title="Compétence Officielle">
                                                        <Globe size={11} className="text-indigo-500 shrink-0" />
                                                    </span>
                                                )}
                                                {isUsed && (
                                                    <span title="Présent dans la fiche">
                                                        <CheckCircle2 size={10} className="text-green-600 shrink-0" />
                                                    </span>
                                                )}
                                                <span className={`font-serif font-black uppercase text-[11px] tracking-wide truncate ${isUsed ? 'text-green-800' : 'text-[#4a3b32]'}`}>
                                                    {skill.name}
                                                </span>
                                            </div>

                                            <div className="flex gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenEditSkill(merged)} className="text-blue-500 hover:bg-blue-50 p-1 rounded" title={isEditable ? "Éditer/Voir" : "Voir"} >
                                                    {isEditable ? <Edit2 size={12} /> : <Eye size={12} />}
                                                </button>
                                                {isEditable && !isUsed && !isOfficial && (
                                                    <button onClick={() => handleDeleteRequest(merged)} className="text-red-500 hover:bg-red-50 p-1 rounded" title="Supprimer"><Trash2 size={12} /></button>
                                                )}
                                            </div>
                                        </div>
                                        {skill.description && (
                                            <p className="text-[10px] text-[#5c4d41] italic line-clamp-1 leading-tight opacity-70" title={skill.description}>{skill.description}</p>
                                        )}
                                    </div>
                                    {skill.defaultCategory && (
                                        <span className="text-[8px] text-amber-800/50 font-mono bg-amber-100/20 px-1 py-0.5 rounded-sm self-start mt-1 border border-amber-200/10">
                                            {getCategoryLabel(skill.defaultCategory)}
                                        </span>
                                    )}

                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillLibraryTab;
