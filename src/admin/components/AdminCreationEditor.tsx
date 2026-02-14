import React from 'react';
import { RulesData } from '../../types/rules';
import CreationGeneralSettings from './creation/CreationGeneralSettings';
import RankSlotsConfig from './creation/RankSlotsConfig';
import CreationPointsPreview from './creation/CreationPointsPreview';
import CardSystemConfig from './creation/CardSystemConfig';
import CampaignMetadataSettings from './creation/CampaignMetadataSettings';
import { MotionFade } from '../../components/ui/motion/MotionFade';
import { useCreationEditorActions } from '../hooks/useCreationEditorActions';
import { ConfigQuickSummary } from './creation/ConfigQuickSummary';

interface AdminCreationEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminCreationEditor: React.FC<AdminCreationEditorProps> = ({ rules, onUpdate }) => {
    const config = rules.configurations.creation;
    const cardConfig = rules.configurations.cards;

    const {
        updateCreationConfig,
        updatePointsBuckets,
        updateCardConfig,
        updateXPCost,
        updateRankSlot,
        updateRootField
    } = useCreationEditorActions(rules, onUpdate);

    return (
        <div className="space-y-12 max-w-6xl mx-auto pb-12">
            {/* SEO/Metadata Section */}
            <MotionFade delay={0.1}>
                <CampaignMetadataSettings
                    description={rules.description}
                    welcomeMessage={rules.welcomeMessage}
                    showMetadataToPlayers={!!rules.showMetadataToPlayers}
                    onUpdate={updateRootField}
                />
            </MotionFade>

            {/* Main Header / Global Config */}
            <ConfigQuickSummary
                version={rules.version}
                onUpdateVersion={(v) => onUpdate({ ...rules, version: v })}
                config={config}
                xpCosts={rules.configurations.xpCosts}
                updateCreationConfig={updateCreationConfig}
                updateXPCost={updateXPCost}
            />

            {/* Detailed Configuration Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    <MotionFade delay={0.35}>
                        <CreationGeneralSettings
                            config={config}
                            onUpdateConfig={updateCreationConfig}
                            onUpdatePointsBuckets={updatePointsBuckets}
                        />
                    </MotionFade>

                    <MotionFade delay={0.45}>
                        <CardSystemConfig
                            config={cardConfig}
                            onUpdateCardConfig={updateCardConfig}
                        />
                    </MotionFade>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    {config.mode === 'rangs' && (
                        <MotionFade key="rank-slots" delay={0.4}>
                            <RankSlotsConfig
                                rankSlots={config.rankSlots}
                                onUpdateRankSlot={updateRankSlot}
                            />
                        </MotionFade>
                    )}

                    {config.mode === 'points' && config.pointsDistributionMode === 'buckets' && (
                        <MotionFade key="points-preview" delay={0.4}>
                            <CreationPointsPreview
                                pointsBuckets={config.pointsBuckets || { attributes: 0, skills: 0, backgrounds: 0 }}
                            />
                        </MotionFade>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCreationEditor;
