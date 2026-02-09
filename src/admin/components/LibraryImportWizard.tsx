import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Library, Zap, Book, Award, Loader2, Save, Search, Users, Gauge } from 'lucide-react';
import { SyncedCharacter } from '../../services/CharacterSyncService';
import { CharacterSheetData } from '../../types/character';
import { LibraryService } from '../../services/LibraryService';
import { CampaignService, GameSettingSummary } from '../../services/CampaignService';
import { LibraryEntry, LibrarySkillEntry, LibrarySpecializationEntry, LibraryBackgroundEntry, LibraryCounterEntry } from '../../types/system';
import { RulesData } from '../../types/rules';
import { ErrorService } from '../../services/ErrorService';

interface LibraryImportWizardProps {
    character: SyncedCharacter;
    onClose: () => void;
    onSuccess?: () => void;
}

type TabType = 'traits' | 'skills' | 'specializations' | 'backgrounds' | 'counters';

interface ImportCandidate<T> {
    data: T;
    isDuplicate: boolean;
    isSelected: boolean;
    isVariable: boolean;
    existingId?: string;
}

const LibraryImportWizard: React.FC<LibraryImportWizardProps> = ({ character, onClose, onSuccess }) => {
    const data = character.data;
    const [targetSettingId, setTargetSettingId] = useState<string | null>(character.setting_id || null);
    const [settings, setSettings] = useState<GameSettingSummary[]>([]);

    const [activeTab, setActiveTab] = useState<TabType>('traits');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [importDestination, setImportDestination] = useState<'campaign' | 'global'>('campaign');
    const [currentLibrary, setCurrentLibrary] = useState<RulesData['libraries'] | null>(null);

    // Candidates
    const [traitCandidates, setTraitCandidates] = useState<ImportCandidate<LibraryEntry>[]>([]);
    const [skillCandidates, setSkillCandidates] = useState<ImportCandidate<LibrarySkillEntry>[]>([]);
    const [specCandidates, setSpecCandidates] = useState<ImportCandidate<LibrarySpecializationEntry>[]>([]);
    const [backgroundCandidates, setBackgroundCandidates] = useState<ImportCandidate<LibraryBackgroundEntry>[]>([]);
    const [counterCandidates, setCounterCandidates] = useState<ImportCandidate<LibraryCounterEntry>[]>([]);

    // 0. Load settings if orphan
    useEffect(() => {
        if (!targetSettingId) {
            const loadSettings = async () => {
                const list = await CampaignService.listSettings();
                setSettings(list || []);
            };
            loadSettings();
        }
    }, [targetSettingId]);

    // 1. Prepare Data when targetSettingId is set
    useEffect(() => {
        const prepareData = async () => {
            if (!targetSettingId) return;
            setIsLoading(true);

            try {
                // 1. Fetch current campaign library
                const libraries = await LibraryService.loadLibraries(targetSettingId);
                setCurrentLibrary(libraries);

                // 2. Scan Traits
                const rawAdvantages = (data.page2?.avantages || []);
                const advantages: LibraryEntry[] = rawAdvantages
                    .filter(t => t.name && t.name.trim() !== '')
                    .map(t => ({
                        id: crypto.randomUUID(),
                        type: 'avantage' as const,
                        name: t.name,
                        cost: t.value || '0',
                        description: t.variant || '',
                        tags: [],
                        is_variable: !!t.variant,
                        effects: []
                    }));

                const rawDisadvantages = (data.page2?.desavantages || []);
                const disadvantages: LibraryEntry[] = rawDisadvantages
                    .filter(t => t.name && t.name.trim() !== '')
                    .map(t => ({
                        id: crypto.randomUUID(),
                        type: 'desavantage' as const,
                        name: t.name,
                        cost: t.value || '0',
                        description: t.variant || '',
                        tags: [],
                        is_variable: !!t.variant,
                        effects: []
                    }));

                const allTraits = [...advantages, ...disadvantages];
                setTraitCandidates(allTraits.map(t => {
                    const existing = libraries.traits.find(et => et.name.toLowerCase() === t.name.toLowerCase());
                    const v = !!(t as any).isVariable || !!(t as any).is_variable;
                    return { data: t, isDuplicate: !!existing, isSelected: !existing && !v, isVariable: v, existingId: existing?.id };
                }));

                // 3. Scan Skills
                const rawSkills: LibrarySkillEntry[] = [];
                Object.entries(data.skills || {}).forEach(([cat, list]) => {
                    (list as any[]).filter(s => s.name && s.value > 0).forEach(s => {
                        rawSkills.push({
                            id: crypto.randomUUID(),
                            name: s.name,
                            description: '',
                            defaultCategory: cat,
                            isVariable: !!s.variant
                        });
                    });
                });

                setSkillCandidates(rawSkills.map(s => {
                    const existing = libraries.skills.find(es => es.name.toLowerCase() === s.name.toLowerCase());
                    const v = !!s.isVariable;
                    return { data: s, isDuplicate: !!existing, isSelected: !existing && !v, isVariable: v, existingId: existing?.id };
                }));

                // 4. Scan Specializations
                const allSpecs: LibrarySpecializationEntry[] = [];
                Object.entries(data.specializations || {}).forEach(([skillId, specs]) => {
                    const skillName = Object.values(data.skills || {}).flat().find((s: any) => (s as any).id === skillId)?.name || skillId;

                    specs.forEach(specName => {
                        allSpecs.push({
                            id: crypto.randomUUID(),
                            name: specName,
                            skillIds: [],
                            defaultMinLevel: 1,
                            description: `Importé de ${skillName}`
                        });
                    });
                });

                setSpecCandidates(allSpecs.map(s => {
                    const existing = libraries.specializations.find(es => es.name.toLowerCase() === s.name.toLowerCase());
                    return { data: s, isDuplicate: !!existing, isSelected: !existing, isVariable: false, existingId: existing?.id };
                }));

                // 5. Scan Backgrounds (Historique is in Col_Comp_8 of skills)
                const rawBackgrounds = data.skills['Col_Comp_8'] || [];
                const backgrounds: LibraryBackgroundEntry[] = rawBackgrounds
                    .filter((b: any) => b.name && b.name.trim() !== '')
                    .map((b: any) => ({
                        id: crypto.randomUUID(),
                        name: b.name,
                        description: b.description || '',
                        isVariable: !!b.variant,
                        defaultCategory: 'arrieres_plans'
                    }));

                setBackgroundCandidates(backgrounds.map(b => {
                    const existing = libraries.backgrounds.find(eb => eb.name.toLowerCase() === b.name.toLowerCase());
                    return { data: b, isDuplicate: !!existing, isSelected: !existing, isVariable: b.isVariable ?? false };
                }));

                // 6. Scan Counters
                const allCounters: LibraryCounterEntry[] = [];

                // Scan dynamic counters
                Object.entries(data.counters).forEach(([key, value]) => {
                    const items = Array.isArray(value) ? value : [value];
                    items.forEach(c => {
                        if (c.name && c.name.trim() !== '') {
                            allCounters.push({
                                id: crypto.randomUUID(),
                                name: c.name,
                                description: c.description || '',
                                maxValue: c.max || 10,
                                defaultValue: c.current ?? 0,
                                xpCost: 0
                            });
                        }
                    });
                });

                setCounterCandidates(allCounters.map(c => {
                    const existing = libraries.counters.find(ec => ec.name.toLowerCase() === c.name.toLowerCase());
                    return { data: c, isDuplicate: !!existing, isSelected: !existing, isVariable: false };
                }));

                setIsLoading(false);
            } catch (error) {
                ErrorService.handleError(error, { context: 'LibraryImportWizard.prepare', userMessage: "Erreur lors de la préparation de l'import." });
                setIsLoading(false);
            }
        };

        prepareData();
    }, [targetSettingId, data]);

    const handleImport = async () => {
        if (!targetSettingId || !currentLibrary) return;
        setIsSaving(true);

        try {
            const sid = importDestination === 'campaign' ? targetSettingId : null;

            // 1. Import Traits
            const traitsToImport = traitCandidates.filter(c => c.isSelected && !c.isDuplicate).map(c => c.data);
            if (traitsToImport.length > 0) await LibraryService.importTraits(sid as any, traitsToImport, targetSettingId);

            // 2. Import Skills
            const skillsToImport = skillCandidates.filter(c => c.isSelected && !c.isDuplicate).map(c => c.data);
            // Skills remain local for now in this wizard (as they often depend on categories)
            if (skillsToImport.length > 0) await LibraryService.importSkills(sid as any, skillsToImport, targetSettingId);

            // 3. Import Specializations
            const specsToImport = specCandidates.filter(c => c.isSelected && !c.isDuplicate).map(c => c.data);
            if (specsToImport.length > 0) await LibraryService.importSpecializations(sid as any, specsToImport, targetSettingId);

            // 4. Import Backgrounds
            const bgsToImport = backgroundCandidates.filter(c => c.isSelected && !c.isDuplicate).map(c => c.data);
            if (bgsToImport.length > 0) await LibraryService.importBackgrounds(sid as any, bgsToImport, targetSettingId);

            // 5. Import Counters
            const ctrsToImport = counterCandidates.filter(c => c.isSelected && !c.isDuplicate).map(c => c.data);
            if (ctrsToImport.length > 0) await LibraryService.importCounters(sid as any, ctrsToImport, targetSettingId);

            setIsSaving(false);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            ErrorService.handleError(error, { context: 'LibraryImportWizard.import', userMessage: "L'import a échoué." });
            setIsSaving(false);
        }
    };

    const getSelectedCount = () => {
        return traitCandidates.filter(c => c.isSelected && !c.isDuplicate).length +
            skillCandidates.filter(c => c.isSelected && !c.isDuplicate).length +
            specCandidates.filter(c => c.isSelected && !c.isDuplicate).length +
            backgroundCandidates.filter(c => c.isSelected && !c.isDuplicate).length +
            counterCandidates.filter(c => c.isSelected && !c.isDuplicate).length;
    };

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
                                settings.map(s => (
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
                            <button
                                onClick={() => setActiveTab('traits')}
                                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'traits' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                <Zap size={16} /> Traits
                            </button>
                            <button
                                onClick={() => setActiveTab('skills')}
                                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'skills' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                <Book size={16} /> Compétences
                            </button>
                            <button
                                onClick={() => setActiveTab('specializations')}
                                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'specializations' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                <Award size={16} /> Spéc.
                            </button>
                            <button
                                onClick={() => setActiveTab('backgrounds')}
                                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'backgrounds' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                <Users size={16} /> Hist.
                            </button>
                            <button
                                onClick={() => setActiveTab('counters')}
                                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'counters' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                <Gauge size={16} /> Compteurs
                            </button>
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
                                                onClick={() => setImportDestination('campaign')}
                                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${importDestination === 'campaign' ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/10' : 'bg-slate-100/50 border-slate-200 hover:bg-white'}`}
                                            >
                                                <Book size={20} className={importDestination === 'campaign' ? 'text-indigo-600' : 'text-slate-400'} />
                                                <div className="text-center">
                                                    <div className={`text-sm font-bold ${importDestination === 'campaign' ? 'text-slate-900' : 'text-slate-500'}`}>Cette Campagne</div>
                                                    <div className="text-[10px] text-slate-400 italic">Spécifique à ce MJ</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setImportDestination('global');
                                                    // Auto-deselect variables
                                                    setTraitCandidates(prev => prev.map(c => c.isVariable ? { ...c, isSelected: false } : c));
                                                    // Relax restriction on skills: only deselect if variable AND duplicate
                                                    setSkillCandidates(prev => prev.map(c => (c.isVariable && c.isDuplicate) ? { ...c, isSelected: false } : c));
                                                }}
                                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${importDestination === 'global' ? 'bg-white border-purple-600 shadow-md ring-2 ring-purple-600/10' : 'bg-slate-100/50 border-slate-200 hover:bg-white'}`}
                                            >
                                                <Library size={20} className={importDestination === 'global' ? 'text-purple-600' : 'text-slate-400'} />
                                                <div className="text-center">
                                                    <div className={`text-sm font-bold ${importDestination === 'global' ? 'text-slate-900' : 'text-slate-500'}`}>Réserve Universelle</div>
                                                    <div className="text-[10px] text-slate-400 italic">Master Reserve (Global)</div>
                                                </div>
                                            </button>
                                        </div>
                                        {importDestination === 'global' && (
                                            <div className="mt-3 flex items-start gap-2 text-[10px] bg-amber-50 text-amber-700 p-2 rounded-lg border border-amber-100">
                                                <AlertCircle size={14} className="flex-shrink-0" />
                                                <p>Les éléments avec <strong>variantes</strong> (ex: "Artisanat : Forge") sont exclus de l'import global pour éviter de polluer la réserve avec des données spécifiques à un personnage.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {activeTab === 'traits' && (
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avantages & Désavantages</h3>
                                                {traitCandidates.length === 0 ? (
                                                    <div className="text-center py-10 text-slate-400 italic">Aucun trait détecté.</div>
                                                ) : (
                                                    traitCandidates.map((candidate, idx) => (
                                                        <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${candidate.isDuplicate ? 'bg-slate-50 opacity-60 border-slate-100' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={candidate.isSelected}
                                                                disabled={candidate.isDuplicate || (importDestination === 'global' && candidate.isVariable)}
                                                                onChange={() => {
                                                                    const newC = [...traitCandidates];
                                                                    newC[idx].isSelected = !newC[idx].isSelected;
                                                                    setTraitCandidates(newC);
                                                                }}
                                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-30"
                                                            />
                                                            <div className="flex-grow">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${candidate.data.type === 'avantage' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                        {candidate.data.type === 'avantage' ? 'Avantage' : 'Désavantage'}
                                                                    </span>
                                                                    <span className="font-bold text-slate-800 text-sm">{candidate.data.name}</span>
                                                                    {candidate.isVariable && (
                                                                        <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                                                                            <Zap size={10} /> Variable
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs text-slate-400 font-mono">({candidate.data.cost} pts)</span>
                                                                </div>
                                                                {candidate.data.description && (
                                                                    <p className={`text-xs text-slate-500 italic mt-0.5 ${candidate.isVariable ? 'text-amber-600/70' : ''}`}>{candidate.data.description}</p>
                                                                )}
                                                            </div>
                                                            {candidate.isDuplicate && (
                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                                                    <CheckCircle2 size={12} /> Doublon
                                                                </div>
                                                            )}
                                                        </div>
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
                                                    skillCandidates.map((candidate, idx) => (
                                                        <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${candidate.isDuplicate ? 'bg-slate-50 opacity-60 border-slate-100' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={candidate.isSelected}
                                                                disabled={candidate.isDuplicate || (importDestination === 'global' && candidate.isVariable)}
                                                                onChange={() => {
                                                                    const newC = [...skillCandidates];
                                                                    newC[idx].isSelected = !newC[idx].isSelected;
                                                                    setSkillCandidates(newC);
                                                                }}
                                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-30"
                                                            />
                                                            <div className="flex-grow">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="font-bold text-slate-800 text-sm">{candidate.data.name}</div>
                                                                    {candidate.isVariable && (
                                                                        <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                                                                            <Zap size={10} /> Variable
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] text-indigo-500 font-bold uppercase">{candidate.data.defaultCategory?.replace('Col_Comp_', 'Série ')}</div>
                                                            </div>
                                                            {candidate.isDuplicate && (
                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                                                    <CheckCircle2 size={12} /> Doublon
                                                                </div>
                                                            )}
                                                        </div>
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
                                                    specCandidates.map((candidate, idx) => (
                                                        <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${candidate.isDuplicate ? 'bg-slate-50 opacity-60 border-slate-100' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={candidate.isSelected}
                                                                disabled={candidate.isDuplicate}
                                                                onChange={() => {
                                                                    const newC = [...specCandidates];
                                                                    newC[idx].isSelected = !newC[idx].isSelected;
                                                                    setSpecCandidates(newC);
                                                                }}
                                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                            />
                                                            <div className="flex-grow">
                                                                <div className="font-bold text-slate-800 text-sm">{candidate.data.name}</div>
                                                                <p className="text-xs text-slate-500 italic">{candidate.data.description}</p>
                                                            </div>
                                                            {candidate.isDuplicate && (
                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                                                    <CheckCircle2 size={12} /> Doublon
                                                                </div>
                                                            )}
                                                        </div>
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
                                                    backgroundCandidates.map((candidate, idx) => (
                                                        <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${candidate.isDuplicate ? 'bg-slate-50 opacity-60 border-slate-100' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={candidate.isSelected}
                                                                disabled={candidate.isDuplicate || (importDestination === 'global' && candidate.isVariable)}
                                                                onChange={() => {
                                                                    const newC = [...backgroundCandidates];
                                                                    newC[idx].isSelected = !newC[idx].isSelected;
                                                                    setBackgroundCandidates(newC);
                                                                }}
                                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-30"
                                                            />
                                                            <div className="flex-grow">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="font-bold text-slate-800 text-sm">{candidate.data.name}</div>
                                                                    {candidate.isVariable && (
                                                                        <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                                                                            <Zap size={10} /> Variable
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {candidate.data.description && <p className="text-xs text-slate-500 italic">{candidate.data.description}</p>}
                                                            </div>
                                                            {candidate.isDuplicate && (
                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                                                    <CheckCircle2 size={12} /> Doublon
                                                                </div>
                                                            )}
                                                        </div>
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
                                                    counterCandidates.map((candidate, idx) => (
                                                        <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${candidate.isDuplicate ? 'bg-slate-50 opacity-60 border-slate-100' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={candidate.isSelected}
                                                                disabled={candidate.isDuplicate}
                                                                onChange={() => {
                                                                    const newC = [...counterCandidates];
                                                                    newC[idx].isSelected = !newC[idx].isSelected;
                                                                    setCounterCandidates(newC);
                                                                }}
                                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                            />
                                                            <div className="flex-grow">
                                                                <div className="font-bold text-slate-800 text-sm">{candidate.data.name}</div>
                                                                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                                                    <span>Max: {candidate.data.maxValue}</span>
                                                                    <span>Départ: {candidate.data.defaultValue}</span>
                                                                </div>
                                                            </div>
                                                            {candidate.isDuplicate && (
                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                                                    <CheckCircle2 size={12} /> Doublon
                                                                </div>
                                                            )}
                                                        </div>
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
