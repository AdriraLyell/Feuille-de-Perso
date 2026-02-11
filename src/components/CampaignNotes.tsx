import React, { useState } from 'react';
import { Book, Plus, Trash2, ChevronLeft, ChevronRight, Bookmark, Users, PenTool } from 'lucide-react';
import { useCharacter } from '../context/CharacterContext';
import PartyTable from './campaign/PartyTable';
import JournalPage from './campaign/JournalPage';
import TableOfContents from './campaign/TableOfContents';
import {
    JOURNAL_PAGE_WIDTH_LANDSCAPE,
    JOURNAL_PAGE_HEIGHT_LANDSCAPE,
    JOURNAL_PAGE_WIDTH_PORTRAIT,
    JOURNAL_PAGE_HEIGHT_PORTRAIT,
} from './campaign/constants';
import { useJournal } from '../hooks/useJournal';
import { useJournalImages } from '../hooks/useJournalImages';

interface Props {
    isLandscape?: boolean;
}

const CampaignNotes: React.FC<Props> = ({ isLandscape: _ignored = false }) => {
    const isLandscape = true;
    const { data, updateData: onChange, addLog: onAddLog } = useCharacter();
    const [activeTab, setActiveTab] = useState<'journal' | 'party'>('journal');

    const {
        currentPage,
        noteIdToDelete,
        setNoteIdToDelete,
        scrollContainerRef,
        handleScroll,
        addNote,
        updateNote,
        insertPageAfter,
        confirmDeleteNote,
        handleOverflow,
        goToPrevious,
        goToNext,
        jumpToPage,
        registerNoteRef,
        forceReflow
    } = useJournal(data, onChange, onAddLog);

    const {
        isDrawingImage,
        handleDrawComplete,
        handleImageUpload,
        handleUpdateImageConfig,
        handleRemoveImage,
        fileInputRef
    } = useJournalImages(data, onChange, onAddLog);

    const noteToDelete = (data.campaignNotes || []).find(n => n.id === noteIdToDelete);

    return (
        <div className={`w-full flex items-center justify-center bg-stone-900 py-8 px-4 md:px-12 relative overflow-auto transition-all duration-300 ${isLandscape ? 'min-h-[1200px]' : 'min-h-[1400px]'}`}>
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>

            <div className="flex items-center gap-3 shrink-0 z-10">
                <div className="w-12 flex justify-end">
                    {activeTab === 'journal' && (
                        <button
                            onClick={goToPrevious}
                            disabled={currentPage === 0}
                            className={`p-3 rounded-full bg-stone-800 text-stone-200 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-stone-600 hover:bg-stone-700 hover:scale-110 hover:text-white transition-all duration-300 ${currentPage === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                            title="Page précédente"
                        >
                            <ChevronLeft size={28} strokeWidth={3} />
                        </button>
                    )}
                </div>

                <div className={`relative shadow-2xl transition-all duration-500 flex flex-col overflow-hidden z-10 shrink-0
              rounded-r-md rounded-l-sm border-r-[10px] border-r-stone-300 border-l-[10px] border-l-stone-950
              bg-[#fdfbf7]
          `}
                    style={{
                        width: isLandscape ? `${JOURNAL_PAGE_WIDTH_LANDSCAPE * 2 + 60}px` : `${JOURNAL_PAGE_WIDTH_PORTRAIT + 40}px`,
                        height: isLandscape ? `${JOURNAL_PAGE_HEIGHT_LANDSCAPE + 72}px` : `${JOURNAL_PAGE_HEIGHT_PORTRAIT + 72}px`,
                    }}
                >
                    {isLandscape && (
                        <div className="absolute left-1/2 top-0 bottom-0 w-[40px] -ml-[20px] z-30 pointer-events-none flex items-center justify-center">
                            <div className="flex-1 h-full bg-gradient-to-r from-transparent to-black/10"></div>
                            <div className="w-px bg-stone-300/30 h-full"></div>
                            <div className="flex-1 h-full bg-gradient-to-l from-transparent to-black/10"></div>
                        </div>
                    )}

                    <div className="shrink-0 h-[64px] px-8 md:px-12 bg-[#fdfbf7] z-20 flex items-center justify-between border-b border-stone-200 relative">
                        <div className="flex items-center gap-6">
                            {[
                                { id: 'journal', icon: Book, label: 'Journal' },
                                { id: 'party', icon: Users, label: 'Groupe' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`group flex items-center gap-2 pb-1 transition-all ${activeTab === tab.id ? 'text-indigo-950 border-b-2 border-indigo-900 font-bold' : 'text-stone-400 hover:text-stone-600'}`}
                                >
                                    <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} className="transition-transform group-hover:-translate-y-1" />
                                    <span className={`text-xl font-black uppercase tracking-[0.1em] font-serif leading-none hidden sm:inline`}>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {activeTab === 'journal' ? (
                            <button
                                onClick={addNote}
                                className="flex items-center gap-2 bg-indigo-700 text-white pl-3 pr-4 py-2 rounded-sm shadow-md hover:bg-indigo-800 transition-all hover:-translate-y-0.5 font-bold text-sm z-50 ml-auto"
                                title="Ajouter une nouvelle page à la fin"
                            >
                                <Plus size={18} strokeWidth={3} /> <span className="uppercase tracking-wide hidden sm:inline">Nouvelle Page</span>
                            </button>
                        ) : (
                            <div className="ml-auto flex items-center gap-2 text-stone-500 font-serif italic text-sm">
                                <PenTool size={16} /> Édition libre
                            </div>
                        )}

                        <div className="absolute top-0 right-8 text-red-700 drop-shadow-md">
                            <Bookmark size={40} fill="currentColor" />
                        </div>
                    </div>

                    <div className="flex-grow flex flex-col overflow-hidden bg-white/10 relative">
                        {activeTab === 'journal' && (
                            <div
                                ref={scrollContainerRef}
                                onScroll={handleScroll}
                                className="flex-grow overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory hide-scrollbar relative"
                                style={{ width: '100%', height: '100%' }}
                            >
                                {(!data.campaignNotes || data.campaignNotes.length === 0) ? (
                                    <div className="min-w-full flex-shrink-0 flex flex-col items-center justify-center text-stone-400 italic gap-6 opacity-60 animate-in fade-in duration-1000">
                                        <div className="w-24 h-24 border-4 border-stone-300 rounded-full flex items-center justify-center">
                                            <Book size={48} strokeWidth={1} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-serif text-stone-500">Le journal est vierge.</p>
                                            <p className="text-sm mt-2 font-handwriting text-xl text-stone-400">Cliquez sur "Nouvelle Page" pour commencer l'histoire.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-nowrap" style={{ width: 'max-content', minWidth: '100%' }}>
                                        {(() => {
                                            const notes = data.campaignNotes || [];
                                            const allPages = [
                                                { type: 'toc' as const },
                                                ...notes.map((note, index) => ({ type: 'note' as const, note, originalIndex: index }))
                                            ];

                                            return Array.from({ length: Math.ceil(allPages.length / 2) }).map((_, spreadIdx) => {
                                                const p1 = allPages[spreadIdx * 2];
                                                const p2 = allPages[spreadIdx * 2 + 1];

                                                const renderPage = (page: typeof allPages[0], idx: number, isEven: boolean) => {
                                                    if (!page) {
                                                        return (
                                                            <div className="h-full flex-shrink-0 snap-start relative flex flex-col page-shadow-right"
                                                                style={{ width: isLandscape ? `${JOURNAL_PAGE_WIDTH_LANDSCAPE}px` : `${JOURNAL_PAGE_WIDTH_PORTRAIT}px`, height: isLandscape ? `${JOURNAL_PAGE_HEIGHT_LANDSCAPE}px` : `${JOURNAL_PAGE_HEIGHT_PORTRAIT}px`, borderLeft: 'none' }}
                                                            >
                                                                <div className="h-full flex flex-col bg-[#fdfbf7] overflow-hidden relative" style={{ padding: `56px 25px` }}>
                                                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
                                                                    <div className="flex-grow min-h-0 bg-transparent relative book-lines"></div>
                                                                    <div className="absolute bottom-4 right-10 text-[18px] font-serif text-stone-900/40 font-bold italic z-40 pointer-events-none">{idx + 1}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    if (page.type === 'toc') {
                                                        return <TableOfContents key="toc" notes={notes} isLandscape={isLandscape} onJumpToPage={jumpToPage} />;
                                                    }

                                                    return (
                                                        <JournalPage
                                                            key={page.note.id}
                                                            note={page.note}
                                                            pageIndex={page.originalIndex}
                                                            bookPageIndex={idx}
                                                            isEven={isEven}
                                                            isLandscape={isLandscape}
                                                            onUpdate={updateNote}
                                                            onDelete={(id) => setNoteIdToDelete(id)}
                                                            onInsertAfter={() => insertPageAfter(page.originalIndex)}
                                                            onOverflow={handleOverflow}
                                                            onAddLog={(msg, type) => onAddLog(msg, type, 'sheet')}
                                                            onForceReflow={forceReflow}
                                                            registerNoteRef={registerNoteRef}
                                                            isDrawing={isDrawingImage}
                                                            onDrawComplete={handleDrawComplete}
                                                            onUpdateImageConfig={handleUpdateImageConfig}
                                                            onRemoveImage={handleRemoveImage}
                                                        />
                                                    );
                                                };

                                                return (
                                                    <div key={spreadIdx} className="h-full flex-shrink-0 min-w-full flex justify-between snap-start relative">
                                                        {renderPage(p1, spreadIdx * 2, true)}
                                                        <div className="w-[40px] shrink-0 pointer-events-none" />
                                                        {renderPage(p2, spreadIdx * 2 + 1, false)}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'party' && (
                            <div className="flex-grow flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300">
                                <PartyTable data={data} onChange={onChange} onAddLog={onAddLog} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-12 flex justify-start">
                    {activeTab === 'journal' && (
                        <button
                            onClick={goToNext}
                            className={`p-3 rounded-full bg-stone-800 text-stone-200 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-stone-600 hover:bg-stone-700 hover:scale-110 hover:text-white transition-all duration-300 opacity-100`}
                            title="Page suivante"
                        >
                            <ChevronRight size={28} strokeWidth={3} />
                        </button>
                    )}
                </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

            {noteIdToDelete && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 animate-in fade-in duration-200 no-print">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-in zoom-in duration-200 border-2 border-stone-200">
                        <div className="bg-stone-50 p-6 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 shadow-inner">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Arracher cette page ?</h3>
                            <div className="bg-white p-3 rounded border border-stone-200 shadow-sm w-full mb-4 text-left">
                                <span className="block font-bold text-gray-800 truncate">{noteToDelete?.title || 'Note sans titre'}</span>
                                <span className="text-xs text-gray-500 block">{noteToDelete?.date}</span>
                            </div>
                            <p className="text-gray-500 text-xs">Cette action est définitive. Le contenu sera perdu à jamais.</p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-100">
                            <button onClick={() => setNoteIdToDelete(null)} className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-colors text-sm">Garder</button>
                            <button onClick={confirmDeleteNote} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md transition-colors text-sm">Détruire</button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default CampaignNotes;
