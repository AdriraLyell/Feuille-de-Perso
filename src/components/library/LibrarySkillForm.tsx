import React, { useState } from 'react';
import { GraduationCap, Save, HelpCircle, X, AlertOctagon } from 'lucide-react';
import ThematicModal from '../ui/ThematicModal';
import { CATEGORY_HELP } from '../../constants/app';
import { LibrarySkillEntry } from '../../types';

interface LibrarySkillFormProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    skill: LibrarySkillEntry;
    onSkillChange: (skill: LibrarySkillEntry) => void;
    onSave: () => void;
    error: string | null;
    isOfficial?: boolean;
    categories?: { code: string, label: string, loc?: string }[];
    isEditable?: boolean;
}

const LibrarySkillForm: React.FC<LibrarySkillFormProps> = ({
    isOpen,
    onClose,
    title,
    skill,
    onSkillChange,
    onSave,
    error,
    isOfficial = false,
    categories = CATEGORY_HELP,
    isEditable = true
}) => {
    const [showCategoryHelp, setShowCategoryHelp] = useState(false);
    const [variantDraft, setVariantDraft] = useState(skill.variants?.join(', ') || '');

    React.useEffect(() => {
        setVariantDraft(skill.variants?.join(', ') || '');
    }, [skill.variants?.join(',')]);

    const handleSave = () => {
        const cleaned = variantDraft.split(',').map(v => v.trim()).filter(Boolean);
        onSkillChange({ ...skill, variants: cleaned });
        // Since setState is async, we can't rely on skill prop being updated yet if onSave uses it.
        // But most of our onSave functions in this project use the latest 'skill' object passed to onSkillChange.
        // Actually, let's look at how LibrarySkillLibrary.tsx handleSave works.
        onSave();
    };

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            icon={<GraduationCap size={20} />}
            size={showCategoryHelp ? 'lg' : 'md'}
            footer={
                <>
                    <button onClick={onClose} className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold">
                        {isEditable ? 'Annuler' : 'Fermer'}
                    </button>
                    {isEditable && (
                        <button onClick={handleSave} className="px-6 py-2 bg-[#5c4d41] text-white rounded-sm font-bold shadow-md hover:bg-[#4a3b32] flex items-center gap-2">
                            <Save size={16} /> Enregistrer
                        </button>
                    )}
                </>
            }
        >
            <div className="flex flex-col lg:flex-row gap-8 py-2">
                {/* Editor Form */}
                <div className="flex-grow flex flex-col gap-5">
                    {isOfficial && (
                        <div className="bg-blue-50/50 border border-blue-200 text-blue-800 px-4 py-3 rounded-sm flex items-start gap-3 text-sm shadow-sm -mb-2">
                            <AlertOctagon size={18} className="shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Compétence Officielle (Autorité Partagée)</p>
                                <p className="text-xs opacity-80 mt-1">
                                    Vous pouvez modifier la description et vos variantes suggérées personnelles.
                                    Les règles (catégorie, type variable, statut mystique) sont contrôlées par le {`MJ`} et ne peuvent être modifiées ici.
                                </p>
                            </div>
                        </div>
                    )}
                    <div>
                        <label 
                            htmlFor="skill-name"
                            className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest"
                        >
                            Nom de la compétence
                        </label>
                        <input
                            id="skill-name"
                            className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 font-serif font-black text-[#1c1917] bg-white/50 focus:border-amber-500 outline-none shadow-sm"
                            value={skill.name}
                            onChange={(e) => onSkillChange({ ...skill, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label 
                            htmlFor="skill-description"
                            className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest"
                        >
                            Description (Narrative)
                        </label>
                        <textarea
                            id="skill-description"
                            className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-3 text-sm text-[#1c1917] bg-white/50 min-h-[120px] focus:border-amber-500 outline-none resize-none shadow-sm italic leading-relaxed"
                            value={skill.description || ''}
                            onChange={(e) => onSkillChange({ ...skill, description: e.target.value })}
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label 
                                htmlFor="skill-category"
                                className="block text-[10px] font-bold text-[#bfae85] uppercase tracking-widest"
                            >
                                Catégorie de placement par défaut
                            </label>
                            {!showCategoryHelp && (
                                <button
                                    onClick={() => setShowCategoryHelp(true)}
                                    className="text-[#5c4d41] hover:text-[#8b2e2e] transition-colors flex items-center gap-1 text-[9px] font-bold"
                                    title="Voir l'aide sur les catégories"
                                >
                                    <HelpCircle size={14} /> Aide
                                </button>
                            )}
                        </div>
                        <select
                            id="skill-category"
                            className={`w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 text-sm font-bold outline-none shadow-sm ${isOfficial ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'text-[#1c1917] bg-white/50 focus:border-amber-500'}`}
                            value={skill.defaultCategory || ''}
                            disabled={isOfficial}
                            onChange={(e) => onSkillChange({ ...skill, defaultCategory: e.target.value })}
                        >
                            <option value="">-- Placement libre --</option>
                            {categories.map(cat => (
                                <option key={cat.code} value={cat.code}>{cat.label}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-[#5c4d41] mt-1.5 italic px-1">Définit dans quelle section de la fiche cette compétence sera rangée lors de l'importation.</p>
                    </div>
                    <div className={`border rounded-sm p-3 flex items-center gap-3 border-amber-200/50 ${isOfficial ? 'bg-stone-50 opacity-70' : 'bg-amber-50/50'}`}>
                        <input
                            type="checkbox"
                            id="isVariableSkill"
                            className={`w-4 h-4 accent-amber-600 ${isOfficial ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            checked={skill.isVariable || false}
                            disabled={isOfficial}
                            onChange={(e) => onSkillChange({ ...skill, isVariable: e.target.checked })}
                        />
                        <label htmlFor="isVariableSkill" className={`${isOfficial ? 'cursor-not-allowed' : 'cursor-pointer'} select-none`}>
                            <span className="block text-xs font-bold text-[#5c4d41] uppercase tracking-wide">Compétence à Spécialité / Variable</span>
                            <span className="block text-[10px] text-[#5c4d41]/70 italic mt-0.5">Cochez si le joueur doit préciser quelque chose (ex: "Artisanat : Forge"). Permet d'avoir plusieurs fois cette compétence.</span>
                        </label>
                    </div>

                    <div className={`border rounded-sm p-3 flex items-center gap-3 border-purple-200/50 ${isOfficial ? 'bg-purple-50/30 opacity-70' : 'bg-purple-50/50'}`}>
                        <input
                            type="checkbox"
                            id="isMysticSkill"
                            className={`w-4 h-4 accent-purple-600 ${isOfficial ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            checked={skill.isMystic || false}
                            disabled={isOfficial}
                            onChange={(e) => onSkillChange({ ...skill, isMystic: e.target.checked })}
                        />
                        <label htmlFor="isMysticSkill" className={`${isOfficial ? 'cursor-not-allowed' : 'cursor-pointer'} select-none`}>
                            <span className="block text-xs font-bold text-purple-900 uppercase tracking-wide">Compétence Mystique</span>
                            <span className="block text-[10px] text-purple-800/70 italic mt-0.5">Cochez si cette compétence est liée à l'utilisation de la magie.</span>
                        </label>
                    </div>

                    {skill.isVariable && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200 -mt-2 px-1">
                            <label 
                                htmlFor="suggested-variants-input"
                                className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest"
                            >
                                Variantes suggérées (Réserve)
                            </label>
                            <input
                                id="suggested-variants-input"
                                className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 text-xs text-[#1c1917] bg-[#fdfbf7] focus:border-amber-500 outline-none shadow-sm font-bold placeholder:italic placeholder:font-normal"
                                value={variantDraft}
                                onChange={(e) => setVariantDraft(e.target.value)}
                                onBlur={() => {
                                    const cleaned = variantDraft.split(',').map(v => v.trim()).filter(v => v !== '');
                                    onSkillChange({ ...skill, variants: cleaned });
                                }}
                                placeholder="Forge, Histoire, Épées..."
                            />
                            <p className="text-[9px] text-[#5c4d41]/70 mt-1 italic px-1">Séparez par des virgules. Ces options seront proposées lors du drag-and-drop.</p>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 text-red-800 text-[11px] p-3 rounded-sm border border-red-200 font-bold flex items-center gap-2 animate-shake">
                            <AlertOctagon size={16} /> {error}
                        </div>
                    )}
                </div>

                {/* Side Help Panel */}
                {showCategoryHelp && (
                    <div className="w-full lg:w-72 shrink-0 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center mb-2 border-b border-[#bfae85]/30 pb-1">
                            <span className="text-[10px] font-serif font-black uppercase text-[#8b2e2e] tracking-widest flex items-center gap-1">
                                <HelpCircle size={12} /> Aide aux catégories
                            </span>
                            <button
                                onClick={() => setShowCategoryHelp(false)}
                                className="text-[#5c4d41] hover:text-[#8b2e2e] p-0.5 rounded"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="p-0 overflow-hidden bg-white/30 rounded-sm border border-[#bfae85]/30 relative">
                            <table className="w-full text-[10px] text-left border-collapse">
                                <thead className="bg-[#fdfbf7] border-b border-[#bfae85]/50 transition-colors">
                                    <tr>
                                        <th className="px-3 py-2 font-black tracking-widest text-[#8b2e2e]">Code</th>
                                        <th className="px-3 py-2 font-black tracking-widest text-[#8b2e2e]">Emplacement</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#bfae85]/20">
                                    {categories.map((cat, i) => (
                                        <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                                            <td className="px-3 py-1.5 font-mono text-[#8b2e2e] font-bold">{cat.code}</td>
                                            <td className="px-3 py-1.5 text-[#4a3b32]">
                                                <div className="font-bold leading-tight">{cat.label}</div>
                                                <div className="text-[8px] text-[#5c4d41]/70 italic leading-tight">{cat.loc}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3 text-[9px] text-[#5c4d41]/70 leading-relaxed italic border-l-2 border-[#bfae85]/30 pl-2">
                            Conseil : Copiez-collez le code technique exact pour un tri automatique parfait.
                        </p>
                    </div>
                )}
            </div>
        </ThematicModal>
    );
};

export default LibrarySkillForm;
