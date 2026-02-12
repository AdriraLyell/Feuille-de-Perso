import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft, LogOut, BookOpen, Users } from 'lucide-react';
import { extractRulesFromCharacter } from './utils/templateImporter';
import { RulesData } from '../types/rules';
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
import AdminBackgroundLibrary from './components/libraries/AdminBackgroundLibrary';
import AdminCounterLibrary from './components/libraries/AdminCounterLibrary';
import DeployToGithubModal from './components/DeployModal';
import AdminDashboard from './components/AdminDashboard';
import CampaignCharactersView from './components/CampaignCharactersView';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import LoginScreen from './components/LoginScreen';
import GlobalPlayersView from './components/GlobalPlayersView';
import { ErrorService } from '../services/ErrorService';
import UnauthorizedScreen from './components/UnauthorizedScreen';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAdminRulesHandler } from './hooks/useAdminRulesHandler';
import AdminHeader from './components/AdminHeader';
import { CampaignService } from '../services/CampaignService';

const AdminApp: React.FC = () => {
    const { session, isAdmin, logout } = useAdminAuth();
    const {
        rules,
        currentSettingId,
        currentSettingName,
        globalUsage,
        isSaving,
        saveFeedback,
        setSaveFeedback,
        hasUnsavedChanges,
        handleSelectSetting,
        handleUpdateRules,
        refreshRules,
        handleSaveToCloud,
        handleExport,
        clearRules
    } = useAdminRulesHandler();

    const [viewMode, setViewMode] = useState<'dashboard' | 'editor' | 'players'>('dashboard');
    const [activeTab, setActiveTab] = useState<'general' | 'attributes' | 'skills' | 'costs' | 'libraries' | 'players'>('general');
    const [activeLibraryTab, setActiveLibraryTab] = useState<'traits' | 'skills' | 'specializations' | 'backgrounds' | 'counters'>('traits');

    const [showDeployModal, setShowDeployModal] = useState(false);
    const [showImportResult, setShowImportResult] = useState(false);
    const [importReport, setImportReport] = useState<{ success: string[], warnings: string[] } | null>(null);
    const [showChangelog, setShowChangelog] = useState(false);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [candidateRules, setCandidateRules] = useState<RulesData | null>(null);

    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'info' | 'success';
    }>({ isOpen: false, title: "", message: "", onConfirm: () => { }, type: 'info' });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBackToDashboard = useCallback(() => {
        if (hasUnsavedChanges) {
            setConfirmState({
                isOpen: true,
                title: "Modifications non sauvegardées",
                message: "Vous avez des modifications en attente qui seront perdues si vous quittez. Confirmer ?",
                type: 'warning',
                onConfirm: () => {
                    setViewMode('dashboard');
                    clearRules();
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                }
            });
            return;
        }
        setViewMode('dashboard');
        clearRules();
    }, [hasUnsavedChanges, clearRules]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !rules) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                const { rules: extractedCandidate } = extractRulesFromCharacter(json, rules);
                setCandidateRules(extractedCandidate);
                setWizardOpen(true);
            } catch (error) {
                ErrorService.handleError(error, { context: 'AdminApp.importFile', userMessage: "Erreur lors de la lecture du fichier." });
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    if (!session) return <LoginScreen />;
    if (!isAdmin) return <UnauthorizedScreen session={session} />;

    if (viewMode === 'dashboard') {
        return (
            <AdminDashboard
                onSelectSetting={(id, name, rules) => { handleSelectSetting(id, name, rules); setViewMode('editor'); }}
                onViewPlayers={() => setViewMode('players')}
                onLogout={logout}
            />
        );
    }

    if (viewMode === 'players') {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={() => setViewMode('dashboard')}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors"
                            aria-label="Retour au Tableau de Bord"
                        >
                            <ArrowLeft size={20} /> Retour au Tableau de Bord
                        </button>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 bg-[#5c4d41] hover:bg-[#8b2e2e] text-white px-4 py-2 rounded-md font-bold transition-all shadow-md group"
                            aria-label="Se déconnecter"
                        >
                            <LogOut size={18} className="group-hover:rotate-12 transition-transform" /> Déconnexion
                        </button>
                    </div>
                    <GlobalPlayersView />
                </div>
            </div>
        );
    }

    if (!rules) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 text-red-600">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Chargement...</h1>
                    <p>Initialisation de l'éditeur...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-20">
            <AdminHeader
                currentSettingName={currentSettingName}
                hasUnsavedChanges={hasUnsavedChanges}
                isSaving={isSaving}
                onBack={handleBackToDashboard}
                onSave={handleSaveToCloud}
                onImport={() => fileInputRef.current?.click()}
                onExport={handleExport}
                onPublish={() => setShowDeployModal(true)}
                onLogout={logout}
                onShowChangelog={() => setShowChangelog(true)}
                onCheckSchema={() => currentSettingId && CampaignService.checkSchema?.(currentSettingId)}
            />

            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />

            <nav className="bg-white border-b border-gray-200 mt-0 sticky top-16 z-40">
                <div className="max-w-7xl mx-auto flex">
                    {([
                        { id: 'general', label: 'Général & Création' },
                        { id: 'attributes', label: 'Attributs' },
                        { id: 'skills', label: 'Compétences' },
                        { id: 'costs', label: 'Coûts & Limites' },
                        { id: 'libraries', label: <div className="flex items-center justify-center gap-2"><BookOpen size={16} /> Bibliothèques</div> },
                        { id: 'players', label: <div className="flex items-center justify-center gap-2"><Users size={16} /> Joueurs</div> }
                    ] as const).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-4 text-center font-bold uppercase tracking-wider text-sm border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            <main className={`mx-auto p-6 transition-all duration-300 ${activeTab === 'skills' ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
                {activeTab === 'general' && (
                    <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 border-b pb-2">Configuration Générale</h2>
                        <AdminCreationEditor rules={rules} onUpdate={handleUpdateRules} />
                    </div>
                )}
                {activeTab === 'attributes' && <AdminAttributesEditor rules={rules} onUpdate={handleUpdateRules} />}
                {activeTab === 'skills' && <AdminSkillsEditor rules={rules} onUpdate={handleUpdateRules} />}
                {activeTab === 'costs' && <AdminCostsEditor rules={rules} onUpdate={handleUpdateRules} />}
                {activeTab === 'libraries' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex gap-4 mb-4 bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-fit mx-auto overflow-x-auto">
                            {['traits', 'skills', 'backgrounds', 'counters', 'specializations'].map((lt) => (
                                <button
                                    key={lt}
                                    onClick={() => setActiveLibraryTab(lt as typeof activeLibraryTab)}
                                    className={`px-4 py-2 rounded font-bold text-sm transition-colors whitespace-nowrap ${activeLibraryTab === lt ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {lt.charAt(0).toUpperCase() + lt.slice(1)}
                                </button>
                            ))}
                        </div>
                        {activeLibraryTab === 'traits' && <AdminTraitLibrary rules={rules} onUpdate={handleUpdateRules} globalUsage={globalUsage} />}
                        {activeLibraryTab === 'skills' && <AdminSkillLibrary rules={rules} onUpdate={handleUpdateRules} globalUsage={globalUsage} />}
                        {activeLibraryTab === 'backgrounds' && <AdminBackgroundLibrary rules={rules} onUpdate={handleUpdateRules} globalUsage={globalUsage} />}
                        {activeLibraryTab === 'counters' && <AdminCounterLibrary rules={rules} onUpdate={handleUpdateRules} globalUsage={globalUsage} />}
                        {activeLibraryTab === 'specializations' && <AdminSpecializationLibrary rules={rules} onUpdate={handleUpdateRules} globalUsage={globalUsage} />}
                    </div>
                )}
                {activeTab === 'players' && currentSettingId && <CampaignCharactersView settingId={currentSettingId} onRefreshRules={refreshRules} />}
            </main>

            <ImportResultModal isOpen={showImportResult} onClose={() => setShowImportResult(false)} report={importReport} />
            <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />

            {wizardOpen && candidateRules && rules && (
                <ImportWizardModal
                    isOpen={wizardOpen}
                    onClose={() => { setWizardOpen(false); setCandidateRules(null); }}
                    currentRules={rules}
                    candidateRules={candidateRules}
                    onConfirm={(merged: RulesData) => {
                        handleUpdateRules(merged);
                        setWizardOpen(false);
                        setCandidateRules(null);
                        setImportReport({ success: ["Fusion effectuée avec succès"], warnings: [] });
                        setShowImportResult(true);
                    }}
                />
            )}

            {saveFeedback && (
                <ConfirmationModal
                    isOpen={saveFeedback.isOpen}
                    onClose={() => setSaveFeedback(null)}
                    onConfirm={() => setSaveFeedback(null)}
                    title={saveFeedback.success ? "Sauvegarde Réussie" : "Erreur de Sauvegarde"}
                    message={saveFeedback.message}
                    type={saveFeedback.success ? 'success' : 'danger'}
                    confirmLabel="OK"
                    cancelLabel=""
                />
            )}

            <ConfirmationModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                type={confirmState.type}
            />
            <DeploymentMonitor />
        </div>
    );
};

export default AdminApp;
