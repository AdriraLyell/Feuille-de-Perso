import React, { useState } from 'react';
import { DotEntry, DropPayload } from '../../types';
import { SectionHeader } from './Shared';
import { Info } from 'lucide-react';

import { logger } from '../../utils/logger';
import { DotRow } from './DotRow';


export const SkillBlock = React.memo<{
    title: string;
    items: DotEntry[];
    cat: string;
    onUpdate: (section: 'skills', category: string, id: string, value: number) => void;
    userSpecs?: Record<string, string[]>;
    imposedSpecs?: Record<string, { name: string, minLevel: number }[]>;
    theme?: { creationColor: string, xpColor: string, dotSymbol?: string, skillColors?: { variable?: string, mysticDefault?: string, mysticOverrides?: Record<string, string> } };
    onDefineVariant?: (category: string, id: string, name: string) => void;
    allowExtendedSkills?: boolean;
    description?: string;
    isEditing?: boolean;
    categoryBehavior?: 'Compétence' | 'Secondaire' | 'Arrière-plan' | 'Compteur';
    onDrop?: (category: string, payload: DropPayload, targetIndex: number) => void;
    onRemove?: (category: string, id: string) => void;
    validateIncrease?: (id: string, newValue: number) => { allowed: boolean; reason?: string };
    blockedSkills?: Record<string, { isBlocked: boolean, sourceName: string }>;
}>(({ title, items, cat, onUpdate, userSpecs = {}, imposedSpecs = {}, theme, onDefineVariant, allowExtendedSkills = false, description, isEditing = false, onDrop, onRemove, validateIncrease, blockedSkills = {} }) => {
    const [showDesc, setShowDesc] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [dropIndex, setDropIndex] = useState<number>(-1);



    const handleDragOver = (e: React.DragEvent) => {
        if (!isEditing) return;
        e.preventDefault();
        setIsDragOver(true);
        e.dataTransfer.dropEffect = 'copy';

        // Calculate drop index based on mouse position
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const rowHeight = 20; // h-5 is 20px
        const headerPadding = 24; // approx height of SectionHeader + padding
        const relativeY = y - headerPadding;

        // Items start after header padding
        let index = Math.round(relativeY / rowHeight);
        index = Math.max(0, Math.min(index, items.length));
        setDropIndex(index);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
        setDropIndex(-1);
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!isEditing) return;
        e.preventDefault();
        setIsDragOver(false);
        const finalDropIndex = dropIndex;
        setDropIndex(-1);
        try {
            const payload = JSON.parse(e.dataTransfer.getData('application/json'));
            onDrop?.(cat, payload, finalDropIndex);
        } catch (err) {
            logger.error('Failed to parse drop payload', err);
        }
    };

    return (
        <div
            className={`flex flex-col transition duration-200 ${isEditing ? 'relative' : ''} ${isDragOver ? 'bg-[#bfae85]/10 ring-2 ring-[#bfae85]/40 rounded-sm scale-[1.02] shadow-lg z-10' : ''} `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="relative group/header">
                <SectionHeader
                    title={
                        <div className="flex items-center gap-1.5 justify-center">
                            {title}
                            {description && (
                                <button
                                    onMouseEnter={() => setShowDesc(true)}
                                    onMouseLeave={() => setShowDesc(false)}
                                    className="ml-1 text-[#bfae85]/40 hover:text-[#8b2e2e] transition-colors"
                                >
                                    <Info size={10} />
                                </button>
                            )}
                        </div>
                    }
                />

                {showDesc && description && (
                    <div className="absolute z-[101] left-1/2 -translate-x-1/2 bottom-full mb-1 w-48 bg-stone-800 text-white text-[9px] p-2 rounded shadow-xl animate-in fade-in slide-in-from-bottom-1 duration-200 pointer-events-none text-center">
                        {description}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-stone-800"></div>
                    </div>
                )}
            </div>

            <div className="flex-grow py-1 relative">
                {/* Drop Indicator Logic */}
                {isEditing && isDragOver && dropIndex !== -1 && (
                    <div
                        className="absolute left-0 right-0 h-0.5 bg-[#bfae85] z-20 pointer-events-none"
                        style={{ top: `${(dropIndex * 20) + 4} px` }} // 4px padding in py-1? No, py-1 is 4px top/bottom.
                    >
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-[#bfae85] rotate-45"></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-[#bfae85] rotate-45"></div>
                    </div>
                )}

                {(items || []).map((item) => {
                    const iSpecs = imposedSpecs[item.id] || [];
                    const uSpecs = userSpecs[item.id] || [];
                    const normalizedName = item.name.trim().toLowerCase();
                    const blockedInfo = blockedSkills[normalizedName];

                    return (
                        <DotRow
                            key={item.id}
                            entry={item}
                            category={cat}
                            onUpdate={onUpdate}
                            specializations={uSpecs}
                            imposedSpecs={iSpecs}
                            theme={theme}
                            onDefineVariant={onDefineVariant}
                            allowExtendedSkills={allowExtendedSkills}
                            isEditing={isEditing}
                            onRemove={onRemove}
                            validateIncrease={validateIncrease}
                            blockedReason={blockedInfo?.sourceName}
                        />
                    );
                })}

                {items.length === 0 && isEditing && (
                    <div className="h-20 flex items-center justify-center border border-dashed border-[#bfae85]/30 rounded text-[10px] text-[#bfae85]/50 italic">
                        Glissez ici
                    </div>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    if (prevProps.title !== nextProps.title) return false;
    if (prevProps.cat !== nextProps.cat) return false;
    if (prevProps.allowExtendedSkills !== nextProps.allowExtendedSkills) return false;
    if (prevProps.isEditing !== nextProps.isEditing) return false;
    if (prevProps.categoryBehavior !== nextProps.categoryBehavior) return false;
    if (prevProps.description !== nextProps.description) return false;

    const pItems = prevProps.items || [];
    const nItems = nextProps.items || [];
    if (pItems.length !== nItems.length) return false;

    for (let i = 0; i < pItems.length; i++) {
        const p = pItems[i];
        const n = nItems[i];
        if (
            p.id !== n.id ||
            p.value !== n.value ||
            p.name !== n.name ||
            p.variant !== n.variant ||
            p.isVariable !== n.isVariable ||
            p.mysticAbilityId !== n.mysticAbilityId ||
            p.creationValue !== n.creationValue ||
            p.max !== n.max
        ) {
            return false;
        }

        const itemId = p.id;
        const pUs = prevProps.userSpecs?.[itemId];
        const nUs = nextProps.userSpecs?.[itemId];
        if (pUs !== nUs && JSON.stringify(pUs) !== JSON.stringify(nUs)) return false;

        const pIs = prevProps.imposedSpecs?.[itemId];
        const nIs = nextProps.imposedSpecs?.[itemId];
        if (pIs !== nIs && JSON.stringify(pIs) !== JSON.stringify(nIs)) return false;

        if (p.name) {
            const normalized = p.name.trim().toLowerCase();
            const pBs = prevProps.blockedSkills?.[normalized];
            const nBs = nextProps.blockedSkills?.[normalized];
            if (pBs?.isBlocked !== nBs?.isBlocked || pBs?.sourceName !== nBs?.sourceName) {
                return false;
            }
        }
    }

    if (prevProps.theme !== nextProps.theme && JSON.stringify(prevProps.theme) !== JSON.stringify(nextProps.theme)) {
        return false;
    }

    return true;
});
