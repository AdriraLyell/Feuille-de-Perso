/**
 * MessageWidget
 *
 * Widget de messagerie flottant et déplaçable, utilisable côté Joueur et MJ.
 * - Affiche la liste des conversations (Général, MJ/Joueurs)
 * - Affiche le fil de discussion de la conv sélectionnée
 * - Permet l'envoi de messages
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import {
    MessageSquare,
    X,
    Send,
    Users,
    Shield,
    User,
    ChevronLeft,
    Minimize2,
} from 'lucide-react';
import { useMessages } from '../../hooks/messaging/useMessages';
import { Message } from '../../services/MessageService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contact {
    id: string;   // 'ALL' | 'GM' | characterId
    name: string;
    type: 'group' | 'gm' | 'player';
}

interface MessageWidgetProps {
    settingId: string;
    viewerId: string;       // ID du personnage connecté, ou 'GM'
    viewerName: string;     // Nom affiché dans les bulles
    contacts: Contact[];    // Liste des interlocuteurs disponibles
    isOpen?: boolean;       // État externe (optionnel)
    onToggle?: (open: boolean) => void; // Callback externe (optionnel)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'message-widget-pos';
const WIDGET_STORAGE_KEY = 'message-widget-window-pos';

const loadPos = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? (JSON.parse(saved) as { x: number; y: number }) : { x: 0, y: 0 };
    } catch { return { x: 0, y: 0 }; }
};

const loadWidgetPos = () => {
    try {
        const saved = localStorage.getItem(WIDGET_STORAGE_KEY);
        return saved ? (JSON.parse(saved) as { x: number; y: number }) : { x: 0, y: 0 };
    } catch { return { x: 0, y: 0 }; }
};

// ─── Sous-composants ──────────────────────────────────────────────────────────

interface MessageBubbleProps {
    msg: Message;
    isSelf: boolean;
    senderName: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, isSelf, senderName }) => (
    <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} mb-2`}>
        <span className="text-[9px] font-black uppercase tracking-widest text-stone-600 mb-0.5 px-1">
            {isSelf ? 'Vous' : senderName}
        </span>
        <div
            className={`max-w-[85%] px-3 py-2 rounded-sm text-xs font-medium leading-relaxed shadow-sm ${isSelf
                ? 'bg-amber-700/80 text-amber-50 rounded-br-none border border-amber-600/30'
                : 'bg-stone-800/80 text-stone-200 rounded-bl-none border border-stone-700/30'
                }`}
        >
            {msg.content}
        </div>
        <span className="text-[8px] text-stone-700 mt-0.5 px-1">
            {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
            })}
        </span>
    </div>
);

// ─── ContactItem ──────────────────────────────────────────────────────────────

interface ContactItemProps {
    contact: Contact;
    unread: number;
    isActive: boolean;
    onClick: () => void;
}

const ContactItem: React.FC<ContactItemProps> = ({ contact, unread, isActive, onClick }) => {
    const Icon =
        contact.type === 'group' ? Users : contact.type === 'gm' ? Shield : User;

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all border-b border-stone-900/30 relative ${isActive
                ? 'bg-amber-900/30 text-amber-400'
                : 'hover:bg-stone-800/60 text-stone-400 hover:text-stone-200'
                }`}
        >
            <span
                className={`p-1.5 rounded-sm flex-shrink-0 ${isActive ? 'bg-amber-900/40' : 'bg-stone-800/60'
                    }`}
            >
                <Icon size={13} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest truncate flex-1">
                {contact.name}
            </span>
            {unread > 0 && (
                <span className="bg-rose-600 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {unread > 9 ? '9+' : unread}
                </span>
            )}
        </button>
    );
};

// ─── Widget Principal ─────────────────────────────────────────────────────────

export const MessageWidget: React.FC<MessageWidgetProps> = ({
    settingId,
    viewerId,
    viewerName,
    contacts,
    isOpen: externalIsOpen,
    onToggle,
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const setIsOpen = (val: boolean) => {
        if (onToggle) onToggle(val);
        else setInternalIsOpen(val);
    };

    const [isMinimized, setIsMinimized] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [btnPos, setBtnPos] = useState(loadPos);
    const [widgetPos, setWidgetPos] = useState(loadWidgetPos);
    const [unreadByContact, setUnreadByContact] = useState<Record<string, number>>({});
    const dragLock = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { messages, isLoading, unreadCount, send, markRead } = useMessages({
        settingId,
        viewerId,
        peerId: selectedContact?.id,
    });

    // Scroll auto vers le bas
    useEffect(() => {
        if (isOpen && !isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isMinimized]);

    // Calculer les non-lus par contact
    useEffect(() => {
        const calc = async () => {
            const result: Record<string, number> = {};
            for (const c of contacts) {
                try {
                    // Filtrer les messages non lus liés à ce contact
                    const { data } = await (async () => {
                        const { data, error } = await import('../../services/supabase').then(
                            ({ supabase }) =>
                                supabase
                                    .from('messages')
                                    .select('id', { count: 'exact', head: false })
                                    .eq('setting_id', settingId)
                                    .not('read_by', 'cs', `{"${viewerId}"}`)
                                    .neq('sender_id', viewerId)
                                    .or(
                                        c.id === 'ALL'
                                            ? `receiver_id.eq.ALL`
                                            : `sender_id.eq.${c.id},receiver_id.eq.${c.id}`
                                    )
                        );
                        return { data, error };
                    })();
                    result[c.id] = Array.isArray(data) ? data.length : 0;
                } catch {
                    result[c.id] = 0;
                }
            }
            setUnreadByContact(result);
        };
        void calc();
    }, [contacts, settingId, viewerId, unreadCount]);

    // Lire les messages quand on sélectionne une conv
    useEffect(() => {
        if (selectedContact && isOpen) {
            void markRead(selectedContact.id);
        }
    }, [selectedContact, isOpen, markRead]);

    const handleSend = useCallback(async () => {
        if (!inputValue.trim() || !selectedContact) return;
        await send(selectedContact.id, inputValue);
        setInputValue('');
        inputRef.current?.focus();
    }, [inputValue, selectedContact, send]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
        }
    };

    // Drag du bouton
    const handleBtnDragStart = () => { dragLock.current = true; };
    const handleBtnDragEnd = (_: unknown, info: PanInfo) => {
        const newPos = { x: btnPos.x + info.offset.x, y: btnPos.y + info.offset.y };
        setBtnPos(newPos);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPos));
        setTimeout(() => { dragLock.current = false; }, 120);
    };
    const handleBtnTap = () => {
        if (!dragLock.current) setIsOpen(true);
    };

    const handleWidgetDragEnd = (_: unknown, info: PanInfo) => {
        const newPos = { x: widgetPos.x + info.offset.x, y: widgetPos.y + info.offset.y };
        setWidgetPos(newPos);
        localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(newPos));
    };

    // Résoudre le nom d'un sender
    const resolveName = (senderId: string) => {
        if (senderId === viewerId) return viewerName;
        if (senderId === 'GM') return 'Meneur de Jeu';
        const c = contacts.find((ct) => ct.id === senderId);
        return c?.name ?? senderId.slice(0, 8);
    };

    return (
        <>
            {/* ── Bouton flottant (affiché seulement si non contrôlé de l'extérieur) ── */}
            {!isOpen && externalIsOpen === undefined && (
                <motion.div
                    drag
                    dragMomentum={false}
                    onDragStart={handleBtnDragStart}
                    onDragEnd={handleBtnDragEnd}
                    onTap={handleBtnTap}
                    animate={{ x: btnPos.x, y: btnPos.y }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    className="fixed bottom-20 right-6 z-50 cursor-grab active:cursor-grabbing no-print"
                >
                    <div
                        className="relative p-3.5 bg-stone-900 hover:bg-stone-800 text-amber-500 rounded-full shadow-xl border border-stone-700 hover:border-amber-700/50 transition-all group"
                        title="Messagerie | Glisser pour déplacer"
                    >
                        <MessageSquare size={22} />
                        {/* Badge global */}
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        <div className="absolute bottom-full mb-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none shadow-xl border border-stone-700">
                            Messagerie
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── Widget ouvert ── */}
            {isOpen && (
                <motion.div
                    drag
                    dragMomentum={false}
                    onDragEnd={handleWidgetDragEnd}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, x: widgetPos.x, y: widgetPos.y }}
                    className="fixed bottom-6 right-6 z-50 w-[380px] bg-stone-950 border border-stone-700/60 rounded-sm shadow-2xl flex flex-col overflow-hidden no-print"
                    style={{ height: isMinimized ? 'auto' : 480 }}
                >
                    {/* Header */}
                    <div className="widget-drag-handle flex items-center gap-2 px-3 py-2 bg-stone-900/80 border-b border-stone-800 cursor-grab active:cursor-grabbing flex-shrink-0">
                        <MessageSquare size={14} className="text-amber-500 flex-shrink-0" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-amber-500 flex-1 truncate">
                            {selectedContact
                                ? `${selectedContact.name}`
                                : 'Messagerie'}
                        </span>
                        {/* Badge si non-lus */}
                        {!selectedContact && unreadCount > 0 && (
                            <span className="bg-rose-600 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        {selectedContact && (
                            <button
                                onClick={() => setSelectedContact(null)}
                                className="text-stone-600 hover:text-stone-300 transition-colors p-0.5"
                                title="Retour aux conversations"
                            >
                                <ChevronLeft size={14} />
                            </button>
                        )}
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="text-stone-600 hover:text-stone-300 transition-colors p-0.5"
                            title={isMinimized ? 'Agrandir' : 'Réduire'}
                        >
                            <Minimize2 size={13} />
                        </button>
                        <button
                            onClick={() => { setIsOpen(false); setSelectedContact(null); }}
                            className="text-stone-600 hover:text-rose-500 transition-colors p-0.5"
                            title="Fermer"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Vue liste des conversations */}
                            {!selectedContact && (
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {contacts.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-stone-700 text-center p-6">
                                            <Users size={36} className="mb-3 opacity-30" />
                                            <p className="text-xs font-serif italic">Aucun destinataire disponible.</p>
                                        </div>
                                    ) : (
                                        contacts.map((c) => (
                                            <ContactItem
                                                key={c.id}
                                                contact={c}
                                                unread={unreadByContact[c.id] ?? 0}
                                                isActive={false}
                                                onClick={() => setSelectedContact(c)}
                                            />
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Vue fil de discussion */}
                            {selectedContact && (
                                <>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                                        {isLoading ? (
                                            <div className="flex items-center justify-center h-full">
                                                <span className="text-stone-600 text-xs italic font-serif">Chargement...</span>
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-stone-700 text-center">
                                                <MessageSquare size={28} className="mb-2 opacity-20" />
                                                <p className="text-xs font-serif italic">Aucun message pour l'instant.</p>
                                            </div>
                                        ) : (
                                            messages.map((msg) => (
                                                <MessageBubble
                                                    key={msg.id}
                                                    msg={msg}
                                                    isSelf={msg.sender_id === viewerId}
                                                    senderName={resolveName(msg.sender_id)}
                                                />
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Zone de saisie */}
                                    <div className="flex-shrink-0 border-t border-stone-800 p-2 flex gap-2 items-end bg-stone-900/40">
                                        <textarea
                                            ref={inputRef}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            rows={1}
                                            placeholder="Envoyer un message... (Entrée pour valider)"
                                            className="flex-1 bg-stone-900 border border-stone-700 rounded-sm px-3 py-2 text-xs text-stone-200 placeholder-stone-700 outline-none focus:border-amber-700/50 resize-none custom-scrollbar"
                                            style={{ maxHeight: 80 }}
                                        />
                                        <button
                                            onClick={() => void handleSend()}
                                            disabled={!inputValue.trim()}
                                            className="flex-shrink-0 p-2.5 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
                                            title="Envoyer (Entrée)"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </motion.div>
            )}
        </>
    );
};

export default MessageWidget;
