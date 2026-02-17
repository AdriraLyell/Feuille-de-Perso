import React, { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { BookImageAttributes } from '../../../extensions/bookImage';
import {
    Image as ImageIcon, Loader, Type,
    Maximize2, Minimize2, ChevronUp, ChevronDown,
    Crop, Move, Trash2, MoreHorizontal,
    AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { getImage, deleteImage } from '../../../imageDB';
import { logger } from '../../../utils/logger';

interface BookImageViewProps {
    node: {
        attrs: BookImageAttributes;
    };
    updateAttributes: (attrs: Partial<BookImageAttributes>) => void;
    deleteNode: () => void;
    selected: boolean;
}

type InteractionMode = 'resize-left' | 'resize-right' | 'resize-top' | 'resize-bottom'
    | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br'
    | 'pan' | null;

const BookImageView: React.FC<BookImageViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditingCaption, setIsEditingCaption] = useState(false);
    const [isPanMode, setIsPanMode] = useState(false);
    const [activeInteraction, setActiveInteraction] = useState<InteractionMode>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [hudBelow] = useState(true); // Always below in CSS columns context to avoid overflow into previous column

    const containerRef = useRef<HTMLDivElement>(null);
    const startRef = useRef<{ x: number, y: number, w: number, h: number, px: number, py: number } | null>(null);
    const lastWidthRatioRef = useRef<number | null>(null);
    const updateAttrsRef = useRef(updateAttributes);
    updateAttrsRef.current = updateAttributes;
    const alignRef = useRef(node.attrs.align);
    alignRef.current = node.attrs.align;

    // Magnetic Snapping points
    const SNAP_POINTS = [0.25, 0.333, 0.5, 0.75, 1];
    const SNAP_THRESHOLD = 0.03; // 3%

    useEffect(() => {
        let active = true;
        const load = async () => {
            if (!node.attrs.imageId) return;
            if (node.attrs.imageId.startsWith('temp-')) return;

            setLoading(true);
            try {
                const blob = await getImage(node.attrs.imageId);
                if (blob && active) {
                    const url = URL.createObjectURL(blob);
                    setImageSrc(url);
                }
            } catch (e) {
                logger.error("Failed to load image", e);
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [node.attrs.imageId]);

    const handleMouseDown = (e: React.MouseEvent, mode: InteractionMode) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        startRef.current = {
            x: e.clientX,
            y: e.clientY,
            w: rect.width,
            h: rect.height,
            px: node.attrs.posX ?? 50,
            py: node.attrs.posY ?? 50,
        };
        setActiveInteraction(mode);
    };

    useEffect(() => {
        if (!activeInteraction) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!startRef.current || !containerRef.current) return;

            const deltaX = e.clientX - startRef.current.x;
            const deltaY = e.clientY - startRef.current.y;

            if (activeInteraction === 'pan') {
                const sensitivity = 0.2;
                const newPosX = Math.max(0, Math.min(100, startRef.current.px - (deltaX * sensitivity)));
                const newPosY = Math.max(0, Math.min(100, startRef.current.py - (deltaY * sensitivity)));

                updateAttrsRef.current({ posX: newPosX, posY: newPosY });
                return;
            }

            // Resizing logic — free resize (no snap during drag)
            const parentWidth = containerRef.current.parentElement?.getBoundingClientRect().width || 1;

            const hasHorizontal = activeInteraction === 'resize-left' || activeInteraction === 'resize-right'
                || activeInteraction === 'resize-tl' || activeInteraction === 'resize-tr'
                || activeInteraction === 'resize-bl' || activeInteraction === 'resize-br';
            const hasVertical = activeInteraction === 'resize-top' || activeInteraction === 'resize-bottom'
                || activeInteraction === 'resize-tl' || activeInteraction === 'resize-tr'
                || activeInteraction === 'resize-bl' || activeInteraction === 'resize-br';

            const update: Partial<BookImageAttributes> = {};

            if (hasHorizontal) {
                const isLeftSide = activeInteraction === 'resize-left' || activeInteraction === 'resize-tl' || activeInteraction === 'resize-bl';
                const effectiveDeltaX = isLeftSide ? -deltaX : deltaX;
                const newWidthPx = Math.max(50, startRef.current.w + effectiveDeltaX);
                let widthRatio = newWidthPx / parentWidth;
                if (alignRef.current !== 'center') widthRatio = Math.min(0.55, widthRatio);
                else widthRatio = Math.min(1, widthRatio);
                widthRatio = Math.max(0.05, widthRatio);
                lastWidthRatioRef.current = widthRatio;
                update.width = `${Math.round(widthRatio * 100)}%`;
            }

            if (hasVertical) {
                const isTopSide = activeInteraction === 'resize-top' || activeInteraction === 'resize-tl' || activeInteraction === 'resize-tr';
                const effectiveDeltaY = isTopSide ? -deltaY : deltaY;
                const newHeightPx = Math.max(50, startRef.current.h + effectiveDeltaY);
                update.height = `${Math.round(newHeightPx)}px`;
            }

            updateAttrsRef.current(update);
        };

        const handleMouseUp = () => {
            // Snap-on-release: snap width to nearest magnetic point
            if (activeInteraction && activeInteraction.startsWith('resize') && lastWidthRatioRef.current !== null) {
                const ratio = lastWidthRatioRef.current;
                for (const snap of SNAP_POINTS) {
                    if (Math.abs(ratio - snap) < SNAP_THRESHOLD) {
                        updateAttrsRef.current({ width: `${Math.round(snap * 100)}%` });
                        break;
                    }
                }
            }
            lastWidthRatioRef.current = null;
            setActiveInteraction(null);
            startRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [activeInteraction]);

    // Close advanced panel when deselected
    useEffect(() => {
        if (!selected) {
            setShowAdvanced(false);
            setIsPanMode(false);
        }
    }, [selected]);

    const handleDelete = async () => {
        if (node.attrs.imageId) {
            try {
                await deleteImage(node.attrs.imageId);
            } catch {
                // image may already be deleted
            }
        }
        deleteNode();
    };

    const isLateral = node.attrs.align === 'left' || node.attrs.align === 'right';
    const isFree = node.attrs.align === 'free';
    const isFloating = isLateral || isFree;

    const activeAlignClass = 'bg-indigo-50 border-indigo-300 text-indigo-700';
    const btnClass = 'hover:bg-indigo-50 p-1.5 rounded border border-stone-200 transition-colors';

    return (
        <NodeViewWrapper
            className={`book-image-view relative group ${isFloating ? 'mb-2' : 'mb-6'} ${activeInteraction ? '' : 'transition-all duration-300'}`}
            data-align={node.attrs.align}
            style={{
                float: isFree
                    ? (node.attrs.wrapSide === 'right' ? 'right' : 'left')
                    : (isLateral ? (node.attrs.align as any) : 'none'),
                width: isFree ? (node.attrs.width || 'fit-content') : (isLateral ? node.attrs.width : undefined),
                display: isFloating ? 'inline-block' : 'block',
                margin: isFloating
                    ? (isFree
                        ? (node.attrs.wrapSide === 'right' ? '0 0 0.5rem 1.5rem' : '0 1.5rem 0.5rem 0')
                        : (node.attrs.align === 'left' ? '0 1.5rem 0.5rem 0' : '0 0 0.5rem 1.5rem')
                    )
                    : '1.5rem auto',
                verticalAlign: 'top',
                textAlign: 'center',
                transform: 'none',
                zIndex: selected ? 200 : (isFree ? 100 : 'auto'),
                position: 'relative',
                // Correction 3: shape-outside pour le wrapping texte autour des images flottantes
                shapeOutside: isFloating ? 'margin-box' : undefined,
            } as React.CSSProperties}
        >
            {/* ===== IMAGE CONTROLS HUD — positionné au-dessus de l'image ===== */}
            {selected && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 content-ignore z-[250] pointer-events-auto"
                    style={hudBelow
                        ? { top: '100%', marginTop: '4px' }
                        : { bottom: '100%', marginBottom: '4px' }
                    }
                    onMouseDown={(e) => e.stopPropagation()}
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
                </div>
            )}

            {/* Image container */}
            <div
                ref={containerRef}
                className={`bg-transparent flex items-center justify-center text-stone-400 relative ${activeInteraction ? '' : 'transition-all duration-300'} ${selected ? 'ring-2 ring-indigo-500 rounded-sm' : ''}`}
                style={{
                    width: isLateral ? '100%' : (node.attrs.width || '100%'),
                    minHeight: '40px',
                    height: node.attrs.height === 'auto' && imageSrc ? 'auto' : (node.attrs.height === 'auto' ? '200px' : node.attrs.height),
                    boxShadow: selected
                        ? '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
                        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    borderRadius: '1px',
                    border: '5px solid white',
                    // Pour center : contraindre la largeur à l'intérieur du wrapper 100%
                    margin: !isFloating ? '0 auto' : undefined,
                    cursor: activeInteraction
                        ? (activeInteraction === 'resize-left' || activeInteraction === 'resize-right' ? 'col-resize'
                            : activeInteraction === 'resize-top' || activeInteraction === 'resize-bottom' ? 'row-resize'
                            : activeInteraction === 'resize-tl' || activeInteraction === 'resize-br' ? 'nwse-resize'
                            : activeInteraction === 'resize-tr' || activeInteraction === 'resize-bl' ? 'nesw-resize'
                            : 'move')
                        : (isPanMode ? 'move' : 'default')
                }}
                onMouseDown={isPanMode ? (e) => handleMouseDown(e, 'pan') : undefined}
            >
                {loading ? (
                    <div className="flex flex-col items-center gap-2 animate-pulse">
                        <Loader size={32} className="animate-spin" />
                        <span className="text-xs">Chargement...</span>
                    </div>
                ) : imageSrc ? (
                    <img
                        src={imageSrc}
                        alt={node.attrs.caption || 'Illustration'}
                        className={`w-full ${node.attrs.height === 'auto' ? 'h-auto' : 'h-full'} ${activeInteraction ? '' : 'transition-all duration-300'} rounded-[1px]`}
                        style={{
                            objectFit: node.attrs.fit || 'contain',
                            objectPosition: `${node.attrs.posX ?? 50}% ${node.attrs.posY ?? 50}%`,
                            maxHeight: '800px',
                            filter: node.attrs.filter === 'grayscale'
                                ? 'grayscale(100%) contrast(1.1)'
                                : 'none',
                            pointerEvents: isPanMode ? 'none' : 'auto'
                        }}
                        data-drag-handle={!isPanMode}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <ImageIcon size={32} />
                        <span className="text-xs">Image {node.attrs.imageId}</span>
                    </div>
                )}

                {/* Resize handles: 4 edge bars + 4 corner dots */}
                {selected && !isPanMode && (
                    <>
                        {/* Edge handles — thin bars centered on each edge */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 left-[-4px] w-[3px] h-[40%] bg-indigo-400/40 hover:bg-indigo-600 rounded-full cursor-col-resize z-[160] transition-colors"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
                            title="Redimensionner Largeur"
                        />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 right-[-4px] w-[3px] h-[40%] bg-indigo-400/40 hover:bg-indigo-600 rounded-full cursor-col-resize z-[160] transition-colors"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
                            title="Redimensionner Largeur"
                        />
                        <div
                            className="absolute left-1/2 -translate-x-1/2 top-[-4px] h-[3px] w-[40%] bg-indigo-400/40 hover:bg-indigo-600 rounded-full cursor-row-resize z-[160] transition-colors"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-top')}
                            title="Redimensionner Hauteur"
                        />
                        <div
                            className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] h-[3px] w-[40%] bg-indigo-400/40 hover:bg-indigo-600 rounded-full cursor-row-resize z-[160] transition-colors"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-bottom')}
                            title="Redimensionner Hauteur"
                        />

                        {/* Corner handles — round dots */}
                        <div
                            className="absolute top-[-5px] left-[-5px] w-[10px] h-[10px] bg-indigo-600 rounded-full border-2 border-white cursor-nwse-resize z-[161] shadow-md hover:scale-125 transition-transform"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-tl')}
                            title="Redimensionner"
                        />
                        <div
                            className="absolute top-[-5px] right-[-5px] w-[10px] h-[10px] bg-indigo-600 rounded-full border-2 border-white cursor-nesw-resize z-[161] shadow-md hover:scale-125 transition-transform"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-tr')}
                            title="Redimensionner"
                        />
                        <div
                            className="absolute bottom-[-5px] left-[-5px] w-[10px] h-[10px] bg-indigo-600 rounded-full border-2 border-white cursor-nesw-resize z-[161] shadow-md hover:scale-125 transition-transform"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-bl')}
                            title="Redimensionner"
                        />
                        <div
                            className="absolute bottom-[-5px] right-[-5px] w-[10px] h-[10px] bg-indigo-600 rounded-full border-2 border-white cursor-nwse-resize z-[161] shadow-md hover:scale-125 transition-transform"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-br')}
                            title="Redimensionner"
                        />
                    </>
                )}

                {/* Pan mode overlay */}
                {isPanMode && selected && (
                    <div className="absolute inset-[5px] pointer-events-none border-2 border-dashed border-indigo-400/50 flex items-center justify-center z-[110]">
                        <div className="bg-indigo-600/90 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg animate-bounce backdrop-blur-sm">
                            Maintenez et glissez pour cadrer
                        </div>
                    </div>
                )}

                {/* HUD for movement/resize feedback */}
                {selected && activeInteraction && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-[9px] px-2 py-0.5 rounded shadow-xl flex gap-3 whitespace-nowrap z-[200] border border-stone-600 backdrop-blur-md">
                        {(activeInteraction.startsWith('resize')) && (() => {
                            const hasH = activeInteraction === 'resize-left' || activeInteraction === 'resize-right'
                                || activeInteraction.includes('tl') || activeInteraction.includes('tr')
                                || activeInteraction.includes('bl') || activeInteraction.includes('br');
                            const hasV = activeInteraction === 'resize-top' || activeInteraction === 'resize-bottom'
                                || activeInteraction.includes('tl') || activeInteraction.includes('tr')
                                || activeInteraction.includes('bl') || activeInteraction.includes('br');
                            return (
                                <>
                                    {hasH && <span>W: {typeof node.attrs.width === 'string' && node.attrs.width.endsWith('%') ? node.attrs.width : Math.round(startRef.current?.w || 0) + 'px'}</span>}
                                    {hasV && node.attrs.height !== 'auto' && <span>H: {node.attrs.height}</span>}
                                </>
                            );
                        })()}
                        {activeInteraction === 'pan' && (
                            <>
                                <span>Pos X: {Math.round(node.attrs.posX || 0)}%</span>
                                <span>Pos Y: {Math.round(node.attrs.posY || 0)}%</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Caption — centrée sous l'image, contrainte à la largeur du conteneur */}
            {isEditingCaption ? (
                <div style={{ width: isLateral ? '100%' : (node.attrs.width || '100%'), margin: !isFloating ? '0 auto' : undefined }}>
                    <input
                        type="text"
                        defaultValue={node.attrs.caption}
                        placeholder="Légende de l'image..."
                        className="w-full text-center text-xs font-serif italic border-b border-stone-300 focus:border-stone-500 outline-none bg-transparent px-2 py-1 mt-1"
                        autoFocus
                        onBlur={(e) => {
                            updateAttributes({ caption: e.target.value });
                            setIsEditingCaption(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                updateAttributes({ caption: (e.target as HTMLInputElement).value });
                                setIsEditingCaption(false);
                            }
                        }}
                    />
                </div>
            ) : (
                node.attrs.caption && (
                    <div
                        className="text-center text-stone-500 text-xs italic mt-1 font-serif cursor-pointer hover:text-stone-700 transition-colors"
                        style={{ width: isLateral ? '100%' : (node.attrs.width || '100%'), margin: !isFloating ? '0 auto' : undefined }}
                        onClick={() => selected && setIsEditingCaption(true)}
                        title="Cliquer pour modifier"
                    >
                        {node.attrs.caption}
                    </div>
                )
            )}
        </NodeViewWrapper>
    );
};

export default BookImageView;
