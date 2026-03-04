import React from 'react';
import { Globe, Layers } from 'lucide-react';
import { PortalTooltip } from '../../../components/ui/PortalTooltip';
import { ItemUsageDetail } from '../../../types/usageTypes';

interface UsageLockedTooltipProps {
    anchorRef: { readonly current: HTMLElement | null };
    isOpen: boolean;
    isLocked: boolean;
    isPlaced: boolean;
    isCustomized?: boolean;
    usageDetails?: ItemUsageDetail;
}

export const UsageLockedTooltip: React.FC<UsageLockedTooltipProps> = ({
    anchorRef,
    isOpen,
    isLocked,
    isPlaced,
    isCustomized,
    usageDetails
}) => {
    if (!isLocked || !isOpen) return null;

    return (
        <PortalTooltip
            anchorRef={anchorRef}
            isOpen={isOpen}
            title="Suppression bloquée"
            maxWidth={250}
        >
            <div className="flex flex-col gap-2 py-1">
                {isPlaced && (
                    <div className="text-amber-200 flex items-center gap-1.5 border-b border-white/10 pb-1.5 mb-0.5 last:border-0 last:mb-0 last:pb-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                        Utilisé dans cette campagne
                    </div>
                )}

                {isCustomized && (
                    <div className="text-cyan-200 flex items-center gap-1.5 border-b border-white/10 pb-1.5 mb-0.5 last:border-0 last:mb-0 last:pb-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                        Personnalisé localement
                    </div>
                )}

                {!isPlaced && !isCustomized && isLocked && (
                    <>
                        <div className="text-stone-300 text-[9px] uppercase tracking-wider font-bold opacity-60">Utilisation externe :</div>

                        {!usageDetails && (
                            <div className="text-stone-400 italic animate-pulse">Chargement des détails...</div>
                        )}

                        {usageDetails && usageDetails.settings.length > 0 && (
                            <div className="flex flex-col gap-1">
                                <div className="text-white/70 font-bold mb-0.5 flex items-center gap-1">
                                    <Globe size={10} /> Campagnes ({usageDetails.settings.length}) :
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {usageDetails.settings.map(s => (
                                        <span key={s.id} className="bg-indigo-900/40 text-indigo-100 px-1.5 py-0.5 rounded-sm border border-indigo-700/30 text-[9px]">
                                            {s.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {usageDetails && usageDetails.characters && usageDetails.characters.length > 0 && (
                            <div className="flex flex-col gap-1 mt-1 border-t border-white/5 pt-1.5">
                                <div className="text-white/70 font-bold mb-0.5 flex items-center gap-1">
                                    <Layers size={10} /> Personnages ({usageDetails.characters.length}) :
                                </div>
                                <div className="flex flex-col gap-1">
                                    {usageDetails.characters.map((c, i) => (
                                        <div key={i} className="text-[9px] text-stone-200 bg-stone-800/50 p-1 rounded-sm border border-white/5">
                                            <span className="font-bold text-white">{c.name}</span>
                                            <span className="text-stone-400 text-[8px] ml-1">({c.player})</span>
                                            {c.settingName && <div className="text-[8px] text-stone-500 italic truncate">{c.settingName}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {usageDetails && usageDetails.settings.length === 0 && (!usageDetails.characters || usageDetails.characters.length === 0) && (
                            <div className="text-stone-400 italic">Aucun détail trouvé (usage global détecté).</div>
                        )}
                    </>
                )}
            </div>
        </PortalTooltip>
    );
};
