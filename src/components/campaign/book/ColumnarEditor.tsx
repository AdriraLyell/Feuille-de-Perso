import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Check } from 'lucide-react';
import { useEditor, EditorContent, JSONContent, Editor } from '@tiptap/react';
import { getBookExtensions } from './extensions/bookExtensions';
import { PAGE_WIDTH, PAGE_HEIGHT } from '../constants';
import { BookTableOfContents } from './BookTableOfContents';
import { useBookTableOfContents } from './useBookTableOfContents';
import { useColumnarNavigation } from './hooks/useColumnarNavigation';
import { useColumnarDrawing } from './hooks/useColumnarDrawing';
import { saveImage } from '../../../services/imageDB';
import { ColumnarEditorStyles } from './ColumnarEditorStyles';
import { BookEditorToolbar } from './components/BookEditorToolbar';
import { BookPageBackground } from './components/BookPageBackground';
import { BookChapterSidebar } from './components/BookChapterSidebar';
import { useRules } from '../../../context/RulesContext';
import { TimeCompanionWidget } from './components/TimeCompanionWidget';

// Nouveaux hooks extraits
import { useColumnarPersistence } from './hooks/useColumnarPersistence';
import { useColumnarCalendarSync } from './hooks/useColumnarCalendarSync';

const INK_COLORS = [
    { name: 'Noir Corbeau', color: '#1c1917' },
    { name: 'Bleu Royal', color: '#1e3a8a' },
    { name: 'Sang Séché', color: '#7f1d1d' },
    { name: 'Vert Forêt', color: '#064e3b' },
    { name: 'Or Ancien', color: '#b45309' },
    { name: 'Violet Sombre', color: '#581c87' },
];

const HIGHLIGHT_COLORS = [
    { name: 'Ambre', color: '#f59e0b40' },
    { name: 'Menthe', color: '#10b98140' },
    { name: 'Azur', color: '#3b82f640' },
    { name: 'Rose', color: '#ef444440' },
    { name: 'Violet', color: '#8b5cf640' },
];

interface ColumnarEditorProps {
    initialContent?: JSONContent | string;
    onUpdate?: (content: JSONContent) => void;
    readOnly?: boolean;
}

