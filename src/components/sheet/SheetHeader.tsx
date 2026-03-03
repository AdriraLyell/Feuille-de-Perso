
import React from 'react';
import { UserPlus, PencilLine, Check } from 'lucide-react';
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
        campaignStartDate?: string;
        fictionCurrentDate?: string;
    };
    creationActive: boolean;
    isEditMode?: boolean;
    onUpdateHeader: (field: keyof SheetHeaderProps['headerData'], value: string) => void;
    onToggleEditMode?: () => void;
    onToggleCreationMode?: () => void;
    isDateLocked?: boolean;
}

const SheetHeader: React.FC<SheetHeaderProps> = ({
    headerData,
    creationActive,
    isEditMode = false,
    onUpdateHeader,
    onToggleEditMode,
    onToggleCreationMode,
    isDateLocked = false
}) => {
    // Helper pour parser les dates de manière flexible (FR, ISO, ou Fictif)
    const parseFlexibleDate = (dateStr: string) => {
        if (!dateStr) return null;
        const trimmed = dateStr.trim();

        // 1. Format français : DD/MM/YYYY
        const frMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4,})$/);
        if (frMatch) {
            return { day: parseInt(frMatch[1]), month: parseInt(frMatch[2]), year: parseInt(frMatch[3]), type: 'standard' };
        }

        // 2. Format ISO : YYYY-MM-DD
        const isoMatch = trimmed.match(/^(\d{4,})-(\d{1,2})-(\d{1,2})$/);
        if (isoMatch) {
            return { year: parseInt(isoMatch[1]), month: parseInt(isoMatch[2]), day: parseInt(isoMatch[3]), type: 'standard' };
        }

        // 3. Format Fictif : "Jour Mois Année" (on prend le dernier nombre comme année)
        const yearMatch = trimmed.match(/(-?\d+)$/);
        if (yearMatch) {
            const year = parseInt(yearMatch[1]);
            const dayMatch = trimmed.match(/^(\d+)/);
            return { year, month: 1, day: dayMatch ? parseInt(dayMatch[1]) : 1, type: 'fictional' };
        }

        return null;
    };

    // Calcul automatique de l'âge
    const calculatedAge = React.useMemo(() => {
        if (!headerData.born || !headerData.fictionCurrentDate) return null;

        const birth = parseFlexibleDate(headerData.born);
        const current = parseFlexibleDate(headerData.fictionCurrentDate);

        if (!birth || !current) return null;

        // Calcul simplifié basé sur l'année
        let age = current.year - birth.year;

        // Si on a des infos de mois/jour pour les deux, on affine pour le calendrier standard
        if (birth.type === 'standard' && current.type === 'standard') {
            if (current.month < birth.month || (current.month === birth.month && current.day < birth.day)) {
                age--;
            }
        }

        return age >= 0 ? age.toString() : "0";
    }, [headerData.born, headerData.fictionCurrentDate]);

    // Effet pour mettre à jour l'âge dans les données si calculé
    React.useEffect(() => {
        if (calculatedAge !== null && calculatedAge !== headerData.age) {
            onUpdateHeader('age', calculatedAge);
        }
    }, [calculatedAge, headerData.age, onUpdateHeader]);

    const lockTitle = "Champ verrouillé (géré par le calendrier de la campagne)";

    return (
        <>
            {/* Main Title Area with Action Buttons */}
            <div className="py-2 border-b-2 border-stone-800 bg-white relative flex justify-between items-center px-6 gap-2">
                {/* Left Side: Creation Button (Only if active) */}
                <div className="flex-shrink-0 min-w-[150px] flex justify-start">
                    {creationActive && onToggleCreationMode && (
                        <button
                            onClick={onToggleCreationMode}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black transition-all shadow-sm transform hover:scale-105 active:scale-95 ${creationActive
                                ? 'bg-green-600 text-white border border-green-400'
                                : 'bg-stone-50 text-stone-500 border border-stone-200'
                                }`}
                        >
                            <UserPlus size={14} />
                            <span className="uppercase tracking-tight">Mode Création Active</span>
                        </button>
                    )}
                </div>

                {/* Center: Title */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-center uppercase tracking-[0.1em] text-indigo-950 font-serif flex-grow whitespace-nowrap overflow-hidden text-ellipsis">
                    Seigneurs des Mystères
                </h1>

                {/* Right Side: Edit Mode Button */}
                <div className="flex-shrink-0 min-w-[150px] flex justify-end">
                    {onToggleEditMode && (
                        <button
                            onClick={onToggleEditMode}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[11px] font-black transition-all shadow-md transform hover:scale-105 active:scale-95 ${isEditMode
                                ? 'bg-red-600 text-white border-2 border-white ring-4 ring-red-500/40 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.6)]'
                                : 'bg-stone-50 text-stone-500 border border-stone-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                                }`}
                        >
                            {isEditMode ? <Check size={16} className="animate-bounce" /> : <PencilLine size={14} />}
                            <span className="uppercase tracking-wider">{isEditMode ? 'Valider Disposition' : 'Editer Compétences'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Revised 2-Line Header Layout */}
            <div className="flex flex-col border-b-2 border-stone-800 text-xs">
                {/* Row 1: Identity & Campaign Start */}
                <div className="flex border-b border-stone-400 h-10 bg-white">
                    <HeaderInput label="Nom" value={headerData.name} onChange={(v) => onUpdateHeader('name', v)} className="flex-grow-[1.5] border-r border-stone-300" />
                    <HeaderInput label="Joueur" value={headerData.player} onChange={(v) => onUpdateHeader('player', v)} className="flex-grow border-r border-stone-300" />
                    <HeaderInput label="Chronique" value={headerData.chronicle} onChange={(v) => onUpdateHeader('chronicle', v)} className="flex-grow border-r border-stone-300" />
                    <HeaderInput label="Nature" value={headerData.nature} onChange={(v) => onUpdateHeader('nature', v)} className="flex-grow border-r border-stone-300" />
                    <HeaderInput label="Conduite" value={headerData.conduct} onChange={(v) => onUpdateHeader('conduct', v)} className="flex-grow border-r border-stone-300" />
                    <HeaderInput label="Statut" value={headerData.status} onChange={(v) => onUpdateHeader('status', v)} className="flex-grow border-r border-stone-300" />
                    <HeaderInput
                        label="Début"
                        value={headerData.campaignStartDate || ''}
                        onChange={(v) => onUpdateHeader('campaignStartDate', v)}
                        className={`flex-grow ${isDateLocked ? 'bg-stone-50' : ''}`}
                        readOnly={isDateLocked}
                        title={isDateLocked ? lockTitle : ""}
                    />
                </div>

                {/* Row 2: Physical / Dates / Details */}
                <div className="flex h-10 bg-white">
                    <div className={`flex items-baseline px-2 py-0.5 h-full w-[8%] border-r border-stone-300 ${calculatedAge !== null ? 'bg-amber-50/30' : ''}`}>
                        <span className="text-[10px] font-bold mr-1 whitespace-nowrap uppercase text-stone-500 tracking-wider shrink-0 leading-none">Age :</span>
                        <input
                            className={`sheet-input text-sm w-full min-w-0 ${calculatedAge !== null ? 'font-bold text-amber-800' : ''}`}
                            value={headerData.age}
                            onChange={(e) => calculatedAge === null && onUpdateHeader('age', e.target.value)}
                            readOnly={calculatedAge !== null}
                            title={calculatedAge !== null ? "Calculé automatiquement via Né(e) le et Date Fiction" : ""}
                        />
                    </div>
                    <HeaderInput label="Sexe" value={headerData.sex} onChange={(v) => onUpdateHeader('sex', v)} className="w-[8%] border-r border-stone-300" />
                    <HeaderInput label="Né(e) le" value={headerData.born} onChange={(v) => onUpdateHeader('born', v)} className="flex-grow border-r border-stone-300" />
                    <HeaderInput
                        label="Date Fiction"
                        value={headerData.fictionCurrentDate || ''}
                        onChange={(v) => onUpdateHeader('fictionCurrentDate', v)}
                        className={`flex-grow border-r border-stone-300 ${isDateLocked ? 'bg-stone-50' : ''}`}
                        readOnly={isDateLocked}
                        title={isDateLocked ? lockTitle : ""}
                    />
                    <HeaderInput label="Taille" value={headerData.height} onChange={(v) => onUpdateHeader('height', v)} className="w-[10%] border-r border-stone-300" />
                    <HeaderInput label="Cheveux" value={headerData.hair} onChange={(v) => onUpdateHeader('hair', v)} className="flex-grow border-r border-stone-300" />
                    <HeaderInput label="Yeux" value={headerData.eyes} onChange={(v) => onUpdateHeader('eyes', v)} className="flex-grow" />
                </div>
            </div>
        </>
    );
};

export default SheetHeader;
