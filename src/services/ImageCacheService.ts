import { getImage } from './imageDB';
import { logger } from '../utils/logger';

/**
 * Cache LRU en mémoire pour les ObjectURLs d'images IndexedDB.
 * Évite de recharger les images depuis IndexedDB à chaque navigation de page.
 * 
 * - Max 50 entrées (configurable).
 * - Purge LRU automatique quand la limite est atteinte.
 * - Revoke les ObjectURLs purgées pour libérer la mémoire.
 */

const MAX_CACHE_SIZE = 50;

interface CacheEntry {
    url: string;
    lastAccess: number;
}

const cache = new Map<string, CacheEntry>();

/** Pending promises to avoid duplicate concurrent fetches for the same imageId. */
const pending = new Map<string, Promise<string | null>>();

/**
 * Purge la plus ancienne entrée du cache (LRU).
 */
function evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of cache) {
        if (entry.lastAccess < oldestTime) {
            oldestTime = entry.lastAccess;
            oldestKey = key;
        }
    }

    if (oldestKey) {
        const entry = cache.get(oldestKey);
        if (entry) {
            URL.revokeObjectURL(entry.url);
        }
        cache.delete(oldestKey);
    }
}

/**
 * Récupère l'ObjectURL d'une image, depuis le cache ou IndexedDB.
 * Retourne null si l'image n'existe pas.
 */
export async function getCachedImageUrl(imageId: string): Promise<string | null> {
    // Cas invalides
    if (!imageId || imageId.startsWith('temp-')) return null;

    // Cache hit
    const cached = cache.get(imageId);
    if (cached) {
        cached.lastAccess = Date.now();
        return cached.url;
    }

    // Dedup: si un fetch est déjà en cours pour cet imageId, l'attendre
    const pendingPromise = pending.get(imageId);
    if (pendingPromise) {
        return pendingPromise;
    }

    // Cache miss — charger depuis IndexedDB
    const promise = (async () => {
        try {
            const blob = await getImage(imageId);
            if (!blob) return null;

            const url = URL.createObjectURL(blob);

            // Evict si nécessaire
            if (cache.size >= MAX_CACHE_SIZE) {
                evictOldest();
            }

            cache.set(imageId, { url, lastAccess: Date.now() });
            return url;
        } catch (e) {
            logger.error('ImageCacheService: failed to load image', e);
            return null;
        } finally {
            pending.delete(imageId);
        }
    })();

    pending.set(imageId, promise);
    return promise;
}

/**
 * Invalide une entrée du cache (ex: après suppression d'image).
 */
export function invalidateCachedImage(imageId: string): void {
    const entry = cache.get(imageId);
    if (entry) {
        URL.revokeObjectURL(entry.url);
        cache.delete(imageId);
    }
}

/**
 * Vide tout le cache (ex: lors d'un changement de personnage complet).
 */
export function clearImageCache(): void {
    for (const entry of cache.values()) {
        URL.revokeObjectURL(entry.url);
    }
    cache.clear();
    pending.clear();
}
