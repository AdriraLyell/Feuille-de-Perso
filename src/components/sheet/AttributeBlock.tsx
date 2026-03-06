
import React, { useRef } from 'react';
import { AttributeEntry, BonusInfo } from '../../types';
import { SectionHeader } from './Shared';

const AttributeRow: React.FC<{
    entry: AttributeEntry,
    category: string,
    onUpdate: (category: string, id: string, field: 'val1' | 'val2' | 'val3', value: string) => void;
    bonus?: BonusInfo;
    isCreationMode?: boolean;
}> = ({ entry, category, onUpdate, bonus, isCreationMode }) => {
    const ref1 = useRef<HTMLInputElement>(null);
    const ref2 = useRef<HTMLInputElement>(null);
    const ref3 = useRef<HTMLInputElement>(null);
    const [isHovered, setIsHovered] = React.useState(false);

    const bonusValue = bonus?.value || 0;

    // Parse strings safely for total calculation
    const v1 = parseInt(entry.val1) || 0;
    const v2 = parseInt(entry.val2) || 0;
    const v3 = parseInt(entry.val3) || 0;

    const baseTotal = v1 + v2 + v3;
    const total = baseTotal + bonusValue;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextRef?: React.RefObject<HTMLInputElement | null>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextRef && nextRef.current) {
                nextRef.current.focus();
            } else {
                e.currentTarget.blur();
            }
        }
    };

    // Construct tooltip text
    let tooltip = `Total : ${total}`;
    if (bonusValue !== 0 && bonus) {
        tooltip = `Base : ${baseTotal}\nModificateurs : ${bonusValue > 0 ? '+' : ''}${bonusValue}\n\nSources :\n${bonus.sources.map(s => `- ${s}`).join('\n')}`;
    }

    return (
        <div 
            className="flex items-center px-2 border-b border-dotted border-stone-300 h-[22px] text-xs hover:bg-stone-50 transition-colors relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="listitem"
            aria-label={`Score de ${entry.name}`}
        >
            <span className="w-24 truncate font-semibold text-stone-700 flex items-center gap-1">
                {entry.name}
                {entry.customNotes && <div className="w-1 h-1 rounded-full bg-amber-500/50" />}
            </span>

            {/* Note personnelle flottante */}
            {entry.customNotes && isHovered && (
                <div className="absolute left-0 bottom-full mb-1 z-[100] w-48 p-2 bg-stone-800 text-amber-200 text-[10px] rounded shadow-xl border border-amber-900/30">
                    <span className="text-[8px] font-black text-amber-500 uppercase block mb-1">Note personnelle</span>
                    {entry.customNotes}
                </div>
            )}

            <div className="flex items-center gap-1 flex-grow justify-end">
                <input
                    ref={ref1}
                    id={`attr-${category}-${entry.id}-val1`}
                    name={`attr-${category}-${entry.id}-val1`}
                    className={`w-6 h-5 text-center border-b border-stone-300 focus:border-blue-500 outline-none bg-transparent font-handwriting text-ink text-sm hover:bg-white/50 no-spinner ${!isCreationMode ? 'opacity-70 cursor-not-allowed border-stone-200' : ''}`}
                    value={entry.val1}
                    onChange={(e) => isCreationMode && onUpdate(category, entry.id, 'val1', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, ref2)}
                    onFocus={(e) => isCreationMode && e.target.select()}
                    placeholder=""
                    type="text"
                    inputMode="numeric"
                    disabled={!isCreationMode}
                />
                <span className="text-stone-400 font-handwriting">+</span>
                <input
                    ref={ref2}
                    id={`attr-${category}-${entry.id}-val2`}
                    name={`attr-${category}-${entry.id}-val2`}
                    className="w-6 h-5 text-center border-b border-stone-300 focus:border-blue-500 outline-none bg-transparent font-handwriting text-ink text-sm hover:bg-white/50 no-spinner"
                    value={entry.val2}
                    onChange={(e) => onUpdate(category, entry.id, 'val2', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, ref3)}
                    onFocus={(e) => e.target.select()}
                    placeholder=""
                    type="text"
                    inputMode="numeric"
                />
                <span className="text-stone-400 font-handwriting">+</span>
                <input
                    ref={ref3}
                    id={`attr-${category}-${entry.id}-val3`}
                    name={`attr-${category}-${entry.id}-val3`}
                    className="w-6 h-5 text-center border-b border-stone-300 focus:border-blue-500 outline-none bg-transparent font-handwriting text-ink text-sm hover:bg-white/50 no-spinner"
                    value={entry.val3}
                    onChange={(e) => onUpdate(category, entry.id, 'val3', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e)}
                    onFocus={(e) => e.target.select()}
                    placeholder=""
                    type="text"
                    inputMode="numeric"
                />

                <span className="text-stone-400 font-handwriting">=</span>
                <div
                    className={`w-7 h-5 flex items-center justify-center font-bold rounded border shadow-sm ml-1 font-handwriting text-sm cursor-help transition-colors ${bonusValue > 0 ? 'bg-green-100 text-green-900 border-green-300' :
                        bonusValue < 0 ? 'bg-red-100 text-red-900 border-red-300' :
                            'bg-blue-50 text-blue-900 border-blue-100'
                        }`}
                    title={tooltip}
                >
                    {total}
                </div>
            </div>
        </div>
    );
};

