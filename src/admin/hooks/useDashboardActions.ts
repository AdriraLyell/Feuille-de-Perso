import { useState, useEffect } from 'react';
import { GameSettingSummary, CampaignService } from '../../services/CampaignService';
import { RulesData } from '../../types/rules';
import { defaultRules } from '../../data/defaultRules';
import { INITIAL_DATA, INITIAL_SKILLS } from '../../data/initialState';
import { ErrorService } from '../../services/ErrorService';

export function useDashboardActions() {
    const [settings, setSettings] = useState<GameSettingSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [settingToDelete, setSettingToDelete] = useState<string | null>(null);
    const [settingToDuplicate, setSettingToDuplicate] = useState<{ id: string, name: string } | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const data = await CampaignService.listSettings();
            if (data) setSettings(data);
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'AdminDashboard.loadSettings',
                userMessage: 'Impossible de charger les campagnes.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setIsCreating(true);
        try {
            const layoutDefinitions: Record<string, string[]> = {};
            const labels: Record<string, string> = {
                talents: "Talents",
                competences: "Compétences",
                competences_col_2: "Mentales / Autres",
                connaissances: "Connaissances",
                autres_competences: "Libres",
                competences2: "Physique",
                autres: "Autres",
                arrieres_plans: "Arrière-Plans",
                counters: "Compteurs"
            };

            Object.keys(INITIAL_SKILLS).forEach(key => {
                layoutDefinitions[key] = INITIAL_SKILLS[key].map((s) => s.name || "");
            });

            const template: Partial<RulesData> = {
                version: '1.0.0',
                configurations: { ...defaultRules.configurations },
                definitions: {
                    ...defaultRules.definitions,
                    skills: layoutDefinitions,
                    labels: { ...defaultRules.definitions.labels, ...labels }
                },
                libraries: {
                    ...defaultRules.libraries,
                    skills: INITIAL_DATA.skillLibrary
                }
            };

            const newId = await CampaignService.createSetting(newName, template);
            if (newId) {
                setNewName('');
                await loadSettings();
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'AdminDashboard.handleCreate',
                userMessage: 'Erreur lors de la création de la campagne.'
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async () => {
        if (!settingToDelete) return;
        setIsLoading(true);
        try {
            const success = await CampaignService.deleteSetting(settingToDelete);
            if (success) {
                await loadSettings();
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'AdminDashboard.handleDelete',
                userMessage: 'Erreur lors de la suppression de la campagne.'
            });
        } finally {
            setIsLoading(false);
            setSettingToDelete(null);
        }
    };

    const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
        try {
            const success = await CampaignService.togglePublic(id, !currentStatus);
            if (success) {
                await loadSettings();
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'AdminDashboard.handleToggleVisibility',
                userMessage: 'Impossible de modifier la visibilité.'
            });
        }
    };

    const handleToggleArchive = async (id: string, currentStatus: boolean) => {
        try {
            const success = await CampaignService.setArchived(id, !currentStatus);
            if (success) {
                await loadSettings();
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'AdminDashboard.handleToggleArchive',
                userMessage: "Erreur lors de la modification de l'état d'archivage."
            });
        }
    };

    const confirmDuplicate = async (newName: string) => {
        if (!settingToDuplicate) return;
        const { id } = settingToDuplicate;

        setIsLoading(true);
        try {
            const newId = await CampaignService.duplicateSetting(id, newName);
            if (newId) {
                await loadSettings();
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'AdminDashboard.confirmDuplicate',
                userMessage: 'Erreur lors de la duplication de la campagne.'
            });
        } finally {
            setIsLoading(false);
            setSettingToDuplicate(null);
        }
    };

    return {
        settings,
        isLoading,
        isCreating,
        newName,
        setNewName,
        settingToDelete,
        setSettingToDelete,
        settingToDuplicate,
        setSettingToDuplicate,
        showArchived,
        setShowArchived,
        handleCreate,
        handleDelete,
        handleToggleVisibility,
        handleToggleArchive,
        confirmDuplicate,
        refresh: loadSettings
    };
}
