import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { PAGE_WIDTH } from '../constants';
import { TOCEntry } from './BookTableOfContents';

export function useBookTableOfContents(
    editor: Editor | null,
    contentRef: React.RefObject<HTMLDivElement | null>
) {
    const [entries, setEntries] = useState<TOCEntry[]>([]);

    const updateTOC = useCallback(() => {
        if (!contentRef.current) return;

        const sections = contentRef.current.querySelectorAll('.act-header-wrapper, .chapter-header-wrapper, .narrative-section-container[data-is-section="true"]');
        const newEntries: TOCEntry[] = [];
        const stride = PAGE_WIDTH + 40;

        sections.forEach((section) => {
            const htmlSection = section as HTMLElement;
            let title: string;
            let dateText = '';
            let entryType: 'act' | 'chapter' | 'section';

            if (htmlSection.classList.contains('act-header-wrapper')) {
                const titleElement = htmlSection.querySelector('.font-serif.font-black.text-4xl');
                title = titleElement?.textContent || 'Nouvel Acte';
                entryType = 'act';
            } else if (htmlSection.classList.contains('chapter-header-wrapper')) {
                const titleElement = htmlSection.querySelector('.font-serif.font-bold.text-3xl');
                const dateElement = htmlSection.querySelector('.text-xs.text-center');
                title = titleElement?.textContent || 'Chapitre sans titre';
                dateText = dateElement?.textContent || '';
                entryType = 'chapter';
            } else {
                // It's a narrative section
                // Priority to the custom title attribute
                const customTitle = htmlSection.getAttribute('data-section-title');
                if (customTitle && customTitle.trim()) {
                    title = customTitle;
                } else {
                    // Fallback to first line of content
                    const contentElement = htmlSection.querySelector('.NodeViewContent');
                    const firstLine = contentElement?.textContent?.split('\n')[0]?.trim();
                    title = firstLine ? `${firstLine.slice(0, 30)}${firstLine.length > 30 ? '...' : ''}` : 'Section';
                }
                entryType = 'section';
            }

            const left = htmlSection.offsetLeft;
            const pageIndex = Math.floor(left / stride) + 1; // Content starting at index 1 is Page 2 if TOC is Page 1

            newEntries.push({
                type: entryType,
                title,
                date: dateText,
                page: pageIndex
            });
        });

        setEntries(newEntries);
    }, [contentRef]);

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
