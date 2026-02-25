import { useRef, useCallback, useEffect, useState } from 'react';
import { Editor, JSONContent } from '@tiptap/react';

interface PersistenceProps {
    onUpdate?: (content: JSONContent) => void;
}

export const useColumnarPersistence = ({ onUpdate }: PersistenceProps) => {
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const editorRef = useRef<Editor | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const saveIndicatorRef = useRef<NodeJS.Timeout | null>(null);
    const hasPendingChanges = useRef(false);

    const onUpdateRef = useRef(onUpdate);
    onUpdateRef.current = onUpdate;

    const setEditor = useCallback((editor: Editor | null) => {
        editorRef.current = editor;
    }, []);

    const flushSave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (hasPendingChanges.current && editorRef.current && !editorRef.current.isDestroyed && onUpdateRef.current) {
            onUpdateRef.current(editorRef.current.getJSON());
            hasPendingChanges.current = false;
            setSaveStatus('saved');
            if (saveIndicatorRef.current) clearTimeout(saveIndicatorRef.current);
            saveIndicatorRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
        }
    }, []);

    const handleUpdate = useCallback(() => {
        if (onUpdateRef.current && editorRef.current) {
            hasPendingChanges.current = true;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                if (editorRef.current && onUpdateRef.current) {
                    onUpdateRef.current(editorRef.current.getJSON());
                    hasPendingChanges.current = false;
                    setSaveStatus('saved');
                    if (saveIndicatorRef.current) clearTimeout(saveIndicatorRef.current);
                    saveIndicatorRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
                }
            }, 500);
        }
    }, []);

    // Cleanup & Persistence Listeners
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') flushSave();
        };
        const handleBeforeUnload = () => flushSave();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [flushSave]);

    return {
        saveStatus,
        setSaveStatus,
        handleUpdate,
        flushSave,
        setEditor
    };
};
