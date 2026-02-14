import React from 'react';
import { TabType } from '../../hooks/useLibraryImport';
import { Zap, Book, Award, Users, Gauge } from 'lucide-react';

interface WizardTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export const WizardTabs: React.FC<WizardTabsProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="flex bg-slate-50 border-b border-slate-200">
            {[
                { id: 'traits', icon: Zap, label: 'Traits' },
                { id: 'skills', icon: Book, label: 'Compétences' },
                { id: 'specializations', icon: Award, label: 'Spéc.' },
                { id: 'backgrounds', icon: Users, label: 'Hist.' },
                { id: 'counters', icon: Gauge, label: 'Compteurs' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id as TabType)}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <tab.icon size={16} /> {tab.label}
                </button>
            ))}
        </div>
    );
};
