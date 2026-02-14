import React from 'react';
import { Library, X } from 'lucide-react';

interface WizardHeaderProps {
    characterName: string;
    onClose: () => void;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({ characterName, onClose }) => {
    return (
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                    <Library size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Assistant d'Import Bibliothèque</h2>
                    <p className="text-indigo-100 text-xs">Extraction des données de {characterName}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>
    );
};
