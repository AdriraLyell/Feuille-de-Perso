import { useState, useRef, useEffect, useCallback } from 'react';
import { BookImageAttributes } from '../../../../extensions/bookImage';

export type InteractionMode = 'resize-left' | 'resize-right' | 'resize-top' | 'resize-bottom'
    | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br'
    | 'pan' | null;

interface UseBookImageInteractionProps {
    node: { attrs: BookImageAttributes };
    updateAttributes: (attrs: Partial<BookImageAttributes>) => void;
    /** Ref sur le div interne (image container) — utilisé pour la hauteur et le pan */
    containerRef: React.RefObject<HTMLDivElement | null>;
    /** Ref sur le NodeViewWrapper (.book-image-view) — utilisé pour la largeur des images flottantes */
    wrapperRef: React.RefObject<HTMLElement | null>;
}

// Magnetic Snapping points
const SNAP_POINTS = [0.25, 0.333, 0.5, 0.75, 1];
const SNAP_THRESHOLD = 0.03; // 3%

interface DragStart {
    x: number;
    y: number;
    /** Largeur initiale de l'élément ciblé (wrapper pour floats, container pour center) */
    w: number;
    /** Hauteur initiale du container */
    h: number;
    px: number;
    py: number;
    /** Largeur de la colonne ProseMirror mesurée au mousedown (inclut le padding réel via getComputedStyle) */
    colW: number;
}

export const useBookImageInteraction = ({ node, updateAttributes, containerRef, wrapperRef }: UseBookImageInteractionProps) => {
    const [activeInteraction, setActiveInteraction] = useState<InteractionMode>(null);
    const startRef = useRef<DragStart | null>(null);
    const lastWidthRatioRef = useRef<number | null>(null);
    const updateAttrsRef = useRef(updateAttributes);
    updateAttrsRef.current = updateAttributes;
    const alignRef = useRef(node.attrs.align);
    alignRef.current = node.attrs.align;

    // Live values pour le HUD (mis à jour par RAF, déclenche re-render minimal)
    const liveValues = useRef<{ width?: string; height?: string; posX?: number; posY?: number }>({});
    const [hudTick, setHudTick] = useState(0);
    const rafRef = useRef<number | null>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent, mode: InteractionMode) => {
        e.preventDefault();
        e.stopPropagation();

        const isFloat = alignRef.current === 'left' || alignRef.current === 'right' || alignRef.current === 'free';

        // Pour la largeur : mesurer l'élément flottant (wrapper) ou le container
        const targetEl = (isFloat && wrapperRef.current) ? wrapperRef.current : containerRef.current;
        const rect = targetEl?.getBoundingClientRect();
        if (!rect) return;

        // Mesurer la colonne ProseMirror UNE SEULE FOIS au mousedown
        // → lecture du padding réel via getComputedStyle, pas via une constante
        let colW = 0;
        const pm = wrapperRef.current?.closest('.ProseMirror') as HTMLElement | null;
        if (pm) {
            const style = getComputedStyle(pm);
            const padL = parseFloat(style.paddingLeft) || 0;
            const padR = parseFloat(style.paddingRight) || 0;
            colW = pm.getBoundingClientRect().width - padL - padR;
        }

        // Pour la hauteur : toujours mesurer le container interne
        const containerRect = containerRef.current?.getBoundingClientRect();

        startRef.current = {
            x: e.clientX,
            y: e.clientY,
            w: rect.width,
            h: containerRect?.height ?? rect.height,
            px: node.attrs.posX ?? 50,
            py: node.attrs.posY ?? 50,
            colW,
        };
        liveValues.current = {};
        setActiveInteraction(mode);
    }, [containerRef, wrapperRef, node.attrs.posX, node.attrs.posY]);

    useEffect(() => {
        if (!activeInteraction) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!startRef.current || !containerRef.current) return;

            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;
                if (!startRef.current || !containerRef.current) return;

                const deltaX = e.clientX - startRef.current.x;
                const deltaY = e.clientY - startRef.current.y;
                const el = containerRef.current!;

                // — Pan : toujours sur l'image (object-position)
                if (activeInteraction === 'pan') {
                    const sensitivity = 0.2;
                    const newPosX = Math.max(0, Math.min(100, startRef.current.px - (deltaX * sensitivity)));
                    const newPosY = Math.max(0, Math.min(100, startRef.current.py - (deltaY * sensitivity)));

                    const img = el.querySelector('img');
                    if (img) img.style.objectPosition = `${newPosX}% ${newPosY}%`;

                    liveValues.current = { posX: newPosX, posY: newPosY };
                    setHudTick(t => t + 1);
                    return;
                }

                const isFloat = alignRef.current === 'left' || alignRef.current === 'right' || alignRef.current === 'free';

                // Élément cible pour la LARGEUR : wrapper pour floats, container pour center
                const widthTargetEl = (isFloat && wrapperRef.current) ? wrapperRef.current : el;

                // Référentiel de largeur : colonne ProseMirror mesurée au mousedown
                // Fallback sur le parent de l'élément cible si colW non disponible
                const refWidth = (startRef.current.colW > 0)
                    ? startRef.current.colW
                    : (widthTargetEl.parentElement?.getBoundingClientRect().width || 1);

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

                    let widthRatio = newWidthPx / refWidth;
                    // Cap : 55% de la colonne pour les latéraux, 100% pour center
                    if (isFloat && alignRef.current !== 'free') {
                        widthRatio = Math.min(0.55, widthRatio);
                    } else {
                        widthRatio = Math.min(1, widthRatio);
                    }
                    widthRatio = Math.max(0.05, widthRatio);
                    lastWidthRatioRef.current = widthRatio;

                    const widthStr = `${Math.round(widthRatio * 100)}%`;
                    // Appliquer sur le bon élément — DOM direct, zéro re-render
                    widthTargetEl.style.width = widthStr;
                    liveValues.current.width = widthStr;
                }

                if (hasVertical) {
                    // La hauteur est toujours en px, toujours sur le container
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
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }

            const finalUpdate: Partial<BookImageAttributes> = {};

            if (activeInteraction === 'pan' && liveValues.current.posX !== undefined) {
                finalUpdate.posX = liveValues.current.posX;
                finalUpdate.posY = liveValues.current.posY;
            } else if (activeInteraction?.startsWith('resize')) {
                // Snap-on-release : arrondir la largeur aux points magnétiques
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

            // Nettoyer les styles inline — ProseMirror re-appliquera depuis les attributs
            if (containerRef.current) {
                containerRef.current.style.width = '';
                containerRef.current.style.height = '';
            }
            if (wrapperRef.current) {
                wrapperRef.current.style.width = '';
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
    }, [activeInteraction, containerRef, wrapperRef]);

    return {
        activeInteraction,
        handleMouseDown,
        startRef,
        liveValues,
        hudTick,
    };
};
