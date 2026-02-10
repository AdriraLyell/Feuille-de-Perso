import React, { useState, useMemo } from 'react';
import { useCharacterData, useCharacterActions } from '../../context/CharacterContext';
import { useRules } from '../../context/RulesContext';
import {
    BookOpen,
    GripVertical,
    Plus,
    Search,
    X,
    Target,
    Sparkles
} from 'lucide-react';
import { LibrarySkillEntry } from '../../types';

interface EditionSidebarProps {
    onClose: () => void;
}

const EditionSidebar: React.FC<EditionSidebarProps> = ({ onClose }) => {
    const { rules } = useRules();
    const data = useCharacterData();
    const { updateData: _updateData } = useCharacterActions();

    const [activeTab, setActiveTab] = useState<'skills' | 'backgrounds'>('skills');
    const [searchTerm, setSearchTerm] = useState('');
    const [customName, setCustomName] = useState('');

    // Get all currently placed items (skills and backgrounds)
    const currentItemNames = useMemo(() => {
        const names = new Set<string>();
        Object.values(data.skills).forEach(categorySkills => {
            categorySkills.forEach(skill => {
                if (skill.name) names.add(skill.name.trim().toLowerCase());
            });
        });
        return names;
    }, [data.skills]);

    // Filter available items from libraries
    const availableItems = useMemo(() => {
        const library = activeTab === 'skills' ? (rules?.libraries?.skills || []) : (rules?.libraries?.backgrounds || []);
        return library.filter(item => {
            if (item.isActive === false) return false;

            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const isAlreadyOnSheet = !item.isVariable && currentItemNames.has(item.name.trim().toLowerCase());

            return matchesSearch && !isAlreadyOnSheet;
        });
    }, [activeTab, rules?.libraries?.skills, rules?.libraries?.backgrounds, searchTerm, currentItemNames]); // Updated dependency array

    const handleDragStart = (e: React.DragEvent, item: LibrarySkillEntry) => {
        const payload = {
            type: 'lib_skill',
            data: item,
            origin: 'sidebar'
        };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-md border-l border-[#bfae85]/30 shadow-2xl z-[1000] flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-[#bfae85]/20 flex items-center justify-between bg-slate-800/50">
                <div className="flex items-center gap-2 text-[#bfae85]">
                    <BookOpen size={20} />
                    <h2 className="font-bold uppercase tracking-wider text-sm">Édition Directe</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#bfae85]/10">
                <button
                    onClick={() => setActiveTab('skills')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'skills'
                        ? 'text-[#bfae85] border-b-2 border-[#bfae85] bg-[#bfae85]/5'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    Compétences
                </button>
                <button
                    onClick={() => setActiveTab('backgrounds')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'backgrounds'
                        ? 'text-[#bfae85] border-b-2 border-[#bfae85] bg-[#bfae85]/5'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    Historiques
                </button>
            </div>

            {/* Search & Custom */}
            <div className="p-3 space-y-3 bg-slate-800/30">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-md py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#bfae85]/50 transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder={activeTab === 'skills' ? "Nouvelle compétence..." : "Nouvel historique..."}
                        className="flex-1 bg-slate-950/50 border border-slate-700 rounded-md py-2 px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-green-500/50 transition-colors"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                    />
                    <div
                        draggable={!!customName.trim()}
                        onDragStart={(e) => {
                            if (!customName.trim()) return;
                            const item: LibrarySkillEntry = {
                                id: `custom-${Date.now()}`,
                                name: customName.trim(),
                                description: 'Élément personnalisé',
                                isGlobal: false,
                                isActive: true
                            };
                            const payload = {
                                type: 'custom_lib_item',
                                data: item,
                                categoryType: activeTab === 'skills' ? 'skill' : 'background'
                            };
                            e.dataTransfer.setData('application/json', JSON.stringify(payload));
                        }}
                        title={customName.trim() ? "Glissez pour ajouter" : "Entrez un nom"}
                        className={`p-2 rounded-md flex items-center justify-center transition-all ${customName.trim()
                            ? 'bg-green-600/20 text-green-400 border border-green-500/30 cursor-grab active:cursor-grabbing hover:bg-green-600/30'
                            : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                            }`}
                    >
                        <Plus size={18} />
                    </div>
                    <div
                        draggable
                        onDragStart={(e) => {
                            const payload = {
                                type: 'spacer',
                                data: { name: '', id: `spacer-${Date.now()}` },
                                categoryType: activeTab === 'skills' ? 'skill' : 'background'
                            };
                            e.dataTransfer.setData('application/json', JSON.stringify(payload));
                        }}
                        title="Glissez un espaceur vide"
                        className="p-2 rounded-md flex items-center justify-center transition-all bg-slate-700 text-slate-300 border border-slate-600 cursor-grab active:cursor-grabbing hover:bg-slate-600 hover:text-white"
                    >
                        <X size={18} className="rotate-45" />
                    </div>
                </div>
                {customName.trim() && (
                    <p className="text-[10px] text-green-500/70 italic animate-pulse px-1">
                        Glissez le bouton [+] vers une case vide
                    </p>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {availableItems.length === 0 ? (
                    <div className="text-center py-10">
                        <Target size={32} className="mx-auto text-slate-700 mb-2 opacity-50" />
                        <p className="text-sm text-slate-500 italic">Aucun résultat</p>
                    </div>
                ) : (
                    availableItems.map((item) => (
                        <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                            className="group bg-slate-800/40 border border-slate-700/50 rounded-md p-3 cursor-grab active:cursor-grabbing hover:border-[#bfae85]/40 hover:bg-slate-800/80 transition-all flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <GripVertical size={14} className="text-slate-600 shrink-0 group-hover:text-[#bfae85]/60 transition-colors" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                                        {item.name}
                                    </span>
                                    {item.isVariable && (
                                        <span className="text-[10px] text-[#bfae85]/70 flex items-center gap-1">
                                            <Sparkles size={10} /> Variable
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Plus size={14} className="text-slate-600 group-hover:text-[#bfae85] opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                    ))
                )}
            </div>

            {/* Footer Info */}
            <div className="p-3 bg-slate-800/50 border-t border-[#bfae85]/10 text-[10px] text-slate-500 leading-relaxed italic">
                Faites glisser les éléments vers les zones en surbrillance sur votre fiche.
            </div>
        </div>
    );
};

export default EditionSidebar;
