/**
 * useMessages
 *
 * Hook React gérant la messagerie en temps réel pour un setting donné.
 * - Charge les messages au montage
 * - Souscrit aux INSERT et UPDATE via Supabase Realtime
 * - Expose l'envoi de messages et le nombre de non-lus
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';
import {
    Message,
    MessageService,
} from '../../services/MessageService';
import { logger } from '../../utils/logger';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseMessagesOptions {
    settingId: string;
    viewerId: string; // UUID du personnage ou 'GM'
    /** Si précisé, ne retourne que la conv entre viewerId et peerId (+ ALL) */
    peerId?: string;
}

interface UseMessagesReturn {
    messages: Message[];
    isLoading: boolean;
    unreadCount: number;
    send: (receiverId: string, content: string) => Promise<void>;
    markRead: (conversationPeerId: string) => Promise<void>;
    refresh: () => Promise<void>;
}

export const useMessages = ({
    settingId,
    viewerId,
    peerId,
}: UseMessagesOptions): UseMessagesReturn => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const load = useCallback(async () => {
        if (!settingId || !viewerId) return;
        setIsLoading(true);
        try {
            const data = await MessageService.getMessages(settingId, viewerId);
            setMessages(data);
        } catch (err) {
            logger.error('[useMessages] load error', err);
        } finally {
            setIsLoading(false);
        }
    }, [settingId, viewerId]);

    const refreshUnread = useCallback(async () => {
        if (!settingId || !viewerId) return;
        const count = await MessageService.countUnread(settingId, viewerId);
        setUnreadCount(count);
    }, [settingId, viewerId]);

    // Chargement initial + souscription Realtime
    useEffect(() => {
        void load();
        void refreshUnread();

        const channelName = `messages-${settingId}-${viewerId}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `setting_id=eq.${settingId}`,
                },
                (payload) => {
                    const msg = payload.new as Message;
                    logger.log('[useMessages] INSERT received', msg.id);

                    // Filtrer côté client : visible pour ce viewer ?
                    const isRelevant =
                        viewerId === 'GM' ||
                        msg.sender_id === viewerId ||
                        msg.receiver_id === viewerId ||
                        msg.receiver_id === 'ALL';

                    if (isRelevant) {
                        setMessages((prev) => {
                            if (prev.some((m) => m.id === msg.id)) return prev;
                            return [...prev, msg];
                        });
                        // Recalculer le badge
                        void refreshUnread();
                    }
                },
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `setting_id=eq.${settingId}`,
                },
                (payload) => {
                    const updated = payload.new as Message;
                    logger.log('[useMessages] UPDATE received', updated.id);
                    setMessages((prev) =>
                        prev.map((m) => (m.id === updated.id ? updated : m)),
                    );
                    void refreshUnread();
                },
            )
            .subscribe((status) => {
                logger.log(`[useMessages] channel status: ${status}`);
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                void supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [settingId, viewerId, load, refreshUnread]);

    const send = useCallback(
        async (receiverId: string, content: string) => {
            if (!content.trim()) return;
            await MessageService.sendMessage(settingId, viewerId, receiverId, content);
        },
        [settingId, viewerId],
    );

    const markRead = useCallback(
        async (conversationPeerId: string) => {
            await MessageService.markConversationAsRead(
                settingId,
                viewerId,
                conversationPeerId,
                viewerId,
            );
            void refreshUnread();
        },
        [settingId, viewerId, refreshUnread],
    );

    // Filtrer les messages par conversation si peerId est fourni
    const filteredMessages = peerId
        ? messages.filter(
            (m) =>
                m.receiver_id === 'ALL' ||
                (m.sender_id === viewerId && m.receiver_id === peerId) ||
                (m.sender_id === peerId && m.receiver_id === viewerId) ||
                (m.sender_id === peerId && m.receiver_id === 'ALL'),
        )
        : messages;

    return {
        messages: filteredMessages,
        isLoading,
        unreadCount,
        send,
        markRead,
        refresh: load,
    };
};
