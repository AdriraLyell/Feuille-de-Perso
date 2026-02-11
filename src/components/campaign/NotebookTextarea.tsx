import React, { useRef, useState, useEffect, useCallback } from 'react';
import RichTextToolbar from './RichTextToolbar';

interface NotebookTextareaProps {
    value: string;
    onChange: (v: string) => void;
    onOverflow?: (remainingContent: string, overflowContent: string, focusNext?: boolean) => void;
    placeholder?: string;
    imageNodes?: React.ReactNode;
    isDrawing: boolean;
    onDrawComplete: (rect: { x: number, y: number, w: number, h: number, containerWidth: number }) => void;
    lineHeight: number;
}

export interface NotebookTextareaHandle {
    forceReflow: () => void;
    focusAtEnd: () => void;
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
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
    const [activeCommands, setActiveCommands] = useState<string[]>([]);
    const overflowCheckRafRef = useRef<number | null>(null);

    // Sync external value to editor
    useEffect(() => {
        if (editableRef.current && editableRef.current.innerHTML !== value) {
            editableRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const content = e.currentTarget.innerHTML;
        onChange(content);
        scheduleOverflowCheck();
    };

    const scheduleOverflowCheck = useCallback(() => {
        if (overflowCheckRafRef.current !== null) {
            cancelAnimationFrame(overflowCheckRafRef.current);
        }
        overflowCheckRafRef.current = requestAnimationFrame(() => {
            checkOverflow();
            overflowCheckRafRef.current = null;
        });
    }, []);

    // Overflow detection using absolute positions (getBoundingClientRect)
    // Does NOT use scrollHeight - works correctly with overflow:visible contenteditable
    const checkOverflow = useCallback(() => {
        if (!onOverflow || !editableRef.current) return;

        const editable = editableRef.current;
        if (editable.clientHeight < 100) return;

        // Absolute bottom limit of the page content area
        const pageBottom = editable.getBoundingClientRect().bottom;

        // Helper: does this node visually overflow the page?
        const nodeOverflows = (node: Node): boolean => {
            const range = document.createRange();
            range.selectNode(node);
            const rects = range.getClientRects();
            for (let i = 0; i < rects.length; i++) {
                // 5px tolerance for descenders (g, y, p)
                if (rects[i].bottom > pageBottom + 5) return true;
            }
            return false;
        };

        const children = Array.from(editable.childNodes);
        if (children.length === 0) return;

        // Quick check: if last node doesn't overflow, nothing to do
        if (!nodeOverflows(children[children.length - 1])) return;

        // Find first overflowing node
        let firstOverflowIndex = -1;
        for (let i = 0; i < children.length; i++) {
            if (nodeOverflows(children[i])) {
                firstOverflowIndex = i;
                break;
            }
        }
        if (firstOverflowIndex === -1) return;

        const overflowNodes: Node[] = [];
        const splitTarget = children[firstOverflowIndex];

        // Collect all nodes after the first overflowing one
        for (let i = firstOverflowIndex + 1; i < children.length; i++) {
            overflowNodes.push(children[i]);
            editable.removeChild(children[i]);
        }

        // Split the first overflowing node
        if (splitTarget.nodeType === Node.TEXT_NODE) {
            const text = splitTarget.textContent || '';
            let lo = 0, hi = text.length, bestFit = 0;

            // Binary search: find the longest prefix that fits on the page
            while (lo <= hi) {
                const mid = Math.floor((lo + hi) / 2);
                splitTarget.textContent = text.substring(0, mid);
                if (!nodeOverflows(splitTarget)) {
                    bestFit = mid;
                    lo = mid + 1;
                } else {
                    hi = mid - 1;
                }
            }

            // Snap to word boundary
            const spaceIdx = text.lastIndexOf(' ', bestFit - 1);
            const splitAt = (spaceIdx > 0 && (bestFit - spaceIdx) < 40) ? spaceIdx + 1 : bestFit;
            const finalSplit = (splitAt === 0 && bestFit > 0) ? bestFit : splitAt;

            if (finalSplit > 0) {
                splitTarget.textContent = text.substring(0, finalSplit);
                const tail = text.substring(finalSplit);
                if (tail) overflowNodes.unshift(document.createTextNode(tail));
            } else {
                // Entire node overflows (e.g., first node on an empty page) → abort
                if (firstOverflowIndex === 0) {
                    overflowNodes.forEach(n => editable.appendChild(n));
                    return;
                }
                overflowNodes.unshift(splitTarget);
                editable.removeChild(splitTarget);
            }
        } else {
            // Element node → move entirely to overflow
            // Abort if it's the first (and only) node to avoid empty page loop
            if (firstOverflowIndex === 0 && children.length === 1) {
                overflowNodes.forEach(n => editable.appendChild(n));
                return;
            }
            overflowNodes.unshift(splitTarget);
            editable.removeChild(splitTarget);
        }

        // Build overflow HTML
        const tempDiv = document.createElement('div');
        overflowNodes.forEach(n => tempDiv.appendChild(n));
        const overflow = tempDiv.innerHTML;

        if (!overflow.trim() || overflow.replace(/<[^>]*>/g, '').trim() === '') return;

        // Check if cursor moved into overflow
        const selection = window.getSelection();
        let shouldFocusNext = false;
        if (selection && selection.rangeCount > 0 && !editable.contains(selection.anchorNode)) {
            shouldFocusNext = true;
        }

        onChange(editable.innerHTML);
        onOverflow(editable.innerHTML, overflow, shouldFocusNext);
    }, [onOverflow, onChange]);

    React.useImperativeHandle(ref, () => ({
        forceReflow: () => {
            if (editableRef.current) {
                checkOverflow();
            }
        },
        focusAtEnd: () => {
            if (editableRef.current) {
                editableRef.current.focus();
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(editableRef.current);
                range.collapse(false); // End of content
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        }
    }), [checkOverflow]);

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

                {/* Contenteditable Text Content */}
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
