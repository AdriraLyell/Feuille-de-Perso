import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { PAGE_WIDTH, PAGE_HEIGHT } from '../constants';
import { ChapterHeading } from '../../../extensions/chapterHeading';

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

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Image,
            ChapterHeading,
            TextAlign.configure({
                types: ['heading', 'paragraph', 'chapterHeading'],
            }),
            Placeholder.configure({
                placeholder: 'Écrivez votre récit ici...',
            }),
        ],
        content: initialContent,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            if (onUpdate) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    onUpdate(editor.getJSON());
                }, 1000);
            }
        },
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [pageCount, setPageCount] = React.useState(1);
    const [scrollPos, setScrollPos] = React.useState(0);

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
            const scrollWidth = contentRef.current.scrollWidth;
            const stride = PAGE_WIDTH + 40;
            const pages = Math.max(1, Math.ceil(scrollWidth / stride));
            if (pages !== pageCount) {
                setPageCount(pages);
            }
            setScrollPos(containerRef.current.scrollLeft);
        };

        const handleScroll = () => {
            if (containerRef.current) {
                setScrollPos(containerRef.current.scrollLeft);
            }
        };

        checkScroll();
        const observer = new ResizeObserver(checkScroll);
        if (contentRef.current) {
            observer.observe(contentRef.current);
        }

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
        }

        if (editor) {
            editor.on('update', checkScroll);
            editor.on('selectionUpdate', checkScroll);
        }

        return () => {
            observer.disconnect();
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
            if (editor) {
                editor.off('update', checkScroll);
                editor.off('selectionUpdate', checkScroll);
            }
        };
    }, [editor, pageCount]);


    if (!editor) {
        return null;
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
                    onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                    const result = e.target?.result as string;
                                    editor.chain().focus().setImage({ src: result }).run();
                                };
                                reader.readAsDataURL(file);
                            }
                        };
                        input.click();
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors border border-stone-600 font-serif font-bold text-xs uppercase"
                    title="Insérer Image"
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
                    {/* Visual Background/Decoration Track: Individual Page Cards */}
                    {(() => {
                        const visualPageCount = Math.ceil(pageCount / 2) * 2;
                        return (
                            <div className="absolute top-0 left-0 h-full pointer-events-none flex" style={{ width: `${visualPageCount * (PAGE_WIDTH + 40)}px` }}>
                                {Array.from({ length: visualPageCount }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-[#fbf4e9] shadow-xl rounded-sm"
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

                    <div
                        ref={contentRef}
                        className="text-stone-900 box-border relative z-10 no-scrollbar max-w-none"
                        style={{
                            position: 'absolute',
                            top: '60px',
                            left: '0',
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
                            display: block;
                        }
                    `}</style>

                        <EditorContent editor={editor} className="w-full h-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};
