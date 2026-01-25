
import React, { useRef, useState, useEffect } from 'react';
import { CharacterSheetData, CampaignNoteEntry } from '../types';
import { Book, Plus, Trash2, Calendar, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  data: CharacterSheetData;
  onChange: (newData: CharacterSheetData) => void;
  isLandscape?: boolean;
  onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void;
}

const NotebookTextarea: React.FC<{ value: string, onChange: (v: string) => void, placeholder?: string }> = ({ value, onChange, placeholder }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const maskRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (textareaRef.current && maskRef.current) {
            maskRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const lineHeight = '24px';
    const fontSize = '1rem'; 
    const paddingTop = '8px';
    const paddingX = '8px';

    const typoStyles: React.CSSProperties = {
        fontFamily: '"Patrick Hand", cursive',
        fontSize,
        lineHeight,
        paddingTop,
        paddingLeft: paddingX,
        paddingRight: paddingX,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
    };

    return (
        <div className="relative w-full h-full min-h-[150px] overflow-hidden rounded-sm bg-white/30">
            <div 
                ref={maskRef}
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-10 text-transparent"
                style={{
                    ...typoStyles,
                    backgroundImage: `linear-gradient(transparent 23px, #e7e5e4 23px)`,
                    backgroundSize: '100% 24px',
                    backgroundAttachment: 'local',
                    backgroundRepeat: 'repeat',
                }}
                aria-hidden="true"
            >
                {value} 
            </div>

            <textarea 
              ref={textareaRef}
              className="relative z-20 w-full h-full bg-transparent resize-none focus:outline-none text-ink min-h-[150px]"
              style={typoStyles}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onScroll={handleScroll}
              placeholder={placeholder}
              spellCheck={false}
            />
        </div>
    );
};

const CampaignNotes: React.FC<Props> = ({ data, onChange, isLandscape = false, onAddLog }) => {
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const addNote = () => {
    const newNote: CampaignNoteEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('fr-CA'), // Format YYYY-MM-DD for input date
      title: 'Nouvelle Session',
      content: ''
    };
    
    onChange({
      ...data,
      campaignNotes: [newNote, ...(data.campaignNotes || [])]
    });
    
    setExpandedNotes(prev => ({ ...prev, [newNote.id]: true }));
    onAddLog("Nouvelle note de campagne ajoutée", 'success', 'sheet');
  };

  const updateNote = (id: string, field: keyof CampaignNoteEntry, value: string) => {
    const newNotes = data.campaignNotes.map(n => n.id === id ? { ...n, [field]: value } : n);
    onChange({ ...data, campaignNotes: newNotes });
    onAddLog(`Note modifiée (${field})`, 'info', 'sheet', `note_${id}_${field}`);
  };

  const deleteNote = (id: string) => {
    if (confirm("Supprimer cette note définitivement ?")) {
        const newNotes = data.campaignNotes.filter(n => n.id !== id);
        onChange({ ...data, campaignNotes: newNotes });
        onAddLog("Note de campagne supprimée", 'danger', 'sheet');
    }
  };

  const toggleExpand = (id: string) => {
      setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={`sheet-container p-8 ${isLandscape ? 'landscape' : ''}`}>
      <div className="py-3 border-b-2 border-stone-800 mb-6 relative flex items-center justify-center bg-white">
        <div className="absolute left-0 no-print">
             <button 
                onClick={addNote}
                className="flex items-center gap-2 bg-indigo-700 text-white px-4 py-2 rounded shadow hover:bg-indigo-800 transition-colors text-sm font-bold"
            >
                <Plus size={16} /> Nouvelle Note
            </button>
        </div>
        <h1 className="text-3xl font-black text-center uppercase tracking-[0.2em] flex items-center justify-center gap-3 text-indigo-950 font-serif">
             <Book size={32} /> Journal de Campagne
        </h1>
      </div>

      <div className="flex-grow flex flex-col gap-6 overflow-y-auto pr-2 no-scrollbar">
          {(!data.campaignNotes || data.campaignNotes.length === 0) && (
              <div className="flex-grow flex flex-col items-center justify-center text-stone-400 italic gap-4 opacity-60">
                  <Book size={64} strokeWidth={1} />
                  <p className="text-xl">Le journal est encore vierge.</p>
                  <p className="text-sm">Cliquez sur "Nouvelle Note" pour raconter votre première aventure.</p>
              </div>
          )}

          {data.campaignNotes?.map((note) => {
              const isExpanded = expandedNotes[note.id] !== false; // Par défaut étendu si non précisé
              return (
                  <div key={note.id} className="bg-white border border-stone-400 rounded-sm shadow-sm flex flex-col animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Header della Note */}
                      <div className="bg-slate-100 border-b border-stone-300 p-2 flex items-center justify-between group">
                          <div className="flex items-center gap-4 flex-grow">
                              <div className="flex items-center gap-2 bg-white border border-stone-300 rounded px-2 py-1">
                                  <Calendar size={14} className="text-stone-400" />
                                  <input 
                                      type="date"
                                      value={note.date}
                                      onChange={(e) => updateNote(note.id, 'date', e.target.value)}
                                      className="bg-transparent text-sm font-bold text-stone-700 focus:outline-none cursor-pointer"
                                  />
                              </div>
                              <div className="flex items-center gap-2 flex-grow">
                                  <FileText size={14} className="text-stone-400" />
                                  <input 
                                      type="text"
                                      value={note.title}
                                      onChange={(e) => updateNote(note.id, 'title', e.target.value)}
                                      placeholder="Titre de la session..."
                                      className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-indigo-500 focus:outline-none flex-grow font-bold text-indigo-900 transition-all px-1"
                                  />
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-1 no-print">
                              <button 
                                  onClick={() => deleteNote(note.id)}
                                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                  title="Supprimer la note"
                              >
                                  <Trash2 size={16} />
                              </button>
                              <button 
                                  onClick={() => toggleExpand(note.id)}
                                  className="p-1.5 text-stone-500 hover:bg-stone-200 rounded transition-colors"
                              >
                                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              </button>
                          </div>
                      </div>

                      {/* Corps de la Note */}
                      {isExpanded && (
                          <div className="p-4 bg-white min-h-[150px]">
                              <NotebookTextarea 
                                  value={note.content}
                                  onChange={(v) => updateNote(note.id, 'content', v)}
                                  placeholder="Décrivez les événements marquants, les PNJ rencontrés, les découvertes..."
                              />
                          </div>
                      )}
                  </div>
              );
          })}
      </div>

      <div className="mt-6 border-t border-stone-300 pt-2 text-center text-[10px] text-stone-400 uppercase tracking-widest no-print">
          Fin du journal actuel
      </div>
    </div>
  );
};

export default CampaignNotes;
