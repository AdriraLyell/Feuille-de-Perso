import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Session } from '@supabase/supabase-js';
import { useIdleTimeout } from './useIdleTimeout';

export const useAdminAuth = () => {
    const [session, setSession] = useState<Session | null>(null);

    // Auto-logout after 30 minutes of inactivity
    useIdleTimeout(30 * 60 * 1000);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const userMetadata = session?.user?.user_metadata;
    const appMetadata = session?.user?.app_metadata;

    // Check both metadata locations for the 'admin' role
    const isAdmin = userMetadata?.role === 'admin' || appMetadata?.role === 'admin';

    const logout = async () => {
        await supabase.auth.signOut();
        setSession(null);
    };

    return {
        session,
        isAdmin,
        logout
    };
};
