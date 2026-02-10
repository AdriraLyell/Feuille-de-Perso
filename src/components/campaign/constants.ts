/**
 * Constantes pour le rendu du Journal de Campagne.
 * Centralise les dimensions et les propriétés visuelles pour éviter la duplication.
 */

export const JOURNAL_LINE_HEIGHT = 28;

// Dimensions en pixels pour le rendu "Livre"
// Format A5 Portrait (Agrandi pour lisibilité, Ratio 1.414)
// Grid: 35 lignes (980px) + 2x2 lignes padding (112px) = 1092px
export const JOURNAL_PAGE_WIDTH_LANDSCAPE = 772;
export const JOURNAL_PAGE_HEIGHT_LANDSCAPE = 1092;

// Format A4 Portrait (Agrandi, Ratio 1.414)
export const JOURNAL_PAGE_WIDTH_PORTRAIT = 772;
export const JOURNAL_PAGE_HEIGHT_PORTRAIT = 1092;

// Dimensions de contenu
// Alignement vertical sur la grille (Line Height = 28px)
// Top/Bottom Padding = 2 * LINE_HEIGHT = 56px
export const JOURNAL_CONTENT_PADDING_X = 25;
export const JOURNAL_CONTENT_PADDING_Y = 56;
