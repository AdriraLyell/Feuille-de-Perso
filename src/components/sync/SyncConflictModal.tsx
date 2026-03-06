import React, { useMemo } from 'react';
import { CharacterSheetData } from '../../types';
import { getCharacterDiff, DataDiff } from '../../utils/diffUtils';
import { AlertTriangle, ArrowLeftRight, Check, X, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  localData: CharacterSheetData;
  remoteData: CharacterSheetData;
  onResolve: (finalData: CharacterSheetData) => void;
  onCancel: () => void;
}

export const SyncConflictModal: React.FC<Props> = ({ isOpen, localData, remoteData, onResolve, onCancel }) => {
  const diffs = useMemo(() => {
    if (!isOpen || !remoteData) return [];
    return getCharacterDiff(localData, remoteData);
  }, [isOpen, localData, remoteData]);

  if (!isOpen) return null;

  const handleKeepLocal = () => onResolve(localData);
  const handleKeepRemote = () => onResolve(remoteData);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-amber-500/50 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-amber-950/20">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-amber-500/20 rounded-full">
              <ShieldAlert className="text-amber-500" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-100 uppercase tracking-tighter">Conflit de Synchronisation</h2>
              <p className="text-stone-400 text-xs">Le MJ a modifié votre fiche, mais vous avez aussi des modifications non envoyées.</p>
            </div>
          </div>
        </div>

        {/* Diff List */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          <p className="text-sm text-stone-300 italic mb-4">
            Voici les différences détectées entre votre version (Locale) et celle du MJ (Distante) :
          </p>

          <div className="space-y-2">
            {diffs.map((diff, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 bg-white/5 rounded-lg border border-white/5 text-xs">
                <div className="col-span-4 font-bold text-stone-400 truncate">{diff.label}</div>
                <div className="col-span-3 text-red-400 bg-red-950/30 p-1 rounded text-center border border-red-900/30">
                  <span className="opacity-50 block text-[8px] uppercase">Locale</span>
                  {String(diff.local)}
                </div>
                <div className="col-span-2 flex justify-center text-stone-600">
                  <ArrowLeftRight size={14} />
                </div>
                <div className="col-span-3 text-emerald-400 bg-emerald-950/30 p-1 rounded text-center border border-emerald-900/30">
                  <span className="opacity-50 block text-[8px] uppercase">Distante</span>
                  {String(diff.remote)}
                </div>
              </div>
            ))}
            {diffs.length === 0 && (
              <div className="text-center py-8 text-stone-500 italic">
                Aucune différence majeure détectée dans les champs suivis.
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-white/10 bg-black/20 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleKeepLocal}
              className="flex flex-col items-center gap-1 p-4 bg-stone-800 hover:bg-stone-700 text-white rounded-lg border border-white/10 transition-all active:scale-95"
            >
              <span className="font-bold text-sm">Garder ma version</span>
              <span className="text-[10px] text-stone-400">Écrasera les modifs du MJ</span>
            </button>
            <button
              onClick={handleKeepRemote}
              className="flex flex-col items-center gap-1 p-4 bg-amber-700 hover:bg-amber-600 text-white rounded-lg shadow-lg shadow-amber-900/20 transition-all active:scale-95"
            >
              <span className="font-bold text-sm">Prendre la version MJ</span>
              <span className="text-[10px] text-amber-200/60">Écrasera vos modifs locales</span>
            </button>
          </div>
          
          <button
            onClick={onCancel}
            className="text-stone-500 hover:text-stone-300 text-xs py-2 uppercase tracking-widest font-bold transition-colors"
          >
            Décider plus tard
          </button>
        </div>
      </div>
    </div>
  );
};
