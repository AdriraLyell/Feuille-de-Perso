import React, { useLayoutEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PortalTooltipProps {
    anchorRef: React.RefObject<HTMLElement | null>;
    isOpen: boolean;
    title?: string;
    children: React.ReactNode;
    maxWidth?: number;
}

/**
 * Tooltip using React Portals to avoid clipping by parent containers with overflow:hidden/auto.
 * Automatically flips position (above/below) if near the viewport edges.
 */
export const PortalTooltip: React.FC<PortalTooltipProps> = ({
    anchorRef,
    isOpen,
    title,
    children,
    maxWidth = 200
}) => {
    const [coords, setCoords] = useState<{ top: number; left: number; position: 'top' | 'bottom' }>({ top: 0, left: 0, position: 'top' });
    const tooltipRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (isOpen && anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const viewportHeight = window.innerHeight;

            // Estimated height of tooltip (approximate if not yet rendered)
            // We use a safe margin of 100px or measure if possible next render
            const tooltipHeightEstimate = 80;

            let position: 'top' | 'bottom' = 'top';
            let top = rect.top + scrollY;

            // If too close to the top, flip to bottom
            if (rect.top < tooltipHeightEstimate) {
                position = 'bottom';
                top = rect.bottom + scrollY;
            }

            setCoords({
                top,
                left: rect.left + rect.width / 2,
                position
            });
        }
    }, [isOpen, anchorRef]);

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={tooltipRef}
            className="absolute z-[9999] pointer-events-none"
            style={{
                top: coords.top,
                left: coords.left,
                transform: coords.position === 'top'
                    ? 'translate(-50%, calc(-100% - 10px))'
                    : 'translate(-50%, 10px)',
                width: 'max-content',
                maxWidth: `${maxWidth}px`
            }}
        >
            <div className="bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl animate-in fade-in zoom-in duration-150 relative">
                {title && (
                    <div className="font-bold text-sm border-b border-slate-600 mb-2 pb-1.5 text-slate-200 tracking-wide">
                        {title}
                    </div>
                )}
                {children}

                {/* Arrow */}
                {coords.position === 'top' ? (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800"></div>
                ) : (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-slate-800"></div>
                )}
            </div>
        </div>,
        document.body
    );
};
