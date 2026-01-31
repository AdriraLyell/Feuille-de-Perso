
import React, { useRef, useState, useEffect } from 'react';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { saveImage, getImage, deleteImage, base64ToBlob } from '../../imageDB';

interface CharacterImageWidgetProps {
    imageId: string | undefined;
    legacyImage: string | undefined;
    onImageUpdate: (id: string) => void;
    onAddLog: (msg: string, type: 'success' | 'danger') => void;
}

const CharacterImageWidget: React.FC<CharacterImageWidgetProps> = ({ imageId, legacyImage, onImageUpdate, onAddLog }) => {
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

export default CharacterImageWidget;
