
import React, { useRef, useState, useEffect } from 'react';

interface NotebookTextareaProps {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    imageNodes?: React.ReactNode; // Allows multiple nodes
    isDrawing: boolean;
    onDrawComplete: (rect: {x: number, y: number, w: number, h: number, containerWidth: number}) => void;
}

const NotebookTextarea: React.FC<NotebookTextareaProps> = ({ value, onChange, placeholder, imageNodes, isDrawing, onDrawComplete }) => {
    const editableRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [drawStart, setDrawStart] = useState<{x: number, y: number} | null>(null);
    const [currentRect, setCurrentRect] = useState<{x: number, y: number, w: number, h: number} | null>(null);

    // Sync content
    useEffect(() => {
        if (editableRef.current && editableRef.current.innerText !== value) {
            editableRef.current.innerText = value;
        }
    }, [value]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerText);
    };

    // Drawing Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isDrawing || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + containerRef.current.scrollLeft;
        const y = e.clientY - rect.top + containerRef.current.scrollTop; // Add scrollTop to fix position when scrolled
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
        
        // Only trigger if box is big enough
        if (currentRect.w > 20 && currentRect.h > 20) {
            onDrawComplete({
                ...currentRect,
                containerWidth: containerRef.current.clientWidth
            });
        }
        setDrawStart(null);
        setCurrentRect(null);
    };

    // Styling
    const lineHeight = 26; 
    const fontSize = '1.05rem'; 
    const paddingX = '24px'; 
    const paddingTop = '5px';

    return (
        <div className="relative w-full h-full rounded-sm bg-stone-50/30 overflow-hidden flex flex-col">
            <div 
                ref={containerRef}
                className={`w-full h-full overflow-y-auto custom-scrollbar relative ${isDrawing ? 'cursor-crosshair select-none' : ''}`}
                style={{
                    paddingTop,
                    paddingLeft: paddingX,
                    paddingRight: paddingX,
                    paddingBottom: '20px',
                    backgroundImage: `linear-gradient(transparent ${lineHeight - 1}px, #d6d3d1 ${lineHeight - 1}px)`,
                    backgroundSize: `100% ${lineHeight}px`,
                    backgroundAttachment: 'local',
                    backgroundPosition: `0 ${paddingTop}`,
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { if(isDrawing) { setDrawStart(null); setCurrentRect(null); }}}
            >
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

                {/* Sibling Image Nodes (Floated or Absolute) */}
                {imageNodes}

                {/* Text Content */}
                <div 
                    ref={editableRef}
                    contentEditable={!isDrawing} // Disable edit while drawing
                    suppressContentEditableWarning
                    onInput={handleInput}
                    className="outline-none min-h-full text-ink whitespace-pre-wrap break-words relative z-0"
                    style={{
                        fontFamily: '"Patrick Hand", cursive',
                        fontSize,
                        lineHeight: `${lineHeight}px`,
                    }}
                    data-placeholder={placeholder}
                />
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.4); }
                [contentEditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #a8a29e;
                    cursor: text;
                }
            `}</style>
        </div>
    );
};

export default NotebookTextarea;
