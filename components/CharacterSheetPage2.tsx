
import React, { useRef, useState, useEffect } from 'react';
import { CharacterSheetData, ReputationEntry, TraitEntry, LibraryEntry } from '../types';
import { BookOpen, X, Edit, Trash2, Check, ArrowRight, CheckSquare, Square, Image as ImageIcon, Upload, AlertTriangle } from 'lucide-react';
import TraitLibrary from './TraitLibrary';
import { saveImage, getImage, deleteImage, base64ToBlob } from '../imageDB';

const SectionHeader: React.FC<{ title: string, total?: number, totalColor?: string, onOpenLibrary?: () => void }> = ({ title, total, totalColor, onOpenLibrary }) => (
  <div className="bg-slate-200 text-slate-800 relative text-center font-bold text-xs border-y border-stone-500 uppercase py-0.5 tracking-wide mb-0.5 flex items-center justify-center min-h-[1.5rem] shrink-0 shadow-sm group">
    {total !== undefined && (
        <div className="absolute left-1 top-0 bottom-0 flex items-center">
            <span 
                className={`w-8 flex justify-center items-center bg-white border border-stone-400 rounded-sm text-xs h-5 font-bold shadow-sm ${totalColor || 'text-stone-800'}`}
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
            <div className={`w-8 shrink-0 text-center font-bold text-xs h-full flex items-center justify-center border-r border-stone-300 ${
                isEmpty ? 'text-stone-300' : 'text-stone-800 font-handwriting bg-white'
            }`} style={{ fontSize: '0.9rem' }}>
                {item.value || (isEmpty ? '-' : '')}
            </div>
            
            <div className={`flex-grow h-full flex items-center px-1 font-handwriting min-w-0 ${
                isEmpty ? 'text-stone-300 italic text-[10px]' : 'text-ink'
            }`} style={{ fontSize: isEmpty ? '0.7rem' : '0.9rem' }}>
                <span className="truncate w-full block" title={!isEmpty ? item.name : undefined}>
                    {item.name || "Vide"}
                </span>
            </div>

            <div className="opacity-0 group-hover:opacity-100 text-stone-400 scale-75 transition-opacity shrink-0">
                <Edit size={14} />
            </div>
        </div>
    );
};

const NotebookInput: React.FC<{ value: string, onChange: (v: string) => void, placeholder?: string }> = ({ value, onChange, placeholder }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const maskRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (textareaRef.current && maskRef.current) {
            maskRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const lineHeight = '22px'; 
    const fontSize = '0.95rem'; 
    const paddingTop = '2px'; 
    const paddingX = '4px';

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
        <div className="relative w-full h-full overflow-hidden rounded-sm bg-white/50 group/notebook">
            <div 
                ref={maskRef}
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-10 text-transparent"
                style={{
                    ...typoStyles,
                    backgroundImage: `linear-gradient(transparent 21px, #d1d5db 21px)`,
                    backgroundSize: `100% ${lineHeight}`,
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

            <textarea 
              ref={textareaRef}
              className="relative z-20 w-full h-full bg-transparent resize-none focus:outline-none text-ink transition-colors focus:bg-blue-50/10"
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

const CharacterImageWidget: React.FC<{ 
    imageId: string | undefined,
    legacyImage: string | undefined,
    onImageUpdate: (id: string) => void,
    onAddLog: (msg: string, type: 'success' | 'danger') => void
}> = ({ imageId, legacyImage, onImageUpdate, onAddLog }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let active = true;
        const load = async () => {
            if (imageId) {
                try {
                    const blob = await getImage(imageId);
                    if (blob && active) {
                        const url = URL.createObjectURL(blob);
                        setImageUrl(url);
                        return () => URL.revokeObjectURL(url);
                    }
                } catch (e) {
                    console.error("Failed to load image from DB", e);
                }
            } else if (legacyImage && legacyImage.length > 100) {
                if (active) setLoading(true);
                try {
                    const blob = await base64ToBlob(legacyImage);
                    const newId = await saveImage(blob);
                    if (active) {
                        onImageUpdate(newId);
                        onAddLog("Migration automatique de l'image.", 'success');
                    }
                } catch (e) {
                    console.error("Migration failed", e);
                    if (active) setImageUrl(legacyImage);
                } finally {
                    if (active) setLoading(false);
                }
            } else {
                setImageUrl(null);
            }
        };
        load();
        return () => { active = false; };
    }, [imageId, legacyImage, onImageUpdate]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const newId = await saveImage(file);
            onImageUpdate(newId);
            onAddLog("Image enregistrée.", 'success');
        } catch (error) {
            onAddLog("Erreur de sauvegarde.", 'danger');
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const confirmRemove = async () => {
        if (imageId) await deleteImage(imageId);
        onImageUpdate('');
        onAddLog("Image supprimée.", 'danger');
        setShowDeleteConfirm(false);
    };

    return (
        <>
            <div 
                className="w-full h-full flex flex-col items-center justify-center relative group cursor-pointer bg-stone-50/30 overflow-hidden"
                onClick={() => !imageUrl && !loading && fileInputRef.current?.click()}
            >
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                {imageUrl ? (
                    <div className="w-full h-full p-4 flex items-center justify-center">
                        <div className="w-full h-full border-4 border-white shadow-md bg-stone-200 flex items-center justify-center overflow-hidden relative ring-1 ring-stone-300 rounded-sm">
                            <img src={imageUrl} alt="Character" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                                <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="bg-white/90 p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors shadow-lg"><Upload size={20} /></button>
                                <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="bg-white/90 p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors shadow-lg"><Trash2 size={20} /></button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full p-4 flex items-center justify-center">
                        <div className={`w-full h-full border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 bg-white/50 hover:bg-white hover:border-blue-400 hover:text-blue-500 transition-all rounded-lg ${loading ? 'opacity-50 cursor-wait' : ''}`}>
                            {loading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-500 mb-2"></div> : <ImageIcon size={48} className="mb-2 opacity-50" />}
                            <span className="text-xs font-bold uppercase tracking-wider text-center px-4">{loading ? "Traitement..." : "Ajouter une image"}</span>
                        </div>
                    </div>
                )}
            </div>
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in duration-200 text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} /></div>
                        <h3 className="font-bold text-lg text-stone-800">Supprimer l'image ?</h3>
                        <div className="flex gap-3 w-full mt-4">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 border border-stone-300 rounded-lg font-bold text-stone-600 hover:bg-stone-50">Annuler</button>
                            <button onClick={confirmRemove} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md">Supprimer</button>
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
  const [editingSlot, setEditingSlot] = useState<{ type: 'avantages' | 'desavantages', index: number } | null>(null);
  const [multiSelectTarget, setMultiSelectTarget] = useState<'avantages' | 'desavantages' | null>(null);
  const [focusNewReputation, setFocusNewReputation] = useState<number | null>(null);
  const [editorName, setEditorName] = useState('');
  const [editorValue, setEditorValue] = useState('');

  useEffect(() => {
      if (editingSlot) {
          const item = data.page2[editingSlot.type][editingSlot.index];
          setEditorName(item.name);
          setEditorValue(item.value);
      }
  }, [editingSlot, data.page2]);

  useEffect(() => {
      if (focusNewReputation !== null) {
          const element = document.getElementById(`rep-row-${focusNewReputation}-rep`);
          if (element) { element.focus(); setFocusNewReputation(null); }
      }
  }, [focusNewReputation, data.page2.reputation]);

  const updateStringField = (field: keyof CharacterSheetData['page2'], value: string) => {
      onChange({ ...data, page2: { ...data.page2, [field]: value } });
      onAddLog(`Modification ${field}`, 'info', 'sheet', `${field}`);
  };

  const updateCharacterImageId = (id: string) => {
      onChange({ ...data, page2: { ...data.page2, characterImageId: id, characterImage: '' } });
  };

  const saveTraitFromEditor = () => {
      if (!editingSlot) return;
      const newList = [...data.page2[editingSlot.type]];
      newList[editingSlot.index] = { name: editorName, value: editorValue };
      onChange({ ...data, page2: { ...data.page2, [editingSlot.type]: newList } });
      onAddLog(`Modification ${editingSlot.type === 'avantages' ? 'Avantage' : 'Désavantage'}`, 'info', 'sheet');
      setEditingSlot(null);
  };

  const handleMultiAdd = (entries: LibraryEntry[]) => {
      if (!multiSelectTarget) return;
      const currentList = [...data.page2[multiSelectTarget]];
      let addedCount = 0;
      let listIndex = 0;
      entries.forEach(entry => {
          while (listIndex < currentList.length && currentList[listIndex].name.trim() !== '') { listIndex++; }
          if (listIndex < currentList.length) {
              currentList[listIndex] = { name: entry.name, value: entry.cost };
              addedCount++;
          }
      });
      if (addedCount > 0) {
          onChange({ ...data, page2: { ...data.page2, [multiSelectTarget]: currentList } });
          onAddLog(`Ajout de ${addedCount} traits.`, 'success', 'sheet');
      }
      setMultiSelectTarget(null);
  };

  const updateReputationEntry = (index: number, key: keyof ReputationEntry, value: string) => {
    const newList = [...data.page2.reputation];
    newList[index] = { ...newList[index], [key]: value };
    onChange({ ...data, page2: { ...data.page2, reputation: newList } });
    onAddLog(`Modification Réputation`, 'info', 'sheet', `reputation_${index}_${key}`);
  };

  const handleReputationKeyDown = (e: React.KeyboardEvent, index: number, field: 'reputation' | 'lieu' | 'valeur') => {
      if (e.key === 'Enter') {
          e.preventDefault();
          if (field === 'reputation') document.getElementById(`rep-row-${index}-lieu`)?.focus();
          else if (field === 'lieu') document.getElementById(`rep-row-${index}-val`)?.focus();
          else if (field === 'valeur' && index < data.page2.reputation.length - 1) document.getElementById(`rep-row-${index + 1}-rep`)?.focus();
      }
  };

  const calculateTotal = (list: TraitEntry[]) => list.reduce((acc, item) => acc + (parseInt(item.value) || 0), 0);

  const AvantagesColumn = (
     <div className="col-span-1 border-r border-stone-400 p-1.5 flex flex-col h-full overflow-hidden">
         <SectionHeader title="Avantages" total={calculateTotal(data.page2.avantages)} totalColor="text-green-700 bg-green-50 border-green-200" onOpenLibrary={() => setMultiSelectTarget('avantages')} />
         <div className="space-y-0.5 flex-grow overflow-auto min-h-0 custom-scrollbar">{data.page2.avantages.map((item, i) => (<TraitRow key={i} item={item} onClick={() => setEditingSlot({ type: 'avantages', index: i })} />))}</div>
     </div>
  );

  const DesavantagesColumn = (
     <div className="col-span-1 p-1.5 flex flex-col h-full overflow-hidden">
         <SectionHeader title="Désavantages" total={calculateTotal(data.page2.desavantages)} totalColor="text-red-700 bg-red-50 border-red-200" onOpenLibrary={() => setMultiSelectTarget('desavantages')} />
         <div className="space-y-0.5 flex-grow overflow-auto min-h-0 custom-scrollbar">{data.page2.desavantages.map((item, i) => (<TraitRow key={i} item={item} onClick={() => setEditingSlot({ type: 'desavantages', index: i })} />))}</div>
     </div>
  );

  const ReputationHeader = () => (
      <div className="bg-slate-200 text-slate-800 text-xs border-y border-stone-500 uppercase py-0.5 tracking-wide mb-0.5 flex items-center min-h-[1.5rem] shadow-sm font-bold shrink-0">
          <span className="w-1/2 text-center pl-1">Réputation</span>
          <span className="w-1/4 text-center border-l border-stone-400">Lieu</span>
          <span className="w-1/4 text-center border-l border-stone-400">Valeur</span>
      </div>
  );

  return (
    <>
        {isLandscape ? (
            <div className="sheet-container landscape flex flex-col overflow-hidden">
                <div className="grid grid-cols-4 border-b-2 border-stone-800 h-[35%] overflow-hidden">
                    <div className="border-r border-stone-400 p-0 flex flex-col h-full overflow-hidden bg-stone-50"><CharacterImageWidget imageId={data.page2.characterImageId} legacyImage={data.page2.characterImage} onImageUpdate={updateCharacterImageId} onAddLog={(msg, type) => onAddLog(msg, type, 'sheet')} /></div>
                    <div className="border-r border-stone-400 p-1.5 flex flex-col gap-2 h-full overflow-hidden">
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden"><SectionHeader title="Lieux Importants" /><div className="flex-grow relative min-h-0"><NotebookInput value={data.page2.lieux_importants} onChange={(v) => updateStringField('lieux_importants', v)} /></div></div>
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden"><SectionHeader title="Contacts" /><div className="flex-grow relative min-h-0"><NotebookInput value={data.page2.contacts} onChange={(v) => updateStringField('contacts', v)} /></div></div>
                    </div>
                    <div className="border-r border-stone-400 p-1.5 flex flex-col gap-2 h-full overflow-hidden">
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden"><SectionHeader title="Connaissances" /><div className="flex-grow relative min-h-0"><NotebookInput value={data.page2.connaissances} onChange={(v) => updateStringField('connaissances', v)} /></div></div>
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden"><ReputationHeader /><div className="flex-grow overflow-y-auto custom-scrollbar">{data.page2.reputation.map((rep, i) => (
                            <div key={i} className="flex gap-1 h-[22px] items-end shrink-0 border-b border-stone-200">
                                <input id={`rep-row-${i}-rep`} className="w-1/2 bg-transparent font-handwriting text-ink text-sm h-full px-1 focus:outline-none" value={rep.reputation} onChange={(e) => updateReputationEntry(i, 'reputation', e.target.value)} onKeyDown={(e) => handleReputationKeyDown(e, i, 'reputation')} />
                                <input id={`rep-row-${i}-lieu`} className="w-1/4 bg-transparent font-handwriting text-ink text-sm h-full border-l border-stone-200 px-1 focus:outline-none" value={rep.lieu} onChange={(e) => updateReputationEntry(i, 'lieu', e.target.value)} onKeyDown={(e) => handleReputationKeyDown(e, i, 'lieu')} />
                                <input id={`rep-row-${i}-val`} className="w-1/4 bg-transparent font-handwriting text-ink text-sm h-full border-l border-stone-200 px-1 focus:outline-none" value={rep.valeur} onChange={(e) => updateReputationEntry(i, 'valeur', e.target.value)} onKeyDown={(e) => handleReputationKeyDown(e, i, 'valeur')} />
                            </div>))}</div>
                        </div>
                    </div>
                    <div className="p-1.5 flex flex-col gap-2 h-full overflow-hidden">
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden"><SectionHeader title="Valeurs Monétaires" /><div className="flex-grow relative min-h-0"><NotebookInput value={data.page2.valeurs_monetaires} onChange={(v) => updateStringField('valeurs_monetaires', v)} /></div></div>
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden"><SectionHeader title="Armes" /><div className="flex-grow relative min-h-0"><NotebookInput value={data.page2.armes_list} onChange={(v) => updateStringField('armes_list', v)} /></div></div>
                    </div>
                </div>
                <div className="grid grid-cols-4 h-[65%] overflow-hidden">
                    {AvantagesColumn}
                    <div className="border-l border-stone-400 -ml-[1px] h-full overflow-hidden">{DesavantagesColumn}</div>
                    <div className="col-span-1 border-r border-l border-stone-400 p-1.5 flex flex-col h-full overflow-hidden"><SectionHeader title="Equipement" /><div className="flex-grow min-h-0"><NotebookInput value={data.page2.equipement} onChange={(v) => updateStringField('equipement', v)} /></div></div>
                    <div className="col-span-1 p-1.5 flex flex-col h-full overflow-hidden"><SectionHeader title="Notes" /><div className="flex-grow min-h-0"><NotebookInput value={data.page2.notes} onChange={(v) => updateStringField('notes', v)} /></div></div>
                </div>
            </div>
        ) : (
            <div className="sheet-container flex flex-col">
            <div className="flex border-b border-stone-400 h-[400px] shrink-0 overflow-hidden">
                <div className="w-[35%] border-r border-stone-400 bg-stone-50 p-0 flex flex-col overflow-hidden"><CharacterImageWidget imageId={data.page2.characterImageId} legacyImage={data.page2.characterImage} onImageUpdate={updateCharacterImageId} onAddLog={(msg, type) => onAddLog(msg, type, 'sheet')} /></div>
                <div className="w-[65%] flex flex-col overflow-hidden">
                    <div className="h-1/3 flex border-b border-stone-400">
                        <div className="w-1/2 border-r border-stone-400 p-1 flex flex-col"><SectionHeader title="Lieux Importants" /><div className="flex-grow relative min-h-0 overflow-hidden"><NotebookInput value={data.page2.lieux_importants} onChange={(v) => updateStringField('lieux_importants', v)} /></div></div>
                        <div className="w-1/2 p-1 flex flex-col"><SectionHeader title="Contacts" /><div className="flex-grow relative min-h-0 overflow-hidden"><NotebookInput value={data.page2.contacts} onChange={(v) => updateStringField('contacts', v)} /></div></div>
                    </div>
                    <div className="h-1/3 flex border-b border-stone-400">
                        <div className="w-1/2 border-r border-stone-400 p-1 flex flex-col"><SectionHeader title="Connaissances" /><div className="flex-grow relative min-h-0 overflow-hidden"><NotebookInput value={data.page2.connaissances} onChange={(v) => updateStringField('connaissances', v)} /></div></div>
                        <div className="w-1/2 p-1 flex flex-col overflow-hidden"><ReputationHeader /><div className="flex-grow overflow-y-auto custom-scrollbar">{data.page2.reputation.map((rep, i) => (
                            <div key={i} className="flex gap-1 h-[22px] items-end border-b border-stone-200">
                                <input id={`rep-row-${i}-rep`} className="w-1/2 bg-transparent font-handwriting text-ink text-sm h-full px-1 focus:outline-none" value={rep.reputation} onChange={(e) => updateReputationEntry(i, 'reputation', e.target.value)} onKeyDown={(e) => handleReputationKeyDown(e, i, 'reputation')} />
                                <input id={`rep-row-${i}-lieu`} className="w-1/4 bg-transparent font-handwriting text-ink text-sm h-full border-l border-stone-200 px-1 focus:outline-none" value={rep.lieu} onChange={(e) => updateReputationEntry(i, 'lieu', e.target.value)} onKeyDown={(e) => handleReputationKeyDown(e, i, 'lieu')} />
                                <input id={`rep-row-${i}-val`} className="w-1/4 bg-transparent font-handwriting text-ink text-sm h-full border-l border-stone-200 px-1 focus:outline-none" value={rep.valeur} onChange={(e) => updateReputationEntry(i, 'valeur', e.target.value)} onKeyDown={(e) => handleReputationKeyDown(e, i, 'valeur')} />
                            </div>))}</div>
                        </div>
                    </div>
                    <div className="h-1/3 flex">
                        <div className="w-1/2 border-r border-stone-400 p-1 flex flex-col"><SectionHeader title="Valeurs Monétaires" /><div className="flex-grow relative min-h-0 overflow-hidden"><NotebookInput value={data.page2.valeurs_monetaires} onChange={(v) => updateStringField('valeurs_monetaires', v)} /></div></div>
                        <div className="w-1/2 p-1 flex flex-col"><SectionHeader title="Armes" /><div className="flex-grow relative min-h-0 overflow-hidden"><NotebookInput value={data.page2.armes_list} onChange={(v) => updateStringField('armes_list', v)} /></div></div>
                    </div>
                </div>
            </div>
            <div className="flex h-[720px] overflow-hidden shrink-0 border-b border-stone-400">
                <div className="w-[67.5%] border-r border-stone-400 flex flex-col"><SectionHeader title="Traits - Signes Particuliers" /><div className="grid grid-cols-2 flex-grow overflow-hidden min-h-0">{AvantagesColumn}<div className="border-l border-stone-400 -ml-[1px] h-full overflow-hidden">{DesavantagesColumn}</div></div></div>
                <div className="w-[32.5%] flex flex-col h-full overflow-hidden"><SectionHeader title="Equipement" /><div className="p-1.5 flex-grow min-h-0"><NotebookInput value={data.page2.equipement} onChange={(v) => updateStringField('equipement', v)} /></div></div>
            </div>
            <div className="flex-grow border-t border-stone-400 p-1.5 flex flex-col shrink-0 min-h-0"><SectionHeader title="Notes" /><div className="flex-grow min-h-0 mt-1"><NotebookInput value={data.page2.notes} onChange={(v) => updateStringField('notes', v)} /></div></div>
            </div>
        )}

        {editingSlot && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl h-[85vh] flex flex-col overflow-hidden">
                    <div className={`p-4 border-b flex justify-between items-center text-white shrink-0 ${editingSlot.type === 'avantages' ? 'bg-green-700' : 'bg-red-700'}`}>
                        <h3 className="font-bold text-lg flex items-center gap-2"><Edit size={20} />Éditer {editingSlot.type === 'avantages' ? 'Avantage' : 'Désavantage'}</h3>
                        <button onClick={() => setEditingSlot(null)} className="hover:bg-white/20 p-1 rounded"><X size={24} /></button>
                    </div>
                    <div className="flex-grow flex flex-col overflow-hidden min-h-0">
                        <div className="p-5 bg-gray-50 border-b border-gray-200 shrink-0">
                            <div className="flex gap-4 items-end mb-4">
                                <div className="flex-grow"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom du Trait</label><input className="w-full border border-gray-300 rounded px-3 py-2 font-bold text-gray-900 focus:border-blue-500 outline-none" value={editorName} onChange={(e) => setEditorName(e.target.value)} autoFocus /></div>
                                <div className="w-20"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valeur</label><input className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-center focus:border-blue-500 outline-none" value={editorValue} onChange={(e) => setEditorValue(e.target.value)} /></div>
                            </div>
                            <div className="flex justify-end"><button onClick={() => { setEditorName(''); setEditorValue(''); }} className="text-gray-500 text-xs hover:text-red-600 px-3 py-1.5 flex items-center gap-1 hover:bg-red-50 rounded"><Trash2 size={14} /> Vider</button></div>
                        </div>
                        <div className="flex-grow flex flex-col min-h-0 border-t border-gray-200">
                            <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center justify-between text-blue-800 text-sm font-bold shrink-0">
                                <div className="flex items-center gap-2"><BookOpen size={16} />Bibliothèque</div>
                                <button onClick={() => { const target = editingSlot.type; setEditingSlot(null); setMultiSelectTarget(target); }} className="text-xs bg-white border border-blue-200 hover:bg-blue-100 px-2 py-1 rounded text-blue-700 flex items-center gap-1 shadow-sm"><CheckSquare size={12} /> Sélection multiple</button>
                            </div>
                            <div className="flex-grow overflow-hidden relative"><TraitLibrary data={data} onUpdate={onChange} onSelect={(e) => { setEditorName(e.name); setEditorValue(e.cost); }} isEditable={false} defaultFilter={editingSlot.type === 'avantages' ? 'avantage' : 'desavantage'} /></div>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-between items-center shrink-0">
                        <button onClick={() => setEditingSlot(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Annuler</button>
                        <button onClick={saveTraitFromEditor} className={`px-6 py-2 text-white rounded-lg font-bold shadow-md flex items-center gap-2 transition-transform hover:scale-105 ${editingSlot.type === 'avantages' ? 'bg-green-700' : 'bg-red-700'}`}><Check size={18} />Enregistrer</button>
                    </div>
                </div>
            </div>
        )}

        {multiSelectTarget && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden">
                    <div className={`p-4 border-b flex justify-between items-center text-white ${multiSelectTarget === 'avantages' ? 'bg-green-700' : 'bg-red-700'}`}>
                        <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen size={20} />Ajouter des {multiSelectTarget === 'avantages' ? 'Avantages' : 'Désavantages'}</h3>
                        <button onClick={() => setMultiSelectTarget(null)} className="hover:bg-white/20 p-1 rounded transition-colors"><X size={24} /></button>
                    </div>
                    <div className="flex-grow overflow-hidden relative"><TraitLibrary data={data} onUpdate={onChange} isEditable={false} defaultFilter={multiSelectTarget === 'avantages' ? 'avantage' : 'desavantage'} onMultiSelect={handleMultiAdd} /></div>
                </div>
            </div>
        )}
    </>
  );
};

export default CharacterSheetPage2;
