import { useState, useRef, useEffect, useCallback } from 'react';
import { CharacterSheetData, CampaignNoteEntry } from '../types';
import { deleteImage } from '../imageDB';
import { ErrorService } from '../services/ErrorService';
import { NotebookTextareaHandle } from '../components/campaign/NotebookTextarea';

export const useJournal = (
    data: CharacterSheetData,
    onChange: (newData: CharacterSheetData) => void,
    onAddLog: (msg: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both') => void
) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const noteRefs = useRef<{ [key: string]: NotebookTextareaHandle | null }>({});
    const shouldScrollToEnd = useRef(false);
    const pendingFocusRef = useRef<string | null>(null);

    const totalNotes = data.campaignNotes?.length || 0;

    // Handle scroll to update current page indicator
    const handleScroll = useCallback(() => {
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            const page = Math.round(scrollLeft / clientWidth);
            setCurrentPage(page);
        }
    }, []);

    // Scroll effect when adding a new note
    useEffect(() => {
        if (scrollContainerRef.current && totalNotes > 0 && shouldScrollToEnd.current) {
            shouldScrollToEnd.current = false;
            setTimeout(() => {
                scrollContainerRef.current?.scrollTo({
                    left: scrollContainerRef.current.scrollWidth,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }, [totalNotes]);

    // Handle pending focus
    useEffect(() => {
        if (pendingFocusRef.current) {
            const nextId = pendingFocusRef.current;
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (noteRefs.current[nextId]) {
                        noteRefs.current[nextId]?.focusAtEnd();
                    }
                }, 100);
            });
            pendingFocusRef.current = null;
        }
    }, [data.campaignNotes]);

    const addNote = useCallback(() => {
        const newNote: CampaignNoteEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleDateString('fr-CA'),
            title: 'Nouvelle Session',
            content: '',
            images: []
        };

        const newNotes = [...(data.campaignNotes || []), newNote];
        shouldScrollToEnd.current = true;
        onChange({ ...data, campaignNotes: newNotes });
        onAddLog("Nouvelle page ajoutée au journal", 'success', 'sheet');
    }, [data, onChange, onAddLog]);

    const updateNote = useCallback((id: string, field: keyof CampaignNoteEntry, value: any) => {
        const newNotes = (data.campaignNotes || []).map(n => n.id === id ? { ...n, [field]: value } : n);
        onChange({ ...data, campaignNotes: newNotes });
    }, [data, onChange]);

    const insertPageAfter = useCallback((index: number) => {
        const newNote: CampaignNoteEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleDateString('fr-CA'),
            title: 'Nouvelle Session',
            content: '',
            images: []
        };

        const notes = data.campaignNotes || [];
        const newNotes = [
            ...notes.slice(0, index + 1),
            newNote,
            ...notes.slice(index + 1)
        ];

        onChange({ ...data, campaignNotes: newNotes });
        onAddLog("Page insérée", 'success', 'sheet');
    }, [data, onChange, onAddLog]);

    const confirmDeleteNote = useCallback(() => {
        if (noteIdToDelete) {
            const noteToDelete = (data.campaignNotes || []).find(n => n.id === noteIdToDelete);

            if (noteToDelete?.images) {
                noteToDelete.images.forEach(img => {
                    deleteImage(img.imageId).catch(e => ErrorService.handleError(e, { context: 'CampaignNotes.deleteImage', silent: true }));
                });
            }
            if (noteToDelete?.imageId) {
                deleteImage(noteToDelete.imageId).catch(e => ErrorService.handleError(e, { context: 'CampaignNotes.deleteImageLegacy', silent: true }));
            }

            const newNotes = (data.campaignNotes || []).filter(n => n.id !== noteIdToDelete);
            onChange({ ...data, campaignNotes: newNotes });
            onAddLog("Page du journal arrachée", 'danger', 'sheet');
            setNoteIdToDelete(null);

            if (newNotes.length === 0) {
                setCurrentPage(0);
            }
        }
    }, [data, noteIdToDelete, onChange, onAddLog]);

    const handleOverflow = useCallback((noteId: string, remainingContent: string, overflowContent: string, focusNext?: boolean) => {
        const notes = data.campaignNotes || [];
        const currentIndex = notes.findIndex(n => n.id === noteId);
        if (currentIndex === -1) return;

        const currentNote = notes[currentIndex];
        const nextIndex = currentIndex + 1;

        let updatedNotes = notes.map((n, i) =>
            i === currentIndex ? { ...n, content: remainingContent } : n
        );

        if (nextIndex < updatedNotes.length) {
            const nextNote = updatedNotes[nextIndex];
            const isNextContinuation = nextNote.isContinuation;
            const isNextEmpty = !nextNote.content || (nextNote.content.replace(/<[^>]*>/g, '').trim() === '');
            const isDefaultTitle = nextNote.title === 'Nouvelle Session' || nextNote.title === `${currentNote.title} (suite)`;

            if (isNextContinuation || (isNextEmpty && isDefaultTitle)) {
                if (focusNext) pendingFocusRef.current = nextNote.id;
                updatedNotes = updatedNotes.map((n, i) =>
                    i === nextIndex ? {
                        ...n,
                        content: overflowContent + (n.content || ''),
                        isContinuation: true
                    } : n
                );
                onChange({ ...data, campaignNotes: updatedNotes });
            } else {
                const newId = Math.random().toString(36).substr(2, 9);
                if (focusNext) pendingFocusRef.current = newId;

                const newNote: CampaignNoteEntry = {
                    id: newId,
                    date: currentNote.date,
                    title: `${currentNote.title} (suite)`,
                    content: overflowContent,
                    images: [],
                    isContinuation: true
                };

                updatedNotes = [
                    ...updatedNotes.slice(0, nextIndex),
                    newNote,
                    ...updatedNotes.slice(nextIndex)
                ];
                onChange({ ...data, campaignNotes: updatedNotes });
                onAddLog("Page de suite insérée", 'info', 'sheet');
            }
        } else {
            const newId = Math.random().toString(36).substr(2, 9);
            if (focusNext) pendingFocusRef.current = newId;

            const newNote: CampaignNoteEntry = {
                id: newId,
                date: currentNote.date,
                title: `${currentNote.title} (suite)`,
                content: overflowContent,
                images: [],
                isContinuation: true
            };

            onChange({
                ...data,
                campaignNotes: [...updatedNotes, newNote]
            });
        }
    }, [data, onChange, onAddLog]);

    const goToPrevious = useCallback(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: -scrollContainerRef.current.clientWidth,
                behavior: 'smooth'
            });
        }
    }, []);

    const goToNext = useCallback(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: scrollContainerRef.current.clientWidth,
                behavior: 'smooth'
            });
        }
    }, []);

    const jumpToPage = useCallback((index: number) => {
        if (scrollContainerRef.current) {
            const spreadIndex = Math.floor(index / 2);
            scrollContainerRef.current.scrollTo({
                left: spreadIndex * scrollContainerRef.current.clientWidth,
                behavior: 'smooth'
            });
        }
    }, []);

    const registerNoteRef = useCallback((id: string, ref: NotebookTextareaHandle | null) => {
        if (ref) noteRefs.current[id] = ref;
        else delete noteRefs.current[id];
    }, []);

    const forceReflow = useCallback((id: string) => {
        if (noteRefs.current[id]) {
            noteRefs.current[id]?.forceReflow();
            onAddLog("Repagination forcée", 'info', 'sheet');
        }
    }, [onAddLog]);

    return {
        currentPage,
        noteIdToDelete,
        setNoteIdToDelete,
        scrollContainerRef,
        handleScroll,
        addNote,
        updateNote,
        insertPageAfter,
        confirmDeleteNote,
        handleOverflow,
        goToPrevious,
        goToNext,
        jumpToPage,
        registerNoteRef,
        forceReflow
    };
};
