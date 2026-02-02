
import React, { useState, useEffect } from 'react';
import { CharacterSheetData } from '../../types';
import { Download, User, Shield, LayoutTemplate, Layers, BookOpen, GraduationCap, Award } from 'lucide-react';
import { APP_VERSION } from '../../constants';
import { createTemplateFromData } from '../../utils/importExportUtils';
import { getImage, blobToBase64 } from '../../imageDB';
import { useNotification } from '../../context/NotificationContext';

interface ExportPanelProps {
    data: CharacterSheetData;
    variant: 'player' | 'gm';
    onExportSuccess?: () => void;
}

type ExportType = 'full' | 'system' | 'template' | 'library_traits' | 'library_skills' | 'library_specs' | 'library_all';

const ExportPanel: React.FC<ExportPanelProps> = ({ data, variant, onExportSuccess }) => {
    const [exportType, setExportType] = useState<ExportType>('full');
    const addLog = useNotification();

    // Force default export type when opening in player mode
    useEffect(() => {
        if (variant === 'player') {
            setExportType('full');
        }
    }, [variant]);

    const handleExport = async () => {
        let exportData: any = {};
        let filename = "Sauvegarde";

        const dataToProcess = JSON.parse(JSON.stringify(data));

        // Resolve Character Image from DB if present
        if (dataToProcess.page2?.characterImageId) {
            try {
                const blob = await getImage(dataToProcess.page2.characterImageId);
                if (blob) {
                    const base64 = await blobToBase64(blob);
                    dataToProcess.page2.characterImage = base64;
                }
            } catch (e) {
                console.error("Failed to export character image from DB", e);
            }
            delete dataToProcess.page2.characterImageId;
        }

        // Resolve Campaign Notes Images
        if (dataToProcess.campaignNotes) {
            for (const note of dataToProcess.campaignNotes) {
                if (note.images && Array.isArray(note.images)) {
                    for (const img of note.images) {
                        if (img.imageId) {
                            try {
                                const blob = await getImage(img.imageId);
                                if (blob) {
                                    (img as any).base64Data = await blobToBase64(blob);
                                }
                            } catch (e) {
                                console.error(`Failed to export note image ${img.id}`, e);
                            }
                            delete img.imageId;
                        }
                    }
                }
            }
        }

        if (!dataToProcess.appVersion) {
            dataToProcess.appVersion = APP_VERSION;
        }

        const template = createTemplateFromData(dataToProcess);
        if (!(template as any).appVersion) {
            (template as any).appVersion = APP_VERSION;
        }

        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timestamp = `${day}-${month}-${year}_${hours}h${minutes}`;

        switch (exportType) {
            case 'full':
                exportData = dataToProcess;
                filename = `${timestamp}_Personnage_${data.header.name || 'SansNom'}`;
                break;
            case 'system':
                // Template + ALL Libraries
                exportData = template;
                exportData.library = data.library;
                exportData.skillLibrary = data.skillLibrary;
                exportData.specializationLibrary = data.specializationLibrary;
                filename = `${timestamp}_Systeme_Jeu`;
                break;
            case 'template':
                exportData = template;
                delete exportData.library;
                delete exportData.skillLibrary;
                delete exportData.specializationLibrary;
                filename = `${timestamp}_Template_Structure`;
                break;
            case 'library_traits':
                exportData = { library: data.library, appVersion: APP_VERSION };
                filename = `${timestamp}_Biblio_Traits`;
                break;
            case 'library_skills':
                exportData = { skillLibrary: data.skillLibrary, appVersion: APP_VERSION };
                filename = `${timestamp}_Biblio_Competences`;
                break;
            case 'library_specs':
                exportData = { specializationLibrary: data.specializationLibrary, appVersion: APP_VERSION };
                filename = `${timestamp}_Biblio_Specialisations`;
                break;
            case 'library_all':
                exportData = { library: data.library, skillLibrary: data.skillLibrary, specializationLibrary: data.specializationLibrary, appVersion: APP_VERSION };
                filename = `${timestamp}_Biblio_Complete`;
                break;
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (onExportSuccess) onExportSuccess();
        addLog(`Sauvegarde réussie (${exportType}) : ${filename}.json`, 'info', 'both');
    };

    const isGM = variant === 'gm';

    return (
        <div className="flex-1 bg-slate-50 p-6 flex flex-col animate-in fade-in duration-300">
            <div className="space-y-3 flex-grow overflow-y-auto custom-scrollbar">
                {!isGM && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                        <div className="bg-blue-100 p-6 rounded-full text-blue-600 mb-2">
                            <User size={48} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-700">Sauvegarder ma fiche</h4>
                        <p className="text-sm text-slate-500 max-w-sm">
                            Télécharge un fichier <code>.json</code> complet contenant toutes vos statistiques, votre journal et vos images.
                        </p>
                    </div>
                )}

                {isGM && (
                    <>
                        {/* Character & System */}
                        <div className="space-y-3 mb-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">Données Principales</h4>
                            <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${exportType === 'full' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:bg-white'}`}>
                                <input type="radio" name="exportType" checked={exportType === 'full'} onChange={() => setExportType('full')} className="mt-1 accent-blue-600" />
                                <div>
                                    <span className="font-bold text-slate-800 flex items-center gap-2"><User size={16} /> Personnage Complet</span>
                                    <span className="text-xs text-slate-500 block mt-1">Tout ce que contient la fiche actuelle (Valeurs, Notes, Images, Bibliothèques).</span>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${exportType === 'system' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:bg-white'}`}>
                                <input type="radio" name="exportType" checked={exportType === 'system'} onChange={() => setExportType('system')} className="mt-1 accent-blue-600" />
                                <div>
                                    <span className="font-bold text-slate-800 flex items-center gap-2"><Shield size={16} /> Système de Jeu (MJ)</span>
                                    <span className="text-xs text-slate-500 block mt-1">Structure + Bibliothèques. <span className="text-red-500 font-bold">Sans les valeurs du joueur.</span> Idéal pour partager un template.</span>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${exportType === 'template' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:bg-white'}`}>
                                <input type="radio" name="exportType" checked={exportType === 'template'} onChange={() => setExportType('template')} className="mt-1 accent-blue-600" />
                                <div>
                                    <span className="font-bold text-slate-800 flex items-center gap-2"><LayoutTemplate size={16} /> Structure Seule</span>
                                    <span className="text-xs text-slate-500 block mt-1">Uniquement la configuration des compétences et attributs. Pas de bibliothèque.</span>
                                </div>
                            </label>
                        </div>

                        {/* Libraries */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">Bibliothèques</h4>
                            <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${exportType === 'library_all' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:bg-white'}`}>
                                <input type="radio" name="exportType" checked={exportType === 'library_all'} onChange={() => setExportType('library_all')} className="mt-1 accent-blue-600" />
                                <div>
                                    <span className="font-bold text-slate-800 flex items-center gap-2"><Layers size={16} /> Bibliothèques Complètes</span>
                                    <span className="text-xs text-slate-500 block mt-1">Traits + Compétences + Catalogue de Spés.</span>
                                </div>
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <label className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all ${exportType === 'library_traits' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:bg-white'}`}>
                                    <input type="radio" name="exportType" checked={exportType === 'library_traits'} onChange={() => setExportType('library_traits')} className="mt-1 accent-blue-600" />
                                    <div>
                                        <span className="font-bold text-slate-800 flex items-center gap-1 text-sm"><BookOpen size={14} /> Traits</span>
                                        <span className="text-[10px] text-slate-500 block">Avantages / Désavantages seuls.</span>
                                    </div>
                                </label>

                                <label className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all ${exportType === 'library_skills' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:bg-white'}`}>
                                    <input type="radio" name="exportType" checked={exportType === 'library_skills'} onChange={() => setExportType('library_skills')} className="mt-1 accent-blue-600" />
                                    <div>
                                        <span className="font-bold text-slate-800 flex items-center gap-1 text-sm"><GraduationCap size={14} /> Skills</span>
                                        <span className="text-[10px] text-slate-500 block">Réserve seule.</span>
                                    </div>
                                </label>

                                <label className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all ${exportType === 'library_specs' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:bg-white'}`}>
                                    <input type="radio" name="exportType" checked={exportType === 'library_specs'} onChange={() => setExportType('library_specs')} className="mt-1 accent-blue-600" />
                                    <div>
                                        <span className="font-bold text-slate-800 flex items-center gap-1 text-sm"><Award size={14} /> Spés</span>
                                        <span className="text-[10px] text-slate-500 block">Catalogue seul.</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
                <button
                    onClick={handleExport}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-all font-bold flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5"
                >
                    <Download size={20} />
                    Télécharger le fichier
                </button>
            </div>
        </div>
    );
};

export default ExportPanel;
