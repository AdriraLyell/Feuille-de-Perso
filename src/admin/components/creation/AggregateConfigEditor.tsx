import React from 'react';
import { LibraryFormulaEntry } from '../../../types';

interface AggregateConfigEditorProps {
    aggregateConfig: LibraryFormulaEntry['aggregateConfig'];
    onUpdate: (field: 'aggregateConfig', value: LibraryFormulaEntry['aggregateConfig']) => void;
}

export const AggregateConfigEditor: React.FC<AggregateConfigEditorProps> = ({
    aggregateConfig,
    onUpdate
}) => {
    if (!aggregateConfig) return null;

    return (
        <div className="mt-4 p-3 bg-stone-950 border border-blue-500/20 rounded grid grid-cols-2 gap-4 animate-in zoom-in-95">
            <div>
                <label 
                    htmlFor="agg-operation"
                    className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1"
                >
                    Opération
                </label>
                <select
                    id="agg-operation"
                    value={aggregateConfig.operation}
                    onChange={e => onUpdate('aggregateConfig', { ...aggregateConfig, operation: e.target.value as "count" | "sum" | "avg" | "max" })}
                    className="w-full bg-stone-900 border border-stone-700 text-stone-300 text-xs p-2 rounded outline-none focus:border-blue-500"
                >
                    <option value="sum">Somme (Total des points)</option>
                    <option value="count">Nombre (Total d'éléments)</option>
                    <option value="max">Maximum (Plus haut score)</option>
                    <option value="avg">Moyenne</option>
                </select>
            </div>
            <div>
                <label 
                    htmlFor="agg-target-type"
                    className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1"
                >
                    Groupe Cible
                </label>
                <select
                    id="agg-target-type"
                    value={aggregateConfig.targetType}
                    onChange={e => onUpdate('aggregateConfig', { ...aggregateConfig, targetType: e.target.value as "attributes" | "skills" | "traits" })}
                    className="w-full bg-stone-900 border border-stone-700 text-stone-300 text-xs p-2 rounded outline-none focus:border-blue-500"
                >
                    <option value="skills">Compétences</option>
                    <option value="attributes">Attributs</option>
                    <option value="traits">Traits (Avantages/Désav.)</option>
                </select>
            </div>
            <div>
                <label 
                    htmlFor="agg-filter-target"
                    className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1"
                >
                    Filtrer par
                </label>
                <select
                    id="agg-filter-target"
                    value={aggregateConfig.filterTarget}
                    onChange={e => onUpdate('aggregateConfig', { ...aggregateConfig, filterTarget: e.target.value as "name" | "tag" | "category" })}
                    className="w-full bg-stone-900 border border-stone-700 text-stone-300 text-xs p-2 rounded outline-none focus:border-blue-500"
                >
                    <option value="tag">Tag (ex: Mystique)</option>
                    <option value="category">Catégorie / Colonne</option>
                    <option value="name">Nom Contient</option>
                </select>
            </div>
            <div>
                <label 
                    htmlFor="agg-filter-value"
                    className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1"
                >
                    Mot-clé du filtre
                </label>
                <input
                    id="agg-filter-value"
                    type="text"
                    value={aggregateConfig.filterValue}
                    onChange={e => onUpdate('aggregateConfig', { ...aggregateConfig, filterValue: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 text-stone-300 text-xs p-2 rounded outline-none focus:border-blue-500"
                    placeholder="ex: Mystique"
                />
            </div>
        </div>
    );
};
