
import React, { useState, useEffect } from 'react';
import { CharacterSheetData } from '../types';
import { INITIAL_DATA } from '../data/initialState';
import ThematicButton from './ui/ThematicButton';
import ThematicModal from './ui/ThematicModal';
import { Save, AlertTriangle, List, Tag, UserPlus, LayoutGrid, Palette, RefreshCw, X, AlertCircle } from 'lucide-react';
import { useCharacter } from '../context/CharacterContext';
import { useNotification } from '../context/NotificationContext';

// Import sub-components
import AttributesEditor from './settings/AttributesEditor';
import SkillsEditor from './settings/SkillsEditor';
import SpecializationsEditor from './settings/SpecializationsEditor';
import CreationConfigEditor from './settings/CreationConfigEditor';
import AppearanceEditor from './settings/AppearanceEditor';
import LibrarySidebar from './settings/LibrarySidebar';
import SpecializationLibrarySidebar from './settings/SpecializationLibrarySidebar';

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
  data?: any;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onClose, onDirtyChange }) => {
  const { data, updateData: onUpdate, addLog: onAddLog } = useCharacter();
  const [localData, setLocalData] = useState<CharacterSheetData>(data);

  // Drag State (Shared between SkillsEditor and LibrarySidebar)
  const [draggedItem, setDraggedItem] = useState<DragItemType | null>(null);

  // Modal States
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [activeTab, setActiveTab] = useState<'general' | 'attributes' | 'skills' | 'specializations' | 'creation' | 'appearance' | 'library'>('general');
  const [isDirty, setIsDirty] = useState(false);

  // Helper to compare data excluding volatile/computed fields
  const getComparableData = (d: CharacterSheetData) => {
    const { appLogs, xpLogs, experience, ...rest } = d;
    return rest;
  };

  const handleSave = () => {
    onUpdate(localData);
    onAddLog('Modifications de la structure sauvegardées', 'success', 'settings');
  };

  // Effect to detect unsaved changes
  useEffect(() => {
    const dirty = JSON.stringify(getComparableData(localData)) !== JSON.stringify(getComparableData(data));
    setIsDirty(dirty);
    if (onDirtyChange) {
      onDirtyChange(dirty);
    }
  }, [localData, data, onDirtyChange]);

  const performReset = () => {
    setLocalData(JSON.parse(JSON.stringify(INITIAL_DATA)));
    setShowResetConfirm(false);
    onAddLog("Réinitialisation complète de la fiche aux valeurs par défaut", 'danger', 'settings');
  };

  const handleLocalUpdate = (newData: CharacterSheetData) => {
    setLocalData(newData);
  };

  return (
    <div className="px-6 pb-20 max-w-[1600px] mx-auto relative flex">
      {/* --- LEFT COLUMN: Main Content --- */}
      <div className={`flex-grow transition-all duration-300 ${(activeTab === 'skills' || activeTab === 'specializations') ? 'mr-80' : ''}`}>

        {/* Header Navigation */}
        <div className="sticky top-14 z-40 mb-8 flex justify-center no-print pointer-events-none">
          <div className="pointer-events-auto flex gap-2 bg-[#fdfbf7]/90 backdrop-blur-sm p-1.5 rounded-full shadow-xl border border-[#bfae85]/30 items-center animate-in fade-in slide-in-from-top-4 duration-300 flex-wrap justify-center">
            <button onClick={() => setActiveTab('attributes')} className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'attributes' ? 'bg-[#8b2e2e] text-white shadow-md ring-2 ring-[#8b2e2e]/20' : 'text-[#5c4d41] hover:bg-[#bfae85]/10'}`}><LayoutGrid size={16} /> Attributs</button>
            <button onClick={() => setActiveTab('skills')} className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'skills' ? 'bg-[#8b2e2e] text-white shadow-md ring-2 ring-[#8b2e2e]/20' : 'text-[#5c4d41] hover:bg-[#bfae85]/10'}`}><List size={16} /> Compétences</button>
            <button onClick={() => setActiveTab('specializations')} className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'specializations' ? 'bg-[#8b2e2e] text-white shadow-md ring-2 ring-[#8b2e2e]/20' : 'text-[#5c4d41] hover:bg-[#bfae85]/10'}`}><Tag size={16} /> Spécialisations</button>
            <button onClick={() => setActiveTab('creation')} className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'creation' ? 'bg-[#8b2e2e] text-white shadow-md ring-2 ring-[#8b2e2e]/20' : 'text-[#5c4d41] hover:bg-[#bfae85]/10'}`}><UserPlus size={16} /> Paramètres</button>
            <button onClick={() => setActiveTab('appearance')} className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'appearance' ? 'bg-[#8b2e2e] text-white shadow-md ring-2 ring-[#8b2e2e]/20' : 'text-[#5c4d41] hover:bg-[#bfae85]/10'}`}><Palette size={16} /> Apparence</button>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-y border-[#bfae85]/30 bg-[#fdfbf7]/50 backdrop-blur-sm mb-8 rounded-sm">
          <ThematicButton
            variant="danger"
            onClick={() => setShowResetConfirm(true)}
            leftIcon={<AlertTriangle size={18} />}
          >
            Réinitialiser
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

          {activeTab === 'appearance' && (
            <AppearanceEditor
              data={localData}
              onUpdate={handleLocalUpdate}
              onAddLog={onAddLog}
            />
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
          onUpdate={handleLocalUpdate}
          onAddLog={onAddLog}
        />
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
    </div>
  );
};

export default SettingsView;
