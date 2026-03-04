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
    isDraggable?: boolean;
}>(({ title, items, cat, onUpdate, userSpecs = {}, imposedSpecs = {}, theme, onDefineVariant, allowExtendedSkills = false, description, isEditing = false, onDrop, onRemove, validateIncrease, blockedSkills = {}, isDraggable = false }) => {
    const [showDesc, setShowDesc] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [dropIndex, setDropIndex] = useState<number>(-1);



    const handleDragOver = (e: React.DragEvent) => {
        if (!isEditing) return;
        e.preventDefault();
        setIsDragOver(true);
        e.dataTransfer.dropEffect = 'copy';

        // Calculate drop index based on mouse position relative to potential drop targets (the rows)
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const y = e.clientY - rect.top;

        // Find the index by looking at all rows child positions
        const rows = Array.from(container.querySelectorAll('.dot-row-container'));
        let foundIndex = items.length;

        for (let i = 0; i < rows.length; i++) {
            const rowRect = rows[i].getBoundingClientRect();
            const rowMid = rowRect.top + rowRect.height / 2 - rect.top;
            if (y < rowMid) {
                foundIndex = i;
                break;
            }
        }

        if (foundIndex !== dropIndex) {
            setDropIndex(foundIndex);
        }
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
            className={`flex flex-col h-full transition-all duration-200 ${isEditing ? 'relative' : ''} ${isDragOver ? 'bg-amber-50/30 ring-2 ring-amber-500/30 rounded-sm z-10' : ''} `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={`relative group/header ${isDraggable ? 'cursor-move skill-block-header active:scale-[0.98]' : ''}`}>
                <SectionHeader
                    title={
                        <div className="flex items-center gap-1.5 justify-center">
                            {title}
                            {description && (
                                <button
                                    onMouseEnter={() => setShowDesc(true)}
                                    onMouseLeave={() => setShowDesc(false)}
                                    className="ml-1 text-slate-600 hover:text-[#8b2e2e] transition-colors"
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

            <div className="flex-grow min-h-0 py-1 relative overflow-y-auto skill-block-scroll">
                {/* Drop Indicator Logic */}
                {isEditing && isDragOver && dropIndex !== -1 && (
                    <div
                        className="absolute left-0 right-0 h-0.5 bg-amber-500 z-20 pointer-events-none transition-all duration-150"
                        style={{
                            top: dropIndex < items.length
                                ? `${(dropIndex * 20) + 4}px`
                                : `${(items.length * 20) + 4}px`
                        }}
                    >
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 w-2.5 h-2.5 bg-amber-500 rotate-45 rounded-sm"></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 w-2.5 h-2.5 bg-amber-500 rotate-45 rounded-sm"></div>
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
                            isDraggable={isDraggable}
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
    if (prevProps.isDraggable !== nextProps.isDraggable) return false;
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
