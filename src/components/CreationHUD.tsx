
import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useCharacter } from '../context/CharacterContext';
import { Calculator, AlertTriangle, Sliders, Feather, AlertOctagon } from 'lucide-react';
import { useCreationBudget } from '../hooks/useCreationBudget';
import { BudgetGauge } from './creation/BudgetGauge';
import { CreationValidationModal } from './creation/CreationValidationModal';
import { CreationGuidance } from './creation/CreationGuidance';

const CreationHUD: React.FC = () => {
    const { data, updateData: setData, addLog } = useCharacter();
    const [showConfirm, setShowConfirm] = useState(false);

    const onValidate = () => {
        setData(prev => ({
            ...prev,
            creationConfig: {
                ...prev.creationConfig,
                active: false
            }
        }));
        addLog("Création de personnage validée. Mode création désactivé.", 'success', 'sheet');
    };

    const {
        xpSpentTotal,
        xpSpentAttributes,
        xpSpentSkills,
        xpSpentBackgrounds,
        xpEquivalence,
        ranksUsed,
        attributesUsed,
        backgroundsUsed,
        messages,
        overspent,
        hasErrors,
        formatNumber,
        isGlobalPoints,
        xpRemainingGlobal
    } = useCreationBudget();

    const { mode, rankSlots, startingXP, pointsBuckets, attributePoints, backgroundPoints, attributeMin, attributeMax } = data.creationConfig;

    const minAttr = attributeMin ?? -2;
    const maxAttr = attributeMax ?? 3;

    const handleValidateClick = () => {
        setShowConfirm(true);
    };

    const handleConfirmValidation = () => {
        setShowConfirm(false);
        onValidate();
    };

    return (
        <>
            <CreationGuidance />

            <div className={`fixed bottom-0 left-0 right-0 z-[90] bg-stone-900 text-stone-100 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] border-t-4 transition-colors duration-300 animate-in slide-in-from-bottom no-print ${hasErrors ? 'border-red-700' : 'border-amber-600'}`}>
                <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col xl:flex-row items-center justify-between gap-6">

                    {/* Left: Identity Block */}
                    <div className="flex items-center gap-4 min-w-[280px]">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-inner shrink-0 ${hasErrors ? 'bg-red-950 border-red-600 text-red-500' : 'bg-stone-800 border-amber-600 text-amber-500'}`}>
                            {hasErrors ? <AlertTriangle size={32} /> : <Feather size={32} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-xl uppercase tracking-widest font-serif text-amber-500 leading-tight">
                                Création
                            </h3>
                            <span className="text-sm font-medium text-stone-400">
                                {mode === 'rangs' ? 'Système par Rangs' : (isGlobalPoints ? 'Système par XP (Global)' : 'Système par XP (Budgets)')}
                            </span>
                        </div>
                    </div>

                    {/* Center: Budget Dashboard */}
                    <div className="flex-grow flex justify-center flex-wrap gap-4 items-center w-full xl:w-auto">

                        {/* Stats & Info Cards */}
                        <div className="flex gap-4 mr-4 border-r border-stone-700 pr-4">
                            <div className="flex flex-col items-center justify-center">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calculator size={14} className="text-stone-500" />
                                    <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Valeur Totale</span>
                                </div>
                                <span className="font-mono font-bold text-amber-100 text-xl">{formatNumber(xpEquivalence)} XP</span>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sliders size={14} className="text-stone-500" />
                                    <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Limites Attr.</span>
                                </div>
                                <span className="font-mono font-bold text-stone-300 text-base">
                                    {minAttr > 0 ? `+${minAttr}` : minAttr} / {maxAttr > 0 ? `+${maxAttr}` : maxAttr}
                                </span>
                            </div>
                        </div>

                        {mode === 'points' ? (
                            isGlobalPoints ? (
                                // MODE GLOBAL
                                <div className={`relative px-8 py-3 rounded-lg border-2 bg-stone-800 shadow-inner min-w-[200px] text-center overflow-hidden ${xpRemainingGlobal < 0 ? 'border-red-600' : (xpRemainingGlobal === 0 ? 'border-green-600' : 'border-blue-600')}`}>
                                    <div className="text-xs uppercase text-stone-400 font-bold mb-1 tracking-widest relative z-10">XP Restants</div>
                                    <div className={`text-3xl font-mono font-black relative z-10 ${xpRemainingGlobal < 0 ? 'text-red-400' : (xpRemainingGlobal === 0 ? 'text-green-400' : 'text-blue-200')}`}>
                                        {formatNumber(xpRemainingGlobal)} {mode === 'points' && <span className="text-lg text-stone-500">/ {startingXP}</span>}
                                    </div>
                                    {/* Background Progress Effect */}
                                    <div
                                        className={`absolute bottom-0 left-0 top-0 opacity-10 transition-all duration-500 ${xpRemainingGlobal < 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                                        style={{ width: `${Math.min(100, (xpSpentTotal / startingXP) * 100)}%` }}
                                    />
                                </div>
                            ) : (
                                // MODE BUCKETS
                                <div className="flex gap-4 overflow-x-auto pb-1 items-center no-scrollbar">
                                    <BudgetGauge label="Attributs" current={xpSpentAttributes} max={pointsBuckets?.attributes || 0} formatNumber={formatNumber} />
                                    <BudgetGauge label="Compétences" current={xpSpentSkills} max={pointsBuckets?.skills || 0} formatNumber={formatNumber} />
                                    <BudgetGauge label="Arrière-plans" current={xpSpentBackgrounds} max={pointsBuckets?.backgrounds || 0} formatNumber={formatNumber} />
                                </div>
                            )
                        ) : (
                            // MODE RANGS
                            <div className="flex gap-3 overflow-x-auto pb-1 items-center no-scrollbar">
                                <BudgetGauge label="Attributs" current={attributesUsed} max={attributePoints || 15} formatNumber={formatNumber} />

                                {/* Ranks (Compact Vertical) */}
                                <div className="flex bg-stone-800 rounded-lg border border-stone-700 p-2 gap-2 shadow-lg">
                                    {[1, 2, 3, 4, 5].map(rank => {
                                        const used = ranksUsed[rank] || 0;
                                        const max = (rankSlots as Record<number, number>)[rank] || 0;
                                        if (max === 0 && used === 0) return null;

                                        const isOver = used > max;
                                        const isFull = used === max;

                                        const statusColor = isOver ? 'text-red-400' : (isFull ? 'text-green-400' : 'text-stone-300');
                                        const ringColor = isOver ? 'border-red-500' : (isFull ? 'border-green-600' : 'border-stone-600');

                                        return (
                                            <div key={rank} className="flex flex-col items-center min-w-[36px]">
                                                <div className={`w-8 h-8 rounded-full border-2 ${ringColor} flex items-center justify-center font-mono font-bold text-sm bg-stone-900 ${statusColor}`}>
                                                    {formatNumber(used)}
                                                </div>
                                                <span className="text-[9px] text-stone-500 mt-1 uppercase font-bold">R{rank}</span>
                                                <span className="text-[9px] text-stone-600 font-mono">/{max}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <BudgetGauge label="Arrière-plans" current={backgroundsUsed} max={backgroundPoints || 5} formatNumber={formatNumber} />
                            </div>
                        )}
                    </div>

                    {/* Right: Validation Button */}
                    <div className="min-w-[180px] flex justify-end">
                        <button
                            onClick={handleValidateClick}
                            className={`group relative flex items-center gap-3 px-8 py-4 rounded font-bold shadow-xl transform transition-all hover:scale-105 active:scale-95 overflow-hidden ${hasErrors
                                ? 'bg-red-800 text-red-100 hover:bg-red-700 ring-2 ring-red-500 ring-offset-2 ring-offset-stone-900'
                                : 'bg-green-700 text-green-100 hover:bg-green-600 ring-2 ring-green-500 ring-offset-2 ring-offset-stone-900'
                                }`}
                        >
                            <div className="relative z-10 flex items-center gap-2 text-lg font-serif tracking-wide">
                                {hasErrors ? <AlertOctagon size={24} /> : <Feather size={24} />}
                                {hasErrors ? 'Incomplet' : 'Valider'}
                            </div>
                            {/* Shine Effect */}
                            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Validation Modal */}
            <CreationValidationModal
                isOpen={showConfirm}
                hasErrors={hasErrors}
                messages={messages}
                overspent={overspent}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirmValidation}
            />
        </>
    );
};

export default CreationHUD;
