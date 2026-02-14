/**
 * Fixtures for testing migrations.ts
 * Contains sample data in various legacy formats to verify migration paths
 */

/**
 * V1 Legacy: Old terminology (vertus/defauts instead of avantages/desavantages)
 */
export const LEGACY_V1_TERMINOLOGY = {
    page2: {
        vertus: [{ name: 'Courage', value: '2' }],
        defauts: [{ name: 'Impulsif', value: '1' }],
        lieux_importants: '',
        contacts: '',
        reputation: [],
        connaissances: '',
        valeurs_monetaires: '',
        armes_list: '',
        equipement: '',
        notes: ''
    }
};

/**
 * V1 Legacy: String arrays for traits (before object structure)
 */
export const LEGACY_V1_STRING_TRAITS = {
    page2: {
        avantages: ['Courage', 'Force', 'Sagesse'],
        desavantages: ['Impulsif', 'Coléreux'],
        lieux_importants: '',
        contacts: '',
        reputation: [],
        connaissances: '',
        valeurs_monetaires: '',
        armes_list: '',
        equipement: '',
        notes: ''
    }
};

/**
 * V1 Legacy: Numeric attribute values (before string conversion)
 */
export const LEGACY_V1_NUMERIC_ATTRIBUTES = {
    attributes: {
        physique: [
            { name: 'Force', val1: 3, val2: 0, val3: 0, id: 'attr_1' },
            { name: 'Agilité', val1: 2, val2: 0, val3: 0, id: 'attr_2' }
        ],
        mental: [
            { name: 'Intelligence', val1: 1, val2: 0, val3: 0, id: 'attr_3' }
        ],
        social: [
            { name: 'Charisme', val1: -1, val2: 0, val3: 0, id: 'attr_4' }
        ]
    },
    page2: {
        avantages: [],
        desavantages: [],
        lieux_importants: '',
        contacts: '',
        reputation: [],
        connaissances: '',
        valeurs_monetaires: '',
        armes_list: '',
        equipement: '',
        notes: ''
    }
};

/**
 * V1 Legacy: Old counter structure (without id, current, creationValue)
 */
export const LEGACY_V1_COUNTERS = {
    counters: {
        volonte: { max: 5 },
        confiance: { max: 3 }
    },
    page2: {
        avantages: [],
        desavantages: [],
        lieux_importants: '',
        contacts: '',
        reputation: [],
        connaissances: '',
        valeurs_monetaires: '',
        armes_list: '',
        equipement: '',
        notes: ''
    }
};

/**
 * V1 Legacy: Named skill categories (talents, competences, etc.)
 */
export const LEGACY_V1_NAMED_SKILL_CATEGORIES = {
    skills: {
        talents: [{ name: 'Acrobatie', value: 2, id: 'skill_1' }],
        competences: [{ name: 'Escalade', value: 3, id: 'skill_2' }],
        connaissances: [{ name: 'Histoire', value: 1, id: 'skill_3' }],
        arrieres_plans: [{ name: 'Noble', value: 2, id: 'skill_4' }]
    },
    page2: {
        avantages: [],
        desavantages: [],
        lieux_importants: '',
        contacts: '',
        reputation: [],
        connaissances: '',
        valeurs_monetaires: '',
        armes_list: '',
        equipement: '',
        notes: ''
    }
};

/**
 * V1 Legacy: Named attribute categories (physique, mental, social)
 */
export const LEGACY_V1_NAMED_ATTRIBUTE_CATEGORIES = {
    attributes: {
        physique: [{ name: 'Force', val1: '2', val2: '', val3: '', id: 'a1' }],
        mental: [{ name: 'Intelligence', val1: '1', val2: '', val3: '', id: 'a2' }],
        social: [{ name: 'Charisme', val1: '0', val2: '', val3: '', id: 'a3' }]
    },
    page2: {
        avantages: [],
        desavantages: [],
        lieux_importants: '',
        contacts: '',
        reputation: [],
        connaissances: '',
        valeurs_monetaires: '',
        armes_list: '',
        equipement: '',
        notes: ''
    }
};

