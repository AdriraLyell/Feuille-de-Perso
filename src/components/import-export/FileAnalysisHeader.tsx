import React from 'react';
import { LayoutTemplate, BookOpen, GraduationCap, Award, User, X } from 'lucide-react';
import { FileAnalysis } from './hooks/useImportLogic';

interface FileAnalysisHeaderProps {
    analysis: FileAnalysis;
    onClear: () => void;
}

export const FileAnalysisHeader: React.FC<FileAnalysisHeaderProps> = ({ analysis, onClear }) => {
    return (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4 flex gap-3 text-sm text-blue-900 flex-col">
            <div className="flex justify-between items-start">
                <div>
                    <span className="font-bold block mb-1">Contenu détecté dans le fichier :</span>
                    <div className="flex gap-2 flex-wrap mt-2">
                        {analysis.hasStructure && <span className="bg-white border border-blue-200 px-2 py-1 rounded flex items-center gap-1 shadow-sm"><LayoutTemplate size={12} /> Structure</span>}
                        {analysis.hasLibrary && <span className="bg-white border border-blue-200 px-2 py-1 rounded flex items-center gap-1 shadow-sm"><BookOpen size={12} /> Traits</span>}
                        {analysis.hasSkillLibrary && <span className="bg-white border border-blue-200 px-2 py-1 rounded flex items-center gap-1 shadow-sm"><GraduationCap size={12} /> Compétences</span>}
                        {analysis.hasSpecLibrary && <span className="bg-white border border-blue-200 px-2 py-1 rounded flex items-center gap-1 shadow-sm"><Award size={12} /> Spécialisations</span>}
                        {analysis.isFilled && <span className="bg-white border border-blue-200 px-2 py-1 rounded flex items-center gap-1 shadow-sm"><User size={12} /> Données Joueur</span>}
                    </div>
                </div>
                <button
                    onClick={onClear}
                    className="text-slate-400 hover:text-red-500 p-1"
                    title="Changer de fichier"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
