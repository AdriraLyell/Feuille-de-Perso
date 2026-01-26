
import React, { useRef, useState, useEffect } from 'react';
import { CharacterSheetData, ReputationEntry, TraitEntry, LibraryEntry } from '../types';
import { BookOpen, X, Edit, Trash2, Check, ArrowRight, CheckSquare, Square } from 'lucide-react';
import TraitLibrary from './TraitLibrary';

// Moved outside to prevent re-creation on every render which causes input focus loss
const SectionHeader: React.FC<{ title: string, total?: number, totalColor?: string, onOpenLibrary?: () => void }> = ({ title, total, totalColor, onOpenLibrary }) => (
  <div className="bg-slate-200 text-slate-800 relative text-center font-bold text-xs border-y border-stone-500 uppercase py-0.5 tracking-wide mb-0.5 flex items-center justify-center min-h-[1.5rem] shrink-0 shadow-sm group">
    {/* Total positioned absolutely to the left */}
    {total !== undefined && (
        <div className="absolute left-1 top-0 bottom-0 flex items-center">
            <span 
                className={`w-10 flex justify-center items-center bg-white border border-stone-400 rounded-sm text-xs h-5 font-bold shadow-sm ${totalColor || 'text-stone-800'}`}
                title="Total"
            >
                {total}
            </span>
        </div>
    )}
    <span>{title}</span>
    
    {onOpenLibrary && (
        <button 
            onClick={onOpenLibrary}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white text-stone-500 hover:text-blue-600 transition-colors"
            title="Ouvrir la bibliothèque"
        >
            <BookOpen size={14} />
        </button>
    )}
  </div>
);

const LineInput: React.FC<{ value: string, onChange: (v: string) => void }> = ({ value, onChange }) => (
  <input 
      className="w-full bg-transparent border-b border-stone-300 px-1 font-handwriting focus:bg-blue-50 focus:border-blue-300 focus:outline-none text-ink h-[22px]"
      style={{ fontSize: '0.9rem' }} 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
  />
);

// Display-only component that triggers modal on click
const TraitRow: React.FC<{ 
    item: TraitEntry, 
    onClick: () => void 
}> = ({ item, onClick }) => {
    const isEmpty = !item.name.trim();
    
    return (
        <div 
            onClick={onClick}
            className={`flex gap-1 items-center h-[22px] px-1 transition-all rounded-sm cursor-pointer group select-none ${
                isEmpty 
                ? 'hover:bg-slate-50 border-b border-dotted border-stone-200' 
                : 'hover:bg-blue-50 bg-white/50 border-b border-stone-300 shadow-sm'
            }`}
        >
            {/* Value Column on Left - Added shrink-0 to prevent collapsing */}
            <div className={`w-8 shrink-0 text-center font-bold text-xs h-full flex items-center justify-center border-r border-stone-300 ${
                isEmpty ? 'text-stone-300' : 'text-stone-800 font-handwriting bg-white'
            }`} style={{ fontSize: '0.9rem' }}>
                {item.value || (isEmpty ? '-' : '')}
            </div>
            
            {/* Name Column */}
            <div className={`flex-grow h-full flex items-center px-1 font-handwriting min-w-0 ${
                isEmpty ? 'text-stone-300 italic text-[10px]' : 'text-ink'
            }`} style={{ fontSize: isEmpty ? '0.7rem' : '0.9rem' }}>
                <span className="truncate w-full block" title={!isEmpty ? item.name : undefined}>
                    {item.name || "Vide"}
                </span>
            </div>

            {/* Hint Icon on Hover */}
            <div className="opacity-0 group-hover:opacity-100 text-stone-400 scale-75 transition-opacity shrink-0">
                <Edit size={14} />
            </div>
        </div>
    );
};

