import React from 'react';
import { Sliders, Settings } from 'lucide-react';
import { RulesData } from '../../types/rules';
import CreationGeneralSettings from './creation/CreationGeneralSettings';
import RankSlotsConfig from './creation/RankSlotsConfig';
import CreationPointsPreview from './creation/CreationPointsPreview';
import CardSystemConfig from './creation/CardSystemConfig';
import CampaignMetadataSettings from './creation/CampaignMetadataSettings';
import { MotionFade } from '../../components/ui/motion/MotionFade';
import { useCreationEditorActions } from '../hooks/useCreationEditorActions';
import { ConfigQuickSummary } from './creation/ConfigQuickSummary';
import CreationMysticSettings from './creation/CreationMysticSettings';
import { XPCostConfig } from './creation/XPCostConfig';
import { RankExtensionConfig } from './creation/RankExtensionConfig';

interface AdminCreationEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminCreationEditor: React.FC<AdminCreationEditorProps> = ({ rules, onUpdate }) => {
    const config = rules.configurations.creation;
    const cardConfig = rules.configurations.cards;

    const [activeTab, setActiveTab] = React.useState<'creation' | 'settings'>('creation');

    const {
        updateCreationConfig,
        updatePointsBuckets,
        updateCardConfig,
        updateXPCost,
        updateRankSlot,
        updateRootField,
        updateMysticConfig,
        syncMysticTraits
    } = useCreationEditorActions(rules, onUpdate);

    const tabs = [
        { id: 'creation', label: 'Création', icon: <Sliders size={16} /> },
        { id: 'settings', label: 'Paramètres', icon: <Settings size={16} /> }
    ] as const;

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            <div className="space-y-6">
                {/* Main Header / Global Config - Banner Mode */}
                <ConfigQuickSummary
                    version={rules.version}
                    onUpdateVersion={(v) => onUpdate({ ...rules, version: v })}
                    config={config}
                    xpCosts={rules.configurations.xpCosts}
                    updateCreationConfig={updateCreationConfig}
                    updateXPCost={updateXPCost}
                />

                {/* SEO/Metadata Section - Full Width */}
                <MotionFade delay={0.1}>
                    <CampaignMetadataSettings
                        description={rules.description}
                        welcomeMessage={rules.welcomeMessage}
                        showMetadataToPlayers={!!rules.showMetadataToPlayers}
                        onUpdate={updateRootField}
                    />
                </MotionFade>
            </div>

            {/* Sub-Tabs Navigation */}
            <div className="flex justify-center border-b border-stone-800 pb-px">
                <div className="flex gap-1 bg-stone-900/40 p-1 rounded-t-lg border-x border-t border-stone-800">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-8 py-3 rounded-md text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab.id
                                ? 'bg-amber-600 text-stone-950 shadow-glow-gold'
                                : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            <div>
                {activeTab === 'creation' && (
                    <MotionFade key="creation-tab" className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3">
                            <CreationGeneralSettings
                                config={config}
                                onUpdateConfig={updateCreationConfig}
                                onUpdatePointsBuckets={updatePointsBuckets}
                            />
                        </div>

                        <div className="lg:col-span-2 space-y-8">
                            {config.mode === 'rangs' && (
                                <MotionFade key="rank-slots" delay={0.1}>
                                    <RankSlotsConfig
                                        rankSlots={config.rankSlots}
                                        onUpdateRankSlot={updateRankSlot}
                                    />
                                </MotionFade>
                            )}

                            {config.mode === 'points' && config.pointsDistributionMode === 'buckets' && (
                                <MotionFade key="points-preview" delay={0.1}>
                                    <CreationPointsPreview
                                        pointsBuckets={config.pointsBuckets || { attributes: 0, skills: 0, backgrounds: 0 }}
                                    />
                                </MotionFade>
                            )}
                        </div>
                    </MotionFade>
                )}

                {activeTab === 'settings' && (
                    <MotionFade key="settings-tab" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 gap-8">
                                <RankExtensionConfig
                                    extendedSkills={!!config.extendedSkills}
                                    onUpdate={(v) => updateCreationConfig('extendedSkills', v)}
                                />
                                <CardSystemConfig
                                    config={cardConfig}
                                    onUpdateCardConfig={updateCardConfig}
                                />
                            </div>
                            <XPCostConfig
                                backgroundCost={config.backgroundCost ?? 2}
                                xpCosts={rules.configurations.xpCosts}
                                onUpdateBackgroundCost={(v) => updateCreationConfig('backgroundCost', v)}
                                onUpdateXPCost={updateXPCost}
                            />
                        </div>

                        <div className="h-full">
                            <CreationMysticSettings
                                config={config.mysticAbilities}
                                skillCategories={rules.definitions.skillCategories}
                                onUpdate={updateMysticConfig}
                                onSync={syncMysticTraits}
                            />
                        </div>
                    </MotionFade>
                )}
            </div>
        </div>
    );
};

export default AdminCreationEditor;
