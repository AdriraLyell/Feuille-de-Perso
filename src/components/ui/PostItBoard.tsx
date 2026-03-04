import React from 'react';
import { motion, PanInfo } from 'framer-motion';
import { useCharacter } from '../../context/CharacterContext';
import { PostItData, CharacterSheetData } from '../../types';
import { StickyNote, X, Plus } from 'lucide-react';
// import { v4 as uuidv4 } from 'uuid'; replaced by crypto.randomUUID()

interface PostItBoardProps {
    currentTab: string;
}

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
    const { data, updateData } = useCharacter();
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
}

const PostItNote: React.FC<PostItNoteProps> = ({ data, onUpdate, onDelete }) => {
    // Stable random seed for rotation based on ID
    const rotation = React.useMemo(() => {
        const hash = data.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return (hash % 6) - 3; // -3 to 3 degrees
    }, [data.id]);

    return (
        <motion.div
            drag
            dragMomentum={false}
            onDragEnd={(e, info) => {
                onUpdate({ x: data.x + info.offset.x, y: data.y + info.offset.y });
            }}
            initial={{ x: data.x, y: data.y, opacity: 0, scale: 0.8, rotate: rotation }}
            animate={{ x: data.x, y: data.y, opacity: 1, scale: 1, rotate: rotation }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
                backgroundColor: data.color,
                position: 'absolute',
                width: 'max-content',
                zIndex: 45
            }}
            className="pointer-events-auto shadow-[2px_2px_10px_rgba(0,0,0,0.15)] border border-black/5 rounded-sm flex flex-col group transition-shadow hover:shadow-xl"
        >
            <div className="h-6 w-full cursor-grab active:cursor-grabbing flex justify-between items-center px-1 bg-black/5">
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
                <button
                    onClick={onDelete}
                    className="text-black/40 hover:text-red-600 hover:bg-red-100 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer"
                >
                    <X size={14} />
                </button>
            </div>
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
