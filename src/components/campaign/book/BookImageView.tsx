import React, { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { BookImageAttributes } from '../../../extensions/bookImage';
import { Image as ImageIcon, Loader, Type, Maximize2, Minimize2, ChevronUp, ChevronDown, Crop } from 'lucide-react';
import { getImage } from '../../../imageDB';
import { logger } from '../../../utils/logger';

interface BookImageViewProps {
    node: {
        attrs: BookImageAttributes;
    };
    updateAttributes: (attrs: Partial<BookImageAttributes>) => void;
    selected: boolean;
}

type InteractionMode = 'resize-h' | 'resize-v' | 'resize-both' | 'pan' | null;

const BookImageView: React.FC<BookImageViewProps> = ({ node, updateAttributes, selected }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditingCaption, setIsEditingCaption] = useState(false);
    const [isPanMode, setIsPanMode] = useState(false);
    const [activeInteraction, setActiveInteraction] = useState<InteractionMode>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const startRef = useRef<{ x: number, y: number, w: number, h: number, px: number, py: number } | null>(null);

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
            py: node.attrs.posY ?? 50
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
                // Panning logic: move image inside. 
                // We use pixel to % conversion. This is approximate but works for feedback.
                // 1% of movement = 1% shift or something similar.
                const sensitivity = 0.2; // Adjust for smoothness
                const newPosX = Math.max(0, Math.min(100, startRef.current.px - (deltaX * sensitivity)));
                const newPosY = Math.max(0, Math.min(100, startRef.current.py - (deltaY * sensitivity)));

                updateAttributes({ posX: newPosX, posY: newPosY });
                return;
            }

            // Resizing logic
            const parentWidth = containerRef.current.parentElement?.getBoundingClientRect().width || 1;
            let newWidthPx = startRef.current.w + deltaX;
            let newHeightPx = startRef.current.h + deltaY;

            newWidthPx = Math.max(50, newWidthPx);
            newHeightPx = Math.max(50, newHeightPx);

            let widthRatio = newWidthPx / parentWidth;

            if (activeInteraction === 'resize-h' || activeInteraction === 'resize-both') {
                if (node.attrs.align !== 'center') {
                    widthRatio = Math.min(0.55, widthRatio);
                } else {
                    widthRatio = Math.min(1, widthRatio);
                }

                for (const snap of SNAP_POINTS) {
                    if (Math.abs(widthRatio - snap) < SNAP_THRESHOLD) {
                        widthRatio = snap;
                        break;
                    }
                }
            } else {
                widthRatio = startRef.current.w / parentWidth;
            }

            const finalWidth = `${Math.round(widthRatio * 100)}%`;
            const finalHeight = activeInteraction === 'resize-h'
                ? `${Math.round(startRef.current.h)}px`
                : `${Math.round(newHeightPx)}px`;

            const update: Partial<BookImageAttributes> = {};
            if (activeInteraction === 'resize-h' || activeInteraction === 'resize-both') update.width = finalWidth;
            if (activeInteraction === 'resize-v' || activeInteraction === 'resize-both') update.height = finalHeight;

            updateAttributes(update);
        };

        const handleMouseUp = () => {
            setActiveInteraction(null);
            startRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [activeInteraction, node.attrs.align, updateAttributes]);

    const isLateral = node.attrs.align !== 'center';

    return (
        <NodeViewWrapper
            className={`book-image-view relative group mb-6 transition-all duration-300 ${selected ? 'ring-2 ring-indigo-500 rounded' : ''}`}
            data-align={node.attrs.align}
            style={{
                float: isLateral ? (node.attrs.align as any) : 'none',
                width: isLateral ? node.attrs.width : '100%',
                display: isLateral ? 'inline-block' : 'block',
                margin: isLateral
                    ? (node.attrs.align === 'left' ? '0 1.5rem 0.5rem 0' : '0 0 0.5rem 1.5rem')
                    : '1.5rem auto',
                clear: isLateral ? 'none' : 'both',
                textAlign: 'center'
            }}
        >
            <div
                ref={containerRef}
                className="inline-block bg-transparent flex items-center justify-center text-stone-400 relative transition-shadow duration-300"
                style={{
                    width: isLateral ? '100%' : (node.attrs.width || '100%'),
                    minHeight: '40px',
                    height: node.attrs.height === 'auto' && imageSrc ? 'auto' : (node.attrs.height === 'auto' ? '200px' : node.attrs.height),
                    boxShadow: selected
                        ? '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
                        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    borderRadius: '1px',
                    border: '5px solid white',
                    cursor: activeInteraction
                        ? (activeInteraction === 'resize-h' ? 'col-resize' : activeInteraction === 'resize-v' ? 'row-resize' : activeInteraction === 'pan' ? 'move' : 'nwse-resize')
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
                        className={`w-full ${node.attrs.height === 'auto' ? 'h-auto' : 'h-full'} transition-all duration-300 rounded-[1px]`}
                        style={{
                            objectFit: node.attrs.fit || 'contain',
                            objectPosition: `${node.attrs.posX ?? 50}% ${node.attrs.posY ?? 50}%`,
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



                {selected && !isPanMode && (
                    <>
                        {/* Corner Handle (Diagonal) */}
                        <div
                            className="absolute bottom-[-8px] right-[-8px] w-4 h-4 bg-indigo-600 rounded-full border-2 border-white cursor-nwse-resize z-[160] shadow-md hover:scale-125 transition-transform active:scale-100"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-both')}
                            title="Redimensionner Largeur & Hauteur"
                        />
                        {/* Right Handle (Horizontal) */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 right-[-6px] w-1.5 h-1/2 bg-indigo-400/50 hover:bg-indigo-600 rounded-full cursor-col-resize z-[160] transition-colors"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-h')}
                            title="Redimensionner Largeur"
                        />
                        {/* Bottom Handle (Vertical) */}
                        <div
                            className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-1/2 h-1.5 bg-indigo-400/50 hover:bg-indigo-600 rounded-full cursor-row-resize z-[160] transition-colors"
                            onMouseDown={(e) => handleMouseDown(e, 'resize-v')}
                            title="Redimensionner Hauteur"
                        />
                    </>
                )}

                {isPanMode && selected && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-indigo-400/50 flex items-center justify-center">
                        <div className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                            Maintenez et glissez pour cadrer
                        </div>
                    </div>
                )}
            </div>

            {selected && (
                <div
                    className="absolute top-2 right-2 flex flex-wrap justify-end gap-1 content-ignore z-[150] max-w-[200%] pointer-events-auto"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="bg-white/90 p-1 rounded shadow-sm flex gap-1 border border-stone-100 pb-1">
                        <button className="hover:bg-indigo-50 p-1 rounded text-xs px-2 border border-stone-200" onClick={() => updateAttributes({ align: 'left' })}>L</button>
                        <button className="hover:bg-indigo-50 p-1 rounded text-xs px-2 border border-stone-200" onClick={() => updateAttributes({ align: 'center' })}>C</button>
                        <button className="hover:bg-indigo-50 p-1 rounded text-xs px-2 border border-stone-200" onClick={() => updateAttributes({ align: 'right' })}>R</button>
                    </div>
                    <div className="bg-white/90 p-1 rounded shadow-sm flex gap-1 border border-stone-100 pb-1">
                        <button
                            className={`hover:bg-indigo-50 p-1 rounded text-xs px-2 border border-stone-200 ${node.attrs.filter === 'grayscale' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : ''}`}
                            onClick={() => updateAttributes({ filter: node.attrs.filter === 'grayscale' ? 'none' : 'grayscale' })}
                            title="Noir & Blanc"
                        >
                            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-white to-black border border-stone-300" />
                        </button>
                        <button
                            className={`hover:bg-indigo-50 p-1 rounded text-xs px-2 border border-stone-200 ${isPanMode ? 'bg-indigo-600 text-white border-indigo-700' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsPanMode(!isPanMode);
                            }}
                            title="Mode Recadrage (Faire glisser l'image)"
                            disabled={node.attrs.fit !== 'cover'}
                        >
                            <Crop size={12} />
                        </button>
                    </div>
                    <div className="bg-white/90 p-1 rounded shadow-sm flex gap-1 border border-stone-100 pb-1">
                        <button
                            className="hover:bg-indigo-50 p-1 rounded text-xs px-2 border border-stone-200"
                            onClick={() => setIsEditingCaption(!isEditingCaption)}
                            title="Modifier la légende"
                        >
                            <Type size={12} />
                        </button>
                    </div>

                    <div className="bg-white/90 p-1 rounded shadow-sm flex gap-1 border border-stone-100 pb-1">
                        <button
                            className={`hover:bg-indigo-50 p-1 rounded text-xs px-2 border border-stone-200 ${node.attrs.fit === 'cover' ? 'bg-indigo-50 border-indigo-300' : ''}`}
                            onClick={() => updateAttributes({ fit: node.attrs.fit === 'cover' ? 'contain' : 'cover' })}
                            title={node.attrs.fit === 'cover' ? "Passer en mode Ajuster (Contain)" : "Passer en mode Remplir (Cover)"}
                        >
                            {node.attrs.fit === 'cover' ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                        </button>
                        <div className="flex flex-col border-l border-stone-200 pl-1">
                            <button
                                className="hover:bg-indigo-50 px-1 rounded text-[8px] leading-none h-1/2"
                                onClick={() => {
                                    const h = node.attrs.height === 'auto' ? 200 : parseInt(String(node.attrs.height));
                                    updateAttributes({ height: `${h + 40}px` });
                                }}
                                title="Augmenter la hauteur"
                            >
                                <ChevronUp size={10} />
                            </button>
                            <button
                                className="hover:bg-indigo-50 px-1 rounded text-[8px] leading-none h-1/2"
                                onClick={() => {
                                    const h = node.attrs.height === 'auto' ? 200 : parseInt(String(node.attrs.height));
                                    updateAttributes({ height: `${Math.max(50, h - 40)}px` });
                                }}
                                title="Diminuer la hauteur"
                            >
                                <ChevronDown size={10} />
                            </button>
                        </div>
                        <button
                            className="hover:bg-amber-50 p-1 rounded text-[10px] px-1 border border-stone-200 text-stone-500"
                            onClick={() => updateAttributes({ height: 'auto', posX: 50, posY: 50 })}
                            title="Hauteur automatique (Réinitialise aussi le cadrage)"
                            disabled={node.attrs.height === 'auto'}
                        >
                            Auto
                        </button>
                    </div>
                </div>
            )}

            {isEditingCaption ? (
                <div className="mt-2 w-full max-w-[80%] mx-auto">
                    <input
                        type="text"
                        defaultValue={node.attrs.caption}
                        placeholder="Légende de l'image..."
                        className="w-full text-center text-xs font-serif italic border-b border-stone-300 focus:border-stone-500 outline-none bg-transparent px-2 py-1"
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
                        className="text-center text-stone-500 text-xs italic mt-2 font-serif cursor-pointer hover:text-stone-700 transition-colors"
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
