
import React from 'react';
import { CampaignService } from '../../services/CampaignService';
import { RulesData } from '../../types/rules';
import { Loader2 } from 'lucide-react';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import DuplicateSettingModal from './DuplicateSettingModal';
import { MotionFade } from '../../components/ui/motion/MotionFade';
import { ErrorService } from '../../services/ErrorService';
import { useDashboardActions } from '../hooks/useDashboardActions';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardCreateBanner } from './dashboard/DashboardCreateBanner';
import { CampaignCard } from './dashboard/CampaignCard';

interface AdminDashboardProps {
    onSelectSetting: (id: string, name: string, rules: RulesData) => void;
    onViewPlayers: () => void;
    onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectSetting, onViewPlayers, onLogout }) => {
    const {
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
        confirmDuplicate
    } = useDashboardActions();

    const handleSelect = async (id: string) => {
        try {
            const rules = await CampaignService.loadSetting(id);
            const settingName = settings.find(s => s.id === id)?.name || "Campagne";

            if (rules) {
                onSelectSetting(id, settingName, rules);
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'AdminDashboard.handleSelect',
                userMessage: 'Erreur lors du chargement de la campagne.'
            });
        }
    };

    const filteredSettings = settings.filter(s => showArchived || !s.is_archived);

    return (
        <div className="flex flex-col min-h-screen bg-stone-950 p-8 w-full transition-colors duration-500 relative overflow-hidden">
            {/* Background Texture Effect */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-20 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-stone-900 to-transparent pointer-events-none" />

            <div className="max-w-6xl mx-auto w-full relative z-10">
                <DashboardHeader
                    showArchived={showArchived}
                    setShowArchived={setShowArchived}
                    onViewPlayers={onViewPlayers}
                    onLogout={onLogout}
                />

                <MotionFade delay={0.2}>
                    <p className="text-stone-400 mb-8 italic font-serif text-lg tracking-wide border-l-2 border-amber-800/50 pl-4 max-w-2xl">
                        "Gérez vos chroniques, vos règles et le destin de vos investigateurs dans l'ombre."
                    </p>
                </MotionFade>

                <DashboardCreateBanner
                    newName={newName}
                    setNewName={setNewName}
                    handleCreate={handleCreate}
                    isCreating={isCreating}
                />

                {/* List */}
                {
                    isLoading && settings.length === 0 ? (
                        <div className="flex justify-center py-32">
                            <Loader2 size={64} className="animate-spin text-amber-900/40" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredSettings.length === 0 && !isLoading && (
                                <MotionFade className="col-span-full text-center py-20 text-stone-600 italic font-serif text-xl border-2 border-dashed border-stone-800/50 rounded-xl bg-stone-900/20 backdrop-blur-sm">
                                    Le vide s'étend devant vous... <br /> Commencez par inscrire une nouvelle légende.
                                </MotionFade>
                            )}

                            {filteredSettings.map((setting, index) => (
                                <CampaignCard
                                    key={setting.id}
                                    setting={setting}
                                    index={index}
                                    onSelect={handleSelect}
                                    onToggleVisibility={handleToggleVisibility}
                                    onToggleArchive={handleToggleArchive}
                                    onDuplicate={(id, name) => setSettingToDuplicate({ id, name })}
                                    onDelete={(id) => setSettingToDelete(id)}
                                />
                            ))}
                        </div>
                    )
                }

                <ConfirmationModal
                    isOpen={!!settingToDelete}
                    onClose={() => setSettingToDelete(null)}
                    onConfirm={handleDelete}
                    title="Dissoudre la Chronique ?"
                    message="Attention : Cette action est irréversible. L'histoire, les règles et les destins liés à cette chronique seront perdus à jamais dans le néant."
                    confirmLabel="Dissoudre"
                    type="danger"
                    scheme="mystic"
                />

                <DuplicateSettingModal
                    isOpen={!!settingToDuplicate}
                    onClose={() => setSettingToDuplicate(null)}
                    oldName={settingToDuplicate?.name || ''}
                    onConfirm={confirmDuplicate}
                />
            </div>
        </div>
    );
};

export default AdminDashboard;
