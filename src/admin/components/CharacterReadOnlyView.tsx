import React, { useState, useEffect } from 'react';
import { CampaignService } from '../../services/CampaignService';
import { SyncedCharacter } from '../../services/CharacterSyncService';
import { CharacterSheetData } from '../../types/character';
import { RulesData } from '../../types/rules';
import { useCampaignLabels } from '../hooks/useCampaignLabels';
import { useNotification } from '../../context/NotificationContext';
import ImportWizardModal from '../components/import-wizard/ImportWizardModal';
import { ImageSyncResolver } from '../../services/ImageSyncResolver';
import { logger } from '../../utils/logger';

// Sub Components
import { ReadOnlyHeader } from './readonly/ReadOnlyHeader';
import { ReadOnlyIdentity } from './readonly/ReadOnlyIdentity';
import { ReadOnlySuggestions } from './readonly/ReadOnlySuggestions';
import { ReadOnlyAttributes } from './readonly/ReadOnlyAttributes';
import { ReadOnlySkills } from './readonly/ReadOnlySkills';
import { ReadOnlyBackgrounds } from './readonly/ReadOnlyBackgrounds';
import { ReadOnlyTraits } from './readonly/ReadOnlyTraits';
import { ReadOnlyExperience } from './readonly/ReadOnlyExperience';
import { ReadOnlyInventory } from './readonly/ReadOnlyInventory';
import { ReadOnlyPortrait } from './readonly/ReadOnlyPortrait';

interface CharacterReadOnlyViewProps {
    character: SyncedCharacter;
    onClose: () => void;
    onRefreshRules?: () => void;
}

const CharacterReadOnlyView: React.FC<CharacterReadOnlyViewProps> = ({ character, onClose, onRefreshRules }) => {
    const addLog = useNotification();
    const { getCategoryLabel } = useCampaignLabels(character.setting_id || undefined);

    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [candidateRules, setCandidateRules] = useState<RulesData | null>(null);
    const [currentRules, setCurrentRules] = useState<RulesData | null>(null);
    const [processedData, setProcessedData] = useState<CharacterSheetData | null>(null);

    // Initial load with image injection
    useEffect(() => {
        const load = async () => {
            try {
                const parsed = typeof character.data === 'string'
                    ? JSON.parse(character.data)
                    : character.data;

                // Important: for Admin view, we need to inject images from compressed strings to local IDs
                const injected = await ImageSyncResolver.injectImagesAfterSync(parsed);
                setProcessedData(injected as CharacterSheetData);
            } catch (e) {
                logger.error("Failed to parse and inject character data", e);
                if (typeof character.data !== 'string') {
                    setProcessedData(character.data);
                }
            }
        };
        load();
    }, [character]);

    const handleImport = async () => {
        if (!processedData || !character.setting_id) return;

        try {
            const rules = await CampaignService.loadSetting(character.setting_id);
            if (!rules) {
                addLog("Impossible de récupérer les règles de la campagne.", "danger");
                return;
            }

            const { extractRulesFromCharacter } = await import('../utils/templateImporter');
            const { rules: extracted } = extractRulesFromCharacter(processedData, rules);

            setCandidateRules(extracted);
            setCurrentRules(rules);
            setIsWizardOpen(true);
        } catch (err) {
            addLog("Erreur lors de l'import : " + (err as Error).message, "danger");
        }
    };

    if (!processedData) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-stone-500 italic bg-stone-900 h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
                Exhumation des manuscrits...
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-stone-900 overflow-hidden shadow-2xl">
            <ReadOnlyHeader character={character} onClose={onClose} onImport={handleImport} />

            <div className="flex-grow overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-7xl mx-auto space-y-12 pb-20">
                    {/* Top Section: Portrait + Identity */}
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <ReadOnlyPortrait
                            imageId={processedData.page2?.characterImageId}
                            legacyImage={processedData.page2?.characterImage}
                        />
                        <div className="flex-grow space-y-8 w-full">
                            <ReadOnlyIdentity header={processedData.header} />
                            <ReadOnlySuggestions suggestions={processedData.suggestions} getCategoryLabel={getCategoryLabel} />
                        </div>
                    </div>

                    <ReadOnlyAttributes
                        attributeSettings={processedData.attributeSettings}
                        attributes={processedData.attributes}
                    />

                    <ReadOnlySkills
                        skills={processedData.skills}
                        specializations={processedData.specializations}
                        imposedSpecializations={processedData.imposedSpecializations}
                        getCategoryLabel={getCategoryLabel}
                    />

                    <ReadOnlyBackgrounds
                        skills={processedData.skills}
                        specializations={processedData.specializations}
                        imposedSpecializations={processedData.imposedSpecializations}
                    />

                    <ReadOnlyTraits
                        avantages={processedData.page2?.avantages}
                        desavantages={processedData.page2?.desavantages}
                    />

                    <ReadOnlyExperience
                        experience={processedData.experience}
                    />

                    <ReadOnlyInventory
                        inventory={processedData.page2?.equipement}
                    />

                    <div className="text-center pt-8 border-t border-stone-800 opacity-20">
                        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-[0.5em]">
                            Archives Scellées — Fin de la Chronique
                        </p>
                    </div>
                </div>
            </div>

            {isWizardOpen && candidateRules && currentRules && character.setting_id && (
                <ImportWizardModal
                    isOpen={isWizardOpen}
                    onClose={() => setIsWizardOpen(false)}
                    currentRules={currentRules}
                    candidateRules={candidateRules}
                    onConfirm={async (merged) => {
                        try {
                            await CampaignService.saveSetting(character.setting_id!, merged);
                            addLog("Bibliothèque de campagne mise à jour avec succès !", "success");
                            setIsWizardOpen(false);
                            onRefreshRules?.();
                        } catch (err) {
                            addLog("Échec de la mise à jour : " + (err as Error).message, "danger");
                        }
                    }}
                />
            )}
        </div>
    );
};

export default CharacterReadOnlyView;
