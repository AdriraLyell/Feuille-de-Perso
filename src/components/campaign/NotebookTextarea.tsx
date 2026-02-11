
import React, { useRef, useState, useEffect } from 'react';
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

// Define ref handle
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
            const editable = editableRef.current;

            // 0. SANITY CHECK: content must be rendered
            if (editable.clientHeight < 50) return;

            // 1. GATEKEEPER REMOVED:
            // We rely purely on strict Box Model calculation now.
            // scrollHeight was causing false negatives (infinite typing).

            const containerRect = editable.getBoundingClientRect();

            // 2. PRECISE LIMIT: Accurate Box Model Calculation
            // containerRect.top = Top of Border Box
            // editable.clientTop = Top Border Width
            // editable.clientHeight = Padding Box Height (Content + Padding)
            // Limit = Top + Border + Height
            const absoluteBottomLimit = containerRect.top + editable.clientTop + editable.clientHeight;

            // Helper to check if a range or node overflows
            const getRangeOverflow = (range: Range) => {
                const rects = range.getClientRects();
                if (rects.length === 0) return false;
                for (let i = 0; i < rects.length; i++) {
                    // Precise check against the absolute limit
                    // We allow 5px tolerance: it's better to have a slightly cut descender (g, y, p)
                    // than to move an entire perfectly readable line.
                    if (rects[i].bottom > absoluteBottomLimit + 5) return true;
                }
                return false;
            };

            const totalRange = document.createRange();
            totalRange.selectNodeContents(editable);

            // Double check with Range to be sure
            if (getRangeOverflow(totalRange)) {
                // Save selection info
                const selection = window.getSelection();
                let shouldFocusNext = false;
                let savedCursorPosition: { node: Node | null; offset: number } | null = null;
                if (selection && selection.rangeCount > 0) {
                    savedCursorPosition = { node: selection.anchorNode, offset: selection.anchorOffset };
                }

                const children = Array.from(editable.childNodes);
                let firstOverflowNodeIndex = -1;
                const range = document.createRange();

                // 1. Find first overflowing node
                for (let i = 0; i < children.length; i++) {
                    range.selectNode(children[i]);
                    // Optimization: check if the Top of the node is already below limit
                    // If so, it's definitely overflowing.
                    // If Top is inside but Bottom is outside, it's a candidate for splitting.
                    if (getRangeOverflow(range)) {
                        firstOverflowNodeIndex = i;
                        break;
                    }
                }

                if (firstOverflowNodeIndex === -1) return;

                const splitTarget = children[firstOverflowNodeIndex];
                let overflowNodes: Node[] = [];

                // Collect all nodes after the culprit
                for (let i = firstOverflowNodeIndex + 1; i < children.length; i++) {
                    overflowNodes.push(children[i]);
                    editable.removeChild(children[i]);
                }

                // 2. Split the culprit meticulously
                if (splitTarget.nodeType === Node.TEXT_NODE) {
                    const text = splitTarget.textContent || "";
                    let low = 0, high = text.length, bestFit = 0;

                    while (low <= high) {
                        const mid = Math.floor((low + high) / 2);
                        range.setStart(splitTarget, 0);
                        range.setEnd(splitTarget, mid);

                        if (!getRangeOverflow(range)) {
                            bestFit = mid;
                            low = mid + 1;
                        } else {
                            high = mid - 1;
                        }
                    }

                    // Word boundary adjustment
                    let finalSplit = bestFit;
                    if (finalSplit < text.length && finalSplit > 0) {
                        const lastSpace = text.lastIndexOf(' ', finalSplit - 1);
                        if (lastSpace >= 0 && (finalSplit - lastSpace) < 40) {
                            if (lastSpace > 0) finalSplit = lastSpace + 1;
                        }
                    }

                    // SAFETY VALVE: If word boundary logic pushed us to 0, but we CAN fit some text...
                    // Revert to bestFit to avoid moving the entire massive node.
                    if (finalSplit === 0 && bestFit > 0) {
                        finalSplit = bestFit;
                    }

                    if (finalSplit <= 0 && bestFit === 0) {
                        // Move whole node (only if it's NOT index 0)
                        if (firstOverflowNodeIndex === 0 && text.trim().length > 0) {
                            // ABORT: refuse to move first node entirely
                            overflowNodes.forEach(n => editable.appendChild(n));
                            return;
                        }
                        overflowNodes.unshift(splitTarget);
                        editable.removeChild(splitTarget);
                        if (savedCursorPosition?.node === splitTarget) shouldFocusNext = true;
                    } else {
                        if (savedCursorPosition?.node === splitTarget && savedCursorPosition.offset > finalSplit) {
                            shouldFocusNext = true;
                        }
                        const tail = text.substring(finalSplit);
                        splitTarget.textContent = text.substring(0, finalSplit);
                        if (tail) overflowNodes.unshift(document.createTextNode(tail));
                    }
                } else if (splitTarget.nodeType === Node.ELEMENT_NODE) {
                    // Split element by its children
                    const el = splitTarget as HTMLElement;
                    const elChildren = Array.from(el.childNodes);
                    const elCloned = el.cloneNode(false) as HTMLElement;

                    // Safe check: if Index 0 and we are about to move it entirely -> ABORT
                    if (firstOverflowNodeIndex === 0) {
                        range.selectNode(el);
                        // If rect.top is < limit, it STARTS inside.
                        const rects = range.getClientRects();
                        if (rects.length > 0 && rects[0].top < absoluteBottomLimit) {
                            // It starts inside, but we decided to move it?
                            // We should try to split children.
                            // (Proceed to split logic)
                        } else {
                            // It starts BELOW the limit? That's weird for Index 0.
                            // Unless padding is huge.
                            // Restore and abort.
                            overflowNodes.forEach(n => editable.appendChild(n));
                            return;
                        }
                    }

                    let firstChildOverflow = -1;
                    let l = 0;
                    let r = elChildren.length - 1;

                    // Binary search within the element
                    while (l <= r) {
                        const m = Math.floor((l + r) / 2);
                        range.selectNode(elChildren[m]);

                        if (getRangeOverflow(range)) {
                            firstChildOverflow = m;
                            r = m - 1;
                        } else {
                            l = m + 1;
                        }
                    }

                    if (firstChildOverflow === -1) {
                        // All children fit? Shouldn't happen if el is the culprit.
                        // But if it does, it's the element's block properties causing overflow.
                        overflowNodes.unshift(splitTarget);
                        editableRef.current.removeChild(splitTarget);
                        if (savedCursorPosition && (savedCursorPosition.node === splitTarget || el.contains(savedCursorPosition.node as Node))) {
                            shouldFocusNext = true;
                        }
                    } else {
                        // Split the child that overflows
                        const childToSplit = elChildren[firstChildOverflow];

                        // Collect siblings after
                        for (let i = firstChildOverflow + 1; i < elChildren.length; i++) {
                            elCloned.appendChild(elChildren[i]);
                        }

                        // Re-restore el to have everything up to the split point
                        while (el.firstChild) el.removeChild(el.firstChild);
                        for (let i = 0; i < firstChildOverflow; i++) el.appendChild(elChildren[i]);

                        // Handle the childToSplit itself
                        if (childToSplit.nodeType === Node.TEXT_NODE) {
                            const txt = childToSplit.textContent || "";
                            const tempNode = document.createTextNode("");
                            el.appendChild(tempNode);

                            let lc = 0, hc = txt.length, bc = 0;
                            while (lc <= hc) {
                                const mc = Math.floor((lc + hc) / 2);
                                range.setStart(childToSplit, 0);
                                range.setEnd(childToSplit, mc);

                                if (!getRangeOverflow(range)) {
                                    bc = mc; lc = mc + 1;
                                } else {
                                    hc = mc - 1;
                                }
                            }

                            let fcs = bc;
                            if (fcs < txt.length && fcs > 0) {
                                const ls = txt.lastIndexOf(' ', fcs - 1);
                                if (ls >= 0 && (fcs - ls) < 40) {
                                    if (ls > 0) fcs = ls + 1;
                                }
                            }

                            // SAFETY VALVE (Nested): Don't move whole text if part fits
                            if (fcs === 0 && bc > 0) fcs = bc;

                            if (fcs > 0) {
                                tempNode.textContent = txt.substring(0, fcs);
                                const tail = txt.substring(fcs);
                                if (tail) elCloned.insertBefore(document.createTextNode(tail), elCloned.firstChild);
                                if (savedCursorPosition?.node === childToSplit && savedCursorPosition.offset > fcs) {
                                    shouldFocusNext = true;
                                }
                            } else {
                                el.removeChild(tempNode);
                                elCloned.insertBefore(childToSplit, elCloned.firstChild);
                                if (savedCursorPosition?.node === childToSplit) shouldFocusNext = true;
                            }
                        } else {
                            // Non-text child, move entirely
                            elCloned.insertBefore(childToSplit, elCloned.firstChild);
                            if (savedCursorPosition && (savedCursorPosition.node === childToSplit || (childToSplit instanceof Element && childToSplit.contains(savedCursorPosition.node as Node)))) {
                                shouldFocusNext = true;
                            }
                        }

                        if (elCloned.childNodes.length > 0) overflowNodes.unshift(elCloned);
                        if (el.childNodes.length === 0) editableRef.current.removeChild(el);
                    }
                }

                // Final check: if cursor is no longer in the editor, it must have moved
                if (savedCursorPosition && savedCursorPosition.node && !editableRef.current.contains(savedCursorPosition.node)) {
                    shouldFocusNext = true;
                }

                if (overflowNodes.length > 0) {
                    const tempDiv = document.createElement('div');
                    overflowNodes.forEach(node => tempDiv.appendChild(node));
                    onOverflow(editableRef.current.innerHTML, tempDiv.innerHTML, shouldFocusNext);
                }

                // CRITICAL: Restore cursor position ONLY if we're NOT transferring focus
                if (!shouldFocusNext) {
                    setTimeout(() => {
                        if (editableRef.current) {
                            const lastChild = editableRef.current.lastChild;
                            if (lastChild) {
                                const range = document.createRange();
                                const sel = window.getSelection();

                                // Place cursor at the end of the last remaining node
                                if (lastChild.nodeType === Node.TEXT_NODE) {
                                    range.setStart(lastChild, lastChild.textContent?.length || 0);
                                } else {
                                    range.setStart(lastChild, lastChild.childNodes.length);
                                }
                                range.collapse(true);

                                sel?.removeAllRanges();
                                sel?.addRange(range);
                            }
                        }
                    }, 0);
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
        forceReflow: checkOverflow,
        focusAtEnd: () => {
            if (editableRef.current) {
                editableRef.current.focus();
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(editableRef.current);
                range.collapse(false); // END of content (false = end, true = start)
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        }
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
