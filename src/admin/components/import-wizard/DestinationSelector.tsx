import React from 'react';
import { Book, Library } from 'lucide-react';

interface DestinationSelectorProps {
    importDestination: 'campaign' | 'global';
    onUpdateDestination: (dest: 'campaign' | 'global') => void;
}

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({ importDestination, onUpdateDestination }) => {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 px-1">Destination de l'Import</h4>
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => onUpdateDestination('campaign')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${importDestination === 'campaign' ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/10' : 'bg-slate-100/50 border-slate-200 hover:bg-white'}`}
                >
                    <Book size={20} className={importDestination === 'campaign' ? 'text-indigo-600' : 'text-slate-400'} />
                    <div className="text-center">
                        <div className={`text-sm font-bold ${importDestination === 'campaign' ? 'text-slate-900' : 'text-slate-500'}`}>Cette Campagne</div>
                        <div className="text-[10px] text-slate-400 italic">Spécifique à ce MJ</div>
                    </div>
                </button>
                <button
                    onClick={() => onUpdateDestination('global')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${importDestination === 'global' ? 'bg-white border-purple-600 shadow-md ring-2 ring-purple-600/10' : 'bg-slate-100/50 border-slate-200 hover:bg-white'}`}
                >
                    <Library size={20} className={importDestination === 'global' ? 'text-purple-600' : 'text-slate-400'} />
                    <div className="text-center">
                        <div className={`text-sm font-bold ${importDestination === 'global' ? 'text-slate-900' : 'text-slate-500'}`}>Réserve Universelle</div>
                        <div className="text-[10px] text-slate-400 italic">Master Reserve (Global)</div>
                    </div>
                </button>
            </div>
        </div>
    );
};
