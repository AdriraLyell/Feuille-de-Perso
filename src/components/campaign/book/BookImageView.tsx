import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NodeViewWrapper } from '@tiptap/react';
import { BookImageAttributes } from '../../../extensions/bookImage';
import { Image as ImageIcon, Loader, Move } from 'lucide-react';
import { deleteImage } from '../../../services/imageDB';
import { getCachedImageUrl, invalidateCachedImage } from '../../../services/ImageCacheService';
import { logger } from '../../../utils/logger';
import { useBookImageInteraction } from './hooks/useBookImageInteraction';
import BookImageToolbar from './parts/BookImageToolbar';
import BookImageResizeHandles from './parts/BookImageResizeHandles';

interface BookImageViewProps {
    node: {
        attrs: BookImageAttributes;
    };
    updateAttributes: (attrs: Partial<BookImageAttributes>) => void;
    deleteNode: () => void;
    selected: boolean;
}

const BookImageView: React.FC<BookImageViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditingCaption, setIsEditingCaption] = useState(false);
    const [isPanMode, setIsPanMode] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);


    const containerRef = useRef<HTMLDivElement>(null);
    // wrapperRef pointe sur le NodeViewWrapper (.book-image-view) — résolu via DOM au montage.
    // Utilisé pour le resize des images flottantes (L/R/free) afin d'appliquer la largeur
    // sur l'élément qui porte le float CSS, pas sur le div interne.
    const wrapperRef = useRef<HTMLElement | null>(null);
    useEffect(() => {
        if (containerRef.current) {
            const wrapper = containerRef.current.closest('.book-image-view') as HTMLElement | null;
            if (wrapper) wrapperRef.current = wrapper;
        }
    }, []);

    const { activeInteraction, handleMouseDown, startRef, liveValues, hudTick } = useBookImageInteraction({
        node,
        updateAttributes,
        containerRef,
        wrapperRef,
    });
    // hudTick is intentionally unused in render output — it triggers re-renders for the HUD display
    void hudTick;

    const [imageRect, setImageRect] = useState<DOMRect | null>(null);

    // Track image position for Portals (Toolbar & HUD)
    useEffect(() => {
        if (selected && containerRef.current) {
            const update = () => {
                if (containerRef.current) {
                    setImageRect(containerRef.current.getBoundingClientRect());
                }
            };

            update();

            // The scroll container is the one with .overflow-x-auto in ColumnarEditor
            const scroller = containerRef.current.closest('.overflow-x-auto');

            scroller?.addEventListener('scroll', update, { passive: true });
            window.addEventListener('resize', update, { passive: true });

            // Also update when activeInteraction changes (during resize)
            const obs = new ResizeObserver(update);
            obs.observe(containerRef.current);

            return () => {
                scroller?.removeEventListener('scroll', update);
                window.removeEventListener('resize', update);
                obs.disconnect();
            };
        } else {
            setImageRect(null);
        }
    }, [selected, activeInteraction]);

    useEffect(() => {
        let active = true;
        const load = async () => {
            if (!node.attrs.imageId) return;
            if (node.attrs.imageId.startsWith('temp-')) return;

            setLoading(true);
            try {
                const url = await getCachedImageUrl(node.attrs.imageId);
                if (url && active) {
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

    useEffect(() => {
        if (!selected) {
            setShowAdvanced(false);
            setIsPanMode(false);
        }
    }, [selected]);

    const handleDelete = async () => {
        if (node.attrs.imageId) {
            try {
                invalidateCachedImage(node.attrs.imageId);
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

    return (
        <NodeViewWrapper
            className={`book-image-view relative group ${isFloating ? 'mb-2' : 'mb-6'} ${activeInteraction ? '' : 'transition-all duration-300'}`}
            data-align={node.attrs.align}
            style={{
                float: isFree
                    ? (node.attrs.wrapSide === 'right' ? 'right' : 'left')
                    : (isLateral ? (node.attrs.align as 'left' | 'right' | 'none') : 'none'),
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
                shapeOutside: isFloating ? 'margin-box' : undefined,
            } as React.CSSProperties}
        >
            {selected && (
                <BookImageToolbar
                    node={node}
                    updateAttributes={updateAttributes}
                    handleDelete={handleDelete}
                    showAdvanced={showAdvanced}
                    setShowAdvanced={setShowAdvanced}
                    isPanMode={isPanMode}
                    setIsPanMode={setIsPanMode}
                    isEditingCaption={isEditingCaption}
                    setIsEditingCaption={setIsEditingCaption}
                    imageRect={imageRect}
                />
            )}

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
                    margin: !isFloating ? '0 auto' : undefined,
                    cursor: activeInteraction
                        ? (activeInteraction === 'resize-left' || activeInteraction === 'resize-right' ? 'col-resize'
                            : activeInteraction === 'resize-top' || activeInteraction === 'resize-bottom' ? 'row-resize'
                                : activeInteraction === 'resize-tl' || activeInteraction === 'resize-br' ? 'nwse-resize'
                                    : activeInteraction === 'resize-tr' || activeInteraction === 'resize-bl' ? 'nesw-resize'
                                        : 'move')
                        : (isPanMode ? 'move' : 'grab')
                }}
                onMouseDown={isPanMode ? (e) => handleMouseDown(e, 'pan') : undefined}
                data-drag-handle={!isPanMode}
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
                        draggable={false}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <ImageIcon size={32} />
                        <span className="text-xs">Image {node.attrs.imageId}</span>
                    </div>
                )}

                {/* Drag Indicator (Visual feedback for Phase 1) */}
                {!isPanMode && !activeInteraction && (
                    <div className="absolute top-3 left-3 p-1.5 bg-white/95 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[120] border border-indigo-200 transform -translate-y-1 group-hover:translate-y-0 flex items-center gap-2">
                        <Move size={14} className="text-indigo-600" />
                        <span className="text-[10px] font-medium text-stone-600 pr-1">Glisser pour déplacer</span>
                    </div>
                )}

                {selected && !isPanMode && (
                    <BookImageResizeHandles handleMouseDown={handleMouseDown} />
                )}

                {isPanMode && selected && (
                    <div className="absolute inset-[5px] pointer-events-none border-2 border-dashed border-indigo-400/50 flex items-center justify-center z-[110]">
                        <div className="bg-indigo-600/90 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg animate-bounce backdrop-blur-sm">
                            Maintenez et glissez pour cadrer
                        </div>
                    </div>
                )}

                {selected && activeInteraction && imageRect && createPortal(
                    <div
                        className="fixed z-[9999] bg-stone-800 text-white text-[9px] px-2 py-0.5 rounded shadow-xl flex gap-3 whitespace-nowrap border border-stone-600 backdrop-blur-md pointer-events-none"
                        style={{
                            left: imageRect.left + imageRect.width / 2,
                            top: imageRect.top - 8,
                            transform: 'translate(-50%, -100%)'
                        }}
                    >
                        {(activeInteraction.startsWith('resize')) && (() => {
                            const hasH = activeInteraction === 'resize-left' || activeInteraction === 'resize-right'
                                || activeInteraction.includes('tl') || activeInteraction.includes('tr')
                                || activeInteraction.includes('bl') || activeInteraction.includes('br');
                            const hasV = activeInteraction === 'resize-top' || activeInteraction === 'resize-bottom'
                                || activeInteraction.includes('tl') || activeInteraction.includes('tr')
                                || activeInteraction.includes('bl') || activeInteraction.includes('br');
                            const displayW = liveValues.current.width || node.attrs.width;
                            const displayH = liveValues.current.height || node.attrs.height;
                            return (
                                <>
                                    {hasH && <span>W: {typeof displayW === 'string' && displayW.endsWith('%') ? displayW : Math.round(startRef.current?.w || 0) + 'px'}</span>}
                                    {hasV && displayH !== 'auto' && <span>H: {displayH}</span>}
                                </>
                            );
                        })()}
                        {activeInteraction === 'pan' && (
                            <>
                                <span>Pos X: {Math.round(liveValues.current.posX ?? node.attrs.posX ?? 0)}%</span>
                                <span>Pos Y: {Math.round(liveValues.current.posY ?? node.attrs.posY ?? 0)}%</span>
                            </>
                        )}
                    </div>,
                    document.body
                )}
            </div>

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
