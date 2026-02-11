import { useState, useRef, useCallback } from 'react';
import { CharacterSheetData, ImageConfig, NoteImage } from '../types';
import { saveImage, deleteImage } from '../imageDB';
import { ErrorService } from '../services/ErrorService';

export const useJournalImages = (
    data: CharacterSheetData,
    onChange: (newData: CharacterSheetData) => void,
    onAddLog: (msg: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both') => void
) => {
    const [isDrawingImage, setIsDrawingImage] = useState(false);
    const [pendingImageConfig, setPendingImageConfig] = useState<ImageConfig | null>(null);
    const [pendingImageNoteId, setPendingImageNoteId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleDrawMode = useCallback(() => {
        setIsDrawingImage(prev => !prev);
        if (!isDrawingImage) {
            onAddLog("Mode dessin : Tracez un rectangle sur la page pour insérer une image.", 'info', 'sheet');
        }
    }, [isDrawingImage, onAddLog]);

    const handleDrawComplete = useCallback((rect: { x: number, y: number, w: number, h: number, containerWidth: number }, noteId: string) => {
        setIsDrawingImage(false);
        setPendingImageNoteId(noteId);

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
            mode: 'absolute',
            fit: 'cover'
        });

        fileInputRef.current?.click();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !pendingImageNoteId || !pendingImageConfig) return;

        try {
            const blobId = await saveImage(file);

            const newImage: NoteImage = {
                id: Math.random().toString(36).substr(2, 9),
                imageId: blobId,
                config: pendingImageConfig
            };

            const targetNote = (data.campaignNotes || []).find(n => n.id === pendingImageNoteId);
            if (!targetNote) return;

            const newImages = [...(targetNote.images || []), newImage];

            const newNotes = (data.campaignNotes || []).map(n =>
                n.id === pendingImageNoteId ? { ...n, images: newImages } : n
            );
            onChange({ ...data, campaignNotes: newNotes });

            onAddLog("Image ajoutée à la zone dessinée", 'success', 'sheet');
        } catch (err) {
            ErrorService.handleError(err, { context: 'CampaignNotes.handleImageUpload', userMessage: "Erreur lors de l'ajout de l'image." });
            onAddLog("Erreur lors de l'ajout de l'image", 'danger');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
            setPendingImageConfig(null);
            setPendingImageNoteId(null);
        }
    };

    const handleUpdateImageConfig = useCallback((noteId: string, uniqueId: string, newConfig: ImageConfig) => {
        const targetNote = (data.campaignNotes || []).find(n => n.id === noteId);
        if (!targetNote) return;

        const newImages = (targetNote.images || []).map(img =>
            img.id === uniqueId ? { ...img, config: newConfig } : img
        );

        const newNotes = (data.campaignNotes || []).map(n => n.id === noteId ? { ...n, images: newImages } : n);
        onChange({ ...data, campaignNotes: newNotes });
    }, [data, onChange]);

    const handleRemoveImage = useCallback(async (noteId: string, uniqueId: string) => {
        const targetNote = (data.campaignNotes || []).find(n => n.id === noteId);
        if (!targetNote) return;

        const imageToRemove = (targetNote.images || []).find(img => img.id === uniqueId);
        if (!imageToRemove) return;

        try {
            await deleteImage(imageToRemove.imageId);
            const newImages = (targetNote.images || []).filter(img => img.id !== uniqueId);
            const newNotes = (data.campaignNotes || []).map(n => n.id === noteId ? { ...n, images: newImages } : n);
            onChange({ ...data, campaignNotes: newNotes });

            onAddLog("Image retirée de la note", 'info', 'sheet');
        } catch (err) {
            ErrorService.handleError(err, { context: 'CampaignNotes.handleRemoveImage', silent: true });
        }
    }, [data, onChange, onAddLog]);

    return {
        isDrawingImage,
        toggleDrawMode,
        handleDrawComplete,
        handleImageUpload,
        handleUpdateImageConfig,
        handleRemoveImage,
        fileInputRef
    };
};
