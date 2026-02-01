
import React, { useState, useRef, useEffect } from 'react';
import { CharacterSheetData, LibraryEntry, LibrarySkillEntry, LibrarySpecializationEntry } from '../types';
import { Download, Upload, AlertTriangle, BookOpen, User, LayoutTemplate, X, CheckCircle2, Merge, RefreshCw, FileBox, GraduationCap, Layers, Shield, Settings, ArrowRight, AlertOctagon, ArrowDown, Zap, Save, Award } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useCharacter } from '../context/CharacterContext';
import ThematicModal from './ui/ThematicModal';
import ThematicButton from './ui/ThematicButton';
import { APP_VERSION } from '../constants';
import { getImage, saveImage, blobToBase64, base64ToBlob } from '../imageDB';
import ConflictResolver from './import-export/ConflictResolver';
import ImportOptionsSection from './import-export/ImportOptionsSection';

interface ImportExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExportSuccess?: () => void;
    onImportSuccess?: (newData: CharacterSheetData) => void; // Remplace onImport pour notifier le parent
    variant: 'player' | 'gm';
}

// Updated Export Types to include new options
type ExportType = 'full' | 'system' | 'template' | 'library_traits' | 'library_skills' | 'library_specs' | 'library_all';

interface FileAnalysis {
    hasHeader: boolean;
    hasStructure: boolean; // Skills, Attributes
    hasLibrary: boolean; // Traits
    hasSkillLibrary: boolean; // Skill Reserve
    hasSpecLibrary: boolean; // Specialization Catalogue
    isFilled: boolean; // Guess if it's a played character (has values)
    fileVersion?: string;
    versionMismatch: boolean;
}

import {
    createTemplateFromData,
    detectConflicts,
    smartMerge,
    DataConflict
} from '../utils/importExportUtils';

