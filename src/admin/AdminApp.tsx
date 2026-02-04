import React, { useState, useEffect, useRef } from 'react';
import { extractRulesFromCharacter } from './utils/templateImporter';
import { loadRules } from './utils/rulesLoader';
import { generateRulesJSContent } from './utils/rulesGenerator';
import { Settings, Save, Download, Upload } from 'lucide-react';
import { RulesData } from '../types/rules';
import { APP_VERSION } from '../constants';
import AdminCreationEditor from './components/AdminCreationEditor';
import AdminAttributesEditor from './components/AdminAttributesEditor';
import AdminSkillsEditor from './components/AdminSkillsEditor';
import AdminCostsEditor from './components/AdminCostsEditor';
import AdminCountersEditor from './components/AdminCountersEditor';
import AdminBackgroundsEditor from './components/AdminBackgroundsEditor';
import ImportResultModal from './components/ImportResultModal';
import ChangelogModal from '../components/ChangelogModal';
import DeploymentMonitor from './components/DeploymentMonitor';
import ImportWizardModal from './components/import-wizard/ImportWizardModal';
import AdminTraitLibrary from './components/libraries/AdminTraitLibrary';
import AdminSkillLibrary from './components/libraries/AdminSkillLibrary';
import AdminSpecializationLibrary from './components/libraries/AdminSpecializationLibrary';
import DeployToGithubModal from './components/DeployModal';
import { BookOpen, Save as SaveIcon, Cloud, AlertTriangle } from 'lucide-react';
import { usePersistence } from './hooks/usePersistence';
import RestoreSessionModal from './components/RestoreSessionModal';

