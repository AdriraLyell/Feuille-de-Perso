import React, { useState } from 'react';
import { CharacterSheetData, AttributeCategoryKey, DotEntry } from '../types';
import { Check, Info, Calculator, AlertTriangle, X, ShieldAlert, CreditCard, Sliders } from 'lucide-react';

interface CreationHUDProps {
  data: CharacterSheetData;
  onValidate: () => void;
}

const CreationHUD: React.FC<CreationHUDProps> = ({ data, onValidate }) => {
  const { mode, rankSlots, startingXP, attributePoints, backgroundPoints, cardConfig, attributeMin, attributeMax, attributeCost } = data.creationConfig;
  const [showConfirm, setShowConfirm] = useState(false);

  // Defaults
  const minAttr = attributeMin ?? -2;
  const maxAttr = attributeMax ?? 3;
  const attrCostPerPoint = attributeCost ?? 6;

  // --- Calculations ---
  const getCost = (level: number) => (level * (level + 1)) / 2;

  const calculateUsage = () => {
    let xpSpent = 0;
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
            // Arrière-plans : 2 par point
            // Secondaires : moitié du coût triangulaire
            // Autres : coût triangulaire
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
                // En mode points, on dépense des XP pour tout
                xpSpent += realCost;
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
                    xpSpent += attrCost;
                }
            }
        });
    });

    return { xpSpent, xpEquivalence, ranksUsed, attributesUsed, backgroundsUsed, attributeErrors };
  };
  

  const { xpSpent, xpEquivalence, ranksUsed, attributesUsed, backgroundsUsed, attributeErrors } = calculateUsage();
  const xpRemaining = startingXP - xpSpent;

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
          if (xpRemaining > 0) messages.push(`Il vous reste ${formatNumber(xpRemaining)} XP à dépenser.`);
          if (xpRemaining < 0) overspent.push(`Dépassement de ${formatNumber(Math.abs(xpRemaining))} XP.`);
      } else {
          // Attributes
          const attrMax = attributePoints || 15;
          if (attributesUsed < attrMax) messages.push(`Il reste ${attrMax - attributesUsed} points d'Attributs.`);
          if (attributesUsed > attrMax) overspent.push(`Attributs : ${attributesUsed - attrMax} point(s) en trop.`);

          // Backgrounds
          const bgMax = backgroundPoints || 5;
          if (backgroundsUsed < bgMax) messages.push(`Il reste ${bgMax - backgroundsUsed} points d'Arrière-plans.`);
          if (backgroundsUsed > bgMax) overspent.push(`Arrière-plans : ${backgroundsUsed - bgMax} point(s) en trop.`);

          // Ranks
          [1, 2, 3, 4, 5].forEach(rank => {
              // @ts-ignore
              const max = rankSlots[rank] || 0;
              if (max === 0) return;
              const used = ranksUsed[rank] || 0;
              
              if (used < max) messages.push(`Rang ${rank} : Manque ${formatNumber(max - used)} slots.`);
              if (used > max) overspent.push(`Rang ${rank} : ${formatNumber(used - max)} slots en trop.`);
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

  return (
    <>
        <div className={`fixed bottom-0 left-0 right-0 z-[90] bg-slate-900 text-white shadow-2xl border-t-4 transition-colors duration-300 animate-in slide-in-from-bottom no-print ${hasErrors ? 'border-red-500' : 'border-blue-500'}`}>
            <div className="max-w-[1400px] mx-auto p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Left: Info / Title & Card Widget */}
                <div className="flex flex-col gap-2 min-w-[220px]">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full hidden md:block ${hasErrors ? 'bg-red-600' : 'bg-blue-600'}`}>
                             {hasErrors ? <AlertTriangle size={24} /> : <Info size={24} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg uppercase tracking-wider leading-tight">
                                Mode Création <br/>
                                <span className="text-xs font-normal normal-case text-slate-400">
                                    {mode === 'rangs' ? 'Par Rangs' : 'Par Points (XP)'}
                                </span>
                            </h3>
                        </div>
                    </div>
                    {/* XP Equivalence Badge */}
                    <div className="flex items-center justify-between bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 w-full mt-1 shadow-inner">
                        <div className="flex items-center gap-2">
                             <Calculator size={16} className="text-yellow-400" />
                             <span className="text-xs text-slate-300 font-bold uppercase tracking-wide">Valeur Totale (XP)</span>
                        </div>
                        <span className="font-mono font-bold text-yellow-400 text-lg">{formatNumber(xpEquivalence)}</span>
                    </div>
                    {/* Attribute Limits Badge */}
                    <div className="flex items-center justify-between bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 w-full shadow-inner">
                        <div className="flex items-center gap-2">
                             <Sliders size={16} className="text-blue-400" />
                             <span className="text-xs text-slate-300 font-bold uppercase tracking-wide">Attr. Min/Max</span>
                        </div>
                        <span className="font-mono font-bold text-blue-400 text-sm">
                            {minAttr > 0 ? `+${minAttr}` : minAttr} / {maxAttr > 0 ? `+${maxAttr}` : maxAttr}
                        </span>
                    </div>
                </div>

                {/* Center: Metrics & Card */}
                <div className="flex-grow flex justify-center flex-wrap gap-4 items-center">

                    {mode === 'points' ? (
                        <div className={`text-center px-6 py-2 rounded-lg border-2 ${xpRemaining < 0 ? 'border-red-500 bg-red-900/20' : (xpRemaining === 0 ? 'border-green-500 bg-green-900/20' : 'border-blue-500 bg-blue-900/20')}`}>
                            <div className="text-xs uppercase text-slate-400 font-bold">XP Restants</div>
                            <div className={`text-2xl font-mono font-bold ${xpRemaining < 0 ? 'text-red-400' : (xpRemaining === 0 ? 'text-green-400' : 'text-white')}`}>
                                {formatNumber(xpRemaining)} / {startingXP}
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3 overflow-x-auto pb-1 items-center">
                            {/* Attributes Pool */}
                            <div className={`flex flex-col items-center p-2 rounded border min-w-[80px] transition-colors ${
                                attributesUsed > (attributePoints || 15) ? 'border-red-500 bg-red-900/30' : 
                                (attributesUsed === (attributePoints || 15) ? 'border-green-500 bg-green-900/30' : 'border-blue-500 bg-blue-900/30')
                            }`}>
                                <span className="text-[10px] text-slate-300 font-bold uppercase">Attributs</span>
                                <span className={`font-mono font-bold text-lg ${
                                    attributesUsed > (attributePoints || 15) ? 'text-red-400' : 
                                    (attributesUsed === (attributePoints || 15) ? 'text-green-400' : 'text-white')
                                }`}>
                                    {attributesUsed} / {attributePoints || 15}
                                </span>
                            </div>

                            {/* Ranks */}
                            <div className="flex gap-1.5 border-l border-r border-slate-700 px-3 mx-1">
                                {[1, 2, 3, 4, 5].map(rank => {
                                    const used = ranksUsed[rank] || 0;
                                    // @ts-ignore
                                    const max = rankSlots[rank] || 0;
                                    if (max === 0 && used === 0) return null; 

                                    const isOver = used > max;
                                    const isFull = used === max;

                                    let borderColor = 'border-slate-600 bg-slate-800';
                                    let textColor = 'text-white';
                                    
                                    if (isOver) {
                                        borderColor = 'border-red-500 bg-red-900/30';
                                        textColor = 'text-red-400';
                                    } else if (isFull) {
                                        borderColor = 'border-green-500 bg-green-900/30';
                                        textColor = 'text-green-400';
                                    }

                                    return (
                                        <div key={rank} className={`flex flex-col items-center p-2 rounded border min-w-[50px] transition-colors ${borderColor}`}>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Rang {rank}</span>
                                            <span className={`font-mono font-bold ${textColor}`}>
                                                {formatNumber(used)} / {max}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Backgrounds Pool */}
                            <div className={`flex flex-col items-center p-2 rounded border min-w-[90px] transition-colors ${
                                backgroundsUsed > (backgroundPoints || 5) ? 'border-red-500 bg-red-900/30' : 
                                (backgroundsUsed === (backgroundPoints || 5) ? 'border-green-500 bg-green-900/30' : 'border-purple-500 bg-purple-900/30')
                            }`}>
                                <span className="text-[10px] text-slate-300 font-bold uppercase">Arrière-plans</span>
                                <span className={`font-mono font-bold text-lg ${
                                    backgroundsUsed > (backgroundPoints || 5) ? 'text-red-400' : 
                                    (backgroundsUsed === (backgroundPoints || 5) ? 'text-green-400' : 'text-white')
                                }`}>
                                    {backgroundsUsed} / {backgroundPoints || 5}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Validation */}
                <div>
                    <button 
                        onClick={handleValidateClick}
                        className={`flex items-center gap-2 px-6 py-3 rounded font-bold shadow-lg transform transition-all hover:scale-105 ${
                            hasErrors 
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-900/50' 
                            : 'bg-green-600 hover:bg-green-700 text-white shadow-green-900/50'
                        }`}
                    >
                        {hasErrors ? <AlertTriangle size={20} /> : <Check size={20} />}
                        {hasErrors ? 'Erreurs !' : 'Valider'}
                    </button>
                </div>
            </div>
        </div>

        {/* Validation Confirmation / Error Modal */}
        {showConfirm && (
            <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className={`bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border-t-8 ${hasErrors ? 'border-red-600' : 'border-green-600'}`}>
                    
                    {/* Modal Header */}
                    <div className="bg-gray-100 p-5 border-b border-gray-200 flex justify-between items-center">
                        <h3 className={`font-bold text-xl flex items-center gap-3 ${hasErrors ? 'text-red-700' : 'text-gray-800'}`}>
                            {hasErrors ? (
                                <>
                                    <ShieldAlert size={28} />
                                    Dépassements détectés
                                </>
                            ) : (
                                <>
                                    <Check size={28} className="text-green-600" />
                                    Validation de la création
                                </>
                            )}
                        </h3>
                        <button onClick={() => setShowConfirm(false)} className="text-gray-500 hover:bg-gray-200 p-2 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    
                    {/* Modal Body */}
                    <div className="p-6 overflow-y-auto">
                        {!hasErrors && messages.length === 0 ? (
                             <div className="flex flex-col items-center text-center py-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                    <Check className="text-green-600" size={40} />
                                </div>
                                <p className="text-xl font-bold text-gray-800 mb-2">Tout est parfait !</p>
                                <p className="text-gray-600">Vous avez utilisé toutes vos ressources exactement.</p>
                             </div>
                        ) : (
                            <div className="space-y-6">
                                <p className="text-base text-gray-600">
                                    {hasErrors 
                                        ? "Votre fiche contient des erreurs de répartition des points. Vous ne pouvez normalement pas valider avec ces dépassements." 
                                        : "Vous êtes sur le point de valider la création. Voici un récapitulatif :"
                                    }
                                </p>
                                
                                {overspent.length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                                        <h4 className="font-bold text-red-800 text-sm mb-3 uppercase flex items-center gap-2">
                                            <AlertTriangle size={16} /> Dépenses en trop
                                        </h4>
                                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1.5 font-medium">
                                            {overspent.map((msg, i) => <li key={i}>{msg}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {messages.length > 0 && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                                        <h4 className="font-bold text-blue-800 text-sm mb-3 uppercase flex items-center gap-2">
                                            <Info size={16} /> Points Restants
                                        </h4>
                                        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1.5 font-medium">
                                            {messages.map((msg, i) => <li key={i}>{msg}</li>)}
                                        </ul>
                                    </div>
                                )}

                                <p className="text-xs text-gray-400 italic text-center border-t border-gray-100 pt-4">
                                    Une fois validé, ces valeurs seront verrouillées comme "acquises à la création" (Coût 0 XP).
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="bg-gray-50 p-4 flex justify-between gap-3 border-t border-gray-200">
                        <button 
                            onClick={() => setShowConfirm(false)}
                            className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                        >
                            {hasErrors ? 'Corriger' : 'Annuler'}
                        </button>
                        
                        <div className="flex gap-2">
                            {hasErrors && (
                                <button 
                                    onClick={handleConfirmValidation}
                                    className="px-4 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-800 rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Forcer la validation
                                </button>
                            )}
                            {(!hasErrors) && (
                                <button 
                                    onClick={handleConfirmValidation}
                                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg transition-transform hover:scale-105"
                                >
                                    Confirmer et Terminer
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