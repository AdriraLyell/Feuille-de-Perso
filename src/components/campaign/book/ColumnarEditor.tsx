import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Check } from 'lucide-react';
import { useEditor, EditorContent, JSONContent, Editor } from '@tiptap/react';
import { getBookExtensions } from './extensions/bookExtensions';
import { PAGE_WIDTH, PAGE_HEIGHT } from '../constants';
import { BookTableOfContents } from './BookTableOfContents';
import { useBookTableOfContents } from './useBookTableOfContents';
import { useColumnarNavigation } from './hooks/useColumnarNavigation';
import { useColumnarDrawing } from './hooks/useColumnarDrawing';
import { saveImage } from '../../../imageDB';
import { ColumnarEditorStyles } from './ColumnarEditorStyles';
import { BookEditorToolbar } from './components/BookEditorToolbar';
import { BookPageBackground } from './components/BookPageBackground';
import { BookChapterSidebar } from './components/BookChapterSidebar';
import { BookPageIndicator } from './components/BookPageIndicator';
import { useRules } from '../../../context/RulesContext';
import { TimeCompanionWidget } from './components/TimeCompanionWidget';

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
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [isCalendarVisible, setIsCalendarVisible] = useState(true);
    const [pickingTarget, setPickingTarget] = useState<{ nodeId: string, field: string } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const saveIndicatorRef = useRef<NodeJS.Timeout | null>(null);
    const onUpdateRef = useRef(onUpdate);
    onUpdateRef.current = onUpdate;
    const editorRef = useRef<Editor | null>(null);
    const hasPendingChanges = useRef(false);

    const flushSave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (hasPendingChanges.current && editorRef.current && !editorRef.current.isDestroyed && onUpdateRef.current) {
            onUpdateRef.current(editorRef.current.getJSON());
            hasPendingChanges.current = false;
            setSaveStatus('saved');
            if (saveIndicatorRef.current) clearTimeout(saveIndicatorRef.current);
            saveIndicatorRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
        }
    }, []);

    const handleCalendarDateClick = useCallback((date: string) => {
        if (pickingTarget) {
            window.dispatchEvent(new CustomEvent('calendar-date-picked', {
                detail: {
                    date,
                    nodeId: pickingTarget.nodeId,
                    field: pickingTarget.field
                }
            }));
            setPickingTarget(null);
        } else {
            scrollToDate(date);
        }
    }, [pickingTarget, scrollToDate]);

    // Event listener for external calendar toggling
    useEffect(() => {
        const handleToggle = (e: any) => {
            if (e.detail?.visible !== undefined) {
                setIsCalendarVisible(e.detail.visible);
            } else {
                setIsCalendarVisible(v => !v);
            }
        };
        const handlePickRequest = (e: any) => {
            setPickingTarget(e.detail);
            setIsCalendarVisible(true);
        };
        window.addEventListener('toggle-calendar', handleToggle);
        window.addEventListener('calendar-open-picker', handlePickRequest);
        return () => {
            window.removeEventListener('toggle-calendar', handleToggle);
            window.removeEventListener('calendar-open-picker', handlePickRequest);
        };
    }, []);

    // Flush on tab switch or page close
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') flushSave();
        };
        const handleBeforeUnload = () => flushSave();

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setPickingTarget(null);
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [flushSave]);

    const editorOptions = useMemo(() => ({
        extensions: getBookExtensions(),
        editable: !readOnly,
        immediatelyRender: false,
        onUpdate: ({ editor }: { editor: Editor }) => {
            if (onUpdateRef.current) {
                hasPendingChanges.current = true;
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    onUpdateRef.current?.(editor.getJSON());
                    hasPendingChanges.current = false;
                    setSaveStatus('saved');
                    if (saveIndicatorRef.current) clearTimeout(saveIndicatorRef.current);
                    saveIndicatorRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
                }, 500);
            }
        },
    }), [readOnly]);

    const editor = useEditor(editorOptions);
    editorRef.current = editor;

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

    // Filter dates that have notes and weather, and detect voyages
    const { notifiedDates, voyageRanges } = useMemo(() => {
        if (!editor) return { notifiedDates: new Map<string, string>(), voyageRanges: [] as { start: string, end: string }[] };
        const dates = new Map<string, string>();
        const ranges: { start: string, end: string }[] = [];

        editor.state.doc.descendants((node) => {
            if (node.type.name === 'chapterHeading' && node.attrs.date) {
                dates.set(node.attrs.date, node.attrs.weather || '');
            }
            if (node.type.name === 'narrativeSection' && node.attrs.type === 'voyage' && node.attrs.dateStart && node.attrs.dateEnd) {
                ranges.push({ start: node.attrs.dateStart, end: node.attrs.dateEnd });
            }
        });
        return { notifiedDates: dates, voyageRanges: ranges };
    }, [editor, editor?.state.doc]);

    const scrollToDate = useCallback((date: string) => {
        if (!editor || editor.isDestroyed || !containerRef.current) return;

        let targetPos = -1;
        editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'chapterHeading' && node.attrs.date === date) {
                targetPos = pos;
                return false;
            }
            return true;
        });

        if (targetPos !== -1) {
            const dom = editor.view.nodeDOM(targetPos) as HTMLElement;
            if (dom && containerRef.current) {
                const horizontalOffset = dom.offsetLeft;
                const stride = PAGE_WIDTH + 40;
                const spreadIndex = Math.floor(horizontalOffset / (stride * 2));

                containerRef.current.scrollTo({
                    left: spreadIndex * stride * 2,
                    behavior: 'smooth'
                });
            }
        }
    }, [editor]);

    // Initial Content Injection
    useEffect(() => {
        if (editor && initialContent && !editor.isDestroyed) {
            queueMicrotask(() => {
                if (editor.isEmpty) {
                    editor.commands.setContent(initialContent, { emitUpdate: false });
                }
            });
        }
    }, [editor]);

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

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            const timer = setTimeout(() => setIsMounted(true), 50);
            return () => clearTimeout(timer);
        });
        return () => cancelAnimationFrame(frame);
    }, []);

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
                        onInsertChapter={() => (editor.commands as any).setChapter()}
                        onAppendChapter={() => (editor.commands as any).appendChapter()}
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
                                onNewChapter={pickingTarget ? undefined : (date) => (editor.commands as any).insertChapterAtDate(date)}
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
                    <div
                        className="absolute top-0 left-0 z-20 pointer-events-auto"
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

                    <div
                        ref={contentRef}
                        className="text-stone-900 box-border relative z-10 no-scrollbar max-w-none"
                        style={{
                            position: 'absolute',
                            top: '60px',
                            left: `${PAGE_WIDTH + 40}px`, // Shift content to Page 2
                            height: `${PAGE_HEIGHT - 60 - 50}px`,
                            columnWidth: `${PAGE_WIDTH}px`,
                            columnGap: '40px',
                            columnFill: 'auto',
                            width: 'fit-content',
                            minWidth: `${PAGE_WIDTH}px`,
                            overflow: 'visible',
                        }}
                    >
                        <ColumnarEditorStyles />
                        <EditorContent editor={editor} className="w-full h-full" />
                    </div>
                </div>

                {/* Page Indicator */}
                {pageCount > 2 && (
                    <BookPageIndicator
                        currentSpread={Math.max(0, Math.round(scrollPos / ((PAGE_WIDTH + 40) * 2)))}
                        totalSpreads={Math.ceil(pageCount / 2)}
                        onNavigate={(spreadIndex) => {
                            if (containerRef.current) {
                                containerRef.current.scrollTo({
                                    left: spreadIndex * (PAGE_WIDTH + 40) * 2,
                                    behavior: 'smooth'
                                });
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
};
