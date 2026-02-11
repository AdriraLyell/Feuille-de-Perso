import { useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';

/**
 * Hook to automatically log out the user after a period of inactivity.
 * @param timeoutMs - The idle timeout in milliseconds (default: 30 minutes)
 */
export const useIdleTimeout = (timeoutMs: number = 30 * 60 * 1000) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const logout = async () => {
        await supabase.auth.signOut();
    };

    const resetTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(logout, timeoutMs);
    };

    useEffect(() => {
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];

        // Set initial timer
        resetTimer();

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [timeoutMs]);
};
