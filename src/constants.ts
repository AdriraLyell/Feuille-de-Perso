
export const APP_VERSION = '2.49.0';

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
