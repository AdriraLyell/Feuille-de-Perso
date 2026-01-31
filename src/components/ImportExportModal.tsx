
import React, { useState, useRef, useEffect } from 'react';
import { CharacterSheetData, LibraryEntry, LibrarySkillEntry } from '../types';
import { Download, Upload, AlertTriangle, BookOpen, User, LayoutTemplate, X, CheckCircle2, Merge, RefreshCw, FileBox, GraduationCap, Layers, Shield, Settings, ArrowRight, AlertOctagon, ArrowDown, Zap, Save } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useCharacter } from '../context/CharacterContext';
import ThematicModal from './ui/ThematicModal';
import ThematicButton from './ui/ThematicButton';
import { APP_VERSION } from '../constants';
import { getImage, saveImage, blobToBase64, base64ToBlob } from '../imageDB';

interface ImportExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExportSuccess?: () => void;
    onImportSuccess?: (newData: CharacterSheetData) => void; // Remplace onImport pour notifier le parent
    variant: 'player' | 'gm';
}

// Updated Export Types to include new options
type ExportType = 'full' | 'system' | 'template' | 'library_traits' | 'library_skills' | 'library_all';

interface FileAnalysis {
    hasHeader: boolean;
    hasStructure: boolean; // Skills, Attributes
    hasLibrary: boolean; // Traits
    hasSkillLibrary: boolean; // Skill Reserve
    isFilled: boolean; // Guess if it's a played character (has values)
    fileVersion?: string;
    versionMismatch: boolean;
}

