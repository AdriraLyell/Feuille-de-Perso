import { Node, mergeAttributes } from '@tiptap/core';
import type { CommandProps, RawCommands } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ChapterHeaderView from '../components/campaign/book/ChapterHeaderView';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        chapterHeading: {
            setChapter: () => ReturnType;
            appendChapter: () => ReturnType;
            insertChapterAtDate: (date: string, realDate?: string, atSelection?: boolean) => ReturnType;
        };
    }
}

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
            weather: {
                default: '',
            },
            realDate: {
                default: '',
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
                    ({ chain, state }: CommandProps) => {
                        const { selection } = state;
                        const { empty } = selection;

                        if (empty) {
                            // If cursor is in the middle of a paragraph, split it first!
                            return chain()
                                .splitBlock()
                                .insertContent({
                                    type: this.name,
                                    attrs: {
                                        date: new Date().toISOString().split('T')[0],
                                        realDate: new Date().toISOString().split('T')[0]
                                    },
                                    content: [{ type: 'text', text: 'Nouveau Chapitre' }],
                                })
                                .focus()
                                .run();
                        }

                        // If text is selected, convert it to a chapter
                        return chain()
                            .insertContent({
                                type: this.name,
                                attrs: {
                                    date: new Date().toISOString().split('T')[0],
                                    realDate: new Date().toISOString().split('T')[0]
                                },
                            })
                            .focus()
                            .run();
                    },

            appendChapter:
                () =>
                    ({ chain, state }: CommandProps) => {
                        const endPos = state.doc.content.size;
                        return chain()
                            .focus() // Focus first to ensure editor is active
                            .insertContentAt(endPos, [
                                {
                                    type: this.name,
                                    attrs: {
                                        date: new Date().toISOString().split('T')[0],
                                        realDate: new Date().toISOString().split('T')[0]
                                    },
                                    content: [{ type: 'text', text: 'Nouveau Chapitre' }],
                                },
                                {
                                    type: 'paragraph',
                                }
                            ])
                            .focus(endPos + 1) // Hard focus on the new node
                            .run();
                    },

            insertChapterAtDate:
                (date: string, realDate?: string, atSelection?: boolean) =>
                    ({ chain, state }: CommandProps) => {
                        const finalRealDate = realDate || new Date().toISOString().split('T')[0];

                        if (atSelection) {
                            return chain()
                                .focus()
                                .splitBlock()
                                .insertContent({
                                    type: this.name,
                                    attrs: {
                                        date,
                                        realDate: finalRealDate
                                    },
                                    content: [{ type: 'text', text: 'Nouveau Chapitre' }],
                                })
                                .insertContent({ type: 'paragraph' })
                                .run();
                        }

                        const endPos = state.doc.content.size;
                        return chain()
                            .focus()
                            .insertContentAt(endPos, [
                                {
                                    type: this.name,
                                    attrs: {
                                        date,
                                        realDate: finalRealDate
                                    },
                                    content: [{ type: 'text', text: 'Nouveau Chapitre' }],
                                },
                                {
                                    type: 'paragraph',
                                }
                            ])
                            .focus(endPos + 1)
                            .run();
                    },
        } as RawCommands;
    },

    addNodeView() {
        return ReactNodeViewRenderer(ChapterHeaderView as any);
    },
});

