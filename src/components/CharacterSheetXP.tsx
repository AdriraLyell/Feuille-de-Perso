
import React, { useState } from 'react';
import { useCharacter } from '../context/CharacterContext';
import { XPEntry } from '../types';
import { Plus, Trash2, Calendar, FileText, TrendingUp, User, MessageSquare, History, Clock, ArrowUpRight, ArrowDownRight, RotateCcw } from 'lucide-react';

interface Props {
  isLandscape?: boolean;
}

const CharacterSheetXP: React.FC<Props> = ({ isLandscape = false }) => {
  const { data, updateData: onChange, addLog: onAddLog, recordXPTransaction } = useCharacter();
  const [activeTab, setActiveTab] = useState<'sessions' | 'history'>('sessions');

  const addRow = () => {
    const newEntry: XPEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      scenario: '',
      spendingLocation: '', // Initialize new field
      amount: 0,
      mj: '',
      countsAsScenario: true
    };
    onChange({
      ...data,
      xpLogs: [...(data.xpLogs || []), newEntry]
    });

    // Auto-record in history
    recordXPTransaction({
      type: 'earn',
      description: 'Nouvelle session ajoutée',
      amount: 0,
      source: 'Session',
      relatedId: newEntry.id
    });

    onAddLog("Ajout d'une entrée XP", 'success', 'sheet');
  };

  const updateRow = (id: string, field: keyof XPEntry, value: string | number | boolean) => {
    const entryToUpdate = (data.xpLogs || []).find(e => e.id === id);
    if (!entryToUpdate) return;

    // Log adjustment in history if amount changes
    if (field === 'amount' && entryToUpdate.amount !== value) {
      const diff = (value as number) - entryToUpdate.amount;
      recordXPTransaction({
        type: diff > 0 ? 'earn' : 'spend',
        description: `Ajustement XP Session : ${entryToUpdate.scenario || 'Sans nom'}`,
        amount: Math.abs(diff),
        source: 'Session',
        relatedId: id
      });
    } else if (field === 'scenario' && entryToUpdate.scenario !== value) {
      // Just update logs for scenario name change if needed? Maybe too much.
    }

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
  const totalSpent = (data.xpTransactions || [])
    .filter(t => t.type === 'spend')
    .reduce((sum, t) => sum + t.amount, 0);

  // Date: 110px, MJ: 0.5fr, Scenario: 1.5fr, Notes: 2fr, XP: 45px, Action: 40px, Session: 40px
  const sessionGridClass = "grid grid-cols-[110px_0.5fr_1.5fr_2fr_45px_40px_40px]";
  // Date/Time: 160px, Type: 100px, Description: 1.5fr, Source: 1fr, Amount: 80px
  const historyGridClass = "grid grid-cols-[160px_100px_1.5fr_1fr_80px]";

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

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-4 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-6 py-2 font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${activeTab === 'sessions'
            ? 'border-blue-600 text-blue-700 bg-blue-50/50'
            : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
        >
          <Calendar size={18} /> Sessions & Résumé
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${activeTab === 'history'
            ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
            : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
        >
          <History size={18} /> Historique des Dépenses
        </button>
      </div>

      <div className="flex-grow flex flex-col bg-white border border-stone-400 rounded-sm overflow-hidden shadow-sm">
        {activeTab === 'sessions' ? (
          <>
            {/* Table Header - Sessions */}
            <div className={`${sessionGridClass} bg-slate-200 border-b border-stone-400 font-bold text-sm uppercase py-2 px-4 text-slate-800`}>
              <div className="flex items-center gap-2"><Calendar size={14} /> Date</div>
              <div className="flex items-center gap-2"><User size={14} /> MJ</div>
              <div className="flex items-center gap-2"><FileText size={14} /> Scénario</div>
              <div className="flex items-center gap-2"><MessageSquare size={14} /> Notes & Commentaires</div>
              <div className="text-center">XP</div>
              <div className="text-center"></div>
              <div className="text-center text-[10px]">Session</div>
            </div>

            {/* Table Body - Sessions */}
            <div className="flex-grow overflow-auto bg-stone-50/20">
              {(!data.xpLogs || data.xpLogs.length === 0) && (
                <div className="text-center text-stone-400 italic py-10">
                  Aucune entrée d'expérience.
                </div>
              )}

              {(data.xpLogs || []).map((entry) => (
                <div key={entry.id} className={`${sessionGridClass} border-b border-stone-200 hover:bg-blue-50/50 items-center py-2 px-4 transition-colors`}>
                  <div className="pr-2">
                    <input
                      type="date"
                      className="w-full bg-transparent border-b border-dotted border-stone-300 outline-none text-sm font-handwriting"
                      value={entry.date || ''}
                      onChange={(e) => updateRow(entry.id, 'date', e.target.value)}
                    />
                  </div>
                  <div className="pr-2 border-l border-stone-200 pl-2">
                    <input
                      type="text"
                      placeholder="MJ..."
                      className="w-full bg-transparent border-b border-dotted border-stone-300 outline-none text-sm font-handwriting"
                      value={entry.mj || ''}
                      onChange={(e) => updateRow(entry.id, 'mj', e.target.value)}
                    />
                  </div>
                  <div className="pr-2 border-l border-stone-200 pl-2">
                    <input
                      type="text"
                      placeholder="Scénario..."
                      className="w-full bg-transparent border-b border-dotted border-stone-300 outline-none text-sm font-handwriting"
                      value={entry.scenario || ''}
                      onChange={(e) => updateRow(entry.id, 'scenario', e.target.value)}
                    />
                  </div>
                  <div className="pr-2 border-l border-stone-200 pl-2">
                    <input
                      type="text"
                      placeholder="Commentaires..."
                      className="w-full bg-transparent border-b border-dotted border-stone-300 outline-none text-sm font-handwriting text-stone-600"
                      value={entry.spendingLocation || ''}
                      onChange={(e) => updateRow(entry.id, 'spendingLocation', e.target.value)}
                    />
                  </div>
                  <div className="border-l border-stone-200 px-2">
                    <input
                      type="number"
                      className="w-full bg-transparent text-center font-bold text-blue-900 outline-none border-b border-dotted font-handwriting text-sm"
                      value={entry.amount}
                      onChange={(e) => updateRow(entry.id, 'amount', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex justify-center border-l border-stone-200 pl-1">
                    <button onClick={() => deleteRow(entry.id)} className="text-stone-400 hover:text-red-600 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="border-l border-stone-200 px-2 flex justify-center">
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={entry.countsAsScenario ?? (entry.amount > 0)}
                      onChange={(e) => updateRow(entry.id, 'countsAsScenario', e.target.checked)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Table Header - History */}
            <div className={`${historyGridClass} bg-indigo-100 border-b border-stone-400 font-bold text-sm uppercase py-2 px-4 text-indigo-900 text-center`}>
              <div className="flex items-center gap-2 justify-center"><Clock size={14} /> Date & Heure</div>
              <div>Type</div>
              <div className="text-left pl-4">Sujet / Description</div>
              <div>Provenance</div>
              <div>Montant</div>
            </div>

            {/* Table Body - History */}
            <div className="flex-grow overflow-auto bg-stone-50/20">
              {(!data.xpTransactions || data.xpTransactions.length === 0) && (
                <div className="text-center text-stone-400 italic py-10">
                  Aucun historique de dépense enregistré.
                </div>
              )}

              {(data.xpTransactions || []).map((t) => (
                <div key={t.id} className={`${historyGridClass} border-b border-stone-200 hover:bg-indigo-50/30 items-center py-2 px-4 transition-colors font-mono text-[13px]`}>
                  <div className="text-stone-500 text-center">
                    {new Date(t.timestamp).toLocaleDateString()} <span className="text-[10px] bg-stone-100 px-1 rounded">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-center">
                    {t.type === 'earn' && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><ArrowUpRight size={10} /> GAIN</span>}
                    {t.type === 'spend' && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><ArrowDownRight size={10} /> DÉPENSE</span>}
                    {t.type === 'refund' && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><RotateCcw size={10} /> REMBOURSE</span>}
                  </div>
                  <div className="text-indigo-900 font-bold pl-4">
                    {t.description}
                  </div>
                  <div className="text-stone-500 text-center italic text-[11px]">
                    {t.source || '-'}
                  </div>
                  <div className={`text-right font-bold pr-2 ${t.type === 'earn' ? 'text-green-600' : t.type === 'spend' ? 'text-red-600' : 'text-blue-600'}`}>
                    {t.type === 'spend' ? '-' : '+'}{t.amount} XP
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Table Footer / Summary */}
        <div className="bg-stone-100 border-t border-stone-400 p-4 flex justify-between items-center">
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-lg border border-red-200 shadow-sm flex items-center gap-3">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-tighter">Total Dépensé</span>
              <span className="font-mono font-bold text-red-700 text-xl">-{totalSpent}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-lg">
            <span className="font-bold text-stone-600 uppercase">Total XP Gagnés :</span>
            <span className="font-mono font-bold text-green-700 bg-white px-4 py-1 rounded border border-green-200 shadow-inner">
              {totalXP}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheetXP;
