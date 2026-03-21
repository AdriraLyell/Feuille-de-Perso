import React, { useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Editor, NodeViewProps } from '@tiptap/core';
import { Calendar, Sun, CloudRain, Swords, Moon, Snowflake, Cloud } from 'lucide-react';

interface ChapterHeaderViewProps extends Omit<NodeViewProps, 'node' | 'editor'> {
    node: NodeViewProps['node'] & { attrs: { date: string, weather: string, realDate: string } };
    editor: Editor;
    updateAttributes: (attrs: Partial<{ date: string, weather: string, realDate: string }>) => void;
}

const ChapterHeaderView: React.FC<ChapterHeaderViewProps> = ({ node, editor, getPos, updateAttributes }) => {
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Surgical Selection: Select the title text natively via Tiptap/ProseMirror
    // if it's a freshly created chapter (with the default text).
    useEffect(() => {
        const isDefault = node.content?.size > 0 &&
            node.content.firstChild?.text === 'Nouveau Chapitre';

        if (isDefault && typeof getPos === 'function') {
            const selectText = () => {
                if (editor.isDestroyed) return;

                try {
                    const pos = (getPos as () => number)();
                    const from = pos + 1;
                    const to = from + node.content.size;

                    // Execute focus and selection in a single transaction for atomicity
                    editor.chain()
                        .focus()
                        .setTextSelection({ from, to })
                        .run();
                } catch {
                    // Silently fail if pos is invalid during a concurrent update
                }
            };

            // Double security: small timeout + requestAnimationFrame to ensure DOM is ready
            const timer = setTimeout(() => {
                requestAnimationFrame(selectText);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [editor, getPos, node]);

    const formatDate = (dateStr: string, isReal: boolean = false) => {
        if (!dateStr) return isReal ? '' : 'Date du récit...';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: isReal ? 'numeric' : 'long',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const handleIconClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (dateInputRef.current) {
            if ('showPicker' in dateInputRef.current) {
                (dateInputRef.current as unknown as { showPicker: () => void }).showPicker();
            } else {
                (dateInputRef.current as HTMLInputElement).click();
            }
        }
    };

    const WEATHER_ICONS = [
        { id: 'sun', icon: Sun, color: 'text-amber-500' },
        { id: 'rain', icon: CloudRain, color: 'text-blue-500' },
        { id: 'snow', icon: Snowflake, color: 'text-slate-300' },
        { id: 'cloud', icon: Cloud, color: 'text-stone-400' },
        { id: 'combat', icon: Swords, color: 'text-red-600' },
        { id: 'night', icon: Moon, color: 'text-indigo-400' },
    ];

    const CurrentWeatherIcon = WEATHER_ICONS.find(w => w.id === node.attrs.weather)?.icon || null;
    const currentWeatherColor = WEATHER_ICONS.find(w => w.id === node.attrs.weather)?.color || 'text-stone-400';

    return (
        <NodeViewWrapper className="chapter-header-wrapper mt-8 mb-6 border-b border-stone-800/30 pb-4 relative group w-full">
            <div className="flex flex-col gap-2 w-full text-center">
                <div className="flex items-center justify-center gap-2 text-stone-500 font-serif italic tracking-wider">
                    <button
                        type="button"
                        onClick={handleIconClick}
                        className="p-1 hover:bg-stone-800/5 rounded-full transition-colors cursor-pointer border-none bg-transparent"
                        title="Choisir une date"
                    >
                        <Calendar size={14} className="opacity-50" />
                    </button>

                    <input
                        ref={dateInputRef}
                        type="date"
                        value={node.attrs.date}
                        className="absolute opacity-0 pointer-events-none w-0 h-0"
                        onChange={(e) => updateAttributes({ date: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                    />

                    <button
                        type="button"
                        className="text-xs text-center flex items-center gap-1.5 hover:bg-stone-800/5 rounded px-2 transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-stone-300"
                        onClick={handleIconClick}
                    >
                        <span className="font-bold">{formatDate(node.attrs.date)}</span>
                        {node.attrs.realDate && node.attrs.realDate !== node.attrs.date && (
                            <span className="opacity-40 text-[10px] lowercase font-sans not-italic">
                                (le {formatDate(node.attrs.realDate, true)})
                            </span>
                        )}
                    </button>

                    <div className="flex items-center gap-1 ml-4 border-l border-stone-200 pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        {WEATHER_ICONS.map(({ id, icon: Icon, color }) => (
                            <button
                                key={id}
                                onClick={() => updateAttributes({ weather: node.attrs.weather === id ? '' : id })}
                                className={`p-1.5 rounded-lg transition-all hover:bg-stone-100 ${node.attrs.weather === id ? 'bg-stone-200 ring-1 ring-stone-300' : ''}`}
                                title={id}
                            >
                                <Icon size={12} className={node.attrs.weather === id ? color : 'text-stone-400'} />
                            </button>
                        ))}
                    </div>

                    {node.attrs.weather && !editor.isFocused && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 pr-4 animate-in fade-in duration-500">
                            {CurrentWeatherIcon && <CurrentWeatherIcon size={20} className={`${currentWeatherColor} opacity-50`} />}
                        </div>
                    )}
                </div>

                <div className="font-serif font-bold text-3xl text-stone-900 tracking-tight uppercase">
                    <NodeViewContent />
                </div>

                <div className="w-16 h-px bg-stone-400 mx-auto mt-2" />
            </div>
        </NodeViewWrapper>
    );
};

export default ChapterHeaderView;
