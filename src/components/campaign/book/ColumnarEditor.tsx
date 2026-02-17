import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import { getBookExtensions } from './extensions/bookExtensions';
import { PAGE_WIDTH, PAGE_HEIGHT } from '../constants';
import { BookTableOfContents } from './BookTableOfContents';
import { useBookTableOfContents } from './useBookTableOfContents';
import { useColumnarNavigation } from './hooks/useColumnarNavigation';
import { useColumnarDrawing } from './hooks/useColumnarDrawing';
import { Editor } from '@tiptap/react';
import { saveImage } from '../../../imageDB';

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
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [showColorPalette, setShowColorPalette] = useState(false);
    const [showHighlightPalette, setShowHighlightPalette] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const onUpdateRef = useRef(onUpdate);
    onUpdateRef.current = onUpdate;

    const editorOptions = useMemo(() => ({
        extensions: getBookExtensions(),
        editable: !readOnly,
        immediatelyRender: false,
        onUpdate: ({ editor }: { editor: Editor }) => {
            if (onUpdateRef.current) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    onUpdateRef.current?.(editor.getJSON());
                }, 1000);
            }
        },
    }), [readOnly]); // initialContent is only used once, readOnly is dynamic

    const editor = useEditor(editorOptions);

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
        <div className="w-full animate-in fade-in duration-700 flex flex-col items-center justify-start relative overflow-visible gap-4">

            {/* Editor Toolbar */}
            <div className="flex items-center gap-1 p-1 bg-stone-900/95 border border-stone-700/50 rounded-lg shadow-2xl mb-2 sticky top-0 z-[60] backdrop-blur-md">

                {/* Groupe 1: Texte */}
                <div className="flex items-center">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-2 rounded hover:bg-stone-700 transition-colors ${editor.isActive('bold') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                        title="Gras (Ctrl+B)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /></svg>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-2 rounded hover:bg-stone-700 transition-colors ${editor.isActive('italic') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                        title="Italique (Ctrl+I)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>
                    </button>
                    <button
                        onClick={() => (editor.chain().focus() as any).toggleUnderline().run()}
                        className={`p-2 rounded hover:bg-stone-700 transition-colors ${editor.isActive('underline') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                        title="Souligner (Ctrl+U)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" /><line x1="4" y1="21" x2="20" y2="21" /></svg>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={`p-2 rounded hover:bg-stone-700 transition-colors ${editor.isActive('strike') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                        title="Barré"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4" /><path d="M14 12a4 4 0 0 1 0 8H6" /><line x1="4" y1="12" x2="20" y2="12" /></svg>
                    </button>
                    <div className="relative flex items-center">
                        <button
                            onClick={() => setShowHighlightPalette(!showHighlightPalette)}
                            className={`p-2 rounded hover:bg-stone-700 transition-colors ${showHighlightPalette || editor.isActive('highlight') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                            title="Surligner (Aquarelle)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11-6 6v3h9l3-3" /><path d="m22 2-9 9" /><path d="m18 4 4 4" /></svg>
                        </button>

                        {showHighlightPalette && (
                            <div className="absolute top-full left-0 mt-2 p-2 bg-stone-900 border border-stone-700 rounded-lg shadow-2xl flex gap-2 z-[70] animate-in fade-in zoom-in duration-200">
                                {HIGHLIGHT_COLORS.map(({ name, color }) => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            editor.chain().focus().setHighlight({ color }).run();
                                            setShowHighlightPalette(false);
                                        }}
                                        className="w-6 h-6 rounded-full border border-stone-600 hover:scale-110 transition-transform shadow-inner"
                                        style={{ backgroundColor: color }}
                                        title={name}
                                    />
                                ))}
                                <button
                                    onClick={() => {
                                        editor.chain().focus().unsetHighlight().run();
                                        setShowHighlightPalette(false);
                                    }}
                                    className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
                                    title="Retirer le surlignage"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                        className="p-2 rounded hover:bg-red-900/40 text-stone-400 hover:text-red-400 transition-colors"
                        title="Effacer toute la mise en forme"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" /><path d="M22 21H7" /><path d="m5 11 9 9" /></svg>
                    </button>

                    {/* Palette de couleurs */}
                    <div className="relative flex items-center">
                        <button
                            onClick={() => setShowColorPalette(!showColorPalette)}
                            className={`p-2 rounded hover:bg-stone-700 transition-colors ${showColorPalette ? 'bg-stone-800 text-amber-400' : 'text-stone-300'}`}
                            title="Couleur de l'encre"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m12 19 7-7 3 3-7 7-3-3z" />
                                <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                                <path d="m2 2 5 2" />
                                <path d="m5 2 5 2" />
                                <path d="m2 5 2 5" />
                                <path d="m2 8 2 5" />
                            </svg>
                        </button>

                        {showColorPalette && (
                            <div className="absolute top-full left-0 mt-2 p-2 bg-stone-900 border border-stone-700 rounded-lg shadow-2xl flex gap-2 z-[70] animate-in fade-in zoom-in duration-200">
                                {INK_COLORS.map(({ name, color }) => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            editor.chain().focus().setColor(color).run();
                                            setShowColorPalette(false);
                                        }}
                                        className="w-6 h-6 rounded-full border border-stone-600 hover:scale-110 transition-transform shadow-inner"
                                        style={{ backgroundColor: color }}
                                        title={name}
                                    />
                                ))}
                                <button
                                    onClick={() => {
                                        editor.chain().focus().unsetColor().run();
                                        setShowColorPalette(false);
                                    }}
                                    className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
                                    title="Réinitialiser"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-px h-6 bg-stone-700/50 mx-1" />

                {/* Groupe 2: Mise en forme & Listes */}
                <div className="flex items-center">
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-2 rounded hover:bg-stone-700 transition-colors ${editor.isActive('bulletList') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                        title="Liste à puces"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`p-2 rounded hover:bg-stone-700 transition-colors ${editor.isActive('orderedList') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                        title="Liste numérotée"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></svg>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`p-2 rounded hover:bg-stone-700 transition-colors ${editor.isActive('blockquote') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                        title="Citation (Parchemin)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /></svg>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        className="p-2 rounded hover:bg-stone-700 transition-colors text-stone-300"
                        title="Ligne de séparation"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                </div>

                <div className="w-px h-6 bg-stone-700/50 mx-1" />

                {/* Groupe 3: Alignement & Image */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={`p-2 rounded hover:bg-stone-700 transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                        title="Aligner à gauche"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={`p-2 rounded hover:bg-stone-700 transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                        title="Aligner au centre"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="18" y1="18" x2="6" y2="18" /></svg>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                        className={`p-2 rounded hover:bg-stone-700 transition-colors ${editor.isActive({ textAlign: 'justify' }) ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                        title="Justifier"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="3" y2="18" /></svg>
                    </button>

                    <div className="w-px h-6 bg-stone-700/50 mx-1" />

                    <button
                        onClick={() => setIsDrawingMode(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all border font-serif font-bold text-[10px] uppercase h-8 ${isDrawingMode ? 'bg-amber-600 text-white border-amber-500 shadow-lg scale-105' : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border-stone-600'}`}
                        title="Insérer Image (Tracer une zone)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        Espace Image
                    </button>
                    <button
                        onClick={handleQuickInsertImage}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-all border font-serif font-bold text-[10px] uppercase h-8 bg-stone-800 text-stone-300 hover:bg-stone-700 border-stone-600"
                        title="Insertion rapide d'image au curseur"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" /><line x1="16" y1="5" x2="22" y2="5" /><line x1="19" y1="2" x2="19" y2="8" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                        Image
                    </button>
                </div>
            </div>

            {/* Spread Wrapper: Fixed width for exact button anchoring */}
            <div className="relative" style={{ width: `${PAGE_WIDTH * 2 + 40}px` }}>

                {/* Vertical Structural Sidebar (Chapters) */}
                <div
                    className="absolute z-50 flex flex-col items-center gap-3 p-2 bg-stone-900/90 border border-amber-600/30 rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-right-4 duration-500"
                    style={{ right: '-65px', top: '220px' }}
                >
                    <div className="text-[9px] font-serif font-bold text-amber-500/50 uppercase tracking-widest vertical-text py-2">
                        Chapitres
                    </div>
                    <div className="w-8 h-px bg-stone-700/50" />
                    <button
                        onClick={() => (editor.commands as any).setChapter()}
                        className="p-2.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-amber-400 transition-all border border-stone-700 hover:border-amber-600/50 shadow-lg group relative"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                        <div className="absolute right-full mr-3 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-[10px] text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                            Insérer Chapitre
                        </div>
                    </button>

                    <button
                        onClick={() => (editor.commands as any).appendChapter()}
                        className="p-2.5 rounded-lg bg-amber-600/20 text-amber-500 hover:bg-amber-600/40 transition-all border border-amber-600/30 hover:border-amber-500 shadow-lg group relative"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        <div className="absolute right-full mr-3 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-[10px] text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                            Nouveau Chapitre (Fin)
                        </div>
                    </button>
                </div>

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

                        /* Make TipTap node-view wrappers transparent for floated images
                           so that float works properly (text wraps, images can be side-by-side) */
                        .ProseMirror > [data-node-view-wrapper]:has(.book-image-view[data-align="left"]),
                        .ProseMirror > [data-node-view-wrapper]:has(.book-image-view[data-align="right"]),
                        .ProseMirror > [data-node-view-wrapper]:has(.book-image-view[data-align="free"]) {
                            display: contents;
                        }

                        /* Custom Rich Styles for Grimoire */
                        .journal-highlight {
                            background-color: #f59e0b40;
                            padding: 0 2px;
                            border-radius: 2px;
                            box-shadow: 0 0 5px #f59e0b20;
                        }

                        .ProseMirror blockquote {
                            border-left: 3px solid #b45309;
                            padding-left: 1.5rem;
                            margin: 1.5rem 0;
                            font-style: italic;
                            color: #444;
                            background: rgba(180, 83, 9, 0.03);
                            padding-top: 0.5rem;
                            padding-bottom: 0.5rem;
                            border-radius: 0 4px 4px 0;
                            position: relative;
                        }

                        .ProseMirror blockquote::before {
                            content: '"';
                            position: absolute;
                            left: 0.5rem;
                            top: -0.5rem;
                            font-size: 3rem;
                            color: #b4530920;
                            font-family: serif;
                        }

                        .ProseMirror hr {
                            border: none;
                            border-top: 1px solid #b4530930;
                            margin: 2rem auto;
                            width: 60%;
                            position: relative;
                        }

                        .ProseMirror hr::after {
                            content: '◈';
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background: #fbf4e9;
                            padding: 0 10px;
                            color: #b4530950;
                            font-size: 0.8rem;
                        }

                        .ProseMirror ul, .ProseMirror ol {
                            padding-left: 2rem;
                            margin-bottom: 1rem;
                        }

                        .ProseMirror ul {
                            list-style: none;
                        }

                        .ProseMirror ol {
                            list-style: decimal;
                            color: #b45309;
                        }

                        .ProseMirror ol li::marker {
                            font-weight: bold;
                        }

                        .ProseMirror li p {
                            color: #1c1917; /* Revert to stone-900 for text inside lists */
                        }

                        .ProseMirror ul li {
                            position: relative;
                        }

                        .ProseMirror ul li::before {
                            content: '•';
                            position: absolute;
                            left: -1.2rem;
                            color: #b45309;
                            font-size: 1.2rem;
                        }
                    `}</style>

                        <EditorContent editor={editor} className="w-full h-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};
