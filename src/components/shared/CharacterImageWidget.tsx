
import React, { useRef, useState, useEffect } from 'react';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { saveImage, getImage, deleteImage, base64ToBlob } from '../../imageDB';
import ConfirmationModal from '../ui/ConfirmationModal';
import { ImageCompressionService, GZIP_MARKER } from '../../services/ImageCompressionService';
import { ErrorService } from '../../services/ErrorService';

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

    // Track the current blob URL in a ref so we can safely revoke the *previous* one
    // when a new one is created, rather than revoking in cleanup (which runs before paint).
    const currentBlobRef = useRef<string | null>(null);

    useEffect(() => {
        let active = true;

        const load = async () => {
            if (active) setLoading(true);

            try {
                if (imageId) {
                    const blob = await getImage(imageId);
                    if (blob && active) {
                        const newUrl = URL.createObjectURL(blob);
                        // Revoke previous blob URL only AFTER creating the new one
                        if (currentBlobRef.current) {
                            URL.revokeObjectURL(currentBlobRef.current);
                        }
                        currentBlobRef.current = newUrl;
                        setImageUrl(newUrl);
                    } else if (!blob && active) {
                        setImageUrl(null);
                    }
                } else if (legacyImage && legacyImage.length > 100) {
                    // If legacy image is gzipped, decompress for migration
                    const toMigrate = legacyImage.startsWith(GZIP_MARKER)
                        ? ImageCompressionService.decompressFull(legacyImage)
                        : legacyImage;

                    const blob = await base64ToBlob(toMigrate);
                    const newId = await saveImage(blob);

                    if (active) {
                        onImageUpdate(newId);
                        onAddLog("Migration automatique de l'image.", 'success');
                    }
                } else {
                    if (active) setImageUrl(null);
                }
            } catch (e) {
                ErrorService.handleError(e, { context: 'CharacterImageWidget.load', silent: true });
                if (active) {
                    // Fallback to legacy if it's a direct base64
                    if (legacyImage && !legacyImage.startsWith(GZIP_MARKER)) {
                        setImageUrl(legacyImage);
                    } else {
                        setImageUrl(null);
                    }
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        load();

        return () => {
            active = false;
            // Do NOT revoke here — the image is still being displayed.
            // It will be revoked on the next successful load or on unmount below.
        };
    }, [imageId, legacyImage, onImageUpdate, onAddLog]);

    // Revoke the blob URL only when the component truly unmounts
    useEffect(() => {
        return () => {
            if (currentBlobRef.current) {
                URL.revokeObjectURL(currentBlobRef.current);
                currentBlobRef.current = null;
            }
        };
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const newId = await saveImage(file);
            onImageUpdate(newId);
            onAddLog("Image enregistrée.", 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur de sauvegarde.";
            onAddLog(message, 'danger');
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
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmRemove}
                title="Supprimer l'image ?"
                message="Cette action est irréversible."
                confirmLabel="Supprimer"
                type="danger"
            />
        </>
    );
};

export default CharacterImageWidget;
