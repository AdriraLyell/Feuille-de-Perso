
import React, { useState, useRef, useEffect } from 'react';
import { Search, Award, Plus, ArrowUpCircle } from 'lucide-react';
import { useCharacterData } from '../../context/CharacterContext';
import ConfirmationModal from '../ui/ConfirmationModal';
import { LibrarySpecializationEntry } from '../../types';
import { smartIncludes } from '../../utils/stringUtils';

interface SpecializationOmnibarProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (entry: LibrarySpecializationEntry) => void;
    onBlur?: (value: string) => void;
    onPromote?: (value: string) => void;
    placeholder?: string;
    className?: string;
    skillId?: string; // Si fourni, filtre les suggestions pour cette compétence
    variant?: 'default' | 'sheet';
    showPlaceholder?: boolean;
}

const SpecializationOmnibar: React.FC<SpecializationOmnibarProps> = ({
    value,
    onChange,
    onSelect,
    onBlur,
    onPromote,
    placeholder = "Saisir une spécialisation...",
    className = "",
    skillId,
    variant = 'default',
    showPlaceholder = true
}) => {
    const data = useCharacterData();
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const library = data.specializationLibrary || [];

    // Filtrer les suggestions
    const suggestions = library.filter((entry: LibrarySpecializationEntry) => {
        // Filtrage par texte
        const matchText = smartIncludes(entry.name, value);
        // Filtrage par compétence (optionnel)
        const matchSkill = !skillId || entry.skillIds.includes(skillId);

        return matchText && matchSkill && value.trim() !== "" && entry.name.toLowerCase() !== value.toLowerCase();
    }).slice(0, 5); // Limiter à 5 suggestions

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
            e.preventDefault();
            handleSelect(suggestions[highlightedIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleSelect = (entry: LibrarySpecializationEntry) => {
        onChange(entry.name);
        if (onSelect) onSelect(entry);
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative flex items-center group/omnibar">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsOpen(true);
                        setHighlightedIndex(-1);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => {
                        if (onBlur) onBlur(value);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={showPlaceholder ? placeholder : ""}
                    className={variant === 'sheet'
                        ? "w-full bg-transparent border-none text-[10px] h-4 px-1 focus:outline-none font-handwriting text-amber-900 placeholder-transparent"
                        : "w-full border border-[#bfae85]/50 bg-[#fefaf2] rounded-sm px-2 py-1 text-sm text-[#1c1917] font-bold focus:border-amber-600 outline-none transition-colors shadow-sm placeholder-[#bfae85]/60"
                    }
                />

                {variant === 'sheet' && value && onPromote && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowPromoteConfirm(true);
                        }}
                        className="opacity-0 group-hover/omnibar:opacity-100 transition-opacity p-0.5 text-amber-600 hover:text-amber-800"
                        title="Promouvoir en compétence secondaire"
                    >
                        <ArrowUpCircle size={12} />
                    </button>
                )}

                {suggestions.length > 0 && isOpen && (
                    <div className="absolute z-[100] left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
                        <div className="p-1 bg-amber-50 text-[10px] font-bold text-amber-700 border-b flex items-center gap-1 uppercase tracking-wider">
                            <Award size={10} /> Catalogue
                        </div>
                        {suggestions.map((entry, index) => (
                            <button
                                key={entry.id}
                                onClick={() => handleSelect(entry)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className={`w-full text-left px-3 py-2 text-sm flex flex-col gap-0.5 transition-colors ${index === highlightedIndex ? 'bg-amber-100' : 'hover:bg-gray-50'
                                    }`}
                            >
                                <span className="font-bold text-gray-800">{entry.name}</span>
                                {entry.description && (
                                    <span className="text-[10px] text-gray-400 truncate">{entry.description}</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de confirmation de promotion */}
            {showPromoteConfirm && (
                <ConfirmationModal
                    isOpen={showPromoteConfirm}
                    onClose={() => setShowPromoteConfirm(false)}
                    onConfirm={() => onPromote && onPromote(value)}
                    title="Promouvoir la Spécialisation"
                    message={
                        <span>
                            Souhaitez-vous promouvoir <strong>"{value}"</strong> en compétence secondaire ?
                            <br /><br />
                            <span className="text-[11px] opacity-80">
                                Cela créera une nouvelle compétence avec une valeur de 0 et libérera l'emplacement de spécialisation actuel.
                            </span>
                        </span>
                    }
                    confirmLabel="Promouvoir"
                    cancelLabel="Annuler"
                    type="warning"
                    scheme="paper"
                />
            )}
        </div>
    );
};

export default SpecializationOmnibar;
