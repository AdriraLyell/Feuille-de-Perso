
import { set, get, del } from 'idb-keyval';
import { GZIP_MARKER } from './services/ImageCompressionService';

/**
 * Checks the available storage quota using the Estimation API.
 * Fallback to 40MB if API is not available.
 */
export const checkStorageQuota = async (): Promise<{ usage: number; quota: number; available: number }> => {
    if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 100 * 1024 * 1024; // Default to 100MB if quota is missing
        return {
            usage,
            quota,
            available: Math.max(0, quota - usage)
        };
    }
    // Fallback for older browsers
    return {
        usage: 0,
        quota: 40 * 1024 * 1024, // 40MB safe fallback
        available: 40 * 1024 * 1024
    };
};

export const saveImage = async (file: File | Blob): Promise<string> => {
    const { available } = await checkStorageQuota();

    if (file.size > available) {
        const sizeKo = (file.size / 1024).toFixed(0);
        const availKo = (available / 1024).toFixed(0);
        throw new Error(`Espace de stockage insuffisant. Taille: ${sizeKo} Ko, Disponible: ${availKo} Ko.`);
    }

    const id = `img_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;

    try {
        await set(id, file);
    } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            throw new Error('Le stockage local est plein. Veuillez supprimer des images existantes.');
        }
        throw error;
    }

    return id;
};

export const getImage = async (id: string): Promise<Blob | undefined> => {
    return await get(id);
};

export const deleteImage = async (id: string): Promise<void> => {
    await del(id);
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert blob to base64'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const base64ToBlob = async (base64: string): Promise<Blob> => {
    // Handle GZIP marker - save as text blob
    if (base64.startsWith(GZIP_MARKER)) {
        return new Blob([base64], { type: 'text/plain' });
    }
    const response = await fetch(base64);
    return await response.blob();
};
