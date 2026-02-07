/**
 * Migration: Notebook fields
 * - Convert array fields to newline-separated strings
 * - Pad reputation to 7 entries
 * - Initialize characterImage, notes, equipement, armes_list
 */
export const migrateNotebook = (parsed: any): void => {
    if (!parsed.page2) return;

    // Convert array fields to newline-separated strings
    const notebookFields = ['lieux_importants', 'contacts', 'connaissances', 'valeurs_monetaires'];
    notebookFields.forEach(field => {
        if (Array.isArray(parsed.page2[field])) {
            parsed.page2[field] = parsed.page2[field].filter((x: any) => x && x.trim() !== '').join('\n');
        }
        else if (typeof parsed.page2[field] !== 'string') {
            parsed.page2[field] = '';
        }
    });

    // Remove deprecated personalite field
    if (parsed.page2.personalite) {
        delete parsed.page2.personalite;
    }

    // Pad reputation to 7 entries
    if (parsed.page2.reputation) {
        if (parsed.page2.reputation.length < 7) {
            const diff = 7 - parsed.page2.reputation.length;
            parsed.page2.reputation = [
                ...parsed.page2.reputation,
                ...Array(diff).fill({ reputation: '', lieu: '', valeur: '' })
            ];
        }
    } else {
        parsed.page2.reputation = Array(7).fill({ reputation: '', lieu: '', valeur: '' });
    }

    // Convert notes array to string
    if (Array.isArray(parsed.page2.notes)) {
        parsed.page2.notes = parsed.page2.notes.filter((n: string) => n && n.trim() !== '').join('\n');
    } else if (typeof parsed.page2.notes !== 'string') {
        parsed.page2.notes = '';
    }

    // Convert equipement array to string
    if (Array.isArray(parsed.page2.equipement)) {
        parsed.page2.equipement = parsed.page2.equipement.filter((n: string) => n && n.trim() !== '').join('\n');
    } else if (typeof parsed.page2.equipement !== 'string') {
        parsed.page2.equipement = '';
    }

    // Initialize characterImage
    if (typeof parsed.page2.characterImage === 'undefined') {
        parsed.page2.characterImage = '';
    }

    // Convert armes_list array to string
    if (Array.isArray(parsed.page2.armes_list)) {
        parsed.page2.armes_list = parsed.page2.armes_list.filter((n: string) => n && n.trim() !== '').join('\n');
    } else if (typeof parsed.page2.armes_list !== 'string') {
        parsed.page2.armes_list = '';
    }
};
