import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { PAGE_WIDTH, PAGE_HEIGHT } from '../constants';
import { ChapterHeading } from '../../../extensions/chapterHeading';
import { BookImage } from '../../../extensions/bookImage';
import { saveImage } from '../../../imageDB';
import { BookTableOfContents } from './BookTableOfContents';
import { useBookTableOfContents } from './useBookTableOfContents';
import { logger } from '../../../utils/logger';
import { useMemo } from 'react';

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
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [drawStart, setDrawStart] = useState<{ x: number, y: number } | null>(null);
    const [drawRect, setDrawRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

    const onUpdateRef = useRef(onUpdate);
    onUpdateRef.current = onUpdate;

    const editorOptions = useMemo(() => ({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            BookImage,
            ChapterHeading,
            TextAlign.configure({
                types: ['heading', 'paragraph', 'chapterHeading'],
            }),
            Placeholder.configure({
                placeholder: 'Écrivez votre récit ici...',
            }),
        ],
        editable: !readOnly,
        immediatelyRender: false,
        onUpdate: ({ editor }: { editor: any }) => {
            if (onUpdateRef.current) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    onUpdateRef.current?.(editor.getJSON());
                }, 1000);
            }
        },
    }), [readOnly]); // initialContent is only used once, readOnly is dynamic

    const editor = useEditor(editorOptions);

    // Initial Content Injection (Safe from flushSync)
    useEffect(() => {
        if (editor && initialContent && !editor.isDestroyed) {
            // Only set if we have content and it's not already there (to be safe)
            // Using a microtask delay just to be 100% sure we are out of the render cycle
            // although useEffect corresponds to the commit phase.
            queueMicrotask(() => {
                // Prevent resetting if content was somehow restored or if we are in a hot reload
                if (editor.isEmpty) {
                    editor.commands.setContent(initialContent, { emitUpdate: false });
                }
            });
        }
    }, [editor]); // Run once when editor is created


    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [pageCount, setPageCount] = React.useState(1);
    const [scrollPos, setScrollPos] = React.useState(0);

    const { entries } = useBookTableOfContents(editor, contentRef);

    // Sync content if initialContent changes (e.g. switching chapters)
    useEffect(() => {
        if (editor && initialContent) {
            // Only update if the content is different and editor is not focused/dirty
            // to avoid cursor jumping during active typing (debounce handles saving)
            const currentJson = JSON.stringify(editor.getJSON());
            const nextJson = typeof initialContent === 'string' ? initialContent : JSON.stringify(initialContent);

            if (currentJson !== nextJson && !editor.isFocused) {
                editor.commands.setContent(initialContent, { emitUpdate: false });
            }
        }
    }, [initialContent, editor]);

    // Calculate how many pages we have based on scrollWidth
    useEffect(() => {
        const checkScroll = () => {
            if (!contentRef.current || !containerRef.current) return;

            // We use a small timeout to allow CSS Column reflow to complete
            // especially after image size changes or Tiptap node view renders.
            requestAnimationFrame(() => {
                if (!contentRef.current || !containerRef.current) return;

                const scrollWidth = contentRef.current.scrollWidth;
                const stride = PAGE_WIDTH + 40;

                // We add 1 for the Table of Contents page
                const contentPages = Math.max(1, Math.ceil(scrollWidth / stride));
                const totalPages = contentPages + 1;

                if (totalPages !== pageCount) {
                    setPageCount(totalPages);
                }
                setScrollPos(containerRef.current.scrollLeft);
            });
        };

        const handleScroll = () => {
            if (containerRef.current) {
                setScrollPos(containerRef.current.scrollLeft);
            }
        };

        checkScroll();

        // Add a ResizeObserver that specifically monitors the content container.
        // Since CSS columns with width: fit-content should resize their box,
        // ResizeObserver on contentRef.current is usually correct.
        const observer = new ResizeObserver(checkScroll);
        if (contentRef.current) {
            observer.observe(contentRef.current);
            // Also observe the first child (ProseMirror) just in case
            const firstChild = contentRef.current.firstElementChild;
            if (firstChild) observer.observe(firstChild);
        }

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
        }

        if (editor) {
            // Defer editor event handlers to avoid calling setState synchronously
            // during Tiptap's internal flushSync cycle.
            let updateRafId: number | null = null;
            let selectionRafId: number | null = null;

            const deferredUpdate = () => {
                if (updateRafId !== null) cancelAnimationFrame(updateRafId);
                updateRafId = requestAnimationFrame(() => {
                    updateRafId = null;
                    checkScroll();
                });
            };

            const deferredSelection = () => {
                if (selectionRafId !== null) cancelAnimationFrame(selectionRafId);
                selectionRafId = requestAnimationFrame(() => {
                    selectionRafId = null;
                    checkScroll();
                });
            };

            editor.on('update', deferredUpdate);
            editor.on('selectionUpdate', deferredSelection);

            return () => {
                observer.disconnect();
                if (container) {
                    container.removeEventListener('scroll', handleScroll);
                }
                editor.off('update', deferredUpdate);
                editor.off('selectionUpdate', deferredSelection);
                if (updateRafId !== null) cancelAnimationFrame(updateRafId);
                if (selectionRafId !== null) cancelAnimationFrame(selectionRafId);
            };
        }

        return () => {
            observer.disconnect();
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, [editor, pageCount]);

    const handleDrawingMouseDown = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
        const y = e.clientY - rect.top;
        setDrawStart({ x, y });
        setDrawRect({ x, y, w: 0, h: 0 });
    };

    const handleDrawingMouseMove = (e: React.MouseEvent) => {
        if (!drawStart || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + (containerRef.current.scrollLeft || 0);
        const y = e.clientY - rect.top;

        setDrawRect({
            x: Math.min(x, drawStart.x),
            y: Math.min(y, drawStart.y),
            w: Math.abs(x - drawStart.x),
            h: Math.abs(y - drawStart.y)
        });
    };

    const handleDrawingMouseUp = (e: React.MouseEvent) => {
        if (!drawRect || drawRect.w < 10 || drawRect.h < 10) {
            setDrawStart(null);
            setDrawRect(null);
            setIsDrawingMode(false);
            return;
        }

        const finalRect = { ...drawRect };
        // Get the position in the editor based on mouse coordinates
        const pos = editor?.view.posAtCoords({ left: e.clientX, top: e.clientY });

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (ce) => {
            const file = (ce.target as HTMLInputElement).files?.[0];
            if (file) {
                try {
                    const imageId = await saveImage(file);
                    // Standardize width to 25/50/75/100 based on drawing
                    const ratio = finalRect.w / PAGE_WIDTH;
                    let widthVal: string;
                    if (ratio < 0.35) widthVal = '25%';
                    else if (ratio < 0.65) widthVal = '50%';
                    else if (ratio < 0.85) widthVal = '75%';
                    else widthVal = '100%';

                    if (editor) {
                        const chain = editor.chain().focus();
                        if (pos) chain.setTextSelection(pos.pos);
                        chain.setBookImage({
                            imageId,
                            width: widthVal,
                            height: `${finalRect.h}px`,
                            fit: 'cover',
                            align: 'center'
                        }).run();
                    }
                } catch (err) {
                    logger.error("Failed to save image", err);
                }
            }
            setIsDrawingMode(false);
            setDrawStart(null);
            setDrawRect(null);
        };
        input.click();
    };


    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        // Double-tick mount to be absolutely safe with React 18 batching
        const frame = requestAnimationFrame(() => {
            const timer = setTimeout(() => setIsMounted(true), 50);
            return () => clearTimeout(timer);
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    if (!editor || !isMounted) {
        return (
            <div className="mx-auto w-[1484px] h-[1000px] flex items-center justify-center bg-[#fbf4e9] rounded-lg shadow-2xl border border-stone-300/50">
                <div className="flex flex-col items-center gap-4 text-stone-400 font-serif italic">
                    <div className="w-8 h-8 border-2 border-stone-300 border-t-amber-600 rounded-full animate-spin" />
                    Lecture du grimoire...
                </div>
            </div>
        );
    }

    const scrollPrev = () => {
        if (containerRef.current) {
            // Precise stride for 2 pages spread
            const stride = (PAGE_WIDTH + 40) * 2;
            containerRef.current.scrollBy({ left: -stride, behavior: 'smooth' });
        }
    };

    const scrollNext = () => {
        if (containerRef.current) {
            const stride = (PAGE_WIDTH + 40) * 2;
            containerRef.current.scrollBy({ left: stride, behavior: 'smooth' });
        }
    };

    const navigateToPage = (pageNumber: number) => {
        if (containerRef.current) {
            const stride = PAGE_WIDTH + 40;
            // pageNumber 1 is TOC, pageNumber 2 is first content page, etc.
            // We scroll to the spread start.
            const spreadIndex = Math.floor((pageNumber - 1) / 2);
            containerRef.current.scrollTo({
                left: spreadIndex * stride * 2,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="w-full animate-in fade-in duration-700 flex flex-col items-center justify-start relative overflow-visible gap-4">

            {/* Editor Toolbar */}
            <div className="flex items-center gap-1 p-1 bg-stone-900/90 border border-stone-700 rounded-lg shadow-xl mb-2 sticky top-0 z-[60] backdrop-blur-sm">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-stone-700 transition-colors ${editor.isActive('bold') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                    title="Gras"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /></svg>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-stone-700 transition-colors ${editor.isActive('italic') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                    title="Italique"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>
                </button>

                <div className="w-px h-6 bg-stone-700 mx-1" />

                <button
                    onClick={() => (editor.commands as any).setChapter()}
                    className="flex items-center gap-2 px-3 py-2 rounded bg-amber-600/20 text-amber-500 hover:bg-amber-600/30 transition-colors border border-amber-600/30 font-serif font-bold text-xs uppercase"
                    title="Nouveau Chapitre"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    Chapitre
                </button>

                <button
                    onClick={() => setIsDrawingMode(true)}
                    className={`flex items-center gap-2 px-3 py-2 rounded transition-colors border font-serif font-bold text-xs uppercase ${isDrawingMode ? 'bg-amber-600 text-white border-amber-500' : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border-stone-600'}`}
                    title="Insérer Image (Tracer une zone)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    Image
                </button>
            </div>

            {/* Spread Wrapper: Fixed width for exact button anchoring */}
            <div className="relative" style={{ width: `${PAGE_WIDTH * 2 + 40}px` }}>

                {/* Navigation Buttons - Only show if there are more than 2 pages and we aren't at the limit */}
                {pageCount > 2 && scrollPos > 10 && (
                    <button
                        onClick={scrollPrev}
                        className="absolute z-50 p-3 bg-stone-800 text-stone-200 rounded-full shadow-lg hover:bg-stone-700 transition-colors border border-stone-600 animate-in fade-in duration-300"
                        style={{ left: '-60px', top: '500px', transform: 'translateY(-50%)' }}
                        title="Page Précédente"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                )}

                {pageCount > 2 && scrollPos < ((Math.ceil(pageCount / 2) - 1) * (PAGE_WIDTH + 40) * 2 - 10) && (
                    <button
                        onClick={scrollNext}
                        className="absolute z-50 p-3 bg-stone-800 text-stone-200 rounded-full shadow-lg hover:bg-stone-700 transition-colors border border-stone-600 animate-in fade-in duration-300"
                        style={{ right: '-60px', top: '500px', transform: 'translateY(-50%)' }}
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
                    {(() => {
                        const visualPageCount = Math.ceil(pageCount / 2) * 2;
                        return (
                            <div className="absolute top-0 left-0 h-full pointer-events-none flex" style={{ width: `${visualPageCount * (PAGE_WIDTH + 40)}px` }}>
                                {Array.from({ length: visualPageCount }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-[#fbf4e9] shadow-xl rounded-sm journal-page"
                                        style={{
                                            width: `${PAGE_WIDTH}px`,
                                            height: `${PAGE_HEIGHT}px`,
                                            marginRight: '40px',
                                            flexShrink: 0,
                                            position: 'relative',
                                            scrollSnapAlign: 'start',
                                        }}
                                    >
                                        {/* Page Number */}
                                        <div className="absolute bottom-2 w-full text-center text-stone-400 text-xs font-serif">
                                            - {i + 1} -
                                        </div>

                                        {/* Binding Shadows */}
                                        <div className="absolute top-0 right-0 h-full w-[20px] bg-gradient-to-l from-black/5 to-transparent pointer-events-none" />
                                        <div className="absolute top-0 left-0 h-full w-[15px] bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

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
                                onClick={(e) => { e.stopPropagation(); setIsDrawingMode(false); setDrawStart(null); setDrawRect(null); }}
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
                        <style>{`
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                        /* IMPORTANT: The container width is PAGE_WIDTH (722px). 
                           The ProseMirror editor takes 100% of that WIDTH. 
                           Padding is INSIDE the editor, reducing content width to 602px (722 - 60*2).
                           Because box-sizing is border-box, width: 100% = 722px. 
                           This matches the column width perfectly. */
                        .ProseMirror {
                            box-sizing: border-box;
                            width: 100%;
                            height: 100%;
                            outline: none;
                            padding: 0 60px !important; 
                        }

                        /* 
                         * Removed the aggressive child margin override. 
                         * The padding on .ProseMirror (60px) is sufficient to constrain content.
                         * Allowing natural margins inside is safer.
                         */

                        .ProseMirror > * {
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                            max-width: none !important;
                        }    
                        .ProseMirror p {
                            break-inside: auto !important;
                            page-break-inside: auto !important;
                            widows: 1 !important;
                            orphans: 1 !important;
                            margin-bottom: 1em;
                            line-height: 1.6;
                        }

                        h1, h2, h3, .chapter-header-wrapper {
                            break-before: column;
                            break-after: avoid;
                            break-inside: avoid;
                            margin-top: 0; /* Reset top margin for first line alignment */
                        }
                        
                        /* On retire le break-before systématique sur h1/h2 si on veut juste contrôler le saut manuel, 
                           but for now I keep the "Chapter = New Page" behavior requested in the spec */
                        
                        /* Prevent images from being cut */
                        img, .book-image-view {
                            break-inside: avoid;
                            max-width: 100%;
                        }
                    `}</style>

                        <EditorContent editor={editor} className="w-full h-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};
