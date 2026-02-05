import { AttributePreset } from '../../types/system';

export const DEFAULT_ATTRIBUTES: Record<string, string[]> = {
    'pave_attributs_1': ['Force', 'Constitution', 'Agilité', 'Dextérité', 'Perception'],
    'pave_attributs_2': ['Volonté', 'Stabilité', 'Astuce/Subtilité', 'Intellect', 'Intuition'],
    'pave_attributs_3': ['Charisme', 'Calme', 'Mimétisme', 'Communication', 'Empathie'],
    'pave_attributs_4': ['Puissance', 'Résistance', 'Souplesse', 'Précision', 'Sensibilité']
};

export const DEFAULT_SECONDARY_ATTRIBUTES: Record<string, string[]> = {
    'pave_attributs_1': ['Corpulence', 'Beauté'],
    'pave_attributs_2': ['Conscience', 'Attraction'],
    'pave_attributs_3': ['Présence', 'Charme'],
    'pave_attributs_4': ['Aura', 'Fascination']
};

export const ATTRIBUTE_PRESETS: AttributePreset[] = [
    {
        id: "preset_v2",
        name: "v2 (Classique)",
        description: "3 Pavés de 4 Attributs",
        hasSecondary: false,
        isOfficial: true,
        structure: [
            { id: 'pave_attributs_1', label: 'Physique', attrs: ['Force', 'Constitution', 'Dextérité', 'Agilité'], secondaryAttrs: ['Corpulence', 'Beauté'] },
            { id: 'pave_attributs_2', label: 'Mental', attrs: ['Intellect', 'Volonté', 'Intuition', 'Perception'], secondaryAttrs: ['Conscience', 'Attraction'] },
            { id: 'pave_attributs_3', label: 'Social', attrs: ['Charisme', 'Empathie', 'Apparence', 'Communication'], secondaryAttrs: ['Présence', 'Charme'] }
        ]
    },
    {
        id: "preset_v4",
        name: "v4 (Complet)",
        description: "4 Pavés de 5 Attributs",
        hasSecondary: true,
        isOfficial: true,
        structure: [
            { id: 'pave_attributs_1', label: 'Physique', attrs: ['Force', 'Constitution', 'Agilité', 'Dextérité', 'Perception'], secondaryAttrs: ['Corpulence', 'Beauté'] },
            { id: 'pave_attributs_2', label: 'Mental', attrs: ['Volonté', 'Stabilité', 'Astuce/Subtilité', 'Intellect', 'Intuition'], secondaryAttrs: ['Conscience', 'Attraction'] },
            { id: 'pave_attributs_3', label: 'Social', attrs: ['Charisme', 'Calme', 'Mimétisme', 'Communication', 'Empathie'], secondaryAttrs: ['Présence', 'Charme'] },
            { id: 'pave_attributs_4', label: 'Mystique', attrs: ['Puissance', 'Résistance', 'Souplesse', 'Précision', 'Sensibilité'], secondaryAttrs: ['Aura', 'Fascination'] }
        ]
    }
];

export const getDefaultSecondaryAttrs = (label: string, id: string): string[] => {
    const l = label.toLowerCase();
    const i = id.toLowerCase();

    // Check by ID first (pave_attributs_1, etc)
    if (DEFAULT_SECONDARY_ATTRIBUTES[i]) return [...DEFAULT_SECONDARY_ATTRIBUTES[i]];

    // Check by Label
    if (l.includes('physique')) return [...DEFAULT_SECONDARY_ATTRIBUTES['pave_attributs_1']];
    if (l.includes('mental')) return [...DEFAULT_SECONDARY_ATTRIBUTES['pave_attributs_2']];
    if (l.includes('social')) return [...DEFAULT_SECONDARY_ATTRIBUTES['pave_attributs_3']];
    if (l.includes('mystique')) return [...DEFAULT_SECONDARY_ATTRIBUTES['pave_attributs_4']];

    return ["Secondaire 1", "Secondaire 2"];
};