// Reusable Notebook Input Component
const NotebookInput: React.FC<{ value: string, onChange: (v: string) => void, placeholder?: string }> = ({ value, onChange, placeholder }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const maskRef = useRef<HTMLDivElement>(null);

    // Sync scrolling between the textarea and the background mask
    const handleScroll = () => {
        if (textareaRef.current && maskRef.current) {
            maskRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    // Configuration constants to ensure perfect alignment
    const lineHeight = '22px'; // Reduced from 24px
    const fontSize = '0.9rem'; 
    const paddingTop = '6px'; // Reduced from 9px to match new line height
    const paddingX = '4px';

    // Common typography styles for both mask and textarea
    const typoStyles: React.CSSProperties = {
        fontFamily: '"Patrick Hand", cursive', // Force Handwriting
        fontSize,
        lineHeight,
        paddingTop,
        paddingLeft: paddingX,
        paddingRight: paddingX,
        whiteSpace: 'pre-wrap', // Preserve wrapping
        wordWrap: 'break-word',
    };

    return (
        <div className="relative w-full h-full overflow-hidden rounded-sm bg-white/50">
            {/* Layer 2: The Mask & Background Lines */}
            <div 
                ref={maskRef}
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-10 text-transparent"
                style={{
                    ...typoStyles,
                    // Use a warmer gray for lines. Line at 21px (height 22px)
                    backgroundImage: `linear-gradient(to right, transparent ${paddingX}, transparent ${paddingX}), linear-gradient(transparent 21px, #e7e5e4 21px)`,
                    backgroundSize: '100% 22px',
                    backgroundAttachment: 'local',
                    backgroundRepeat: 'repeat',
                }}
                aria-hidden="true"
            >
                <div className="min-h-full w-full">
                    <span className="box-decoration-clone">
                        {value} 
                    </span>
                </div>
            </div>

            {/* Layer 3: The Input */}
            <textarea 
              ref={textareaRef}
              className="relative z-20 w-full h-full bg-transparent resize-none focus:outline-none text-ink"
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

interface Props {
  data: CharacterSheetData;
  onChange: (newData: CharacterSheetData) => void;
  isLandscape?: boolean;
  onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void;
}

const CharacterSheetPage2: React.FC<Props> = ({ data, onChange, isLandscape = false, onAddLog }) => {
  // State for the specific Trait Editor Modal
  const [editingSlot, setEditingSlot] = useState<{ type: 'vertus' | 'defauts', index: number } | null>(null);
  
  // State for Multi-Select Library Modal
  const [multiSelectTarget, setMultiSelectTarget] = useState<'vertus' | 'defauts' | null>(null);

  const [editorName, setEditorName] = useState('');
  const [editorValue, setEditorValue] = useState('');

  // When opening editor, pre-fill values
  useEffect(() => {
      if (editingSlot) {
          const item = data.page2[editingSlot.type][editingSlot.index];
          setEditorName(item.name);
          setEditorValue(item.value);
      }
  }, [editingSlot, data.page2]);

  const updateList = (field: keyof CharacterSheetData['page2'], index: number, value: string) => {
    // @ts-ignore
    const newList = [...data.page2[field]];
    newList[index] = value;
    onChange({
      ...data,
      page2: {
        ...data.page2,
        [field]: newList
      }
    });
    onAddLog(`Modification ${field} (ligne ${index + 1})`, 'info', 'sheet', `${field}_${index}`);
  };

  const updateStringField = (field: keyof CharacterSheetData['page2'], value: string) => {
      onChange({
          ...data,
          page2: {
              ...data.page2,
              [field]: value
          }
      });
      onAddLog(`Modification ${field}`, 'info', 'sheet', `${field}`);
  };

  const saveTraitFromEditor = () => {
      if (!editingSlot) return;
      
      const newList = [...data.page2[editingSlot.type]];
      newList[editingSlot.index] = { name: editorName, value: editorValue };
      
      onChange({
          ...data,
          page2: {
              ...data.page2,
              [editingSlot.type]: newList
          }
      });
      
      onAddLog(`Modification ${editingSlot.type} (ligne ${editingSlot.index + 1})`, 'info', 'sheet');
      setEditingSlot(null);
  };

  const clearTraitFromEditor = () => {
      setEditorName('');
      setEditorValue('');
      // We don't save immediately, user must click Save to confirm clearing
  };

  const handleLibrarySelectInEditor = (entry: LibraryEntry) => {
      setEditorName(entry.name);
      setEditorValue(entry.cost);
  };

  // Logic to handle multiple trait addition to the list
  const handleMultiAdd = (entries: LibraryEntry[]) => {
      if (!multiSelectTarget) return;

      const currentList = [...data.page2[multiSelectTarget]];
      let addedCount = 0;
      let listIndex = 0;

      // Iterate through entries and find empty slots
      entries.forEach(entry => {
          // Find next empty slot
          while (listIndex < currentList.length && currentList[listIndex].name.trim() !== '') {
              listIndex++;
          }

          if (listIndex < currentList.length) {
              currentList[listIndex] = { name: entry.name, value: entry.cost };
              addedCount++;
          }
      });

      if (addedCount > 0) {
          onChange({
              ...data,
              page2: {
                  ...data.page2,
                  [multiSelectTarget]: currentList
              }
          });
          onAddLog(`Ajout de ${addedCount} trait(s) depuis la bibliothèque`, 'success', 'sheet');
      } else {
          onAddLog('Aucun espace vide disponible pour ajouter les traits', 'danger', 'sheet');
      }

      setMultiSelectTarget(null);
  };

  const updateReputationEntry = (field: 'reputation', index: number, key: keyof ReputationEntry, value: string) => {
    // @ts-ignore
    const newList = [...data.page2[field]];
    newList[index] = { ...newList[index], [key]: value };
    onChange({
      ...data,
      page2: {
        ...data.page2,
        [field]: newList
      }
    });
    onAddLog(`Modification Réputation (ligne ${index + 1})`, 'info', 'sheet', `${field}_${index}_${key}`);
  };

  const calculateTotal = (list: TraitEntry[]) => {
      return list.reduce((acc, item) => {
          const val = parseInt(item.value);
          return acc + (isNaN(val) ? 0 : val);
      }, 0);
  };

  // Helper to render layout content to avoid duplication (keeping logic separate)
  const VertusColumn = (
     <div className="col-span-2 border-r border-stone-400 p-1.5 flex flex-col h-full overflow-hidden">
         <SectionHeader 
            title="Vertus" 
            total={calculateTotal(data.page2.vertus)}
            totalColor="text-green-700 bg-green-50 border-green-200"
            onOpenLibrary={() => setMultiSelectTarget('vertus')}
         />
         <div className="space-y-0.5 flex-grow overflow-auto min-h-0">
             {data.page2.vertus.map((item, i) => (
                <TraitRow key={i} item={item} onClick={() => setEditingSlot({ type: 'vertus', index: i })} />
             ))}
         </div>
     </div>
  );

  const DefautsColumn = (
     <div className="col-span-2 border-r border-stone-400 p-1.5 flex flex-col h-full overflow-hidden">
         <SectionHeader 
            title="Défauts" 
            total={calculateTotal(data.page2.defauts)}
            totalColor="text-red-700 bg-red-50 border-red-200"
            onOpenLibrary={() => setMultiSelectTarget('defauts')}
         />
         <div className="space-y-0.5 flex-grow overflow-auto min-h-0">
             {data.page2.defauts.map((item, i) => (
                <TraitRow key={i} item={item} onClick={() => setEditingSlot({ type: 'defauts', index: i })} />
             ))}
         </div>
     </div>
  );

  return (
    <>
        {isLandscape ? (
            <div className="sheet-container landscape flex flex-col overflow-hidden">
                {/* Top Section: Small Lists (3 Columns Grid) - Fixed 35% Height to maximize bottom section */}
                <div className="grid grid-cols-3 border-b-2 border-stone-800 h-[35%] overflow-hidden">
                    {/* Top-Col 1: Lieux & Contacts */}
                    <div className="border-r border-stone-400 p-1.5 flex flex-col gap-2 h-full overflow-hidden">
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <SectionHeader title="Lieux Importants" />
                            <div className="flex-grow relative min-h-0">
                                <NotebookInput value={data.page2.lieux_importants} onChange={(v) => updateStringField('lieux_importants', v)} />
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <SectionHeader title="Contacts" />
                            <div className="flex-grow relative min-h-0">
                                <NotebookInput value={data.page2.contacts} onChange={(v) => updateStringField('contacts', v)} />
                            </div>
                        </div>
                    </div>

                    {/* Top-Col 2: Connaissances & Réputation */}
                    <div className="border-r border-stone-400 p-1.5 flex flex-col gap-2 h-full overflow-hidden">
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <SectionHeader title="Connaissances" />
                            <div className="flex-grow relative min-h-0">
                                <NotebookInput value={data.page2.connaissances} onChange={(v) => updateStringField('connaissances', v)} />
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <SectionHeader title="Réputation" />
                            <div className="space-y-0.5 flex-grow overflow-auto">
                                <div className="flex text-[10px] font-bold mb-1 text-stone-600 uppercase tracking-wide shrink-0">
                                    <span className="w-1/2">Réputation</span>
                                    <span className="w-1/4 text-center">Lieu</span>
                                    <span className="w-1/4 text-center">Valeur</span>
                                </div>
                                {/* LIMIT TO 5 LINES IN LANDSCAPE TO AVOID SCROLLBAR */}
                                {data.page2.reputation.slice(0, 5).map((rep, i) => (
                                    <div key={i} className="flex gap-1 h-[22px] items-end shrink-0">
                                        <input className="border-b border-stone-300 w-1/2 bg-transparent font-handwriting text-ink text-sm h-full" value={rep.reputation} onChange={(e) => updateReputationEntry('reputation', i, 'reputation', e.target.value)} />
                                        <input className="border-b border-stone-300 w-1/4 bg-transparent font-handwriting text-ink text-sm h-full" value={rep.lieu} onChange={(e) => updateReputationEntry('reputation', i, 'lieu', e.target.value)} />
                                        <input className="border-b border-stone-300 w-1/4 bg-transparent font-handwriting text-ink text-sm h-full" value={rep.valeur} onChange={(e) => updateReputationEntry('reputation', i, 'valeur', e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top-Col 3: Valeurs & Armes */}
                    <div className="p-1.5 flex flex-col gap-2 h-full overflow-hidden">
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <SectionHeader title="Valeurs Monétaires" />
                            <div className="flex-grow relative min-h-0">
                                <NotebookInput value={data.page2.valeurs_monetaires} onChange={(v) => updateStringField('valeurs_monetaires', v)} />
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <SectionHeader title="Armes" />
                            <div className="space-y-0.5 flex-grow overflow-auto">
                                {/* LIMIT TO 6 LINES IN LANDSCAPE TO AVOID SCROLLBAR */}
                                {data.page2.armes_list.slice(0, 6).map((val, i) => (
                                    <LineInput key={i} value={val} onChange={(v) => updateList('armes_list', i, v)} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Long Lists (12 Columns Grid) - Fixed 65% Height */}
                <div className="grid grid-cols-12 h-[65%] overflow-hidden">
                    {/* Bot-Col 1: Vertus */}
                    {VertusColumn}

                    {/* Bot-Col 2: Défauts */}
                    {DefautsColumn}

                    {/* Bot-Col 3: Equipement */}
                    <div className="col-span-4 border-r border-stone-400 p-1.5 flex flex-col h-full overflow-hidden">
                        <SectionHeader title="Equipement" />
                        <div className="flex-grow min-h-0">
                            <NotebookInput 
                                value={data.page2.equipement} 
                                onChange={(v) => updateStringField('equipement', v)}
                            />
                        </div>
                    </div>

                    {/* Bot-Col 4: Notes */}
                    <div className="col-span-4 p-1.5 flex flex-col h-full overflow-hidden">
                        <SectionHeader title="Notes" />
                        <div className="flex-grow min-h-0">
                            <NotebookInput 
                                value={data.page2.notes} 
                                onChange={(v) => updateStringField('notes', v)}
                                placeholder=""
                            />
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            // Portrait Mode
            <div className="sheet-container">
            {/* Top Row: Lieux & Contacts | Connaissances & Réputation */}
            <div className="grid grid-cols-2 h-[220px]">
                {/* Lieux Importants & Contacts */}
                <div className="border-r border-stone-400 flex flex-col h-full">
                    <div className="grid grid-cols-2 shrink-0">
                        <div className="border-r border-stone-400"><SectionHeader title="Lieux Importants" /></div>
                        <div><SectionHeader title="Contacts" /></div>
                    </div>
                    
                    <div className="flex-grow grid grid-cols-2 h-full overflow-hidden">
                        <div className="border-r border-stone-400 p-1 flex flex-col h-full overflow-hidden">
                            <div className="flex-grow overflow-hidden">
                            <NotebookInput value={data.page2.lieux_importants} onChange={(v) => updateStringField('lieux_importants', v)} />
                            </div>
                        </div>
                        <div className="p-1 flex flex-col h-full overflow-hidden">
                            <div className="flex-grow overflow-hidden">
                                <NotebookInput value={data.page2.contacts} onChange={(v) => updateStringField('contacts', v)} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Connaissances & Reputation */}
                <div className="flex flex-col h-full">
                    <div className="grid grid-cols-2 shrink-0">
                        <div className="border-r border-stone-400"><SectionHeader title="Connaissances" /></div>
                        <div><SectionHeader title="Réputation" /></div>
                    </div>
                    <div className="flex-grow grid grid-cols-2 h-full overflow-hidden">
                        {/* Connaissances Column */}
                        <div className="border-r border-stone-400 p-1 flex flex-col h-full overflow-hidden">
                            <div className="flex-grow overflow-hidden">
                                <NotebookInput value={data.page2.connaissances} onChange={(v) => updateStringField('connaissances', v)} />
                            </div>
                        </div>

                        {/* Réputation Column */}
                        <div className="p-1 flex flex-col h-full overflow-hidden">
                            <div className="flex text-[10px] font-bold mb-1 shrink-0 text-stone-600 uppercase tracking-wide">
                                <span className="w-1/2">Réputation</span>
                                <span className="w-1/4 text-center">Lieu</span>
                                <span className="w-1/4 text-center">Valeur</span>
                            </div>
                            <div className="space-y-0.5 overflow-auto">
                                {data.page2.reputation.map((rep, i) => (
                                    <div key={i} className="flex gap-1 h-[22px] items-end">
                                        <input className="border-b border-stone-300 w-1/2 bg-transparent font-handwriting text-ink text-sm h-full" value={rep.reputation} onChange={(e) => updateReputationEntry('reputation', i, 'reputation', e.target.value)} />
                                        <input className="border-b border-stone-300 w-1/4 bg-transparent font-handwriting text-ink text-sm h-full" value={rep.lieu} onChange={(e) => updateReputationEntry('reputation', i, 'lieu', e.target.value)} />
                                        <input className="border-b border-stone-300 w-1/4 bg-transparent font-handwriting text-ink text-sm h-full" value={rep.valeur} onChange={(e) => updateReputationEntry('reputation', i, 'valeur', e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Second Row: Valeurs Monetaires & Armes */}
            <div className="grid grid-cols-4 h-[160px] border-t-2 border-stone-800">
                {/* Valeurs Monetaires */}
                <div className="col-span-1 border-r border-stone-400 flex flex-col h-full">
                    <SectionHeader title="Valeurs Monétaires" />
                    <div className="p-1 space-y-0.5 flex-grow overflow-hidden">
                        <NotebookInput value={data.page2.valeurs_monetaires} onChange={(v) => updateStringField('valeurs_monetaires', v)} />
                    </div>
                </div>
                {/* Armes */}
                <div className="col-span-3 flex flex-col h-full">
                    <SectionHeader title="Armes" />
                    <div className="grid grid-cols-2 h-full overflow-hidden">
                            <div className="border-r border-stone-400 p-1 space-y-0.5 overflow-auto">
                                {data.page2.armes_list.slice(0, 5).map((val, i) => (
                                    <LineInput key={i} value={val} onChange={(v) => updateList('armes_list', i, v)} />
                                ))}
                            </div>
                            <div className="p-1 space-y-0.5 overflow-auto">
                                {data.page2.armes_list.slice(5, 10).map((val, i) => (
                                    <LineInput key={i + 5} value={val} onChange={(v) => updateList('armes_list', i + 5, v)} />
                                ))}
                            </div>
                    </div>
                </div>
            </div>

            {/* Third Row: Traits & Equipement */}
            <div className="grid grid-cols-2 border-t-2 border-stone-800">
                {/* Traits */}
                <div className="border-r-2 border-stone-800 flex flex-col overflow-hidden">
                    <SectionHeader title="Traits - Signes Particuliers" />
                    <div className="grid grid-cols-2 flex-grow overflow-hidden">
                        {/* Vertus Column */}
                        <div className="border-r border-stone-400 flex flex-col overflow-hidden">
                             <div className="relative text-center text-[10px] font-bold italic py-1 bg-green-50/50 border-b border-stone-300 flex items-center justify-center min-h-[1.75rem] shrink-0 group">
                                <div className="absolute left-2 top-0 bottom-0 flex items-center">
                                    <span className="w-10 flex justify-center items-center bg-white border border-stone-300 rounded-sm text-xs h-5 font-bold shadow-sm text-green-700">
                                        {calculateTotal(data.page2.vertus)}
                                    </span>
                                </div>
                                <span className="text-stone-600">Vertus</span>
                                <button 
                                    onClick={() => setMultiSelectTarget('vertus')}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white text-stone-500 hover:text-green-600 transition-colors"
                                    title="Ouvrir la bibliothèque"
                                >
                                    <BookOpen size={14} />
                                </button>
                            </div>
                            <div className="p-1 space-y-0.5 overflow-auto flex-grow">
                                {data.page2.vertus.map((item, i) => (
                                    <TraitRow key={i} item={item} onClick={() => setEditingSlot({ type: 'vertus', index: i })} />
                                ))}
                            </div>
                        </div>
                        {/* Défauts Column */}
                        <div className="flex flex-col overflow-hidden">
                             <div className="relative text-center text-[10px] font-bold italic py-1 bg-red-50/50 border-b border-stone-300 flex items-center justify-center min-h-[1.75rem] shrink-0 group">
                                <div className="absolute left-2 top-0 bottom-0 flex items-center">
                                    <span className="w-10 flex justify-center items-center bg-white border border-stone-300 rounded-sm text-xs h-5 font-bold shadow-sm text-red-700">
                                        {calculateTotal(data.page2.defauts)}
                                    </span>
                                </div>
                                <span className="text-stone-600">Défauts</span>
                                <button 
                                    onClick={() => setMultiSelectTarget('defauts')}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white text-stone-500 hover:text-red-600 transition-colors"
                                    title="Ouvrir la bibliothèque"
                                >
                                    <BookOpen size={14} />
                                </button>
                            </div>
                            <div className="p-1 space-y-0.5 overflow-auto flex-grow">
                                {data.page2.defauts.map((item, i) => (
                                    <TraitRow key={i} item={item} onClick={() => setEditingSlot({ type: 'defauts', index: i })} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Equipement */}
                <div className="flex flex-col overflow-hidden">
                    <SectionHeader title="Equipement" />
                    <div className="p-1 flex-grow overflow-hidden">
                        <NotebookInput 
                            value={data.page2.equipement} 
                            onChange={(v) => updateStringField('equipement', v)}
                        />
                    </div>
                </div>
            </div>

            {/* Fourth Row: Notes */}
            <div className="flex-grow border-t-2 border-stone-800 flex flex-col min-h-[100px] overflow-hidden">
                <SectionHeader title="Notes" />
                <div className="flex-grow p-1 overflow-hidden">
                        <NotebookInput 
                            value={data.page2.notes} 
                            onChange={(v) => updateStringField('notes', v)}
                            placeholder=""
                        />
                </div>
            </div>
            </div>
        )}

        {/* --- TRAIT EDITOR MODAL --- */}
        {editingSlot && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl h-[85vh] flex flex-col overflow-hidden">
                    
                    {/* Modal Header */}
                    <div className={`p-4 border-b flex justify-between items-center text-white shrink-0 ${editingSlot.type === 'vertus' ? 'bg-green-700' : 'bg-red-700'}`}>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Edit size={20} />
                            Éditer {editingSlot.type === 'vertus' ? 'Vertu' : 'Défaut'} (Ligne {editingSlot.index + 1})
                        </h3>
                        <button onClick={() => setEditingSlot(null)} className="hover:bg-white/20 p-1 rounded transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-grow flex flex-col overflow-hidden min-h-0">
                        {/* Manual Entry Section */}
                        <div className="p-5 bg-gray-50 border-b border-gray-200 shrink-0">
                            <div className="flex gap-4 items-end mb-4">
                                <div className="flex-grow">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom du Trait</label>
                                    <input 
                                        className="w-full border border-gray-300 rounded px-3 py-2 font-bold text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none placeholder-gray-400"
                                        value={editorName}
                                        onChange={(e) => setEditorName(e.target.value)}
                                        placeholder="Ex: Chance, Ennemi..."
                                        autoFocus
                                    />
                                </div>
                                <div className="w-20">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valeur</label>
                                    <input 
                                        className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-900 bg-white"
                                        value={editorValue}
                                        onChange={(e) => setEditorValue(e.target.value)}
                                        placeholder="Ex: 3"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={clearTraitFromEditor}
                                    className="text-gray-500 text-xs hover:text-red-600 px-3 py-1.5 flex items-center gap-1 hover:bg-red-50 rounded transition-colors border border-transparent hover:border-red-200"
                                >
                                    <Trash2 size={14} /> Vider le champ
                                </button>
                            </div>
                        </div>

                        {/* Library Section */}
                        <div className="flex-grow flex flex-col min-h-0 border-t border-gray-200">
                            <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center justify-between text-blue-800 text-sm font-bold shrink-0">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={16} />
                                    Bibliothèque
                                </div>
                                <button 
                                    onClick={() => {
                                        const target = editingSlot.type;
                                        setEditingSlot(null);
                                        setMultiSelectTarget(target);
                                    }}
                                    className="text-xs bg-white border border-blue-200 hover:bg-blue-100 px-2 py-1 rounded text-blue-700 flex items-center gap-1 shadow-sm transition-colors"
                                >
                                    <CheckSquare size={12} /> Sélection multiple
                                </button>
                            </div>
                            <div className="flex-grow overflow-hidden relative">
                                <TraitLibrary 
                                    data={data} 
                                    onUpdate={onChange} 
                                    onSelect={handleLibrarySelectInEditor}
                                    isEditable={false}
                                    defaultFilter={editingSlot.type === 'vertus' ? 'vertu' : 'defaut'} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-between items-center shrink-0">
                        <button 
                            onClick={() => setEditingSlot(null)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Annuler
                        </button>
                        <button 
                            onClick={saveTraitFromEditor}
                            className={`px-6 py-2 text-white rounded-lg font-bold shadow-md flex items-center gap-2 transition-transform hover:scale-105 ${
                                editingSlot.type === 'vertus' ? 'bg-green-700 hover:bg-green-800' : 'bg-red-700 hover:bg-red-800'
                            }`}
                        >
                            <Check size={18} />
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- MULTI-SELECT LIBRARY MODAL --- */}
        {multiSelectTarget && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden">
                    <div className={`p-4 border-b flex justify-between items-center text-white ${multiSelectTarget === 'vertus' ? 'bg-green-700' : 'bg-red-700'}`}>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <BookOpen size={20} />
                            Ajouter des {multiSelectTarget === 'vertus' ? 'Vertus' : 'Défauts'}
                        </h3>
                        <button onClick={() => setMultiSelectTarget(null)} className="hover:bg-white/20 p-1 rounded transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="flex-grow overflow-hidden relative">
                        <TraitLibrary 
                            data={data} 
                            onUpdate={onChange} 
                            isEditable={false}
                            defaultFilter={multiSelectTarget === 'vertus' ? 'vertu' : 'defaut'}
                            onMultiSelect={handleMultiAdd}
                        />
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default CharacterSheetPage2;
