
import React, { lazy, Suspense } from 'react';
import { PencilLine, Check } from 'lucide-react';
import { CharacterSheetData } from '../../types';
import { RulesData } from '../../types/rules';

// Lazy Loaded Components
const ImportExportModal = lazy(() => import('../ImportExportModal'));
const PrintSelectionModal = lazy(() => import('../PrintSelectionModal'));
const ChangelogModal = lazy(() => import('../ChangelogModal'));
const UserGuideModal = lazy(() => import('../UserGuideModal'));
const UpdateNotifier = lazy(() => import('../UpdateNotifier'));
const AppearanceModal = lazy(() => import('../AppearanceModal'));
const SyncModal = lazy(() => import('../SyncModal'));
const CampaignConflictModal = lazy(() => import('../ui/CampaignConflictModal'));
const CampaignInfoModal = lazy(() => import('../ui/CampaignInfoModal'));
import CreationModeModal from '../sheet/CreationModeModal';
import EditionSidebar from '../sheet/EditionSidebar';
import ThematicModal from '../ui/ThematicModal';
import ConfirmationModal from '../ui/ConfirmationModal';

interface LayoutModalsProps {
    data: CharacterSheetData;
    rules: RulesData | null;
    setData: (newData: CharacterSheetData | ((prev: CharacterSheetData) => CharacterSheetData), isSyncAction?: boolean) => void;
    addLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void;
    mode: 'sheet' | 'settings';
    showImportExport: boolean;
    setShowImportExport: (show: boolean) => void;
    showPrintModal: boolean;
    setShowPrintModal: (show: boolean) => void;
    handlePrintConfirm: (s: Record<string, boolean>) => void;
    showChangelog: boolean;
    setShowChangelog: (show: boolean) => void;
    showUserGuide: boolean;
    setShowUserGuide: (show: boolean) => void;
    showAppearance: boolean;
    setShowAppearance: (show: boolean) => void;
    showSync: boolean;
    setShowSync: (show: boolean) => void;
    showCampaignInfo: boolean;
    setShowCampaignInfo: (show: boolean) => void;
    showConflict: boolean;
    setShowConflict: (show: boolean) => void;
    pendingRules: { rules: RulesData, id: string, name: string } | null;
    handleConfirmReset: () => void;
    handleConfirmBackup: () => void;
    pagesToPrint: Record<string, boolean>;
    showDiscardConfirm: boolean;
    setShowDiscardConfirm: (show: boolean) => void;
    confirmDiscard: () => void;
    showEditWarning: boolean;
    setShowEditWarning: (show: boolean) => void;
    executeEditModeActivation: () => void;
    showCreationWarning: boolean;
    setShowCreationWarning: (show: boolean) => void;
    executeCreationActivation: () => void;
    isEditMode: boolean;
    setIsEditMode: (val: boolean) => void;
    handleImportSuccess: (data: CharacterSheetData) => void;
}

