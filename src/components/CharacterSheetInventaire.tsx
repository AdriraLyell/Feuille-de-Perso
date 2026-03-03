import React from 'react';
import { useCharacter } from '../context/CharacterContext';
import { useCharacterSheetActions } from '../hooks/useCharacterSheetActions';
import { useRules } from '../context/RulesContext';
import { WeaponTable, ArmorTable } from './sheet/CombatSection';
import NotebookInput from './shared/NotebookInput';
import { Page2SectionHeader } from './sheet/page2/Page2Components';

interface Props {
    isLandscape?: boolean;
}

const CharacterSheetInventaire: React.FC<Props> = ({ isLandscape = false }) => {
    const { data, updateData: onChange, addLog: onAddLog, recordXPTransaction } = useCharacter();
    const { rules } = useRules();

    const {
        updateCombatWeapon,
        updateArmor
    } = useCharacterSheetActions(data, onChange, onAddLog, recordXPTransaction, rules);

    const updateStringField = (field: string, value: string) => {
        onChange({ ...data, page2: { ...data.page2, [field]: value } });
    };

    const Box: React.FC<{ title: string; value: string; field: string; className?: string }> = ({ title, value, field, className }) => (
        <div className={`flex flex-col min-h-0 overflow-hidden ${className}`}>
            <Page2SectionHeader title={title} />
            <div className="flex-grow relative min-h-0 overflow-hidden p-1.5">
                <NotebookInput value={value} onChange={(v: string) => updateStringField(field, v)} />
            </div>
        </div>
    );

    return (
        <div className={`sheet-container ${isLandscape ? 'landscape' : ''} flex flex-col gap-0`}>
            {/* Top Section: Weapons & Money */}
            <div className="grid grid-cols-12 border-b-2 border-stone-800">
                {/* Weapons (Combat) */}
                <div className="col-span-8 border-r-2 border-stone-800 bg-stone-50/30">
                    <WeaponTable weapons={data.combat.weapons} updateCombatWeapon={updateCombatWeapon} />
                </div>

                {/* Money */}
                <div className="col-span-4 flex flex-col bg-white">
                    <Box title="Valeurs Monétaires" value={data.page2.valeurs_monetaires} field="valeurs_monetaires" className="h-1/2 border-b border-stone-400" />
                    <Box title="Armes (Détails)" value={data.page2.armes_list} field="armes_list" className="h-1/2" />
                </div>
            </div>

            {/* Bottom Section: Armor & Equipment */}
            <div className="grid grid-cols-12 flex-grow">
                {/* Armor & Defense */}
                <div className="col-span-4 border-r-2 border-stone-800 bg-stone-100/50">
                    <ArmorTable armor={data.combat.armor} updateArmor={updateArmor} />
                </div>

                {/* Equipment */}
                <div className="col-span-8 bg-white flex flex-col">
                    <Page2SectionHeader title="Équipement" />
                    <div className="flex-grow p-1.5 min-h-[300px]">
                        <NotebookInput value={data.page2.equipement} onChange={(v: string) => updateStringField('equipement', v)} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterSheetInventaire;
