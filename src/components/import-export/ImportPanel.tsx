
import React, { useState, useRef, useEffect } from 'react';
import { CharacterSheetData } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { useCharacter } from '../../context/CharacterContext';
import { APP_VERSION } from '../../constants';
import { Upload, FileBox, LayoutTemplate, BookOpen, GraduationCap, Award, User, X, CheckCircle2, AlertTriangle, Download, ArrowRight } from 'lucide-react';
import { createTemplateFromData, detectConflicts, smartMerge, DataConflict } from '../../utils/importExportUtils';
import { base64ToBlob, saveImage } from '../../imageDB';
import ImportOptionsSection from './ImportOptionsSection';
import CloudConflictResolver from './CloudConflictResolver';
import ThematicButton from '../ui/ThematicButton';
import ThematicModal from '../ui/ThematicModal';
import { ImageCompressionService } from '../../services/ImageCompressionService';
import { ErrorService } from '../../services/ErrorService';

interface ImportPanelProps {
    data: CharacterSheetData; // Current data for merging/conflict detection
    variant: 'player' | 'gm';
    onImportSuccess?: (newData: CharacterSheetData) => void;
    onClose: () => void;
    onRequestExport?: () => void;
}

interface FileAnalysis {
    hasHeader: boolean;
    hasStructure: boolean;
    hasLibrary: boolean;
    hasSkillLibrary: boolean;
    hasSpecLibrary: boolean;
    isFilled: boolean;
    fileVersion?: string;
    versionMismatch: boolean;
}

const ImportPanel: React.FC<ImportPanelProps> = ({ data, variant, onImportSuccess, onClose, onRequestExport }) => {
    const { importData } = useCharacter();
    const addLog = useNotification();

    const [pendingFile, setPendingFile] = useState<any | null>(null);
    const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
    const [importAction, setImportAction] = useState<string>('');

    // Conflict Resolution State
    const [conflicts, setConflicts] = useState<DataConflict[]>([]);
    const [resolutionMap, setResolutionMap] = useState<Record<string, 'keep_current' | 'replace'>>({});
    const [isResolvingConflicts, setIsResolvingConflicts] = useState(false);

    // Migration Status
    const [migrationReport, setMigrationReport] = useState<{ oldVersion: string; newVersion: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const isGM = variant === 'gm';

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
                    addLog("Ce fichier ne semble pas être compatible (aucune donnée reconnue).", 'danger', 'both');
                    return;
                }

                // --- PRESERVE COMPRESSION IN IMPORT DATA ---
                // We no longer decompress here to avoid generation loss during next export.
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
                ErrorService.handleError(error, { context: 'ImportPanel.parse', userMessage: "Erreur de lecture du fichier JSON." });
                addLog("Erreur de lecture du fichier JSON.", 'danger', 'both');
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

            // TODO: Add spec library conflict check if needed in future (currently not implemented in detectConflicts)
            const currentSpecs = checkTraits ? (data.specializationLibrary || []) : [];
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
                    ErrorService.handleError(e, { context: 'ImportPanel.importCharImage', silent: true });
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
                                    ErrorService.handleError(e, { context: 'ImportPanel.importNoteImage', silent: true });
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

        if (analysis?.versionMismatch) {
            addLog(`${logMsg} (Migration effectuée). Nous vous conseillons de sauvegarder votre personnage immédiatement.`, 'success', 'both');
            setMigrationReport({
                oldVersion: analysis.fileVersion || 'Inconnue',
                newVersion: APP_VERSION
            });
            // Don't close immediately here, show report
        } else {
            addLog(logMsg, 'success', 'both');
            onClose();
        }
    };

    const handleSuccessClose = () => {
        setMigrationReport(null);
        onClose();
    };

    const handleResolutionChoice = (key: string, choice: 'keep_current' | 'replace') => {
        setResolutionMap(prev => ({ ...prev, [key]: choice }));
    };

    const resolveAll = (choice: 'keep_current' | 'replace') => {
        const newMap: Record<string, 'keep_current' | 'replace'> = {};
        conflicts.forEach(c => newMap[c.key] = choice);
        setResolutionMap(newMap);
    };

    if (isResolvingConflicts) {
        return (
            <CloudConflictResolver
                conflicts={conflicts}
                resolutionMap={resolutionMap}
                onResolutionChoice={handleResolutionChoice}
                onResolveAll={resolveAll}
                onCancel={() => setIsResolvingConflicts(false)}
                onConfirm={executeImport}
            />
        );
    }

    // --- RENDER ---

    return (
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
                        {analysis && (
                            <ImportOptionsSection
                                analysis={analysis}
                                variant={variant}
                                importAction={importAction}
                                onActionChange={setImportAction}
                            />
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <button
                            onClick={executeImport}
                            disabled={!importAction}
                            className="w-full py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all"
                        >
                            <CheckCircle2 size={20} />
                            {variant === 'player' ? 'Confirmer le chargement' : "Confirmer le chargement"}
                        </button>
                    </div>
                </div>
            )}

            {/* --- MIGRATION SUCCESS MODAL VIA NESTED MODAL (OR OVERLAY) --- */}
            {migrationReport && (
                <ThematicModal
                    isOpen={!!migrationReport}
                    onClose={handleSuccessClose}
                    title="Migration Réussie"
                    icon={<CheckCircle2 size={24} className="text-green-600" />}
                    size="md"
                    footer={
                        <div className="flex gap-3">
                            <ThematicButton variant="secondary" onClick={handleSuccessClose}>
                                Plus tard
                            </ThematicButton>
                            <ThematicButton variant="primary" onClick={() => {
                                if (onRequestExport) onRequestExport();
                                handleSuccessClose();
                            }}>
                                Sauvegarder maintenant
                            </ThematicButton>
                        </div>
                    }
                >
                    <div className="flex flex-col items-center text-center space-y-4 py-4">
                        <div className="bg-green-100 p-4 rounded-full text-green-600 mb-2 animate-bounce">
                            <Download size={32} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-bold text-slate-800">Votre personnage a été mis à jour !</p>
                            <div className="flex items-center justify-center gap-2 text-xs font-mono bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                                <span>v{migrationReport?.oldVersion}</span>
                                <ArrowRight size={12} />
                                <span className="font-bold text-blue-600">v{migrationReport?.newVersion}</span>
                            </div>
                            <p className="text-sm text-slate-600 max-w-sm">
                                Toutes les anciennes données ont été migrées vers le nouveau format.
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 text-left">
                            <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                            <div className="text-xs text-amber-900 leading-relaxed">
                                <span className="font-bold block mb-1">⚠️ Action recommandée</span>
                                Nous vous conseillons de sauvegarder votre personnage immédiatement.
                            </div>
                        </div>
                    </div>
                </ThematicModal>
            )}
        </div>
    );
};

export default ImportPanel;
