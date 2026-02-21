import React from 'react';

interface BookPageIndicatorProps {
    currentSpread: number;
    totalSpreads: number;
    onNavigate: (spreadIndex: number) => void;
}

export const BookPageIndicator: React.FC<BookPageIndicatorProps> = ({
    currentSpread,
    totalSpreads,
    onNavigate,
}) => {
    if (totalSpreads <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-3 py-3 select-none animate-in fade-in duration-500">
            {/* Dot navigation */}
            <div className="flex items-center gap-1.5">
                {Array.from({ length: totalSpreads }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => onNavigate(i)}
                        className={`rounded-full transition-all duration-300 ${i === currentSpread
                                ? 'w-2.5 h-2.5 bg-amber-500 shadow-lg shadow-amber-500/30'
                                : 'w-1.5 h-1.5 bg-stone-600 hover:bg-stone-400 hover:scale-125'
                            }`}
                        title={`Pages ${i * 2 + 1}–${i * 2 + 2}`}
                    />
                ))}
            </div>

            {/* Page counter */}
            <span className="text-stone-500 text-[10px] font-serif italic ml-2 tabular-nums">
                {currentSpread * 2 + 1}–{Math.min(currentSpread * 2 + 2, totalSpreads * 2)} / {totalSpreads * 2}
            </span>
        </div>
    );
};
