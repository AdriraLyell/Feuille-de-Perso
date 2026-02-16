import React, { useState, useMemo, useRef } from 'react';
import { RulesData } from '../../../types/rules';
import { LibrarySkillEntry } from '../../../types';
import { Search, Plus, GraduationCap, Save, AlertOctagon, X, Layers, Edit2, Trash2, UploadCloud, CheckCircle2, Circle, Lock, Globe, Filter, Sparkles } from 'lucide-react';
import ThematicModal from '../../../components/ui/ThematicModal';
import TriStateChip from '../../../components/ui/TriStateChip';
import { useAdminSkillLibrary } from '../../../hooks/admin/useAdminSkillLibrary';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import { PortalTooltip } from '../../../components/ui/PortalTooltip';

interface AdminSkillLibraryProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    globalUsage?: Record<string, number>;
}

const SkillLibraryItem: React.FC<{
    skill: LibrarySkillEntry;
    isPlaced: boolean;
    isLocked: boolean;
    toggleSkillActive: (skill: LibrarySkillEntry) => void;
    handleOpenEdit: (skill: LibrarySkillEntry) => void;
    handleDelete: (id: string) => void;
}> = ({ skill, isPlaced, isLocked, toggleSkillActive, handleOpenEdit, handleDelete }) => {
    const hasVariants = skill.variants && skill.variants.length > 0;
    const [showVariantsTooltip, setShowVariantsTooltip] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);

    return (
        <div className={`bg-white border rounded p-2 transition-shadow group flex items-center gap-2 ${skill.isActive === false ? 'opacity-60 grayscale border-slate-200' : 'hover:shadow-md border-slate-300'}`}>
            {/* 1. Toggle (Fixed width) */}
            <div className="w-8 flex justify-center shrink-0">
                <input
                    type="checkbox"
                    checked={skill.isActive !== false}
                    onChange={() => toggleSkillActive(skill)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    title={skill.isActive !== false ? "Désactiver (Retirer de la campagne)" : "Activer (Ajouter à la campagne)"}
                />
            </div>

            {/* 2. Content (Flexible) */}
            <div className="flex-grow overflow-hidden pr-2">
                <div className={`font-bold truncate text-sm ${skill.isActive === false ? 'text-slate-500 line-through' : 'text-slate-800'}`} title={skill.name}>
                    {skill.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {skill.isGlobal && <div title="Global Reservoir"><Globe size={11} className="text-indigo-400 shrink-0" /></div>}
                    {skill.isVariable && (
                        <div
                            ref={anchorRef}
                            className="relative"
                            onMouseEnter={() => setShowVariantsTooltip(true)}
                            onMouseLeave={() => setShowVariantsTooltip(false)}
                            title={!hasVariants ? "Compétence à variantes" : undefined}
                        >
                            <Layers
                                size={11}
                                className="text-blue-400 shrink-0"
                            />

                            {hasVariants && (
                                <PortalTooltip
                                    anchorRef={anchorRef}
                                    isOpen={showVariantsTooltip}
                                    title="Variantes (Réserve)"
                                >
                                    <div className="flex flex-wrap gap-1">
                                        {skill.variants?.map((v, i) => (
                                            <span key={i} className="bg-slate-700 px-1 rounded-sm border border-slate-600">{v}</span>
                                        ))}
                                    </div>
                                </PortalTooltip>
                            )}
                        </div>
                    )}
                    {skill.mysticAbilityId && (
                        <div title="Compétence Mystique">
                            <Sparkles size={11} className="text-amber-500 shrink-0" />
                        </div>
                    )}
                    {isLocked && <div className="text-amber-500 shrink-0" title={isPlaced ? "Utilisée dans cette campagne" : "Utilisée dans d'autres campagnes"}><Lock size={11} /></div>}
                    {skill.description && (
                        <div className="text-[10px] text-slate-500 italic truncate" title={skill.description}>
                            {skill.description}
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Actions (Fixed width) */}
            <div className="w-16 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                    onClick={() => handleOpenEdit(skill)}
                    className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                    title="Modifier"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={() => handleDelete(skill.id)}
                    disabled={isLocked}
                    className={`p-1 rounded ${isLocked ? 'text-slate-300' : 'text-red-500 hover:bg-red-50'}`}
                    title={isLocked ? "Suppression bloquée : compétence utilisée" : "Supprimer définitivement du repository"}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

const AdminSkillLibrary: React.FC<AdminSkillLibraryProps> = ({ rules, onUpdate, globalUsage = {} }) => {
    const {
        list,
        searchTerm, setSearchTerm,
        isModalOpen, setIsModalOpen,
        editingSkill, setEditingSkill,
        variantDraft, setVariantDraft,
        error,
        showCategoryHelp, setShowCategoryHelp,
        activeFilter, setActiveFilter,
        sourceFilter, setSourceFilter,
        typeFilter, setTypeFilter,
        usageFilter, setUsageFilter,
        mysticFilter, setMysticFilter,
        showPublishConfirm, setShowPublishConfirm,
        showDeleteConfirm, setShowDeleteConfirm,
        publishResult, setPublishResult,
        showConfigAlert, setShowConfigAlert,
        placedSkillNames,
        filteredList,
        availableCategories,
        getCategoryLabel,
        handleOpenNew,
        handleOpenEdit,
        handleDelete,
        toggleSkillActive,
        confirmDelete,
        handleSave,
        handleBulkSelect,
        handlePublishClick,
        executePublish
    } = useAdminSkillLibrary(rules, onUpdate, globalUsage);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-[calc(100vh-120px)] flex flex-col">
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

            <div className="flex flex-wrap gap-2 items-center mb-4 p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="flex items-center gap-1.5 px-2 text-slate-400 border-r border-slate-200 mr-1 py-1">
                    <Filter size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Filtres</span>
                </div>

                <TriStateChip
                    label="Actifs"
                    value={activeFilter}
                    onChange={setActiveFilter}
                    icon={CheckCircle2}
                    activeColor="green"
                />

                <TriStateChip
                    label="Officiels"
                    value={sourceFilter}
                    onChange={setSourceFilter}
                    icon={Globe}
                    activeColor="indigo"
                />

                <TriStateChip
                    label="Variantes"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    icon={Layers}
                    activeColor="blue"
                />

                <TriStateChip
                    label="Placés"
                    value={usageFilter}
                    onChange={setUsageFilter}
                    icon={GraduationCap}
                    activeColor="amber"
                />

                <TriStateChip
                    label="Mystiques"
                    value={mysticFilter}
                    onChange={setMysticFilter}
                    icon={Sparkles}
                    activeColor="amber"
                />

                {(activeFilter !== null || sourceFilter !== null || typeFilter !== null || usageFilter !== null || mysticFilter !== null) && (
                    <button
                        onClick={() => { setActiveFilter(null); setSourceFilter(null); setTypeFilter(null); setUsageFilter(null); setMysticFilter(null); }}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700 ml-auto px-2"
                    >
                        RÉINITIALISER
                    </button>
                )}
            </div>

            {/* Bulk Actions */}
            {list.length > 0 && (
                <div className="flex gap-4 mb-4 px-1">
                    <button
                        onClick={() => handleBulkSelect(true)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
                    >
                        <CheckCircle2 size={14} />
                        Tout activer {searchTerm ? `(${filteredList.length})` : ''}
                    </button>
                    <button
                        onClick={() => handleBulkSelect(false)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                        <Circle size={14} />
                        Tout désactiver {searchTerm ? `(${filteredList.length})` : ''}
                    </button>
                </div>
            )}

            <div className="flex-grow overflow-y-auto bg-slate-50 border border-slate-200 rounded p-4 custom-scrollbar">
                {list.length === 0 ? (
                    <div className="text-center text-slate-400 py-20 italic">La réserve est vide.</div>
                ) : filteredList.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 italic">Aucun résultat.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredList.map(skill => {
                            const isPlaced = placedSkillNames.has(skill.name.trim().toLowerCase());
                            const isGloballyUsed = !!globalUsage[skill.id];
                            const isLocked = isPlaced || isGloballyUsed;

                            return (
                                <SkillLibraryItem
                                    key={skill.id}
                                    skill={skill}
                                    isPlaced={isPlaced}
                                    isLocked={isLocked}
                                    toggleSkillActive={toggleSkillActive}
                                    handleOpenEdit={handleOpenEdit}
                                    handleDelete={handleDelete}
                                />
                            );
                        })}
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
                    <div className="flex flex-col gap-5 py-2">
                        {/* Editor Form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label htmlFor="skill-name" className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom</label>
                                    <input
                                        id="skill-name"
                                        className="w-full border border-slate-300 rounded px-3 py-2 font-bold focus:border-blue-500 outline-none"
                                        value={editingSkill.name}
                                        onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                                    />
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isVariableSkill"
                                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                        checked={editingSkill.isVariable || false}
                                        onChange={(e) => setEditingSkill({ ...editingSkill, isVariable: e.target.checked })}
                                    />
                                    <label htmlFor="isVariableSkill" className="cursor-pointer select-none">
                                        <span className="block text-sm font-bold text-blue-900 leading-tight">Variantes requises</span>
                                        <span className="block text-[10px] text-blue-700 leading-tight">Ex: "Artisanat : Forge"</span>
                                    </label>
                                </div>

                                {/* Mystic Link SECTION */}
                                <div className={`bg-amber-50 border border-amber-200 rounded p-3 flex flex-col gap-2 transition-all ${editingSkill.mysticAbilityId ? 'ring-1 ring-amber-400' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isMysticAbility"
                                            className="w-4 h-4 text-amber-600 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            checked={!!editingSkill.mysticAbilityId}
                                            disabled={!rules.libraries.mysticAbilities?.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const firstId = rules.libraries.mysticAbilities?.[0]?.id || '';
                                                    if (firstId) {
                                                        setEditingSkill({ ...editingSkill, mysticAbilityId: firstId });
                                                    }
                                                } else {
                                                    const { mysticAbilityId, ...rest } = editingSkill;
                                                    setEditingSkill(rest);
                                                }
                                            }}
                                        />
                                        <label htmlFor="isMysticAbility" className="cursor-pointer select-none">
                                            <span className="block text-sm font-bold text-amber-900 leading-tight">Habilité Mystique</span>
                                            <span className="block text-[10px] text-amber-700 leading-tight">Lier à une catégorie magique/martiale</span>
                                            {!rules.libraries.mysticAbilities?.length && (
                                                <span className="block text-[10px] text-red-600 italic mt-1">Aucune habilité mystique définie dans les règles.</span>
                                            )}
                                        </label>
                                    </div>
                                    {editingSkill.mysticAbilityId !== undefined && rules.libraries.mysticAbilities && rules.libraries.mysticAbilities.length > 0 && (
                                        <select
                                            className="w-full border border-amber-300 rounded px-2 py-1 text-xs focus:border-amber-500 outline-none bg-white font-bold"
                                            value={editingSkill.mysticAbilityId}
                                            onChange={(e) => setEditingSkill({ ...editingSkill, mysticAbilityId: e.target.value })}
                                        >
                                            <option value="">-- Choisir une habilité --</option>
                                            {rules.libraries.mysticAbilities?.map(ma => (
                                                <option key={ma.id} value={ma.id}>{ma.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                {editingSkill.isVariable && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                        <label htmlFor="skill-variants" className="block text-xs font-bold text-slate-500 uppercase mb-1">Exemples de variantes (séparés par des virgules)</label>
                                        <input
                                            id="skill-variants"
                                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                            placeholder="Ex: Forge, Menuiserie, Peinture..."
                                            value={variantDraft}
                                            onChange={(e) => setVariantDraft(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="skill-description" className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                <textarea
                                    id="skill-description"
                                    className="w-full flex-grow border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none resize-none min-h-[120px]"
                                    value={editingSkill.description || ''}
                                    onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })}
                                />
                            </div>
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
                                {availableCategories.map(cat => (
                                    <div key={cat.code} className="grid grid-cols-[1fr_2fr] gap-2">
                                        <code className="bg-slate-200 px-1 rounded font-mono text-slate-700">{cat.code}</code>
                                        <span className="text-slate-500">{cat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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

            <ConfirmationModal
                isOpen={!!publishResult}
                onClose={() => setPublishResult(null)}
                onConfirm={() => setPublishResult(null)}
                title={publishResult?.success ? "Publication Réussie" : "Échec de la Publication"}
                message={publishResult?.message || ""}
                confirmLabel="Fermer"
                type={publishResult?.success ? "success" : "danger"}
                cancelLabel=""
            />

            <ConfirmationModal
                isOpen={showConfigAlert}
                onClose={() => setShowConfigAlert(false)}
                onConfirm={() => setShowConfigAlert(false)}
                title="Configuration Manquante"
                message="Veuillez d'abord configurer vos identifiants GitHub via le bouton 'Publier' du menu principal."
                confirmLabel="Compris"
                type="info"
                cancelLabel=""
            />
        </div>
    );
};

export default AdminSkillLibrary;
