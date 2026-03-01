import React, { useState } from 'react';
import { Book, Users, PenTool } from 'lucide-react';
import { useCharacter } from '../context/CharacterContext';
import PartyTable from './campaign/PartyTable';
import { ColumnarEditor } from './campaign/book/ColumnarEditor';

const CampaignNotes: React.FC = () => {
    const { data, updateData: onChange, addLog } = useCharacter();
    const [activeTab, setActiveTab] = useState<'journal' | 'party'>('journal');

    const handleUpdate = React.useCallback((content: any) => {
        onChange((prev: import('../types').CharacterSheetData) => {
            const now = new Date().toISOString();
            const existing = prev.bookDocument || {
                id: Math.random().toString(36).substr(2, 9),
                createdAt: now,
                formatVersion: 2,
                content: {},
                updatedAt: now
            };

            return {
                ...prev,
                bookDocument: {
                    ...existing,
                    content,
                    formatVersion: 2,
                    updatedAt: new Date().toISOString()
                }
            };
        });
    }, [onChange]);

    return (
        <div className="w-full bg-[#121212] relative">
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Background Texture (Deep Wood) - Exactly 100px margin around the book (1484 + 200 = 1684) */}
            <div className="absolute inset-y-0 left-0 min-w-[1684px] w-full opacity-15 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
            <div className="absolute inset-y-0 left-0 min-w-[1684px] w-full opacity-5 pointer-events-none bg-orange-900/10 mix-blend-multiply"></div>

            <div className="relative z-10 flex flex-col items-center w-full min-w-[1684px]">
                {/* Unified Toolbar */}
                <div className="w-full max-w-7xl px-8 py-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-sm">
                    <div className="flex items-center gap-8">
                        {[
                            { id: 'journal', icon: Book, label: 'Journal de Campagne' },
                            { id: 'party', icon: Users, label: 'Membres du Groupe' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`group flex items-center gap-3 transition-all ${activeTab === tab.id ? 'text-stone-100' : 'text-stone-500 hover:text-stone-300'}`}
                            >
                                <tab.icon size={20} className={activeTab === tab.id ? 'text-amber-500' : ''} />
                                <span className={`text-sm font-bold uppercase tracking-widest font-serif leading-none hidden sm:inline`}>{tab.label}</span>
                                {activeTab === tab.id && <div className="h-1 w-full bg-amber-500 absolute -bottom-6 left-0" />}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 text-stone-400 font-serif italic text-xs">
                        <PenTool size={14} className="text-amber-600/50" />
                        Édition du Grimoire
                    </div>
                </div>

                {/* Content Area - Exactly 50px top margin and 100px bottom margin */}
                <div className="w-full pt-[50px] pb-[100px]">
                    <div className={activeTab === 'journal' ? 'block' : 'hidden'}>
                        <ColumnarEditor
                            initialContent={data.bookDocument?.content}
                            onUpdate={handleUpdate}
                        />
                    </div>
                    <div className={activeTab === 'party' ? 'block' : 'hidden'}>
                        <div
                            className="mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
                            style={{ width: '1484px', height: '1000px' }}
                        >
                            <div className="bg-[#fbf4e9] rounded-lg shadow-2xl overflow-hidden border border-stone-300/50 h-full">
                                <PartyTable data={data} onChange={onChange} onAddLog={addLog} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignNotes;
