import { useState, useCallback, RefObject } from 'react';
import { Editor } from '@tiptap/react';
import { PAGE_WIDTH } from '../../constants';
import { saveImage } from '../../../../imageDB';
import { logger } from '../../../../utils/logger';

interface UseColumnarDrawingProps {
    editor: Editor | null;
    containerRef: RefObject<HTMLDivElement | null>;
    setIsDrawingMode: (mode: boolean) => void;
}

export const useColumnarDrawing = ({
    editor,
    containerRef,
    setIsDrawingMode
}: UseColumnarDrawingProps) => {
    const [drawStart, setDrawStart] = useState<{ x: number, y: number } | null>(null);
    const [drawRect, setDrawRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

    const handleDrawingMouseDown = useCallback((e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
        const y = e.clientY - rect.top;
        setDrawStart({ x, y });
        setDrawRect({ x, y, w: 0, h: 0 });
    }, [containerRef]);

    const handleDrawingMouseMove = useCallback((e: React.MouseEvent) => {
        if (!drawStart || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + (containerRef.current.scrollLeft || 0);
        const y = e.clientY - rect.top;

        setDrawRect({
            x: Math.min(x, drawStart.x),
            y: Math.min(y, drawStart.y),
            w: Math.abs(x - drawStart.x),
            h: Math.abs(y - drawStart.y)
        });
    }, [drawStart, containerRef]);

    const handleDrawingMouseUp = useCallback(async (e: React.MouseEvent) => {
        if (!drawRect || drawRect.w < 10 || drawRect.h < 10) {
            setDrawStart(null);
            setDrawRect(null);
            setIsDrawingMode(false);
            return;
        }

        const finalRect = { ...drawRect };
        const pos = editor?.view.posAtCoords({ left: e.clientX, top: e.clientY });

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (ce) => {
            const file = (ce.target as HTMLInputElement).files?.[0];
            if (file) {
                try {
                    const imageId = await saveImage(file);
                    // Standardize width to 25/50/75/100 based on drawing
                    const ratio = finalRect.w / PAGE_WIDTH;
                    let widthVal: string;
                    if (ratio < 0.35) widthVal = '25%';
                    else if (ratio < 0.65) widthVal = '50%';
                    else if (ratio < 0.85) widthVal = '75%';
                    else widthVal = '100%';

                    if (editor) {
                        const chain = editor.chain().focus();
                        if (pos) chain.setTextSelection(pos.pos);
                        chain.setBookImage({
                            imageId,
                            width: widthVal,
                            height: `${finalRect.h}px`,
                            fit: 'cover',
                            align: 'center'
                        }).run();
                    }
                } catch (err) {
                    logger.error("Failed to save image", err);
                }
            }
            setIsDrawingMode(false);
            setDrawStart(null);
            setDrawRect(null);
        };
        input.click();
    }, [drawRect, editor, setIsDrawingMode]);

    const cancelDrawing = useCallback(() => {
        setIsDrawingMode(false);
        setDrawStart(null);
        setDrawRect(null);
    }, [setIsDrawingMode]);

    return {
        drawRect,
        handleDrawingMouseDown,
        handleDrawingMouseMove,
        handleDrawingMouseUp,
        cancelDrawing
    };
};
