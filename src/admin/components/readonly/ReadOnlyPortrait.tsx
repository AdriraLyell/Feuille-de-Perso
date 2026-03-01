import React from 'react';
import { logger } from '../../../utils/logger';

interface ReadOnlyPortraitProps {
    imageId?: string;
    legacyImage?: string;
}

export const ReadOnlyPortrait: React.FC<ReadOnlyPortraitProps> = ({ imageId, legacyImage }) => {
    const [imageUrl, setImageUrl] = React.useState<string | null>(null);
    const [error, setError] = React.useState<boolean>(false);

    React.useEffect(() => {
        let active = true;
        const load = async () => {
            setError(false);
            if (imageId && imageId.startsWith('img_')) {
                try {
                    const { getImage } = await import('../../../services/imageDB');
                    const blob = await getImage(imageId);
                    if (blob && active) {
                        // Check for GZIP compressed data in blob because ImageSyncResolver stores them as text blobs
                        try {
                            const text = await new Response(blob).text();
                            if (text.startsWith('GZIP:')) {
                                const { ImageCompressionService } = await import('../../../services/ImageCompressionService');
                                // decompressFull returns the base64 data URI
                                const decompressed = ImageCompressionService.decompressFull(text);
                                if (active) setImageUrl(decompressed);
                            } else {
                                // Standard blob (object URL) - reuse the original blob, not the text
                                setImageUrl(URL.createObjectURL(blob));
                            }
                        } catch (err) {
                            // Fallback if text reading fails (unlikely for blob) or other error, try standard object URL
                            logger.warn("Error checking blob content, falling back to createObjectURL", err);
                            setImageUrl(URL.createObjectURL(blob));
                        }
                    } else if (active) {
                        // Image ID exists but blob not found in local DB
                        setError(true);
                        logger.warn(`ReadOnlyPortrait: Image ${imageId} not found in local DB.`);
                    }
                } catch (e) {
                    if (active) setError(true);
                    logger.error("Failed to load portrait", e);
                }
            } else if (legacyImage) {
                // Handle potential compressed legacy strings if needed, though they usually come as base64
                if (legacyImage.startsWith('GZIP:')) {
                    try {
                        const { ImageCompressionService } = await import('../../../services/ImageCompressionService');
                        const decompressed = ImageCompressionService.decompressFull(legacyImage);
                        if (active) setImageUrl(decompressed);
                    } catch (err) {
                        if (active) setError(true);
                    }
                } else {
                    setImageUrl(legacyImage);
                }
            }
        };
        load();
        return () => { active = false; };
    }, [imageId, legacyImage]);

    // Render logic:
    // 1. If we have a URL, show the image.
    // 2. If we have an error (ID found but no data), show "Broken" state.
    // 3. If no ID/URL provided, show "Placeholder" state.

    return (
        <div className="md:w-1/3 flex flex-col gap-4 shrink-0">
            <div className="aspect-[3/4] rounded-sm overflow-hidden border border-stone-800 shadow-2xl relative group bg-stone-900 flex items-center justify-center">
                {imageUrl ? (
                    <>
                        <img
                            src={imageUrl}
                            alt="Portrait"
                            onError={() => setError(true)}
                            className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-60 pointer-events-none" />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-stone-600 p-6 text-center">
                        {error ? (
                            <>
                                <div className="w-16 h-16 mb-4 rounded-full bg-red-900/20 flex items-center justify-center border border-red-900/40 text-red-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                </div>
                                <p className="text-red-800 font-bold text-xs uppercase tracking-widest">Image Manquante</p>
                                <p className="text-[10px] text-red-900/60 mt-2">Données non synchronisées</p>
                            </>
                        ) : (
                            <>
                                <div className="w-24 h-24 mb-4 rounded-full bg-stone-800/50 flex items-center justify-center border border-stone-700/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                </div>
                                <p className="font-serif italic text-stone-500">Pas de portrait</p>
                            </>
                        )}
                    </div>
                )}

                <div className="absolute bottom-4 left-4 right-4 text-center">
                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] drop-shadow-md">Silhouette Capturée</div>
                </div>
            </div>
        </div>
    );
};
