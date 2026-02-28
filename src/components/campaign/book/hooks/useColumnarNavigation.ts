import { useState, useEffect, useCallback, RefObject } from 'react';
import { Editor } from '@tiptap/react';
import { PAGE_WIDTH } from '../../constants';

interface UseColumnarNavigationProps {
    editor: Editor | null;
    containerRef: RefObject<HTMLDivElement | null>;
    contentRef: RefObject<HTMLDivElement | null>;
}

export const useColumnarNavigation = ({
    editor,
    containerRef,
    contentRef
}: UseColumnarNavigationProps) => {
    const [pageCount, setPageCount] = useState(1);
    const [scrollPos, setScrollPos] = useState(0);

    const checkScroll = useCallback(() => {
        if (!contentRef.current || !containerRef.current) return;

        requestAnimationFrame(() => {
            if (!contentRef.current || !containerRef.current) return;

            const scrollWidth = contentRef.current.scrollWidth;
            const stride = PAGE_WIDTH + 40;

            const contentPages = Math.max(1, Math.ceil(scrollWidth / stride));
            const totalPages = contentPages;

            setPageCount(prev => prev !== totalPages ? totalPages : prev);
            setScrollPos(containerRef.current.scrollLeft);
        });
    }, [containerRef, contentRef]);

    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                setScrollPos(containerRef.current.scrollLeft);
            }
        };

        checkScroll();

        const observer = new ResizeObserver(checkScroll);
        if (contentRef.current) {
            observer.observe(contentRef.current);
            const firstChild = contentRef.current.firstElementChild;
            if (firstChild) observer.observe(firstChild);
        }

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
        }

        if (editor) {
            let updateRafId: number | null = null;
            let selectionRafId: number | null = null;

            const deferredUpdate = () => {
                if (updateRafId !== null) cancelAnimationFrame(updateRafId);
                updateRafId = requestAnimationFrame(() => {
                    updateRafId = null;
                    checkScroll();
                });
            };

            const deferredSelection = () => {
                if (selectionRafId !== null) cancelAnimationFrame(selectionRafId);
                selectionRafId = requestAnimationFrame(() => {
                    selectionRafId = null;
                    checkScroll();
                });
            };

            editor.on('update', deferredUpdate);
            editor.on('selectionUpdate', deferredSelection);

            return () => {
                observer.disconnect();
                if (container) {
                    container.removeEventListener('scroll', handleScroll);
                }
                editor.off('update', deferredUpdate);
                editor.off('selectionUpdate', deferredSelection);
                if (updateRafId !== null) cancelAnimationFrame(updateRafId);
                if (selectionRafId !== null) cancelAnimationFrame(selectionRafId);
            };
        }

        return () => {
            observer.disconnect();
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, [editor, containerRef, contentRef, checkScroll]);

    const scrollPrev = useCallback(() => {
        if (containerRef.current) {
            const stride = (PAGE_WIDTH + 40) * 2;
            containerRef.current.scrollBy({ left: -stride, behavior: 'smooth' });
        }
    }, [containerRef]);

    const scrollNext = useCallback(() => {
        if (containerRef.current) {
            const stride = (PAGE_WIDTH + 40) * 2;
            containerRef.current.scrollBy({ left: stride, behavior: 'smooth' });
        }
    }, [containerRef]);

    const navigateToPage = useCallback((pageNumber: number) => {
        if (containerRef.current) {
            const stride = PAGE_WIDTH + 40;
            const spreadIndex = Math.floor((pageNumber - 1) / 2);
            containerRef.current.scrollTo({
                left: spreadIndex * stride * 2,
                behavior: 'smooth'
            });
        }
    }, [containerRef]);

    return {
        pageCount,
        scrollPos,
        scrollPrev,
        scrollNext,
        navigateToPage,
        checkScroll
    };
};
