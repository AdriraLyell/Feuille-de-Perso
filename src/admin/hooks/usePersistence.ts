import { useEffect, useRef, useState, useCallback } from 'react';
import { set, get, del } from 'idb-keyval';
import { RulesData } from '../../types/rules';

const DB_KEY = 'admin_rules_autosave';
const AUTOSAVE_DELAY = 2000; // 2 seconds debounce

interface PersistenceStatus {
    lastSaved: Date | null;
    hasUnsavedChanges: boolean;
    restoreAvailable: RulesData | null; // Rules waiting to be restored
    isRestoring: boolean; // Initial check in progress
}

export const usePersistence = (
    currentRules: RulesData | null,
    onRestore: (rules: RulesData) => void,
    onLoadComplete: () => void
) => {
    const [status, setStatus] = useState<PersistenceStatus>({
        lastSaved: null,
        hasUnsavedChanges: false,
        restoreAvailable: null,
        isRestoring: true
    });

    // Using refs to avoid effect dependencies loops
    const rulesRef = useRef<RulesData | null>(currentRules);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const initialLoadDone = useRef(false);

    useEffect(() => {
        rulesRef.current = currentRules;
    }, [currentRules]);

    // 1. Initial Load & Restore Check
    useEffect(() => {
        const checkRestore = async () => {
            try {
                const saved = await get<RulesData>(DB_KEY);
                if (saved && saved.version) {
                    // We found a backup. Expose it to UI.
                    setStatus(s => ({ ...s, restoreAvailable: saved }));
                } else {
                    // No backup, proceed as normal
                    initialLoadDone.current = true;
                    onLoadComplete();
                }
            } catch (err) {
                console.warn('[Persistence] Failed to check for restore', err);
                initialLoadDone.current = true;
                onLoadComplete();
            } finally {
                setStatus(s => ({ ...s, isRestoring: false }));
            }
        };

        checkRestore();
    }, []); // Run once on mount

    // Public method to accept or reject restoration
    const resolveRestore = useCallback(async (shouldRestore: boolean) => {
        if (shouldRestore && status.restoreAvailable) {
            onRestore(status.restoreAvailable);
            console.log('[Persistence] Session restored from IDB');
        } else {
            // User declined, clear it
            await del(DB_KEY);
            console.log('[Persistence] Stale session discarded');
        }

        // Finalize
        // We set restoreAvailable to null to close modal
        setStatus(s => ({ ...s, restoreAvailable: null }));
        initialLoadDone.current = true;
        onLoadComplete();
    }, [status.restoreAvailable, onRestore, onLoadComplete]);

    // 2. Auto-Save Logic
    useEffect(() => {
        if (!initialLoadDone.current || !currentRules) return;

        // Mark as dirty immediately if we are past the initial load
        setStatus(s => ({ ...s, hasUnsavedChanges: true }));

        // Debounce save
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            try {
                // Ensure structured cloning capable (JSON safe)
                await set(DB_KEY, JSON.parse(JSON.stringify(currentRules)));

                setStatus(s => ({
                    ...s,
                    hasUnsavedChanges: false,
                    lastSaved: new Date()
                }));
                console.log('[Persistence] Auto-saved to IDB');
            } catch (err) {
                console.error('[Persistence] Auto-save failed', err);
            }
        }, AUTOSAVE_DELAY);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [currentRules]);

    // 3. Window BeforeUnload Protection
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (status.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [status.hasUnsavedChanges]);

    return { ...status, resolveRestore };
};
