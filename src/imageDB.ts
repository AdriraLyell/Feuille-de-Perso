
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

/**
 * Compress an image blob using Canvas API before storage.
 * - Resizes to max 1920px width (preserving aspect ratio)
 * - Converts to WebP at 80% quality
 * - Falls back to JPEG if WebP is unsupported
 * - Non-image blobs pass through unchanged
 */
const compressBlob = async (blob: File | Blob): Promise<Blob> => {
    // Only compress images
    if (!blob.type.startsWith('image/')) return blob;
    // Skip small images (< 100KB) — not worth the overhead
    if (blob.size < 100 * 1024) return blob;

    const MAX_WIDTH = 1920;
    const QUALITY = 0.8;

    return new Promise<Blob>((resolve) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            try {
                let w = img.width;
                let h = img.height;
                if (w > MAX_WIDTH) {
                    const ratio = MAX_WIDTH / w;
                    w = MAX_WIDTH;
                    h = Math.round(h * ratio);
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(blob); return; }
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(
                    (result) => resolve(result || blob),
                    'image/webp',
                    QUALITY
                );
            } catch {
                resolve(blob);
            }
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(blob); };
        img.src = url;
    });
};

export const saveImage = async (file: File | Blob): Promise<string> => {
    // Compress image before storage
    const compressed = await compressBlob(file);

    const { available } = await checkStorageQuota();

    if (compressed.size > available) {
        const sizeKo = (compressed.size / 1024).toFixed(0);
        const availKo = (available / 1024).toFixed(0);
        throw new Error(`Espace de stockage insuffisant. Taille: ${sizeKo} Ko, Disponible: ${availKo} Ko.`);
    }

    const id = `img_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;

    try {
        await set(id, compressed);
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
    const response = await fetch(base64);
    return await response.blob();
};
