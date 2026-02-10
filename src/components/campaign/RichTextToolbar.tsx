
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
        { id: 'hiliteColor', icon: <Highlighter size={16} />, label: 'Surligner Jaune', value: '#fbbf24' },
        { id: 'hiliteColorGreen', icon: <Highlighter size={16} className="text-green-600" />, label: 'Surligner Vert', value: '#86efac', command: 'hiliteColor' },
        { id: 'hiliteColorPink', icon: <Highlighter size={16} className="text-pink-600" />, label: 'Surligner Rose', value: '#f9a8d4', command: 'hiliteColor' },
        { id: 'divider1', type: 'divider' },
        { id: 'justifyLeft', icon: <AlignLeft size={16} />, label: 'Aligner à gauche' },
        { id: 'justifyCenter', icon: <AlignCenter size={16} />, label: 'Centrer' },
        { id: 'justifyFull', icon: <AlignJustify size={16} />, label: 'Justifier' },
        { id: 'divider2', type: 'divider' },
        { id: 'insertUnorderedList', icon: <List size={16} />, label: 'Liste à puces' },
        { id: 'insertOrderedList', icon: <ListOrdered size={16} />, label: 'Liste numérotée' },
        { id: 'divider3', type: 'divider' },
        { id: 'foreColor', icon: <Pen size={16} />, label: 'Encre Noire', value: '#1c1917' },
        { id: 'foreColorRed', icon: <Pen size={16} className="text-red-700" />, label: 'Encre Sang', value: '#991b1b', command: 'foreColor' },
        { id: 'foreColorBlue', icon: <Pen size={16} className="text-blue-700" />, label: 'Encre Bleue', value: '#1e40af', command: 'foreColor' },
        { id: 'foreColorGreen', icon: <Pen size={16} className="text-emerald-700" />, label: 'Encre Émeraude', value: '#047857', command: 'foreColor' },
        { id: 'foreColorPurple', icon: <Pen size={16} className="text-purple-700" />, label: 'Encre Mystique', value: '#7e22ce', command: 'foreColor' },
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
                            onCommand(btn.command || btn.id, btn.value);
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

// Internal icon for Pen since lucide might have different names or I need a custom look
const Pen = ({ size, className }: { size: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m12 19 7-7 3 3-7 7-3-3z" />
        <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="m2 2 5 2" />
        <path d="m2 2 2 5" />
        <path d="m11 8 2 2" />
    </svg>
);

export default RichTextToolbar;
