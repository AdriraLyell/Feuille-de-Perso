import React from 'react';

export const ColumnarEditorStyles = () => (
    <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .vertical-text { writing-mode: vertical-rl; text-orientation: mixed; }

        /* IMPORTANT: The container width is PAGE_WIDTH (722px). 
           The ProseMirror editor takes 100% of that WIDTH. 
           Padding is INSIDE the editor, reducing content width to 602px (722 - 60*2).
           Because box-sizing is border-box, width: 100% = 722px. 
           This matches the column width perfectly. */
        .ProseMirror {
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            outline: none;
            padding: 0 60px !important;
            color: #1c1917; /* Override text-stone-200 hérité du thème sombre (MainLayout) */
        }

        .ProseMirror > * {
            margin-left: 0 !important;
            margin-right: 0 !important;
            max-width: none !important;
        }    
        .ProseMirror p {
            break-inside: auto !important;
            page-break-inside: auto !important;
            widows: 1 !important;
            orphans: 1 !important;
            margin-bottom: 1em;
            line-height: 1.6;
        }

        h1, h2, h3, .chapter-header-wrapper {
            break-before: column;
            break-after: avoid;
            break-inside: avoid;
            margin-top: 0; /* Reset top margin for first line alignment */
        }
        
        /* Prevent images from being cut */
        img, .book-image-view {
            break-inside: avoid;
            max-width: 100%;
        }

        /* Float wrapping: generous margin so text breathes around images */
        .book-image-view[data-align="left"],
        .book-image-view[data-align="right"],
        .book-image-view[data-align="free"] {
            shape-outside: margin-box;
            shape-margin: 8px;
        }

        .book-image-view[data-align="left"] {
            margin-right: 1.5rem !important;
            margin-bottom: 0.75rem !important;
        }
        .book-image-view[data-align="right"] {
            margin-left: 1.5rem !important;
            margin-bottom: 0.75rem !important;
        }
        .book-image-view[data-align="free"] {
            margin-bottom: 0.75rem !important;
        }

        /* Block elements after floated images must clear to avoid overlap */
        .ProseMirror > [data-node-view-wrapper] + .chapter-header-wrapper,
        .ProseMirror > [data-node-view-wrapper] + h1,
        .ProseMirror > [data-node-view-wrapper] + h2,
        .ProseMirror > [data-node-view-wrapper] + h3,
        .ProseMirror blockquote,
        .ProseMirror hr {
            clear: both;
        }

        /* Make TipTap node-view wrappers transparent for floated images
           so that float works properly (text wraps, images can be side-by-side) */
        .ProseMirror > [data-node-view-wrapper]:has(.book-image-view[data-align="left"]),
        .ProseMirror > [data-node-view-wrapper]:has(.book-image-view[data-align="right"]),
        .ProseMirror > [data-node-view-wrapper]:has(.book-image-view[data-align="free"]) {
            display: contents;
        }

        /* Custom Rich Styles for Grimoire */
        .journal-highlight {
            background-color: #f59e0b40;
            padding: 0 2px;
            border-radius: 2px;
            box-shadow: 0 0 5px #f59e0b20;
        }

        .ProseMirror blockquote {
            border-left: 3px solid #b45309;
            padding-left: 1.5rem;
            margin: 1.5rem 0;
            font-style: italic;
            color: #444;
            background: rgba(180, 83, 9, 0.03);
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
            border-radius: 0 4px 4px 0;
            position: relative;
        }

        .ProseMirror blockquote::before {
            content: '"';
            position: absolute;
            left: 0.5rem;
            top: -0.5rem;
            font-size: 3rem;
            color: #b4530920;
            font-family: serif;
        }

        .ProseMirror hr {
            border: none;
            border-top: 1px solid #b4530930;
            margin: 2rem auto;
            width: 60%;
            position: relative;
        }

        .ProseMirror hr::after {
            content: '◈';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fbf4e9;
            padding: 0 10px;
            color: #b4530950;
            font-size: 0.8rem;
        }

        .ProseMirror ul, .ProseMirror ol {
            padding-left: 2rem;
            margin-bottom: 1rem;
        }

        .ProseMirror ul {
            list-style: none;
        }

        .ProseMirror ol {
            list-style: decimal;
            color: #b45309;
        }

        .ProseMirror ol li::marker {
            font-weight: bold;
        }

        .ProseMirror li p {
            color: #1c1917; /* Revert to stone-900 for text inside lists */
        }

        .ProseMirror ul li {
            position: relative;
        }

        .ProseMirror ul li::before {
            content: '•';
            position: absolute;
            left: -1.2rem;
            color: #b45309;
            font-size: 1.2rem;
        }

        /* Premium Drop Cursor */
        .ProseMirror-dropcursor {
            border-left: 2px solid #6366f1 !important;
            margin-left: -1px;
            box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);
            animation: pulse-drop-cursor 1.5s infinite;
            z-index: 50;
        }

        @keyframes pulse-drop-cursor {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
    `}</style>
);
