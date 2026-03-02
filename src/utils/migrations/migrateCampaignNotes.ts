import { MigratableData } from './registry';

/**
 * Migration: Campaign Notes to Book Document (Tiptap)
 * - Converts campaignNotes array to bookDocument format
 */
export const migrateCampaignNotes = (parsed: MigratableData): void => {
    const campaignNotes = parsed.campaignNotes as any[] | undefined;
    if (!Array.isArray(campaignNotes) || campaignNotes.length === 0) return;

    // If bookDocument already exists and has content, we don't overwrite
    const existingBook = parsed.bookDocument as Record<string, any> | undefined;
    if (existingBook && existingBook.content &&
        typeof existingBook.content === 'object' &&
        Object.keys(existingBook.content).length > 0) {
        return;
    }

    const tiptapContent: any[] = [];

    campaignNotes.forEach((note: any) => {
        if (!note) return;
        // Add chapter heading
        tiptapContent.push({
            type: 'chapterHeading',
            attrs: { date: note.date || new Date().toISOString().split('T')[0] },
            content: [{ type: 'text', text: note.title || 'Nouvelle Session' }]
        });

        // Add content
        if (typeof note.content === 'string' && note.content) {
            // Very simple HTML to Text conversion for JSON nodes
            const cleanContent = note.content
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n')
                .replace(/<[^>]*>/g, '');

            const lines = cleanContent.split('\n').map((l: string) => l.trim()).filter((l: string) => l);

            lines.forEach((line: string) => {
                tiptapContent.push({
                    type: 'paragraph',
                    content: [{ type: 'text', text: line }]
                });
            });
        }

        // Add images if any
        if (Array.isArray(note.images)) {
            note.images.forEach((img: any) => {
                if (img && img.imageId) {
                    tiptapContent.push({
                        type: 'bookImage',
                        attrs: {
                            imageId: img.imageId,
                            width: typeof img.config?.width === 'number'
                                ? `${Math.min(100, Math.round((img.config.width / 600) * 100))}%`
                                : (img.config?.width || '100%'),
                            height: 'auto',
                            align: img.config?.align || 'center',
                            caption: ''
                        }
                    });
                }
            });
        }
    });

    const now = new Date().toISOString();
    parsed.bookDocument = {
        id: Math.random().toString(36).substring(2, 11),
        createdAt: now,
        updatedAt: now,
        formatVersion: 2,
        content: {
            type: 'doc',
            content: tiptapContent
        }
    };
};
