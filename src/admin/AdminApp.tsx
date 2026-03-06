import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft, LogOut, BookOpen, Users, CalendarDays } from 'lucide-react';
import { extractRulesFromCharacter } from './utils/templateImporter';
import { RulesData } from '../types/rules';
import AdminCreationEditor from './components/AdminCreationEditor';
import AdminAttributesEditor from './components/AdminAttributesEditor';
import AdminSkillsEditor from './components/AdminSkillsEditor';
import ImportResultModal from './components/ImportResultModal';
import ChangelogModal from '../components/ChangelogModal';
import DeploymentMonitor from './components/DeploymentMonitor';
import ImportWizardModal from './components/import-wizard/ImportWizardModal';
import AdminTraitLibrary from './components/libraries/AdminTraitLibrary';
import AdminSkillLibrary from './components/libraries/AdminSkillLibrary';
import AdminSpecializationLibrary from './components/libraries/AdminSpecializationLibrary';
import AdminBackgroundLibrary from './components/libraries/AdminBackgroundLibrary';
import AdminCounterLibrary from './components/libraries/AdminCounterLibrary';
import AdminMysticLibrary from './components/libraries/AdminMysticLibrary';
import AdminDashboard from './components/AdminDashboard';
import AdminCalendarEditor from './components/AdminCalendarEditor';
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
import { migrationTool } from './utils/migrationTool';
import { MessageService } from '../services/MessageService';
import MessageWidget from '../components/messaging/MessageWidget';
import { useMessagingContacts } from '../hooks/messaging/useMessagingContacts';

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
    const [activeTab, setActiveTab] = useState<'general' | 'attributes' | 'skills' | 'libraries' | 'calendar' | 'players'>('general');
    const [activeLibraryTab, setActiveLibraryTab] = useState<'traits' | 'skills' | 'specializations' | 'backgrounds' | 'counters' | 'mystic'>('traits');
    const [playersTabUnread, setPlayersTabUnread] = useState(0);

    const [showImportResult, setShowImportResult] = useState(false);
    const [importReport, setImportReport] = useState<{ success: string[], warnings: string[] } | null>(null);
    const [showChangelog, setShowChangelog] = useState(false);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [candidateRules, setCandidateRules] = useState<RulesData | null>(null);
    const [isMessagingOpen, setIsMessagingOpen] = useState(false);

    // Initialisation des contacts pour la messagerie MJ
    const gmContacts = useMessagingContacts({
        settingId: currentSettingId || '',
        viewerId: 'GM',
        isGM: true
    });

    // Badge de messages non lus sur l'onglet Joueurs
    React.useEffect(() => {
        if (!currentSettingId) return;
        const poll = () => {
            MessageService.countUnread(currentSettingId, 'GM')
                .then((count) => {
                    // Ne pas afficher le badge si l'onglet Joueurs est déjà actif
                    if (activeTab !== 'players') {
                        setPlayersTabUnread(count);
                    } else {
                        setPlayersTabUnread(0);
                    }
                })
                .catch(() => { /* silencieux */ });
        };
        poll();
        const interval = setInterval(poll, 15000);
        return () => clearInterval(interval);
    }, [currentSettingId, activeTab]);

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
            <div className="min-h-screen bg-stone-950 p-8 relative overflow-hidden">
                {/* Background Texture Effect */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-20 pointer-events-none" />

                <div className="max-w-[1600px] mx-auto relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        <button
                            onClick={() => setViewMode('dashboard')}
                            className="flex items-center gap-2 text-stone-400 hover:text-amber-500 font-serif italic text-lg transition-all group"
                            aria-label="Retour au Tableau de Bord"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Retour au Tableau de Bord</span>
                        </button>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 bg-stone-900 hover:bg-rose-950/40 text-stone-400 hover:text-rose-500 px-6 py-2 rounded-sm font-black uppercase tracking-widest text-xs transition-all border border-stone-800 hover:border-rose-900/30 shadow-lg group"
                            aria-label="Se déconnecter"
                        >
                            <LogOut size={16} className="group-hover:rotate-12 transition-transform" />
                            Déconnexion
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
        <div className="min-h-screen bg-mystic-stone text-stone-200 font-sans pb-20 transition-colors duration-500">
            <AdminHeader
                currentSettingName={currentSettingName}
                hasUnsavedChanges={hasUnsavedChanges}
                isSaving={isSaving}
                onBack={handleBackToDashboard}
                onSave={handleSaveToCloud}
                onImport={() => fileInputRef.current?.click()}
                onExport={handleExport}
                onPublish={() => { }}
                onLogout={logout}
                onShowChangelog={() => setShowChangelog(true)}
                onCheckSchema={() => currentSettingId && CampaignService.checkSchema?.(currentSettingId)}
                legacyEffectsCount={(rules.libraries?.traits || []).reduce((acc, t) => acc + (t.effects?.filter((e: import('../types').TraitEffect) => {
                    const isFormula = e.type === 'formula';
                    const isLegacyCandidate = ['free_skill_rank', 'master_skill', 'attribute_bonus', 'xp_bonus'].includes(e.type as string);
                    return isLegacyCandidate || (isFormula && !e.formulaId);
                }).length || 0), 0)}
                onMigrate={() => {
                    if (!rules) return;
                    const { updatedRules, stats } = migrationTool.migrateTraitsToFormulas(rules);
                    if (stats.effectsMigrated > 0) {
                        handleUpdateRules(updatedRules);
                        setImportReport({
                            success: [`Migration terminée : ${stats.effectsMigrated} effets convertis en formules.`],
                            warnings: [`${stats.formulasCreated} nouvelles formules créées dans la bibliothèque.`]
                        });
                        setShowImportResult(true);
                    } else {
                        alert("Aucun effet à migrer trouvé.");
                    }
                }}
                isMessagingOpen={isMessagingOpen}
                onToggleMessaging={() => setIsMessagingOpen(!isMessagingOpen)}
                unreadCount={playersTabUnread}
            />

            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />

            <nav className="bg-mystic-deep/90 border-b border-stone-800 mt-0 sticky top-[72px] z-40 backdrop-blur-md shadow-lg">
                <div className="max-w-7xl mx-auto flex">
                    {([
                        { id: 'general', label: 'Général & Création' },
                        { id: 'attributes', label: 'Attributs' },
                        { id: 'skills', label: 'Compétences' },
                        { id: 'libraries', label: <div className="flex items-center justify-center gap-2"><BookOpen size={16} /> Bibliothèques</div> },
                        { id: 'calendar', label: <div className="flex items-center justify-center gap-2"><CalendarDays size={16} /> Calendrier</div> },
                        { id: 'players', label: <div className="flex items-center justify-center gap-2"><Users size={16} /> Joueurs{playersTabUnread > 0 && <span className="bg-rose-600 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">{playersTabUnread > 9 ? '9+' : playersTabUnread}</span>}</div> }
                    ] as const).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-4 text-center font-bold uppercase tracking-widest text-xs border-b-2 transition-all ${activeTab === tab.id ? 'border-amber-500 text-amber-500 bg-amber-900/20 shadow-[inset_0_-2px_0_rgba(245,158,11,0.5)]' : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            <main className={`mx-auto p-6 transition-all duration-300 ${activeTab === 'skills' || activeTab === 'players' ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
                {activeTab === 'general' && (
                    <div className="bg-mystic-surface p-8 rounded-sm shadow-glass border border-stone-700/50 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-serif font-bold mb-6 text-amber-gold border-b border-stone-700 pb-2 flex items-center gap-2">
                            Configuration Générale
                        </h2>
                        <AdminCreationEditor rules={rules} onUpdate={handleUpdateRules} settingId={currentSettingId || ''} />
                    </div>
                )}
                {activeTab === 'attributes' && <AdminAttributesEditor rules={rules} onUpdate={handleUpdateRules} />}
                {activeTab === 'skills' && <AdminSkillsEditor rules={rules} onUpdate={handleUpdateRules} />}
                {activeTab === 'libraries' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex gap-2 mb-6 bg-mystic-surface p-2 rounded-sm shadow-md border border-stone-700 w-fit mx-auto overflow-x-auto scrollbar-hide">
                            {([
                                { id: 'traits', label: 'Traits' },
                                { id: 'skills', label: 'Compétences' },
                                { id: 'backgrounds', label: 'Arrière-Plans' },
                                { id: 'counters', label: 'Compteurs' },
                                { id: 'mystic', label: 'Habilités Myst.' },
                                { id: 'specializations', label: 'Spécialisations' }
                            ] as const).map((lt) => (
                                <button
                                    key={lt.id}
                                    onClick={() => setActiveLibraryTab(lt.id as typeof activeLibraryTab)}
                                    className={`px-6 py-2 rounded-sm font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap shadow-sm ${activeLibraryTab === lt.id ? 'bg-amber-500 text-stone-950 shadow-glow-gold scale-105 ring-1 ring-amber-400' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'}`}
                                >
                                    {lt.label}
                                </button>
                            ))}
                        </div>
                        {activeLibraryTab === 'traits' && <AdminTraitLibrary rules={rules} onUpdate={handleUpdateRules} globalUsage={globalUsage} />}
                        {activeLibraryTab === 'skills' && <AdminSkillLibrary rules={rules} onUpdate={handleUpdateRules} globalUsage={globalUsage} />}
                        {activeLibraryTab === 'backgrounds' && <AdminBackgroundLibrary rules={rules} onUpdate={handleUpdateRules} globalUsage={globalUsage} />}
                        {activeLibraryTab === 'counters' && <AdminCounterLibrary rules={rules} onUpdate={handleUpdateRules} globalUsage={globalUsage} />}
                        {activeLibraryTab === 'mystic' && <AdminMysticLibrary rules={rules} onUpdate={handleUpdateRules} globalUsage={globalUsage} />}
                        {activeLibraryTab === 'specializations' && <AdminSpecializationLibrary rules={rules} onUpdate={handleUpdateRules} globalUsage={globalUsage} />}
                    </div>
                )}
                {activeTab === 'calendar' && <AdminCalendarEditor rules={rules} onUpdate={handleUpdateRules} />}
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

            {/* Messagerie MJ avec contrôle externe */}
            {currentSettingId && (
                <div className="no-print">
                    <MessageWidget
                        settingId={currentSettingId}
                        viewerId="GM"
                        viewerName="Meneur de Jeu"
                        isOpen={isMessagingOpen}
                        onToggle={setIsMessagingOpen}
                        contacts={gmContacts}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminApp;
