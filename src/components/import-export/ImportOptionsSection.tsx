import React from 'react';
import {
    AlertTriangle, User, FileBox, LayoutTemplate, Merge, RefreshCw
} from 'lucide-react';
import { APP_VERSION } from '../../constants/app';

interface ImportOptionsSectionProps {
    analysis: {
        hasHeader: boolean;
        hasStructure: boolean;
        hasLibrary: boolean;
        hasSkillLibrary: boolean;
        hasSpecLibrary: boolean;
        isFilled: boolean;
        fileVersion?: string;
        versionMismatch: boolean;
    };
    variant: 'player' | 'gm';
    importAction: string;
    onActionChange: (action: string) => void;
}

const ImportOptionsSection: React.FC<ImportOptionsSectionProps> = ({
    analysis,
    variant,
    importAction,
    onActionChange
}) => {
    const versionWarning = analysis.versionMismatch && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-800">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div className="text-xs">
                <p className="font-bold mb-1">Décalage de version détecté</p>
                <p>Ce fichier (v{analysis.fileVersion || '???'}) est différent de votre version actuelle (v{APP_VERSION}).</p>
                <p className="mt-1 opacity-80 italic">Une conversion automatique sera tentée lors de l'importation.</p>
            </div>
        </div>
    );

    if (variant === 'player') {
        return (
            <div className="space-y-4 h-full">
                {versionWarning}
                <div className="bg-orange-50 border border-orange-200 rounded p-4 text-center">
                    <User size={32} className="mx-auto text-orange-600 mb-2" />
                    <p className="font-bold text-orange-900 text-sm mb-1">Prêt à charger</p>
                    <p className="text-xs text-orange-800">
                        Ce fichier va remplacer votre personnage actuel.
                    </p>
                </div>
            </div>
        );
    }

    const options = [];

    // 1. STRUCTURE IMPORTS
    if (analysis.hasStructure) {
        options.push(
            <div key="group_struct" className="mb-4">
                <div className="text-xs font-bold text-gray-400 uppercase mb-2">Structure & Personnage</div>
                <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'replace_all' ? 'bg-red-50 border-red-500 ring-1 ring-red-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="importAction" checked={importAction === 'replace_all'} onChange={() => onActionChange('replace_all')} className="mt-1" />
                        <div>
                            <span className="font-bold text-gray-800 flex items-center gap-2"><User size={16} /> Tout remplacer (Clone)</span>
                            <span className="text-xs text-red-600 block mt-1"><AlertTriangle size={12} className="inline mr-1" />Toutes vos données actuelles seront perdues.</span>
                        </div>
                    </label>
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'system' ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="importAction" checked={importAction === 'system'} onChange={() => onActionChange('system')} className="mt-1" />
                        <div>
                            <span className="font-bold text-gray-800 flex items-center gap-2"><FileBox size={16} /> Système de Jeu (MJ)</span>
                            <span className="text-xs text-orange-600 block mt-1">Écrase structure et bibliothèques. Réinitialise les valeurs.</span>
                        </div>
                    </label>
                    {!analysis.hasLibrary && !analysis.hasSkillLibrary && (
                        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'template' ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input type="radio" name="importAction" checked={importAction === 'template'} onChange={() => onActionChange('template')} className="mt-1" />
                            <div>
                                <span className="font-bold text-gray-800 flex items-center gap-2"><LayoutTemplate size={16} /> Structure Seule</span>
                                <span className="text-xs text-orange-600 block mt-1">Structure uniquement. Vos bibliothèques sont conservées.</span>
                            </div>
                        </label>
                    )}
                </div>
            </div>
        );
    }

    // 2. COMBINED LIBRARY IMPORTS
    if (analysis.hasLibrary && analysis.hasSkillLibrary) {
        options.push(
            <div key="group_all_libs" className="mb-4">
                <div className="text-xs font-bold text-gray-400 uppercase mb-2">Toutes les Bibliothèques</div>
                <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'all_libs_merge' ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="importAction" checked={importAction === 'all_libs_merge'} onChange={() => onActionChange('all_libs_merge')} className="mt-1" />
                        <div>
                            <span className="font-bold text-gray-800 flex items-center gap-2"><Merge size={16} /> Tout Fusionner (Bibliothèques)</span>
                            <span className="text-xs text-gray-600 block mt-1">Ajoute le contenu sans toucher à votre fiche.</span>
                        </div>
                    </label>
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'all_libs_replace' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="importAction" checked={importAction === 'all_libs_replace'} onChange={() => onActionChange('all_libs_replace')} className="mt-1" />
                        <div>
                            <span className="font-bold text-gray-800 flex items-center gap-2"><RefreshCw size={16} /> Tout Remplacer (Bibliothèques)</span>
                            <span className="text-xs text-gray-600 block mt-1">Remplace vos bibliothèques par celles du fichier.</span>
                        </div>
                    </label>
                </div>
            </div>
        );
    }

    // 3. SKILL LIBRARY IMPORTS (Individual)
    if (analysis.hasSkillLibrary) {
        options.push(
            <div key="group_skill_lib" className="mb-4">
                <div className="text-xs font-bold text-gray-400 uppercase mb-2">Réserve de Compétences</div>
                <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'skill_lib_merge' ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="importAction" checked={importAction === 'skill_lib_merge'} onChange={() => onActionChange('skill_lib_merge')} className="mt-1" />
                        <div>
                            <span className="font-bold text-gray-800 flex items-center gap-2"><Merge size={16} /> Fusionner Compétences</span>
                            <span className="text-xs text-gray-600 block mt-1">Ajoute les nouvelles compétences à votre réserve.</span>
                        </div>
                    </label>
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'skill_lib_replace' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="importAction" checked={importAction === 'skill_lib_replace'} onChange={() => onActionChange('skill_lib_replace')} className="mt-1" />
                        <div>
                            <span className="font-bold text-gray-800 flex items-center gap-2"><RefreshCw size={16} /> Remplacer Compétences</span>
                            <span className="text-xs text-gray-600 block mt-1">Écrase votre réserve actuelle.</span>
                        </div>
                    </label>
                </div>
            </div>
        );
    }

    // 4. TRAIT LIBRARY IMPORTS (Individual)
    if (analysis.hasLibrary) {
        options.push(
            <div key="group_trait_lib" className="mb-4">
                <div className="text-xs font-bold text-gray-400 uppercase mb-2">Bibliothèque de Traits</div>
                <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'lib_merge' ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="importAction" checked={importAction === 'lib_merge'} onChange={() => onActionChange('lib_merge')} className="mt-1" />
                        <div>
                            <span className="font-bold text-gray-800 flex items-center gap-2"><Merge size={16} /> Fusionner Traits</span>
                            <span className="text-xs text-gray-600 block mt-1">Ajoute les nouveaux Avantages/Désavantages.</span>
                        </div>
                    </label>
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'lib_replace' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="importAction" checked={importAction === 'lib_replace'} onChange={() => onActionChange('lib_replace')} className="mt-1" />
                        <div>
                            <span className="font-bold text-gray-800 flex items-center gap-2"><RefreshCw size={16} /> Remplacer Traits</span>
                            <span className="text-xs text-gray-600 block mt-1">Écrase votre bibliothèque de traits actuelle.</span>
                        </div>
                    </label>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {versionWarning}
            {options}
        </div>
    );
};

export default ImportOptionsSection;
