import { useState, useEffect, useCallback, RefObject } from 'react';
import { Editor } from '@tiptap/react';
import { PAGE_WIDTH } from '../constants';
import { TOCEntry } from './BookTableOfContents';

export function useBookTableOfContents(
    editor: Editor | null,
    contentRef: RefObject<HTMLDivElement>,
    pageOffset: number = 1 // TOC takes 1 page
) {
    const [entries, setEntries] = useState<TOCEntry[]>([]);

    const updateTOC = useCallback(() => {
        if (!contentRef.current) return;

        const headers = contentRef.current.querySelectorAll('.chapter-header-wrapper');
        const newEntries: TOCEntry[] = [];
        const stride = PAGE_WIDTH + 40;

        headers.forEach((header) => {
            const htmlHeader = header as HTMLElement;
            // The title is in NodeViewContent, which renders as a div with font-serif
            const titleElement = htmlHeader.querySelector('.font-serif.font-bold.text-3xl');
            const dateElement = htmlHeader.querySelector('.text-xs.text-center');

            const title = titleElement?.textContent || 'Chapitre sans titre';
            const dateText = dateElement?.textContent || '';

            // Calculate page number
            // offsetLeft is relative to the content container
            // We add pageOffset (usually 1) because content starts after the TOC
            // And we add 1 because page numbers are 1-based.
            const left = htmlHeader.offsetLeft;
            const pageIndex = Math.floor(left / stride) + pageOffset + 1;

            newEntries.push({
                title,
                date: dateText,
                page: pageIndex
            });
        });

        setEntries(newEntries);
    }, [contentRef, pageOffset]);

    useEffect(() => {
        if (!editor) return;

        // Defer the TOC update when triggered by editor events to avoid
        // calling setState synchronously during Tiptap's internal flushSync cycle.
        let rafId: number | null = null;
        const deferredUpdateTOC = () => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                rafId = null;
                updateTOC();
            });
        };

        editor.on('update', deferredUpdateTOC);

        // Initial delayed update to allow DOM to settle
        const timeout = setTimeout(updateTOC, 500);

        const observer = new ResizeObserver(() => {
            // Debounce or at least use requestAnimationFrame for stability
            requestAnimationFrame(updateTOC);
        });

        if (contentRef.current) {
            observer.observe(contentRef.current);
        }

        return () => {
            editor.off('update', deferredUpdateTOC);
            if (rafId !== null) cancelAnimationFrame(rafId);
            clearTimeout(timeout);
            observer.disconnect();
        };
    }, [editor, updateTOC, contentRef]);

    return { entries, updateTOC };
}
