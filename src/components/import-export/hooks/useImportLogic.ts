import { useState, useRef } from 'react';
import { CharacterSheetData } from '../../../types';
import { useNotification } from '../../../context/NotificationContext';
import { useCharacter } from '../../../context/CharacterContext';
import { APP_VERSION } from '../../../constants';
import { createTemplateFromData, detectConflicts, smartMerge, DataConflict } from '../../../utils/importExportUtils';
import { base64ToBlob, saveImage } from '../../../imageDB';
import { ErrorService } from '../../../services/ErrorService';

export interface FileAnalysis {
    hasHeader: boolean;
    hasStructure: boolean;
    hasLibrary: boolean;
    hasSkillLibrary: boolean;
    hasSpecLibrary: boolean;
    isFilled: boolean;
    fileVersion?: string;
    versionMismatch: boolean;
}

interface UseImportLogicProps {
    data: CharacterSheetData;
    variant: 'player' | 'gm';
    onImportSuccess?: (newData: CharacterSheetData) => void;
    onClose: () => void;
}

export function useImportLogic({ data, variant, onImportSuccess, onClose }: UseImportLogicProps) {
    const { importData } = useCharacter();
    const addLog = useNotification();

    const [pendingFile, setPendingFile] = useState<Partial<CharacterSheetData> | null>(null);
    const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
    const [importAction, setImportAction] = useState<string>('');

    // Conflict Resolution State
    const [conflicts, setConflicts] = useState<DataConflict[]>([]);
    const [resolutionMap, setResolutionMap] = useState<Record<string, 'keep_current' | 'replace'>>({});
    const [isResolvingConflicts, setIsResolvingConflicts] = useState(false);

    // Migration Status
    const [migrationReport, setMigrationReport] = useState<{ oldVersion: string; newVersion: string } | null>(null);

    const checkFileCompatibility = (json: any) => {
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
            return null;
        }

        return { hasHeader, hasStructure, hasLibrary, hasSkillLibrary, hasSpecLibrary, isFilled, fileVersion, versionMismatch };
    };

    const handleFileLoad = (json: any) => {
        try {
            const analysisResult = checkFileCompatibility(json);
            if (!analysisResult) return;

            setPendingFile(json);
            setAnalysis(analysisResult);

            if (variant === 'player') {
                setImportAction('replace_all');
            } else {
                setImportAction('');
            }
        } catch (error) {
            ErrorService.handleError(error, { context: 'useImportLogic.handleFileLoad', userMessage: "Erreur lors de l'analyse du fichier." });
            addLog("Erreur lors de l'analyse du fichier.", 'danger', 'both');
        }
    };

    const processImportedData = async (dataObj: Partial<CharacterSheetData>) => {
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
                        // Cast img to check for base64Data which comes from JSON but isn't in standard type yet (unless we added it)
                        // We added base64Data to NoteImage, so it should be fine if typed correctly.
                        // But img here comes from parsed json so it's 'any' implicitly inside the loop if note.images is NoteImage[]?
                        // No, Partial<CharacterSheetData> implies typed children.
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

    const executeImport = async () => {
        if (!pendingFile || !importAction) return;

        const importedFile: any = pendingFile;
        // --- CONFLICT CHECK FOR MERGES ---
        if ((['skill_lib_merge', 'lib_merge', 'all_libs_merge'].includes(importAction)) && !isResolvingConflicts) {
            let checkSkills = importAction.includes('skill') || importAction.includes('all');
            let checkTraits = importAction.includes('lib_merge') || importAction.includes('all');

            const currentSkills = checkSkills ? (data.skillLibrary || []) : [];
            const incomingSkills = checkSkills ? (importedFile.skillLibrary || []) : [];

            const currentTraits = checkTraits ? (data.library || []) : [];
            const incomingTraits = checkTraits ? (importedFile.library || []) : [];

            const currentSpecs = checkTraits ? (data.specializationLibrary || []) : [];
            const incomingSpecs = checkTraits ? (importedFile.specializationLibrary || []) : [];

            const detected = detectConflicts(currentSkills, incomingSkills, currentTraits, incomingTraits, currentSpecs, incomingSpecs);

            if (detected.length > 0) {
                setConflicts(detected);

                // Pre-fill resolution map with 'keep_current'
                const initialMap: Record<string, 'keep_current' | 'replace'> = {};
                detected.forEach(c => initialMap[c.key] = 'keep_current');
                setResolutionMap(initialMap);

                setIsResolvingConflicts(true);
                return;
            }
        }

        // --- PROCEED WITH IMPORT ---

        let finalData = { ...data };
        let logMsg = "";

        if (importAction === 'replace_all') {
            finalData = (await processImportedData(pendingFile!)) as CharacterSheetData;
            if (!finalData.library) finalData.library = [];
            if (!finalData.skillLibrary) finalData.skillLibrary = [];
            if (!finalData.specializationLibrary) finalData.specializationLibrary = [];
            logMsg = "Remplacement complet du personnage.";
        }
        else if (importAction === 'system') {
            const template = createTemplateFromData(importedFile);
            finalData = template;
            if (importedFile.library) finalData.library = importedFile.library as any;
            else finalData.library = [];
            if (importedFile.skillLibrary) finalData.skillLibrary = importedFile.skillLibrary as any;
            else finalData.skillLibrary = [];
            if (importedFile.specializationLibrary) finalData.specializationLibrary = importedFile.specializationLibrary as any;
            else finalData.specializationLibrary = [];

            logMsg = "Chargement du Système (Template + Bibliothèques).";
        }
        else if (importAction === 'template') {
            const template = createTemplateFromData(importedFile);
            finalData = template;
            finalData.library = data.library || [];
            finalData.skillLibrary = data.skillLibrary || [];
            finalData.specializationLibrary = data.specializationLibrary || [];
            logMsg = "Chargement du Template. Bibliothèques conservées.";
        }

        // TRAITS ACTIONS
        else if (importAction === 'lib_replace') {
            finalData.library = importedFile.library as any || [];
            logMsg = "Remplacement de la Bibliothèque de Traits.";
        }
        else if (importAction === 'lib_merge') {
            finalData.library = smartMerge(data.library || [], (importedFile.library || []) as any[], resolutionMap, 'trait');
            logMsg = "Fusion de la Bibliothèque de Traits.";
        }

        // SKILLS ACTIONS
        else if (importAction === 'skill_lib_replace') {
            finalData.skillLibrary = importedFile.skillLibrary as any || [];
            logMsg = "Remplacement de la Réserve de Compétences.";
        }
        else if (importAction === 'skill_lib_merge') {
            finalData.skillLibrary = smartMerge(data.skillLibrary || [], (importedFile.skillLibrary || []) as any[], resolutionMap, 'skill');
            logMsg = "Fusion de la Réserve de Compétences.";
        }

        // SPECIALIZATION ACTIONS
        else if (importAction === 'spec_lib_replace') {
            finalData.specializationLibrary = importedFile.specializationLibrary as any || [];
            logMsg = "Remplacement du Catalogue de Spécialisations.";
        }
        else if (importAction === 'spec_lib_merge') {
            finalData.specializationLibrary = smartMerge(data.specializationLibrary || [], (importedFile.specializationLibrary || []) as any[], resolutionMap, 'specialization');
            logMsg = "Fusion du Catalogue de Spécialisations.";
        }

        // COMBINED ACTIONS
        else if (importAction === 'all_libs_replace') {
            if (importedFile.library) finalData.library = importedFile.library as any;
            if (importedFile.skillLibrary) finalData.skillLibrary = importedFile.skillLibrary as any;
            if (importedFile.specializationLibrary) finalData.specializationLibrary = importedFile.specializationLibrary as any;
            logMsg = "Remplacement de toutes les bibliothèques.";
        }
        else if (importAction === 'all_libs_merge') {
            if (importedFile.library) {
                finalData.library = smartMerge(data.library || [], (importedFile.library || []) as any[], resolutionMap, 'trait');
            }
            if (importedFile.skillLibrary) {
                finalData.skillLibrary = smartMerge(data.skillLibrary || [], (importedFile.skillLibrary || []) as any[], resolutionMap, 'skill');
            }
            if (importedFile.specializationLibrary) {
                finalData.specializationLibrary = smartMerge(data.specializationLibrary || [], (importedFile.specializationLibrary || []) as any[], resolutionMap, 'specialization');
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

    return {
        pendingFile,
        setPendingFile,
        analysis,
        setAnalysis,
        importAction,
        setImportAction,
        conflicts,
        resolutionMap,
        isResolvingConflicts,
        setIsResolvingConflicts,
        migrationReport,
        handleFileLoad,
        executeImport,
        handleSuccessClose,
        handleResolutionChoice,
        resolveAll
    };
}