const AdminApp: React.FC = () => {
    const [rules, setRules] = useState<RulesData | null>(null);
    const [showDeployModal, setShowDeployModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'attributes' | 'skills' | 'costs' | 'counters' | 'backgrounds' | 'libraries'>('general');
    const [activeLibraryTab, setActiveLibraryTab] = useState<'traits' | 'skills' | 'specializations'>('traits');

    // Import Modal State
    const [showImportResult, setShowImportResult] = useState(false);
    const [importReport, setImportReport] = useState<{ success: string[], warnings: string[] } | null>(null);
    const [showChangelog, setShowChangelog] = useState(false);

    // Wizard State
    const [wizardOpen, setWizardOpen] = useState(false);
    const [candidateRules, setCandidateRules] = useState<RulesData | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Persistence Hook
    const { hasUnsavedChanges, lastSaved, isRestoring, restoreAvailable, resolveRestore } = usePersistence(
        rules,
        (restoredRules) => {
            setRules(restoredRules);
            // @ts-ignore
            window.EXTERNAL_RULES = restoredRules;
        },
        () => {
            // Callback when persistence flow is complete
        }
    );

    useEffect(() => {
        // Always load default rules initially so we have a version comparison
        const loaded = loadRules();
        setRules(prev => prev || loaded);
    }, []);

    const handleUpdateRules = (newRules: RulesData) => {
        setRules(newRules);
        // Update window object too for immediate "preview"
        // @ts-ignore
        window.EXTERNAL_RULES = newRules;
    };

    const handleExport = () => {
        if (!rules) return;
        const ruleString = generateRulesJSContent(rules);
        const blob = new Blob([ruleString], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rules.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !rules) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);

                // Extract candidate rules (Prepare for Wizard)
                // We pass current rules so it can fill blanks, but we want to see diffs
                const { rules: extractedCandidate, report } = extractRulesFromCharacter(json, rules);

                setCandidateRules(extractedCandidate);
                setWizardOpen(true);
                // We don't set importReport/showImportResult here anymore, the wizard handles the "Pre-flight" check.
                // But if we want to show the "Extraction Report" (Success/Warnings), we could pass it to Wizard too?
                // The Wizard re-calculates Diff, which is better. The Extraction Report is technical (missing fields).
                // Let's keep it simple for now.

            } catch (error) {
                console.error(error);
                alert("Erreur lors de l'import : " + (error as Error).message);
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };

    if (!rules) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 text-red-600">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Erreur de chargement</h1>
                    <p>Le fichier rules.js est introuvable ou corrompu.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-20">
            {/* Header */}
            <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Settings className="text-blue-400" />
                        <h1 className="text-xl font-bold tracking-wide">Seigneurs des Mystères <span className="text-slate-400 font-normal">| Administration</span></h1>

                        {/* Discrete Persistence Status */}
                        <div className="ml-4 pl-4 border-l border-slate-700 flex items-center" title={hasUnsavedChanges ? "Modifications locales non publiées" : "Synchronisé avec GitHub"}>
                            {hasUnsavedChanges ? (
                                <div className="flex items-center gap-2 text-amber-400 animate-pulse">
                                    <AlertTriangle size={20} />
                                    <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Non Publié</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-green-400/50">
                                    <Cloud size={20} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <button
                            onClick={() => setShowChangelog(true)}
                            className="bg-slate-800 px-3 py-1 rounded hover:bg-slate-700 transition-colors"
                            title="Voir le journal des versions"
                        >
                            v{APP_VERSION}
                        </button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                        />
                        <button
                            onClick={handleImportClick}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded font-bold transition-colors border border-slate-600"
                            title="Importer depuis une Fiche Joueur ou un Template"
                        >
                            <Upload size={16} /> Import
                        </button>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold transition-colors"
                            title="Télécharger rules.js (Manuel)"
                        >
                            <Download size={16} /> Export
                        </button>

                        <button
                            onClick={() => setShowDeployModal(true)}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold transition-colors shadow-lg shadow-purple-900/20"
                            title="Publier directement sur GitHub"
                        >
                            <Upload size={16} /> Publier
                        </button>
                    </div>
                </div>
                {/* Persistence Status Bar Removed - Replaced by Header Icon */}
            </header>

            {showDeployModal && rules && (
                <DeployToGithubModal
                    isOpen={showDeployModal}
                    onClose={() => setShowDeployModal(false)}
                    rules={rules}
                />
            )}

            {/* Tabs Navigation */}
            <nav className="bg-white border-b border-gray-200 mt-0 sticky top-16 z-40">
                <div className="max-w-7xl mx-auto flex">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 py-4 text-center font-bold uppercase tracking-wider text-sm border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        Général & Création
                    </button>
                    <button
                        onClick={() => setActiveTab('attributes')}
                        className={`flex-1 py-4 text-center font-bold uppercase tracking-wider text-sm border-b-2 transition-colors ${activeTab === 'attributes' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        Attributs
                    </button>
                    <button
                        onClick={() => setActiveTab('skills')}
                        className={`flex-1 py-4 text-center font-bold uppercase tracking-wider text-sm border-b-2 transition-colors ${activeTab === 'skills' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        Compétences
                    </button>
                    <button
                        onClick={() => setActiveTab('costs')}
                        className={`flex-1 py-4 text-center font-bold uppercase tracking-wider text-sm border-b-2 transition-colors ${activeTab === 'costs' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        Coûts & Limites
                    </button>
                    <button
                        onClick={() => setActiveTab('counters')}
                        className={`flex-1 py-4 text-center font-bold uppercase tracking-wider text-sm border-b-2 transition-colors ${activeTab === 'counters' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        Compteurs
                    </button>
                    <button
                        onClick={() => setActiveTab('backgrounds')}
                        className={`flex-1 py-4 text-center font-bold uppercase tracking-wider text-sm border-b-2 transition-colors ${activeTab === 'backgrounds' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        Arrière-Plans
                    </button>
                    <button
                        onClick={() => setActiveTab('libraries')}
                        className={`flex-1 py-4 text-center font-bold uppercase tracking-wider text-sm border-b-2 transition-colors ${activeTab === 'libraries' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <BookOpen size={16} /> Bibliothèques
                        </div>
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-6">

                {activeTab === 'general' && (
                    <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 border-b pb-2">Configuration Générale</h2>
                        <p className="text-slate-500 italic mb-6">Paramètres de création de personnage, modes de distribution et système de cartes.</p>

                        <AdminCreationEditor rules={rules} onUpdate={handleUpdateRules} />
                    </div>
                )}

                {activeTab === 'attributes' && (
                    <AdminAttributesEditor rules={rules} onUpdate={handleUpdateRules} />
                )}

                {activeTab === 'skills' && (
                    <AdminSkillsEditor rules={rules} onUpdate={handleUpdateRules} />
                )}

                {activeTab === 'costs' && (
                    <AdminCostsEditor rules={rules} onUpdate={handleUpdateRules} />
                )}

                {activeTab === 'counters' && (
                    <AdminCountersEditor rules={rules} onUpdate={handleUpdateRules} />
                )}

                {activeTab === 'backgrounds' && (
                    <AdminBackgroundsEditor rules={rules} onUpdate={handleUpdateRules} />
                )}

                {activeTab === 'libraries' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex gap-4 mb-4 bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-fit mx-auto">
                            <button
                                onClick={() => setActiveLibraryTab('traits')}
                                className={`px-4 py-2 rounded font-bold text-sm transition-colors ${activeLibraryTab === 'traits' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                Traits (Avantages/Défauts)
                            </button>
                            <button
                                onClick={() => setActiveLibraryTab('skills')}
                                className={`px-4 py-2 rounded font-bold text-sm transition-colors ${activeLibraryTab === 'skills' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                Réserve de Compétences
                            </button>
                            <button
                                onClick={() => setActiveLibraryTab('specializations')}
                                className={`px-4 py-2 rounded font-bold text-sm transition-colors ${activeLibraryTab === 'specializations' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                Spécialisations
                            </button>
                        </div>

                        {activeLibraryTab === 'traits' && (
                            <AdminTraitLibrary rules={rules} onUpdate={handleUpdateRules} />
                        )}
                        {activeLibraryTab === 'skills' && (
                            <AdminSkillLibrary rules={rules} onUpdate={handleUpdateRules} />
                        )}
                        {activeLibraryTab === 'specializations' && (
                            <AdminSpecializationLibrary rules={rules} onUpdate={handleUpdateRules} />
                        )}
                    </div>
                )}
            </main>

            <ImportResultModal
                isOpen={showImportResult}
                onClose={() => setShowImportResult(false)}
                report={importReport}
            />

            <ChangelogModal
                isOpen={showChangelog}
                onClose={() => setShowChangelog(false)}
            />

            {wizardOpen && candidateRules && rules && (
                <ImportWizardModal
                    isOpen={wizardOpen}
                    onClose={() => { setWizardOpen(false); setCandidateRules(null); }}
                    currentRules={rules}
                    candidateRules={candidateRules}
                    onConfirm={(merged) => {
                        handleUpdateRules(merged);
                        setWizardOpen(false);
                        setCandidateRules(null);
                        // Optionally show success message?
                        setImportReport({
                            success: ["Fusion effectuée avec succès"],
                            warnings: []
                        });
                        setShowImportResult(true);
                    }}
                />
            )}

            {/* Restore Session Modal */}
            <RestoreSessionModal
                isOpen={!!restoreAvailable}
                restorableRules={restoreAvailable}
                currentVersion={rules?.version || "Inconnue"}
                onConfirm={() => resolveRestore(true)}
                onDiscard={() => resolveRestore(false)}
            />
        </div >
    );
};
export default AdminApp;
