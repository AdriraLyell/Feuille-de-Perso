import { useMemo, useCallback, useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { PAGE_WIDTH } from '../../constants';

interface CalendarSyncProps {
    editor: Editor | null;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export const useColumnarCalendarSync = ({ editor, containerRef }: CalendarSyncProps) => {
    const [isCalendarVisible, setIsCalendarVisible] = useState(() => {
        const saved = localStorage.getItem('book-calendar-visible');
        return saved === null ? true : saved === 'true';
    });
    const [pickingTarget, setPickingTarget] = useState<{ nodeId: string, field: string } | null>(null);

    useEffect(() => {
        localStorage.setItem('book-calendar-visible', String(isCalendarVisible));
    }, [isCalendarVisible]);

    // Handle external toggle/pick events
    useEffect(() => {
        const handleToggle = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.visible !== undefined) {
                setIsCalendarVisible(customEvent.detail.visible);
            } else {
                setIsCalendarVisible(v => !v);
            }
        };
        const handlePickRequest = (e: Event) => {
            setPickingTarget((e as CustomEvent).detail);
            setIsCalendarVisible(true);
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setPickingTarget(null);
        };

        window.addEventListener('toggle-calendar', handleToggle);
        window.addEventListener('calendar-open-picker', handlePickRequest);
        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('toggle-calendar', handleToggle);
            window.removeEventListener('calendar-open-picker', handlePickRequest);
            window.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const { notifiedDates, voyageRanges } = useMemo(() => {
        if (!editor) return { notifiedDates: new Map<string, string>(), voyageRanges: [] as { start: string, end: string }[] };
        const dates = new Map<string, string>();
        const ranges: { start: string, end: string }[] = [];

        editor.state.doc.descendants((node) => {
            if (node.type.name === 'chapterHeading' && node.attrs.date) {
                dates.set(node.attrs.date, node.attrs.weather || '');
            }
            if (node.type.name === 'narrativeSection' && node.attrs.type === 'voyage' && node.attrs.dateStart && node.attrs.dateEnd) {
                ranges.push({ start: node.attrs.dateStart, end: node.attrs.dateEnd });
            }
        });
        return { notifiedDates: dates, voyageRanges: ranges };
    }, [editor, editor?.state.doc]);

    const scrollToDate = useCallback((date: string) => {
        if (!editor || editor.isDestroyed || !containerRef.current) return;

        let targetPos = -1;
        editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'chapterHeading' && node.attrs.date === date) {
                targetPos = pos;
                return false;
            }
            return true;
        });

        if (targetPos !== -1) {
            const dom = editor.view.nodeDOM(targetPos) as HTMLElement;
            if (dom && containerRef.current) {
                const horizontalOffset = dom.offsetLeft;
                const stride = PAGE_WIDTH + 40;
                const spreadIndex = Math.floor(horizontalOffset / (stride * 2));

                containerRef.current.scrollTo({
                    left: spreadIndex * stride * 2,
                    behavior: 'smooth'
                });
            }
        }
    }, [editor]);

    const handleCalendarDateClick = useCallback((date: string) => {
        if (pickingTarget) {
            window.dispatchEvent(new CustomEvent('calendar-date-picked', {
                detail: {
                    date,
                    nodeId: pickingTarget.nodeId,
                    field: pickingTarget.field
                }
            }));
            setPickingTarget(null);
        } else {
            scrollToDate(date);
        }
    }, [pickingTarget, scrollToDate]);

    return {
        isCalendarVisible,
        setIsCalendarVisible,
        pickingTarget,
        setPickingTarget,
        notifiedDates,
        voyageRanges,
        handleCalendarDateClick
    };
};
