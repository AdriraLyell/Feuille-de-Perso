import React from 'react';
import { RulesData } from '../../types/rules';
import CreationGeneralSettings from './creation/CreationGeneralSettings';
import RankSlotsConfig from './creation/RankSlotsConfig';
import CreationPointsPreview from './creation/CreationPointsPreview';
import CardSystemConfig from './creation/CardSystemConfig';

interface AdminCreationEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminCreationEditor: React.FC<AdminCreationEditorProps> = ({ rules, onUpdate }) => {
    const config = rules.configurations.creation;
    const cardConfig = rules.configurations.cards;

    const updateCreationConfig = (field: string, value: any) => {
        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                creation: {
                    ...rules.configurations.creation,
                    [field]: value
                }
            }
        });
    };

    const updatePointsBuckets = (bucket: 'attributes' | 'skills' | 'backgrounds', value: number) => {
        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                creation: {
                    ...rules.configurations.creation,
                    pointsBuckets: {
                        ...(rules.configurations.creation.pointsBuckets || { attributes: 0, skills: 0, backgrounds: 0 }),
                        [bucket]: value
                    }
                }
            }
        });
    };

    const updateCardConfig = (field: string, value: any) => {
        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                cards: {
                    ...rules.configurations.cards,
                    [field]: value
                }
            }
        });
    };

    const updateRankSlot = (rank: number, value: number) => {
        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                creation: {
                    ...rules.configurations.creation,
                    rankSlots: {
                        ...rules.configurations.creation.rankSlots,
                        [rank]: value
                    }
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <CreationGeneralSettings
                    version={rules.version}
                    config={config}
                    onUpdateVersion={(v) => onUpdate({ ...rules, version: v })}
                    onUpdateConfig={updateCreationConfig}
                    onUpdatePointsBuckets={updatePointsBuckets}
                />

                <div className="flex flex-col gap-6">
                    {config.mode === 'rangs' && (
                        <RankSlotsConfig
                            rankSlots={config.rankSlots}
                            onUpdateRankSlot={updateRankSlot}
                        />
                    )}

                    {config.mode === 'points' && config.pointsDistributionMode === 'buckets' && (
                        <CreationPointsPreview
                            pointsBuckets={config.pointsBuckets || { attributes: 0, skills: 0, backgrounds: 0 }}
                        />
                    )}
                </div>
            </div>

            <hr className="border-slate-200 mx-10" />

            <CardSystemConfig
                config={cardConfig}
                onUpdateCardConfig={updateCardConfig}
            />
        </div>
    );
};

export default AdminCreationEditor;
