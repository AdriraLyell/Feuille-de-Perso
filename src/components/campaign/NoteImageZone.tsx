
import React, { useRef, useState, useEffect } from 'react';
import { ImageConfig } from '../../types';
import { X, Move, Scaling, WrapText, BoxSelect, Maximize2, Minimize2, StretchHorizontal } from 'lucide-react';
import { getImage } from '../../imageDB';

interface NoteImageZoneProps {
    uniqueId: string; // Placement ID
    imageId: string; // Blob ID
    config?: ImageConfig;
    onUpdateConfig: (newConfig: ImageConfig) => void;
    onDelete: () => void;
}

const NoteImageZone: React.FC<NoteImageZoneProps> = ({ uniqueId, imageId, config, onUpdateConfig, onDelete }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    
    // Default Config Initialization
    const defaultConfig: ImageConfig = { 
        width: 300, 
        height: 200, 
        marginTop: 0, 
        align: 'right',
        x: 0,
        y: 0,
        mode: 'absolute',
        fit: 'cover' // New default
    };

    const [tempConfig, setTempConfig] = useState<ImageConfig>(config || defaultConfig);
    const [isResizing, setIsResizing] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startPosRef = useRef<{ x: number, y: number, w: number, h: number, configX: number, configY: number, mt: number } | null>(null);

    // Sync props to internal state only when not interacting
    useEffect(() => {
        if (!isResizing && !isMoving && config) {
            setTempConfig(prev => ({
                ...prev,
                ...config,
                // Ensure defaults for new properties if migrating old data
                mode: config.mode || prev.mode || 'absolute',
                x: config.x ?? prev.x ?? 0,
                y: config.y ?? prev.y ?? 0,
                fit: config.fit || prev.fit || 'cover'
            }));
        }
    }, [config, isResizing, isMoving]);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const blob = await getImage(imageId);
                if (blob && active) {
                    const url = URL.createObjectURL(blob);
                    setImageUrl(url);
                    return () => URL.revokeObjectURL(url);
                }
            } catch (e) {
                console.error("Erreur chargement image note", e);
            }
        };
        load();
        return () => { active = false; };
    }, [imageId]);

    // --- RESIZE HANDLERS ---
    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        startPosRef.current = { 
            x: e.clientX, 
            y: e.clientY, 
            w: tempConfig.width, 
            h: tempConfig.height,
            configX: 0, configY: 0, mt: 0
        };
    };

    // --- MOVE HANDLERS ---
    const handleMoveStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsMoving(true);
        startPosRef.current = { 
            x: e.clientX, 
            y: e.clientY, 
            w: 0, h: 0,
            configX: tempConfig.x || 0,
            configY: tempConfig.y || 0,
            mt: tempConfig.marginTop
        };
    };

    // Global Mouse Listeners for Drag/Resize
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!startPosRef.current) return;
            const { x, y, w, h, configX, configY, mt } = startPosRef.current;
            const dx = e.clientX - x;
            const dy = e.clientY - y;

            if (isResizing) {
                const newWidth = Math.max(50, w + dx);
                const newHeight = Math.max(50, h + dy);
                setTempConfig(prev => ({ ...prev, width: newWidth, height: newHeight }));
            } 
            
            if (isMoving) {
                if (tempConfig.mode === 'absolute') {
                    // Absolute Mode: Free X/Y movement
                    const newX = Math.max(0, configX + dx);
                    const newY = Math.max(0, configY + dy);
                    setTempConfig(prev => ({ ...prev, x: newX, y: newY }));
                } else {
                    // Flow Mode: Vertical Margin + Align Flip
                    const newMarginTop = Math.max(0, mt + dy);
                    let newAlign = tempConfig.align;
                    if (tempConfig.align === 'left' && dx > 150) newAlign = 'right';
                    if (tempConfig.align === 'right' && dx < -150) newAlign = 'left';
                    setTempConfig(prev => ({ ...prev, marginTop: newMarginTop, align: newAlign }));
                }
            }
        };

        const handleMouseUp = () => {
            if (isResizing || isMoving) {
                onUpdateConfig(tempConfig);
                setIsResizing(false);
                setIsMoving(false);
                startPosRef.current = null;
            }
        };

        if (isResizing || isMoving) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, isMoving, tempConfig, onUpdateConfig]);

    const toggleMode = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newMode = tempConfig.mode === 'absolute' ? 'flow' : 'absolute';
        
        // When switching to absolute, sync X/Y from current visual state if possible
        // Ideally we would calculate position, but for now we rely on existing X/Y or marginTop
        let updates: Partial<ImageConfig> = { mode: newMode };
        
        if (newMode === 'absolute') {
            // Initialize X/Y if they are 0 (first switch)
            if (!tempConfig.x && !tempConfig.y) {
                updates.y = tempConfig.marginTop; // Approximation
                // X approximation based on align
                updates.x = tempConfig.align === 'right' ? 400 : 20; // Generic fallback
            }
        } else {
            // Initialize marginTop if switching to flow
            if (tempConfig.marginTop === 0 && tempConfig.y) {
                updates.marginTop = tempConfig.y;
            }
        }

        const newConfig = { ...tempConfig, ...updates };
        setTempConfig(newConfig);
        onUpdateConfig(newConfig);
    };

    const toggleFit = (e: React.MouseEvent) => {
        e.stopPropagation();
        const modes: ImageConfig['fit'][] = ['cover', 'contain', 'fill'];
        const currentIdx = modes.indexOf(tempConfig.fit || 'cover');
        const nextMode = modes[(currentIdx + 1) % modes.length];
        
        const newConfig = { ...tempConfig, fit: nextMode };
        setTempConfig(newConfig);
        onUpdateConfig(newConfig);
    };

    if (!imageUrl) return null;

    // Computed Styles based on Mode
    const isAbsolute = tempConfig.mode === 'absolute';
    
    const containerStyle: React.CSSProperties = isAbsolute ? {
        position: 'absolute',
        top: tempConfig.y || 0,
        left: tempConfig.x || 0,
        width: tempConfig.width,
        height: tempConfig.height,
        zIndex: 20
    } : {
        float: tempConfig.align,
        width: tempConfig.width,
        // Important: In flow mode, we add the margin to the total height but allow text to flow in it via shape-outside
        height: tempConfig.height + tempConfig.marginTop, 
        paddingTop: tempConfig.marginTop, // Push the visual image down
        shapeOutside: `inset(${tempConfig.marginTop}px 0 0 0)`, // Tell text it can occupy the top area
        
        [tempConfig.align === 'left' ? 'marginRight' : 'marginLeft']: '20px',
        marginBottom: '10px',
        zIndex: 10,
        position: 'relative' // Need relative for internal absolute children
    };

    const isInteracting = isMoving || isResizing;
    const currentFit = tempConfig.fit || 'cover';

    return (
        <div 
            ref={containerRef}
            className="group/image select-none"
            style={containerStyle}
        >
            <div className={`w-full h-full relative border-4 border-white shadow-md bg-white transition-shadow ${isInteracting ? 'shadow-xl ring-2 ring-indigo-400 opacity-90' : ''}`}>
                <img 
                    src={imageUrl} 
                    alt="Note Attachment" 
                    className={`w-full h-full pointer-events-none transition-all duration-300 object-${currentFit}`}
                />
                
                {/* Overlay Controls */}
                <div className={`absolute inset-0 bg-black/10 transition-opacity flex flex-col justify-between p-2
                    ${isInteracting ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover/image:opacity-100 pointer-events-none group-hover/image:pointer-events-auto'}
                `}>
                    <div className="flex justify-between items-start">
                        <div className="flex gap-1">
                            {/* Mode Toggle Button */}
                            <button
                                onClick={toggleMode}
                                className={`p-1.5 rounded shadow text-xs font-bold flex items-center gap-1 transition-colors ${
                                    isAbsolute 
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                    : 'bg-white text-indigo-700 hover:bg-indigo-50'
                                }`}
                                title={isAbsolute ? "Mode Libre (Flottant)" : "Mode Habillage (Texte autour)"}
                            >
                                {isAbsolute ? <BoxSelect size={14} /> : <WrapText size={14} />}
                            </button>

                            {/* Fit Toggle Button */}
                            <button
                                onClick={toggleFit}
                                className="p-1.5 rounded shadow text-xs font-bold flex items-center gap-1 transition-colors bg-white text-stone-700 hover:bg-stone-50"
                                title={`Ajustement : ${currentFit === 'cover' ? 'Remplir (Zoom)' : currentFit === 'contain' ? 'Ajuster (Entier)' : 'Étirer'}`}
                            >
                                {currentFit === 'cover' && <Maximize2 size={14} />}
                                {currentFit === 'contain' && <Minimize2 size={14} />}
                                {currentFit === 'fill' && <StretchHorizontal size={14} />}
                            </button>
                        </div>

                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="bg-red-600 text-white p-1 rounded shadow hover:bg-red-700"
                            title="Supprimer"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    
                    {/* Move Handle (Center) */}
                    <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-move bg-white/80 p-2 rounded-full hover:bg-white text-stone-700"
                        onMouseDown={handleMoveStart}
                        title="Déplacer"
                    >
                        <Move size={20} />
                    </div>

                    {/* Resize Handle (Bottom Right) */}
                    <div 
                        className="absolute bottom-0 right-0 cursor-nwse-resize p-1 text-white bg-indigo-600/80 rounded-tl-lg hover:bg-indigo-600"
                        onMouseDown={handleResizeStart}
                    >
                        <Scaling size={16} />
                    </div>
                </div>

                {/* Tape visual */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-yellow-100/50 rotate-2 shadow-sm border border-yellow-200/30 pointer-events-none"></div>
            </div>
        </div>
    );
};

export default NoteImageZone;
