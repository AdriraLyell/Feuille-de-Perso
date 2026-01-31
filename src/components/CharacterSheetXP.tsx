
import React from 'react';
import { useCharacter } from '../context/CharacterContext';
import { CharacterSheetData, XPEntry } from '../types';
import { Plus, Trash2, Calendar, FileText, TrendingUp, User, MessageSquare } from 'lucide-react';

interface Props {
  isLandscape?: boolean;
}

const CharacterSheetXP: React.FC<Props> = ({ isLandscape = false }) => {
  const { data, updateData: onChange, addLog: onAddLog } = useCharacter();

  const addRow = () => {
    const newEntry: XPEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      scenario: '',
      spendingLocation: '', // Initialize new field
      amount: 0,
      mj: ''
    };
    onChange({
      ...data,
      xpLogs: [...(data.xpLogs || []), newEntry]
    });
    onAddLog("Ajout d'une entrée XP", 'success', 'sheet');
  };

  const updateRow = (id: string, field: keyof XPEntry, value: string | number) => {
    const newLogs = (data.xpLogs || []).map(entry => {
      if (entry.id === id) {
        return { ...entry, [field]: value };
      }
      return entry;
    });
    onChange({ ...data, xpLogs: newLogs });
    onAddLog(`Modification XP (${String(field)})`, 'info', 'sheet', `xp_${id}_${String(field)}`);
  };

  const deleteRow = (id: string) => {
    const newLogs = (data.xpLogs || []).filter(entry => entry.id !== id);
    onChange({ ...data, xpLogs: newLogs });
    onAddLog("Suppression d'une entrée XP", 'danger', 'sheet');
  };

  const totalXP = (data.xpLogs || []).reduce((sum, entry) => sum + (entry.amount || 0), 0);

  // Define grid template for consistent layout
  // Date: 110px, MJ: 0.5fr, Scenario: 1.5fr, Notes: 2fr, XP: 45px, Action: 40px
  const gridClass = "grid grid-cols-[110px_0.5fr_1.5fr_2fr_45px_40px]";

  return (
    <div className={`sheet-container xp-sheet p-8 ${isLandscape ? 'landscape' : ''}`}>

      {/* Title Header with Button */}
      <div className="py-3 border-b-2 border-stone-800 mb-6 relative flex items-center justify-center bg-white">
        <div className="absolute left-0">
          <button
            onClick={addRow}
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded shadow hover:bg-blue-800 transition-colors text-sm font-bold"
          >
            <Plus size={16} /> Ajouter une entrée
          </button>
        </div>
        <h1 className="text-3xl font-black text-center uppercase tracking-[0.2em] flex items-center justify-center gap-3 text-indigo-950 font-serif">
          <TrendingUp size={32} /> Gestion de l'Expérience
        </h1>
      </div>

      <div className="flex-grow flex flex-col bg-white border border-stone-400 rounded-sm overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className={`${gridClass} bg-slate-200 border-b border-stone-400 font-bold text-sm uppercase py-2 px-4 text-slate-800`}>
          <div className="flex items-center gap-2"><Calendar size={14} /> Date</div>
          <div className="flex items-center gap-2"><User size={14} /> MJ</div>
          <div className="flex items-center gap-2"><FileText size={14} /> Scénario</div>
          <div className="flex items-center gap-2"><MessageSquare size={14} /> Notes & Commentaires</div>
          <div className="text-center">XP</div>
          <div className="text-center"></div> {/* Empty Actions Header */}
        </div>

        {/* Table Body */}
        <div className="flex-grow overflow-auto bg-stone-50/20">
          {(!data.xpLogs || data.xpLogs.length === 0) && (
            <div className="text-center text-stone-400 italic py-10">
              Aucune entrée d'expérience. Cliquez sur le bouton "Ajouter une entrée" en haut pour commencer.
            </div>
          )}

          {(data.xpLogs || []).map((entry, index) => (
            <div key={entry.id} className={`${gridClass} border-b border-stone-200 hover:bg-blue-50/50 items-center py-2 px-4 transition-colors`}>
              {/* Date */}
              <div className="pr-2">
                <input
                  type="date"
                  className="w-full bg-transparent border-b border-dotted border-stone-300 focus:border-blue-500 outline-none text-sm font-handwriting text-ink"
                  value={entry.date}
                  onChange={(e) => updateRow(entry.id, 'date', e.target.value)}
                  style={{ colorScheme: 'light' }}
                />
              </div>
              {/* MJ */}
              <div className="pr-2 border-l border-stone-200 pl-2">
                <input
                  type="text"
                  placeholder="MJ..."
                  className="w-full bg-transparent border-b border-dotted border-stone-300 focus:border-blue-500 outline-none text-sm font-handwriting text-ink"
                  value={entry.mj || ''}
                  onChange={(e) => updateRow(entry.id, 'mj', e.target.value)}
                />
              </div>
              {/* Scenario */}
              <div className="pr-2 border-l border-stone-200 pl-2">
                <input
                  type="text"
                  placeholder="Nom du scénario..."
                  className="w-full bg-transparent border-b border-dotted border-stone-300 focus:border-blue-500 outline-none text-sm font-handwriting text-ink"
                  value={entry.scenario}
                  onChange={(e) => updateRow(entry.id, 'scenario', e.target.value)}
                />
              </div>
              {/* Notes & Commentaires (Formerly Lieu de Dépense) */}
              <div className="pr-2 border-l border-stone-200 pl-2">
                <input
                  type="text"
                  placeholder="Commentaires..."
                  className="w-full bg-transparent border-b border-dotted border-stone-300 focus:border-blue-500 outline-none text-sm font-handwriting text-ink text-stone-600"
                  value={entry.spendingLocation || ''}
                  onChange={(e) => updateRow(entry.id, 'spendingLocation', e.target.value)}
                />
              </div>
              {/* XP Amount */}
              <div className="border-l border-stone-200 px-2">
                <input
                  type="number"
                  className="w-full bg-transparent text-center font-bold text-blue-900 outline-none border-b border-dotted border-stone-300 focus:border-blue-500 font-handwriting text-sm"
                  value={entry.amount}
                  onChange={(e) => updateRow(entry.id, 'amount', parseInt(e.target.value) || 0)}
                />
              </div>
              {/* Action (Trash) */}
              <div className="flex justify-center border-l border-stone-200 pl-1">
                <button
                  onClick={() => deleteRow(entry.id)}
                  className="text-stone-400 hover:text-red-600 transition-colors p-1"
                  title="Supprimer la ligne"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Table Footer / Summary */}
        <div className="bg-stone-100 border-t border-stone-400 p-4 flex justify-end items-center">
          <div className="flex items-center gap-4 text-lg">
            <span className="font-bold text-stone-600 uppercase">Total XP Gagnés :</span>
            <span className="font-mono font-bold text-blue-900 bg-white px-4 py-1 rounded border border-blue-200 shadow-inner">
              {totalXP}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheetXP;
