import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import BookImageView from '../components/campaign/book/BookImageView';

export interface BookImageAttributes {
    imageId: string; // Reference to IndexedDB
    width: number | string;
    height?: number | string;
    align: 'left' | 'right' | 'center';
    caption?: string;
    filter?: 'none' | 'grayscale';
    fit?: 'cover' | 'contain' | 'fill';
    posX?: number;
    posY?: number;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        bookImage: {
            setBookImage: (attributes: BookImageAttributes) => ReturnType;
        };
    }
}

export const BookImage = Node.create({
    name: 'bookImage',

    group: 'block',

    draggable: true,

    atom: true, // It's a leaf node, doesn't contain content

    addAttributes() {
        return {
            imageId: {
                default: null,
            },
            width: {
                default: '100%',
            },
            height: {
                default: 'auto',
            },
            align: {
                default: 'center',
            },
            caption: {
                default: '',
            },
            filter: {
                default: 'none',
            },
            fit: {
                default: 'contain',
            },
            posX: {
                default: 50,
            },
            posY: {
                default: 50,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="book-image"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'book-image' })];
    },

    addCommands() {
        return {
            setBookImage:
                attributes =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: attributes,
                        });
                    },
        };
    },

    // Optional: Input rule to convert markdown image syntax if needed
    // addInputRules() { ... }

    addNodeView() {
        return ReactNodeViewRenderer(BookImageView as any);
    },
});
