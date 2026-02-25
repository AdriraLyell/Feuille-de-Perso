import React from 'react';
import { TraitEntry } from '../../../types';
import TraitRow from './TraitRow';
import { Page2SectionHeader } from './Page2Components';

interface TraitsColumnProps {
    title: string;
    traits: TraitEntry[];
    type: 'avantages' | 'desavantages';
    total: number;
    totalColor: string;
    onOpenLibrary: () => void;
    onTraitClick: (index: number, trait: TraitEntry) => void;
    onRemove: (index: number) => void;
    onManageMystic?: (index: number, trait: TraitEntry) => void;
    className?: string;
}

export const TraitsColumn: React.FC<TraitsColumnProps> = ({
    title,
    traits,
    type,
    total,
    totalColor,
    onOpenLibrary,
    onTraitClick,
    onRemove,
    onManageMystic,
    className = ""
}) => (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
        <Page2SectionHeader
            title={title}
            total={total}
            onOpenLibrary={onOpenLibrary}
            totalColor={totalColor}
        />
        <div className="space-y-0.5 flex-grow overflow-auto min-h-0 custom-scrollbar">
            {traits.map((item, i) => (
                <TraitRow
                    key={i}
                    item={item}
                    type={type}
                    onClick={() => onTraitClick(i, item)}
                    onRemove={(e) => {
                        e.stopPropagation();
                        onRemove(i);
                    }}
                    onManageMystic={(e) => {
                        if (!onManageMystic) return;
                        e.stopPropagation();
                        onManageMystic(i, item);
                    }}
                />
            ))}
        </div>
    </div>
);
