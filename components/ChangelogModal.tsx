import React from 'react';
import { X, GitCommit, Calendar, Tag } from 'lucide-react';
import { CHANGELOG } from '../constants';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-100 p-4 border-b border-slate-200 rounded-t-xl">
            <div>
                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                    <GitCommit className="text-blue-600" />
                    Journal des Modifications
                </h3>
                <p className="text-xs text-slate-500">Suivi du développement et des mises à jour</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 hover:bg-slate-200 p-2 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 bg-slate-50">
            <div className="space-y-6">
                {CHANGELOG.map((entry, index) => (
                    <div key={index} className="relative pl-8 before:absolute before:left-[11px] before:top-8 before:bottom-[-24px] before:w-[2px] before:bg-slate-200 last:before:hidden">
                        {/* Timeline Dot */}
                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 bg-white ${
                            index === 0 ? 'border-blue-500 text-blue-500 shadow-md' : 'border-slate-300 text-slate-300'
                        }`}>
                            <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-slate-300'}`} />
                        </div>

                        {/* Card */}
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        entry.type === 'major' ? 'bg-purple-100 text-purple-700' :
                                        entry.type === 'minor' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        v{entry.version}
                                    </span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Calendar size={12} /> {entry.date}
                                    </span>
                                </div>
                                {index === 0 && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                        Actuel
                                    </span>
                                )}
                            </div>

                            <ul className="space-y-2">
                                {entry.changes.map((change, i) => (
                                    <li key={i} className="text-sm text-slate-700 flex gap-2 items-start">
                                        <Tag size={14} className="mt-1 text-slate-400 shrink-0" />
                                        <span>{change}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl text-center text-xs text-slate-400">
            Seigneurs des Mystères RPG - Feuille de Personnage Numérique
        </div>

      </div>
    </div>
  );
};

export default ChangelogModal;