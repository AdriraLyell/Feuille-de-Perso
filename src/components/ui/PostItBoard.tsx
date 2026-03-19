import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { useCharacterState, useCharacterActions } from '../../context/CharacterContext';
import { PostItData, CharacterSheetData } from '../../types';
import { StickyNote, X, Plus, SendToBack } from 'lucide-react';
// import { v4 as uuidv4 } from 'uuid'; replaced by crypto.randomUUID()

interface PostItBoardProps {
    currentTab: string;
}

const TABS = [
    { id: 'p1', label: 'Personnage' },
    { id: 'p2', label: 'Détails' },
    { id: 'inventaire', label: 'Inventaire' },
    { id: 'specs', label: 'Spécialités' },
    { id: 'xp', label: 'Gestion XP' },
    { id: 'notes', label: 'Journal' }
];

const COLORS = [
    { name: 'Jaune', value: '#FEF08A' },
    { name: 'Bleu', value: '#BAE6FD' },
    { name: 'Rose', value: '#FECDD3' },
    { name: 'Vert', value: '#BBF7D0' },
    { name: 'Orange', value: '#FED7AA' },
    { name: 'Violet', value: '#E9D5FF' },
    { name: 'Gris', value: '#E5E7EB' },
    { name: 'Rouge', value: '#FECACA' }
];

