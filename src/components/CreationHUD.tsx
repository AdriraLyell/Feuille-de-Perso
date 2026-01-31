
import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useCharacter } from '../context/CharacterContext';
import { CharacterSheetData, AttributeCategoryKey, DotEntry } from '../types';
import { Check, Info, Calculator, AlertTriangle, X, ShieldAlert, CreditCard, Sliders, Feather, AlertOctagon, ThumbsUp, CheckSquare } from 'lucide-react';

const CreationHUD: React.FC = () => {
    const { data, updateData: setData, addLog } = useCharacter();
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
    const { mode, rankSlots, startingXP, pointsDistributionMode, pointsBuckets, attributePoints, backgroundPoints, cardConfig, attributeMin, attributeMax, attributeCost } = data.creationConfig;
    const [showConfirm, setShowConfirm] = useState(false);

    // Defaults
    const minAttr = attributeMin ?? -2;
    const maxAttr = attributeMax ?? 3;
    const attrCostPerPoint = attributeCost ?? 6;

    // --- Calculations ---
    const getCost = (level: number) => (level * (level + 1)) / 2;

    const calculateUsage = () => {
        let xpSpentTotal = 0;

        // Detailed tracking for "Budgets" mode in Points system
        let xpSpentAttributes = 0;
        let xpSpentSkills = 0;
        let xpSpentBackgrounds = 0;

        let xpEquivalence = 0;
        const ranksUsed: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let attributesUsed = 0;
        let backgroundsUsed = 0;
        const attributeErrors: string[] = [];

        const countSkill = (val: number, isBackground: boolean, category: string) => {
            if (val > 0) {
                const cost = getCost(val);
                const isSecondary = category === 'competences2';

                // Calcul du coût réel (XP Value)
                let realCost = 0;
                if (isBackground) {
                    realCost = val * 2;
                } else if (isSecondary) {
                    realCost = cost / 2;
                } else {
                    realCost = cost;
                }

                xpEquivalence += realCost;

                // Logic for Creation Constraints
                if (mode === 'points') {
                    xpSpentTotal += realCost;

                    // Track by category for budgets
                    if (isBackground) {
                        xpSpentBackgrounds += realCost;
                    } else {
                        // Both Skills and Secondary Skills count towards "Skills" budget
                        xpSpentSkills += realCost;
                    }
                } else {
                    // Rangs Mode
                    if (!isBackground) {
                        if (val <= 5) {
                            // Si c'est une compétence secondaire, elle vaut 0.5 slot, sinon 1 slot
                            const slotWeight = isSecondary ? 0.5 : 1;
                            ranksUsed[val] = (ranksUsed[val] || 0) + slotWeight;
                        }
                    } else {
                        backgroundsUsed += val;
                    }
                }
            }
        };

        // Skills
        Object.keys(data.skills).forEach(key => {
            const isBackground = key === 'arrieres_plans';
            // @ts-ignore
            data.skills[key].forEach(skill => {
                if (skill.name) {
                    countSkill(skill.value, isBackground, key);
                }
            });
        });

        // Attributes
        const attrCats: AttributeCategoryKey[] = ['physique', 'mental', 'social'];

        attrCats.forEach(cat => {
            data.attributes[cat].forEach(attr => {
                // Updated: Parse string value
                const val = parseInt(attr.val1) || 0;

                // Validation Logic: Check Min/Max
                if (val < minAttr) {
                    attributeErrors.push(`${attr.name} : ${val} (Min ${minAttr})`);
                }
                if (val > maxAttr) {
                    attributeErrors.push(`${attr.name} : ${val} (Max ${maxAttr})`);
                }

                if (val !== 0) {
                    attributesUsed += val;
                    const attrCost = val * attrCostPerPoint; // Coût XP Attributs dynamique

                    xpEquivalence += attrCost;

                    if (mode === 'points') {
                        xpSpentTotal += attrCost;
                        xpSpentAttributes += attrCost; // Track for budget
                    }
                }
            });

            // Handle Secondary Attributes cost if active
            if (data.secondaryAttributesActive && data.secondaryAttributes[cat]) {
                data.secondaryAttributes[cat].forEach(attr => {
                    const val = parseInt(attr.val1) || 0;
                    if (val !== 0) {
                        // Assuming secondary attributes also cost `attrCostPerPoint` and count towards attribute budget
                        const attrCost = val * attrCostPerPoint;
                        xpEquivalence += attrCost;
                        if (mode === 'points') {
                            xpSpentTotal += attrCost;
                            xpSpentAttributes += attrCost;
                        }
                    }
                });
            }
        });

        return {
            xpSpentTotal,
            xpSpentAttributes,
            xpSpentSkills,
            xpSpentBackgrounds,
            xpEquivalence,
            ranksUsed,
            attributesUsed,
            backgroundsUsed,
            attributeErrors
        };
    };


    const { xpSpentTotal, xpSpentAttributes, xpSpentSkills, xpSpentBackgrounds, xpEquivalence, ranksUsed, attributesUsed, backgroundsUsed, attributeErrors } = calculateUsage();

    // XP Calculations based on mode
    const isGlobalPoints = !pointsDistributionMode || pointsDistributionMode === 'global';
    const xpRemainingGlobal = startingXP - xpSpentTotal;

    // Formatting helpers for decimals
    const formatNumber = (num: number) => {
        return Number.isInteger(num) ? num.toString() : num.toFixed(2);
    };

    // Generate Warning Messages for Validation
    const getValidationWarnings = () => {
        const messages: string[] = [];
        const overspent: string[] = [];

        // Add attribute limits errors first
        if (attributeErrors.length > 0) {
            attributeErrors.forEach(err => overspent.push(err));
        }

        if (mode === 'points') {
            if (isGlobalPoints) {
                // Global Pool Logic
                if (xpRemainingGlobal > 0) messages.push(`Il vous reste ${formatNumber(xpRemainingGlobal)} XP à dépenser.`);
                if (xpRemainingGlobal < 0) overspent.push(`Dépassement de ${formatNumber(Math.abs(xpRemainingGlobal))} XP.`);
            } else {
                // Buckets Logic
                const budgetAttrs = pointsBuckets?.attributes || 0;
                const budgetSkills = pointsBuckets?.skills || 0;
                const budgetBg = pointsBuckets?.backgrounds || 0;

                if (xpSpentAttributes > budgetAttrs) overspent.push(`Attributs : Dépassement de ${xpSpentAttributes - budgetAttrs} XP.`);
                if (xpSpentAttributes < budgetAttrs) messages.push(`Attributs : Reste ${budgetAttrs - xpSpentAttributes} XP.`);

                if (xpSpentSkills > budgetSkills) overspent.push(`Compétences : Dépassement de ${xpSpentSkills - budgetSkills} XP.`);
                if (xpSpentSkills < budgetSkills) messages.push(`Compétences : Reste ${budgetSkills - xpSpentSkills} XP.`);

                if (xpSpentBackgrounds > budgetBg) overspent.push(`Arrière-plans : Dépassement de ${xpSpentBackgrounds - budgetBg} XP.`);
                if (xpSpentBackgrounds < budgetBg) messages.push(`Arrière-plans : Reste ${budgetBg - xpSpentBackgrounds} XP.`);
            }
        } else {
            // Attributes (Rangs Mode)
            const attrMax = attributePoints || 15;
            if (attributesUsed < attrMax) messages.push(`Il reste ${attrMax - attributesUsed} points d'Attributs.`);
            if (attributesUsed > attrMax) overspent.push(`Attributs : ${attributesUsed - attrMax} point(s) en trop.`);

            // Backgrounds (Rangs Mode)
            const bgMax = backgroundPoints || 5;
            if (backgroundsUsed < bgMax) messages.push(`Il reste ${bgMax - backgroundsUsed} points d'Arrière-plans.`);
            if (backgroundsUsed > bgMax) overspent.push(`Arrière-plans : ${backgroundsUsed - bgMax} point(s) en trop.`);

            // Ranks
            [1, 2, 3, 4, 5].forEach(rank => {
                // @ts-ignore
                const max = rankSlots[rank] || 0;
                if (max === 0) return;
                const used = ranksUsed[rank] || 0;

                if (used < max) messages.push(`Rang ${rank} : Manque ${formatNumber(max - used)} rangs.`);
                if (used > max) overspent.push(`Rang ${rank} : ${formatNumber(used - max)} rangs en trop.`);
            });
        }

        return { messages, overspent };
    };

    const { messages, overspent } = getValidationWarnings();
    const hasErrors = overspent.length > 0;

    const handleValidateClick = () => {
        setShowConfirm(true);
    };

    const handleConfirmValidation = () => {
        setShowConfirm(false);
        onValidate();
    };

    // Helper to render a budget badge/pill as a Gauge Card
    const renderBudgetGauge = (label: string, current: number, max: number) => {
        const isOver = current > max;
        const isFull = current === max;

        const percentage = Math.min(100, Math.max(0, (current / max) * 100));

        let barColor = 'bg-blue-500';
        let valueColor = 'text-white';
        let cardBorder = 'border-stone-600';

        if (isOver) {
            barColor = 'bg-red-500';
            valueColor = 'text-red-400';
            cardBorder = 'border-red-500/50';
        } else if (isFull) {
            barColor = 'bg-green-500';
            valueColor = 'text-green-400';
            cardBorder = 'border-green-500/50';
        }

        return (
            <div className={`flex flex-col bg-stone-800 rounded-lg border ${cardBorder} p-4 min-w-[180px] shadow-lg relative overflow-hidden group transition-all hover:-translate-y-1`}>
                <div className="flex justify-between items-end mb-3 relative z-10">
                    <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider font-serif">{label}</span>
                    <span className={`font-mono font-bold text-lg leading-none ${valueColor}`}>
                        {formatNumber(current)}<span className="text-stone-500 text-xs">/{max}</span>
                    </span>
                </div>
                <div className="h-2 w-full bg-stone-900 rounded-full overflow-hidden relative z-10">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
                {/* Background Glow */}
                {isOver && <div className="absolute inset-0 bg-red-900/20 z-0 animate-pulse"></div>}
            </div>
        );
    };

    return (
        <>
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
                                        {formatNumber(xpRemainingGlobal)} <span className="text-lg text-stone-500">/ {startingXP}</span>
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
                                    {renderBudgetGauge('Attributs', xpSpentAttributes, pointsBuckets?.attributes || 0)}
                                    {renderBudgetGauge('Compétences', xpSpentSkills, pointsBuckets?.skills || 0)}
                                    {renderBudgetGauge('Arrière-plans', xpSpentBackgrounds, pointsBuckets?.backgrounds || 0)}
                                </div>
                            )
                        ) : (
                            // MODE RANGS
                            <div className="flex gap-3 overflow-x-auto pb-1 items-center no-scrollbar">
                                {renderBudgetGauge('Attributs', attributesUsed, attributePoints || 15)}

                                {/* Ranks (Compact Vertical) */}
                                <div className="flex bg-stone-800 rounded-lg border border-stone-700 p-2 gap-2 shadow-lg">
                                    {[1, 2, 3, 4, 5].map(rank => {
                                        const used = ranksUsed[rank] || 0;
                                        // @ts-ignore
                                        const max = rankSlots[rank] || 0;
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

                                {renderBudgetGauge('Arrière-plans', backgroundsUsed, backgroundPoints || 5)}
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

            {/* Validation Confirmation / Error Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-stone-950/90 z-[110] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
                    <div className={`bg-[#fdfbf7] rounded-sm shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border-4 ${hasErrors ? 'border-red-700' : 'border-green-700'} relative`}>

                        {/* Paper Texture Overlay */}
                        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

                        {/* Modal Header */}
                        <div className={`p-6 border-b-2 flex justify-between items-center relative z-10 ${hasErrors ? 'bg-red-50 border-red-200 text-red-900' : 'bg-green-50 border-green-200 text-green-900'}`}>
                            <div>
                                <h3 className="font-black text-3xl font-serif tracking-tight flex items-center gap-3 uppercase">
                                    {hasErrors ? (
                                        <>
                                            <ShieldAlert size={32} />
                                            Rapport d'Erreur
                                        </>
                                    ) : (
                                        <>
                                            <Check size={32} />
                                            Validation Finale
                                        </>
                                    )}
                                </h3>
                                <p className="text-sm font-medium opacity-80 mt-1">
                                    {hasErrors ? "La création ne respecte pas les contraintes définies." : "Le personnage semble prêt à l'aventure."}
                                </p>
                            </div>
                            <button onClick={() => setShowConfirm(false)} className="text-stone-400 hover:text-stone-800 p-2 rounded-full transition-colors hover:bg-stone-200/50">
                                <X size={32} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto relative z-10 bg-stone-50/50">
                            {!hasErrors && messages.length === 0 ? (
                                <div className="flex flex-col items-center text-center py-8">
                                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce border-4 border-green-200">
                                        <ThumbsUp className="text-green-600" size={48} />
                                    </div>
                                    <p className="text-2xl font-serif font-bold text-stone-800 mb-2">Création Impeccable</p>
                                    <p className="text-stone-600 text-lg">Toutes les ressources ont été allouées parfaitement.</p>
                                </div>
                            ) : (
                                <div className="space-y-8">

                                    {overspent.length > 0 && (
                                        <div className="bg-white border-l-4 border-red-600 shadow-sm p-5">
                                            <h4 className="font-bold text-red-800 text-lg mb-4 uppercase flex items-center gap-2 border-b border-red-100 pb-2 font-serif">
                                                <AlertTriangle size={20} /> Anomalies Détectées
                                            </h4>
                                            <ul className="space-y-3">
                                                {overspent.map((msg, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-red-700 font-medium text-base">
                                                        <X size={18} className="mt-1 shrink-0" />
                                                        {msg}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {messages.length > 0 && (
                                        <div className="bg-white border-l-4 border-blue-500 shadow-sm p-5">
                                            <h4 className="font-bold text-blue-900 text-lg mb-4 uppercase flex items-center gap-2 border-b border-blue-100 pb-2 font-serif">
                                                <Info size={20} /> Opportunités Restantes
                                            </h4>
                                            <ul className="space-y-3">
                                                {messages.map((msg, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-blue-800 font-medium text-base">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                                                        {msg}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="text-center pt-4">
                                        <p className="text-sm text-stone-500 italic font-serif">
                                            En validant, les valeurs actuelles deviendront les valeurs de base (coût 0 XP).
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-stone-100 flex justify-between gap-4 border-t border-stone-300 relative z-10">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-6 py-3 text-stone-600 hover:bg-white hover:text-stone-900 rounded border border-stone-300 font-bold transition-colors text-base"
                            >
                                {hasErrors ? 'Retourner corriger' : 'Annuler'}
                            </button>

                            <div className="flex gap-4">
                                {hasErrors && (
                                    <button
                                        onClick={handleConfirmValidation}
                                        className="px-6 py-3 text-red-700 hover:bg-red-50 hover:underline text-base font-bold transition-colors"
                                    >
                                        Ignorer et Valider
                                    </button>
                                )}
                                {(!hasErrors) && (
                                    <button
                                        onClick={handleConfirmValidation}
                                        className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded shadow-lg transition-transform hover:scale-105 font-bold text-lg flex items-center gap-2 font-serif tracking-wide"
                                    >
                                        <CheckSquare size={20} />
                                        Confirmer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CreationHUD;
