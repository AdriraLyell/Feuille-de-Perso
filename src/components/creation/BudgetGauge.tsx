import React from 'react';

interface BudgetGaugeProps {
    label: string;
    current: number;
    max: number;
    formatNumber: (num: number) => string;
}

export const BudgetGauge: React.FC<BudgetGaugeProps> = ({ label, current, max, formatNumber }) => {
    const isOver = current > max;
    const isFull = current === max;

    const percentage = Math.min(100, Math.max(0, (current / max) * 100));

    let barColor = 'bg-blue-500';
    let valueColor = 'text-white';
    let cardBorder = 'border-stone-600';

    if (isOver) {
        barColor = 'bg-red-500';
        valueColor = 'text-red-400';
        cardBorder = 'border-red-500/50';
    } else if (isFull) {
        barColor = 'bg-green-500';
        valueColor = 'text-green-400';
        cardBorder = 'border-green-500/50';
    }

    return (
        <div className={`flex flex-col bg-stone-800 rounded-lg border ${cardBorder} p-4 min-w-[180px] shadow-lg relative overflow-hidden group transition hover:-translate-y-1`}>
            <div className="flex justify-between items-end mb-3 relative z-10">
                <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider font-serif">{label}</span>
                <span className={`font-mono font-bold text-lg leading-none ${valueColor}`}>
                    {formatNumber(current)}<span className="text-stone-500 text-xs">/{max}</span>
                </span>
            </div>
            <div className="h-2 w-full bg-stone-900 rounded-full overflow-hidden relative z-10">
                <div
                    className={`h-full rounded-full transition duration-500 ${barColor}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            {/* Background Glow */}
            {isOver && <div className="absolute inset-0 bg-red-900/20 z-0 animate-pulse"></div>}
        </div>
    );
};
