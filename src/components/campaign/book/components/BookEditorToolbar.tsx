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
    const FONTS = [
        { name: "Script de l'Érudit", value: null, label: 'Standard' },
        { name: "Plume du Barde", value: 'Dancing Script', class: 'font-dancing', label: 'Cursive fluide' },
        { name: "Lettre Royale", value: 'Great Vibes', class: 'font-vibes', label: 'Calligraphie' },
        { name: "Signature de l'Artiste", value: 'Pinyon Script', class: 'font-pinyon', label: 'Signature ancienne' },
    ];

    const [showFontPalette, setShowFontPalette] = React.useState(false);

    const Separator = () => (
        <div className="col-span-2 my-2 flex flex-col gap-0.5 opacity-60">
            <div className="border-t border-amber-500/40 w-full" />
            <div className="border-t border-amber-900/20 w-3/4 mx-auto" />
        </div>
    );

    return (
        <div className="grid grid-cols-2 gap-1 p-1">
            {/* SECTION 1: STYLE D'ÉCRITURE */}
            <div className="relative flex items-center justify-center col-span-2 mb-1">
                <button
                    onClick={() => setShowFontPalette(!showFontPalette)}
                    className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center shadow-xl ${showFontPalette ? 'bg-amber-600 text-white border-amber-300 scale-110' : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-amber-500 hover:border-amber-900/50 hover:bg-stone-800'}`}
                    title="Changer le style d'écriture"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" /><line x1="16" y1="8" x2="2" y2="22" /><line x1="17.5" y1="15" x2="9" y2="15" /></svg>
                </button>

                {showFontPalette && (
                    <div className="absolute top-0 right-full mr-4 w-56 p-2 bg-stone-950 border-2 border-amber-900/50 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[110] flex flex-col gap-1 animate-in fade-in zoom-in slide-in-from-right-2 duration-200">
                        <div className="px-3 py-1.5 mb-1 border-b border-stone-800/50 text-[10px] font-serif uppercase tracking-[0.2em] text-amber-500/80 font-bold bg-stone-900/30 rounded-t-lg">
                            Styles d'Écriture
                        </div>
                        {FONTS.map((f) => {
                            const isActive = editor.isActive('textStyle', { fontFamily: f.value }) || (!f.value && !editor.isActive('textStyle'));
                            return (
                                <button
                                    key={f.name}
                                    onClick={() => {
                                        if (f.value) {
                                            editor.chain().focus().setFontFamily(f.value).run();
                                        } else {
                                            editor.chain().focus().unsetFontFamily().run();
                                        }
                                        setShowFontPalette(false);
                                    }}
                                    className={`w-full text-left px-3 py-3 rounded-lg transition-all flex flex-col gap-0.5 relative overflow-hidden ${isActive ? 'bg-amber-900/40 ring-1 ring-amber-500/50 shadow-inner' : 'hover:bg-stone-800 text-stone-400 hover:text-stone-100'}`}
                                >
                                    <span className={`text-base leading-tight ${f.class || 'font-serif'} ${isActive ? 'text-amber-300' : ''}`}>
                                        {f.name}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-tighter opacity-40 font-sans">
                                        {f.label}
                                    </span>
                                    {isActive && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <Separator />

            {/* SECTION 2: MISE EN FORME */}
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded hover:bg-stone-700 transition-colors flex items-center justify-center ${editor.isActive('bold') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                title="Gras (Ctrl+B)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /></svg>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded hover:bg-stone-700 transition-colors flex items-center justify-center ${editor.isActive('italic') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                title="Italique (Ctrl+I)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>
            </button>
            <button
                onClick={() => (editor.chain().focus() as unknown as { toggleUnderline: () => { run: () => void } }).toggleUnderline().run()}
                className={`p-2 rounded hover:bg-stone-700 transition-colors flex items-center justify-center ${editor.isActive('underline') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                title="Souligner (Ctrl+U)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" /><line x1="4" y1="21" x2="20" y2="21" /></svg>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-2 rounded hover:bg-stone-700 transition-colors flex items-center justify-center ${editor.isActive('strike') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                title="Barré"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4" /><path d="M14 12a4 4 0 0 1 0 8H6" /><line x1="4" y1="12" x2="20" y2="12" /></svg>
            </button>
            <div className="relative flex items-center justify-center">
                <button
                    onClick={() => setShowHighlightPalette(!showHighlightPalette)}
                    className={`p-2 rounded hover:bg-stone-700 transition-colors flex items-center justify-center ${showHighlightPalette || editor.isActive('highlight') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                    title="Surligner (Aquarelle)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11-6 6v3h9l3-3" /><path d="m22 2-9 9" /><path d="m18 4 4 4" /></svg>
                </button>

                {showHighlightPalette && (
                    <div className="absolute top-0 right-full mr-2 p-2 bg-stone-900 border border-stone-700 rounded-lg shadow-2xl flex gap-2 z-[70] animate-in fade-in zoom-in slide-in-from-right-2 duration-200">
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

            <div className="relative flex items-center justify-center">
                <button
                    onClick={() => setShowColorPalette(!showColorPalette)}
                    className={`p-2 rounded hover:bg-stone-700 transition-colors flex items-center justify-center ${showColorPalette ? 'bg-stone-800 text-amber-400' : 'text-stone-300'}`}
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
                    <div className="absolute top-0 right-full mr-2 p-2 bg-stone-900 border border-stone-700 rounded-lg shadow-2xl flex gap-2 z-[70] animate-in fade-in zoom-in slide-in-from-right-2 duration-200">
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

            <button
                onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                className="col-span-2 p-2 rounded hover:bg-stone-700 transition-colors flex items-center justify-center text-stone-300"
                title="Effacer toute la mise en forme"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" /><path d="M22 21H7" /><path d="m5 11 9 9" /></svg>
            </button>

            <Separator />

            {/* SECTION 3: MISE EN PAGE */}
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded hover:bg-stone-700 transition-colors flex items-center justify-center ${editor.isActive('bulletList') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                title="Liste à puces"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded hover:bg-stone-700 transition-colors flex items-center justify-center ${editor.isActive('orderedList') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                title="Liste numérotée"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></svg>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded hover:bg-stone-700 transition-colors flex items-center justify-center ${editor.isActive('blockquote') ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                title="Citation (Parchemin)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /></svg>
            </button>
            <button
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className="p-2 rounded hover:bg-stone-700 transition-colors text-stone-300 flex items-center justify-center"
                title="Ligne de séparation"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-2 rounded hover:bg-stone-700 transition-colors flex items-center justify-center ${editor.isActive({ textAlign: 'left' }) ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                title="Aligner à gauche"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-2 rounded hover:bg-stone-700 transition-colors flex items-center justify-center ${editor.isActive({ textAlign: 'center' }) ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                title="Aligner au centre"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="18" y1="18" x2="6" y2="18" /></svg>
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={`col-span-2 p-2 rounded hover:bg-stone-700 transition-colors flex items-center justify-center ${editor.isActive({ textAlign: 'justify' }) ? 'text-amber-400 bg-stone-800' : 'text-stone-300'}`}
                title="Justifier"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="3" y2="18" /></svg>
            </button>

            <Separator />

            {/* SECTION 4: ENLUMINURES */}
            <button
                onClick={() => setIsDrawingMode(true)}
                className={`p-2 rounded transition-all border flex items-center justify-center ${isDrawingMode ? 'bg-amber-600 text-white border-amber-500 shadow-lg scale-105' : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border-stone-600'}`}
                title="Zone d'Image (Tracer une zone)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            </button>
            <button
                onClick={handleQuickInsertImage}
                className="p-2 rounded transition-all border bg-stone-800 text-stone-300 hover:bg-stone-700 border-stone-600 flex items-center justify-center"
                title="Image au curseur"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" /><line x1="16" y1="5" x2="22" y2="5" /><line x1="19" y1="2" x2="19" y2="8" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
            </button>
        </div>
    );
};
