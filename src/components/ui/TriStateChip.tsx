import React from 'react';
import { LucideIcon, X } from 'lucide-react';

interface TriStateChipProps {
    label: string;
    value: boolean | null;
    onChange: (newValue: boolean | null) => void;
    icon?: LucideIcon;
    activeColor?: 'blue' | 'purple' | 'amber' | 'green' | 'indigo' | 'slate';
}

/**
 * A "Smart Chip" component that toggles between three states:
 * - null (Neutral): No filter applied
 * - true (Active): Only items matching this criteria
 * - false (Inactive): Exclude items matching this criteria
 */
const TriStateChip: React.FC<TriStateChipProps> = ({
    label,
    value,
    onChange,
    icon: Icon,
    activeColor = 'blue'
}) => {
    const handleClick = () => {
        // Cycle: Neutral (null) -> Positive (true) -> Negative (false) -> Neutral (null)
        if (value === null) onChange(true);
        else if (value === true) onChange(false);
        else onChange(null);
    };

    const colors = {
        blue: {
            active: 'bg-blue-600 text-white border-blue-600 shadow-sm',
            inactive: 'bg-red-50 text-red-700 border-red-200 line-through opacity-80',
            neutral: 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        },
        purple: {
            active: 'bg-purple-600 text-white border-purple-600 shadow-sm',
            inactive: 'bg-red-50 text-red-700 border-red-200 line-through opacity-80',
            neutral: 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        },
        amber: {
            active: 'bg-amber-500 text-white border-amber-500 shadow-sm',
            inactive: 'bg-red-50 text-red-700 border-red-200 line-through opacity-80',
            neutral: 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        },
        green: {
            active: 'bg-green-600 text-white border-green-600 shadow-sm',
            inactive: 'bg-red-50 text-red-700 border-red-200 line-through opacity-80',
            neutral: 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        },
        indigo: {
            active: 'bg-indigo-600 text-white border-indigo-600 shadow-sm',
            inactive: 'bg-red-50 text-red-700 border-red-200 line-through opacity-80',
            neutral: 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        },
        slate: {
            active: 'bg-slate-700 text-white border-slate-700 shadow-sm',
            inactive: 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70',
            neutral: 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        }
    };

    // Fix for indigo inactive color (was a typo in my thought above)
    const activeColorConfig = colors[activeColor] || colors.blue;
    const inactiveStyle = activeColor === 'slate' ? colors.slate.inactive : 'bg-red-50 text-red-700 border-red-200 line-through opacity-80';

    const currentStyle = value === null
        ? activeColorConfig.neutral
        : value === true
            ? activeColorConfig.active
            : inactiveStyle;

    return (
        <button
            onClick={handleClick}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold transition-all select-none ${currentStyle}`}
            title={`${label}: ${value === null ? 'Tout' : value === true ? 'Inclure' : 'Exclure'}`}
        >
            {Icon && value !== false && <Icon size={12} className={value === true ? 'text-white' : ''} />}
            {value === false && <X size={10} className="text-red-500" />}
            {label}
            {value !== null && (
                <span className="ml-1 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); onChange(null); }}>
                    <X size={10} />
                </span>
            )}
        </button>
    );
};

export default TriStateChip;
