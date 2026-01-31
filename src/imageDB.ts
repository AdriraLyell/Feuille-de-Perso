
import { set, get, del } from 'idb-keyval';

export const saveImage = async (file: File | Blob): Promise<string> => {
    const id = `img_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    await set(id, file);
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
