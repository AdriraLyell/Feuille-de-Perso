
import React, { useState, useEffect } from 'react';
import { CharacterSheetData } from '../types';
import { Save, AlertTriangle, List, Tag, UserPlus, LayoutGrid, Palette, RefreshCw } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useCharacter } from '../context/CharacterContext';
import { INITIAL_DATA } from '../data/initialState';
import ThematicButton from './ui/ThematicButton';

// Import sub-components
import AttributesEditor from './settings/AttributesEditor';
import SkillsEditor from './settings/SkillsEditor';
import SpecializationsEditor from './settings/SpecializationsEditor';
import CreationConfigEditor from './settings/CreationConfigEditor';
import AppearanceEditor from './settings/AppearanceEditor';
import LibrarySidebar from './settings/LibrarySidebar';

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
      <div className={`flex-grow transition-all duration-300 ${activeTab === 'skills' ? 'mr-80' : ''}`}>

        {/* Header Navigation */}
        <div className="sticky top-14 z-40 mb-8 flex justify-center no-print pointer-events-none">
          <div className="pointer-events-auto flex gap-2 bg-white/90 backdrop-blur p-1.5 rounded-full shadow-lg border border-gray-200 items-center animate-in fade-in slide-in-from-top-4 duration-300 flex-wrap justify-center">
            <button onClick={() => setActiveTab('attributes')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'attributes' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><LayoutGrid size={16} /> Attributs</button>
            <button onClick={() => setActiveTab('skills')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'skills' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><List size={16} /> Compétences</button>
            <button onClick={() => setActiveTab('specializations')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'specializations' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Tag size={16} /> Spécialisations Imposées</button>
            <button onClick={() => setActiveTab('creation')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'creation' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><UserPlus size={16} /> Paramètres</button>
            <button onClick={() => setActiveTab('appearance')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'appearance' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Palette size={16} /> Apparence</button>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-stone-200 bg-stone-50">
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

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
            <div className="bg-red-50 p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmer la réinitialisation</h3>
              <p className="text-gray-600 text-sm">
                Êtes-vous sûr de vouloir réinitialiser toute la fiche aux valeurs par défaut ? <br />
                <span className="font-bold text-red-600 mt-2 block">Toutes les données actuelles et la structure personnalisée seront définitivement perdues.</span>
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-100">
              <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">Annuler</button>
              <button onClick={performReset} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm transition-colors">Oui, tout effacer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
