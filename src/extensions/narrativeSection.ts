import { Node, mergeAttributes } from '@tiptap/core';
import type { CommandProps, RawCommands } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import NarrativeSectionView from '../components/campaign/book/NarrativeSectionView';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        narrativeSection: {
            insertNarrativeSection: (attrs: { type: string, dateStart?: string, dateEnd?: string, timeSlot?: string, time?: string, date?: string, isSection?: boolean, title?: string, id?: string }) => ReturnType;
        };
    }
}

export const NarrativeSection = Node.create({
    name: 'narrativeSection',

    group: 'block',

    content: 'block*',

    defining: true,

    addAttributes() {
        return {
            type: {
                default: 'moment', // moment, voyage, flashback, summary
            },
            dateStart: {
                default: '',
            },
            dateEnd: {
                default: '',
            },
            timeSlot: {
                default: '', // matin, midi, soir, nuit
            },
            time: {
                default: '', // heure spécifique
            },
            date: {
                default: '', // date spécifique (ex: flashback)
            },
            isSection: {
                default: false, // si vrai, apparaît dans le sommaire
            },
            title: {
                default: '', // titre personnalisé pour le sommaire
            },
            id: {
                default: null,
                parseHTML: element => element.getAttribute('data-id'),
                renderHTML: attributes => ({ 'data-id': attributes.id }),
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="narrative-section"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'narrative-section' }), 0];
    },

    addCommands() {
        return {
            insertNarrativeSection:
                (attrs) =>
                    ({ chain, state }: CommandProps) => {
                        const finalAttrs = {
                            ...attrs,
                            id: attrs.id || crypto.randomUUID(),
                        };
                        const { selection } = state;
                        const pos = selection.$to.pos;

                        return chain()
                            .insertContentAt(pos, [
                                {
                                    type: this.name,
                                    attrs: finalAttrs,
                                    content: [{ type: 'paragraph' }],
                                },
                                {
                                    type: 'paragraph',
                                }
                            ])
                            // Place cursor right after the narrative block
                            .setTextSelection(pos + 2) // Typically inside the created paragraph
                            .focus()
                            .run();
                    },
        } as RawCommands;
    },

    addNodeView() {
        return ReactNodeViewRenderer(NarrativeSectionView as any);
    },
});
