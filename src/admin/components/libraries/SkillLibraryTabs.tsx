import React from 'react';

interface SkillLibraryTabsProps {
    activeTab: 'skills' | 'backgrounds' | 'counters';
    setActiveTab: (tab: 'skills' | 'backgrounds' | 'counters') => void;
}

export const SkillLibraryTabs: React.FC<SkillLibraryTabsProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="flex text-[10px] font-bold text-stone-500 uppercase tracking-wide">
            <button
                onClick={() => setActiveTab('skills')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeTab === 'skills' ? 'border-amber-500 text-amber-500 bg-stone-950' : 'border-transparent hover:bg-stone-800/50 hover:text-stone-300'}`}
            >
                Compétences
            </button>
            <button
                onClick={() => setActiveTab('backgrounds')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeTab === 'backgrounds' ? 'border-amber-500 text-amber-500 bg-stone-950' : 'border-transparent hover:bg-stone-800/50 hover:text-stone-300'}`}
            >
                Arr. Plans
            </button>
            <button
                onClick={() => setActiveTab('counters')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeTab === 'counters' ? 'border-amber-500 text-amber-500 bg-stone-950' : 'border-transparent hover:bg-stone-800/50 hover:text-stone-300'}`}
            >
                Compteurs
            </button>
        </div>
    );
};
