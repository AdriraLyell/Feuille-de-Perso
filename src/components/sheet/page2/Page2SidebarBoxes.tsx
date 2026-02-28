import React from 'react';
import { CharacterSheetData } from '../../../types';
import NotebookInput from '../../shared/NotebookInput';
import { Page2SectionHeader } from './Page2Components';
import { ReputationHeader, ReputationRow } from './ReputationComponents';

interface BoxProps {
    value: string;
    onChange: (v: string) => void;
    title: string;
}

const Box: React.FC<BoxProps> = ({ value, onChange, title }) => (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Page2SectionHeader title={title} />
        <div className="flex-grow relative min-h-0 overflow-hidden">
            <NotebookInput value={value} onChange={onChange} />
        </div>
    </div>
);

interface IdentityBoxesProps {
    data: CharacterSheetData;
    updateStringField: (field: keyof CharacterSheetData['page2'], value: string) => void;
}

export const IdentityBoxes: React.FC<IdentityBoxesProps> = ({ data, updateStringField }) => (
    <>
        <Box title="Lieux Importants" value={data.page2.lieux_importants} onChange={(v) => updateStringField('lieux_importants', v)} />
        <Box title="Contacts" value={data.page2.contacts} onChange={(v) => updateStringField('contacts', v)} />
    </>
);

interface NotesBoxesProps {
    data: CharacterSheetData;
    updateStringField: (field: keyof CharacterSheetData['page2'], value: string) => void;
    updateReputationEntry: (index: number, field: 'reputation' | 'lieu' | 'valeur', value: string) => void;
    handleReputationKeyDown: (e: React.KeyboardEvent, index: number, field: 'reputation' | 'lieu' | 'valeur') => void;
}

export const NotesBoxes: React.FC<NotesBoxesProps> = ({ data, updateStringField, updateReputationEntry, handleReputationKeyDown }) => (
    <>
        <Box title="Connaissances" value={data.page2.connaissances} onChange={(v) => updateStringField('connaissances', v)} />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ReputationHeader />
            <div className="flex-grow overflow-y-auto custom-scrollbar">
                {data.page2.reputation.map((rep, i) => (
                    <ReputationRow
                        key={i}
                        index={i}
                        reputation={rep.reputation}
                        lieu={rep.lieu}
                        valeur={rep.valeur}
                        onChange={updateReputationEntry}
                        onKeyDown={handleReputationKeyDown}
                    />
                ))}
            </div>
        </div>
    </>
);

export const MoneyBoxes: React.FC<IdentityBoxesProps> = ({ data, updateStringField }) => (
    <>
        <Box title="Valeurs Monétaires" value={data.page2.valeurs_monetaires} onChange={(v) => updateStringField('valeurs_monetaires', v)} />
        <Box title="Armes" value={data.page2.armes_list} onChange={(v) => updateStringField('armes_list', v)} />
    </>
);
