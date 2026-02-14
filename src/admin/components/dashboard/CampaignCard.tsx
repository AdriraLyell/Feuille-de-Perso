import React from 'react';
import { Eye, EyeOff, BookOpen, Copy, Trash2, FileCog } from 'lucide-react';
import { GameSettingSummary } from '../../../services/CampaignService';
import { MotionCard } from '../../../components/ui/motion/MotionCard';

interface CampaignCardProps {
    setting: GameSettingSummary;
    index: number;
    onSelect: (id: string) => void;
    onToggleVisibility: (id: string, current: boolean) => void;
    onToggleArchive: (id: string, current: boolean) => void;
    onDuplicate: (id: string, name: string) => void;
    onDelete: (id: string) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
    setting,
    index,
    onSelect,
    onToggleVisibility,
    onToggleArchive,
    onDuplicate,
    onDelete
}) => {
    return (
        <MotionCard
            onClick={() => onSelect(setting.id)}
            className={`group cursor-pointer overflow-hidden relative min-h-[280px] flex flex-col ${setting.is_archived ? 'opacity-60 grayscale hover:grayscale-0 transition-all duration-500' : ''}`}
            hoverEffect="lift"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
        >
            <div className={`h-1 w-full ${setting.is_archived ? 'bg-stone-700' : 'bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700'}`} />

            {/* Card Content */}
            <div className="p-8 relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-serif font-bold text-2xl text-stone-200 group-hover:text-amber-400 transition-colors pr-8 line-clamp-2">
                        {setting.name}
                    </h3>
                    {setting.is_archived && (
                        <span className="shrink-0 text-[10px] uppercase tracking-widest bg-stone-950 text-stone-500 px-2 py-1 rounded border border-stone-800">
                            Archivée
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3 text-[10px] text-amber-700/60 font-bold uppercase tracking-widest mb-6 border-b border-stone-800/50 pb-4">
                    <span className="bg-stone-950/30 px-2 py-1 rounded border border-stone-800/50">v{setting.version}</span>
                    <span className="text-stone-700">•</span>
                    <span className="text-stone-500">{new Date(setting.last_updated).toLocaleDateString()}</span>
                </div>

                <div className="mt-auto flex justify-between items-center pt-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility(setting.id, setting.is_public);
                        }}
                        className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wide transition-all border ${setting.is_public
                            ? 'bg-green-950/30 text-green-600 border-green-900/30 hover:bg-green-900/30 hover:text-green-400'
                            : 'bg-stone-950/30 text-stone-600 border-stone-800 hover:border-stone-600 hover:text-stone-400'
                            }`}
                        title={setting.is_public ? "Passer en mode Privé" : "Passer en mode Public"}
                    >
                        {setting.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                        {setting.is_public ? 'Publique' : 'Privée'}
                    </button>

                    <span className="text-amber-600/80 font-serif font-bold text-sm group-hover:translate-x-1 transition-all flex items-center gap-1 group-hover:text-amber-500">
                        Ouvrir <BookOpen size={14} />
                    </span>
                </div>
            </div>

            {/* Quick Actions (Hover Reveal) */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 z-20">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleArchive(setting.id, setting.is_archived);
                    }}
                    className={`p-2 rounded-full transition-colors shadow-lg border border-transparent ${setting.is_archived ? 'bg-amber-900/80 text-amber-500 hover:bg-amber-800 hover:border-amber-700' : 'bg-stone-800/90 text-stone-400 hover:text-stone-200 hover:bg-stone-700 hover:border-stone-600'}`}
                    title={setting.is_archived ? "Désarchiver" : "Archiver"}
                >
                    <BookOpen size={16} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(setting.id, setting.name);
                    }}
                    className="p-2 bg-stone-800/90 text-blue-400 hover:text-blue-300 hover:bg-stone-700 rounded-full transition-colors shadow-lg border border-transparent hover:border-blue-900/50"
                    title="Dupliquer"
                >
                    <Copy size={16} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(setting.id);
                    }}
                    className="p-2 bg-stone-800/90 text-crimson-blood hover:text-red-400 hover:bg-stone-700 rounded-full transition-colors shadow-lg border border-transparent hover:border-red-900/50"
                    title="Supprimer"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Background Decoration */}
            <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 rotate-12 scale-110 pointer-events-none">
                <FileCog size={180} />
            </div>
        </MotionCard>
    );
};