const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose, onExportSuccess, onImportSuccess, variant }) => {
    const { data, importData, addLog: onAddLog } = useCharacter();
    // UI State
    const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

    // Export State
    const [exportType, setExportType] = useState<ExportType>('full');

    // Import State
    const [pendingFile, setPendingFile] = useState<any | null>(null);
    const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
    const [importAction, setImportAction] = useState<string>('');

    // Conflict Resolution State
    const [conflicts, setConflicts] = useState<DataConflict[]>([]);
    const [resolutionMap, setResolutionMap] = useState<Record<string, 'keep_current' | 'replace'>>({});
    const [isResolvingConflicts, setIsResolvingConflicts] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Force default export type when opening in player mode
    useEffect(() => {
        if (isOpen && variant === 'player') {
            setExportType('full');
        }
    }, [isOpen, variant]);

    // Reset state on close or file change
    useEffect(() => {
        if (!isOpen || !pendingFile) {
            setConflicts([]);
            setResolutionMap({});
            setIsResolvingConflicts(false);
        }
    }, [isOpen, pendingFile]);

    if (!isOpen) return null;

    const isGM = variant === 'gm';


    // --- LOGIC: EXPORT ---
    const handleExport = async () => {
        let exportData: any = {};
        let filename = "Sauvegarde";

        const dataToProcess = JSON.parse(JSON.stringify(data));

        // Resolve Character Image from DB if present
        if (dataToProcess.page2.characterImageId) {
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
        onAddLog(`Sauvegarde réussie (${exportType}) : ${filename}.json`, 'info', 'both');
    };

    // --- LOGIC: IMPORT ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);

                // Analyze
                const hasHeader = !!json.header;
                const hasStructure = !!(json.skills && json.attributes);
                const hasLibrary = !!(json.library && Array.isArray(json.library) && json.library.length > 0);
                const hasSkillLibrary = !!(json.skillLibrary && Array.isArray(json.skillLibrary) && json.skillLibrary.length > 0);
                const hasSpecLibrary = !!(json.specializationLibrary && Array.isArray(json.specializationLibrary) && json.specializationLibrary.length > 0);

                const fileVersion = json.appVersion;
                const versionMismatch = fileVersion !== APP_VERSION;
                const isFilled = (json.header && json.header.name) || (json.experience && parseInt(json.experience.spent) > 0);
                const hasAnyLib = hasLibrary || hasSkillLibrary || hasSpecLibrary;

                if (!hasStructure && !hasAnyLib) {
                    alert("Ce fichier ne semble pas être compatible (aucune donnée reconnue).");
                    return;
                }

                setPendingFile(json);
                setAnalysis({ hasHeader, hasStructure, hasLibrary, hasSkillLibrary, hasSpecLibrary, isFilled, fileVersion, versionMismatch });

                // Auto-select action based on context
                if (variant === 'player') {
                    setImportAction('replace_all');
                } else {
                    setImportAction('');
                }

                if (fileInputRef.current) fileInputRef.current.value = "";

            } catch (error) {
                console.error(error);
                alert("Erreur de lecture du fichier JSON.");
            }
        };
        reader.readAsText(file);
    };


    const executeImport = async () => {
        if (!pendingFile || !importAction) return;

        // --- CONFLICT CHECK FOR MERGES ---
        if ((['skill_lib_merge', 'lib_merge', 'all_libs_merge'].includes(importAction)) && !isResolvingConflicts) {
            let checkSkills = importAction.includes('skill') || importAction.includes('all');
            let checkTraits = importAction.includes('lib_merge') || importAction.includes('all');

            const currentSkills = checkSkills ? (data.skillLibrary || []) : [];
            const incomingSkills = checkSkills ? (pendingFile.skillLibrary || []) : [];

            const currentTraits = checkTraits ? (data.library || []) : [];
            const incomingTraits = checkTraits ? (pendingFile.library || []) : [];

            const currentSpecs = checkTraits ? (data.specializationLibrary || []) : []; // Or checkSpecs...
            const incomingSpecs = checkTraits ? (pendingFile.specializationLibrary || []) : [];

            const detected = detectConflicts(currentSkills, incomingSkills, currentTraits, incomingTraits, currentSpecs, incomingSpecs);

            if (detected.length > 0) {
                setConflicts(detected);

                // Pre-fill resolution map with 'keep_current'
                const initialMap: Record<string, 'keep_current' | 'replace'> = {};
                detected.forEach(c => initialMap[c.key] = 'keep_current');
                setResolutionMap(initialMap);

                setIsResolvingConflicts(true);
                return; // STOP HERE -> Render Conflict UI
            }
        }

        // --- PROCEED WITH IMPORT ---

        let finalData = { ...data };
        let logMsg = "";

        const processImportedData = async (dataObj: any) => {
            // 1. Character Image
            if (dataObj.page2 && dataObj.page2.characterImage && dataObj.page2.characterImage.length > 100) {
                try {
                    const blob = await base64ToBlob(dataObj.page2.characterImage);
                    const newId = await saveImage(blob);
                    dataObj.page2.characterImageId = newId;
                    dataObj.page2.characterImage = "";
                } catch (e) {
                    console.error("Failed to import character image to DB", e);
                }
            }
            // 2. Campaign Note Images
            if (dataObj.campaignNotes) {
                for (const note of dataObj.campaignNotes) {
                    if (note.images && Array.isArray(note.images)) {
                        for (const img of note.images) {
                            if (img.base64Data) {
                                try {
                                    const blob = await base64ToBlob(img.base64Data);
                                    const newId = await saveImage(blob);
                                    img.imageId = newId;
                                    delete img.base64Data;
                                } catch (e) {
                                    console.error("Failed to import note image to DB", e);
                                }
                            }
                        }
                    }
                }
            }
            return dataObj;
        };

        // --- IMPORT ACTIONS HANDLING ---

        if (importAction === 'replace_all') {
            finalData = await processImportedData(pendingFile);
            if (!finalData.library) finalData.library = [];
            if (!finalData.skillLibrary) finalData.skillLibrary = [];
            if (!finalData.specializationLibrary) finalData.specializationLibrary = [];
            logMsg = "Remplacement complet du personnage.";
        }
        else if (importAction === 'system') {
            const template = createTemplateFromData(pendingFile);
            finalData = template;
            if (pendingFile.library) finalData.library = pendingFile.library;
            else finalData.library = [];
            if (pendingFile.skillLibrary) finalData.skillLibrary = pendingFile.skillLibrary;
            else finalData.skillLibrary = [];
            if (pendingFile.specializationLibrary) finalData.specializationLibrary = pendingFile.specializationLibrary;
            else finalData.specializationLibrary = [];

            logMsg = "Chargement du Système (Template + Bibliothèques).";
        }
        else if (importAction === 'template') {
            const template = createTemplateFromData(pendingFile);
            finalData = template;
            finalData.library = data.library || [];
            finalData.skillLibrary = data.skillLibrary || [];
            finalData.specializationLibrary = data.specializationLibrary || [];
            logMsg = "Chargement du Template. Bibliothèques conservées.";
        }

        // TRAITS ACTIONS
        else if (importAction === 'lib_replace') {
            finalData.library = pendingFile.library || [];
            logMsg = "Remplacement de la Bibliothèque de Traits.";
        }
        else if (importAction === 'lib_merge') {
            finalData.library = smartMerge(data.library || [], pendingFile.library || [], resolutionMap, 'trait');
            logMsg = "Fusion de la Bibliothèque de Traits.";
        }

        // SKILLS ACTIONS
        else if (importAction === 'skill_lib_replace') {
            finalData.skillLibrary = pendingFile.skillLibrary || [];
            logMsg = "Remplacement de la Réserve de Compétences.";
        }
        else if (importAction === 'skill_lib_merge') {
            finalData.skillLibrary = smartMerge(data.skillLibrary || [], pendingFile.skillLibrary || [], resolutionMap, 'skill');
            logMsg = "Fusion de la Réserve de Compétences.";
        }

        // SPECIALIZATION ACTIONS
        else if (importAction === 'spec_lib_replace') {
            finalData.specializationLibrary = pendingFile.specializationLibrary || [];
            logMsg = "Remplacement du Catalogue de Spécialisations.";
        }
        else if (importAction === 'spec_lib_merge') {
            finalData.specializationLibrary = smartMerge(data.specializationLibrary || [], pendingFile.specializationLibrary || [], resolutionMap, 'specialization');
            logMsg = "Fusion du Catalogue de Spécialisations.";
        }

        // COMBINED ACTIONS
        else if (importAction === 'all_libs_replace') {
            if (pendingFile.library) finalData.library = pendingFile.library;
            if (pendingFile.skillLibrary) finalData.skillLibrary = pendingFile.skillLibrary;
            if (pendingFile.specializationLibrary) finalData.specializationLibrary = pendingFile.specializationLibrary;
            logMsg = "Remplacement de toutes les bibliothèques.";
        }
        else if (importAction === 'all_libs_merge') {
            if (pendingFile.library) {
                finalData.library = smartMerge(data.library || [], pendingFile.library || [], resolutionMap, 'trait');
            }
            if (pendingFile.skillLibrary) {
                finalData.skillLibrary = smartMerge(data.skillLibrary || [], pendingFile.skillLibrary || [], resolutionMap, 'skill');
            }
            if (pendingFile.specializationLibrary) {
                finalData.specializationLibrary = smartMerge(data.specializationLibrary || [], pendingFile.specializationLibrary || [], resolutionMap, 'specialization');
            }
            logMsg = "Fusion de toutes les bibliothèques.";
        }

        if (Object.keys(resolutionMap).length > 0) {
            logMsg += ` (${Object.keys(resolutionMap).length} conflits résolus)`;
        }

        importData(finalData);
        if (onImportSuccess) onImportSuccess(finalData);
        onAddLog(logMsg, 'success', 'both');
        handleClose();
    };

    const handleClose = () => {
        setPendingFile(null);
        setAnalysis(null);
        setImportAction('');
        setConflicts([]);
        setIsResolvingConflicts(false);
        onClose();
    };

    // --- CONFLICT RESOLUTION UI ---
    const handleResolutionChoice = (key: string, choice: 'keep_current' | 'replace') => {
        setResolutionMap(prev => ({ ...prev, [key]: choice }));
    };

    const resolveAll = (choice: 'keep_current' | 'replace') => {
        const newMap: Record<string, 'keep_current' | 'replace'> = {};
        conflicts.forEach(c => newMap[c.key] = choice);
        setResolutionMap(newMap);
    };

    // -- Render Helpers --
    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title={variant === 'gm' ? "Gestion de Campagne (GM)" : "Grimoire de Sauvegarde"}
            icon={<Save size={24} />}
            size="lg"
            footer={
                <div className="w-full flex justify-between items-center text-xs text-stone-500">
                    <span>Un grand pouvoir implique une grande responsabilité de sauvegarde.</span>
                    <span>v{APP_VERSION}</span>
                </div>
            }
        >
            <div className="flex flex-col h-full gap-6">

                {/* Tabs */}
                <div className="flex gap-2 border-b-2 border-[#bfae85]/50 pb-2 mb-2">
                    <button
                        onClick={() => setActiveTab('export')}
                        className={`px-4 py-2 font-serif font-bold text-lg transition-colors rounded-t-lg ${activeTab === 'export' ? 'bg-[#8b2e2e] text-[#fdfbf7]' : 'hover:bg-[#bfae85]/20 text-[#5c4d41]'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Download size={20} />
                            Exportation
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`px-4 py-2 font-serif font-bold text-lg transition-colors rounded-t-lg ${activeTab === 'import' ? 'bg-[#8b2e2e] text-[#fdfbf7]' : 'hover:bg-[#bfae85]/20 text-[#5c4d41]'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Upload size={20} />
                            Importation
                        </div>
                    </button>
                </div>

                {/* --- CONFLICT RESOLUTION OVERLAY --- */}
                {isResolvingConflicts && (
                    <ConflictResolver
                        conflicts={conflicts}
                        resolutionMap={resolutionMap}
                        onResolutionChoice={handleResolutionChoice}
                        onResolveAll={resolveAll}
                        onCancel={() => setIsResolvingConflicts(false)}
                        onConfirm={executeImport}
                    />
                )}

                {/* --- EXPORT TAB CONTENT --- */}
                {activeTab === 'export' && !isResolvingConflicts && (
                    <div className="flex-1 bg-slate-50 p-6 flex flex-col animate-in fade-in duration-300">
                        <div className="space-y-3 flex-grow overflow-y-auto custom-scrollbar">
                            {/* ... Existing Export Content ... */}
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
                )}

                {/* --- IMPORT TAB CONTENT --- */}
                {activeTab === 'import' && !isResolvingConflicts && (
                    <div className="flex-1 bg-white p-6 flex flex-col animate-in fade-in duration-300">
                        {!pendingFile ? (
                            <div className="flex-grow flex flex-col justify-center items-center text-center space-y-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-8 hover:bg-orange-50 hover:border-orange-300 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                                <div className="p-5 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-orange-500 transition-colors">
                                    <Upload size={48} />
                                </div>
                                <div>
                                    <p className="text-lg text-slate-700 font-bold mb-2">
                                        Cliquez pour sélectionner un fichier
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Accepte les fichiers <code>.json</code>
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept=".json"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <button
                                    className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-full font-bold hover:bg-white hover:text-orange-600 hover:border-orange-400 transition-colors shadow-sm pointer-events-none"
                                >
                                    Parcourir...
                                </button>
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Analysis Header */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4 flex gap-3 text-sm text-blue-900 flex-col">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="font-bold block mb-1">Contenu détecté dans le fichier :</span>
                                            <div className="flex gap-2 flex-wrap mt-2">
                                                {analysis?.hasStructure && <span className="bg-white border border-blue-200 px-2 py-1 rounded flex items-center gap-1 shadow-sm"><LayoutTemplate size={12} /> Structure</span>}
                                                {analysis?.hasLibrary && <span className="bg-white border border-blue-200 px-2 py-1 rounded flex items-center gap-1 shadow-sm"><BookOpen size={12} /> Traits</span>}
                                                {analysis?.hasSkillLibrary && <span className="bg-white border border-blue-200 px-2 py-1 rounded flex items-center gap-1 shadow-sm"><GraduationCap size={12} /> Compétences</span>}
                                                {analysis?.hasSpecLibrary && <span className="bg-white border border-blue-200 px-2 py-1 rounded flex items-center gap-1 shadow-sm"><Award size={12} /> Spécialisations</span>}
                                                {analysis?.isFilled && <span className="bg-white border border-blue-200 px-2 py-1 rounded flex items-center gap-1 shadow-sm"><User size={12} /> Données Joueur</span>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setPendingFile(null); setAnalysis(null); }}
                                            className="text-slate-400 hover:text-red-500 p-1"
                                            title="Changer de fichier"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                {isGM && (
                                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                        Choisir une action
                                    </h4>
                                )}

                                <div className="flex-grow overflow-y-auto pr-1">
                                    <ImportOptionsSection
                                        analysis={analysis}
                                        variant={variant}
                                        importAction={importAction}
                                        onActionChange={setImportAction}
                                    />
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <button
                                        onClick={executeImport}
                                        disabled={!importAction}
                                        className="w-full py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all"
                                    >
                                        <CheckCircle2 size={20} />
                                        {variant === 'player' ? 'Confirmer le chargement' : "Confirmer l'importation"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </ThematicModal>
    );
};

export default ImportExportModal;
