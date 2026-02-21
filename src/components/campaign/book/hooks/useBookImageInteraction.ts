import { useState, useRef, useEffect, useCallback } from 'react';
import { BookImageAttributes } from '../../../../extensions/bookImage';

export type InteractionMode = 'resize-left' | 'resize-right' | 'resize-top' | 'resize-bottom'
    | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br'
    | 'pan' | null;

interface UseBookImageInteractionProps {
    node: { attrs: BookImageAttributes };
    updateAttributes: (attrs: Partial<BookImageAttributes>) => void;
    containerRef: React.RefObject<HTMLDivElement>;
}

// Magnetic Snapping points
const SNAP_POINTS = [0.25, 0.333, 0.5, 0.75, 1];
const SNAP_THRESHOLD = 0.03; // 3%

export const useBookImageInteraction = ({ node, updateAttributes, containerRef }: UseBookImageInteractionProps) => {
    const [activeInteraction, setActiveInteraction] = useState<InteractionMode>(null);
    const startRef = useRef<{ x: number, y: number, w: number, h: number, px: number, py: number } | null>(null);
    const lastWidthRatioRef = useRef<number | null>(null);
    const updateAttrsRef = useRef(updateAttributes);
    updateAttrsRef.current = updateAttributes;
    const alignRef = useRef(node.attrs.align);
    alignRef.current = node.attrs.align;

    // Live values for the HUD display during drag (avoids React re-renders)
    const liveValues = useRef<{ width?: string; height?: string; posX?: number; posY?: number }>({});
    // Counter to force HUD re-render on RAF tick
    const [hudTick, setHudTick] = useState(0);
    const rafRef = useRef<number | null>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent, mode: InteractionMode) => {
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
        liveValues.current = {};
        setActiveInteraction(mode);
    }, [containerRef, node.attrs.posX, node.attrs.posY]);

    useEffect(() => {
        if (!activeInteraction) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!startRef.current || !containerRef.current) return;

            // Cancel any pending RAF to avoid stacking
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;
                if (!startRef.current || !containerRef.current) return;

                const deltaX = e.clientX - startRef.current.x;
                const deltaY = e.clientY - startRef.current.y;
                const el = containerRef.current;

                if (activeInteraction === 'pan') {
                    const sensitivity = 0.2;
                    const newPosX = Math.max(0, Math.min(100, startRef.current.px - (deltaX * sensitivity)));
                    const newPosY = Math.max(0, Math.min(100, startRef.current.py - (deltaY * sensitivity)));

                    // Apply directly to DOM — zero React re-renders
                    const img = el.querySelector('img');
                    if (img) {
                        img.style.objectPosition = `${newPosX}% ${newPosY}%`;
                    }
                    liveValues.current = { posX: newPosX, posY: newPosY };
                    setHudTick(t => t + 1);
                    return;
                }

                // Resizing logic — apply via DOM style
                const parentWidth = el.parentElement?.getBoundingClientRect().width || 1;

                const hasHorizontal = activeInteraction === 'resize-left' || activeInteraction === 'resize-right'
                    || activeInteraction === 'resize-tl' || activeInteraction === 'resize-tr'
                    || activeInteraction === 'resize-bl' || activeInteraction === 'resize-br';
                const hasVertical = activeInteraction === 'resize-top' || activeInteraction === 'resize-bottom'
                    || activeInteraction === 'resize-tl' || activeInteraction === 'resize-tr'
                    || activeInteraction === 'resize-bl' || activeInteraction === 'resize-br';

                if (hasHorizontal) {
                    const isLeftSide = activeInteraction === 'resize-left' || activeInteraction === 'resize-tl' || activeInteraction === 'resize-bl';
                    const effectiveDeltaX = isLeftSide ? -deltaX : deltaX;
                    const newWidthPx = Math.max(50, startRef.current.w + effectiveDeltaX);
                    let widthRatio = newWidthPx / parentWidth;
                    if (alignRef.current !== 'center') widthRatio = Math.min(0.55, widthRatio);
                    else widthRatio = Math.min(1, widthRatio);
                    widthRatio = Math.max(0.05, widthRatio);
                    lastWidthRatioRef.current = widthRatio;

                    const widthStr = `${Math.round(widthRatio * 100)}%`;
                    el.style.width = widthStr;
                    liveValues.current.width = widthStr;
                }

                if (hasVertical) {
                    const isTopSide = activeInteraction === 'resize-top' || activeInteraction === 'resize-tl' || activeInteraction === 'resize-tr';
                    const effectiveDeltaY = isTopSide ? -deltaY : deltaY;
                    const newHeightPx = Math.max(50, startRef.current.h + effectiveDeltaY);

                    const heightStr = `${Math.round(newHeightPx)}px`;
                    el.style.height = heightStr;
                    liveValues.current.height = heightStr;
                }

                setHudTick(t => t + 1);
            });
        };

        const handleMouseUp = () => {
            // Cancel any pending RAF
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }

            // Commit final values via a single updateAttributes call
            const finalUpdate: Partial<BookImageAttributes> = {};

            if (activeInteraction === 'pan' && liveValues.current.posX !== undefined) {
                finalUpdate.posX = liveValues.current.posX;
                finalUpdate.posY = liveValues.current.posY;
            } else if (activeInteraction?.startsWith('resize')) {
                // Snap-on-release: snap width to nearest magnetic point
                if (lastWidthRatioRef.current !== null) {
                    let snapped = false;
                    const ratio = lastWidthRatioRef.current;
                    for (const snap of SNAP_POINTS) {
                        if (Math.abs(ratio - snap) < SNAP_THRESHOLD) {
                            finalUpdate.width = `${Math.round(snap * 100)}%`;
                            snapped = true;
                            break;
                        }
                    }
                    if (!snapped && liveValues.current.width) {
                        finalUpdate.width = liveValues.current.width;
                    }
                }
                if (liveValues.current.height) {
                    finalUpdate.height = liveValues.current.height;
                }
            }

            if (Object.keys(finalUpdate).length > 0) {
                updateAttrsRef.current(finalUpdate);
            }

            // Reset container inline styles (ProseMirror will re-apply from attributes)
            if (containerRef.current) {
                containerRef.current.style.width = '';
                containerRef.current.style.height = '';
            }

            lastWidthRatioRef.current = null;
            liveValues.current = {};
            setActiveInteraction(null);
            startRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [activeInteraction, containerRef]);

    return {
        activeInteraction,
        handleMouseDown,
        startRef,
        liveValues,
        hudTick
    };
};
