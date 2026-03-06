/**
 * MessageService
 *
 * Gère la persistance et la récupération des messages entre joueurs et MJ.
 * La table `messages` contient :
 *   - sender_id   : UUID du personnage émetteur, ou 'GM'
 *   - receiver_id : UUID du personnage destinataire, 'GM', ou 'ALL' (groupe)
 *   - read_by     : tableau des IDs qui ont lu le message
 */
import { supabase } from './supabase';
import { logger } from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Message {
    id: string;
    setting_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    read_by: string[];
    created_at: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Récupère tous les messages d'un setting pour un viewer donné.
 * Si viewerId === 'GM', on retourne tous les messages.
 * Sinon, on retourne les messages où le viewer est sender, receiver, ou 'ALL'.
 */
export const getMessages = async (
    settingId: string,
    viewerId: string,
    limit = 200,
): Promise<Message[]> => {
    logger.log(`[MessageService] getMessages settingId=${settingId} viewerId=${viewerId}`);

    let query = supabase
        .from('messages')
        .select('*')
        .eq('setting_id', settingId)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (viewerId !== 'GM') {
        query = query.or(
            `sender_id.eq.${viewerId},receiver_id.eq.${viewerId},receiver_id.eq.ALL`
        );
    }

    const { data, error } = await query;

    if (error) {
        logger.error('[MessageService] getMessages error', error);
        throw error;
    }
    return (data ?? []) as Message[];
};

/**
 * Envoie un message.
 */
export const sendMessage = async (
    settingId: string,
    senderId: string,
    receiverId: string,
    content: string,
): Promise<Message> => {
    logger.log(`[MessageService] sendMessage from=${senderId} to=${receiverId}`);

    const { data, error } = await supabase
        .from('messages')
        .insert({
            setting_id: settingId,
            sender_id: senderId,
            receiver_id: receiverId,
            content: content.trim(),
        })
        .select()
        .single();

    if (error) {
        logger.error('[MessageService] sendMessage error', error);
        throw error;
    }
    return data as Message;
};

/**
 * Marque un message comme lu par le viewer.
 * Ajoute viewerId à read_by[] si absent (via Postgres array append).
 */
export const markAsRead = async (
    messageId: string,
    viewerId: string,
): Promise<void> => {
    const { error } = await supabase.rpc('append_message_reader', {
        p_message_id: messageId,
        p_reader_id: viewerId,
    });

    if (error) {
        logger.error('[MessageService] markAsRead error', error);
        // Non bloquant : on log mais on ne throw pas
    }
};

/**
 * Marque tous les messages non lus d'une conversation comme lus.
 */
export const markConversationAsRead = async (
    settingId: string,
    senderId: string,
    receiverId: string,
    viewerId: string,
): Promise<void> => {
    logger.log(`[MessageService] markConversationAsRead viewerId=${viewerId}`);

    const { data: unread, error: fetchError } = await supabase
        .from('messages')
        .select('id, read_by')
        .eq('setting_id', settingId)
        .or(`sender_id.eq.${senderId},sender_id.eq.${receiverId}`)
        .or(`receiver_id.eq.${senderId},receiver_id.eq.${receiverId},receiver_id.eq.ALL`);

    if (fetchError || !unread) return;

    const toUpdate = (unread as Message[])
        .filter((m) => !m.read_by.includes(viewerId))
        .map((m) => m.id);

    if (toUpdate.length === 0) return;

    // Mise à jour en lot (PostgreSQL array_append via update directs)
    await Promise.all(
        toUpdate.map((id) =>
            supabase.rpc('append_message_reader', {
                p_message_id: id,
                p_reader_id: viewerId,
            })
        )
    );
};

/**
 * Compte les messages non lus adressés au viewer dans un setting.
 */
export const countUnread = async (
    settingId: string,
    viewerId: string,
): Promise<number> => {
    let query = supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('setting_id', settingId)
        .not('read_by', 'cs', `{"${viewerId}"}`);

    if (viewerId === 'GM') {
        query = query.or(`receiver_id.eq.GM,receiver_id.eq.ALL`);
    } else {
        query = query.or(
            `receiver_id.eq.${viewerId},receiver_id.eq.ALL`
        );
    }

    const { count, error } = await query;
    if (error) {
        logger.error('[MessageService] countUnread error', error);
        return 0;
    }
    return count ?? 0;
};

export const MessageService = {
    getMessages,
    sendMessage,
    markAsRead,
    markConversationAsRead,
    countUnread,
};
