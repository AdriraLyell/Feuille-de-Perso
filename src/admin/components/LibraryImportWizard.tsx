import React from 'react';
import { SyncedCharacter } from '../../services/CharacterSyncService';
import { useLibraryImport } from '../hooks/useLibraryImport';
import { WizardHeader } from './import-wizard/WizardHeader';
import { CampaignSelector } from './import-wizard/CampaignSelector';
import { WizardTabs } from './import-wizard/WizardTabs';
import { WizardContent } from './import-wizard/WizardContent';
import { WizardFooter } from './import-wizard/WizardFooter';

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

                <WizardHeader characterName={character.character_name} onClose={onClose} />

                {!targetSettingId ? (
                    <CampaignSelector settings={settings} onSelect={setTargetSettingId} />
                ) : (
                    <>
                        <WizardTabs activeTab={activeTab} onTabChange={handleTabChange} />

                        <div className="flex-grow overflow-y-auto p-6">
                            <WizardContent
                                isLoading={isLoading}
                                activeTab={activeTab}
                                importDestination={importDestination}
                                updateImportDestination={updateImportDestination}
                                traitCandidates={traitCandidates}
                                skillCandidates={skillCandidates}
                                specCandidates={specCandidates}
                                backgroundCandidates={backgroundCandidates}
                                counterCandidates={counterCandidates}
                                toggleCandidateSelection={toggleCandidateSelection}
                            />
                        </div>

                        <WizardFooter
                            isSaving={isSaving}
                            isLoading={isLoading}
                            selectedCount={getSelectedCount()}
                            onClose={character.setting_id ? onClose : () => setTargetSettingId(null)}
                            onImport={handleImport}
                            showCancelOnly={!!character.setting_id}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default LibraryImportWizard;