export const AttributeBlock = React.memo<{
    title: string;
    items: AttributeEntry[];
    cat: string;
    onUpdate: (category: string, id: string, field: 'val1' | 'val2' | 'val3', value: string) => void;
    bonuses: Record<string, BonusInfo>;
    secondaryItems?: AttributeEntry[];
    isCreationMode?: boolean;
}>(({ title, items, cat, onUpdate, bonuses, secondaryItems, isCreationMode }) => {
    return (
        <div className="flex flex-col border-r last:border-r-0 border-stone-400 h-full">
            <SectionHeader title={title} />
            <div className="flex-grow p-0">
                {(items || []).map(item => (
                    <AttributeRow
                        key={item.id}
                        entry={item}
                        category={cat}
                        onUpdate={onUpdate}
                        bonus={bonuses[item.name.trim().toLowerCase()]}
                        isCreationMode={isCreationMode}
                    />
                ))}

                {secondaryItems && secondaryItems.length > 0 && (
                    <>
                        {/* Visual Demarcation */}
                        <div className="h-px bg-stone-300 border-t border-dotted border-stone-400 mx-1 my-0.5"></div>
                        {secondaryItems.map(item => (
                            <AttributeRow
                                key={item.id}
                                entry={item}
                                category={cat}
                                onUpdate={onUpdate}
                                bonus={bonuses[item.name.trim().toLowerCase()]}
                                isCreationMode={isCreationMode}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    if (prevProps.title !== nextProps.title) return false;
    if (prevProps.cat !== nextProps.cat) return false;
    if (prevProps.isCreationMode !== nextProps.isCreationMode) return false;

    const checkItemsEquality = (pItems?: AttributeEntry[], nItems?: AttributeEntry[]) => {
        if (!pItems && !nItems) return true;
        if (!pItems || !nItems) return false;
        if (pItems.length !== nItems.length) return false;

        for (let i = 0; i < pItems.length; i++) {
            const p = pItems[i];
            const n = nItems[i];

            if (
                p.id !== n.id ||
                p.val1 !== n.val1 ||
                p.val2 !== n.val2 ||
                p.val3 !== n.val3 ||
                p.name !== n.name ||
                p.creationVal1 !== n.creationVal1 ||
                p.creationVal2 !== n.creationVal2 ||
                p.creationVal3 !== n.creationVal3
            ) {
                return false;
            }

            if (p.name) {
                const normName = p.name.trim().toLowerCase();
                const pBonus = prevProps.bonuses?.[normName];
                const nBonus = nextProps.bonuses?.[normName];

                if (pBonus?.value !== nBonus?.value) return false;

                if (pBonus?.sources && nBonus?.sources) {
                    if (pBonus.sources.length !== nBonus.sources.length) return false;
                    for (let j = 0; j < pBonus.sources.length; j++) {
                        if (pBonus.sources[j] !== nBonus.sources[j]) return false;
                    }
                } else if (pBonus?.sources || nBonus?.sources) {
                    return false;
                }
            }
        }
        return true;
    };

    if (!checkItemsEquality(prevProps.items, nextProps.items)) return false;
    if (!checkItemsEquality(prevProps.secondaryItems, nextProps.secondaryItems)) return false;

    return true;
});
