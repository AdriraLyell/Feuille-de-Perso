import React, { useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Editor, NodeViewProps } from '@tiptap/core';
import { Calendar } from 'lucide-react';

interface ChapterHeaderViewProps extends Omit<NodeViewProps, 'node' | 'editor'> {
    node: NodeViewProps['node'] & { attrs: { date: string } };
    editor: Editor;
    updateAttributes: (attrs: Partial<{ date: string }>) => void;
}

const ChapterHeaderView: React.FC<ChapterHeaderViewProps> = ({ node, editor, getPos, updateAttributes }) => {
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Surgical Selection: Select the title text natively via Tiptap/ProseMirror
    // if it's a freshly created chapter (with the default text).
    useEffect(() => {
        const isDefault = node.content?.size > 0 &&
            node.content.firstChild?.text === 'Nouveau Chapitre';

        if (isDefault && typeof getPos === 'function') {
            // We use the editor instance provided by Tiptap to set a native 
            // TextSelection. This is much more robust than DOM selection.
            const timer = setTimeout(() => {
                try {
                    const pos = getPos();
                    // In ProseMirror, the text starts at getPos() + 1
                    const from = pos + 1;
                    const to = from + node.content.size;

                    editor.chain()
                        .focus()
                        .setTextSelection({ from, to })
                        .run();
                } catch (err) {
                    // Silently fail if pos is invalid during a concurrent update
                }
            }, 60);
            return () => clearTimeout(timer);
        }
    }, []); // Run only once on mount

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Date du récit...';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const handleIconClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (dateInputRef.current) {
            if ('showPicker' in dateInputRef.current) {
                (dateInputRef.current as any).showPicker();
            } else {
                dateInputRef.current.click();
            }
        }
    };

    return (
        <NodeViewWrapper className="chapter-header-wrapper mt-8 mb-6 border-b border-stone-800/30 pb-4 relative group w-full">
            <div className="flex flex-col gap-2 w-full text-center">
                <div className="flex items-center justify-center gap-2 text-stone-500 font-serif italic tracking-wider">
                    <button
                        type="button"
                        onClick={handleIconClick}
                        className="p-1 hover:bg-stone-800/5 rounded-full transition-colors cursor-pointer border-none bg-transparent"
                        title="Choisir une date"
                    >
                        <Calendar size={14} className="opacity-50" />
                    </button>

                    <input
                        ref={dateInputRef}
                        type="date"
                        value={node.attrs.date}
                        className="absolute opacity-0 pointer-events-none w-0 h-0"
                        onChange={(e) => updateAttributes({ date: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                    />

                    <span
                        className="text-xs text-center min-w-[100px] hover:bg-stone-800/5 rounded px-2 transition-colors cursor-pointer"
                        onClick={handleIconClick}
                    >
                        {formatDate(node.attrs.date)}
                    </span>
                </div>

                <div className="font-serif font-bold text-3xl text-stone-900 tracking-tight uppercase">
                    <NodeViewContent />
                </div>

                <div className="w-16 h-px bg-stone-400 mx-auto mt-2" />
            </div>
        </NodeViewWrapper>
    );
};

export default ChapterHeaderView;
