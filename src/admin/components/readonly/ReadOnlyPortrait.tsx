import React from 'react';
import { SyncedCharacter } from '../../../services/CharacterSyncService';

interface ReadOnlyPortraitProps {
    imageId?: string;
    legacyImage?: string;
}

export const ReadOnlyPortrait: React.FC<ReadOnlyPortraitProps> = ({ imageId, legacyImage }) => {
    const [imageUrl, setImageUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        const load = async () => {
            if (imageId && imageId.startsWith('img_')) {
                try {
                    const { getImage } = await import('../../../imageDB');
                    const blob = await getImage(imageId);
                    if (blob) {
                        setImageUrl(URL.createObjectURL(blob));
                    }
                } catch (e) {
                    console.error("Failed to load portrait", e);
                }
            } else if (legacyImage) {
                setImageUrl(legacyImage);
            }
        };
        load();
    }, [imageId, legacyImage]);

    if (!imageUrl) return null;

    return (
        <div className="md:w-1/3 flex flex-col gap-4 shrink-0">
            <div className="aspect-[3/4] rounded-sm overflow-hidden border border-stone-800 shadow-2xl relative group">
                <img
                    src={imageUrl}
                    alt="Portrait"
                    className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-60 pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-center">
                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] drop-shadow-md">Silhouette Capturée</div>
                </div>
            </div>
        </div>
    );
};
