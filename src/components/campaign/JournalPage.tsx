import React, { useRef } from 'react';
import { CampaignNoteEntry, ImageConfig } from '../../types';
import { Trash2, Bookmark, Wand2, Plus } from 'lucide-react';
import NotebookTextarea, { NotebookTextareaHandle } from './NotebookTextarea';
import NoteImageZone from './NoteImageZone';

interface JournalPageProps {
    note: CampaignNoteEntry;
    pageIndex: number;
    isEven: boolean;
    isLandscape: boolean;
    onUpdate: (id: string, field: keyof CampaignNoteEntry, value: any) => void;
    onDelete: (id: string) => void;
    onInsertAfter: (index: number) => void;
    onOverflow: (id: string, content: string) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info') => void;
    onForceReflow: (id: string) => void;
    registerNoteRef: (id: string, ref: NotebookTextareaHandle | null) => void;

    // Image Handling
    isDrawing: boolean;
    onDrawComplete: (rect: { x: number, y: number, w: number, h: number, containerWidth: number }, id: string) => void;
    onUpdateImageConfig: (noteId: string, uniqueId: string, newConfig: ImageConfig) => void;
    onRemoveImage: (noteId: string, uniqueId: string) => void;
}

import {
    JOURNAL_LINE_HEIGHT,
    JOURNAL_PAGE_WIDTH_LANDSCAPE,
    JOURNAL_PAGE_HEIGHT_LANDSCAPE,
    JOURNAL_PAGE_WIDTH_PORTRAIT,
    JOURNAL_PAGE_HEIGHT_PORTRAIT,
    JOURNAL_CONTENT_PADDING_X,
    JOURNAL_CONTENT_PADDING_Y
} from './constants';

