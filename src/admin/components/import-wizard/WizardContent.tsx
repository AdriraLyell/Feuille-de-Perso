import React from 'react';
import { ImportCandidate, TabType } from '../../hooks/useLibraryImport';
import CandidateLine from '../import/CandidateLine';
import { Loader2 } from 'lucide-react';
import { DestinationSelector } from './DestinationSelector';

interface WizardContentProps {
    isLoading: boolean;
    activeTab: TabType;
    importDestination: 'campaign' | 'global';
    updateImportDestination: (dest: 'campaign' | 'global') => void;
    traitCandidates: ImportCandidate<unknown>[];
    skillCandidates: ImportCandidate<unknown>[];
    specCandidates: ImportCandidate<unknown>[];
    backgroundCandidates: ImportCandidate<unknown>[];
    counterCandidates: ImportCandidate<unknown>[];
    toggleCandidateSelection: (type: TabType, index: number) => void;
}

export const WizardContent: React.FC<WizardContentProps> = ({
    isLoading,
    activeTab,
    importDestination,
    updateImportDestination,
    traitCandidates,
    skillCandidates,
    specCandidates,
    backgroundCandidates,
    counterCandidates,
    toggleCandidateSelection
}) => {
    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-pulse">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p>Analyse de la fiche et de la bibliothèque...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <DestinationSelector
                importDestination={importDestination}
                onUpdateDestination={updateImportDestination}
            />

            <div className="space-y-4">
                {activeTab === 'traits' && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avantages & Désavantages</h3>
                        {traitCandidates.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 italic">Aucun trait détecté.</div>
                        ) : (
                            traitCandidates.map((c, idx) => (
                                <CandidateLine
                                    key={idx}
                                    candidate={c}
                                    onToggle={() => toggleCandidateSelection('traits', idx)}
                                    importDestination={importDestination}
                                    showType={true}
                                    typeLabel={(c.data as Record<string, unknown>)?.type === 'avantage' ? 'Avantage' : 'Désavantage'}
                                />
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'skills' && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Compétences Détectées</h3>
                        {skillCandidates.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 italic">Aucune compétence détectée.</div>
                        ) : (
                            skillCandidates.map((c, idx) => (
                                <CandidateLine
                                    key={idx}
                                    candidate={c}
                                    onToggle={() => toggleCandidateSelection('skills', idx)}
                                    importDestination={importDestination}
                                    extraInfo={(c.data as Record<string, unknown>)?.defaultCategory ? <div className="text-[10px] text-indigo-500 font-bold uppercase mt-0.5">{String((c.data as Record<string, unknown>).defaultCategory).replace('Col_Comp_', 'Série ')}</div> : null}
                                />
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'specializations' && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Spécialités Détectées</h3>
                        {specCandidates.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 italic">Aucune spécialité détectée.</div>
                        ) : (
                            specCandidates.map((c, idx) => (
                                <CandidateLine
                                    key={idx}
                                    candidate={c}
                                    onToggle={() => toggleCandidateSelection('specializations', idx)}
                                    importDestination={importDestination}
                                />
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'backgrounds' && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Historiques Détectés</h3>
                        {backgroundCandidates.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 italic">Aucun historique détecté.</div>
                        ) : (
                            backgroundCandidates.map((c, idx) => (
                                <CandidateLine
                                    key={idx}
                                    candidate={c}
                                    onToggle={() => toggleCandidateSelection('backgrounds', idx)}
                                    importDestination={importDestination}
                                />
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'counters' && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Compteurs Détectés</h3>
                        {counterCandidates.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 italic">Aucun compteur détecté.</div>
                        ) : (
                            counterCandidates.map((c, idx) => {
                                const data = c.data as Record<string, unknown>;
                                return (
                                    <CandidateLine
                                        key={idx}
                                        candidate={c}
                                        onToggle={() => toggleCandidateSelection('counters', idx)}
                                        importDestination={importDestination}
                                        extraInfo={
                                            <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                                <span>Max: {String(data.maxValue || data.max || 10)}</span>
                                                <span>Départ: {String(data.defaultValue || data.creationValue || 0)}</span>
                                            </div>
                                        }
                                    />
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
