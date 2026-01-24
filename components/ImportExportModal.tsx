import React, { useState, useRef } from 'react';
import { CharacterSheetData, LibraryEntry } from '../types';
import { Download, Upload, FileJson, CheckSquare, Square, X, AlertTriangle, BookOpen, User, LayoutTemplate, ArrowRight, CheckCircle2, HelpCircle, Merge, RefreshCw, FileBox } from 'lucide-react';
import { INITIAL_DATA } from '../constants';

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
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose, data, onImport, onExportSuccess, onAddLog }) => {
  // Export State
  const [exportType, setExportType] = useState<ExportType>('full');
  
  // Import State
  const [pendingFile, setPendingFile] = useState<any | null>(null);
  const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
  const [importAction, setImportAction] = useState<string>(''); // 'replace_all', 'system', 'lib_merge', 'lib_replace', 'template'
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --- LOGIC: RESET / CLEANING ---

  // Returns a "Reset" version of the data (Structure kept, Values cleared)
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
                      attr.val1 = 0; attr.val2 = 0; attr.val3 = 0;
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
      clean.page2.armes_list.fill("");
      clean.page2.vertus.fill({ name: '', value: '' });
      clean.page2.defauts.fill({ name: '', value: '' });
      clean.page2.equipement = "";
      clean.page2.notes = "";

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

  const handleExport = () => {
      let exportData: any = {};
      let filename = "Sauvegarde";

      const template = createTemplateFromData(data);

      switch (exportType) {
          case 'full':
              exportData = JSON.parse(JSON.stringify(data)); // Clone full
              filename = `Personnage_${data.header.name || 'SansNom'}`;
              break;
          case 'system':
              // Template + Library
              exportData = template;
              exportData.library = data.library; // Include lib
              filename = `Systeme_Jeu`;
              break;
          case 'template':
              // Template Only (No Lib)
              exportData = template;
              delete exportData.library; // Remove lib
              filename = `Template_Structure`;
              break;
          case 'library':
              // Library Only
              exportData = { library: data.library };
              filename = `Bibliotheque`;
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
              const hasLibrary = !!(json.library && Array.isArray(json.library));
              
              // Simple check for "filled" data: name is present OR xp spent > 0
              const isFilled = (json.header && json.header.name) || (json.experience && parseInt(json.experience.spent) > 0);

              if (!hasStructure && !hasLibrary) {
                  alert("Ce fichier ne semble pas être compatible (ni fiche, ni bibliothèque).");
                  return;
              }

              setPendingFile(json);
              setAnalysis({ hasHeader, hasStructure, hasLibrary, isFilled });
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

  const executeImport = () => {
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

      if (importAction === 'replace_all') {
          // Full Overwrite
          finalData = pendingFile;
          // Safety: ensure library exists
          if (!finalData.library) finalData.library = [];
          logMsg = "Remplacement complet du personnage.";
      }
      else if (importAction === 'system') {
          // Apply Structure (Template) + Lib, Reset Values
          const template = createTemplateFromData(pendingFile);
          finalData = template;
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden relative animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row min-h-[500px] max-h-[90vh]">
        
        {/* --- EXPORT COLUMN --- */}
        <div className="flex-1 bg-slate-50 p-6 flex flex-col border-b md:border-b-0 md:border-r border-slate-200">
             <div className="flex items-center gap-2 border-b border-slate-300 pb-3 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg text-white"><Download size={24} /></div>
                <div>
                    <h3 className="font-bold text-lg text-gray-800">Sauvegarder</h3>
                    <p className="text-xs text-gray-500">Exporter les données</p>
                </div>
             </div>

             <div className="space-y-4 flex-grow">
                 <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${exportType === 'full' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200 hover:bg-white'}`}>
                     <input type="radio" name="exportType" checked={exportType === 'full'} onChange={() => setExportType('full')} className="mt-1" />
                     <div>
                         <span className="font-bold text-gray-800 flex items-center gap-2"><User size={16} /> Personnage Complet</span>
                         <span className="text-xs text-gray-500 block">Fiche remplie + Template + Bibliothèque.</span>
                     </div>
                 </label>

                 <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${exportType === 'system' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200 hover:bg-white'}`}>
                     <input type="radio" name="exportType" checked={exportType === 'system'} onChange={() => setExportType('system')} className="mt-1" />
                     <div>
                         <span className="font-bold text-gray-800 flex items-center gap-2"><FileBox size={16} /> Système de Jeu</span>
                         <span className="text-xs text-gray-500 block">Template + Bibliothèque. <span className="text-red-500">Sans les valeurs de la fiche.</span></span>
                     </div>
                 </label>

                 <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${exportType === 'template' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200 hover:bg-white'}`}>
                     <input type="radio" name="exportType" checked={exportType === 'template'} onChange={() => setExportType('template')} className="mt-1" />
                     <div>
                         <span className="font-bold text-gray-800 flex items-center gap-2"><LayoutTemplate size={16} /> Template Seul</span>
                         <span className="text-xs text-gray-500 block">Uniquement la structure (Compétences, Config).</span>
                     </div>
                 </label>

                 <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${exportType === 'library' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200 hover:bg-white'}`}>
                     <input type="radio" name="exportType" checked={exportType === 'library'} onChange={() => setExportType('library')} className="mt-1" />
                     <div>
                         <span className="font-bold text-gray-800 flex items-center gap-2"><BookOpen size={16} /> Bibliothèque Seule</span>
                         <span className="text-xs text-gray-500 block">Uniquement la liste des Traits (Vertus/Défauts).</span>
                     </div>
                 </label>
             </div>

             <button
                onClick={handleExport}
                className="w-full mt-6 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-all font-bold flex items-center justify-center gap-2 shadow-sm"
            >
                <Download size={18} />
                Sauvegarder JSON
            </button>
        </div>

        {/* --- IMPORT COLUMN --- */}
        <div className="flex-1 bg-white p-6 flex flex-col relative">
             <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1"><X size={24} /></button>

             <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-4">
                <div className="bg-orange-500 p-2 rounded-lg text-white"><Upload size={24} /></div>
                <div>
                    <h3 className="font-bold text-lg text-gray-800">Charger</h3>
                    <p className="text-xs text-gray-500">Importer ou fusionner</p>
                </div>
             </div>

             {!pendingFile ? (
                 <div className="flex-grow flex flex-col justify-center items-center text-center space-y-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-6 hover:bg-blue-50 hover:border-blue-300 transition-colors">
                     <div className="p-4 bg-white rounded-full shadow-sm text-gray-400 mb-2">
                         <FileJson size={48} />
                     </div>
                     <p className="text-sm text-gray-600 font-medium">
                         Cliquez pour sélectionner un fichier <code>.json</code>
                     </p>
                     <p className="text-xs text-gray-400 max-w-[200px]">
                         Le système analysera le fichier pour vous proposer les options adaptées.
                     </p>
                     <input 
                        type="file" 
                        accept=".json" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect}
                     />
                     <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        Choisir un fichier
                    </button>
                 </div>
             ) : (
                 <div className="flex-grow flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                     {/* Analysis Header */}
                     <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 flex gap-3 text-xs text-blue-800">
                         <div className="flex-grow">
                             <span className="font-bold block mb-1">Contenu détecté :</span>
                             <div className="flex gap-2">
                                 {analysis?.hasStructure && <span className="bg-white border px-2 py-0.5 rounded flex items-center gap-1"><LayoutTemplate size={10}/> Structure</span>}
                                 {analysis?.hasLibrary && <span className="bg-white border px-2 py-0.5 rounded flex items-center gap-1"><BookOpen size={10}/> Bibliothèque</span>}
                                 {analysis?.isFilled && <span className="bg-white border px-2 py-0.5 rounded flex items-center gap-1"><User size={10}/> Données Joueur</span>}
                             </div>
                         </div>
                     </div>
                     
                     <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                         Action requise
                     </h4>
                     
                     <div className="flex-grow">
                         {renderImportOptions()}
                     </div>

                     <div className="mt-4 flex gap-3 pt-3 border-t border-gray-100">
                         <button 
                            onClick={() => { setPendingFile(null); setAnalysis(null); }}
                            className="flex-1 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-bold border border-gray-300"
                         >
                             Annuler
                         </button>
                         <button 
                            onClick={executeImport}
                            disabled={!importAction}
                            className="flex-1 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                             Charger
                         </button>
                     </div>
                 </div>
             )}
        </div>

      </div>
    </div>
  );
};

export default ImportExportModal;