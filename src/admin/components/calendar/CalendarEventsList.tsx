import React, { useState } from 'react';
import { CalendarEvent } from '../../../types/rules';

import { PlusCircle, Trash2, Pencil, Check, X } from 'lucide-react';

const EVENT_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#f97316'];

interface Props {
    events: CalendarEvent[];
    mode: 'real' | 'fictional';
    onUpdate: (events: CalendarEvent[]) => void;
}

const emptyEvent = (): CalendarEvent => ({
    id: crypto.randomUUID(),
    date: '',
    title: '',
    color: EVENT_COLORS[0],
});

const CalendarEventsList: React.FC<Props> = ({ events, mode, onUpdate }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<CalendarEvent | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newEvent, setNewEvent] = useState<CalendarEvent>(emptyEvent());

    const datePlaceholder = mode === 'real' ? 'AAAA-MM-JJ' : 'Année-Mois-Jour (ex: 3-2-14)';

    const handleAdd = () => {
        if (!newEvent.title.trim() || !newEvent.date.trim()) return;
        onUpdate([...events, newEvent]);
        setNewEvent(emptyEvent());
        setIsAdding(false);
    };

    const handleStartEdit = (ev: CalendarEvent) => {
        setEditingId(ev.id);
        setDraft({ ...ev });
    };

    const handleSaveEdit = () => {
        if (!draft) return;
        onUpdate(events.map(e => e.id === draft.id ? draft : e));
        setEditingId(null);
        setDraft(null);
    };

    const handleDelete = (id: string) => {
        onUpdate(events.filter(e => e.id !== id));
    };

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="text-amber-gold">●</span> Événements
            </h3>

            {/* Liste des événements */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {events.length === 0 && (
                    <p className="text-stone-600 text-xs italic py-2 text-center">Aucun événement. Ajoutez-en un ci-dessous.</p>
                )}
                {events.map(ev => (
                    <div key={ev.id} className="flex items-center gap-2 bg-mystic-deep/60 border border-stone-700/50 rounded-sm px-3 py-2 group">
                        {editingId === ev.id && draft ? (
                            <>
                                <div className="flex items-center gap-1">
                                    {EVENT_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setDraft({ ...draft, color: c })}
                                            className={`w-3 h-3 rounded-full border-2 transition-transform ${draft.color === c ? 'scale-125 border-white' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                                <input
                                    value={draft.date}
                                    onChange={e => setDraft({ ...draft, date: e.target.value })}
                                    placeholder={datePlaceholder}
                                    className="bg-stone-800 border border-stone-600 rounded-sm px-2 py-0.5 text-xs text-stone-200 w-32 focus:outline-none focus:border-amber-gold/50"
                                />
                                <input
                                    value={draft.title}
                                    onChange={e => setDraft({ ...draft, title: e.target.value })}
                                    placeholder="Titre"
                                    className="bg-stone-800 border border-stone-600 rounded-sm px-2 py-0.5 text-xs text-stone-200 flex-1 focus:outline-none focus:border-amber-gold/50"
                                />
                                <button onClick={handleSaveEdit} className="text-emerald-500 hover:text-emerald-400"><Check size={14} /></button>
                                <button onClick={() => { setEditingId(null); setDraft(null); }} className="text-stone-500 hover:text-stone-300"><X size={14} /></button>
                            </>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color ?? '#f59e0b' }} />
                                <span className="text-stone-500 text-xs font-mono w-24 flex-shrink-0">{ev.date}</span>
                                <span className="text-stone-200 text-xs flex-1 truncate">{ev.title}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleStartEdit(ev)} className="text-stone-500 hover:text-amber-400"><Pencil size={12} /></button>
                                    <button onClick={() => handleDelete(ev.id)} className="text-stone-500 hover:text-rose-500"><Trash2 size={12} /></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Formulaire d'ajout */}
            {isAdding ? (
                <div className="flex items-center gap-2 bg-mystic-deep border border-amber-gold/20 rounded-sm px-3 py-2">
                    <div className="flex items-center gap-1">
                        {EVENT_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setNewEvent(e => ({ ...e, color: c }))}
                                className={`w-3 h-3 rounded-full border-2 transition-transform ${newEvent.color === c ? 'scale-125 border-white' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <input
                        value={newEvent.date}
                        onChange={e => setNewEvent(ev => ({ ...ev, date: e.target.value }))}
                        placeholder={datePlaceholder}
                        className="bg-stone-800 border border-stone-600 rounded-sm px-2 py-0.5 text-xs text-stone-200 w-32 focus:outline-none focus:border-amber-gold/50"
                    />
                    <input
                        value={newEvent.title}
                        onChange={e => setNewEvent(ev => ({ ...ev, title: e.target.value }))}
                        placeholder="Titre de l'événement"
                        className="bg-stone-800 border border-stone-600 rounded-sm px-2 py-0.5 text-xs text-stone-200 flex-1 focus:outline-none focus:border-amber-gold/50"
                    />
                    <button onClick={handleAdd} className="text-emerald-500 hover:text-emerald-400"><Check size={14} /></button>
                    <button onClick={() => { setIsAdding(false); setNewEvent(emptyEvent()); }} className="text-stone-500 hover:text-stone-300"><X size={14} /></button>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 text-xs text-stone-500 hover:text-amber-400 transition-colors py-1"
                >
                    <PlusCircle size={14} />
                    Ajouter un événement
                </button>
            )}
        </div>
    );
};

export default CalendarEventsList;
