
// ... keep imports ...
import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { CharacterSheetData, CampaignNoteEntry, PartyColumn, PartyMemberEntry, ImageConfig, NoteImage } from '../types';
import { Book, Plus, Trash2, ChevronLeft, ChevronRight, Bookmark, Users, PenTool, X, Image as ImageIcon, Move, Scaling, WrapText, BoxSelect, Maximize2, Minimize2, StretchHorizontal } from 'lucide-react';
import { saveImage, getImage, deleteImage } from '../imageDB';

interface Props {
  data: CharacterSheetData;
  onChange: React.Dispatch<React.SetStateAction<CharacterSheetData>>;
  isLandscape?: boolean;
  onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void;
}

// --- SUB-COMPONENT FOR NOTE IMAGE (Movable/Resizable) ---
const NoteImageZone: React.FC<{ 
    uniqueId: string; // Placement ID
    imageId: string; // Blob ID
    config?: ImageConfig;
    onUpdateConfig: (newConfig: ImageConfig) => void;
    onDelete: () => void;
}> = ({ uniqueId, imageId, config, onUpdateConfig, onDelete }) => {
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

// ... NotebookTextarea ...
const NotebookTextarea: React.FC<{ 
    value: string, 
    onChange: (v: string) => void, 
    placeholder?: string,
    imageNodes?: React.ReactNode, // Changed to allow multiple nodes
    isDrawing: boolean,
    onDrawComplete: (rect: {x: number, y: number, w: number, h: number, containerWidth: number}) => void
}> = ({ value, onChange, placeholder, imageNodes, isDrawing, onDrawComplete }) => {
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

// ... PartyTable (unchanged) ...
const PartyTable: React.FC<{
    data: CharacterSheetData;
    onChange: React.Dispatch<React.SetStateAction<CharacterSheetData>>;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info') => void;
}> = ({ data, onChange, onAddLog }) => {
    // ... (PartyTable code remains unchanged, but needs to be included for full file replacement)
    const columns = data.partyNotes?.columns || [];
    const members = data.partyNotes?.members || [];
    const staticWidths = data.partyNotes?.staticColWidths || { character: 200, player: 200 };
    const [newlyAddedColId, setNewlyAddedColId] = useState<string | null>(null);
    const resizingRef = useRef<{ colId: string | 'character' | 'player', startX: number, startWidth: number } | null>(null);

    useEffect(() => {
        if (newlyAddedColId) {
            const inputEl = document.getElementById(`party-col-header-${newlyAddedColId}`) as HTMLInputElement;
            if (inputEl) {
                inputEl.focus();
                inputEl.select(); 
                setNewlyAddedColId(null); 
            }
        }
    }, [columns, newlyAddedColId]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingRef.current) return;
            const { colId, startX, startWidth } = resizingRef.current;
            const delta = e.clientX - startX;
            const newWidth = Math.max(50, startWidth + delta); 

            if (colId === 'character' || colId === 'player') {
                onChange(prev => ({
                    ...prev,
                    partyNotes: {
                        ...prev.partyNotes,
                        staticColWidths: {
                            ...prev.partyNotes.staticColWidths!,
                            [colId]: newWidth
                        }
                    }
                }));
            } else {
                onChange(prev => ({
                    ...prev,
                    partyNotes: {
                        ...prev.partyNotes,
                        columns: prev.partyNotes.columns.map(c => c.id === colId ? { ...c, width: newWidth } : c)
                    }
                }));
            }
        };

        const handleMouseUp = () => {
            if (resizingRef.current) {
                resizingRef.current = null;
                document.body.style.cursor = 'default';
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onChange]); 

    const startResizing = (e: React.MouseEvent, colId: string | 'character' | 'player', currentWidth: number) => {
        e.preventDefault();
        resizingRef.current = { colId, startX: e.clientX, startWidth: currentWidth };
        document.body.style.cursor = 'col-resize';
    };

    const addColumn = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newCol: PartyColumn = {
            id: newId,
            label: "Nouvelle Colonne",
            width: 150
        };
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                columns: [...columns, newCol]
            }
        });
        setNewlyAddedColId(newId);
        onAddLog("Colonne ajoutée au groupe", 'info');
    };

    const deleteColumn = (colId: string) => {
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                columns: columns.filter(c => c.id !== colId)
            }
        });
    };

    const updateColumnLabel = (colId: string, newVal: string) => {
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                columns: columns.map(c => c.id === colId ? { ...c, label: newVal } : c)
            }
        });
    };

    const addMember = () => {
        const newMember: PartyMemberEntry = {
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            player: '',
            data: {}
        };
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                members: [...members, newMember]
            }
        });
        onAddLog("Membre ajouté au groupe", 'success');
    };

    const updateMember = (memberId: string, field: 'name' | 'player' | 'data', value: any, key?: string) => {
        const newMembers = members.map(m => {
            if (m.id !== memberId) return m;
            if (field === 'data' && key) {
                return { ...m, data: { ...m.data, [key]: value } };
            }
            return { ...m, [field]: value };
        });

        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                members: newMembers
            }
        });
    };

    const deleteMember = (memberId: string) => {
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                members: members.filter(m => m.id !== memberId)
            }
        });
    };

    return (
        <div className="w-full h-full flex flex-col p-4">
             <div className="flex-grow overflow-auto">
                 <table className="border-collapse table-fixed min-w-full">
                     <thead className="sticky top-0 z-10">
                         <tr>
                             <th className="border-b-2 border-stone-400 bg-[#f6f3ed] text-left p-2 font-serif text-stone-700 relative" style={{ width: staticWidths.character }}>
                                Personnage
                                <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-stone-300 z-20" onMouseDown={(e) => startResizing(e, 'character', staticWidths.character)} />
                             </th>
                             <th className="border-b-2 border-stone-400 bg-[#f6f3ed] text-left p-2 font-serif text-stone-700 border-l border-stone-300 relative" style={{ width: staticWidths.player }}>
                                Joueur
                                <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-stone-300 z-20" onMouseDown={(e) => startResizing(e, 'player', staticWidths.player)} />
                             </th>
                             {columns.map(col => (
                                 <th key={col.id} className="border-b-2 border-stone-400 bg-[#f6f3ed] text-left p-2 font-serif text-stone-700 border-l border-stone-300 group relative" style={{ width: col.width || 150 }}>
                                     <input 
                                        id={`party-col-header-${col.id}`}
                                        className="bg-transparent font-bold w-full outline-none focus:border-b border-indigo-500 pr-6" 
                                        value={col.label}
                                        onChange={(e) => updateColumnLabel(col.id, e.target.value)}
                                     />
                                     <button onClick={() => deleteColumn(col.id)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10" title="Supprimer colonne">
                                         <X size={14} />
                                     </button>
                                     <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-stone-300 z-20" onMouseDown={(e) => startResizing(e, col.id, col.width || 150)} />
                                 </th>
                             ))}
                             <th className="border-b-2 border-stone-400 bg-[#f6f3ed] p-2 w-12 text-center">
                                 <button onClick={addColumn} className="text-stone-500 hover:text-indigo-600 transition-colors" title="Ajouter une colonne">
                                     <Plus size={20} />
                                 </button>
                             </th>
                             <th className="border-b-2 border-stone-400 bg-[#f6f3ed] w-12"></th>
                         </tr>
                     </thead>
                     <tbody>
                         {members.map(member => (
                             <tr key={member.id} className="hover:bg-stone-50 group">
                                 <td className="p-0 border-b border-stone-300 h-10 overflow-hidden">
                                     <input className="w-full h-full bg-transparent px-2 font-handwriting text-lg text-ink outline-none" placeholder="Nom du perso..." value={member.name} onChange={(e) => updateMember(member.id, 'name', e.target.value)} />
                                 </td>
                                 <td className="p-0 border-b border-stone-300 h-10 border-l border-stone-200 overflow-hidden">
                                     <input className="w-full h-full bg-transparent px-2 font-handwriting text-lg text-ink outline-none" placeholder="Nom du joueur..." value={member.player} onChange={(e) => updateMember(member.id, 'player', e.target.value)} />
                                 </td>
                                 {columns.map(col => (
                                     <td key={col.id} className="p-0 border-b border-stone-300 h-10 border-l border-stone-200 overflow-hidden">
                                         <input className="w-full h-full bg-transparent px-2 font-handwriting text-lg text-stone-600 outline-none" value={member.data[col.id] || ''} onChange={(e) => updateMember(member.id, 'data', e.target.value, col.id)} />
                                     </td>
                                 ))}
                                 <td colSpan={2} className="border-b border-stone-300 text-center w-24">
                                     <button onClick={() => deleteMember(member.id)} className="text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                         <Trash2 size={16} />
                                     </button>
                                 </td>
                             </tr>
                         ))}
                         {members.length === 0 && (
                             <tr>
                                 <td colSpan={columns.length + 4} className="text-center py-8 text-stone-400 italic font-handwriting text-xl">
                                     Aucun membre dans le groupe pour l'instant.
                                 </td>
                             </tr>
                         )}
                     </tbody>
                 </table>
             </div>
             <div className="pt-4 mt-2 border-t border-stone-300 flex justify-center">
                 <button onClick={addMember} className="flex items-center gap-2 text-indigo-800 hover:text-indigo-600 font-bold uppercase text-sm tracking-wider px-4 py-2 rounded hover:bg-indigo-50 transition-colors">
                     <Plus size={18} /> Ajouter un Membre
                 </button>
             </div>
        </div>
    );
};

