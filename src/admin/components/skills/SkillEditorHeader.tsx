import React from 'react';
import { AlertCircle, CheckCircle2, FolderSync } from 'lucide-react';
import { MotionFade } from '../../../components/ui/motion/MotionFade';

interface SkillEditorHeaderProps {
    handleSyncAll: () => void;
    syncSuccess: string | null;
}

export const SkillEditorHeader: React.FC<SkillEditorHeaderProps> = ({ handleSyncAll, syncSuccess }) => {
    return (
        <MotionFade delay={0.1}>
            <div className="bg-stone-900/40 border-l-4 border-amber-600 p-4 mb-6 flex justify-between items-start rounded-r-sm shadow-glass">
                <div className="flex items-start gap-4">
                    <AlertCircle className="text-amber-500 mt-0.5" size={20} />
                    <div>
                        <h3 className="font-bold text-amber-500 text-sm uppercase tracking-wide">Gestion Dynamique</h3>
                        <p className="text-xs text-stone-400 mt-1 font-medium leading-relaxed">
                            Glissez-déposez pour réorganiser. Glissez vers la réserve (droite) pour archiver.
                            <br />Les nouvelles compétences sont automatiquement ajoutées à la bibliothèque.
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSyncAll}
                    className="text-xs bg-stone-900 border border-stone-700 text-stone-300 px-3 py-1.5 rounded-sm hover:bg-stone-800 hover:border-amber-500 hover:text-amber-500 transition-all font-bold flex items-center gap-2 shadow-sm uppercase tracking-wider"
                    title="Ajouter toutes les compétences actuelles à la bibliothèque"
                >
                    {syncSuccess ? <CheckCircle2 size={14} className="text-green-500" /> : <FolderSync size={14} />}
                    {syncSuccess || "Synchroniser Bibliothèque"}
                </button>
            </div>
        </MotionFade>
    );
};
