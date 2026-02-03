
import React from 'react';
import { UserPlus } from 'lucide-react';
import { HeaderInput } from './Shared';

interface SheetHeaderProps {
    headerData: {
        name: string;
        player: string;
        chronicle: string;
        nature: string;
        conduct: string;
        status: string;
        age: string;
        sex: string;
        born: string;
        height: string;
        hair: string;
        eyes: string;
    };
    creationActive: boolean;
    onUpdateHeader: (field: any, value: string) => void;
    onToggleCreationMode: () => void;
}

const SheetHeader: React.FC<SheetHeaderProps> = ({
    headerData,
    creationActive,
    onUpdateHeader,
    onToggleCreationMode
}) => {
    return (
        <>
            {/* Main Title */}
            <div className="py-3 border-b-2 border-stone-800 bg-white relative flex justify-center items-center">
                <h1 className="text-4xl font-black text-center uppercase tracking-[0.2em] text-indigo-950 font-serif">
                    Seigneurs des Mystères
                </h1>
                {/* Creation Mode Toggle Button */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center no-print">
                    <button
                        onClick={onToggleCreationMode}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${creationActive
                            ? 'bg-green-100 text-green-700 border border-green-300 shadow-sm'
                            : 'bg-stone-100 text-stone-500 border border-stone-300 hover:bg-stone-200'
                            }`}
                        title={creationActive ? "Désactiver le Mode Création" : "Activer le Mode Création (Réinitialise la fiche !)"}
                    >
                        <UserPlus size={16} />
                        <span>Mode Création</span>
                        <div className={`w-2 h-2 rounded-full ${creationActive ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}`} />
                    </button>
                </div>
            </div>

            {/* New 2-Line Header Layout */}
            <div className="flex flex-col border-b-2 border-stone-800 text-xs">
                {/* Row 1: Identity */}
                <div className="flex border-b border-stone-400 h-10 bg-white">
                    <HeaderInput label="Nom" value={headerData.name} onChange={(v) => onUpdateHeader('name', v)} className="flex-grow-[2] border-r border-stone-300" />
                    <HeaderInput label="Joueur" value={headerData.player} onChange={(v) => onUpdateHeader('player', v)} className="flex-grow border-r border-stone-300" />
                    <HeaderInput label="Chronique" value={headerData.chronicle} onChange={(v) => onUpdateHeader('chronicle', v)} className="flex-grow border-r border-stone-300" />
                    <HeaderInput label="Nature" value={headerData.nature} onChange={(v) => onUpdateHeader('nature', v)} className="flex-grow border-r border-stone-300" />
                    <HeaderInput label="Conduite" value={headerData.conduct} onChange={(v) => onUpdateHeader('conduct', v)} className="flex-grow border-r border-stone-300" />
                    <HeaderInput label="Statut" value={headerData.status} onChange={(v) => onUpdateHeader('status', v)} className="flex-grow" />
                </div>

                {/* Row 2: Physical / Details */}
                <div className="flex h-10 bg-white">
                    <HeaderInput label="Age" value={headerData.age} onChange={(v) => onUpdateHeader('age', v)} className="w-[10%] border-r border-stone-300" />
                    <HeaderInput label="Sexe" value={headerData.sex} onChange={(v) => onUpdateHeader('sex', v)} className="w-[10%] border-r border-stone-300" />
                    <HeaderInput label="Né(e) le" value={headerData.born} onChange={(v) => onUpdateHeader('born', v)} className="flex-grow border-r border-stone-300" />
                    <HeaderInput label="Taille" value={headerData.height} onChange={(v) => onUpdateHeader('height', v)} className="w-[10%] border-r border-stone-300" />
                    <HeaderInput label="Cheveux" value={headerData.hair} onChange={(v) => onUpdateHeader('hair', v)} className="flex-grow border-r border-stone-300" />
                    <HeaderInput label="Yeux" value={headerData.eyes} onChange={(v) => onUpdateHeader('eyes', v)} className="flex-grow" />
                </div>
            </div>
        </>
    );
};

export default SheetHeader;
