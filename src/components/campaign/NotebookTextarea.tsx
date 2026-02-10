
import React, { useRef, useState, useEffect } from 'react';
import RichTextToolbar from './RichTextToolbar';

interface NotebookTextareaProps {
    value: string;
    onChange: (v: string) => void;
    onOverflow?: (overflowContent: string) => void;
    placeholder?: string;
    imageNodes?: React.ReactNode;
    isDrawing: boolean;
    onDrawComplete: (rect: { x: number, y: number, w: number, h: number, containerWidth: number }) => void;
    lineHeight: number;
}

// Define ref handle
export interface NotebookTextareaHandle {
    forceReflow: () => void;
}

const NotebookTextarea = React.forwardRef<NotebookTextareaHandle, NotebookTextareaProps>(({
    value,
    onChange,
    onOverflow,
    placeholder,
    imageNodes,
    isDrawing,
    onDrawComplete,
    lineHeight
}, ref) => {
    const editableRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [drawStart, setDrawStart] = useState<{ x: number, y: number } | null>(null);
    const [currentRect, setCurrentRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

    // Toolbar state
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
    const [activeCommands, setActiveCommands] = useState<string[]>([]);

    // Sync content
    useEffect(() => {
        if (editableRef.current && editableRef.current.innerHTML !== value) {
            editableRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const content = e.currentTarget.innerHTML;
        onChange(content);
        checkOverflow();
    };

    const checkOverflow = () => {
        // Deboredment check (Pagination)
        if (onOverflow && editableRef.current && containerRef.current) {
            // Strict check: scrollHeight > clientHeight
            // We use a small epsilon for floating point issues, but mostly strict.
            const hasOverflow = editableRef.current.scrollHeight > editableRef.current.clientHeight;

            if (hasOverflow) {
                // Find the content to move
                // Improved implementation: move nodes from bottom until it fits
                const children = Array.from(editableRef.current.childNodes);
                let overflowNodes: Node[] = [];

                // Working backwards
                for (let i = children.length - 1; i >= 0; i--) {
                    overflowNodes.unshift(children[i]);
                    editableRef.current.removeChild(children[i]);

                    // Check if it fits now
                    if (editableRef.current.scrollHeight <= editableRef.current.clientHeight + 2) {
                        break;
                    }
                }

                if (overflowNodes.length > 0) {
                    const tempDiv = document.createElement('div');
                    overflowNodes.forEach(node => tempDiv.appendChild(node));
                    onOverflow(tempDiv.innerHTML);
                }
            }
        }
    };

    const handleSelectionChange = () => {
        if (isDrawing) return;

        const selection = window.getSelection();
        if (selection && selection.toString().length > 0 && editableRef.current?.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = containerRef.current?.getBoundingClientRect();

            if (containerRect) {
                setToolbarPos({
                    top: rect.top - containerRect.top - 45,
                    left: rect.left - containerRect.left + (rect.width / 2) - 100
                });
                setShowToolbar(true);

                // Track active styles
                const commands = [];
                if (document.queryCommandState('bold')) commands.push('bold');
                if (document.queryCommandState('italic')) commands.push('italic');
                setActiveCommands(commands);
            }
        } else {
            setShowToolbar(false);
        }
    };

    useEffect(() => {
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [isDrawing]);

    const execCommand = (command: string, val?: string) => {
        document.execCommand(command, false, val);
        if (editableRef.current) {
            onChange(editableRef.current.innerHTML);
        }
    };

    // Drawing Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isDrawing || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + containerRef.current.scrollLeft;
        const y = e.clientY - rect.top + containerRef.current.scrollTop;
        setDrawStart({ x, y });
        setCurrentRect({ x, y, w: 0, h: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !drawStart || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left + containerRef.current.scrollLeft;
        const currentY = e.clientY - rect.top + containerRef.current.scrollTop;

        const w = Math.abs(currentX - drawStart.x);
        const h = Math.abs(currentY - drawStart.y);
        const x = Math.min(currentX, drawStart.x);
        const y = Math.min(currentY, drawStart.y);

        setCurrentRect({ x, y, w, h });
    };

    const handleMouseUp = () => {
        if (!isDrawing || !drawStart || !currentRect || !containerRef.current) return;
        if (currentRect.w > 20 && currentRect.h > 20) {
            onDrawComplete({
                ...currentRect,
                containerWidth: containerRef.current.clientWidth
            });
        }
        setDrawStart(null);
        setCurrentRect(null);
    };

    // Expose forceReflow to parent
    React.useImperativeHandle(ref, () => ({
        forceReflow: checkOverflow
    }));

    return (
        <div className="relative w-full h-full rounded-sm bg-transparent flex flex-col">
            <div
                ref={containerRef}
                className={`w-full h-full relative ${isDrawing ? 'cursor-crosshair select-none' : ''}`}
                style={{
                    paddingTop: '0px',
                    paddingBottom: '0px',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { if (isDrawing) { setDrawStart(null); setCurrentRect(null); } }}
            >
                {/* Floating Toolbar */}
                {showToolbar && !isDrawing && (
                    <div
                        className="fixed z-[100] transition-opacity duration-200"
                        style={{
                            top: toolbarPos.top + (containerRef.current?.getBoundingClientRect().top || 0),
                            left: toolbarPos.left + (containerRef.current?.getBoundingClientRect().left || 0)
                        }}
                    >
                        <RichTextToolbar onCommand={execCommand} activeCommands={activeCommands} />
                    </div>
                )}

                {/* Drawing Overlay Box */}
                {isDrawing && currentRect && (
                    <div
                        className="absolute border-2 border-red-500 bg-red-200/30 z-50 pointer-events-none"
                        style={{
                            left: currentRect.x,
                            top: currentRect.y,
                            width: currentRect.w,
                            height: currentRect.h
                        }}
                    />
                )}

                {imageNodes}

                {/* Text Content */}
                <div
                    ref={editableRef}
                    contentEditable={!isDrawing}
                    suppressContentEditableWarning
                    onInput={handleInput}
                    className="outline-none h-full text-ink whitespace-pre-wrap break-words relative z-0"
                    style={{
                        fontFamily: '"Patrick Hand", cursive',
                        fontSize: '1.05rem',
                        lineHeight: `${lineHeight}px`,
                        padding: '0 10px'
                    }}
                    data-placeholder={placeholder}
                />
            </div>

            <style>{`
                [contentEditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #a8a29e;
                    cursor: text;
                }
                /* Ensure consistent line heights for Rich Text elements */
                [contentEditable] div, [contentEditable] p {
                    margin: 0;
                    min-height: ${lineHeight}px;
                }
            `}</style>
        </div>
    );
});

NotebookTextarea.displayName = 'NotebookTextarea';

export default NotebookTextarea;
