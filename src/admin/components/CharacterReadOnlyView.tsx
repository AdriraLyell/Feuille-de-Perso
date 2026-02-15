import React, { useState, useEffect } from 'react';
import { CampaignService } from '../../services/CampaignService';
import { CharacterSyncService, SyncedCharacter } from '../../services/CharacterSyncService';
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
import ThematicModal from '../../components/ui/ThematicModal';
import { RefreshCw } from 'lucide-react';
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
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

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

    const handleForceMJUpdate = async () => {
        setIsUpdateModalOpen(true);
        setUpdateMessage('');
    };

    const confirmForceMJUpdate = async () => {
        if (!character.id) return;
        setIsUpdating(true);
        try {
            const success = await CharacterSyncService.requestForceUpdate(character.id, updateMessage);
            if (success) {
                addLog("Signal de mise à jour envoyé au joueur.", "success");
                setIsUpdateModalOpen(false);
            } else {
                addLog("Échec de l'envoi du signal.", "danger");
            }
        } catch (err) {
            addLog("Erreur technique : " + (err as Error).message, "danger");
        } finally {
            setIsUpdating(false);
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
            <ReadOnlyHeader character={character} onClose={onClose} onImport={handleImport} onForceUpdate={handleForceMJUpdate} />

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

            <ThematicModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                title="Pousser Mise à Jour MJ"
                scheme="mystic"
                icon={<RefreshCw size={24} />}
                footer={
                    <div className="flex gap-3 w-full justify-end">
                        <button
                            onClick={() => setIsUpdateModalOpen(false)}
                            className="px-4 py-2 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-sm font-bold transition-all uppercase text-xs tracking-wider"
                        >
                            Abjurer
                        </button>
                        <button
                            onClick={confirmForceMJUpdate}
                            disabled={isUpdating}
                            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-sm font-bold transition-all shadow-lg active:scale-95 uppercase tracking-wider text-xs disabled:opacity-50"
                        >
                            {isUpdating ? "Incantation..." : "Envoyer le Signal"}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-stone-400 text-xs italic leading-relaxed">
                        Le voyageur <strong>{character.character_name}</strong> recevra votre message et une invitation à synchroniser ses archives lors de sa prochaine connexion.
                    </p>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/80 mb-2">
                            Message du Gardien (Optionnel)
                        </label>
                        <textarea
                            value={updateMessage}
                            onChange={(e) => setUpdateMessage(e.target.value)}
                            placeholder="Ex: J'ai rectifié tes points de santé..."
                            className="w-full h-32 bg-stone-900/50 border border-stone-800 rounded-sm p-3 text-sm text-stone-200 focus:border-amber-900/50 outline-none resize-none transition-all placeholder:text-stone-700"
                        />
                    </div>
                </div>
            </ThematicModal>
        </div>
    );
};

export default CharacterReadOnlyView;
