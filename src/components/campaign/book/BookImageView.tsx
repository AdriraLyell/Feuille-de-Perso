import React, { useState, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { BookImageAttributes } from '../../../extensions/bookImage';
import { Image as ImageIcon, Loader } from 'lucide-react';
import { getImage } from '../../../imageDB';

interface BookImageViewProps {
    node: {
        attrs: BookImageAttributes;
    };
    updateAttributes: (attrs: Partial<BookImageAttributes>) => void;
    selected: boolean;
}

const BookImageView: React.FC<BookImageViewProps> = ({ node, updateAttributes, selected }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let active = true;
        const load = async () => {
            if (!node.attrs.imageId) return;
            if (node.attrs.imageId.startsWith('temp-')) {
                // Should potentially be handled if we passed a URL directly for temp
                return;
            }

            setLoading(true);
            try {
                const blob = await getImage(node.attrs.imageId);
                if (blob && active) {
                    const url = URL.createObjectURL(blob);
                    setImageSrc(url);
                }
            } catch (e) {
                console.error("Failed to load image", e);
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => {
            active = false;
            // Note: We should ideally revokeObjectURL here but since we might re-mount, 
            // and React strict mode double-invokes, we need to be careful. 
            // For now, let GC handle it or use a more robust hook if memory leaks occur.
            // Actually, it's safer to revoke if we change src.
        };
    }, [node.attrs.imageId]);

    return (
        <NodeViewWrapper className={`book-image-wrapper relative group ${selected ? 'ring-2 ring-indigo-500' : ''}`}
            data-align={node.attrs.align}
            style={{
                textAlign: node.attrs.align,
                display: 'block',
                width: '100%',
                margin: '1rem 0'
            }}
        >
            <div
                className="inline-block bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 relative overflow-hidden"
                style={{
                    width: node.attrs.width === '100%' ? '100%' : node.attrs.width,
                    minHeight: '100px',
                    height: imageSrc ? 'auto' : (node.attrs.height === 'auto' ? '200px' : node.attrs.height)
                }}
            >
                {loading ? (
                    <div className="flex flex-col items-center gap-2 animate-pulse">
                        <Loader size={32} className="animate-spin" />
                        <span className="text-xs">Chargement...</span>
                    </div>
                ) : imageSrc ? (
                    <img src={imageSrc} alt={node.attrs.caption || 'Illustration'} className="max-w-full h-auto object-contain" />
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <ImageIcon size={32} />
                        <span className="text-xs">Image {node.attrs.imageId}</span>
                    </div>
                )}

                {selected && (
                    <div className="absolute top-2 right-2 flex gap-1 content-ignore z-50">
                        <div className="bg-white/90 p-1 rounded shadow-sm flex gap-1">
                            <button className="hover:bg-indigo-50 p-1 rounded text-xs px-2 border border-stone-200" onClick={() => updateAttributes({ width: '25%' })}>S</button>
                            <button className="hover:bg-indigo-50 p-1 rounded text-xs px-2 border border-stone-200" onClick={() => updateAttributes({ width: '50%' })}>M</button>
                            <button className="hover:bg-indigo-50 p-1 rounded text-xs px-2 border border-stone-200" onClick={() => updateAttributes({ width: '100%' })}>L</button>
                        </div>
                        <div className="bg-white/90 p-1 rounded shadow-sm flex gap-1">
                            <button className="hover:bg-indigo-50 p-1 rounded text-xs px-2 border border-stone-200" onClick={() => updateAttributes({ align: 'left' })}>L</button>
                            <button className="hover:bg-indigo-50 p-1 rounded text-xs px-2 border border-stone-200" onClick={() => updateAttributes({ align: 'center' })}>C</button>
                            <button className="hover:bg-indigo-50 p-1 rounded text-xs px-2 border border-stone-200" onClick={() => updateAttributes({ align: 'right' })}>R</button>
                        </div>
                    </div>
                )}
            </div>
            {node.attrs.caption && (
                <div className="text-center text-stone-500 text-xs italic mt-1 font-serif">
                    {node.attrs.caption}
                </div>
            )}
        </NodeViewWrapper>
    );
};

export default BookImageView;
