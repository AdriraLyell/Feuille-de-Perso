
import React, { useRef, useState, useEffect } from 'react';
import { CharacterSheetData, CampaignNoteEntry, ImageConfig, NoteImage } from '../types';
import { Book, Plus, Trash2, ChevronLeft, ChevronRight, Bookmark, Users, PenTool, Image as ImageIcon } from 'lucide-react';
import { saveImage, deleteImage } from '../imageDB';
import { useCharacter } from '../context/CharacterContext';
import NoteImageZone from './campaign/NoteImageZone';
import NotebookTextarea from './campaign/NotebookTextarea';
import PartyTable from './campaign/PartyTable';

interface Props {
    isLandscape?: boolean;
}

const CampaignNotes: React.FC<Props> = ({ isLandscape = false }) => {
    const { data, updateData: onChange, addLog: onAddLog } = useCharacter();
    const [activeTab, setActiveTab] = useState<'journal' | 'party'>('journal');
    const [isDrawingImage, setIsDrawingImage] = useState(false);
    const [pendingImageConfig, setPendingImageConfig] = useState<ImageConfig | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- JOURNAL STATES ---
    const [currentIndex, setCurrentIndex] = useState(() => {
        return data.campaignNotes && data.campaignNotes.length > 0 ? data.campaignNotes.length - 1 : 0;
    });
    const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
    const totalPages = data.campaignNotes?.length || 0;
    const currentNote = totalPages > 0 && data.campaignNotes ? data.campaignNotes[currentIndex] : null;

    // --- EFFECTS ---
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
            content: '',
            images: [] // Initialize images array
        };

        const newNotes = [...(data.campaignNotes || []), newNote];
        onChange({
            ...data,
            campaignNotes: newNotes
        });

        setCurrentIndex(newNotes.length - 1);
        setActiveTab('journal');
        onAddLog("Nouvelle page ajoutée au journal", 'success', 'sheet');
    };

    const updateNote = (id: string, field: keyof CampaignNoteEntry, value: any) => {
        const newNotes = (data.campaignNotes || []).map(n => n.id === id ? { ...n, [field]: value } : n);
        onChange({ ...data, campaignNotes: newNotes });
    };

    const confirmDeleteNote = () => {
        if (noteIdToDelete) {
            const noteToDelete = (data.campaignNotes || []).find(n => n.id === noteIdToDelete);

            // Clean up all images associated with this note
            if (noteToDelete?.images) {
                noteToDelete.images.forEach(img => {
                    deleteImage(img.imageId).catch(console.error);
                });
            }
            // Fallback for deprecated single image field
            if (noteToDelete?.imageId) {
                deleteImage(noteToDelete.imageId).catch(console.error);
            }

            const newNotes = (data.campaignNotes || []).filter(n => n.id !== noteIdToDelete);
            onChange({ ...data, campaignNotes: newNotes });
            onAddLog("Page du journal arrachée", 'danger', 'sheet');
            setNoteIdToDelete(null);

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

    // --- IMAGE HANDLING ---
    const toggleDrawMode = () => {
        setIsDrawingImage(!isDrawingImage);
        if (!isDrawingImage) {
            onAddLog("Mode dessin : Tracez un rectangle sur la page pour insérer une image.", 'info', 'sheet');
        }
    };

    const handleDrawComplete = (rect: { x: number, y: number, w: number, h: number, containerWidth: number }) => {
        setIsDrawingImage(false);

        // Calculate Align based on center of drawn box relative to container center
        const centerBox = rect.x + (rect.w / 2);
        const centerContainer = rect.containerWidth / 2;
        const align = centerBox < centerContainer ? 'left' : 'right';

        setPendingImageConfig({
            width: rect.w,
            height: rect.h,
            marginTop: rect.y,
            align,
            x: rect.x,
            y: rect.y,
            mode: 'absolute', // Defaulting to absolute for maximum freedom (Face to Face)
            fit: 'cover'
        });

        // Open file dialog
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentNote || !pendingImageConfig) return;

        try {
            const blobId = await saveImage(file);

            const newImage: NoteImage = {
                id: Math.random().toString(36).substr(2, 9), // Unique ID for placement
                imageId: blobId, // Blob ID
                config: pendingImageConfig
            };

            const newImages = [...(currentNote.images || []), newImage];

            const newNotes = (data.campaignNotes || []).map(n =>
                n.id === currentNote.id
                    ? { ...n, images: newImages }
                    : n
            );
            onChange({ ...data, campaignNotes: newNotes });

            onAddLog("Image ajoutée à la zone dessinée", 'success', 'sheet');
        } catch (err) {
            console.error(err);
            onAddLog("Erreur lors de l'ajout de l'image", 'danger');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
            setPendingImageConfig(null);
        }
    };

    const handleUpdateImageConfig = (uniqueId: string, newConfig: ImageConfig) => {
        if (!currentNote) return;

        const newImages = (currentNote.images || []).map(img =>
            img.id === uniqueId ? { ...img, config: newConfig } : img
        );

        updateNote(currentNote.id, 'images', newImages);
    };

    const handleRemoveImage = async (uniqueId: string) => {
        if (!currentNote) return;

        const imageToRemove = (currentNote.images || []).find(img => img.id === uniqueId);
        if (!imageToRemove) return;

        try {
            await deleteImage(imageToRemove.imageId);

            const newImages = (currentNote.images || []).filter(img => img.id !== uniqueId);
            updateNote(currentNote.id, 'images', newImages);

            onAddLog("Image retirée de la note", 'info', 'sheet');
        } catch (err) {
            console.error(err);
        }
    };

    const noteToDelete = (data.campaignNotes || []).find(n => n.id === noteIdToDelete);

    return (
        <div className={`w-full flex items-center justify-center bg-stone-900 py-8 px-4 md:px-12 relative overflow-auto transition-all duration-300 ${isLandscape ? 'min-h-[1200px]' : 'min-h-[1400px]'}`}>

            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>

            {/* --- FLEX CONTAINER: BUTTONS + BOOK --- */}
            <div className="flex items-center gap-3 shrink-0 z-10">

                <div className="w-12 flex justify-end">
                    {activeTab === 'journal' && (
                        <button
                            onClick={goToPrevious}
                            disabled={currentIndex <= 0}
                            className={`p-3 rounded-full bg-stone-800 text-stone-200 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-stone-600 hover:bg-stone-700 hover:scale-110 hover:text-white transition-all duration-300 ${currentIndex <= 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                            title="Page précédente"
                        >
                            <ChevronLeft size={28} strokeWidth={3} />
                        </button>
                    )}
                </div>

                {/* --- THE BOOK CONTAINER --- */}
                <div className={`relative bg-[#fdfbf7] shadow-2xl transition-all duration-500 flex flex-col overflow-hidden z-10 shrink-0
              ${isLandscape
                        ? 'w-[1560px] h-[1100px]'
                        : 'w-[900px] h-[1270px]'
                    } 
              rounded-r-md rounded-l-sm border-r-8 border-r-stone-200 border-l-[12px] border-l-stone-800
          `}>

                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-stone-400 opacity-20 z-20 pointer-events-none shadow-[2px_0_5px_rgba(0,0,0,0.2)]"></div>

                    {/* BOOK HEADER */}
                    <div className="shrink-0 pt-6 pb-2 px-8 md:px-12 bg-[#fdfbf7] z-20 flex items-end justify-between border-b-2 border-stone-800 relative">

                        <div className="flex items-end gap-6">
                            <button
                                onClick={() => setActiveTab('journal')}
                                className={`group flex items-center gap-2 pb-1 transition-all ${activeTab === 'journal' ? 'text-indigo-950 border-b-4 border-indigo-900' : 'text-stone-400 hover:text-stone-600'}`}
                            >
                                <Book size={28} strokeWidth={activeTab === 'journal' ? 2.5 : 2} className="transition-transform group-hover:-translate-y-1" />
                                <span className={`text-2xl font-black uppercase tracking-[0.1em] font-serif leading-none hidden sm:inline`}>Journal</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('party')}
                                className={`group flex items-center gap-2 pb-1 transition-all ${activeTab === 'party' ? 'text-indigo-950 border-b-4 border-indigo-900' : 'text-stone-400 hover:text-stone-600'}`}
                            >
                                <Users size={28} strokeWidth={activeTab === 'party' ? 2.5 : 2} className="transition-transform group-hover:-translate-y-1" />
                                <span className={`text-2xl font-black uppercase tracking-[0.1em] font-serif leading-none hidden sm:inline`}>Groupe</span>
                            </button>
                        </div>

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
                                            <div className="bg-white border border-stone-300 shadow-sm relative w-full h-full flex flex-col rounded-sm overflow-hidden flex-grow min-h-0">

                                                {/* Note Header */}
                                                <div className="bg-stone-100 border-b border-stone-200 p-3 flex items-center justify-between pl-4 shrink-0 rounded-t-sm z-20">
                                                    <div className="flex items-center gap-3 flex-grow min-w-0">
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
                                                        {/* Image Draw Button */}
                                                        <button
                                                            onClick={toggleDrawMode}
                                                            className={`p-2 rounded transition-colors flex items-center gap-1 ${isDrawingImage ? 'bg-indigo-600 text-white shadow-inner animate-pulse' : 'text-stone-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                                            title={isDrawingImage ? "Mode dessin actif - Cliquez pour annuler" : "Dessiner une zone pour l'image"}
                                                        >
                                                            <ImageIcon size={18} />
                                                            {isDrawingImage && <span className="text-xs font-bold px-1">Annuler</span>}
                                                        </button>
                                                        <input
                                                            type="file"
                                                            ref={fileInputRef}
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                        />

                                                        <button
                                                            onClick={() => setNoteIdToDelete(currentNote.id)}
                                                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Arracher cette page"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Note Content Wrapper */}
                                                <div className="flex-grow min-h-0 bg-white relative rounded-b-sm">
                                                    <NotebookTextarea
                                                        value={currentNote.content}
                                                        onChange={(v) => updateNote(currentNote.id, 'content', v)}
                                                        placeholder="Récit des événements..."
                                                        isDrawing={isDrawingImage}
                                                        onDrawComplete={handleDrawComplete}
                                                        imageNodes={
                                                            currentNote.images && currentNote.images.map((img) => (
                                                                <NoteImageZone
                                                                    key={img.id}
                                                                    uniqueId={img.id}
                                                                    imageId={img.imageId}
                                                                    config={img.config}
                                                                    onUpdateConfig={(cfg) => handleUpdateImageConfig(img.id, cfg)}
                                                                    onDelete={() => handleRemoveImage(img.id)}
                                                                />
                                                            ))
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* BOOK FOOTER */}
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

                        {activeTab === 'party' && (
                            <div className="flex-grow flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300">
                                <PartyTable data={data} onChange={onChange} onAddLog={onAddLog} />
                            </div>
                        )}

                    </div>

                </div>

                <div className="w-12 flex justify-start">
                    {activeTab === 'journal' && (
                        <button
                            onClick={goToNext}
                            disabled={currentIndex >= totalPages - 1}
                            className={`p-3 rounded-full bg-stone-800 text-stone-200 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-stone-600 hover:bg-stone-700 hover:scale-110 hover:text-white transition-all duration-300 ${currentIndex >= totalPages - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                            title="Page suivante"
                        >
                            <ChevronRight size={28} strokeWidth={3} />
                        </button>
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
