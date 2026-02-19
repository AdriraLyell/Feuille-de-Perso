import React from 'react';
import { Editor } from '@tiptap/react';

interface BookEditorToolbarProps {
    editor: Editor;
    isDrawingMode: boolean;
    setIsDrawingMode: (mode: boolean) => void;
    showHighlightPalette: boolean;
    setShowHighlightPalette: (show: boolean) => void;
    showColorPalette: boolean;
    setShowColorPalette: (show: boolean) => void;
    handleQuickInsertImage: () => void;
    highlightColors: { name: string; color: string }[];
    inkColors: { name: string; color: string }[];
}

export const BookEditorToolbar: React.FC<BookEditorToolbarProps> = ({
    editor,
    isDrawingMode,
    setIsDrawingMode,
    showHighlightPalette,
    setShowHighlightPalette,
    showColorPalette,
    setShowColorPalette,
    handleQuickInsertImage,
    highlightColors,
    inkColors
}) => {
    return (
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
                            {highlightColors.map(({ name, color }) => (
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
                            {inkColors.map(({ name, color }) => (
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
    );
};
