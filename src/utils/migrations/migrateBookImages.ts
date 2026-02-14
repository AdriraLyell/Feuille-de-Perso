import { saveImage, base64ToBlob } from '../../imageDB';

/**
 * Migration: Processes Tiptap JSON to move Base64 images to IndexedDB
 * Replaces 'image' nodes with 'bookImage' nodes.
 */
export const migrateBookImages = async (content: any): Promise<any> => {
    if (!content) return content;

    // Deep clone to avoid mutating original during processing if needed
    const processNode = async (node: any): Promise<any> => {
        if (!node) return node;

        // If it's a standard Tiptap Image with Base64
        if (node.type === 'image' && node.attrs?.src?.startsWith('data:image')) {
            try {
                const blob = await base64ToBlob(node.attrs.src);
                const imageId = await saveImage(blob);

                // Convert to bookImage
                return {
                    type: 'bookImage',
                    attrs: {
                        imageId,
                        width: '100%',
                        align: 'center',
                        caption: node.attrs.title || node.attrs.alt || ''
                    }
                };
            } catch (err) {
                console.error("Failed to migrate image during JSON processing", err);
                return node; // Fallback to original
            }
        }

        // Recursively process children
        if (node.content && Array.isArray(node.content)) {
            const newContent = [];
            for (const child of node.content) {
                newContent.push(await processNode(child));
            }
            return { ...node, content: newContent };
        }

        return node;
    };

    return await processNode(content);
};
