
export const APP_VERSION = '2.93.1';

export const REPO_OWNER = 'AdriraLyell';
export const REPO_NAME = 'Feuille-de-Perso';
export const RAW_RULES_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/public/data/rules.json`;

export const REMOTE_MANIFEST_URL = "https://adriralyell.github.io/Feuille-de-Perso/version.json";

/**
 * Skill column mapping keys.
 * Used for consistency between rules and sheet layout.
 */
export const SKILL_COLUMNS = {
    COL_1: 'Col_Comp_1', COL_2: 'Col_Comp_2', COL_3: 'Col_Comp_3',
    COL_4: 'Col_Comp_4', COL_5: 'Col_Comp_5', COL_6: 'Col_Comp_6',
    COL_7: 'Col_Comp_7', COL_8: 'Col_Comp_8', COL_9: 'Col_Comp_9',
    COL_10: 'Col_Comp_10',
} as const;

/**
 * Help data for skill categories.
 * Centralized from legacy src/data/constants.ts
 */
export const CATEGORY_HELP = [
    { code: SKILL_COLUMNS.COL_1, label: "Talents", loc: "Colonne Gauche (Haut)" },
    { code: SKILL_COLUMNS.COL_2, label: "Compétences", loc: "Colonne Centrale (Haut 1)" },
    { code: SKILL_COLUMNS.COL_3, label: "Compétences (Suite)", loc: "Colonne Centrale (Haut 2)" },
    { code: SKILL_COLUMNS.COL_4, label: "Connaissances", loc: "Colonne Droite (Haut)" },
    { code: SKILL_COLUMNS.COL_5, label: "Autres Compétences", loc: "Colonne Centrale (Bas)" },
    { code: SKILL_COLUMNS.COL_6, label: "Secondaire", loc: "Petit bloc (Bas)" },
    { code: SKILL_COLUMNS.COL_7, label: "Autres", loc: "Colonne Droite (Bas)" },
    { code: SKILL_COLUMNS.COL_8, label: "Arrière-plans", loc: "Section Historique" }
];

/**
 * Default column for background skills if not specified.
 */
export const DEFAULT_BACKGROUND_COLUMN = SKILL_COLUMNS.COL_8;

/**
 * Standard attribute categories for character sheets.
 */
export const DEFAULT_ATTRIBUTE_CATEGORIES = [
    { id: 'pave_attributs_1', label: 'Physique' },
    { id: 'pave_attributs_2', label: 'Mental' },
    { id: 'pave_attributs_3', label: 'Social' },
] as const;
