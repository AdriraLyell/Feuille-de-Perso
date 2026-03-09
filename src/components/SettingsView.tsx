
import React, { useState } from 'react';

import ThematicButton from './ui/ThematicButton';
import ThematicModal from './ui/ThematicModal';
import { useCharacter } from '../context/CharacterContext';


// Import sub-components
import AttributesEditor from './settings/AttributesEditor';
import SkillsEditor from './settings/SkillsEditor';
import SpecializationsEditor from './settings/SpecializationsEditor';
import CreationConfigEditor from './settings/CreationConfigEditor';
import StorageMonitor from './settings/StorageMonitor';

import LibrarySidebar from './settings/LibrarySidebar';
import SpecializationLibrarySidebar from './settings/SpecializationLibrarySidebar';
import LibraryView from './LibraryView';
import AdminSuggestions from './settings/AdminSuggestions'; // NEW
import { Save, AlertTriangle, List, Tag, UserPlus, LayoutGrid, RefreshCw, AlertCircle, BookOpen, Lock, UploadCloud, Lightbulb } from 'lucide-react';

// Rules Integration
import { useRules } from '../context/RulesContext';

// Expert Mode
import { useExpertMode } from '../hooks/useExpertMode';
import ExpertModeWarningModal from './ui/ExpertModeWarningModal';
import { useSettingsManager } from '../hooks/settings/useSettingsManager';

// Version and App Info
// Note: APP_VERSION might be global or imported, assuming it was used in previous context but not shown in imports?
// Re-checking previous file content at step 438/447/536. 
// Ah, step 438 showed me adding APP_VERSION usage in header? 
// Actually step 536 content didn't show APP_VERSION import. It was relying on previous code?
// Let's assume standard imports. If APP_VERSION is missing, I'll define it or omit it for now?
// Step 447 added specific debugging header. I should include that too!
// Wait, step 447 tried to add debug header but failed? 
// Step 452 succeeded in build. 
// Let's look at the header in Step 536. 
// It shows:
/*
        <div className="sticky top-14 z-40 mb-8 flex justify-center no-print pointer-events-none">
          <div className="pointer-events-auto flex gap-2 ...">
*/
// It DOES NOT show the debug header I tried to add in step 438/447. 
// Step 447 failed because "SettingsView.tsx does not exist".
// Step 447 retry was on `src\components\SettingsView.tsx` (capital S).
// Step 536 shows `src\components\SettingsView.tsx`.
// But I don't see the debug header in Step 536 content!
// It seems my previous attempt to add the debug header might have failed or I am misremembering where I verified it.
// NEVERMIND the debug header. The important part is the RESET LOGIC.
// I will stick to the content from Step 536 but with the fix.