const JournalPage: React.FC<JournalPageProps> = ({
    note,
    pageIndex,
    isEven,
    isLandscape,
    onUpdate,
    onDelete,
    onInsertAfter,
    onOverflow,
    onAddLog,
    onForceReflow,
    registerNoteRef,
    isDrawing,
    onDrawComplete,
    onUpdateImageConfig,
    onRemoveImage
}) => {
    // const lineHeight = 28; // Replaced by constant

    return (
        <div
            className={`flex-shrink-0 snap-start relative group/page flex flex-col ${isEven ? 'page-shadow-left' : 'page-shadow-right'}`}
            style={{
                width: isLandscape ? `${JOURNAL_PAGE_WIDTH_LANDSCAPE}px` : `${JOURNAL_PAGE_WIDTH_PORTRAIT}px`,
                height: isLandscape ? `${JOURNAL_PAGE_HEIGHT_LANDSCAPE}px` : `${JOURNAL_PAGE_HEIGHT_PORTRAIT}px`,
            }}
        >
            <style>{`
                .book-lines {
                    background-image: linear-gradient(transparent ${JOURNAL_LINE_HEIGHT - 1}px, #e7e5e4 ${JOURNAL_LINE_HEIGHT - 1}px);
                    background-size: 100% ${JOURNAL_LINE_HEIGHT}px;
                    background-attachment: local;
                    background-position: 0 0; 
                }
                .book-lines [contenteditable] * {
                    margin: 0 !important;
                    padding: 0 !important;
                    line-height: ${JOURNAL_LINE_HEIGHT}px !important;
                }
                .book-lines [contenteditable] div, .book-lines [contenteditable] p {
                    min-height: ${JOURNAL_LINE_HEIGHT}px;
                }
                .book-lines ul { list-style-type: disc !important; padding-left: 20px !important; }
                .book-lines ol { list-style-type: decimal !important; padding-left: 20px !important; }
                .book-lines li { margin-left: 4px; }
                
                .page-shadow-left {
                    box-shadow: inset -15px 0 20px -10px rgba(0,0,0,0.1);
                }
                .page-shadow-right {
                    box-shadow: inset 15px 0 20px -10px rgba(0,0,0,0.1);
                }
            `}</style>

            {/* Red Ribbon (Bookmark) */}
            {note.isBookmarked && (
                <div className="absolute -top-2 right-8 w-8 h-20 bg-red-700 shadow-lg z-40 animate-in slide-in-from-top duration-500 flex flex-col pointer-events-none">
                    <div className="flex-grow bg-red-700"></div>
                    <div className="h-4 bg-red-800" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
                </div>
            )}

            {/* Page Content */}
            <div
                className="h-full flex flex-col bg-[#fdfbf7] overflow-hidden relative"
                style={{ padding: `${JOURNAL_CONTENT_PADDING_Y}px ${JOURNAL_CONTENT_PADDING_X}px` }}
            >
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>

                {/* Note Header - Hidden if continuation */}
                {!note.isContinuation ? (
                    <div className="border-b-2 border-stone-800/20 mb-2 pb-2 flex items-baseline justify-between shrink-0 z-20 min-h-[50px]">
                        <div className="flex items-baseline gap-4 flex-grow min-w-0">
                            <div className="w-[100px] shrink-0">
                                <input
                                    type="date"
                                    className="w-full bg-transparent outline-none text-sm font-handwriting text-stone-500 tracking-wider"
                                    value={note.date}
                                    onChange={(e) => onUpdate(note.id, 'date', e.target.value)}
                                    style={{ colorScheme: 'light' }}
                                />
                            </div>
                            <input
                                type="text"
                                value={note.title}
                                onChange={(e) => onUpdate(note.id, 'title', e.target.value)}
                                placeholder="Titre de la session..."
                                className="bg-transparent text-2xl font-serif font-bold text-indigo-950 focus:outline-none flex-grow placeholder-stone-200"
                            />
                        </div>
                        <div className="flex items-center gap-1 no-print shrink-0 ml-2 opacity-0 group-hover/page:opacity-100 transition-opacity">
                            <button
                                onClick={() => onUpdate(note.id, 'isBookmarked', !note.isBookmarked)}
                                className={`p-2 rounded-full transition-all ${note.isBookmarked ? 'text-red-600 bg-red-50' : 'text-stone-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                title={note.isBookmarked ? "Retirer le signet" : "Marquer cette page"}
                            >
                                <Bookmark size={16} fill={note.isBookmarked ? "currentColor" : "none"} />
                            </button>
                            <button
                                onClick={() => {
                                    onForceReflow(note.id);
                                    onAddLog("Repagination forcée", 'info');
                                }}
                                className="p-2 text-stone-300 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all"
                                title="Refaire la mise en page (baguette magique)"
                            >
                                <Wand2 size={16} />
                            </button>
                            <button
                                onClick={() => onInsertAfter(pageIndex)}
                                className="p-2 text-stone-300 hover:text-green-600 hover:bg-green-50 rounded-full transition-all"
                                title="Insérer une page après celle-ci"
                            >
                                <Plus size={16} />
                            </button>
                            <button
                                onClick={() => onDelete(note.id)}
                                className="p-2 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                title="Arracher cette page"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-[0px] mb-0 relative group/controls">
                        <div className="absolute right-0 top-2 flex items-center gap-1 no-print shrink-0 opacity-0 group-hover/page:opacity-100 z-50">
                            <button onClick={() => onDelete(note.id)} className="p-1 text-stone-300 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                    </div>
                )}

                {/* Editor Content - Now with flex-grow to avoid manual height calculations */}
                <div
                    className="flex-grow bg-transparent relative book-lines overflow-hidden"
                >
                    <NotebookTextarea
                        ref={(el) => registerNoteRef(note.id, el)}
                        value={note.content}
                        onChange={(v) => onUpdate(note.id, 'content', v)}
                        onOverflow={(content) => onOverflow(note.id, content)}
                        placeholder={note.isContinuation ? "" : "Récit des événements..."}
                        isDrawing={isDrawing}
                        onDrawComplete={(rect) => onDrawComplete(rect, note.id)}
                        lineHeight={JOURNAL_LINE_HEIGHT}
                        imageNodes={
                            note.images && note.images.map((img) => (
                                <NoteImageZone
                                    key={img.id}
                                    uniqueId={img.id}
                                    imageId={img.imageId}
                                    config={img.config}
                                    onUpdateConfig={(cfg) => onUpdateImageConfig(note.id, img.id, cfg)}
                                    onDelete={() => onRemoveImage(note.id, img.id)}
                                />
                            ))
                        }
                    />
                </div>
            </div>

            {/* Page Number - Simplified, lower position, integrated look */}
            <div className={`absolute bottom-4 ${isEven ? 'left-10' : 'right-10'} text-[18px] font-serif text-stone-900/40 font-bold italic z-40 selection:bg-transparent pointer-events-none`}>
                {pageIndex + 1}
            </div>
        </div>
    );
};

export default JournalPage;
