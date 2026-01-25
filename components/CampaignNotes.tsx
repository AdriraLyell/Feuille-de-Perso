import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { CharacterSheetData, CampaignNoteEntry, PartyColumn, PartyMemberEntry } from '../types';
import { Book, Plus, Trash2, ChevronLeft, ChevronRight, Bookmark, Users, PenTool, X } from 'lucide-react';

interface Props {
  data: CharacterSheetData;
  onChange: React.Dispatch<React.SetStateAction<CharacterSheetData>>;
  isLandscape?: boolean;
  onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void;
}

const NotebookTextarea: React.FC<{ value: string, onChange: (v: string) => void, placeholder?: string }> = ({ value, onChange, placeholder }) => {
    // Configuration des lignes pour un alignement parfait
    const lineHeight = 32; 
    const fontSize = '1.2rem'; 
    
    // Ajustement précis pour que la police "Patrick Hand" se pose sur la ligne
    const paddingTop = '7px'; 
    const paddingX = '24px'; // Marge gauche/droite pour ne pas coller aux bords du papier

    return (
        <div className="relative w-full h-full rounded-sm bg-stone-50/30 overflow-hidden">
            <textarea 
              className="w-full h-full bg-transparent resize-none focus:outline-none text-ink block custom-scrollbar"
              style={{
                  fontFamily: '"Patrick Hand", cursive',
                  fontSize,
                  lineHeight: `${lineHeight}px`,
                  paddingTop,
                  paddingLeft: paddingX,
                  paddingRight: paddingX,
                  paddingBottom: '20px', // Marge en bas pour ne pas couper la dernière ligne
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  
                  // Le fond est appliqué directement au textarea
                  backgroundImage: `linear-gradient(transparent ${lineHeight - 1}px, #d6d3d1 ${lineHeight - 1}px)`,
                  backgroundSize: `100% ${lineHeight}px`,
                  backgroundAttachment: 'local',
                  backgroundPosition: `0 ${paddingTop}`, // Aligne le début du gradient avec le padding
              }}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              spellCheck={false}
            />
            
            {/* Styles pour personnaliser légèrement la scrollbar */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.05);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.2);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0,0,0,0.4);
                }
            `}</style>
        </div>
    );
};

// --- SUBS-COMPONENT FOR PARTY TABLE ---
const PartyTable: React.FC<{
    data: CharacterSheetData;
    onChange: React.Dispatch<React.SetStateAction<CharacterSheetData>>;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info') => void;
}> = ({ data, onChange, onAddLog }) => {
    
    const columns = data.partyNotes?.columns || [];
    const members = data.partyNotes?.members || [];
    const staticWidths = data.partyNotes?.staticColWidths || { character: 200, player: 200 };
    
    // State to track newly added column for auto-focus
    const [newlyAddedColId, setNewlyAddedColId] = useState<string | null>(null);
    
    // State for Resizing
    const resizingRef = useRef<{ colId: string | 'character' | 'player', startX: number, startWidth: number } | null>(null);

    // Effect to focus and select the input of the newly created column
    useEffect(() => {
        if (newlyAddedColId) {
            const inputEl = document.getElementById(`party-col-header-${newlyAddedColId}`) as HTMLInputElement;
            if (inputEl) {
                inputEl.focus();
                inputEl.select(); // Select all text to allow immediate overwrite
                setNewlyAddedColId(null); // Reset flag
            }
        }
    }, [columns, newlyAddedColId]);

    // Resizing Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingRef.current) return;
            
            const { colId, startX, startWidth } = resizingRef.current;
            const delta = e.clientX - startX;
            const newWidth = Math.max(50, startWidth + delta); // Min width 50px

            if (colId === 'character' || colId === 'player') {
                // Update Static Columns locally first (perf) then sync or directly sync?
                // Direct sync might be heavy if many rows, but safe enough for this app scale.
                // Actually, let's just update via onChange to keep it simple.
                onChange(prev => ({
                    ...prev,
                    partyNotes: {
                        ...prev.partyNotes,
                        staticColWidths: {
                            ...prev.partyNotes.staticColWidths!,
                            [colId]: newWidth
                        }
                    }
                }));
            } else {
                // Dynamic Columns
                onChange(prev => ({
                    ...prev,
                    partyNotes: {
                        ...prev.partyNotes,
                        columns: prev.partyNotes.columns.map(c => c.id === colId ? { ...c, width: newWidth } : c)
                    }
                }));
            }
        };

        const handleMouseUp = () => {
            if (resizingRef.current) {
                resizingRef.current = null;
                document.body.style.cursor = 'default';
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onChange]); // Depend on onChange to access latest state

    const startResizing = (e: React.MouseEvent, colId: string | 'character' | 'player', currentWidth: number) => {
        e.preventDefault();
        resizingRef.current = { colId, startX: e.clientX, startWidth: currentWidth };
        document.body.style.cursor = 'col-resize';
    };

    const addColumn = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newCol: PartyColumn = {
            id: newId,
            label: "Nouvelle Colonne",
            width: 150
        };
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                columns: [...columns, newCol]
            }
        });
        setNewlyAddedColId(newId); // Trigger the focus effect
        onAddLog("Colonne ajoutée au groupe", 'info');
    };

    const deleteColumn = (colId: string) => {
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                columns: columns.filter(c => c.id !== colId)
            }
        });
    };

    const updateColumnLabel = (colId: string, newVal: string) => {
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                columns: columns.map(c => c.id === colId ? { ...c, label: newVal } : c)
            }
        });
    };

    const addMember = () => {
        const newMember: PartyMemberEntry = {
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            player: '',
            data: {}
        };
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                members: [...members, newMember]
            }
        });
        onAddLog("Membre ajouté au groupe", 'success');
    };

    const updateMember = (memberId: string, field: 'name' | 'player' | 'data', value: any, key?: string) => {
        const newMembers = members.map(m => {
            if (m.id !== memberId) return m;
            if (field === 'data' && key) {
                return { ...m, data: { ...m.data, [key]: value } };
            }
            return { ...m, [field]: value };
        });

        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                members: newMembers
            }
        });
    };

    const deleteMember = (memberId: string) => {
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                members: members.filter(m => m.id !== memberId)
            }
        });
    };

    return (
        <div className="w-full h-full flex flex-col p-4">
             <div className="flex-grow overflow-auto">
                 <table className="border-collapse table-fixed min-w-full">
                     <thead className="sticky top-0 z-10">
                         <tr>
                             {/* Static: Character */}
                             <th 
                                className="border-b-2 border-stone-400 bg-[#f6f3ed] text-left p-2 font-serif text-stone-700 relative"
                                style={{ width: staticWidths.character }}
                             >
                                Personnage
                                <div 
                                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-stone-300 z-20"
                                    onMouseDown={(e) => startResizing(e, 'character', staticWidths.character)}
                                />
                             </th>
                             
                             {/* Static: Player */}
                             <th 
                                className="border-b-2 border-stone-400 bg-[#f6f3ed] text-left p-2 font-serif text-stone-700 border-l border-stone-300 relative"
                                style={{ width: staticWidths.player }}
                             >
                                Joueur
                                <div 
                                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-stone-300 z-20"
                                    onMouseDown={(e) => startResizing(e, 'player', staticWidths.player)}
                                />
                             </th>

                             {/* Dynamic Columns */}
                             {columns.map(col => (
                                 <th 
                                    key={col.id} 
                                    className="border-b-2 border-stone-400 bg-[#f6f3ed] text-left p-2 font-serif text-stone-700 border-l border-stone-300 group relative"
                                    style={{ width: col.width || 150 }}
                                 >
                                     <input 
                                        id={`party-col-header-${col.id}`}
                                        className="bg-transparent font-bold w-full outline-none focus:border-b border-indigo-500 pr-6" // pr-6 for space for delete button
                                        value={col.label}
                                        onChange={(e) => updateColumnLabel(col.id, e.target.value)}
                                     />
                                     <button 
                                        onClick={() => deleteColumn(col.id)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        title="Supprimer colonne"
                                     >
                                         <X size={14} />
                                     </button>
                                     {/* Resizer Handle */}
                                     <div 
                                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-stone-300 z-20"
                                        onMouseDown={(e) => startResizing(e, col.id, col.width || 150)}
                                     />
                                 </th>
                             ))}
                             
                             {/* Add Column Button */}
                             <th className="border-b-2 border-stone-400 bg-[#f6f3ed] p-2 w-12 text-center">
                                 <button onClick={addColumn} className="text-stone-500 hover:text-indigo-600 transition-colors" title="Ajouter une colonne">
                                     <Plus size={20} />
                                 </button>
                             </th>
                             <th className="border-b-2 border-stone-400 bg-[#f6f3ed] w-12"></th> {/* Action column space */}
                         </tr>
                     </thead>
                     <tbody>
                         {members.map(member => (
                             <tr key={member.id} className="hover:bg-stone-50 group">
                                 <td className="p-0 border-b border-stone-300 h-10 overflow-hidden">
                                     <input 
                                        className="w-full h-full bg-transparent px-2 font-handwriting text-lg text-ink outline-none"
                                        placeholder="Nom du perso..."
                                        value={member.name}
                                        onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                                     />
                                 </td>
                                 <td className="p-0 border-b border-stone-300 h-10 border-l border-stone-200 overflow-hidden">
                                     <input 
                                        className="w-full h-full bg-transparent px-2 font-handwriting text-lg text-ink outline-none"
                                        placeholder="Nom du joueur..."
                                        value={member.player}
                                        onChange={(e) => updateMember(member.id, 'player', e.target.value)}
                                     />
                                 </td>
                                 {columns.map(col => (
                                     <td key={col.id} className="p-0 border-b border-stone-300 h-10 border-l border-stone-200 overflow-hidden">
                                         <input 
                                            className="w-full h-full bg-transparent px-2 font-handwriting text-lg text-stone-600 outline-none"
                                            value={member.data[col.id] || ''}
                                            onChange={(e) => updateMember(member.id, 'data', e.target.value, col.id)}
                                         />
                                     </td>
                                 ))}
                                 <td colSpan={2} className="border-b border-stone-300 text-center w-24">
                                     <button 
                                        onClick={() => deleteMember(member.id)}
                                        className="text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                     >
                                         <Trash2 size={16} />
                                     </button>
                                 </td>
                             </tr>
                         ))}
                         {members.length === 0 && (
                             <tr>
                                 <td colSpan={columns.length + 4} className="text-center py-8 text-stone-400 italic font-handwriting text-xl">
                                     Aucun membre dans le groupe pour l'instant.
                                 </td>
                             </tr>
                         )}
                     </tbody>
                 </table>
             </div>
             
             {/* Footer Add Button */}
             <div className="pt-4 mt-2 border-t border-stone-300 flex justify-center">
                 <button 
                    onClick={addMember}
                    className="flex items-center gap-2 text-indigo-800 hover:text-indigo-600 font-bold uppercase text-sm tracking-wider px-4 py-2 rounded hover:bg-indigo-50 transition-colors"
                 >
                     <Plus size={18} /> Ajouter un Membre
                 </button>
             </div>
        </div>
    );
};

const CampaignNotes: React.FC<Props> = ({ data, onChange, isLandscape = false, onAddLog }) => {
  const [activeTab, setActiveTab] = useState<'journal' | 'party'>('journal');

  // --- JOURNAL STATES ---
  // Initialize to last page if notes exist, else 0
  const [currentIndex, setCurrentIndex] = useState(() => {
      return data.campaignNotes && data.campaignNotes.length > 0 ? data.campaignNotes.length - 1 : 0;
  });
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  const totalPages = data.campaignNotes?.length || 0;
  const currentNote = totalPages > 0 && data.campaignNotes ? data.campaignNotes[currentIndex] : null;

  // --- EFFECTS ---
  // Ensure index remains valid if data changes externally
  useEffect(() => {
      if (totalPages > 0 && currentIndex >= totalPages) {
          setCurrentIndex(totalPages - 1);
      }
  }, [totalPages]);

  // --- JOURNAL ACTIONS ---
  const addNote = () => {
    const newNote: CampaignNoteEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('fr-CA'),
      title: 'Nouvelle Session',
      content: ''
    };
    
    const newNotes = [...(data.campaignNotes || []), newNote];
    onChange({
      ...data,
      campaignNotes: newNotes
    });
    
    // Switch to new page
    setCurrentIndex(newNotes.length - 1);
    setActiveTab('journal'); // Ensure we switch back to journal view
    onAddLog("Nouvelle page ajoutée au journal", 'success', 'sheet');
  };

  const updateNote = (id: string, field: keyof CampaignNoteEntry, value: string) => {
    const newNotes = (data.campaignNotes || []).map(n => n.id === id ? { ...n, [field]: value } : n);
    onChange({ ...data, campaignNotes: newNotes });
  };

  const confirmDeleteNote = () => {
    if (noteIdToDelete) {
        const newNotes = (data.campaignNotes || []).filter(n => n.id !== noteIdToDelete);
        onChange({ ...data, campaignNotes: newNotes });
        onAddLog("Page du journal arrachée", 'danger', 'sheet');
        setNoteIdToDelete(null);
        
        // Adjust index: stay on same index unless it was the last one
        if (currentIndex >= newNotes.length) {
            setCurrentIndex(Math.max(0, newNotes.length - 1));
        }
    }
  };

  const goToPrevious = () => {
      if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const goToNext = () => {
      if (currentIndex < totalPages - 1) setCurrentIndex(currentIndex + 1);
  };

  const noteToDelete = (data.campaignNotes || []).find(n => n.id === noteIdToDelete);

  return (
    // Outer Wrapper
    <div className={`w-full flex items-center justify-center bg-stone-900 py-8 px-4 md:px-12 relative overflow-hidden transition-all duration-300 ${isLandscape ? 'h-[1100px]' : 'h-[calc(100vh-140px)] min-h-[800px]'}`}>
      
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>

      {/* --- SIDE NAVIGATION BUTTONS (Journal Only) --- */}
      {activeTab === 'journal' && (
          <>
            <button 
                onClick={goToPrevious}
                disabled={currentIndex <= 0}
                className={`absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-stone-800 text-stone-200 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-stone-600 hover:bg-stone-700 hover:scale-110 hover:text-white transition-all duration-300 ${currentIndex <= 0 ? 'opacity-0 pointer-events-none translate-x-[-20px]' : 'opacity-100 translate-x-0'}`}
                title="Page précédente"
            >
                <ChevronLeft size={32} strokeWidth={2} />
            </button>

            <button 
                onClick={goToNext}
                disabled={currentIndex >= totalPages - 1}
                className={`absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-stone-800 text-stone-200 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-stone-600 hover:bg-stone-700 hover:scale-110 hover:text-white transition-all duration-300 ${currentIndex >= totalPages - 1 ? 'opacity-0 pointer-events-none translate-x-[20px]' : 'opacity-100 translate-x-0'}`}
                title="Page suivante"
            >
                <ChevronRight size={32} strokeWidth={2} />
            </button>
          </>
      )}

      {/* --- THE BOOK CONTAINER --- */}
      <div className={`relative bg-[#fdfbf7] shadow-2xl transition-all duration-500 flex flex-col overflow-hidden z-10
          ${isLandscape ? 'w-full h-full max-w-[1560px]' : 'w-full max-w-[900px] h-full aspect-[1/1.414]'} 
          rounded-r-md rounded-l-sm border-r-8 border-r-stone-200 border-l-[12px] border-l-stone-800
      `}>
          
          {/* Visual Binding */}
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-stone-400 opacity-20 z-20 pointer-events-none shadow-[2px_0_5px_rgba(0,0,0,0.2)]"></div>

          {/* BOOK HEADER */}
          <div className="shrink-0 pt-6 pb-2 px-8 md:px-12 bg-[#fdfbf7] z-20 flex items-end justify-between border-b-2 border-stone-800 relative">
                
                {/* Title & Tabs Container */}
                <div className="flex items-end gap-6">
                    {/* Tab 1: Journal */}
                    <button 
                        onClick={() => setActiveTab('journal')}
                        className={`group flex items-center gap-2 pb-1 transition-all ${activeTab === 'journal' ? 'text-indigo-950 border-b-4 border-indigo-900' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        <Book size={28} strokeWidth={activeTab === 'journal' ? 2.5 : 2} className="transition-transform group-hover:-translate-y-1" />
                        <span className={`text-2xl font-black uppercase tracking-[0.1em] font-serif leading-none hidden sm:inline`}>Journal</span>
                    </button>

                    {/* Tab 2: Party */}
                    <button 
                        onClick={() => setActiveTab('party')}
                        className={`group flex items-center gap-2 pb-1 transition-all ${activeTab === 'party' ? 'text-indigo-950 border-b-4 border-indigo-900' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        <Users size={28} strokeWidth={activeTab === 'party' ? 2.5 : 2} className="transition-transform group-hover:-translate-y-1" />
                        <span className={`text-2xl font-black uppercase tracking-[0.1em] font-serif leading-none hidden sm:inline`}>Groupe</span>
                    </button>
                </div>

                {/* Right Actions */}
                {activeTab === 'journal' ? (
                    <button 
                        onClick={addNote}
                        className="flex items-center gap-2 bg-indigo-700 text-white pl-3 pr-4 py-2 rounded-sm shadow-md hover:bg-indigo-800 transition-all hover:-translate-y-0.5 font-bold text-sm z-50 ml-auto"
                        title="Ajouter une nouvelle page à la fin"
                    >
                        <Plus size={18} strokeWidth={3} /> <span className="uppercase tracking-wide hidden sm:inline">Nouvelle Page</span>
                    </button>
                ) : (
                   <div className="ml-auto flex items-center gap-2 text-stone-500 font-serif italic text-sm">
                       <PenTool size={16} /> Édition libre
                   </div>
                )}
                
                <div className="absolute top-0 right-8 text-red-700 drop-shadow-md">
                    <Bookmark size={40} fill="currentColor" />
                </div>
          </div>

          {/* --- CONTENT AREA --- */}
          <div className="flex-grow flex flex-col overflow-hidden bg-stone-50/20 relative">
              
              {/* === TAB 1: JOURNAL === */}
              {activeTab === 'journal' && (
                  <>
                    <div className="flex-grow flex flex-col overflow-hidden p-6 md:p-12">
                        {!currentNote && (
                            <div className="flex-grow flex flex-col items-center justify-center text-stone-400 italic gap-6 opacity-60 animate-in fade-in duration-1000">
                                <div className="w-24 h-24 border-4 border-stone-300 rounded-full flex items-center justify-center">
                                    <Book size={48} strokeWidth={1} />
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-serif text-stone-500">Le journal est vierge.</p>
                                    <p className="text-sm mt-2 font-handwriting text-xl text-stone-400">Cliquez sur "Nouvelle Page" pour commencer l'histoire.</p>
                                </div>
                            </div>
                        )}

                        {currentNote && (
                            <div className="w-full h-full flex flex-col animate-in fade-in zoom-in duration-300">
                                <div className="bg-white border border-stone-300 shadow-sm relative group w-full h-full flex flex-col rounded-sm overflow-hidden flex-grow min-h-0">
                                        
                                        {/* Note Header */}
                                        <div className="bg-stone-100 border-b border-stone-200 p-3 flex items-center justify-between pl-4 shrink-0 rounded-t-sm z-20">
                                            <div className="flex items-center gap-3 flex-grow min-w-0">
                                                {/* Simple Date Input (XP Style) */}
                                                <div className="w-[130px] shrink-0">
                                                    <input 
                                                        type="date"
                                                        className="w-full bg-transparent border-b border-dotted border-stone-400 focus:border-indigo-500 outline-none text-base font-handwriting text-stone-800 font-bold"
                                                        value={currentNote.date}
                                                        onChange={(e) => updateNote(currentNote.id, 'date', e.target.value)}
                                                        style={{ colorScheme: 'light' }}
                                                    />
                                                </div>

                                                <div className="h-8 w-px bg-stone-300 mx-1"></div>
                                                <input 
                                                    type="text"
                                                    value={currentNote.title}
                                                    onChange={(e) => updateNote(currentNote.id, 'title', e.target.value)}
                                                    placeholder="Titre de la session..."
                                                    className="bg-transparent text-lg font-serif font-bold text-indigo-950 focus:outline-none flex-grow placeholder-stone-300"
                                                />
                                            </div>
                                            
                                            <div className="flex items-center gap-1 no-print shrink-0 ml-2">
                                                <button 
                                                    onClick={() => setNoteIdToDelete(currentNote.id)}
                                                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Arracher cette page"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Note Body */}
                                        <div className="flex-grow min-h-0 bg-white relative rounded-b-sm">
                                            <NotebookTextarea 
                                                value={currentNote.content}
                                                onChange={(v) => updateNote(currentNote.id, 'content', v)}
                                                placeholder="Récit des événements..."
                                            />
                                        </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* BOOK FOOTER - Page Indicator Only */}
                    <div className="shrink-0 bg-[#fdfbf7] py-3 border-t border-stone-200 flex justify-center items-center px-8 md:px-12 text-stone-500 font-serif select-none relative z-30">
                        <div className="font-mono text-xs uppercase tracking-widest text-stone-400 font-bold">
                            {totalPages > 0 ? (
                                <span>Page {currentIndex + 1} <span className="mx-1 text-stone-300">/</span> {totalPages}</span>
                            ) : (
                                <span>-</span>
                            )}
                        </div>
                    </div>
                  </>
              )}

              {/* === TAB 2: PARTY MEMBERS === */}
              {activeTab === 'party' && (
                  <div className="flex-grow flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300">
                      <PartyTable data={data} onChange={onChange} onAddLog={onAddLog} />
                  </div>
              )}

          </div>

      </div>

      {/* MODAL DE CONFIRMATION */}
      {noteIdToDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 animate-in fade-in duration-200 no-print">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-in zoom-in duration-200 border-2 border-stone-200">
                <div className="bg-stone-50 p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 shadow-inner">
                         <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Arracher cette page ?</h3>
                    <div className="bg-white p-3 rounded border border-stone-200 shadow-sm w-full mb-4 text-left">
                        <span className="block font-bold text-gray-800 truncate">{noteToDelete?.title || 'Note sans titre'}</span>
                        <span className="text-xs text-gray-500 block">{noteToDelete?.date}</span>
                    </div>
                    <p className="text-gray-500 text-xs">
                        Cette action est définitive. Le contenu sera perdu à jamais.
                    </p>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-100">
                    <button 
                        onClick={() => setNoteIdToDelete(null)} 
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-colors text-sm"
                    >
                        Garder
                    </button>
                    <button 
                        onClick={confirmDeleteNote} 
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md transition-colors text-sm"
                    >
                        Détruire
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CampaignNotes;