// Generic Conflict Interface
interface DataConflict {
    type: 'skill' | 'trait';
    key: string; // Unique key for map (e.g. "skill_acrobatie")
    name: string;
    current: any;
    incoming: any;
}

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

    // --- LOGIC: RESET / CLEANING ---
    const createTemplateFromData = (source: CharacterSheetData): CharacterSheetData => {
        const clean = JSON.parse(JSON.stringify(source));

        // Reset Header
        Object.keys(clean.header).forEach(k => clean.header[k] = "");

        // Reset XP
        clean.experience = { gain: '0', spent: '0', rest: '0' };
        clean.xpLogs = [];
        clean.appLogs = [];

        // Reset Attributes Values
        if (clean.attributes) {
            Object.keys(clean.attributes).forEach(cat => {
                if (Array.isArray(clean.attributes[cat])) {
                    // @ts-ignore
                    clean.attributes[cat].forEach((attr: any) => {
                        attr.val1 = ""; attr.val2 = ""; attr.val3 = "";
                        attr.creationVal1 = 0; attr.creationVal2 = 0; attr.creationVal3 = 0;
                    });
                }
            });
        }

        // Reset Skills Values
        Object.keys(clean.skills).forEach(cat => {
            // @ts-ignore
            clean.skills[cat].forEach((skill: any) => {
                skill.value = 0;
                skill.creationValue = 0;
                skill.current = 0;
            });
        });

        // Reset Combat
        clean.combat.weapons.forEach((w: any) => { w.weapon = ""; w.level = ""; w.init = ""; w.attack = ""; w.damage = ""; w.parry = ""; });
        clean.combat.armor.forEach((a: any) => { a.type = ""; a.protection = ""; a.weight = ""; });
        clean.combat.stats = { agility: '', dexterity: '', force: '', size: '' };

        // Reset Page 2 Details
        clean.page2.lieux_importants = "";
        clean.page2.contacts = "";
        clean.page2.reputation.fill({ reputation: '', lieu: '', valeur: '' });
        clean.page2.connaissances = "";
        clean.page2.valeurs_monetaires = "";
        clean.page2.armes_list = "";
        clean.page2.avantages.fill({ name: '', value: '' });
        clean.page2.desavantages.fill({ name: '', value: '' });
        clean.page2.equipement = "";
        clean.page2.notes = "";
        clean.page2.characterImage = "";
        clean.page2.characterImageId = undefined;

        // Reset Specializations
        clean.specializations = {};

        // Counters
        clean.counters.volonte.value = 3; clean.counters.volonte.current = 0;
        clean.counters.confiance.value = 3; clean.counters.confiance.current = 0;
        clean.counters.custom.forEach((c: any) => { c.value = 0; c.current = 0; });

        // Disable creation mode
        clean.creationConfig.active = false;

        return clean;
    };

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
                filename = `${timestamp}_Systeme_Jeu`;
                break;
            case 'template':
                exportData = template;
                delete exportData.library;
                delete exportData.skillLibrary;
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
            case 'library_all':
                exportData = { library: data.library, skillLibrary: data.skillLibrary, appVersion: APP_VERSION };
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

                const fileVersion = json.appVersion;
                const versionMismatch = fileVersion !== APP_VERSION;
                const isFilled = (json.header && json.header.name) || (json.experience && parseInt(json.experience.spent) > 0);

                if (!hasStructure && !hasLibrary && !hasSkillLibrary) {
                    alert("Ce fichier ne semble pas être compatible (aucune donnée reconnue).");
                    return;
                }

                setPendingFile(json);
                setAnalysis({ hasHeader, hasStructure, hasLibrary, hasSkillLibrary, isFilled, fileVersion, versionMismatch });

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

    // --- HELPER: Conflict Detection ---
    const detectConflicts = (
        currentSkills: LibrarySkillEntry[],
        incomingSkills: LibrarySkillEntry[],
        currentTraits: LibraryEntry[],
        incomingTraits: LibraryEntry[]
    ) => {
        const conflicts: DataConflict[] = [];

        // 1. Detect Skill Conflicts
        const currentSkillMap = new Map(currentSkills.map(s => [s.name.trim().toLowerCase(), s]));
        incomingSkills.forEach(newItem => {
            const normName = newItem.name.trim().toLowerCase();
            if (currentSkillMap.has(normName)) {
                const existingItem = currentSkillMap.get(normName)!;
                const desc1 = (existingItem.description || '').trim();
                const desc2 = (newItem.description || '').trim();

                if (desc1 !== desc2) {
                    conflicts.push({
                        type: 'skill',
                        key: `skill_${normName}`,
                        name: existingItem.name,
                        current: existingItem,
                        incoming: newItem
                    });
                }
            }
        });

        // 2. Detect Trait Conflicts
        const currentTraitMap = new Map(currentTraits.map(t => [t.name.trim().toLowerCase(), t]));
        incomingTraits.forEach(newItem => {
            const normName = newItem.name.trim().toLowerCase();
            if (currentTraitMap.has(normName)) {
                const existingItem = currentTraitMap.get(normName)!;

                // Check significant differences: Description, Cost, Type, Effects
                const diffDesc = (existingItem.description || '').trim() !== (newItem.description || '').trim();
                const diffCost = existingItem.cost !== newItem.cost;
                const diffType = existingItem.type !== newItem.type;
                const diffEffects = JSON.stringify(existingItem.effects || []) !== JSON.stringify(newItem.effects || []);

                if (diffDesc || diffCost || diffType || diffEffects) {
                    conflicts.push({
                        type: 'trait',
                        key: `trait_${normName}`,
                        name: existingItem.name,
                        current: existingItem,
                        incoming: newItem
                    });
                }
            }
        });

        return conflicts;
    };

    // --- HELPER: Generic Smart Merge ---
    const smartMerge = <T extends { name: string }>(
        current: T[],
        incoming: T[],
        resolutions: Record<string, 'keep_current' | 'replace'>,
        prefix: 'skill' | 'trait'
    ) => {
        const currentMap = new Map(current.map(s => [s.name.trim().toLowerCase(), s]));
        const finalMap = new Map<string, T>();

        // 1. Add all existing
        current.forEach(s => {
            finalMap.set(s.name.trim().toLowerCase(), s);
        });

        // 2. Process incoming
        incoming.forEach(newItem => {
            const normName = newItem.name.trim().toLowerCase();
            const resolutionKey = `${prefix}_${normName}`;

            if (finalMap.has(normName)) {
                // Conflict or Duplicate
                const decision = resolutions[resolutionKey];
                if (decision === 'replace') {
                    finalMap.set(normName, newItem); // Overwrite
                }
                // If decision is 'keep_current' or undefined (duplicate without conflict), do nothing
            } else {
                // New Item
                finalMap.set(normName, newItem);
            }
        });

        return Array.from(finalMap.values()).sort((a, b) => a.name.localeCompare(b.name));
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

            const detected = detectConflicts(currentSkills, incomingSkills, currentTraits, incomingTraits);

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
            logMsg = "Remplacement complet du personnage.";
        }
        else if (importAction === 'system') {
            const template = createTemplateFromData(pendingFile);
            finalData = template;
            if (pendingFile.library) finalData.library = pendingFile.library;
            else finalData.library = [];
            if (pendingFile.skillLibrary) finalData.skillLibrary = pendingFile.skillLibrary;
            else finalData.skillLibrary = [];

            logMsg = "Chargement du Système (Template + Bibliothèques).";
        }
        else if (importAction === 'template') {
            const template = createTemplateFromData(pendingFile);
            finalData = template;
            finalData.library = data.library || [];
            finalData.skillLibrary = data.skillLibrary || [];
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

        // COMBINED ACTIONS
        else if (importAction === 'all_libs_replace') {
            if (pendingFile.library) finalData.library = pendingFile.library;
            if (pendingFile.skillLibrary) finalData.skillLibrary = pendingFile.skillLibrary;
            logMsg = "Remplacement de toutes les bibliothèques.";
        }
        else if (importAction === 'all_libs_merge') {
            if (pendingFile.library) {
                finalData.library = smartMerge(data.library || [], pendingFile.library || [], resolutionMap, 'trait');
            }
            if (pendingFile.skillLibrary) {
                finalData.skillLibrary = smartMerge(data.skillLibrary || [], pendingFile.skillLibrary || [], resolutionMap, 'skill');
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
        const newMap = { ...resolutionMap };
        conflicts.forEach(c => newMap[c.key] = choice);
        setResolutionMap(newMap);
    };

    const renderConflictResolution = () => {
        return (
            <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-amber-50 p-4 border-b border-amber-200">
                    <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                        <AlertOctagon size={20} />
                        Conflits détectés ({conflicts.length})
                    </h4>
                    <p className="text-xs text-amber-800 mb-3">
                        Des éléments portent le même nom mais ont des propriétés différentes. Choisissez quelle version conserver.
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => resolveAll('keep_current')} className="text-xs bg-white border border-amber-300 text-amber-900 px-3 py-1 rounded hover:bg-amber-100 transition-colors">
                            Tout garder (Ma version)
                        </button>
                        <button onClick={() => resolveAll('replace')} className="text-xs bg-white border border-amber-300 text-amber-900 px-3 py-1 rounded hover:bg-amber-100 transition-colors">
                            Tout remplacer (Import)
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
                    {conflicts.map((conflict, idx) => {
                        const choice = resolutionMap[conflict.key] || 'keep_current';

                        return (
                            <div key={idx} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                <div className="bg-gray-100 px-4 py-2 font-bold text-sm text-gray-700 border-b border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {conflict.type === 'skill'
                                            ? <GraduationCap size={16} className="text-purple-600" />
                                            : <BookOpen size={16} className="text-blue-600" />
                                        }
                                        <span>{conflict.name}</span>
                                    </div>
                                    {conflict.type === 'trait' && (
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                            Trait : {conflict.current.type}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-gray-200">
                                    {/* Current */}
                                    <div
                                        className={`p-3 cursor-pointer transition-colors ${choice === 'keep_current' ? 'bg-blue-50 ring-2 ring-inset ring-blue-300' : 'hover:bg-gray-50'}`}
                                        onClick={() => handleResolutionChoice(conflict.key, 'keep_current')}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Ma Version</span>
                                            {choice === 'keep_current' && <CheckCircle2 size={16} className="text-blue-600" />}
                                        </div>

                                        {/* Detail Display */}
                                        <div className="text-xs text-gray-700 space-y-1">
                                            {conflict.current.description && <p className="italic">"{conflict.current.description}"</p>}
                                            {conflict.type === 'trait' && (
                                                <>
                                                    <p className="font-mono bg-gray-100 inline-block px-1 rounded">Coût: {conflict.current.cost}</p>
                                                    {conflict.current.effects?.length > 0 && (
                                                        <p className="text-amber-600 flex items-center gap-1"><Zap size={10} /> {conflict.current.effects.length} effet(s)</p>
                                                    )}
                                                </>
                                            )}
                                            {conflict.type === 'skill' && !conflict.current.description && (
                                                <p className="text-gray-400">(Pas de description)</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Incoming */}
                                    <div
                                        className={`p-3 cursor-pointer transition-colors ${choice === 'replace' ? 'bg-orange-50 ring-2 ring-inset ring-orange-300' : 'hover:bg-gray-50'}`}
                                        onClick={() => handleResolutionChoice(conflict.key, 'replace')}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Import</span>
                                            {choice === 'replace' && <CheckCircle2 size={16} className="text-orange-600" />}
                                        </div>

                                        {/* Detail Display */}
                                        <div className="text-xs text-gray-700 space-y-1">
                                            {conflict.incoming.description && <p className="italic">"{conflict.incoming.description}"</p>}
                                            {conflict.type === 'trait' && (
                                                <>
                                                    <p className="font-mono bg-gray-100 inline-block px-1 rounded">Coût: {conflict.incoming.cost}</p>
                                                    {conflict.incoming.effects?.length > 0 && (
                                                        <p className="text-amber-600 flex items-center gap-1"><Zap size={10} /> {conflict.incoming.effects.length} effet(s)</p>
                                                    )}
                                                </>
                                            )}
                                            {conflict.type === 'skill' && !conflict.incoming.description && (
                                                <p className="text-gray-400">(Pas de description)</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
                    <button onClick={() => setIsResolvingConflicts(false)} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-bold hover:bg-gray-50">Annuler</button>
                    <button
                        onClick={executeImport}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-md flex items-center gap-2"
                    >
                        Confirmer la fusion <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        );
    };

    const renderImportOptions = () => {
        if (!analysis) return null;

        // Simple Mode for Players: Only full replacement is relevant usually
        if (variant === 'player') {
            return (
                <div className="bg-orange-50 border border-orange-200 rounded p-4 text-center">
                    <User size={32} className="mx-auto text-orange-600 mb-2" />
                    <p className="font-bold text-orange-900 text-sm mb-1">Prêt à charger</p>
                    <p className="text-xs text-orange-800">
                        Ce fichier va remplacer votre personnage actuel.
                    </p>
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
                            <input type="radio" name="importAction" checked={importAction === 'replace_all'} onChange={() => setImportAction('replace_all')} className="mt-1" />
                            <div>
                                <span className="font-bold text-gray-800 flex items-center gap-2"><User size={16} /> Tout remplacer (Clone)</span>
                                <span className="text-xs text-red-600 block mt-1"><AlertTriangle size={12} className="inline mr-1" />Toutes vos données actuelles seront perdues.</span>
                            </div>
                        </label>
                        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'system' ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input type="radio" name="importAction" checked={importAction === 'system'} onChange={() => setImportAction('system')} className="mt-1" />
                            <div>
                                <span className="font-bold text-gray-800 flex items-center gap-2"><FileBox size={16} /> Système de Jeu (MJ)</span>
                                <span className="text-xs text-orange-600 block mt-1">Écrase structure et bibliothèques. Réinitialise les valeurs.</span>
                            </div>
                        </label>
                        {!analysis.hasLibrary && !analysis.hasSkillLibrary && (
                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'template' ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input type="radio" name="importAction" checked={importAction === 'template'} onChange={() => setImportAction('template')} className="mt-1" />
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
                            <input type="radio" name="importAction" checked={importAction === 'all_libs_merge'} onChange={() => setImportAction('all_libs_merge')} className="mt-1" />
                            <div>
                                <span className="font-bold text-gray-800 flex items-center gap-2"><Merge size={16} /> Tout Fusionner (Traits + Compétences)</span>
                                <span className="text-xs text-gray-600 block mt-1">Ajoute le contenu sans toucher à votre fiche.</span>
                            </div>
                        </label>
                        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'all_libs_replace' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input type="radio" name="importAction" checked={importAction === 'all_libs_replace'} onChange={() => setImportAction('all_libs_replace')} className="mt-1" />
                            <div>
                                <span className="font-bold text-gray-800 flex items-center gap-2"><RefreshCw size={16} /> Tout Remplacer (Traits + Compétences)</span>
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
                            <input type="radio" name="importAction" checked={importAction === 'skill_lib_merge'} onChange={() => setImportAction('skill_lib_merge')} className="mt-1" />
                            <div>
                                <span className="font-bold text-gray-800 flex items-center gap-2"><Merge size={16} /> Fusionner Compétences</span>
                                <span className="text-xs text-gray-600 block mt-1">Ajoute les nouvelles compétences à votre réserve.</span>
                            </div>
                        </label>
                        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'skill_lib_replace' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input type="radio" name="importAction" checked={importAction === 'skill_lib_replace'} onChange={() => setImportAction('skill_lib_replace')} className="mt-1" />
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
                            <input type="radio" name="importAction" checked={importAction === 'lib_merge'} onChange={() => setImportAction('lib_merge')} className="mt-1" />
                            <div>
                                <span className="font-bold text-gray-800 flex items-center gap-2"><Merge size={16} /> Fusionner Traits</span>
                                <span className="text-xs text-gray-600 block mt-1">Ajoute les nouveaux Avantages/Désavantages.</span>
                            </div>
                        </label>
                        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'lib_replace' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input type="radio" name="importAction" checked={importAction === 'lib_replace'} onChange={() => setImportAction('lib_replace')} className="mt-1" />
                            <div>
                                <span className="font-bold text-gray-800 flex items-center gap-2"><RefreshCw size={16} /> Remplacer Traits</span>
                                <span className="text-xs text-gray-600 block mt-1">Écrase votre bibliothèque de traits actuelle.</span>
                            </div>
                        </label>
                    </div>
                </div>
            );
        }

        return <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">{options}</div>;
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
                    <div className="flex-1 bg-white relative">
                        {renderConflictResolution()}
                    </div>
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
                                                <span className="text-xs text-slate-500 block mt-1">Traits (Avantages/Défauts) + Réserve de Compétences.</span>
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
                                                    <span className="font-bold text-slate-800 flex items-center gap-1 text-sm"><GraduationCap size={14} /> Compétences</span>
                                                    <span className="text-[10px] text-slate-500 block">Réserve de compétences seule.</span>
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
                                    {renderImportOptions()}
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
