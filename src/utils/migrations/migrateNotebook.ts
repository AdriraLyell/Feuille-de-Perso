import { MigratableData } from './registry';

/**
 * Migration: Notebook fields
 * - Convert array fields to newline-separated strings
 * - Pad reputation to 7 entries
 * - Initialize characterImage, notes, equipement, armes_list
 */
export const migrateNotebook = (parsed: MigratableData): void => {
    const page2 = parsed.page2 as Record<string, any> | undefined;
    if (!page2) return;

    // Convert array fields to newline-separated strings
    const notebookFields = ['lieux_importants', 'contacts', 'connaissances', 'valeurs_monetaires'];
    notebookFields.forEach(field => {
        if (Array.isArray(page2[field])) {
            page2[field] = page2[field].filter((x: any) => x && typeof x === 'string' && x.trim() !== '').join('\n');
        }
        else if (typeof page2[field] !== 'string') {
            page2[field] = '';
        }
    });

    // Remove deprecated personalite field
    if ('personalite' in page2) {
        delete page2.personalite;
    }

    // Pad reputation to 7 entries
    if (Array.isArray(page2.reputation)) {
        if (page2.reputation.length < 7) {
            const diff = 7 - page2.reputation.length;
            page2.reputation = [
                ...page2.reputation,
                ...Array(diff).fill(null).map(() => ({ reputation: '', lieu: '', valeur: '' }))
            ];
        }
    } else {
        page2.reputation = Array(7).fill(null).map(() => ({ reputation: '', lieu: '', valeur: '' }));
    }

    // Convert notes array to string
    if (Array.isArray(page2.notes)) {
        page2.notes = page2.notes.filter((n: any) => n && typeof n === 'string' && n.trim() !== '').join('\n');
    } else if (typeof page2.notes !== 'string') {
        page2.notes = '';
    }

    // Convert equipement array to string
    if (Array.isArray(page2.equipement)) {
        page2.equipement = page2.equipement.filter((n: any) => n && typeof n === 'string' && n.trim() !== '').join('\n');
    } else if (typeof page2.equipement !== 'string') {
        page2.equipement = '';
    }

    // Initialize characterImage
    if (typeof page2.characterImage === 'undefined') {
        page2.characterImage = '';
    }

    // Convert armes_list array to string
    if (Array.isArray(page2.armes_list)) {
        page2.armes_list = page2.armes_list.filter((n: any) => n && typeof n === 'string' && n.trim() !== '').join('\n');
    } else if (typeof page2.armes_list !== 'string') {
        page2.armes_list = '';
    }
};