const CampaignNotes: React.FC<Props> = ({ data, onChange, isLandscape = false, onAddLog }) => {
  const [activeTab, setActiveTab] = useState<'journal' | 'party'>('journal');
  const [isDrawingImage, setIsDrawingImage] = useState(false);
  const [pendingImageConfig, setPendingImageConfig] = useState<ImageConfig | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- JOURNAL STATES ---
  const [currentIndex, setCurrentIndex] = useState(() => {
      return data.campaignNotes && data.campaignNotes.length > 0 ? data.campaignNotes.length - 1 : 0;
  });
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  const totalPages = data.campaignNotes?.length || 0;
  const currentNote = totalPages > 0 && data.campaignNotes ? data.campaignNotes[currentIndex] : null;

  // --- EFFECTS ---
  useEffect(() => {
      if (totalPages > 0 && currentIndex >= totalPages) {
          setCurrentIndex(totalPages - 1);
      }
  }, [totalPages]);

  // --- JOURNAL ACTIONS ---
  const addNote = () => {
    const newNote: CampaignNoteEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('fr-CA'),
      title: 'Nouvelle Session',
      content: '',
      images: [] // Initialize images array
    };
    
    const newNotes = [...(data.campaignNotes || []), newNote];
    onChange({
      ...data,
      campaignNotes: newNotes
    });
    
    setCurrentIndex(newNotes.length - 1);
    setActiveTab('journal');
    onAddLog("Nouvelle page ajoutée au journal", 'success', 'sheet');
  };

  const updateNote = (id: string, field: keyof CampaignNoteEntry, value: any) => {
    const newNotes = (data.campaignNotes || []).map(n => n.id === id ? { ...n, [field]: value } : n);
    onChange({ ...data, campaignNotes: newNotes });
  };

  const confirmDeleteNote = () => {
    if (noteIdToDelete) {
        const noteToDelete = (data.campaignNotes || []).find(n => n.id === noteIdToDelete);
        
        // Clean up all images associated with this note
        if (noteToDelete?.images) {
            noteToDelete.images.forEach(img => {
                deleteImage(img.imageId).catch(console.error);
            });
        }
        // Fallback for deprecated single image field
        if (noteToDelete?.imageId) {
            deleteImage(noteToDelete.imageId).catch(console.error);
        }

        const newNotes = (data.campaignNotes || []).filter(n => n.id !== noteIdToDelete);
        onChange({ ...data, campaignNotes: newNotes });
        onAddLog("Page du journal arrachée", 'danger', 'sheet');
        setNoteIdToDelete(null);
        
        if (currentIndex >= newNotes.length) {
            setCurrentIndex(Math.max(0, newNotes.length - 1));
        }
    }
  };

  const goToPrevious = () => {
      if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const goToNext = () => {
      if (currentIndex < totalPages - 1) setCurrentIndex(currentIndex + 1);
  };

  // --- IMAGE HANDLING ---
  const toggleDrawMode = () => {
      setIsDrawingImage(!isDrawingImage);
      if (!isDrawingImage) {
          onAddLog("Mode dessin : Tracez un rectangle sur la page pour insérer une image.", 'info', 'sheet');
      }
  };

  const handleDrawComplete = (rect: {x: number, y: number, w: number, h: number, containerWidth: number}) => {
      setIsDrawingImage(false);
      
      // Calculate Align based on center of drawn box relative to container center
      const centerBox = rect.x + (rect.w / 2);
      const centerContainer = rect.containerWidth / 2;
      const align = centerBox < centerContainer ? 'left' : 'right';

      setPendingImageConfig({
          width: rect.w,
          height: rect.h,
          marginTop: rect.y,
          align,
          x: rect.x,
          y: rect.y,
          mode: 'absolute', // Defaulting to absolute for maximum freedom (Face to Face)
          fit: 'cover'
      });

      // Open file dialog
      fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !currentNote || !pendingImageConfig) return;

      try {
          const blobId = await saveImage(file);
          
          const newImage: NoteImage = {
              id: Math.random().toString(36).substr(2, 9), // Unique ID for placement
              imageId: blobId, // Blob ID
              config: pendingImageConfig
          };

          const newImages = [...(currentNote.images || []), newImage];
          
          const newNotes = (data.campaignNotes || []).map(n => 
              n.id === currentNote.id 
              ? { ...n, images: newImages } 
              : n
          );
          onChange({ ...data, campaignNotes: newNotes });

          onAddLog("Image ajoutée à la zone dessinée", 'success', 'sheet');
      } catch (err) {
          console.error(err);
          onAddLog("Erreur lors de l'ajout de l'image", 'danger');
      } finally {
          if (fileInputRef.current) fileInputRef.current.value = "";
          setPendingImageConfig(null);
      }
  };

  const handleUpdateImageConfig = (uniqueId: string, newConfig: ImageConfig) => {
      if (!currentNote) return;
      
      const newImages = (currentNote.images || []).map(img => 
          img.id === uniqueId ? { ...img, config: newConfig } : img
      );

      updateNote(currentNote.id, 'images', newImages);
  };

  const handleRemoveImage = async (uniqueId: string) => {
      if (!currentNote) return;
      
      const imageToRemove = (currentNote.images || []).find(img => img.id === uniqueId);
      if (!imageToRemove) return;

      try {
          await deleteImage(imageToRemove.imageId);
          
          const newImages = (currentNote.images || []).filter(img => img.id !== uniqueId);
          updateNote(currentNote.id, 'images', newImages);
          
          onAddLog("Image retirée de la note", 'info', 'sheet');
      } catch (err) {
          console.error(err);
      }
  };

  const noteToDelete = (data.campaignNotes || []).find(n => n.id === noteIdToDelete);

  return (
    <div className={`w-full flex items-center justify-center bg-stone-900 py-8 px-4 md:px-12 relative overflow-auto transition-all duration-300 ${isLandscape ? 'min-h-[1200px]' : 'min-h-[1400px]'}`}>
      
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>

      {/* --- FLEX CONTAINER: BUTTONS + BOOK --- */}
      <div className="flex items-center gap-3 shrink-0 z-10">

          <div className="w-12 flex justify-end">
             {activeTab === 'journal' && (
                <button 
                    onClick={goToPrevious}
                    disabled={currentIndex <= 0}
                    className={`p-3 rounded-full bg-stone-800 text-stone-200 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-stone-600 hover:bg-stone-700 hover:scale-110 hover:text-white transition-all duration-300 ${currentIndex <= 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    title="Page précédente"
                >
                    <ChevronLeft size={28} strokeWidth={3} />
                </button>
             )}
          </div>

          {/* --- THE BOOK CONTAINER --- */}
          <div className={`relative bg-[#fdfbf7] shadow-2xl transition-all duration-500 flex flex-col overflow-hidden z-10 shrink-0
              ${isLandscape 
                ? 'w-[1560px] h-[1100px]' 
                : 'w-[900px] h-[1270px]' 
              } 
              rounded-r-md rounded-l-sm border-r-8 border-r-stone-200 border-l-[12px] border-l-stone-800
          `}>
              
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-stone-400 opacity-20 z-20 pointer-events-none shadow-[2px_0_5px_rgba(0,0,0,0.2)]"></div>

              {/* BOOK HEADER */}
              <div className="shrink-0 pt-6 pb-2 px-8 md:px-12 bg-[#fdfbf7] z-20 flex items-end justify-between border-b-2 border-stone-800 relative">
                    
                    <div className="flex items-end gap-6">
                        <button 
                            onClick={() => setActiveTab('journal')}
                            className={`group flex items-center gap-2 pb-1 transition-all ${activeTab === 'journal' ? 'text-indigo-950 border-b-4 border-indigo-900' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            <Book size={28} strokeWidth={activeTab === 'journal' ? 2.5 : 2} className="transition-transform group-hover:-translate-y-1" />
                            <span className={`text-2xl font-black uppercase tracking-[0.1em] font-serif leading-none hidden sm:inline`}>Journal</span>
                        </button>

                        <button 
                            onClick={() => setActiveTab('party')}
                            className={`group flex items-center gap-2 pb-1 transition-all ${activeTab === 'party' ? 'text-indigo-950 border-b-4 border-indigo-900' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            <Users size={28} strokeWidth={activeTab === 'party' ? 2.5 : 2} className="transition-transform group-hover:-translate-y-1" />
                            <span className={`text-2xl font-black uppercase tracking-[0.1em] font-serif leading-none hidden sm:inline`}>Groupe</span>
                        </button>
                    </div>

                    {activeTab === 'journal' ? (
                        <button 
                            onClick={addNote}
                            className="flex items-center gap-2 bg-indigo-700 text-white pl-3 pr-4 py-2 rounded-sm shadow-md hover:bg-indigo-800 transition-all hover:-translate-y-0.5 font-bold text-sm z-50 ml-auto"
                            title="Ajouter une nouvelle page à la fin"
                        >
                            <Plus size={18} strokeWidth={3} /> <span className="uppercase tracking-wide hidden sm:inline">Nouvelle Page</span>
                        </button>
                    ) : (
                       <div className="ml-auto flex items-center gap-2 text-stone-500 font-serif italic text-sm">
                           <PenTool size={16} /> Édition libre
                       </div>
                    )}
                    
                    <div className="absolute top-0 right-8 text-red-700 drop-shadow-md">
                        <Bookmark size={40} fill="currentColor" />
                    </div>
              </div>

              {/* --- CONTENT AREA --- */}
              <div className="flex-grow flex flex-col overflow-hidden bg-stone-50/20 relative">
                  
                  {activeTab === 'journal' && (
                      <>
                        <div className="flex-grow flex flex-col overflow-hidden p-6 md:p-12">
                            {!currentNote && (
                                <div className="flex-grow flex flex-col items-center justify-center text-stone-400 italic gap-6 opacity-60 animate-in fade-in duration-1000">
                                    <div className="w-24 h-24 border-4 border-stone-300 rounded-full flex items-center justify-center">
                                        <Book size={48} strokeWidth={1} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-serif text-stone-500">Le journal est vierge.</p>
                                        <p className="text-sm mt-2 font-handwriting text-xl text-stone-400">Cliquez sur "Nouvelle Page" pour commencer l'histoire.</p>
                                    </div>
                                </div>
                            )}

                            {currentNote && (
                                <div className="w-full h-full flex flex-col animate-in fade-in zoom-in duration-300">
                                    <div className="bg-white border border-stone-300 shadow-sm relative w-full h-full flex flex-col rounded-sm overflow-hidden flex-grow min-h-0">
                                            
                                            {/* Note Header */}
                                            <div className="bg-stone-100 border-b border-stone-200 p-3 flex items-center justify-between pl-4 shrink-0 rounded-t-sm z-20">
                                                <div className="flex items-center gap-3 flex-grow min-w-0">
                                                    <div className="w-[130px] shrink-0">
                                                        <input 
                                                            type="date"
                                                            className="w-full bg-transparent border-b border-dotted border-stone-400 focus:border-indigo-500 outline-none text-base font-handwriting text-stone-800 font-bold"
                                                            value={currentNote.date}
                                                            onChange={(e) => updateNote(currentNote.id, 'date', e.target.value)}
                                                            style={{ colorScheme: 'light' }}
                                                        />
                                                    </div>

                                                    <div className="h-8 w-px bg-stone-300 mx-1"></div>
                                                    <input 
                                                        type="text"
                                                        value={currentNote.title}
                                                        onChange={(e) => updateNote(currentNote.id, 'title', e.target.value)}
                                                        placeholder="Titre de la session..."
                                                        className="bg-transparent text-lg font-serif font-bold text-indigo-950 focus:outline-none flex-grow placeholder-stone-300"
                                                    />
                                                </div>
                                                
                                                <div className="flex items-center gap-1 no-print shrink-0 ml-2">
                                                    {/* Image Draw Button */}
                                                    <button
                                                        onClick={toggleDrawMode}
                                                        className={`p-2 rounded transition-colors flex items-center gap-1 ${isDrawingImage ? 'bg-indigo-600 text-white shadow-inner animate-pulse' : 'text-stone-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                                        title={isDrawingImage ? "Mode dessin actif - Cliquez pour annuler" : "Dessiner une zone pour l'image"}
                                                    >
                                                        <ImageIcon size={18} />
                                                        {isDrawingImage && <span className="text-xs font-bold px-1">Annuler</span>}
                                                    </button>
                                                    <input 
                                                        type="file" 
                                                        ref={fileInputRef} 
                                                        className="hidden" 
                                                        accept="image/*" 
                                                        onChange={handleImageUpload} 
                                                    />

                                                    <button 
                                                        onClick={() => setNoteIdToDelete(currentNote.id)}
                                                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Arracher cette page"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Note Content Wrapper */}
                                            <div className="flex-grow min-h-0 bg-white relative rounded-b-sm">
                                                <NotebookTextarea 
                                                    value={currentNote.content}
                                                    onChange={(v) => updateNote(currentNote.id, 'content', v)}
                                                    placeholder="Récit des événements..."
                                                    isDrawing={isDrawingImage}
                                                    onDrawComplete={handleDrawComplete}
                                                    imageNodes={
                                                        currentNote.images && currentNote.images.map((img) => (
                                                            <NoteImageZone 
                                                                key={img.id}
                                                                uniqueId={img.id}
                                                                imageId={img.imageId} 
                                                                config={img.config}
                                                                onUpdateConfig={(cfg) => handleUpdateImageConfig(img.id, cfg)}
                                                                onDelete={() => handleRemoveImage(img.id)}
                                                            />
                                                        ))
                                                    }
                                                />
                                            </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* BOOK FOOTER */}
                        <div className="shrink-0 bg-[#fdfbf7] py-3 border-t border-stone-200 flex justify-center items-center px-8 md:px-12 text-stone-500 font-serif select-none relative z-30">
                            <div className="font-mono text-xs uppercase tracking-widest text-stone-400 font-bold">
                                {totalPages > 0 ? (
                                    <span>Page {currentIndex + 1} <span className="mx-1 text-stone-300">/</span> {totalPages}</span>
                                ) : (
                                    <span>-</span>
                                )}
                            </div>
                        </div>
                      </>
                  )}

                  {activeTab === 'party' && (
                      <div className="flex-grow flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300">
                          <PartyTable data={data} onChange={onChange} onAddLog={onAddLog} />
                      </div>
                  )}

              </div>

          </div>

          <div className="w-12 flex justify-start">
             {activeTab === 'journal' && (
                <button 
                    onClick={goToNext}
                    disabled={currentIndex >= totalPages - 1}
                    className={`p-3 rounded-full bg-stone-800 text-stone-200 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-stone-600 hover:bg-stone-700 hover:scale-110 hover:text-white transition-all duration-300 ${currentIndex >= totalPages - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    title="Page suivante"
                >
                    <ChevronRight size={28} strokeWidth={3} />
                </button>
             )}
          </div>

      </div>

      {/* MODAL DE CONFIRMATION */}
      {noteIdToDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 animate-in fade-in duration-200 no-print">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-in zoom-in duration-200 border-2 border-stone-200">
                <div className="bg-stone-50 p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 shadow-inner">
                         <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Arracher cette page ?</h3>
                    <div className="bg-white p-3 rounded border border-stone-200 shadow-sm w-full mb-4 text-left">
                        <span className="block font-bold text-gray-800 truncate">{noteToDelete?.title || 'Note sans titre'}</span>
                        <span className="text-xs text-gray-500 block">{noteToDelete?.date}</span>
                    </div>
                    <p className="text-gray-500 text-xs">
                        Cette action est définitive. Le contenu sera perdu à jamais.
                    </p>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-100">
                    <button 
                        onClick={() => setNoteIdToDelete(null)} 
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-colors text-sm"
                    >
                        Garder
                    </button>
                    <button 
                        onClick={confirmDeleteNote} 
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md transition-colors text-sm"
                    >
                        Détruire
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CampaignNotes;
