import { useState, useRef, useEffect } from 'react';
import { BookImageAttributes } from '../../../../extensions/bookImage';

export type InteractionMode = 'resize-left' | 'resize-right' | 'resize-top' | 'resize-bottom'
    | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br'
    | 'pan' | null;

interface UseBookImageInteractionProps {
    node: { attrs: BookImageAttributes };
    updateAttributes: (attrs: Partial<BookImageAttributes>) => void;
    containerRef: React.RefObject<HTMLDivElement>;
}

export const useBookImageInteraction = ({ node, updateAttributes, containerRef }: UseBookImageInteractionProps) => {
    const [activeInteraction, setActiveInteraction] = useState<InteractionMode>(null);
    const startRef = useRef<{ x: number, y: number, w: number, h: number, px: number, py: number } | null>(null);
    const lastWidthRatioRef = useRef<number | null>(null);
    const updateAttrsRef = useRef(updateAttributes);
    updateAttrsRef.current = updateAttributes;
    const alignRef = useRef(node.attrs.align);
    alignRef.current = node.attrs.align;

    // Magnetic Snapping points
    const SNAP_POINTS = [0.25, 0.333, 0.5, 0.75, 1];
    const SNAP_THRESHOLD = 0.03; // 3%

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
    }, [activeInteraction, containerRef]);

    return {
        activeInteraction,
        handleMouseDown,
        startRef
    };
};
