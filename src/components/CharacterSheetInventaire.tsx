import React from 'react';
import { useCharacter } from '../context/CharacterContext';
import { useCharacterSheetActions } from '../hooks/useCharacterSheetActions';
import { useRules } from '../context/RulesContext';
import { WeaponTable, ArmorTable } from './sheet/CombatSection';
import NotebookInput from './shared/NotebookInput';
import { Page2SectionHeader } from './sheet/page2/Page2Components';
import { ArmorEntry, CombatEntry } from '../types';

interface Props {
    isLandscape?: boolean;
}

const WeaponTableWithFixedLines: React.FC<{
    weapons: CombatEntry[];
    updateCombatWeapon: (id: string, field: keyof CombatEntry, value: string) => void;
}> = ({ weapons, updateCombatWeapon }) => {
    // Force precisely 6 lines
    const displayWeapons = [...(weapons || [])];
    while (displayWeapons.length < 6) {
        displayWeapons.push({ id: `placeholder-weapon-${displayWeapons.length}`, weapon: '', level: '', init: '', attack: '', damage: '', parry: '' });
    }
    const finalWeapons = displayWeapons.slice(0, 6);

    return <WeaponTable weapons={finalWeapons} updateCombatWeapon={updateCombatWeapon} />;
};

const ArmorTableWithFixedLines: React.FC<{
    armor: ArmorEntry[];
    updateArmor: (index: number, field: keyof ArmorEntry, value: string) => void;
}> = ({ armor, updateArmor }) => {
    // Force precisely 4 lines
    const displayArmor = [...(armor || [])];
    while (displayArmor.length < 4) {
        displayArmor.push({ type: '', protection: '', weight: '' });
    }
    const finalArmor = displayArmor.slice(0, 4);

    return <ArmorTable armor={finalArmor} updateArmor={updateArmor} />;
};

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
            {/* Top Container: Combines Left (Weapons+Armor) and Right (Money) to sync heights */}
            <div className="grid grid-cols-12 shrink-0">
                {/* Left Side: Weapons & Armor */}
                <div className="col-span-8 border-r-2 border-stone-800 flex flex-col">
                    {/* Weapons */}
                    <div className="bg-stone-50/30 border-b-2 border-stone-800">
                        <WeaponTableWithFixedLines weapons={data.combat.weapons} updateCombatWeapon={updateCombatWeapon} />
                    </div>

                    {/* Armor */}
                    <div className="bg-stone-100/50 border-b-2 border-stone-800">
                        <ArmorTableWithFixedLines armor={data.combat.armor} updateArmor={updateArmor} />
                    </div>
                </div>

                {/* Right Side: Money (height will naturally match Left Side) */}
                <div className="col-span-4 flex flex-col bg-white">
                    <Box
                        title="Valeurs Monétaires"
                        value={data.page2.valeurs_monetaires}
                        field="valeurs_monetaires"
                        className="flex-grow border-b-2 border-stone-800"
                    />
                </div>
            </div>

            {/* Bottom Container: Equipment & Weapon Details */}
            <div className="grid grid-cols-12 flex-grow">
                {/* Left: Equipment */}
                <div className="col-span-8 border-r-2 border-stone-800 bg-white flex flex-col">
                    <Page2SectionHeader title="Équipement" />
                    <div className="flex-grow p-1.5 min-h-[300px]">
                        <NotebookInput value={data.page2.equipement} onChange={(v: string) => updateStringField('equipement', v)} />
                    </div>
                </div>

                {/* Right: Weapon Details */}
                <div className="col-span-4 bg-white flex flex-col">
                    <Box
                        title="Armes (Détails)"
                        value={data.page2.armes_list}
                        field="armes_list"
                        className="flex-grow"
                    />
                </div>
            </div>
        </div>
    );
};

export default CharacterSheetInventaire;
