
import { LibraryEntry, LibrarySkillEntry } from '../types';

export type EntrySource = 'local' | 'official' | 'modified';

export interface MergedEntry<T> {
    entry: T;
    source: EntrySource;
    originalId: string; // The ID in the official library (if applicable)
}

/**
 * Merges the local library with the official library.
 * - Local items always appear.
 * - Official items appear UNLESS they are already in the local library (by ID).
 *   - If they are in local, it means the player "owns" it (modified or not).
 *   - Ideally, we should detect if it's a conflict or a modification.
 * 
 * Strategy:
 * 1. Start with ALL Local items (Source: 'local').
 * 2. Add Official items that are NOT in Local ID list. (Source: 'official').
 * 3. (Optional Enhancement) If a Local item has same ID as Official, check content diff -> 'modified'.
 */
export const mergeLibraries = <T extends { id: string }>(
    localList: T[],
    officialList: T[]
): MergedEntry<T>[] => {
    // 1. Map Local Items
    const mergedMap = new Map<string, MergedEntry<T>>();

    // Add all local items first (Priority)
    localList.forEach(item => {
        mergedMap.set(item.id, {
            entry: item,
            source: 'local', // Assumed local unless we track upstream link
            originalId: item.id
        });
    });

    // 2. Add Official items if missing
    officialList.forEach(item => {
        if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, {
                entry: item,
                source: 'official',
                originalId: item.id
            });
        } else {
            // It exists in local.
            // If we wanted to distinguish "Modified" vs "Just Copy", we would compare JSON here.
            // For now, let's just mark it as 'local' (User copy).
            // But maybe we can flag it?
            const existing = mergedMap.get(item.id)!;
            // existing.source = 'modified'; // Could be useful later
        }
    });

    // Return as array
    return Array.from(mergedMap.values());
};
