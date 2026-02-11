
import React, { useRef, useState, useEffect } from 'react';
import { CharacterSheetData, CampaignNoteEntry, ImageConfig, NoteImage } from '../types';
import { Book, Plus, Trash2, ChevronLeft, ChevronRight, Bookmark, Users, PenTool, Image as ImageIcon, Wand2 } from 'lucide-react';
import { saveImage, deleteImage } from '../imageDB';
import { useCharacter } from '../context/CharacterContext';
import { ErrorService } from '../services/ErrorService';
import { NotebookTextareaHandle } from './campaign/NotebookTextarea';
import PartyTable from './campaign/PartyTable';
import JournalPage from './campaign/JournalPage';
import TableOfContents from './campaign/TableOfContents';
import {
    JOURNAL_LINE_HEIGHT,
    JOURNAL_PAGE_WIDTH_LANDSCAPE,
    JOURNAL_PAGE_HEIGHT_LANDSCAPE,
    JOURNAL_PAGE_WIDTH_PORTRAIT,
    JOURNAL_PAGE_HEIGHT_PORTRAIT,
    JOURNAL_CONTENT_PADDING_X,
    JOURNAL_CONTENT_PADDING_Y
} from './campaign/constants';

interface Props {
    isLandscape?: boolean;
}

const CampaignNotes: React.FC<Props> = ({ isLandscape: _ignored = false }) => {
    // FORCE LANDSCAPE MODE: The Journal/Party tab is always displayed in landscape refering to user feedback
    const isLandscape = true;
    const { data, updateData: onChange, addLog: onAddLog } = useCharacter();
    const [activeTab, setActiveTab] = useState<'journal' | 'party'>('journal');
    const [isDrawingImage, setIsDrawingImage] = useState(false);
    const [pendingImageConfig, setPendingImageConfig] = useState<ImageConfig | null>(null);
    const [pendingImageNoteId, setPendingImageNoteId] = useState<string | null>(null);

    // const lineHeight = 28; // Replaced by constant
    const paddingTop = 0;


    const fileInputRef = useRef<HTMLInputElement>(null);
    const noteRefs = useRef<{ [key: string]: NotebookTextareaHandle | null }>({});

    // --- JOURNAL STATES ---
    const [currentPage, setCurrentPage] = useState(0);
    const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const totalNotes = data.campaignNotes?.length || 0;
    const shouldScrollToEnd = useRef(false);

    // Handle scroll to update current page indicator
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            const page = Math.round(scrollLeft / clientWidth);
            setCurrentPage(page);
        }
    };

    // Scroll effect when adding a new note
    useEffect(() => {
        if (scrollContainerRef.current && totalNotes > 0 && shouldScrollToEnd.current) {
            shouldScrollToEnd.current = false;
            // Scroll to the end when a note is added
            setTimeout(() => {
                scrollContainerRef.current?.scrollTo({
                    left: scrollContainerRef.current.scrollWidth,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }, [totalNotes]);

    // --- JOURNAL ACTIONS ---
    const addNote = () => {
        const newNote: CampaignNoteEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleDateString('fr-CA'),
            title: 'Nouvelle Session',
            content: '',
            images: [] // Initialize images array
        };

        const newNotes = [...(data.campaignNotes || []), newNote];
        shouldScrollToEnd.current = true;
        onChange({
            ...data,
            campaignNotes: newNotes
        });

        setActiveTab('journal');
        onAddLog("Nouvelle page ajoutée au journal", 'success', 'sheet');
    };

    const updateNote = (id: string, field: keyof CampaignNoteEntry, value: any) => {
        const newNotes = (data.campaignNotes || []).map(n => n.id === id ? { ...n, [field]: value } : n);
        onChange({ ...data, campaignNotes: newNotes });
    };

    const insertPageAfter = (index: number) => {
        const newNote: CampaignNoteEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleDateString('fr-CA'),
            title: 'Nouvelle Session',
            content: '',
            images: []
        };

        const notes = data.campaignNotes || [];
        const newNotes = [
            ...notes.slice(0, index + 1),
            newNote,
            ...notes.slice(index + 1)
        ];

        onChange({ ...data, campaignNotes: newNotes });
        onAddLog("Page insérée", 'success', 'sheet');
    };

    const confirmDeleteNote = () => {
        if (noteIdToDelete) {
            const noteToDelete = (data.campaignNotes || []).find(n => n.id === noteIdToDelete);

            // Clean up all images associated with this note
            if (noteToDelete?.images) {
                noteToDelete.images.forEach(img => {
                    deleteImage(img.imageId).catch(e => ErrorService.handleError(e, { context: 'CampaignNotes.deleteImage', silent: true }));
                });
            }
            // Fallback for deprecated single image field
            if (noteToDelete?.imageId) {
                deleteImage(noteToDelete.imageId).catch(e => ErrorService.handleError(e, { context: 'CampaignNotes.deleteImageLegacy', silent: true }));
            }

            const newNotes = (data.campaignNotes || []).filter(n => n.id !== noteIdToDelete);
            onChange({ ...data, campaignNotes: newNotes });
            onAddLog("Page du journal arrachée", 'danger', 'sheet');
            setNoteIdToDelete(null);

            if (newNotes.length === 0) {
                setCurrentPage(0);
            }
        }
    };

    const pendingFocusRef = useRef<string | null>(null);

    useEffect(() => {
        if (pendingFocusRef.current) {
            const nextId = pendingFocusRef.current;
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (noteRefs.current[nextId]) {
                        noteRefs.current[nextId]?.focusAtEnd();
                    }
                }, 100);
            });
            pendingFocusRef.current = null;
        }
    }, [data.campaignNotes]);

    const handleOverflow = (noteId: string, remainingContent: string, overflowContent: string, focusNext?: boolean) => {
        const notes = data.campaignNotes || [];
        const currentIndex = notes.findIndex(n => n.id === noteId);
        if (currentIndex === -1) return;

        const currentNote = notes[currentIndex];
        const nextIndex = currentIndex + 1;

        // 1. Prepare updated notes array
        // Start by updating the current note to remove overflow (fixes duplication)
        let updatedNotes = notes.map((n, i) =>
            i === currentIndex ? { ...n, content: remainingContent } : n
        );

        if (nextIndex < updatedNotes.length) {
            const nextNote = updatedNotes[nextIndex];

            // Case A & B : Merge into next page?
            // Merge if it's already a continuation OR if it's effectively empty/default
            const isNextContinuation = nextNote.isContinuation;
            const isNextEmpty = !nextNote.content || (nextNote.content.replace(/<[^>]*>/g, '').trim() === '');
            const isDefaultTitle = nextNote.title === 'Nouvelle Session' || nextNote.title === `${currentNote.title} (suite)`;

            if (isNextContinuation || (isNextEmpty && isDefaultTitle)) {
                // Merge
                if (focusNext) pendingFocusRef.current = nextNote.id;
                updatedNotes = updatedNotes.map((n, i) =>
                    i === nextIndex ? {
                        ...n,
                        content: overflowContent + (n.content || ''),
                        isContinuation: true
                    } : n
                );
                onChange({ ...data, campaignNotes: updatedNotes });
            } else {
                // Case C : Insertion
                const newId = Math.random().toString(36).substr(2, 9);
                if (focusNext) pendingFocusRef.current = newId;

                const newNote: CampaignNoteEntry = {
                    id: newId,
                    date: currentNote.date,
                    title: `${currentNote.title} (suite)`,
                    content: overflowContent,
                    images: [],
                    isContinuation: true
                };

                updatedNotes = [
                    ...updatedNotes.slice(0, nextIndex),
                    newNote,
                    ...updatedNotes.slice(nextIndex)
                ];
                onChange({ ...data, campaignNotes: updatedNotes });
                onAddLog("Page de suite insérée", 'info', 'sheet');
            }
        } else {
            // End of book: Create a new note
            const newId = Math.random().toString(36).substr(2, 9);
            if (focusNext) pendingFocusRef.current = newId;

            const newNote: CampaignNoteEntry = {
                id: newId,
                date: currentNote.date,
                title: `${currentNote.title} (suite)`,
                content: overflowContent,
                images: [],
                isContinuation: true
            };

            onChange({
                ...data,
                campaignNotes: [...updatedNotes, newNote]
            });
        }
    };

    const goToPrevious = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: -scrollContainerRef.current.clientWidth,
                behavior: 'smooth'
            });
        }
    };

    const goToNext = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: scrollContainerRef.current.clientWidth,
                behavior: 'smooth'
            });
        }
    };

    const jumpToPage = (index: number) => {
        if (scrollContainerRef.current) {
            // index 0 is TOC. Spreads are (TOC, P1), (P2, P3)...
            // Spread index = floor(index / 2)
            const spreadIndex = Math.floor(index / 2);
            scrollContainerRef.current.scrollTo({
                left: spreadIndex * scrollContainerRef.current.clientWidth,
                behavior: 'smooth'
            });
        }
    };

    // --- IMAGE HANDLING ---
    const toggleDrawMode = () => {
        setIsDrawingImage(!isDrawingImage);
        if (!isDrawingImage) {
            onAddLog("Mode dessin : Tracez un rectangle sur la page pour insérer une image.", 'info', 'sheet');
        }
    };

    const handleDrawComplete = (rect: { x: number, y: number, w: number, h: number, containerWidth: number }, noteId: string) => {
        setIsDrawingImage(false);
        setPendingImageNoteId(noteId);

        // Calculate Align based on center of drawn box relative to container center
        const centerBox = rect.x + (rect.w / 2);
        const centerContainer = rect.containerWidth / 2;
        const align = centerBox < centerContainer ? 'left' : 'right';

        setPendingImageConfig({
            width: rect.w,
            height: rect.h,
            marginTop: rect.y,
            align,
            x: rect.x,
            y: rect.y,
            mode: 'absolute', // Defaulting to absolute for maximum freedom (Face to Face)
            fit: 'cover'
        });

        // Open file dialog
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !pendingImageNoteId || !pendingImageConfig) return;

        try {
            const blobId = await saveImage(file);

            const newImage: NoteImage = {
                id: Math.random().toString(36).substr(2, 9), // Unique ID for placement
                imageId: blobId, // Blob ID
                config: pendingImageConfig
            };

            const targetNote = (data.campaignNotes || []).find(n => n.id === pendingImageNoteId);
            if (!targetNote) return;

            const newImages = [...(targetNote.images || []), newImage];

            const newNotes = (data.campaignNotes || []).map(n =>
                n.id === pendingImageNoteId
                    ? { ...n, images: newImages }
                    : n
            );
            onChange({ ...data, campaignNotes: newNotes });

            onAddLog("Image ajoutée à la zone dessinée", 'success', 'sheet');
        } catch (err) {
            ErrorService.handleError(err, { context: 'CampaignNotes.handleImageUpload', userMessage: "Erreur lors de l'ajout de l'image." });
            onAddLog("Erreur lors de l'ajout de l'image", 'danger');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
            setPendingImageConfig(null);
            setPendingImageNoteId(null);
        }
    };

    const handleUpdateImageConfig = (noteId: string, uniqueId: string, newConfig: ImageConfig) => {
        const targetNote = (data.campaignNotes || []).find(n => n.id === noteId);
        if (!targetNote) return;

        const newImages = (targetNote.images || []).map(img =>
            img.id === uniqueId ? { ...img, config: newConfig } : img
        );

        updateNote(noteId, 'images', newImages);
    };

    const handleRemoveImage = async (noteId: string, uniqueId: string) => {
        const targetNote = (data.campaignNotes || []).find(n => n.id === noteId);
        if (!targetNote) return;

        const imageToRemove = (targetNote.images || []).find(img => img.id === uniqueId);
        if (!imageToRemove) return;

        try {
            await deleteImage(imageToRemove.imageId);

            const newImages = (targetNote.images || []).filter(img => img.id !== uniqueId);
            updateNote(noteId, 'images', newImages);

            onAddLog("Image retirée de la note", 'info', 'sheet');
        } catch (err) {
            ErrorService.handleError(err, { context: 'CampaignNotes.handleRemoveImage', silent: true });
        }
    };

    const noteToDelete = (data.campaignNotes || []).find(n => n.id === noteIdToDelete);

    return (
        <div className={`w-full flex items-center justify-center bg-stone-900 py-8 px-4 md:px-12 relative overflow-auto transition-all duration-300 ${isLandscape ? 'min-h-[1200px]' : 'min-h-[1400px]'}`}>
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>

            {/* --- FLEX CONTAINER: BUTTONS + BOOK --- */}
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

                {/* --- THE BOOK CONTAINER --- */}
                <div className={`relative shadow-2xl transition-all duration-500 flex flex-col overflow-hidden z-10 shrink-0
              rounded-r-md rounded-l-sm border-r-[10px] border-r-stone-300 border-l-[10px] border-l-stone-950
              bg-[#fdfbf7]
          `}
                    style={{
                        width: isLandscape ? `${JOURNAL_PAGE_WIDTH_LANDSCAPE * 2 + 60}px` : `${JOURNAL_PAGE_WIDTH_PORTRAIT + 40}px`,
                        // Tight height: Page (1092) + Header (64) + border/safety (8) = 1164px
                        height: isLandscape ? `${JOURNAL_PAGE_HEIGHT_LANDSCAPE + 72}px` : `${JOURNAL_PAGE_HEIGHT_PORTRAIT + 72}px`,
                    }}
                >

                    {/* Central Gutter / Spine - Perfectly centered at 1/2 */}
                    {isLandscape && (
                        <div
                            className="absolute left-1/2 top-0 bottom-0 w-[40px] -ml-[20px] z-30 pointer-events-none flex items-center justify-center"
                        >
                            <div className="flex-1 h-full bg-gradient-to-r from-transparent to-black/10"></div>
                            <div className="w-px bg-stone-300/30 h-full"></div>
                            <div className="flex-1 h-full bg-gradient-to-l from-transparent to-black/10"></div>
                        </div>
                    )}

                    {/* BOOK HEADER */}
                    <div className="shrink-0 h-[64px] px-8 md:px-12 bg-[#fdfbf7] z-20 flex items-center justify-between border-b border-stone-200 relative">

                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setActiveTab('journal')}
                                className={`group flex items-center gap-2 pb-1 transition-all ${activeTab === 'journal' ? 'text-indigo-950 border-b-2 border-indigo-900 font-bold' : 'text-stone-400 hover:text-stone-600'}`}
                            >
                                <Book size={24} strokeWidth={activeTab === 'journal' ? 2.5 : 2} className="transition-transform group-hover:-translate-y-1" />
                                <span className={`text-xl font-black uppercase tracking-[0.1em] font-serif leading-none hidden sm:inline`}>Journal</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('party')}
                                className={`group flex items-center gap-2 pb-1 transition-all ${activeTab === 'party' ? 'text-indigo-950 border-b-2 border-indigo-900 font-bold' : 'text-stone-400 hover:text-stone-600'}`}
                            >
                                <Users size={24} strokeWidth={activeTab === 'party' ? 2.5 : 2} className="transition-transform group-hover:-translate-y-1" />
                                <span className={`text-xl font-black uppercase tracking-[0.1em] font-serif leading-none hidden sm:inline`}>Groupe</span>
                            </button>
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

                    {/* --- CONTENT AREA --- */}
                    <div className="flex-grow flex flex-col overflow-hidden bg-white/10 relative">

                        {activeTab === 'journal' && (
                            <>
                                <div
                                    ref={scrollContainerRef}
                                    onScroll={handleScroll}
                                    className="flex-grow overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory hide-scrollbar relative"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                    }}
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
                                        <div
                                            className="h-full flex flex-nowrap"
                                            style={{
                                                width: 'max-content',
                                                minWidth: '100%'
                                            }}
                                        >
                                            {/* PRE-PROCESS PAGES: Combine TOC and Notes into a flat array for easy spread mapping */}
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
                                                            /* Ghost Page - Right side only for now by design */
                                                            return (
                                                                <div
                                                                    className="h-full flex-shrink-0 snap-start relative flex flex-col page-shadow-right"
                                                                    style={{
                                                                        width: isLandscape ? `${JOURNAL_PAGE_WIDTH_LANDSCAPE}px` : `${JOURNAL_PAGE_WIDTH_PORTRAIT}px`,
                                                                        height: isLandscape ? `${JOURNAL_PAGE_HEIGHT_LANDSCAPE}px` : `${JOURNAL_PAGE_HEIGHT_PORTRAIT}px`,
                                                                        borderLeft: 'none'
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="h-full flex flex-col bg-[#fdfbf7] overflow-hidden relative"
                                                                        style={{ padding: `${JOURNAL_CONTENT_PADDING_Y}px ${JOURNAL_CONTENT_PADDING_X}px` }}
                                                                    >
                                                                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
                                                                        <div className="flex-grow min-h-0 bg-transparent relative book-lines"></div>
                                                                        <div className="absolute bottom-4 right-10 text-[18px] font-serif text-stone-900/40 font-bold italic z-40 pointer-events-none">
                                                                            {idx + 1}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        if (page.type === 'toc') {
                                                            return (
                                                                <TableOfContents
                                                                    key="toc"
                                                                    notes={notes}
                                                                    isLandscape={isLandscape}
                                                                    onJumpToPage={jumpToPage}
                                                                />
                                                            );
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
                                                                onForceReflow={(id) => {
                                                                    if (noteRefs.current[id]) {
                                                                        noteRefs.current[id]?.forceReflow();
                                                                        onAddLog("Repagination forcée", 'info', 'sheet');
                                                                    }
                                                                }}
                                                                registerNoteRef={(id, ref) => { if (ref) noteRefs.current[id] = ref; else delete noteRefs.current[id]; }}
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

                                                            {/* Physical Gap for the Spine */}
                                                            <div className="w-[40px] shrink-0 pointer-events-none" />

                                                            {renderPage(p2, spreadIdx * 2 + 1, false)}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </>
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

            {/* MODAL DE CONFIRMATION */}
            {
                noteIdToDelete && (
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
                                <p className="text-gray-500 text-xs">
                                    Cette action est définitive. Le contenu sera perdu à jamais.
                                </p>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-100">
                                <button
                                    onClick={() => setNoteIdToDelete(null)}
                                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-colors text-sm"
                                >
                                    Garder
                                </button>
                                <button
                                    onClick={confirmDeleteNote}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md transition-colors text-sm"
                                >
                                    Détruire
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CampaignNotes;
