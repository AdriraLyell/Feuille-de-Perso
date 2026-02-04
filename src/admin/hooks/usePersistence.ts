import { useEffect, useRef, useState } from 'react';
import { set, get, del } from 'idb-keyval';
import { RulesData } from '../../types/rules';
import { useNotification } from '../../context/NotificationContext';

const DB_KEY = 'admin_rules_autosave';
const AUTOSAVE_DELAY = 2000; // 2 seconds debounce

interface PersistenceStatus {
    lastSaved: Date | null;
    hasUnsavedChanges: boolean;
    isRestoring: boolean;
}

export const usePersistence = (
    currentRules: RulesData | null,
    onRestore: (rules: RulesData) => void,
    onLoadComplete: () => void
) => {
    const [status, setStatus] = useState<PersistenceStatus>({
        lastSaved: null,
        hasUnsavedChanges: false,
        isRestoring: true
    });

    // Using refs to avoid effect dependencies loops
    const rulesRef = useRef<RulesData | null>(currentRules);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const initialLoadDone = useRef(false);

    // Notification context might not be available at top level app, 
    // handle gracefully or invoke only if provided. 
    // For AdminApp, we might not have NotificationProvider wrapping it yet?
    // AdminApp wraps itself usually... let's check structure. 
    // Assuming we pass a simple log function or toast if needed, 
    // or just rely on console/internal state for now.

    useEffect(() => {
        rulesRef.current = currentRules;
    }, [currentRules]);

    // 1. Initial Load & Restore Check
    useEffect(() => {
        const checkRestore = async () => {
            try {
                const saved = await get<RulesData>(DB_KEY);
                if (saved && saved.version) {
                    // We found a backup.
                    // Logic: If backup exists, we ask user. 
                    const shouldRestore = window.confirm(
                        `Une session précédente non sauvegardée a été trouvée (Version ${saved.version}).\nVoulez-vous la restaurer ?\n\nAnnuler chargera la version officielle (GitHub).`
                    );

                    if (shouldRestore) {
                        onRestore(saved);
                        console.log('[Persistence] Session restored from IDB');
                    } else {
                        // User declined, clear it to avoid nagging
                        await del(DB_KEY);
                        console.log('[Persistence] Stale session discarded');
                    }
                }
            } catch (err) {
                console.warn('[Persistence] Failed to check for restore', err);
            } finally {
                setStatus(s => ({ ...s, isRestoring: false }));
                initialLoadDone.current = true;
                onLoadComplete();
            }
        };

        checkRestore();
    }, []); // Run once on mount

    // 2. Auto-Save Logic
    useEffect(() => {
        if (!initialLoadDone.current || !currentRules) return;

        // Mark as dirty immediately for UI feedback
        setStatus(s => ({ ...s, hasUnsavedChanges: true }));

        // Debounce save
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            try {
                // Ensure structured cloning capable (JSON safe)
                // idb-keyval handles structured clone, but let's be safe with JSON purely for rules
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
    }, [currentRules]); // Dependency on the rules object changing

    // 3. Window BeforeUnload Protection
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (status.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = ''; // Legal standard for Chrome
                return ''; // Legal standard for generic
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [status.hasUnsavedChanges]);

    return status;
};
