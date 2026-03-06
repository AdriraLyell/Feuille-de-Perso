import React from 'react';
import { createPortal } from 'react-dom';
import {
    AlignLeft, AlignCenter, AlignRight,
    Trash2, MoreHorizontal, Move,
    Minimize2, Maximize2, Crop,
    ChevronDown, ChevronUp, Type
} from 'lucide-react';
import { BookImageAttributes } from '../../../../extensions/bookImage';

interface BookImageToolbarProps {
    node: { attrs: BookImageAttributes };
    updateAttributes: (attrs: Partial<BookImageAttributes>) => void;
    handleDelete: () => void;
    showAdvanced: boolean;
    setShowAdvanced: (show: boolean) => void;
    isPanMode: boolean;
    setIsPanMode: (mode: boolean) => void;
    isEditingCaption: boolean;
    setIsEditingCaption: (editing: boolean) => void;
    imageRect: DOMRect | null;
}

const BookImageToolbar: React.FC<BookImageToolbarProps> = ({
    node,
    updateAttributes,
    handleDelete,
    showAdvanced,
    setShowAdvanced,
    isPanMode,
    setIsPanMode,
    isEditingCaption,
    setIsEditingCaption,
    imageRect
}) => {
    const isFree = node.attrs.align === 'free';
    const activeAlignClass = 'bg-indigo-50 border-indigo-300 text-indigo-700';
    const btnClass = 'hover:bg-indigo-50 p-1.5 rounded border border-stone-200 transition-colors';

    const toolbarStyle = React.useMemo(() => {
        if (!imageRect) return { left: 0, top: 0, placement: 'below' as const };

        const centerX = imageRect.left + imageRect.width / 2;
        // Space needed for Level 1 + Level 2 approx 250px
        const neededSpace = showAdvanced ? 280 : 60;

        let top = imageRect.bottom + 4;
        let placement: 'above' | 'below' = 'below';

        // If not enough space below, put above
        if (window.innerHeight - imageRect.bottom < neededSpace) {
            top = imageRect.top - 4;
            placement = 'above';
        }

        return { left: centerX, top, placement };
    }, [imageRect, showAdvanced]);

    if (!imageRect) return null;

    return createPortal(
        <div
            className="fixed z-[9999] flex flex-col items-center gap-1 content-ignore pointer-events-auto"
            style={{
                left: toolbarStyle.left,
                top: toolbarStyle.top,
                transform: `translateX(-50%) ${toolbarStyle.placement === 'above' ? 'translateY(-100%)' : ''}`,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            role="toolbar"
            aria-label="Barre d'outils d'image"
        >
            {/* === NIVEAU 1 : Contrôles essentiels === */}
            <div className="bg-white/95 p-1 rounded-lg shadow-md flex items-center gap-0.5 border border-stone-200 backdrop-blur-sm whitespace-nowrap">
                <button
                    className={`${btnClass} ${(node.attrs.align === 'left' || (isFree && node.attrs.wrapSide === 'left')) ? activeAlignClass : ''}`}
                    onClick={() => updateAttributes(isFree ? { wrapSide: 'left' } : { align: 'left' })}
                    title="Aligner à gauche"
                >
                    <AlignLeft size={14} />
                </button>
                <button
                    className={`${btnClass} ${node.attrs.align === 'center' ? activeAlignClass : ''}`}
                    onClick={() => updateAttributes({ align: 'center' })}
                    title="Centrer"
                >
                    <AlignCenter size={14} />
                </button>
                <button
                    className={`${btnClass} ${(node.attrs.align === 'right' || (isFree && node.attrs.wrapSide === 'right')) ? activeAlignClass : ''}`}
                    onClick={() => updateAttributes(isFree ? { wrapSide: 'right' } : { align: 'right' })}
                    title="Aligner à droite"
                >
                    <AlignRight size={14} />
                </button>

                <div className="w-px h-5 bg-stone-200 mx-0.5" />

                <button
                    className="hover:bg-red-50 p-1.5 rounded border border-stone-200 text-stone-400 hover:text-red-500 hover:border-red-300 transition-colors"
                    onClick={handleDelete}
                    title="Supprimer l'image"
                >
                    <Trash2 size={14} />
                </button>

                <div className="w-px h-5 bg-stone-200 mx-0.5" />

                <button
                    className={`${btnClass} ${showAdvanced ? 'bg-stone-100 border-stone-300' : ''}`}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    title="Options avancées"
                >
                    <MoreHorizontal size={14} />
                </button>
            </div>

            {/* === NIVEAU 2 : Options avancées (dropdown vers le bas) === */}
            {showAdvanced && (
                <div className="bg-white/95 p-2 rounded-lg shadow-md border border-stone-200 backdrop-blur-sm flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200 min-w-[180px]">
                    {/* Déplacement libre */}
                    <div className="flex items-center gap-2">
                        <button
                            className={`${btnClass} flex items-center gap-1.5 text-[11px] ${isFree ? activeAlignClass : ''}`}
                            onClick={() => {
                                if (isFree) {
                                    updateAttributes({ align: node.attrs.wrapSide || 'left' });
                                } else {
                                    const update: Partial<BookImageAttributes> = {
                                        align: 'free',
                                        wrapSide: node.attrs.align === 'right' ? 'right' : 'left'
                                    };
                                    if (node.attrs.width === '100%') update.width = '50%';
                                    updateAttributes(update);
                                }
                            }}
                            title="Déplacement libre"
                        >
                            <Move size={12} />
                            <span>Libre</span>
                        </button>
                    </div>

                    <div className="h-px bg-stone-100" />

                    {/* Noir & Blanc */}
                    <button
                        className={`${btnClass} flex items-center gap-1.5 text-[11px] w-full justify-start ${node.attrs.filter === 'grayscale' ? activeAlignClass : ''}`}
                        onClick={() => updateAttributes({ filter: node.attrs.filter === 'grayscale' ? 'none' : 'grayscale' })}
                        title="Noir & Blanc"
                    >
                        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-white to-black border border-stone-300 flex-shrink-0" />
                        <span>Noir & Blanc</span>
                    </button>

                    {/* Mode Ajustement */}
                    <button
                        className={`${btnClass} flex items-center gap-1.5 text-[11px] w-full justify-start ${node.attrs.fit === 'cover' ? activeAlignClass : ''}`}
                        onClick={() => updateAttributes({ fit: node.attrs.fit === 'cover' ? 'contain' : 'cover' })}
                        title={node.attrs.fit === 'cover' ? "Passer en mode Ajuster" : "Passer en mode Remplir"}
                    >
                        {node.attrs.fit === 'cover' ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                        <span>{node.attrs.fit === 'cover' ? 'Ajuster' : 'Remplir'}</span>
                    </button>

                    {/* Recadrage */}
                    <button
                        className={`${btnClass} flex items-center gap-1.5 text-[11px] w-full justify-start ${isPanMode ? 'bg-indigo-600 text-white border-indigo-700' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsPanMode(!isPanMode);
                        }}
                        title={node.attrs.height === 'auto' ? "Recadrage impossible en hauteur auto" : "Recadrer l'image"}
                        disabled={node.attrs.fit !== 'cover' || node.attrs.height === 'auto'}
                    >
                        <Crop size={12} />
                        <span>Recadrer</span>
                    </button>

                    <div className="h-px bg-stone-100" />

                    {/* Hauteur */}
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-stone-500 w-12 flex-shrink-0">Hauteur</span>
                        <button
                            className="hover:bg-indigo-50 p-0.5 rounded border border-stone-200"
                            onClick={() => {
                                const h = node.attrs.height === 'auto' ? 200 : parseInt(String(node.attrs.height));
                                updateAttributes({ height: `${Math.max(50, h - 40)}px` });
                            }}
                            title="Diminuer la hauteur"
                        >
                            <ChevronDown size={12} />
                        </button>
                        <span className="text-[10px] text-stone-600 font-mono min-w-[40px] text-center">
                            {node.attrs.height === 'auto' ? 'Auto' : node.attrs.height}
                        </span>
                        <button
                            className="hover:bg-indigo-50 p-0.5 rounded border border-stone-200"
                            onClick={() => {
                                const h = node.attrs.height === 'auto' ? 200 : parseInt(String(node.attrs.height));
                                updateAttributes({ height: `${h + 40}px` });
                            }}
                            title="Augmenter la hauteur"
                        >
                            <ChevronUp size={12} />
                        </button>
                        <button
                            className="hover:bg-amber-50 p-0.5 rounded text-[9px] px-1.5 border border-stone-200 text-stone-500 ml-auto"
                            onClick={() => updateAttributes({ height: 'auto', posX: 50, posY: 50 })}
                            title="Hauteur automatique"
                            disabled={node.attrs.height === 'auto'}
                        >
                            Auto
                        </button>
                    </div>

                    <div className="h-px bg-stone-100" />

                    {/* Légende */}
                    <button
                        className={`${btnClass} flex items-center gap-1.5 text-[11px] w-full justify-start`}
                        onClick={() => setIsEditingCaption(!isEditingCaption)}
                        title="Modifier la légende"
                    >
                        <Type size={12} />
                        <span>Légende</span>
                    </button>
                </div>
            )}
        </div>,
        document.body
    );
};

export default BookImageToolbar;
