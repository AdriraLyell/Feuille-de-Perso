
import { getImage, saveImage, blobToBase64, base64ToBlob } from '../imageDB';
import { ImageCompressionService, GZIP_MARKER } from './ImageCompressionService';

/**
 * ImageSyncResolver
 * 
 * Orchestrates the conversion between local IndexedDB image references (imageId)
 * and compressed data strings used for cloud synchronization.
 */
export const ImageSyncResolver = {

    /**
     * Finds all imageId references in the data and replaces them with compressed WebP+GZIP strings.
     * This makes the character data "portable" for cloud sync.
     */
    async resolveImagesForSync(data: any): Promise<any> {
        if (!data || typeof data !== 'object' || data === null) return data;

        if (Array.isArray(data)) {
            return Promise.all(data.map(item => this.resolveImagesForSync(item)));
        }

        const processed: any = {};
        for (const [key, value] of Object.entries(data)) {
            // Case 1: Portrait Image ID
            if (key === 'characterImageId' && typeof value === 'string' && value.startsWith('img_')) {
                try {
                    const blob = await getImage(value);
                    if (blob) {
                        const base64 = await blobToBase64(blob);
                        const result = await ImageCompressionService.compressFull(base64);
                        processed[key] = result.compressed;
                        // Clear legacy carrier image if it exists in the same object
                        if (data.characterImage !== undefined) processed.characterImage = '';
                    } else {
                        processed[key] = value;
                    }
                } catch (e) {
                    console.error("[ImageSyncResolver] Failed to resolve portrait image:", e);
                    processed[key] = value;
                }
            }
            // Case 2: Grimoire Image Node (Tiptap bookImage)
            else if (key === 'type' && value === 'bookImage' && (data as any).attrs?.imageId) {
                try {
                    const imageId = (data as any).attrs.imageId;
                    if (typeof imageId === 'string' && imageId.startsWith('img_')) {
                        const blob = await getImage(imageId);
                        if (blob) {
                            const base64 = await blobToBase64(blob);
                            const result = await ImageCompressionService.compressFull(base64);

                            processed.type = 'bookImage';
                            processed.attrs = {
                                ...(data as any).attrs,
                                imageId: result.compressed // Replace ID with compressed data for sync
                            };

                            // Copy any other node properties (content, marks, etc)
                            for (const k of Object.keys(data)) {
                                if (k !== 'type' && k !== 'attrs') processed[k] = (data as any)[k];
                            }
                            return processed;
                        }
                    }
                } catch (e) {
                    console.error("[ImageSyncResolver] Failed to resolve book image:", e);
                }
                processed[key] = value;
            }
            // Case 3: Generic Base64 Image (any other field)
            else if (typeof value === 'string' && value.startsWith('data:image/')) {
                try {
                    const result = await ImageCompressionService.compressFull(value);
                    processed[key] = result.compressed;
                } catch (e) {
                    processed[key] = value;
                }
            }
            // Standard recursion
            else if (typeof value === 'object' && value !== null) {
                processed[key] = await this.resolveImagesForSync(value);
            } else {
                processed[key] = value;
            }
        }
        return processed;
    },

    /**
     * Finds all compressed image strings (GZIP:...) in the data, saves them to IndexedDB,
     * and replaces them with local imageIds.
     */
    async injectImagesAfterSync(data: any): Promise<any> {
        if (!data || typeof data !== 'object' || data === null) return data;

        if (Array.isArray(data)) {
            return Promise.all(data.map(item => this.injectImagesAfterSync(item)));
        }

        const processed: any = {};
        for (const [key, value] of Object.entries(data)) {
            // Case 1: Portrait (compressed string in characterImageId field)
            if (key === 'characterImageId' && typeof value === 'string' && value.startsWith(GZIP_MARKER)) {
                try {
                    const blob = await base64ToBlob(value);
                    const newId = await saveImage(blob);
                    processed[key] = newId;
                } catch (e) {
                    console.error("[ImageSyncResolver] Failed to inject portrait image:", e);
                    processed[key] = '';
                }
            }
            // Case 2: Grimoire Image Node (compressed string in imageId attr)
            else if (key === 'type' && value === 'bookImage' && (data as any)?.attrs?.imageId?.startsWith?.(GZIP_MARKER)) {
                try {
                    const compressed = (data as any).attrs.imageId;
                    const blob = await base64ToBlob(compressed);
                    const newId = await saveImage(blob);

                    processed.type = 'bookImage';
                    processed.attrs = {
                        ...(data as any).attrs,
                        imageId: newId // Replace compressed data with local ID
                    };

                    for (const k of Object.keys(data)) {
                        if (k !== 'type' && k !== 'attrs') processed[k] = (data as any)[k];
                    }
                    return processed;
                } catch (e) {
                    console.error("[ImageSyncResolver] Failed to inject book image:", e);
                }
                processed[key] = value;
            }
            // Case 3: Generic Compressed Image
            else if (typeof value === 'string' && value.startsWith(GZIP_MARKER)) {
                try {
                    processed[key] = ImageCompressionService.decompressFull(value);
                } catch (e) {
                    processed[key] = value;
                }
            }
            // Standard recursion
            else if (typeof value === 'object' && value !== null) {
                processed[key] = await this.injectImagesAfterSync(value);
            } else {
                processed[key] = value;
            }
        }
        return processed;
    }
};
