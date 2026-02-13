import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TextSelection } from 'prosemirror-state';
import ChapterHeaderView from '../components/campaign/book/ChapterHeaderView';

export const ChapterHeading = Node.create({
    name: 'chapterHeading',

    group: 'block',

    content: 'inline*',

    defining: true,

    addAttributes() {
        return {
            date: {
                default: '',
            },
            level: {
                default: 1,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="chapter-heading"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'chapter-heading' }), 0];
    },

    addCommands() {
        return {
            setChapter:
                () =>
                    ({ chain }) => {
                        return chain()
                            .insertContent({
                                type: this.name,
                                attrs: { date: new Date().toISOString().split('T')[0] },
                                content: [{ type: 'text', text: 'Nouveau Chapitre' }],
                            })
                            .command(({ tr, dispatch }) => {
                                // Logic removed here: the React component handles selection on mount
                                // for better stability with NodeViews.
                                return true;
                            })
                            .focus()
                            .run();
                    },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(ChapterHeaderView as any);
    },
});
