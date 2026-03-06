import { MigratableData } from './registry';

/**
 * Migration: Notebook fields
 * - Convert array fields to newline-separated strings
 * - Pad reputation to 7 entries
 * - Initialize characterImage, notes, equipement, armes_list
 */
export const migrateNotebook = (parsed: MigratableData): void => {
    const page2 = parsed.page2 as Record<string, unknown> | undefined;
    if (!page2) return;

    // Convert array fields to newline-separated strings
    const notebookFields = ['lieux_importants', 'contacts', 'connaissances', 'valeurs_monetaires'];
    notebookFields.forEach(field => {
        const val = page2[field];
        if (Array.isArray(val)) {
            page2[field] = val.filter(x => x && typeof x === 'string' && x.trim() !== '').join('\n');
        }
        else if (typeof val !== 'string') {
            page2[field] = '';
        }
    });

    // Remove deprecated personalite field
    if ('personalite' in page2) {
        delete page2.personalite;
    }

    // Pad reputation to 7 entries
    const reputation = page2.reputation;
    if (Array.isArray(reputation)) {
        if (reputation.length < 7) {
            const diff = 7 - reputation.length;
            page2.reputation = [
                ...reputation,
                ...Array(diff).fill(null).map(() => ({ reputation: '', lieu: '', valeur: '' }))
            ];
        }
    } else {
        page2.reputation = Array(7).fill(null).map(() => ({ reputation: '', lieu: '', valeur: '' }));
    }

    // Convert notes array to string
    const notes = page2.notes;
    if (Array.isArray(notes)) {
        page2.notes = notes.filter(n => n && typeof n === 'string' && n.trim() !== '').join('\n');
    } else if (typeof notes !== 'string') {
        page2.notes = '';
    }

    // Convert equipement array to string
    const equipement = page2.equipement;
    if (Array.isArray(equipement)) {
        page2.equipement = equipement.filter(n => n && typeof n === 'string' && n.trim() !== '').join('\n');
    } else if (typeof equipement !== 'string') {
        page2.equipement = '';
    }

    // Initialize characterImage
    if (typeof page2.characterImage === 'undefined') {
        page2.characterImage = '';
    }

    // Convert armes_list array to string
    const armesList = page2.armes_list;
    if (Array.isArray(armesList)) {
        page2.armes_list = armesList.filter(n => n && typeof n === 'string' && n.trim() !== '').join('\n');
    } else if (typeof armesList !== 'string') {
        page2.armes_list = '';
    }
};
