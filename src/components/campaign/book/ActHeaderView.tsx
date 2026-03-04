import React, { useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Editor, NodeViewProps } from '@tiptap/core';
import { BookOpen } from 'lucide-react';

interface ActHeaderViewProps extends Omit<NodeViewProps, 'node' | 'editor'> {
    node: NodeViewProps['node'];
    editor: Editor;
}

const ActHeaderView: React.FC<ActHeaderViewProps> = ({ node, editor, getPos }) => {

    useEffect(() => {
        const isDefault = node.content?.size > 0 &&
            node.content.firstChild?.text === 'Nouvel Acte';

        if (isDefault && typeof getPos === 'function') {
            const selectText = () => {
                if (editor.isDestroyed) return;

                try {
                    const pos = (getPos as () => number)();
                    const from = pos + 1;
                    const to = from + node.content.size;

                    editor.chain()
                        .focus()
                        .setTextSelection({ from, to })
                        .run();
                } catch {
                    // Silently fail if pos is invalid during a concurrent update
                }
            };

            const timer = setTimeout(() => {
                requestAnimationFrame(selectText);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [editor, getPos, node]);

    return (
        <NodeViewWrapper className="act-header-wrapper mt-16 mb-10 pb-6 relative group w-full text-center flex flex-col items-center">
            {/* Act Visual Decoration */}
            <div className="flex items-center justify-center gap-4 mb-4 text-amber-800/60">
                <div className="h-px w-24 bg-gradient-to-r from-transparent to-amber-800/40" />
                <BookOpen size={28} className="text-amber-800/80 drop-shadow-sm" />
                <div className="h-px w-24 bg-gradient-to-l from-transparent to-amber-800/40" />
            </div>

            {/* Title Content */}
            <div className="font-serif font-black text-4xl text-stone-900 tracking-widest uppercase pb-2">
                <NodeViewContent />
            </div>

            <div className="w-48 h-1 bg-gradient-to-r from-transparent via-amber-800/40 to-transparent mx-auto mt-4" />
        </NodeViewWrapper>
    );
};

export default ActHeaderView;