export const ColumnarEditor: React.FC<ColumnarEditorProps> = ({
    initialContent,
    onUpdate,
    readOnly = false
}) => {
    const { rules } = useRules();
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [showColorPalette, setShowColorPalette] = useState(false);
    const [showHighlightPalette, setShowHighlightPalette] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const {
        saveStatus,
        handleUpdate,
        setEditor
    } = useColumnarPersistence({ onUpdate });

    const editorOptions = useMemo(() => ({
        extensions: getBookExtensions(),
        editable: !readOnly,
        immediatelyRender: false,
        onUpdate: handleUpdate,
    }), [readOnly, handleUpdate]);

    const editor = useEditor(editorOptions);

    useEffect(() => {
        setEditor(editor);
    }, [editor, setEditor]);

    const {
        isCalendarVisible,
        setIsCalendarVisible,
        pickingTarget,
        setPickingTarget,
        notifiedDates,
        voyageRanges,
        handleCalendarDateClick
    } = useColumnarCalendarSync({
        editor,
        containerRef
    });

    const {
        pageCount,
        scrollPos,
        scrollPrev,
        scrollNext,
        navigateToPage
    } = useColumnarNavigation({
        editor,
        containerRef,
        contentRef
    });

    const {
        drawRect,
        handleDrawingMouseDown,
        handleDrawingMouseMove,
        handleDrawingMouseUp,
        cancelDrawing
    } = useColumnarDrawing({
        editor,
        containerRef,
        setIsDrawingMode
    });

    const { entries } = useBookTableOfContents(editor, contentRef);

    // Initial Content Injection
    useEffect(() => {
        if (editor && initialContent && !editor.isDestroyed) {
            queueMicrotask(() => {
                if (editor.isEmpty) {
                    editor.commands.setContent(initialContent, { emitUpdate: false });
                }
            });
        }
    }, [editor, initialContent]);

    // Sync content if initialContent changes
    useEffect(() => {
        if (editor && initialContent) {
            const currentJson = JSON.stringify(editor.getJSON());
            const nextJson = typeof initialContent === 'string' ? initialContent : JSON.stringify(initialContent);

            if (currentJson !== nextJson && !editor.isFocused) {
                editor.commands.setContent(initialContent, { emitUpdate: false });
            }
        }
    }, [initialContent, editor]);

    const handleQuickInsertImage = useCallback(() => {
        if (!editor) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
                const imageId = await saveImage(file);
                editor.chain().focus().setBookImage({
                    imageId,
                    width: '50%',
                    height: 'auto',
                    fit: 'contain',
                    align: 'center',
                }).run();
            } catch { /* silently fail */ }
        };
        input.click();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="w-full flex flex-col items-center justify-start relative overflow-visible gap-4">
            <ColumnarEditorStyles />

            {/* Save Status Indicator */}
            {saveStatus === 'saved' && (
                <div className="absolute top-2 right-4 z-[70] flex items-center gap-1.5 text-amber-500/70 text-[10px] font-serif italic animate-in fade-in slide-in-from-right-2 duration-300">
                    <Check size={12} />
                    Sauvé
                </div>
            )}

            {!readOnly && (
                <BookEditorToolbar
                    editor={editor}
                    isDrawingMode={isDrawingMode}
                    setIsDrawingMode={setIsDrawingMode}
                    showHighlightPalette={showHighlightPalette}
                    setShowHighlightPalette={setShowHighlightPalette}
                    showColorPalette={showColorPalette}
                    setShowColorPalette={setShowColorPalette}
                    handleQuickInsertImage={handleQuickInsertImage}
                    highlightColors={HIGHLIGHT_COLORS}
                    inkColors={INK_COLORS}
                />
            )}

            {/* Spread Wrapper: Fixed width for exact button anchoring */}
            <div className="relative" style={{ width: `${PAGE_WIDTH * 2 + 40}px` }}>

                {!readOnly && (
                    <BookChapterSidebar
                        onInsertMoment={() => (editor.commands as any).insertNarrativeSection({ type: 'moment', timeSlot: 'matin' })}
                        isCalendarVisible={isCalendarVisible}
                        onToggleCalendar={() => setIsCalendarVisible(!isCalendarVisible)}
                    >
                        {rules?.configurations?.calendar && (
                            <TimeCompanionWidget
                                config={rules.configurations.calendar}
                                notatedDates={notifiedDates}
                                voyageRanges={voyageRanges}
                                onDateClick={handleCalendarDateClick}
                                onNewChapter={pickingTarget ? undefined : (date, atSelection) => (editor.commands as any).insertChapterAtDate(date, undefined, atSelection)}
                            />
                        )}
                    </BookChapterSidebar>
                )}

                {/* Navigation Buttons */}
                {pageCount > 2 && scrollPos > 10 && (
                    <button
                        onClick={scrollPrev}
                        className="absolute z-50 p-3 bg-stone-800 text-stone-200 rounded-full shadow-lg hover:bg-stone-700 transition-colors border border-stone-600 animate-in fade-in duration-300"
                        style={{ left: '-60px', top: '100px', transform: 'translateY(-50%)' }}
                        title="Page Précédente"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                )}

                {pageCount > 2 && scrollPos < ((Math.ceil(pageCount / 2) - 1) * (PAGE_WIDTH + 40) * 2 - 10) && (
                    <button
                        onClick={scrollNext}
                        className="absolute z-50 p-3 bg-stone-800 text-stone-200 rounded-full shadow-lg hover:bg-stone-700 transition-colors border border-stone-600 animate-in fade-in duration-300"
                        style={{ right: '-60px', top: '100px', transform: 'translateY(-50%)' }}
                        title="Page Suivante"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                )}


                {/* Viewport Container: Handles the horizontal scroll / snap */}
                <div
                    ref={containerRef}
                    className="overflow-x-auto overflow-y-hidden relative no-scrollbar"
                    style={{
                        scrollSnapType: 'x mandatory',
                        width: '100%',
                        height: `${PAGE_HEIGHT}px`,
                        margin: '0 auto',
                    }}
                >
                    {/* Spacer to force scrollable area */}
                    <div style={{ width: `${(Math.ceil(pageCount / 2) * 2) * (PAGE_WIDTH + 40)}px`, height: '1px' }} />

                    {/* Visual Background/Decoration Track: Individual Page Cards */}
                    <BookPageBackground pageCount={pageCount} />

                    {/* Table of Contents Page Overlay (Page 1) */}
                    {/* bg-[#fbf4e9] = couleur papier de BookPageBackground : masque le contenu éditeur visible en transparence */}
                    <div
                        className="absolute top-0 left-0 z-20 pointer-events-auto bg-[#fbf4e9]"
                        style={{
                            width: `${PAGE_WIDTH}px`,
                            height: `${PAGE_HEIGHT}px`,
                            paddingTop: '60px'
                        }}
                    >
                        <BookTableOfContents entries={entries} onNavigate={navigateToPage} />
                    </div>

                    {/* Drawing Overlay */}
                    {isDrawingMode && (
                        <div
                            className="absolute top-0 left-0 z-[100] cursor-crosshair bg-white/10 backdrop-blur-[1px]"
                            style={{ width: `${(Math.ceil(pageCount / 2) * 2) * (PAGE_WIDTH + 40)}px`, height: '100%' }}
                            onMouseDown={handleDrawingMouseDown}
                            onMouseMove={handleDrawingMouseMove}
                            onMouseUp={handleDrawingMouseUp}
                        >
                            <div className="sticky left-1/2 -translate-x-1/2 top-4 w-fit bg-amber-600 text-white px-4 py-2 rounded-full shadow-2xl text-sm font-serif font-bold animate-in slide-in-from-top-4 duration-300 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M3 12h18" /></svg>
                                Tracez la zone de l'image sur le livre
                            </div>
                            {drawRect && (
                                <div
                                    className="absolute border-2 border-dashed border-amber-500 bg-amber-500/10 pointer-events-none"
                                    style={{
                                        left: `${drawRect.x}px`,
                                        top: `${drawRect.y}px`,
                                        width: `${drawRect.w}px`,
                                        height: `${drawRect.h}px`
                                    }}
                                />
                            )}
                            <button
                                className="sticky left-[90%] top-4 bg-stone-800 text-white px-3 py-1.5 rounded-lg shadow-lg text-[10px] font-bold uppercase transition-all hover:bg-red-700"
                                onClick={(e) => { e.stopPropagation(); cancelDrawing(); }}
                            >
                                Annuler [ESC]
                            </button>
                        </div>
                    )}

                    <EditorContent
                        ref={contentRef}
                        editor={editor}
                        className="prose-custom relative z-10"
                        style={{
                            width: `${(Math.ceil(pageCount / 2) * 2) * (PAGE_WIDTH + 40)}px`,
                            height: '100%',
                            columnWidth: `${PAGE_WIDTH}px`,
                            columnGap: '40px',
                            columnFill: 'auto',
                            padding: `60px 20px 60px ${PAGE_WIDTH + 40 + 20}px`,
                            pointerEvents: isDrawingMode ? 'none' : 'auto'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