interface SettingsViewProps {
  onClose: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

// Type definition for Drag Item (shared with children)
export interface DragItemType {
  type: 'sheet_skill' | 'lib_skill';
  category?: string;
  index?: number;
  id?: string;
  data?: Record<string, unknown>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onClose, onDirtyChange }) => {
  const { data } = useCharacterState();
  const { updateData: onUpdate, addLog: onAddLog } = useCharacterActions();
  const { rules, isOnlineMode } = useRules();
  const { expertMode, enableExpertMode, disableExpertMode } = useExpertMode();

  const {
    localData,
    activeTab,
    setActiveTab,
    isDirty,
    showResetConfirm,
    setShowResetConfirm,
    showExpertWarning,
    setShowExpertWarning,
    handleSave,
    handleLocalUpdate,
    performReset,

  } = useSettingsManager(data, rules, isOnlineMode, expertMode, onUpdate, onAddLog, onDirtyChange, onClose);

  // Drag State (Shared between SkillsEditor and LibrarySidebar)
  const [draggedItem, setDraggedItem] = useState<DragItemType | null>(null);

  // Tab visibility based on Online Mode and Expert Mode
  const showAdvancedTabs = !isOnlineMode || expertMode;

  return (
    <div className={`w-full px-6 pb-20 mx-auto relative flex transition-all duration-300 ${!showAdvancedTabs ? 'max-w-[1100px]' : 'max-w-[1600px]'} ${['attributes', 'skills', 'specializations', 'suggestions'].includes(activeTab) ? 'pr-80' : ''}`}>
      {/* --- LEFT COLUMN: Main Content --- */}
      <div className="flex-grow transition-all duration-300">


        {/* Expert Mode Warning Banner */}
        {isOnlineMode && expertMode && (
          <div className="sticky top-14 z-50 mb-2 flex justify-center no-print">
            <div className="flex items-center gap-3 bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-full shadow-md text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertTriangle size={16} />
              <span>Mode Expert activé — Les modifications peuvent causer des conflits avec les règles de la campagne</span>
              <button
                onClick={disableExpertMode}
                className="ml-2 px-2 py-1 bg-amber-200 hover:bg-amber-300 rounded text-[10px] uppercase tracking-wide"
              >
                Désactiver
              </button>
            </div>
          </div>
        )}

        {/* Header Navigation */}
        <div className="sticky top-14 z-40 mb-8 flex justify-center no-print pointer-events-none" style={{ top: isOnlineMode && expertMode ? '4.5rem' : '3.5rem' }}>
          <div className="pointer-events-auto flex gap-2 bg-[#fdfbf7]/90 backdrop-blur-sm p-1.5 rounded-full shadow-xl border border-[#bfae85]/30 items-center animate-in fade-in slide-in-from-top-4 duration-300 flex-wrap justify-center">

            {/* Advanced tabs - only shown if !isOnlineMode OR expertMode */}
            {showAdvancedTabs && (
              <>
                <button onClick={() => setActiveTab('attributes')} className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'attributes' ? 'bg-[#8b2e2e] text-white shadow-md ring-2 ring-[#8b2e2e]/20' : 'text-[#5c4d41] hover:bg-[#bfae85]/10'}`}><LayoutGrid size={16} /> Attributs</button>
                <button onClick={() => setActiveTab('skills')} className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'skills' ? 'bg-[#8b2e2e] text-white shadow-md ring-2 ring-[#8b2e2e]/20' : 'text-[#5c4d41] hover:bg-[#bfae85]/10'}`}><List size={16} /> Compétences</button>
                <button onClick={() => setActiveTab('specializations')} className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'specializations' ? 'bg-[#8b2e2e] text-white shadow-md ring-2 ring-[#8b2e2e]/20' : 'text-[#5c4d41] hover:bg-[#bfae85]/10'}`}><Tag size={16} /> Spécialités</button>
                <button onClick={() => setActiveTab('creation')} className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'creation' ? 'bg-[#8b2e2e] text-white shadow-md ring-2 ring-[#8b2e2e]/20' : 'text-[#5c4d41] hover:bg-[#bfae85]/10'}`}><UserPlus size={16} /> Paramètres</button>
                <button onClick={() => setActiveTab('suggestions')} className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'suggestions' ? 'bg-[#8b2e2e] text-white shadow-md ring-2 ring-[#8b2e2e]/20' : 'text-[#5c4d41] hover:bg-[#bfae85]/10'}`}>
                  <Lightbulb size={16} /> Suggestions {localData.suggestions && localData.suggestions.length > 0 ? `(${localData.suggestions.length})` : ''}
                </button>
              </>
            )}

            {/* Réglages Avancés button - only shown in Online mode when Expert is OFF */}
            {isOnlineMode && !expertMode && (
              <button
                onClick={() => setShowExpertWarning(true)}
                className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all text-amber-700 bg-amber-100/50 hover:bg-amber-200/70 border border-amber-300/50"
              >
                <Lock size={16} /> Réglages Avancés
              </button>
            )}

            {/* Cloud tab - always visible if syncId exists */}
            {localData.syncInfo?.syncId && (
              <button onClick={() => setActiveTab('cloud')} className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'cloud' ? 'bg-[#2d5a27] text-white shadow-md ring-2 ring-[#2d5a27]/20' : 'text-[#5c4d41] hover:bg-[#bfae85]/10'}`}><UploadCloud size={16} /> Cloud</button>
            )}

            {/* Bibliothèque tab - always visible */}
            <button onClick={() => setActiveTab('library')} className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'library' ? 'bg-[#8b2e2e] text-white shadow-md ring-2 ring-[#8b2e2e]/20' : 'text-[#5c4d41] hover:bg-[#bfae85]/10'}`}><BookOpen size={16} /> Bibliothèque</button>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-y border-[#bfae85]/30 bg-[#fdfbf7]/50 backdrop-blur-sm mb-8 rounded-sm">
          <ThematicButton
            variant="danger"
            onClick={() => setShowResetConfirm(true)}
            leftIcon={<UserPlus size={18} />}
          >
            Nouveau Personnage / Réinitialiser
          </ThematicButton>

          <div className="flex gap-4">
            <ThematicButton
              variant="secondary"
              onClick={onClose}
            >
              Fermer
            </ThematicButton>

            <ThematicButton
              variant="primary"
              onClick={handleSave}
              disabled={!isDirty}
              leftIcon={<Save size={18} />}
            >
              {isDirty ? 'Enregistrer' : 'À jour'}
            </ThematicButton>
          </div>
        </div>

        <div className="space-y-8 min-h-[400px]">
          {activeTab === 'attributes' && (
            <AttributesEditor
              data={localData}
              onUpdate={handleLocalUpdate}
              onAddLog={onAddLog}
            />
          )}

          {activeTab === 'skills' && (
            <SkillsEditor
              data={localData}
              onUpdate={handleLocalUpdate}
              onAddLog={onAddLog}
              draggedItem={draggedItem}
              setDraggedItem={setDraggedItem}
            />
          )}

          {activeTab === 'specializations' && (
            <SpecializationsEditor
              data={localData}
              onUpdate={handleLocalUpdate}
              onAddLog={onAddLog}
            />
          )}

          {activeTab === 'creation' && (
            <CreationConfigEditor
              data={localData}
              onUpdate={handleLocalUpdate}
              onAddLog={onAddLog}
            />
          )}

          {activeTab === 'suggestions' && (
            <AdminSuggestions
              data={localData}
              onUpdate={handleLocalUpdate}
              onAddLog={onAddLog}
            />
          )}

          {activeTab === 'library' && (
            <div className="h-[calc(100vh-250px)] min-h-[600px] border border-[#bfae85]/30 rounded-sm overflow-hidden shadow-sm">
              <LibraryView data={localData} onUpdate={handleLocalUpdate} isEditable={expertMode} />
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white p-8 rounded-sm border border-[#bfae85]/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12"><UploadCloud size={120} /></div>

                <h3 className="text-2xl font-serif font-bold text-[#2c241b] mb-6 flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-sm"><RefreshCw size={24} /></div>
                  Paramètres Cloud
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-sm hover:border-indigo-300 transition-colors">
                    <div className="flex-grow">
                      <div className="font-bold text-[#4a3b32]">Synchronisation Automatique</div>
                      <p className="text-xs text-stone-500 mt-1 max-w-md">
                        Sauvegarde automatiquement votre fiche personnage sur le serveur après chaque modification importante (délai de 10 secondes).
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <span className="sr-only">Activer la synchronisation automatique</span>
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={localData.syncInfo?.isAutoSyncEnabled || false}
                        onChange={(e) => handleLocalUpdate({
                          ...localData,
                          syncInfo: {
                            ...localData.syncInfo!,
                            isAutoSyncEnabled: e.target.checked
                          }
                        })}
                      />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <StorageMonitor />

                  <div className="p-4 border border-[#bfae85]/30 rounded-sm bg-[#fdfbf7]">
                    <h4 className="text-xs font-bold text-[#8b2e2e] uppercase tracking-widest mb-3 border-b border-[#bfae85]/20 pb-2">Informations de Synchronisation</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-stone-500">ID Unique :</span>
                        <div className="font-mono mt-1 text-[#4a3b32] truncate bg-stone-100 p-1 rounded" title={localData.syncInfo?.syncId}>{localData.syncInfo?.syncId}</div>
                      </div>
                      <div>
                        <span className="text-stone-500">Campagne :</span>
                        <div className="font-bold mt-1 text-[#4a3b32]">{localData.syncInfo?.settingName}</div>
                      </div>
                      <div>
                        <span className="text-stone-500">Joueur :</span>
                        <div className="font-bold mt-1 text-[#4a3b32]">{localData.header.player}</div>
                      </div>
                      <div>
                        <span className="text-stone-500">Dernière Sauvegarde :</span>
                        <div className="font-bold mt-1 text-[#4a3b32]">
                          {localData.syncInfo?.lastSynced ? new Date(localData.syncInfo.lastSynced).toLocaleString('fr-FR') : 'Jamais'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-sm text-xs">
                    <AlertTriangle size={18} className="shrink-0" />
                    <p>La synchronisation manuelle reste disponible à tout moment via le bouton Sync de la barre de navigation.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- RIGHT COLUMN: Library Sidebar (Only in Skills Tab) --- */}
      {activeTab === 'skills' && (
        <LibrarySidebar
          data={localData}
          onUpdate={handleLocalUpdate}
          onAddLog={onAddLog}
          draggedItem={draggedItem}
          setDraggedItem={setDraggedItem}
        />
      )}

      {activeTab === 'specializations' && (
        <SpecializationLibrarySidebar
          data={localData}
        />
      )}

      {activeTab === 'suggestions' && (
        <div className="hidden lg:block w-80 shrink-0 ml-6 bg-white border border-[#bfae85]/30 rounded-sm p-4 h-fit sticky top-24">
          <div className="text-xs text-stone-500 italic text-center">
            Les suggestions validées modifient immédiatement les règles chargées en mémoire. Pensez à exporter vos règles ensuite.
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <ThematicModal
          isOpen={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
          title="Réinitialisation Complète"
          icon={<AlertCircle size={24} className="text-[#8b2e2e]" />}
          size="md"
          footer={
            <>
              <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold">Annuler</button>
              <button onClick={performReset} className="px-6 py-2 bg-[#8b2e2e] text-white rounded-sm font-bold shadow-md hover:bg-[#6a2424]">
                Confirmer la purge
              </button>
            </>
          }
        >
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-[#8b2e2e]/10 text-[#8b2e2e] rounded-full flex items-center justify-center shadow-inner">
              <RefreshCw size={32} />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[#5c4d41] leading-relaxed">
                Êtes-vous sûr de vouloir réinitialiser toute la fiche aux valeurs par défaut ?
              </p>
              <div className="bg-red-50/50 border border-red-200/50 p-3 rounded-sm">
                <p className="text-[11px] font-bold text-[#8b2e2e] uppercase tracking-wider">Attention : Perte de données</p>
                <p className="text-[10px] text-red-800/70 mt-1 italic">
                  Toutes les données actuelles et la structure personnalisée seront définitivement perdues.
                </p>
              </div>
            </div>
          </div>
        </ThematicModal>
      )}

      {/* Expert Mode Warning Modal */}
      <ExpertModeWarningModal
        isOpen={showExpertWarning}
        onClose={() => setShowExpertWarning(false)}
        onConfirm={() => {
          enableExpertMode();
          setShowExpertWarning(false);
        }}
      />
    </div>
  );
};

export default SettingsView;
