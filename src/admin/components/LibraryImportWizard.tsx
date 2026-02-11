import React from 'react';
import { X, Library, Zap, Book, Award, Loader2, Save, Users, Gauge } from 'lucide-react';
import { SyncedCharacter } from '../../services/CharacterSyncService';
import { useLibraryImport, ImportCandidate, TabType } from '../hooks/useLibraryImport';
import CandidateLine from './import/CandidateLine';

interface LibraryImportWizardProps {
    character: SyncedCharacter;
    onClose: () => void;
    onSuccess?: () => void;
}

const LibraryImportWizard: React.FC<LibraryImportWizardProps> = ({ character, onClose, onSuccess }) => {
    const {
        targetSettingId,
        setTargetSettingId,
        settings,
        activeTab,
        handleTabChange,
        isLoading,
        isSaving,
        importDestination,
        updateImportDestination,
        traitCandidates,
        skillCandidates,
        specCandidates,
        backgroundCandidates,
        counterCandidates,
        toggleCandidateSelection,
        handleImport,
        getSelectedCount
    } = useLibraryImport(character, onSuccess, onClose);

    return (
        <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200">

                {/* Header */}
                <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Library size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Assistant d'Import Bibliothèque</h2>
                            <p className="text-indigo-100 text-xs">Extraction des données de {character.character_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {!targetSettingId ? (
                    /* Campaign Selection Step */
                    <div className="flex-grow flex flex-col p-6 overflow-hidden">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Choisir une campagne cible</h3>
                            <p className="text-sm text-slate-500">Ce personnage est un "orphelin" (sans campagne). Veuillez sélectionner la campagne où importer ses caractéristiques.</p>
                        </div>

                        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                            {settings.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <Loader2 className="animate-spin mx-auto mb-2" />
                                    Chargement des campagnes...
                                </div>
                            ) : (
                                settings.map((s: any) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setTargetSettingId(s.id)}
                                        className="w-full p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="font-bold text-slate-800 group-hover:text-indigo-700">{s.name}</div>
                                            <div className="text-xs text-slate-400">ID: {s.id.substring(0, 8)}...</div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 text-indigo-500 font-bold text-sm">Choisir →</div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex bg-slate-50 border-b border-slate-200">
                            {[
                                { id: 'traits', icon: Zap, label: 'Traits' },
                                { id: 'skills', icon: Book, label: 'Compétences' },
                                { id: 'specializations', icon: Award, label: 'Spéc.' },
                                { id: 'backgrounds', icon: Users, label: 'Hist.' },
                                { id: 'counters', icon: Gauge, label: 'Compteurs' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id as any)}
                                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    <tab.icon size={16} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-grow overflow-y-auto p-6">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-pulse">
                                    <Loader2 className="animate-spin mb-4" size={40} />
                                    <p>Analyse de la fiche et de la bibliothèque...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Destination Selector */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 px-1">Destination de l'Import</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => updateImportDestination('campaign')}
                                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${importDestination === 'campaign' ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/10' : 'bg-slate-100/50 border-slate-200 hover:bg-white'}`}
                                            >
                                                <Book size={20} className={importDestination === 'campaign' ? 'text-indigo-600' : 'text-slate-400'} />
                                                <div className="text-center">
                                                    <div className={`text-sm font-bold ${importDestination === 'campaign' ? 'text-slate-900' : 'text-slate-500'}`}>Cette Campagne</div>
                                                    <div className="text-[10px] text-slate-400 italic">Spécifique à ce MJ</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => updateImportDestination('global')}
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

                                    <div className="space-y-4">
                                        {activeTab === 'traits' && (
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avantages & Désavantages</h3>
                                                {traitCandidates.length === 0 ? (
                                                    <div className="text-center py-10 text-slate-400 italic">Aucun trait détecté.</div>
                                                ) : (
                                                    traitCandidates.map((c: ImportCandidate<any>, idx: number) => (
                                                        <CandidateLine
                                                            key={idx}
                                                            candidate={c}
                                                            onToggle={() => toggleCandidateSelection('traits', idx)}
                                                            importDestination={importDestination}
                                                            showType={true}
                                                            typeLabel={c.data.type === 'avantage' ? 'Avantage' : 'Désavantage'}
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
                                                    skillCandidates.map((c: ImportCandidate<any>, idx: number) => (
                                                        <CandidateLine
                                                            key={idx}
                                                            candidate={c}
                                                            onToggle={() => toggleCandidateSelection('skills', idx)}
                                                            importDestination={importDestination}
                                                            extraInfo={<div className="text-[10px] text-indigo-500 font-bold uppercase mt-0.5">{c.data.defaultCategory?.replace('Col_Comp_', 'Série ')}</div>}
                                                        />
                                                    ))
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'specializations' && (
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Spécialisations Détectées</h3>
                                                {specCandidates.length === 0 ? (
                                                    <div className="text-center py-10 text-slate-400 italic">Aucune spécialisation détectée.</div>
                                                ) : (
                                                    specCandidates.map((c: ImportCandidate<any>, idx: number) => (
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
                                                    backgroundCandidates.map((c: ImportCandidate<any>, idx: number) => (
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
                                                    counterCandidates.map((c: ImportCandidate<any>, idx: number) => (
                                                        <CandidateLine
                                                            key={idx}
                                                            candidate={c}
                                                            onToggle={() => toggleCandidateSelection('counters', idx)}
                                                            importDestination={importDestination}
                                                            extraInfo={
                                                                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                                                    <span>Max: {c.data.maxValue}</span>
                                                                    <span>Départ: {c.data.defaultValue}</span>
                                                                </div>
                                                            }
                                                        />
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                            <button
                                onClick={character.setting_id ? onClose : () => setTargetSettingId(null)}
                                className="px-4 py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                            >
                                {character.setting_id ? 'Annuler' : '← Retour'}
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={isLoading || isSaving || getSelectedCount() === 0}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Importer la sélection ({getSelectedCount()})
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LibraryImportWizard;
