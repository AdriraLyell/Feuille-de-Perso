/**
 * Constantes pour le rendu du Journal de Campagne.
 * Centralise les dimensions et les propriétés visuelles pour éviter la duplication.
 */

export const JOURNAL_LINE_HEIGHT = 28;

// Dimensions en pixels pour le rendu "Livre"
// Format A5 Portrait (Agrandi pour lisibilité, Ratio 1.414)
// Grid: 35 lignes (980px) + 2x2 lignes padding (112px) = 1092px
export const JOURNAL_PAGE_WIDTH_LANDSCAPE = 772;
export const JOURNAL_PAGE_HEIGHT_LANDSCAPE = 1200;

// Format A4 Portrait (Agrandi, Ratio 1.414)
export const JOURNAL_PAGE_WIDTH_PORTRAIT = 772;
export const JOURNAL_PAGE_HEIGHT_PORTRAIT = 1200;

// Dimensions de contenu
// Alignement vertical sur la grille (Line Height = 28px)
// Top/Bottom Padding = 2 * LINE_HEIGHT = 56px
export const JOURNAL_CONTENT_PADDING_X = 25;
export const JOURNAL_CONTENT_PADDING_Y = 56;

// ===== Digital Book (Tiptap) =====
// Total page dimensions (including padding) - used for react-pageflip and CSS
export const PAGE_WIDTH = 722;
export const PAGE_HEIGHT = 1000;
// Padding in pixels (must match BookStyles.css --book-page-padding)
export const PAGE_PADDING_X = 80;  // 5rem ≈ 80px
export const PAGE_PADDING_Y = 60;  // 3.75rem ≈ 60px
// Usable content area (total - padding*2) - used for BookPageSplitter measurements
// NOTE: PAGE_CONTENT_WIDTH est basé sur PAGE_PADDING_X (80px) → mode "Book" statique.
// Le ColumnarEditor utilise padding: 0 60px en CSS, ce qui donne 722 - 120 = 602px de contenu.
// Pour les calculs de resize d'image, mesurer via getComputedStyle au runtime.
export const PAGE_CONTENT_WIDTH = PAGE_WIDTH - PAGE_PADDING_X * 2;   // 562px (Book mode)
export const PAGE_CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING_Y * 2; // 880px
export const CHAPTER_HEADER_HEIGHT = 62;
