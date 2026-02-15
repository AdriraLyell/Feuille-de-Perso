import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { ChapterHeading } from '../../../../extensions/chapterHeading';
import { BookImage } from '../../../../extensions/bookImage';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';

/**
 * Setup for Tiptap extensions used in the ColumnarEditor (Grimoire/Journal).
 * Centralized here to keep the main component clean.
 */
export const getBookExtensions = () => [
    StarterKit.configure({
        heading: {
            levels: [1, 2, 3],
        },
    }),
    BookImage,
    ChapterHeading,
    TextStyle,
    Color,
    Underline,
    Highlight.configure({
        multicolor: true,
    }),
    TextAlign.configure({
        types: ['heading', 'paragraph', 'chapterHeading'],
    }),
    Placeholder.configure({
        placeholder: 'Écrivez votre récit ici...',
    }),
];
