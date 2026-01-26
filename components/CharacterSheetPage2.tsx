
import React, { useRef, useState, useEffect } from 'react';
import { CharacterSheetData, ReputationEntry, TraitEntry, LibraryEntry } from '../types';
import { BookOpen, X, Edit, Trash2, Check, ArrowRight, CheckSquare, Square, Image as ImageIcon, Upload, AlertTriangle } from 'lucide-react';
import TraitLibrary from './TraitLibrary';
import { saveImage, getImage, deleteImage, base64ToBlob } from '../imageDB';

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

// --- NEW CHARACTER IMAGE WIDGET (IndexedDB Compatible) ---
const CharacterImageWidget: React.FC<{ 
    imageId: string | undefined,
    legacyImage: string | undefined, // Backwards compatibility
    onImageUpdate: (id: string) => void,
    onAddLog: (msg: string, type: 'success' | 'danger') => void
}> = ({ imageId, legacyImage, onImageUpdate, onAddLog }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    // Effect to load image from IndexedDB
    useEffect(() => {
        let active = true;
        
        const load = async () => {
            if (imageId) {
                try {
                    const blob = await getImage(imageId);
                    if (blob && active) {
                        const url = URL.createObjectURL(blob);
                        setImageUrl(url);
                        return () => URL.revokeObjectURL(url); // Cleanup previous
                    }
                } catch (e) {
                    console.error("Failed to load image from DB", e);
                }
            } else if (legacyImage && legacyImage.length > 100) {
                // MIGRATION DETECTED: We have legacy base64 but no ID.
                // Convert to Blob and save to DB immediately.
                if (active) setLoading(true);
                try {
                    const blob = await base64ToBlob(legacyImage);
                    const newId = await saveImage(blob);
                    if (active) {
                        onImageUpdate(newId); // This will clear legacyImage in parent
                        onAddLog("Migration automatique de l'image vers la base de données locale (Optimisation).", 'success');
                    }
                } catch (e) {
                    console.error("Migration failed", e);
                    // Fallback to displaying legacy image directly if migration fails
                    if (active) setImageUrl(legacyImage);
                } finally {
                    if (active) setLoading(false);
                }
            } else {
                setImageUrl(null);
            }
        };

        load();

        return () => {
            active = false;
            // Note: We can't revoke ObjectURL easily in cleanup because it's async based, 
            // but browsers handle this relatively well on navigation/refresh. 
            // Ideally we'd store the current objectURL in a ref to revoke it.
        };
    }, [imageId, legacyImage, onImageUpdate]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            // Save to IndexedDB
            const newId = await saveImage(file);
            onImageUpdate(newId);
            onAddLog("Image enregistrée dans la base de données locale.", 'success');
        } catch (error) {
            console.error(error);
            onAddLog("Erreur lors de la sauvegarde de l'image.", 'danger');
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleRemoveRequest = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const confirmRemove = async () => {
        if (imageId) {
            await deleteImage(imageId);
        }
        onImageUpdate(''); // Empty ID
        onAddLog("Image supprimée.", 'danger');
        setShowDeleteConfirm(false);
    };

    return (
        <>
            <div 
                className="w-full h-full flex flex-col items-center justify-center relative group cursor-pointer bg-stone-50/30 overflow-hidden"
                onClick={() => !imageUrl && !loading && fileInputRef.current?.click()}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                />
                
                {imageUrl ? (
                    <div className="w-full h-full p-4 flex items-center justify-center">
                        {/* Frame Effect - Centered with Padding */}
                        <div className="w-full h-full border-4 border-white shadow-md bg-stone-200 flex items-center justify-center overflow-hidden relative ring-1 ring-stone-300 rounded-sm">
                            <img src={imageUrl} alt="Character" className="w-full h-full object-contain" />
                            
                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                    className="bg-white/90 p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors shadow-lg"
                                    title="Changer l'image"
                                >
                                    <Upload size={20} />
                                </button>
                                <button 
                                    onClick={handleRemoveRequest}
                                    className="bg-white/90 p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors shadow-lg"
                                    title="Supprimer l'image"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full p-4 flex items-center justify-center">
                        <div className={`w-full h-full border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 bg-white/50 hover:bg-white hover:border-blue-400 hover:text-blue-500 transition-all rounded-lg ${loading ? 'opacity-50 cursor-wait' : ''}`}>
                            {loading ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-500 mb-2"></div>
                            ) : (
                                <ImageIcon size={48} className="mb-2 opacity-50" />
                            )}
                            <span className="text-xs font-bold uppercase tracking-wider text-center px-4">
                                {loading ? "Traitement..." : "Cliquez pour ajouter une image"}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* DELETE CONFIRM MODAL */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-stone-800">Supprimer l'image ?</h3>
                            <p className="text-stone-500 text-sm">
                                Cette action retirera l'image de la fiche de personnage.
                            </p>
                            <div className="flex gap-3 w-full mt-2">
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-2 border border-stone-300 rounded-lg font-bold text-stone-600 hover:bg-stone-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button 
                                    onClick={confirmRemove}
                                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition-colors"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
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
  const [editingSlot, setEditingSlot] = useState<{ type: 'avantages' | 'desavantages', index: number } | null>(null);
  
  // State for Multi-Select Library Modal
  const [multiSelectTarget, setMultiSelectTarget] = useState<'avantages' | 'desavantages' | null>(null);

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
    // This is now only used for potentially other lists if any. arme_list is now a string.
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

  const updateCharacterImageId = (id: string) => {
      onChange({
          ...data,
          page2: {
              ...data.page2,
              characterImageId: id,
              characterImage: '' // Clear legacy base64 if ID is set
          }
      });
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
      
      const typeLabel = editingSlot.type === 'avantages' ? 'Avantage' : 'Désavantage';
      onAddLog(`Modification ${typeLabel} (ligne ${editingSlot.index + 1})`, 'info', 'sheet');
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
  const AvantagesColumn = (
     <div className="col-span-1 border-r border-stone-400 p-1.5 flex flex-col h-full overflow-hidden">
         <SectionHeader 
            title="Avantages" 
            total={calculateTotal(data.page2.avantages)}
            totalColor="text-green-700 bg-green-50 border-green-200"
            onOpenLibrary={() => setMultiSelectTarget('avantages')}
         />
         <div className="space-y-0.5 flex-grow overflow-auto min-h-0">
             {data.page2.avantages.map((item, i) => (
                <TraitRow key={i} item={item} onClick={() => setEditingSlot({ type: 'avantages', index: i })} />
             ))}
         </div>
     </div>
  );

  const DesavantagesColumn = (
     <div className="col-span-1 border-r border-stone-400 p-1.5 flex flex-col h-full overflow-hidden">
         <SectionHeader 
            title="Désavantages" 
            total={calculateTotal(data.page2.desavantages)}
            totalColor="text-red-700 bg-red-50 border-red-200"
            onOpenLibrary={() => setMultiSelectTarget('desavantages')}
         />
         <div className="space-y-0.5 flex-grow overflow-auto min-h-0">
             {data.page2.desavantages.map((item, i) => (
                <TraitRow key={i} item={item} onClick={() => setEditingSlot({ type: 'desavantages', index: i })} />
             ))}
         </div>
     </div>
  );

  return (
    <>
        {isLandscape ? (
            <div className="sheet-container landscape flex flex-col overflow-hidden">
                {/* Top Section: Small Lists (4 Columns Grid) - Fixed 35% Height to maximize bottom section */}
                <div className="grid grid-cols-4 border-b-2 border-stone-800 h-[35%] overflow-hidden">
                    
                    {/* Top-Col 1: Image Widget (NEW Position - Top Left) */}
                    <div className="border-r border-stone-400 p-0 flex flex-col h-full overflow-hidden bg-stone-50">
                        <CharacterImageWidget 
                            imageId={data.page2.characterImageId}
                            legacyImage={data.page2.characterImage}
                            onImageUpdate={updateCharacterImageId} 
                            onAddLog={(msg, type) => onAddLog(msg, type, 'sheet')}
                        />
                    </div>

                    {/* Top-Col 2: Lieux & Contacts */}
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

                    {/* Top-Col 3: Connaissances & Réputation */}
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

                    {/* Top-Col 4: Valeurs & Armes */}
                    <div className="p-1.5 flex flex-col gap-2 h-full overflow-hidden">
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <SectionHeader title="Valeurs Monétaires" />
                            <div className="flex-grow relative min-h-0">
                                <NotebookInput value={data.page2.valeurs_monetaires} onChange={(v) => updateStringField('valeurs_monetaires', v)} />
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <SectionHeader title="Armes" />
                            <div className="flex-grow relative min-h-0">
                                <NotebookInput value={data.page2.armes_list} onChange={(v) => updateStringField('armes_list', v)} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Long Lists (4 Equal Columns) - Fixed 65% Height */}
                <div className="grid grid-cols-4 h-[65%] overflow-hidden">
                    {/* Bot-Col 1: Avantages */}
                    {AvantagesColumn}

                    {/* Bot-Col 2: Désavantages */}
                    {DesavantagesColumn}

                    {/* Bot-Col 3: Equipement */}
                    <div className="col-span-1 border-r border-stone-400 p-1.5 flex flex-col h-full overflow-hidden">
                        <SectionHeader title="Equipement" />
                        <div className="flex-grow min-h-0">
                            <NotebookInput 
                                value={data.page2.equipement} 
                                onChange={(v) => updateStringField('equipement', v)}
                            />
                        </div>
                    </div>

                    {/* Bot-Col 4: Notes */}
                    <div className="col-span-1 p-1.5 flex flex-col h-full overflow-hidden">
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
            <div className="sheet-container flex flex-col">
            
            {/* LARGE HEADER: Image Left + All Details Right (Merged 2 Rows into 1) */}
            <div className="flex border-b border-stone-400 h-[420px] overflow-hidden">
                
                {/* Left: Image (Full Height) */}
                <div className="w-[35%] border-r border-stone-400 bg-stone-50 p-0 flex flex-col overflow-hidden">
                    <CharacterImageWidget 
                        imageId={data.page2.characterImageId}
                        legacyImage={data.page2.characterImage}
                        onImageUpdate={updateCharacterImageId} 
                        onAddLog={(msg, type) => onAddLog(msg, type, 'sheet')}
                    />
                </div>

                {/* Right: Text Fields Stack (3 Rows) */}
                <div className="w-[65%] flex flex-col">
                    
                    {/* Row A: Lieux & Contacts (1/3 Height) */}
                    <div className="h-1/3 flex border-b border-stone-400">
                        <div className="w-1/2 border-r border-stone-400 p-1 flex flex-col">
                            <SectionHeader title="Lieux Importants" />
                            <div className="flex-grow relative min-h-0 overflow-hidden">
                                <NotebookInput value={data.page2.lieux_importants} onChange={(v) => updateStringField('lieux_importants', v)} />
                            </div>
                        </div>
                        <div className="w-1/2 p-1 flex flex-col">
                            <SectionHeader title="Contacts" />
                            <div className="flex-grow relative min-h-0 overflow-hidden">
                                <NotebookInput value={data.page2.contacts} onChange={(v) => updateStringField('contacts', v)} />
                            </div>
                        </div>
                    </div>

                    {/* Row B: Connaissances & Reputation (1/3 Height) */}
                    <div className="h-1/3 flex border-b border-stone-400">
                        <div className="w-1/2 border-r border-stone-400 p-1 flex flex-col">
                            <SectionHeader title="Connaissances" />
                            <div className="flex-grow relative min-h-0 overflow-hidden">
                                <NotebookInput value={data.page2.connaissances} onChange={(v) => updateStringField('connaissances', v)} />
                            </div>
                        </div>
                        <div className="w-1/2 p-1 flex flex-col overflow-hidden">
                            <SectionHeader title="Réputation" />
                            <div className="space-y-0.5 flex-grow overflow-auto mt-1">
                                {data.page2.reputation.slice(0, 5).map((rep, i) => (
                                    <div key={i} className="flex gap-1 h-[22px] items-end">
                                        <input className="border-b border-stone-300 w-1/2 bg-transparent font-handwriting text-ink text-sm h-full" value={rep.reputation} onChange={(e) => updateReputationEntry('reputation', i, 'reputation', e.target.value)} placeholder="Rep..." />
                                        <input className="border-b border-stone-300 w-1/4 bg-transparent font-handwriting text-ink text-sm h-full" value={rep.lieu} onChange={(e) => updateReputationEntry('reputation', i, 'lieu', e.target.value)} placeholder="Lieu" />
                                        <input className="border-b border-stone-300 w-1/4 bg-transparent font-handwriting text-ink text-sm h-full" value={rep.valeur} onChange={(e) => updateReputationEntry('reputation', i, 'valeur', e.target.value)} placeholder="Val" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Row C: Valeurs Monétaires & Armes (1/3 Height) */}
                    <div className="h-1/3 flex">
                        <div className="w-1/2 border-r border-stone-400 p-1 flex flex-col">
                            <SectionHeader title="Valeurs Monétaires" />
                            <div className="flex-grow relative min-h-0 overflow-hidden">
                                <NotebookInput value={data.page2.valeurs_monetaires} onChange={(v) => updateStringField('valeurs_monetaires', v)} />
                            </div>
                        </div>
                        <div className="w-1/2 p-1 flex flex-col">
                            <SectionHeader title="Armes" />
                            <div className="flex-grow relative min-h-0 overflow-hidden">
                                <NotebookInput value={data.page2.armes_list} onChange={(v) => updateStringField('armes_list', v)} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Row 3: Traits (Full Height Priority) */}
            <div className="grid grid-cols-2 border-b border-stone-400 flex-grow min-h-[500px]">
                {/* Avantages Column */}
                <div className="border-r border-stone-400 flex flex-col overflow-hidden">
                        <div className="relative text-center text-[10px] font-bold italic py-1 bg-green-50/50 border-b border-stone-300 flex items-center justify-center min-h-[1.75rem] shrink-0 group">
                        <div className="absolute left-2 top-0 bottom-0 flex items-center">
                            <span className="w-10 flex justify-center items-center bg-white border border-stone-300 rounded-sm text-xs h-5 font-bold shadow-sm text-green-700">
                                {calculateTotal(data.page2.avantages)}
                            </span>
                        </div>
                        <span className="text-stone-600 uppercase">Avantages</span>
                        <button 
                            onClick={() => setMultiSelectTarget('avantages')}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white text-stone-500 hover:text-green-600 transition-colors"
                            title="Ouvrir la bibliothèque"
                        >
                            <BookOpen size={14} />
                        </button>
                    </div>
                    <div className="p-1 space-y-0.5 overflow-auto flex-grow">
                        {data.page2.avantages.map((item, i) => (
                            <TraitRow key={i} item={item} onClick={() => setEditingSlot({ type: 'avantages', index: i })} />
                        ))}
                    </div>
                </div>
                {/* Désavantages Column */}
                <div className="flex flex-col overflow-hidden">
                        <div className="relative text-center text-[10px] font-bold italic py-1 bg-red-50/50 border-b border-stone-300 flex items-center justify-center min-h-[1.75rem] shrink-0 group">
                        <div className="absolute left-2 top-0 bottom-0 flex items-center">
                            <span className="w-10 flex justify-center items-center bg-white border border-stone-300 rounded-sm text-xs h-5 font-bold shadow-sm text-red-700">
                                {calculateTotal(data.page2.desavantages)}
                            </span>
                        </div>
                        <span className="text-stone-600 uppercase">Désavantages</span>
                        <button 
                            onClick={() => setMultiSelectTarget('desavantages')}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white text-stone-500 hover:text-red-600 transition-colors"
                            title="Ouvrir la bibliothèque"
                        >
                            <BookOpen size={14} />
                        </button>
                    </div>
                    <div className="p-1 space-y-0.5 overflow-auto flex-grow">
                        {data.page2.desavantages.map((item, i) => (
                            <TraitRow key={i} item={item} onClick={() => setEditingSlot({ type: 'desavantages', index: i })} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 4: Equipement & Notes (Reduced height, split 50/50) */}
            <div className="grid grid-cols-2 h-[200px]">
                <div className="border-r border-stone-400 flex flex-col overflow-hidden">
                    <SectionHeader title="Equipement" />
                    <div className="p-1 flex-grow overflow-hidden">
                        <NotebookInput 
                            value={data.page2.equipement} 
                            onChange={(v) => updateStringField('equipement', v)}
                        />
                    </div>
                </div>
                <div className="flex flex-col overflow-hidden">
                    <SectionHeader title="Notes" />
                    <div className="p-1 flex-grow overflow-hidden">
                        <NotebookInput 
                            value={data.page2.notes} 
                            onChange={(v) => updateStringField('notes', v)}
                            placeholder=""
                        />
                    </div>
                </div>
            </div>

            </div>
        )}

        {/* --- TRAIT EDITOR MODAL --- */}
        {editingSlot && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl h-[85vh] flex flex-col overflow-hidden">
                    
                    {/* Modal Header */}
                    <div className={`p-4 border-b flex justify-between items-center text-white shrink-0 ${editingSlot.type === 'avantages' ? 'bg-green-700' : 'bg-red-700'}`}>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Edit size={20} />
                            Éditer {editingSlot.type === 'avantages' ? 'Avantage' : 'Désavantage'} (Ligne {editingSlot.index + 1})
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
                                    defaultFilter={editingSlot.type === 'avantages' ? 'avantage' : 'desavantage'} 
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
                                editingSlot.type === 'avantages' ? 'bg-green-700 hover:bg-green-800' : 'bg-red-700 hover:bg-red-800'
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
                    <div className={`p-4 border-b flex justify-between items-center text-white ${multiSelectTarget === 'avantages' ? 'bg-green-700' : 'bg-red-700'}`}>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <BookOpen size={20} />
                            Ajouter des {multiSelectTarget === 'avantages' ? 'Avantages' : 'Désavantages'}
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
                            defaultFilter={multiSelectTarget === 'avantages' ? 'avantage' : 'desavantage'}
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
