
import React, { useState } from 'react';
import { Printer, CheckSquare, Square, X, Layers, List, FileType, TrendingUp } from 'lucide-react';

interface PrintSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selection: Record<string, boolean>) => void;
}

const PrintSelectionModal: React.FC<PrintSelectionModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [selection, setSelection] = useState({
    p1: true,
    specs: false,
    p2: true,
    xp: false
  });

  if (!isOpen) return null;

  const toggle = (key: keyof typeof selection) => {
    setSelection(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrint = () => {
    onConfirm(selection);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Printer className="text-blue-600" size={20} />
                Options d'impression
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 hover:bg-gray-200 p-1 rounded transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Sélectionnez les pages que vous souhaitez imprimer. Chaque section tiendra sur une page A4.</p>
            
            <div className="space-y-3">
                <button 
                    onClick={() => toggle('p1')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${selection.p1 ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                >
                    {selection.p1 ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20} />}
                    <Layers size={18} />
                    <span className="font-semibold">Page 1 : Personnage</span>
                </button>

                <button 
                    onClick={() => toggle('specs')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${selection.specs ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                >
                    {selection.specs ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20} />}
                    <List size={18} />
                    <span className="font-semibold">Spécialisations</span>
                </button>

                <button 
                    onClick={() => toggle('p2')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${selection.p2 ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                >
                    {selection.p2 ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20} />}
                    <FileType size={18} />
                    <span className="font-semibold">Page 2 : Détails & Equipement</span>
                </button>

                <button 
                    onClick={() => toggle('xp')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${selection.xp ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                >
                    {selection.xp ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20} />}
                    <TrendingUp size={18} />
                    <span className="font-semibold">Gestion de l'Expérience</span>
                </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
                <button 
                    onClick={handlePrint}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm"
                >
                    <Printer size={18} />
                    Lancer l'impression
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrintSelectionModal;
