import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { ChapterHeading } from '../../../../extensions/chapterHeading';
import { ActHeading } from '../../../../extensions/actHeading';
import { NarrativeSection } from '../../../../extensions/narrativeSection';
import { BookImage } from '../../../../extensions/bookImage';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';

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
    ActHeading,
    ChapterHeading,
    NarrativeSection,
    TextStyle,
    FontFamily,
    Color,
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
