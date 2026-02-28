import React, { useState, useRef, useEffect } from 'react';

interface TargetSearchDropdownProps {
    value: string;
    onUpdate: (val: string) => void;
    suggestions: { value: string, label: string, type: string }[];
    placeholder?: string;
}

export const TargetSearchDropdown: React.FC<TargetSearchDropdownProps> = ({
    value,
    onUpdate,
    suggestions,
    placeholder
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredSuggestions = suggestions.filter(s =>
        !value ||
        s.value.toLowerCase().includes(value.toLowerCase()) ||
        s.type.toLowerCase().includes(value.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <input
                type="text"
                value={value || ''}
                autoComplete="off"
                onFocus={() => setIsOpen(true)}
                onChange={e => {
                    onUpdate(e.target.value);
                    setIsOpen(true);
                }}
                className={`w-full p-2 bg-stone-950 border text-stone-300 rounded focus:border-amber-500 outline-none ${!value ? 'border-dashed border-stone-700' : 'border-stone-700'}`}
                placeholder={placeholder || "Cible libre (ex: Force)"}
            />

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-stone-900 border border-amber-500/30 rounded shadow-2xl max-h-96 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                    {filteredSuggestions.map((s, idx) => (
                        <button
                            key={`${s.value}-${idx}`}
                            onClick={() => {
                                onUpdate(s.value);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-amber-500/10 border-b border-stone-800/50 last:border-0 group flex justify-between items-center transition-colors"
                        >
                            <span className="font-bold text-stone-300 group-hover:text-amber-500">{s.value}</span>
                            <span className="text-[9px] uppercase font-bold text-stone-600 px-1.5 py-0.5 bg-stone-950 rounded border border-stone-800">{s.type}</span>
                        </button>
                    ))}
                    {filteredSuggestions.length === 0 && (
                        <div className="p-3 text-xs text-stone-600 italic text-center">
                            Aucune suggestion correspondante
                        </div>
                    )}
                </div>
            )}
            {!value && (
                <div className="absolute right-2 top-2 text-[8px] text-amber-500/50 font-bold uppercase pointer-events-none">
                    Optionnel
                </div>
            )}
        </div>
    );
};
