
import React from 'react';
import { Bold, Italic, List, ListOrdered, AlignLeft, AlignCenter, AlignJustify, Type, Bookmark, Highlighter } from 'lucide-react';

interface RichTextToolbarProps {
    onCommand: (command: string, value?: string) => void;
    activeCommands: string[];
}

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ onCommand, activeCommands }) => {
    const buttons = [
        { id: 'bold', icon: <Bold size={16} />, label: 'Gras' },
        { id: 'italic', icon: <Italic size={16} />, label: 'Italique' },
        { id: 'divider1', type: 'divider' },
        { id: 'insertUnorderedList', icon: <List size={16} />, label: 'Liste à puces' },
        { id: 'insertOrderedList', icon: <ListOrdered size={16} />, label: 'Liste numérotée' },
    ];

    return (
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-stone-200 p-1.5 rounded-lg shadow-xl pointer-events-auto">
            {buttons.map((btn, idx) => {
                if (btn.type === 'divider') return <div key={idx} className="w-px h-4 bg-stone-200 mx-1" />;

                const isActive = activeCommands.includes(btn.id);

                return (
                    <button
                        key={btn.id}
                        onMouseDown={(e) => {
                            e.preventDefault(); // Prevent focus loss
                            onCommand(btn.id);
                        }}
                        className={`p-1.5 rounded transition-colors ${isActive ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-stone-100 text-stone-600'
                            }`}
                        title={btn.label}
                    >
                        {btn.icon}
                    </button>
                );
            })}
        </div>
    );
};

export default RichTextToolbar;
