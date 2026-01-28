
// ... (imports remain the same)
import React, { useState, useRef } from 'react';
import { CharacterSheetData, LibraryEntry } from '../types';
import { Download, Upload, FileJson, AlertTriangle, BookOpen, User, LayoutTemplate, X, CheckCircle2, HelpCircle, Merge, RefreshCw, FileBox, Info } from 'lucide-react';
import { INITIAL_DATA, APP_VERSION } from '../constants';
import { getImage, saveImage, blobToBase64, base64ToBlob } from '../imageDB';

// ... (interfaces remain the same)
interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CharacterSheetData;
  onImport: (newData: CharacterSheetData) => void;
  onExportSuccess?: () => void;
  onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both') => void;
}

type ExportType = 'full' | 'system' | 'template' | 'library';

interface FileAnalysis {
    hasHeader: boolean;
    hasStructure: boolean; // Skills, Attributes
    hasLibrary: boolean;
    isFilled: boolean; // Guess if it's a played character (has values)
    fileVersion?: string;
    versionMismatch: boolean;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose, data, onImport, onExportSuccess, onAddLog }) => {
  // UI State
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  // Export State
  const [exportType, setExportType] = useState<ExportType>('full');
  
  // Import State
  const [pendingFile, setPendingFile] = useState<any | null>(null);
  const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
  const [importAction, setImportAction] = useState<string>(''); // 'replace_all', 'system', 'lib_merge', 'lib_replace', 'template'
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --- LOGIC: RESET / CLEANING ---
  // ... (createTemplateFromData logic remains same)
  const createTemplateFromData = (source: CharacterSheetData): CharacterSheetData => {
      const clean = JSON.parse(JSON.stringify(source));
      
      // Reset Header
      Object.keys(clean.header).forEach(k => clean.header[k] = "");
      
      // Reset XP
      clean.experience = { gain: '0', spent: '0', rest: '0' };
      clean.xpLogs = [];
      clean.appLogs = [];

      // Reset Attributes Values (Dynamic Iteration)
      if (clean.attributes) {
          Object.keys(clean.attributes).forEach(cat => {
              if (Array.isArray(clean.attributes[cat])) {
                  // @ts-ignore
                  clean.attributes[cat].forEach((attr: any) => {
                      attr.val1 = ""; attr.val2 = ""; attr.val3 = ""; // Changed to string
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
      clean.combat.weapons.forEach((w: any) => { w.weapon=""; w.level=""; w.init=""; w.attack=""; w.damage=""; w.parry=""; });
      clean.combat.armor.forEach((a: any) => { a.type=""; a.protection=""; a.weight=""; });
      clean.combat.stats = { agility: '', dexterity: '', force: '', size: '' };

      // Reset Page 2 Details
      clean.page2.lieux_importants = "";
      clean.page2.contacts = "";
      clean.page2.reputation.fill({ reputation: '', lieu: '', valeur: '' });
      clean.page2.connaissances = "";
      clean.page2.valeurs_monetaires = "";
      clean.page2.armes_list = ""; // Reset as empty string
      clean.page2.avantages.fill({ name: '', value: '' }); // Renamed
      clean.page2.desavantages.fill({ name: '', value: '' }); // Renamed
      clean.page2.equipement = "";
      clean.page2.notes = "";
      clean.page2.characterImage = "";
      clean.page2.characterImageId = undefined; // Do not export ID in template

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
  // ... (handleExport logic remains same)
  const handleExport = async () => {
      let exportData: any = {};
      let filename = "Sauvegarde";

      // Preparation logic for image
      // Clone data to avoid mutating state
      const dataToProcess = JSON.parse(JSON.stringify(data));

      // Resolve Character Image from DB if present
      if (dataToProcess.page2.characterImageId) {
          try {
              const blob = await getImage(dataToProcess.page2.characterImageId);
              if (blob) {
                  const base64 = await blobToBase64(blob);
                  // Inject into old field for portability
                  dataToProcess.page2.characterImage = base64;
              }
          } catch (e) {
              console.error("Failed to export character image from DB", e);
          }
          // Remove ID from export to force import logic to re-save
          delete dataToProcess.page2.characterImageId;
      }

      // Resolve Campaign Notes Images from DB if present
      if (dataToProcess.campaignNotes) {
          for (const note of dataToProcess.campaignNotes) {
              if (note.images && Array.isArray(note.images)) {
                  for (const img of note.images) {
                      if (img.imageId) {
                          try {
                              const blob = await getImage(img.imageId);
                              if (blob) {
                                  // Inject base64 for export into a temporary field
                                  // We use 'any' to bypass TS check for this export-only field
                                  (img as any).base64Data = await blobToBase64(blob);
                              }
                          } catch (e) {
                              console.error(`Failed to export note image ${img.id}`, e);
                          }
                          // Remove IDB key from export
                          delete img.imageId;
                      }
                  }
              }
          }
      }

      // Add APP_VERSION to dataToProcess if not present
      if (!dataToProcess.appVersion) {
          dataToProcess.appVersion = APP_VERSION;
      }

      const template = createTemplateFromData(dataToProcess);
      // Ensure template has version
      if (!(template as any).appVersion) {
          (template as any).appVersion = APP_VERSION;
      }

      // Generate Timestamp DD-MM-YYYY_HHhMM
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
              // Format: DD-MM-YYYY_HHhMM_Personnage_Nom
              filename = `${timestamp}_Personnage_${data.header.name || 'SansNom'}`;
              break;
          case 'system':
              // Template + Library
              exportData = template;
              exportData.library = data.library; // Include lib
              filename = `${timestamp}_Systeme_Jeu`;
              break;
          case 'template':
              // Template Only (No Lib)
              exportData = template;
              delete exportData.library; // Remove lib
              filename = `${timestamp}_Template_Structure`;
              break;
          case 'library':
              // Library Only
              exportData = { library: data.library, appVersion: APP_VERSION };
              filename = `${timestamp}_Bibliotheque`;
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
  // ... (handleFileSelect logic remains same)
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
              const hasLibrary = !!(json.library && Array.isArray(json.library));
              
              // Version check
              const fileVersion = json.appVersion;
              const versionMismatch = fileVersion !== APP_VERSION;
              
              // Simple check for "filled" data: name is present OR xp spent > 0
              const isFilled = (json.header && json.header.name) || (json.experience && parseInt(json.experience.spent) > 0);

              if (!hasStructure && !hasLibrary) {
                  alert("Ce fichier ne semble pas être compatible (ni fiche, ni bibliothèque).");
                  return;
              }

              setPendingFile(json);
              setAnalysis({ hasHeader, hasStructure, hasLibrary, isFilled, fileVersion, versionMismatch });
              setImportAction(''); // Reset choice

              // Clean input
              if (fileInputRef.current) fileInputRef.current.value = "";

          } catch (error) {
              console.error(error);
              alert("Erreur de lecture du fichier JSON.");
          }
      };
      reader.readAsText(file);
  };

  // ... (executeImport logic remains same)
  const executeImport = async () => {
      if (!pendingFile || !importAction) return;

      let finalData = { ...data };
      let logMsg = "";

      // Helper: Merge Libraries
      const mergeLibs = (current: LibraryEntry[] | undefined, incoming: LibraryEntry[]) => {
          // Safety: ensure current is an array
          const safeCurrent = Array.isArray(current) ? current : [];
          const merged = [...safeCurrent];
          
          incoming.forEach(newItem => {
              const existingIndex = merged.findIndex(curr => curr.id === newItem.id);
              if (existingIndex >= 0) {
                  // Update existing
                  merged[existingIndex] = newItem;
              } else {
                  // Add new
                  merged.push(newItem);
              }
          });
          return merged;
      };

      // Handle Image Import Logic (Base64 -> IDB)
      const processImportedData = async (dataObj: any) => {
          // 1. Character Image
          if (dataObj.page2 && dataObj.page2.characterImage && dataObj.page2.characterImage.length > 100) {
              try {
                  // Convert Base64 to Blob
                  const blob = await base64ToBlob(dataObj.page2.characterImage);
                  // Save to IndexedDB
                  const newId = await saveImage(blob);
                  // Update references
                  dataObj.page2.characterImageId = newId;
                  dataObj.page2.characterImage = ""; // Clear heavy string
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
                                  delete img.base64Data; // Clear memory
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

      if (importAction === 'replace_all') {
          // Full Overwrite
          finalData = await processImportedData(pendingFile);
          // Safety: ensure library exists
          if (!finalData.library) finalData.library = [];
          logMsg = "Remplacement complet du personnage.";
      }
      else if (importAction === 'system') {
          // Apply Structure (Template) + Lib, Reset Values
          const template = createTemplateFromData(pendingFile);
          finalData = template; // Template doesn't have image, so no need to process
          // Handle Lib: The 'system' import implies replacing the lib with the system one
          if (pendingFile.library) finalData.library = pendingFile.library;
          else finalData.library = []; // If system file has no lib, empty it
          
          logMsg = "Chargement du Système (Template + Bibliothèque). Fiche réinitialisée.";
      }
      else if (importAction === 'template') {
          // Apply Structure Only. Reset Values. Keep existing Lib.
          const template = createTemplateFromData(pendingFile);
          finalData = template;
          // Restore current library
          finalData.library = data.library || []; 
          logMsg = "Chargement du Template (Structure). Fiche réinitialisée. Bibliothèque conservée.";
      }
      else if (importAction === 'lib_replace') {
          // Keep current sheet/template, Replace Lib
          finalData.library = pendingFile.library || [];
          logMsg = "Remplacement de la Bibliothèque.";
      }
      else if (importAction === 'lib_merge') {
          // Keep current sheet/template, Merge Lib
          finalData.library = mergeLibs(data.library, pendingFile.library || []);
          logMsg = "Fusion de la Bibliothèque.";
      }

      onImport(finalData);
      onAddLog(logMsg, 'success', 'both');
      handleClose();
  };

  const handleClose = () => {
      setPendingFile(null);
      setAnalysis(null);
      setImportAction('');
      onClose();
  };

  // --- RENDER HELPERS ---
  // ... (renderImportOptions logic remains same)
  const renderImportOptions = () => {
      if (!analysis) return null;

      const options = [];

      // 1. If File has Sheet Structure (Template or Full)
      if (analysis.hasStructure) {
          // Option: Replace Everything
          options.push(
            <label key="replace_all" className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'replace_all' ? 'bg-red-50 border-red-500 ring-1 ring-red-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="importAction" checked={importAction === 'replace_all'} onChange={() => setImportAction('replace_all')} className="mt-1" />
                <div>
                    <span className="font-bold text-gray-800 flex items-center gap-2">
                        <User size={16} /> Tout remplacer (Clone)
                    </span>
                    <span className="text-xs text-red-600 block mt-1">
                        <AlertTriangle size={12} className="inline mr-1"/>
                        Attention : Toutes vos données actuelles seront perdues.
                    </span>
                </div>
            </label>
          );

          // Option: Import System (Template + Lib if exists)
          options.push(
            <label key="system" className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'system' ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="importAction" checked={importAction === 'system'} onChange={() => setImportAction('system')} className="mt-1" />
                <div>
                    <span className="font-bold text-gray-800 flex items-center gap-2">
                        <LayoutTemplate size={16} /> Charger le Système (Template + Biblio)
                    </span>
                    <span className="text-xs text-orange-600 block mt-1">
                        Écrase la structure et réinitialise les valeurs de la fiche à zéro.
                        {analysis.hasLibrary ? " Remplace la bibliothèque." : ""}
                    </span>
                </div>
            </label>
          );

           // Option: Template Only (Keep Lib)
           if (!analysis.hasLibrary) {
             options.push(
                <label key="template" className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'template' ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="importAction" checked={importAction === 'template'} onChange={() => setImportAction('template')} className="mt-1" />
                    <div>
                        <span className="font-bold text-gray-800 flex items-center gap-2">
                            <LayoutTemplate size={16} /> Charger le Template Uniquement
                        </span>
                        <span className="text-xs text-orange-600 block mt-1">
                            Met à jour la structure (compétences, etc.) et réinitialise la fiche.
                            <span className="font-bold text-black block mt-0.5">Votre bibliothèque actuelle est conservée.</span>
                        </span>
                    </div>
                </label>
             );
           }
      }

      // 2. If File has Library
      if (analysis.hasLibrary) {
          // Option: Merge Lib
          options.push(
            <label key="lib_merge" className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'lib_merge' ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="importAction" checked={importAction === 'lib_merge'} onChange={() => setImportAction('lib_merge')} className="mt-1" />
                <div>
                    <span className="font-bold text-gray-800 flex items-center gap-2">
                        <Merge size={16} /> Fusionner la Bibliothèque
                    </span>
                    <span className="text-xs text-gray-600 block mt-1">
                        Ajoute les nouveaux traits. Met à jour les existants (par ID).
                        <span className="text-green-700 font-bold ml-1">Ne touche pas à la fiche ni au template.</span>
                    </span>
                </div>
            </label>
          );

          // Option: Replace Lib
          options.push(
            <label key="lib_replace" className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importAction === 'lib_replace' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="importAction" checked={importAction === 'lib_replace'} onChange={() => setImportAction('lib_replace')} className="mt-1" />
                <div>
                    <span className="font-bold text-gray-800 flex items-center gap-2">
                        <RefreshCw size={16} /> Remplacer la Bibliothèque
                    </span>
                    <span className="text-xs text-gray-600 block mt-1">
                        Supprime votre bibliothèque actuelle et installe celle du fichier.
                        <span className="text-green-700 font-bold ml-1">Ne touche pas à la fiche.</span>
                    </span>
                </div>
            </label>
          );
      }

      return <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">{options}</div>;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 flex flex-col min-h-[500px] max-h-[90vh]">
        
        {/* HEADER & TABS */}
        <div className="bg-slate-100 flex flex-col border-b border-slate-200">
            <div className="flex justify-between items-center p-4">
                <h3 className="font-bold text-xl text-slate-800">Gestion des Données</h3>
                <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-200 transition-colors">
                    <X size={24} />
                </button>
            </div>
            
            <div className="flex px-4 gap-4 justify-center">
                <button 
                    onClick={() => setActiveTab('export')}
                    className={`flex-1 flex justify-center items-center gap-2 px-6 py-3 font-bold text-sm border-b-4 transition-colors ${
                        activeTab === 'export' 
                        ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-t-lg'
                    }`}
                >
                    <Download size={18} />
                    Sauvegarder (Export)
                </button>
                <button 
                    onClick={() => setActiveTab('import')}
                    className={`flex-1 flex justify-center items-center gap-2 px-6 py-3 font-bold text-sm border-b-4 transition-colors ${
                        activeTab === 'import' 
                        ? 'border-orange-500 text-orange-700 bg-white rounded-t-lg' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-t-lg'
                    }`}
                >
                    <Upload size={18} />
                    Charger (Import)
                </button>
            </div>
        </div>

        {/* --- EXPORT TAB CONTENT --- */}
        {activeTab === 'export' && (
            <div className="flex-1 bg-slate-50 p-6 flex flex-col animate-in fade-in duration-300">
                <div className="mb-4">
                    <h3 className="font-bold text-lg text-blue-800 flex items-center gap-2">
                        <Download size={20} />
                        Choisissez le format de sauvegarde
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Crée un fichier .json sur votre ordinateur.</p>
                </div>

                <div className="space-y-3 flex-grow">
                    <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${exportType === 'full' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:bg-white'}`}>
                        <input type="radio" name="exportType" checked={exportType === 'full'} onChange={() => setExportType('full')} className="mt-1 accent-blue-600" />
                        <div>
                            <span className="font-bold text-slate-800 flex items-center gap-2"><User size={16} /> Personnage Complet</span>
                            <span className="text-xs text-slate-500 block mt-1">Tout ce que contient la fiche actuelle (Valeurs, Notes, Images, Bibliothèque).</span>
                        </div>
                    </label>

                    <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${exportType === 'system' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:bg-white'}`}>
                        <input type="radio" name="exportType" checked={exportType === 'system'} onChange={() => setExportType('system')} className="mt-1 accent-blue-600" />
                        <div>
                            <span className="font-bold text-slate-800 flex items-center gap-2"><FileBox size={16} /> Système de Jeu (MJ)</span>
                            <span className="text-xs text-slate-500 block mt-1">Structure + Bibliothèque. <span className="text-red-500 font-bold">Sans les valeurs du joueur.</span> Idéal pour partager un template.</span>
                        </div>
                    </label>

                    <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${exportType === 'template' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:bg-white'}`}>
                        <input type="radio" name="exportType" checked={exportType === 'template'} onChange={() => setExportType('template')} className="mt-1 accent-blue-600" />
                        <div>
                            <span className="font-bold text-slate-800 flex items-center gap-2"><LayoutTemplate size={16} /> Structure Seule</span>
                            <span className="text-xs text-slate-500 block mt-1">Uniquement la configuration des compétences et attributs. Pas de bibliothèque.</span>
                        </div>
                    </label>

                    <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${exportType === 'library' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:bg-white'}`}>
                        <input type="radio" name="exportType" checked={exportType === 'library'} onChange={() => setExportType('library')} className="mt-1 accent-blue-600" />
                        <div>
                            <span className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={16} /> Bibliothèque Seule</span>
                            <span className="text-xs text-slate-500 block mt-1">Uniquement la liste des Avantages et Désavantages.</span>
                        </div>
                    </label>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200">
                    <button
                        onClick={handleExport}
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-all font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Download size={20} />
                        Télécharger le fichier
                    </button>
                </div>
            </div>
        )}

        {/* --- IMPORT TAB CONTENT --- */}
        {activeTab === 'import' && (
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
                                        {analysis?.hasStructure && <span className="bg-white border border-blue-200 px-2 py-1 rounded flex items-center gap-1 shadow-sm"><LayoutTemplate size={12}/> Structure</span>}
                                        {analysis?.hasLibrary && <span className="bg-white border border-blue-200 px-2 py-1 rounded flex items-center gap-1 shadow-sm"><BookOpen size={12}/> Bibliothèque</span>}
                                        {analysis?.isFilled && <span className="bg-white border border-blue-200 px-2 py-1 rounded flex items-center gap-1 shadow-sm"><User size={12}/> Données Joueur</span>}
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
                            
                            {/* VERSION WARNING */}
                            {analysis?.versionMismatch && (
                                <div className="mt-3 pt-3 border-t border-blue-200 text-orange-700 font-semibold flex items-start gap-2 text-xs">
                                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                    <div>
                                        {!analysis.fileVersion ? (
                                            "Fichier ancien (sans numéro de version). Risque d'incompatibilités."
                                        ) : analysis.fileVersion < APP_VERSION ? (
                                            <span>Version du fichier (v{analysis.fileVersion}) antérieure à l'application (v{APP_VERSION}).</span>
                                        ) : (
                                            <span>Version du fichier (v{analysis.fileVersion}) plus récente que l'application (v{APP_VERSION}). Certaines fonctionnalités pourraient manquer.</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                            Choisir une action
                        </h4>
                        
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
                                Confirmer l'importation
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default ImportExportModal;