export const PostItBoard: React.FC<PostItBoardProps> = ({ currentTab }) => {
    const { data } = useCharacterState();
    const { updateData } = useCharacterActions();
    const postIts = data.postIts || [];
    const activePostIts = postIts.filter((p: PostItData) => p.tabId === currentTab);

    const [btnPos, setBtnPos] = React.useState(() => {
        try {
            const saved = localStorage.getItem('postit-btn-pos');
            return saved ? JSON.parse(saved) : { x: 0, y: 0 };
        } catch { return { x: 0, y: 0 }; }
    });

    const dragLock = React.useRef(false);

    const handleBtnDragStart = () => {
        dragLock.current = true;
    };

    const handleBtnDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const newPos = { x: btnPos.x + info.offset.x, y: btnPos.y + info.offset.y };
        setBtnPos(newPos);
        localStorage.setItem('postit-btn-pos', JSON.stringify(newPos));

        // Mantain lock for 100ms to swallow any trailing tap/click events
        setTimeout(() => {
            dragLock.current = false;
        }, 100);
    };

    const handleAddPostIt = () => {
        const id = crypto.randomUUID();
        const newPostIt: PostItData = {
            id,
            text: '',
            color: '#FEF08A',
            x: 150 + Math.random() * 100,
            y: 150 + Math.random() * 100,
            width: 250,
            height: 250,
            tabId: currentTab
        };
        updateData((prev: CharacterSheetData) => ({
            ...prev,
            postIts: [...(prev.postIts || []), newPostIt]
        }));
    };

    const handleUpdate = (id: string, updates: Partial<PostItData>) => {
        updateData((prev: CharacterSheetData) => ({
            ...prev,
            postIts: (prev.postIts || []).map((p: PostItData) => p.id === id ? { ...p, ...updates } : p)
        }));
    };

    const handleDelete = (id: string) => {
        updateData((prev: CharacterSheetData) => ({
            ...prev,
            postIts: (prev.postIts || []).filter((p: PostItData) => p.id !== id)
        }));
    };

    const handleTap = () => {
        if (!dragLock.current) {
            handleAddPostIt();
        }
    };

    return (
        <>
            {/* Floating Add Button */}
            <motion.div
                drag
                dragMomentum={false}
                onDragStart={handleBtnDragStart}
                onDragEnd={handleBtnDragEnd}
                onTap={handleTap}
                animate={{ x: btnPos.x, y: btnPos.y }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-6 right-6 z-50 flex items-center justify-center no-print cursor-grab active:cursor-grabbing"
            >
                <div
                    className="p-4 bg-amber-400 hover:bg-amber-500 text-amber-900 rounded-full shadow-lg transition-colors flex items-center justify-center relative border-2 border-amber-300 group"
                    title="Cliquer pour ajouter un Post-it / Glisser pour déplacer"
                >
                    <StickyNote size={24} />
                    <Plus size={14} className="absolute bottom-3 right-3 bg-white rounded-full bg-opacity-80 border border-amber-200 pointer-events-none" />

                    {/* Tooltip highlighting the drag functionality */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none shadow-xl border border-stone-600">
                        Cliquer: +Note | Glisser: Déplacer
                    </div>
                </div>
            </motion.div>

            {/* Render Post-its */}
            <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden no-print">
                {activePostIts.map(postIt => (
                    <PostItNote
                        key={postIt.id}
                        data={postIt}
                        onUpdate={(updates) => handleUpdate(postIt.id, updates)}
                        onDelete={() => handleDelete(postIt.id)}
                        currentTab={currentTab}
                    />
                ))}
            </div>
        </>
    );
};

interface PostItNoteProps {
    data: PostItData;
    onUpdate: (updates: Partial<PostItData>) => void;
    onDelete: () => void;
    currentTab: string;
}

const PostItNote: React.FC<PostItNoteProps> = ({ data, onUpdate, onDelete, currentTab }) => {
    const [showMoveMenu, setShowMoveMenu] = useState(false);
    const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
    
    // Stable random seed for rotation based on ID
    const rotation = React.useMemo(() => {
        const hash = data.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return (hash % 6) - 3; // -3 to 3 degrees
    }, [data.id]);

    const findTabUnderPoint = (x: number, y: number) => {
        if (x === undefined || y === undefined) return null;
        const elementsUnder = document.elementsFromPoint(x, y);
        for (const el of elementsUnder) {
            const tabBtn = el.closest('[data-postit-target]');
            if (tabBtn) {
                return tabBtn.getAttribute('data-postit-target');
            }
        }
        return null;
    };

    const handleDrag = (e: any, info: PanInfo) => {
        const target = findTabUnderPoint(info.point.x, info.point.y);
        if (target !== hoveredTabId) {
            // Visual feedback on the tab button itself (direct DOM to avoid full re-render)
            // Remove previous glow
            if (hoveredTabId) {
                const prevBtn = document.querySelector(`[data-postit-target="${hoveredTabId}"]`);
                if (prevBtn) prevBtn.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-70', 'scale-110');
            }
            
            // Add new glow
            if (target && target !== currentTab) {
                const nextBtn = document.querySelector(`[data-postit-target="${target}"]`);
                if (nextBtn) nextBtn.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-70', 'scale-110');
            }
            
            setHoveredTabId(target === currentTab ? null : target);
        }
    };

    const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Clear highlights
        if (hoveredTabId) {
            const btn = document.querySelector(`[data-postit-target="${hoveredTabId}"]`);
            if (btn) btn.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-70', 'scale-110');
        }
        
        const finalTarget = findTabUnderPoint(info.point.x, info.point.y);
        setHoveredTabId(null);

        if (finalTarget && finalTarget !== currentTab) {
            onUpdate({ 
                tabId: finalTarget, 
                x: 150 + Math.random() * 100, 
                y: 150 + Math.random() * 100 
            });
        } else {
            // Just update position
            onUpdate({ x: data.x + info.offset.x, y: data.y + info.offset.y });
        }
    };

    const hoveredTabLabel = hoveredTabId ? TABS.find(t => t.id === hoveredTabId)?.label : null;

    return (
        <motion.div
            drag
            dragMomentum={false}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            initial={{ x: data.x, y: data.y, opacity: 0, scale: 0.8, rotate: rotation }}
            animate={{ 
                x: data.x, 
                y: data.y, 
                opacity: hoveredTabId ? 0.6 : 1, 
                scale: hoveredTabId ? 0.9 : 1,
                rotate: hoveredTabId ? 0 : rotation 
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
                backgroundColor: data.color,
                position: 'absolute',
                width: 'max-content',
                zIndex: hoveredTabId ? 100 : (showMoveMenu ? 50 : 45)
            }}
            className={`pointer-events-auto shadow-[2px_2px_10px_rgba(0,0,0,0.15)] border rounded-sm flex flex-col group transition-shadow hover:shadow-xl ${hoveredTabId ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border-black/5'}`}
        >
            {/* Visual indicator for tab change */}
            {hoveredTabId && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap animate-bounce flex items-center gap-1">
                    <SendToBack size={10} />
                    Vers : {hoveredTabLabel}
                </div>
            )}

            <div className="h-6 w-full cursor-grab active:cursor-grabbing flex justify-between items-center px-1 bg-black/5 relative">
                <div className="flex gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {COLORS.map(c => (
                        <button
                            key={c.value}
                            className={`w-3 h-3 rounded-full border border-black/20 ${data.color === c.value ? 'ring-1 ring-black' : ''}`}
                            style={{ backgroundColor: c.value }}
                            onClick={() => onUpdate({ color: c.value })}
                            title={c.name}
                        />
                    ))}
                </div>
                
                <div className="flex gap-1">
                    <div className="relative">
                        <button
                            onClick={() => setShowMoveMenu(!showMoveMenu)}
                            className="text-black/40 hover:text-blue-700 hover:bg-blue-100 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Déplacer vers..."
                        >
                            <SendToBack size={14} />
                        </button>
                        
                        {showMoveMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-white shadow-xl rounded-md border border-gray-200 py-1 min-w-32 z-50">
                                <div className="text-[10px] font-bold text-gray-400 px-3 py-1 uppercase border-b border-gray-100 mb-1">
                                    Déplacer vers...
                                </div>
                                {TABS.filter(t => t.id !== currentTab).map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            onUpdate({ tabId: tab.id, x: 150 + Math.random() * 100, y: 150 + Math.random() * 100 });
                                            setShowMoveMenu(false);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onDelete}
                        className="text-black/40 hover:text-red-600 hover:bg-red-100 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
            
            {showMoveMenu && (
                <div className="absolute inset-0 z-40" onClick={() => setShowMoveMenu(false)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') setShowMoveMenu(false); }} aria-label="Close menu" />
            )}

            <textarea
                value={data.text}
                onChange={(e) => onUpdate({ text: e.target.value })}
                onMouseUp={(e) => {
                    const el = e.currentTarget;
                    const newWidth = el.offsetWidth;
                    const newHeight = el.offsetHeight + 24; // 24px is height of the header (h-6)
                    if (Math.abs(newWidth - data.width) > 2 || Math.abs(newHeight - data.height) > 2) {
                        onUpdate({ width: newWidth, height: newHeight });
                    }
                }}
                style={{ width: data.width || 200, height: Math.max(50, (data.height || 200) - 24) }}
                className="bg-transparent resize outline-none p-2 text-gray-800 font-sans text-sm leading-relaxed"
                placeholder="Nouvelle note..."
            />
        </motion.div>
    );
};

export default PostItBoard;
