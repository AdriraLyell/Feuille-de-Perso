
import { useState, useEffect } from 'react';
import { MessageService } from '../../services/MessageService';

export const useUnreadCount = (settingId: string | undefined, viewerId: string | undefined) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!settingId || !viewerId) return;

        const fetchCount = async () => {
            const unread = await MessageService.countUnread(settingId, viewerId);
            setCount(unread);
        };

        void fetchCount();

        // On pourrait utiliser Realtime ici aussi, mais un polling léger (15-30s) suffit pour le badge header
        // car le widget lui-même a du Realtime pour quand il est ouvert.
        const interval = setInterval(() => void fetchCount(), 20000);
        return () => clearInterval(interval);
    }, [settingId, viewerId]);

    return count;
};
