import React, { useRef, useState } from 'react';
import { TraitEntry } from '../../../types';
import { Edit, Trash2, Wand2, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';
import { PortalTooltip } from '../../ui/PortalTooltip';
import { useCharacterData } from '../../../context/CharacterContext';
import { useRules } from '../../../context/RulesContext';
import { getMysticCapacity } from '../../../utils/mysticUtils';

interface TraitRowProps {
    item: TraitEntry;
    type: 'avantages' | 'desavantages';
    onClick: () => void;
    onRemove: (e: React.MouseEvent) => void;
    onManageMystic?: (e: React.MouseEvent) => void;
}

const TraitRow: React.FC<TraitRowProps> = ({ item, type, onClick, onRemove, onManageMystic }) => {
    const character = useCharacterData();
    const { rules } = useRules();
    const anchorRef = useRef<HTMLDivElement>(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const isEmpty = !item.name.trim();
    const isResolved = item.value === '0' && item.creationValue !== undefined && item.creationValue !== '0';

    const isPostCreation = item.isPostCreation && !isResolved;

    // Use internal trait type if defined, otherwise fall back to the component prop
    const internalTraitType = item.type;
    const isDisadvantage = internalTraitType ? (internalTraitType === 'desavantage') : (type === 'desavantages');
    const isAdvantage = internalTraitType ? (internalTraitType === 'avantage') : (type === 'avantages');

    const isImproved = !isPostCreation && item.creationValue !== undefined && parseInt(item.value) > parseInt(item.creationValue);
    const isReduced = !isPostCreation && item.creationValue !== undefined && parseInt(item.value) < parseInt(item.creationValue);

    const isPostCreationAdvantage = isPostCreation && isAdvantage;
    const isPostCreationDisadvantage = isPostCreation && isDisadvantage;

    // Calcul de la capacité mystique si le trait gère des compétences mystiques
    const mysticCapacity = (!isEmpty && item.mysticAbilityId && character && rules)
        ? getMysticCapacity(character, item.mysticAbilityId, rules)
        : null;

    const ownedMysticSkills = (!isEmpty && item.mysticAbilityId && character)
        ? Object.values(character.skills).flat().filter(s => {
            if (s.value <= 0) return false;
            if (s.mysticAbilityId === item.mysticAbilityId) return true;

            // Fallback to library check if not on instance
            if (rules?.libraries?.skills) {
                const libDef = rules.libraries.skills.find(ls => ls.name === s.name);
                return libDef?.mysticAbilityId === item.mysticAbilityId;
            }
            return false;
        })
        : [];

    return (
        <div
            className={`w-full flex gap-1 items-center h-[22px] pr-1 transition rounded-sm group select-none text-left outline-none ${isEmpty
                ? 'hover:bg-slate-50 border-b border-dotted border-stone-200'
                : (isPostCreationAdvantage || isImproved)
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-b border-emerald-200 shadow-sm'
                    : (isPostCreationDisadvantage)
                        ? 'bg-red-50 hover:bg-red-100 border-b border-red-200 shadow-sm'
                        : (isReduced)
                            ? 'bg-amber-50 hover:bg-amber-100 border-b border-amber-200 shadow-sm'
                            : 'hover:bg-blue-50 bg-white/50 border-b border-stone-300 shadow-sm'
                }`}
            role="listitem"
        >
            <button
                type="button"
                onClick={onClick}
                className="flex-grow flex items-center h-full min-w-0 outline-none focus:ring-1 focus:ring-blue-400 rounded-sm"
            >
                <span 
                    className={`w-8 shrink-0 text-center font-bold text-xs h-full flex items-center justify-center border-r border-stone-300 ${isEmpty ? 'text-stone-300' : 'text-stone-800 font-handwriting bg-white'
                    } ${isResolved ? 'line-through opacity-50' : ''}`} 
                    style={{ fontSize: '0.9rem' }}
                    role="presentation"
                >
                    {item.value || (isEmpty ? '-' : '')}
                </span>

                <span 
                    className={`flex-grow h-full flex items-center px-1 font-handwriting min-w-0 ${isEmpty ? 'text-stone-300 italic text-[10px]' : 'text-ink'
                    } ${isResolved ? 'line-through opacity-50' : ''}`} 
                    style={{ fontSize: isEmpty ? '0.7rem' : '0.9rem' }}
                    ref={anchorRef}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    role="presentation"
                >
                    <span className="truncate w-full block">
                        <span className="inline-flex items-center gap-1 mr-1.5 leading-none">
                            {isPostCreationAdvantage && <span title="Acquis avec XP"><Sparkles size={13} className="text-emerald-600 fill-emerald-600/20" strokeWidth={2.5} /></span>}
                            {isPostCreationDisadvantage && <span title="Nouveau Désavantage (Gain XP)"><Sparkles size={13} className="text-red-500 fill-red-500/20" strokeWidth={2.5} /></span>}
                            {isImproved && <span title="Amélioré avec XP"><ArrowUp size={13} className="text-blue-600" strokeWidth={3} /></span>}
                            {isReduced && <span title="Racheté avec XP"><ArrowDown size={13} className="text-orange-600" strokeWidth={3} /></span>}
                        </span>
                        {item.name || "Vide"}
                        {item.variant && <span className="font-bold ml-1 text-slate-600">: {item.variant}</span>}
                    </span>
                </span>
            </button>

            {!isEmpty && item.mysticAbilityId && onManageMystic && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onManageMystic(e);
                    }}
                    className="opacity-100 sm:opacity-0 group-hover:opacity-100 text-purple-400 hover:text-purple-600 transition shrink-0 p-0.5 hover:bg-purple-50 rounded outline-none focus:opacity-100"
                    title="Gérer les compétences mystiques"
                >
                    <Wand2 size={18} />
                </button>
            )}

            {!isEmpty && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(e);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition shrink-0 p-0.5 hover:bg-red-50 rounded outline-none focus:opacity-100"
                    title="Supprimer"
                >
                    <Trash2 size={18} />
                </button>
            )}
            <div className="opacity-0 group-hover:opacity-100 text-stone-400 transition-opacity shrink-0 p-0.5 mt-0.5">
                <Edit size={16} />
            </div>

            {!isEmpty && (item.description || mysticCapacity) && (
                <PortalTooltip
                    anchorRef={anchorRef}
                    isOpen={showTooltip}
                    maxWidth={320}
                >
                    <div className="space-y-2">
                        <div className="font-bold text-sm text-stone-200 border-b border-stone-600 pb-1 mb-1">
                            {item.name} {item.variant && <span className="text-stone-400 font-normal">: {item.variant}</span>}
                        </div>

                        {item.description && (
                            <div className="text-xs text-stone-300 whitespace-pre-wrap leading-relaxed italic">
                                "{item.description}"
                            </div>
                        )}

                        {item.customNotes && (
                            <div className="text-xs text-amber-200/80 leading-relaxed whitespace-pre-wrap p-2 bg-amber-900/20 rounded border border-amber-900/30">
                                <span className="text-[9px] uppercase font-bold text-amber-500/80 block mb-0.5">Note personnelle</span>
                                {item.customNotes}
                            </div>
                        )}

                        {mysticCapacity && (
                            <div className="mt-3 bg-purple-900/30 border border-purple-500/20 rounded-md p-2">
                                <div className="text-[10px] uppercase font-bold text-purple-300 mb-1 flex items-center gap-1">
                                    <Sparkles size={10} /> Capacités Mystiques
                                </div>
                                <div className="text-xs text-stone-300 mb-1 flex justify-between">
                                    <span>Compétences acquises :</span>
                                    <span className="font-bold text-white">
                                        {mysticCapacity.current} / {mysticCapacity.allowed === 999 ? '∞' : mysticCapacity.allowed}
                                    </span>
                                </div>

                                {ownedMysticSkills.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-purple-500/10">
                                        <div className="text-[9px] uppercase tracking-wider text-purple-300/60 font-bold mb-1.5 flex items-center gap-1.5">
                                            <div className="w-1 h-2 bg-purple-500 rounded-full"></div>
                                            Compétences liées
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {ownedMysticSkills.map(s => (
                                                <span
                                                    key={s.id}
                                                    className="text-[9px] px-2 py-0.5 bg-purple-400/10 text-purple-200 border border-purple-400/20 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-all hover:bg-purple-400/20 hover:border-purple-400/40 truncate max-w-[130px]"
                                                    title={s.variant ? `${s.name} (${s.variant})` : s.name}
                                                >
                                                    {s.name}{s.variant ? ` (${s.variant})` : ''}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {mysticCapacity.allowed !== 999 && mysticCapacity.current < mysticCapacity.allowed && (
                                    <div className="mt-2 text-[10px] text-amber-300/80 italic">
                                        Il vous reste {mysticCapacity.allowed - mysticCapacity.current} choix à faire.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </PortalTooltip>
            )}
        </div>
    );
};

export default TraitRow;
