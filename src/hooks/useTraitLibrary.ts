import { useMemo, useState } from 'react';
import { CharacterSheetData, LibraryEntry } from '../types';
import { useRules } from '../context/RulesContext';
import { mergeLibraries, MergedEntry } from '../utils/libraryMerger';
import { smartIncludes } from '../utils/stringUtils';

export type SortOption = 'name' | 'cost' | 'type';
export type SortOrder = 'asc' | 'desc';

export const useTraitLibrary = (
    data: CharacterSheetData,
    searchTerm: string,
    filterType: 'all' | 'avantage' | 'desavantage',
    selectedTags: string[],
    sortBy: SortOption,
    sortOrder: SortOrder
) => {
    const { rules } = useRules();

    const hybridList = useMemo(() => {
        const local = (data && Array.isArray(data.library)) ? data.library.filter(entry => entry && typeof entry === 'object') : [];
        const official = rules?.libraries?.traits || [];
        return mergeLibraries(local, official);
    }, [data.library, rules]);

    const allAvailableTags = useMemo(() => {
        const tags = new Set<string>();
        hybridList.forEach(m => (m.entry.tags || []).forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [hybridList]);

    const processedList = useMemo(() => {
        const list = hybridList.filter(m => {
            const entry = m.entry;
            const entryTags = entry.tags || [];
            const matchesSearch = smartIncludes(entry.name, searchTerm) ||
                smartIncludes(entry.description, searchTerm) ||
                entryTags.some(t => smartIncludes(t, searchTerm));
            const matchesType = filterType === 'all' || entry.type === filterType;
            const matchesTags = selectedTags.length === 0 || selectedTags.every(sel =>
                entryTags.some(t => t.toLowerCase() === sel.toLowerCase())
            );
            return matchesSearch && matchesType && matchesTags;
        });

        list.sort((a, b) => {
            const ea = a.entry;
            const eb = b.entry;

            let comparison = 0;
            if (sortBy === 'name') comparison = ea.name.localeCompare(eb.name);
            else if (sortBy === 'cost') comparison = (parseInt(ea.cost) || 0) - (parseInt(eb.cost) || 0);
            else if (sortBy === 'type') comparison = ea.type.localeCompare(eb.type);

            if (comparison === 0) return ea.name.localeCompare(eb.name);
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return list;
    }, [hybridList, searchTerm, filterType, selectedTags, sortBy, sortOrder]);

    return {
        hybridList,
        processedList,
        allAvailableTags
    };
};
