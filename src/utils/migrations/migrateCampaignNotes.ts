/**
 * Migration: Campaign Notes to Book Document (Tiptap)
 * - Converts campaignNotes array to bookDocument format
 */
export const migrateCampaignNotes = (parsed: any): void => {
    if (!parsed.campaignNotes || parsed.campaignNotes.length === 0) return;

    // If bookDocument already exists and has content, we don't overwrite
    if (parsed.bookDocument && parsed.bookDocument.content &&
        Object.keys(parsed.bookDocument.content).length > 0) {
        return;
    }

    const tiptapContent: any[] = [];

    parsed.campaignNotes.forEach((note: any) => {
        // Add chapter heading
        tiptapContent.push({
            type: 'chapterHeading',
            attrs: { date: note.date || new Date().toISOString().split('T')[0] },
            content: [{ type: 'text', text: note.title || 'Nouvelle Session' }]
        });

        // Add content
        if (note.content) {
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
        if (note.images && Array.isArray(note.images)) {
            note.images.forEach((img: any) => {
                if (img.imageId) {
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
        id: Math.random().toString(36).substr(2, 9),
        createdAt: now,
        updatedAt: now,
        formatVersion: 2,
        content: {
            type: 'doc',
            content: tiptapContent
        }
    };
};
