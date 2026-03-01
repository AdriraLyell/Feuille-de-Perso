
import { LibraryEntry, LibrarySkillEntry } from '../types';

export type EntrySource = 'local' | 'official' | 'modified';

export interface MergedEntry<T> {
    entry: T;
    source: EntrySource;
    originalId: string; // The ID in the official library (if applicable)
}

import { normalizeString } from './stringUtils';

/**
 * Merges the local library with the official library.
 * - Local items always appear.
 * - Official items appear UNLESS they are already in the local library (by ID or Normalized Name).
 *   - If they are in local, it means the player "owns" it (modified or not).
 * 
 * Strategy:
 * 1. Start with ALL Local items (Source: 'local').
 * 2. Add Official items that are NOT in Local ID list AND NOT matching a Local Name (normalized).
 */
export const mergeLibraries = <T extends { id: string, name: string }>(
    localList: T[],
    officialList: T[]
): MergedEntry<T>[] => {
    const mergedMap = new Map<string, MergedEntry<T>>();
    const localNames = new Set<string>();
    const localIds = new Set<string>();

    // Pre-compute official IDs and names for fast lookup
    const officialIds = new Set<string>(officialList.map(o => o.id));
    const officialNames = new Set<string>(officialList.map(o => normalizeString(o.name)));

    // 1. Add all local items first (Priority)
    // If a local item has the same ID as an official one, it is marked 'official'
    // (it's a stale copy from a previous reconciler injection — content stays, badge is corrected)
    localList.forEach(item => {
        const isAlsoOfficial = officialIds.has(item.id) || officialNames.has(normalizeString(item.name));
        mergedMap.set(item.id, {
            entry: item,
            source: isAlsoOfficial ? 'official' : 'local',
            originalId: item.id
        });
        localIds.add(item.id);
        if (item.name) {
            localNames.add(normalizeString(item.name));
        }
    });

    // 2. Add Official items if missing (check ID AND Name)
    officialList.forEach(item => {
        const normName = normalizeString(item.name);

        // Skip if ID exists in local
        if (localIds.has(item.id)) return;

        // Skip if Name exists in local (Deduplication by content)
        if (localNames.has(normName)) return;

        mergedMap.set(item.id, {
            entry: item,
            source: 'official',
            originalId: item.id
        });
    });

    // Return as array, sorted by name
    return Array.from(mergedMap.values()).sort((a, b) =>
        a.entry.name.localeCompare(b.entry.name)
    );
};