const LayoutModals: React.FC<LayoutModalsProps> = ({
    data, rules, setData, addLog, mode,
    showImportExport, setShowImportExport,
    showPrintModal, setShowPrintModal, handlePrintConfirm,
    showChangelog, setShowChangelog,
    showUserGuide, setShowUserGuide,
    showAppearance, setShowAppearance,
    showSync, setShowSync,
    showCampaignInfo, setShowCampaignInfo,
    showConflict, setShowConflict, pendingRules, handleConfirmReset, handleConfirmBackup,
    showDiscardConfirm, setShowDiscardConfirm, confirmDiscard,
    showEditWarning, setShowEditWarning, executeEditModeActivation,
    showCreationWarning, setShowCreationWarning, executeCreationActivation,
    isEditMode, setIsEditMode,
    handleImportSuccess
}) => {
    return (
        <Suspense fallback={null}>
            <UpdateNotifier />

            <ImportExportModal
                isOpen={showImportExport}
                onClose={() => setShowImportExport(false)}
                onImportSuccess={handleImportSuccess}
                onExportSuccess={() => { }}
                variant={mode === 'settings' ? 'gm' : 'player'}
            />

            <PrintSelectionModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                onConfirm={(s: Record<string, boolean>) => handlePrintConfirm(s)}
            />

            <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />

            <UserGuideModal isOpen={showUserGuide} onClose={() => setShowUserGuide(false)} />

            <AppearanceModal
                isOpen={showAppearance}
                onClose={() => setShowAppearance(false)}
                data={data}
                rules={rules}
                onUpdate={(newData) => setData(newData)}
            />

            <SyncModal
                isOpen={showSync}
                onClose={() => setShowSync(false)}
                characterData={data}
                onSyncComplete={(syncInfo: CharacterSheetData['syncInfo']) => {
                    setData((prev: CharacterSheetData) => ({ ...prev, syncInfo }));
                    addLog(`Fiche synchronisée avec ${syncInfo?.settingName}`, 'success', 'sheet');
                }}
                onRestore={(restoredData) => {
                    setData(restoredData);
                    addLog("Version historique restaurée avec succès", 'success', 'sheet');
                }}
            />

            <CampaignConflictModal
                isOpen={showConflict}
                onClose={() => setShowConflict(false)}
                characterName={data.header?.name}
                currentCampaignName={data.syncInfo?.settingName || 'Indépendante'}
                newCampaignName={pendingRules?.name || ''}
                onConfirmReset={handleConfirmReset}
                onStay={() => setShowConflict(false)}
                onBackup={handleConfirmBackup}
            />

            <CampaignInfoModal
                isOpen={showCampaignInfo}
                onClose={() => setShowCampaignInfo(false)}
                campaignName={rules?.settingName || 'Ma Campagne'}
                description={rules?.description}
                welcomeMessage={rules?.welcomeMessage}
            />

            <ConfirmationModal
                isOpen={showDiscardConfirm}
                onClose={() => setShowDiscardConfirm(false)}
                onConfirm={confirmDiscard}
                title="Abandonner les modifications ?"
                message="Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter sans sauvegarder ?"
                confirmLabel="Quitter sans sauvegarder"
                cancelLabel="Rester ici"
                type="warning"
            />

            {showEditWarning && (
                <ThematicModal
                    isOpen={showEditWarning}
                    onClose={() => setShowEditWarning(false)}
                    title="Activer le Mode Édition ?"
                    icon={<PencilLine size={24} />}
                    size="md"
                    footer={
                        <>
                            <button
                                onClick={() => setShowEditWarning(false)}
                                className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={executeEditModeActivation}
                                className="px-6 py-2 bg-amber-600 text-white rounded-sm font-bold shadow-md hover:bg-amber-700 flex items-center gap-2"
                            >
                                <Check size={16} /> Compris, j'active
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-4 py-2 text-[#5c4d41]">
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm text-sm leading-relaxed">
                            <p className="font-bold mb-2">Qu'est-ce que le Mode Édition ?</p>
                            <ul className="list-disc list-inside space-y-2 text-xs">
                                <li><strong>Ajout direct</strong> : Glissez des compétences depuis la barre latérale.</li>
                                <li><strong>Réorganisation</strong> : Déplacez vos compétences d'un bloc à l'autre.</li>
                                <li><strong>Nettoyage</strong> : Supprimez des éléments inutiles via l'icône poubelle.</li>
                                <li><strong>Suggestions</strong> : Les nouveaux éléments sont suggérés au MJ.</li>
                            </ul>
                            <p className="mt-4 text-[10px] italic opacity-70">Note : Ce mode est réservé aux ajustements de structure. Pour remplir vos points, utilisez le mode standard ou le mode création.</p>
                        </div>
                    </div>
                </ThematicModal>
            )}

            {showCreationWarning && (
                <CreationModeModal
                    data={data}
                    onClose={() => setShowCreationWarning(false)}
                    onConfirm={executeCreationActivation}
                />
            )}

            {isEditMode && <EditionSidebar onClose={() => setIsEditMode(false)} />}
        </Suspense>
    );
};

export default LayoutModals;
