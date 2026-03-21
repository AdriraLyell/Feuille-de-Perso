import { Node, mergeAttributes } from '@tiptap/core';
import type { CommandProps, RawCommands } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ActHeaderView from '../components/campaign/book/ActHeaderView';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        actHeading: {
            setAct: () => ReturnType;
            appendAct: () => ReturnType;
            insertAct: (atSelection?: boolean, cursorPos?: number) => ReturnType;
        };
    }
}

export const ActHeading = Node.create({
    name: 'actHeading',

    group: 'block',

    content: 'inline*',

    defining: true,

    addAttributes() {
        return {
            breakBefore: {
                default: true,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="act-heading"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'act-heading' }), 0];
    },

    addCommands() {
        return {
            setAct:
                () =>
                    ({ chain, state }: CommandProps) => {
                        const { selection } = state;
                        const { empty } = selection;

                        if (empty) {
                            return chain()
                                .splitBlock()
                                .insertContent({
                                    type: this.name,
                                    content: [{ type: 'text', text: 'Nouvel Acte' }],
                                })
                                .focus()
                                .run();
                        }

                        return chain()
                            .insertContent({
                                type: this.name,
                            })
                            .focus()
                            .run();
                    },

            appendAct:
                () =>
                    ({ chain, state }: CommandProps) => {
                        const endPos = state.doc.content.size;
                        return chain()
                            .focus()
                            .insertContentAt(endPos, [
                                {
                                    type: this.name,
                                    content: [{ type: 'text', text: 'Nouvel Acte' }],
                                },
                                {
                                    type: 'paragraph',
                                }
                            ])
                            .focus(endPos + 1)
                            .run();
                    },

            insertAct:
                (atSelection?: boolean, cursorPos?: number) =>
                    ({ chain, state }: CommandProps) => {
                        if (atSelection) {
                            const pos = cursorPos ?? state.selection.$to.pos;
                            return chain()
                                .insertContentAt(pos, [
                                    {
                                        type: this.name,
                                        attrs: { breakBefore: false },
                                        content: [{ type: 'text', text: 'Nouvel Acte' }],
                                    },
                                    { type: 'paragraph' }
                                ])
                                .focus()
                                .run();
                        }

                        const endPos = state.doc.content.size;
                        return chain()
                            .focus()
                            .insertContentAt(endPos, [
                                {
                                    type: this.name,
                                    content: [{ type: 'text', text: 'Nouvel Acte' }],
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
        return ReactNodeViewRenderer(ActHeaderView);
    },
});

