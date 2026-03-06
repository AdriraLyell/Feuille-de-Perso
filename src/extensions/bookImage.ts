import { Node, mergeAttributes } from '@tiptap/core';
import type { RawCommands } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import BookImageView from '../components/campaign/book/BookImageView';
import { saveImage } from '../services/imageDB';

export interface BookImageAttributes {
    imageId: string; // Reference to IndexedDB
    width: number | string;
    height?: number | string;
    align: 'left' | 'right' | 'center' | 'free';
    caption?: string;
    filter?: 'none' | 'grayscale';
    fit?: 'cover' | 'contain' | 'fill';
    posX?: number;
    posY?: number;
    offsetX?: number;
    offsetY?: number;
    wrapSide?: 'left' | 'right';
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        bookImage: {
            setBookImage: (attributes: BookImageAttributes) => ReturnType;
            deleteBookImage: () => ReturnType;
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
            offsetX: {
                default: 0,
            },
            offsetY: {
                default: 0,
            },
            wrapSide: {
                default: 'left',
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
                    ({ chain }) => {
                        return chain()
                            .insertContent([
                                {
                                    type: this.name,
                                    attrs: attributes,
                                },
                                {
                                    type: 'paragraph',
                                }
                            ])
                            .focus()
                            .run();
                    },
            deleteBookImage:
                () =>
                    ({ commands, state }) => {
                        const { selection } = state;
                        const node = state.doc.nodeAt(selection.from);
                        if (node?.type.name === 'bookImage' && node.attrs.imageId) {
                            import('../services/imageDB').then(({ deleteImage }) => {
                                deleteImage(node.attrs.imageId);
                            });
                        }
                        return commands.deleteSelection();
                    },
        } as RawCommands;
    },

    addNodeView() {
        return ReactNodeViewRenderer(BookImageView as any);
    },

    addProseMirrorPlugins() {
        const insertImage = async (
            view: import('@tiptap/pm/view').EditorView,
            file: File,
            pos: number
        ) => {
            if (!file.type.startsWith('image/')) return false;
            try {
                const imageId = await saveImage(file);
                const node = view.state.schema.nodes.bookImage.create({
                    imageId,
                    width: '50%',
                    height: 'auto',
                    fit: 'contain',
                    align: 'center',
                });
                const tr = view.state.tr.insert(pos, node);
                view.dispatch(tr);
                return true;
            } catch {
                return false;
            }
        };

        return [
            new Plugin({
                key: new PluginKey('bookImageDropPaste'),
                props: {
                    handleDrop(view, event) {
                        // If ProseMirror is already handling a node drag (internal move), 
                        // ignore the files to prevent duplication.
                        const isInternalDrag = (view as unknown as { dragging: boolean }).dragging ||
                            event.dataTransfer?.types.includes('application/x-prosemirror-nodes') ||
                            event.dataTransfer?.types.includes('text/x-prosemirror-nodes');

                        if (isInternalDrag) return false;

                        if (!event.dataTransfer?.files?.length) return false;
                        const file = Array.from(event.dataTransfer.files).find(f => f.type.startsWith('image/'));
                        if (!file) return false;

                        event.preventDefault();
                        const coords = { left: event.clientX, top: event.clientY };
                        const pos = view.posAtCoords(coords);
                        if (!pos) return false;

                        insertImage(view, file, pos.pos);
                        return true;
                    },
                    handlePaste(view, event) {
                        const items = event.clipboardData?.items;
                        if (!items) return false;

                        const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
                        if (!imageItem) return false;

                        const file = imageItem.getAsFile();
                        if (!file) return false;

                        event.preventDefault();
                        const { from } = view.state.selection;
                        insertImage(view, file, from);
                        return true;
                    },
                },
            }),
            // Trailing paragraph: ensure document always ends with a paragraph
            // so text can flow around floating images at the end of the document
            new Plugin({
                key: new PluginKey('bookImageTrailingParagraph'),
                appendTransaction: (_, __, newState) => {
                    const { doc, tr, schema } = newState;
                    const lastNode = doc.lastChild;
                    if (lastNode && lastNode.type.name !== 'paragraph') {
                        const paragraph = schema.nodes.paragraph.create();
                        tr.insert(doc.content.size, paragraph);
                        return tr;
                    }
                    return null;
                },
            }),
        ];
    },
});