/**
 * V1 Legacy: Array-based notebook fields (before string conversion)
 */
export const LEGACY_V1_ARRAY_NOTEBOOK = {
    page2: {
        lieux_importants: ['Taverne du Dragon', 'Château de Fer', ''],
        contacts: ['Marchand Johan', '', 'Garde Pierre'],
        connaissances: ['Magie noire', 'Herboristerie'],
        valeurs_monetaires: ['10 pièces d\'or', '5 pièces d\'argent'],
        notes: ['Note 1', 'Note 2', ''],
        equipement: ['Épée', 'Bouclier'],
        armes_list: ['Épée longue', 'Arc'],
        avantages: [],
        desavantages: [],
        reputation: []
    }
};

/**
 * V1 Legacy: String-based imposed specializations (before object structure)
 */
export const LEGACY_V1_STRING_SPECIALIZATIONS = {
    imposedSpecializations: {
        'skill_1': ['Combat rapproché', 'Défense'],
        'skill_2': ['Escalade libre']
    },
    specializations: {
        'skill_1': ['Épée', 'Hache'],
        'skill_2': ['Rocher']
    },
    page2: {
        avantages: [],
        desavantages: [],
        lieux_importants: '',
        contacts: '',
        reputation: [],
        connaissances: '',
        valeurs_monetaires: '',
        armes_list: '',
        equipement: '',
        notes: ''
    }
};

/**
 * V1 Legacy: Old library type names (vertu/defaut instead of avantage/desavantage)
 */
export const LEGACY_V1_LIBRARY_TYPES = {
    library: [
        { id: '1', name: 'Force intérieure', type: 'vertu', description: 'Test' },
        { id: '2', name: 'Impulsivité', type: 'defaut', description: 'Test' }
    ],
    page2: {
        avantages: [],
        desavantages: [],
        lieux_importants: '',
        contacts: '',
        reputation: [],
        connaissances: '',
        valeurs_monetaires: '',
        armes_list: '',
        equipement: '',
        notes: ''
    }
};

/**
 * V1 Legacy: Campaign note with single image (before images array)
 */
export const LEGACY_V1_SINGLE_IMAGE_NOTE = {
    campaignNotes: [
        {
            id: 'note_1',
            title: 'Session 1',
            content: 'Contenu de la session',
            imageId: 'img_123',
            imageConfig: { width: 200, height: 200, marginTop: 0, align: 'right' }
        }
    ],
    page2: {
        avantages: [],
        desavantages: [],
        lieux_importants: '',
        contacts: '',
        reputation: [],
        connaissances: '',
        valeurs_monetaires: '',
        armes_list: '',
        equipement: '',
        notes: ''
    }
};

/**
 * V1 Legacy: Typo in skillLibrary key (skilllibrary instead of skillLibrary)
 */
export const LEGACY_V1_TYPO_SKILLLIBRARY = {
    skilllibrary: [
        { id: 's1', name: 'Acrobatie', defaultCategory: 'talents', description: '' }
    ],
    page2: {
        avantages: [],
        desavantages: [],
        lieux_importants: '',
        contacts: '',
        reputation: [],
        connaissances: '',
        valeurs_monetaires: '',
        armes_list: '',
        equipement: '',
        notes: ''
    }
};

/**
 * Complete minimal data that should pass through migration unchanged (mostly)
 */
export const MINIMAL_VALID_DATA = {
    header: { name: 'Test Character', player: 'Test Player' },
    attributes: {},
    skills: {},
    page2: {
        avantages: [],
        desavantages: [],
        lieux_importants: '',
        contacts: '',
        reputation: [],
        connaissances: '',
        valeurs_monetaires: '',
        armes_list: '',
        equipement: '',
        notes: ''
    }
};
