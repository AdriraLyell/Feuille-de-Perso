
import React from 'react';
import { CharacterSheetData, ThemeConfig } from '../../types';
import { Palette, RotateCcw } from 'lucide-react';
import { DEFAULT_THEME } from '../../data/initialState';

interface AppearanceEditorProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
}

const AppearanceEditor: React.FC<AppearanceEditorProps> = ({ data, onUpdate, onAddLog }) => {
    const theme = data.theme || DEFAULT_THEME;

    const updateTheme = (field: keyof ThemeConfig, value: string) => {
        onUpdate({
            ...data,
            theme: {
                ...theme,
                [field]: value
            }
        });
    };

    const resetTheme = () => {
        onUpdate({
            ...data,
            theme: DEFAULT_THEME
        });
        onAddLog('Thème réinitialisé aux couleurs par défaut.', 'info', 'settings');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                 <div className="flex items-center justify-between border-b pb-2 mb-4">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                          <Palette size={18} /> Configuration des Couleurs
                      </h4>
                      <button
                          onClick={resetTheme}
                          className="text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                          title="Remettre les couleurs par défaut"
                      >
                          <RotateCcw size={12} /> Défaut
                      </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <label className="block text-sm font-bold text-gray-700 uppercase">Points acquis à la Création</label>
                          <p className="text-xs text-gray-500 mb-2">Utilisé pour les points "de base" et en mode création.</p>
                          <div className="flex items-center gap-3">
                              <input 
                                  type="color" 
                                  value={theme.creationColor}
                                  onChange={(e) => updateTheme('creationColor', e.target.value)}
                                  className="w-12 h-12 border-none rounded-lg cursor-pointer bg-white shadow-sm ring-1 ring-gray-200"
                              />
                              <div className="flex-grow flex flex-col justify-center">
                                  <div className="flex gap-1.5 mb-1">
                                      <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.creationColor }}></span>
                                      <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.creationColor }}></span>
                                      <span className="w-4 h-4 rounded-full border border-stone-400 bg-transparent"></span>
                                  </div>
                                  <span className="text-xs font-mono font-bold text-gray-600">{theme.creationColor}</span>
                              </div>
                          </div>
                     </div>

                     <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <label className="block text-sm font-bold text-gray-700 uppercase">Points acquis par XP</label>
                          <p className="text-xs text-gray-500 mb-2">Utilisé pour les points achetés avec de l'expérience.</p>
                          <div className="flex items-center gap-3">
                              <input 
                                  type="color" 
                                  value={theme.xpColor}
                                  onChange={(e) => updateTheme('xpColor', e.target.value)}
                                  className="w-12 h-12 border-none rounded-lg cursor-pointer bg-white shadow-sm ring-1 ring-gray-200"
                              />
                              <div className="flex-grow flex flex-col justify-center">
                                  <div className="flex gap-1.5 mb-1">
                                      <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.xpColor }}></span>
                                      <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.xpColor }}></span>
                                      <span className="w-4 h-4 rounded-full border border-stone-400 bg-transparent"></span>
                                  </div>
                                  <span className="text-xs font-mono font-bold text-gray-600">{theme.xpColor}</span>
                              </div>
                          </div>
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default AppearanceEditor;
