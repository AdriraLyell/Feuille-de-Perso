# Audit : Problèmes du Moteur de Pagination

**Date** : 2026-02-13  
**Statut** : RESOLVED - Columnar engine implemented

---

## 🔴 Problèmes Identifiés

### 1. Configuration Incomplète de PaginationPlus
- Notre `BookPaginationAdapter.getConfig()` manque les marges de contenu
- `contentMarginTop`, `contentMarginBottom` non définis
- Sans ces valeurs, l'extension ne peut pas calculer l'espace de rendu
- Résultat: Boucle de re-calcul infinie

### 2. CSS Non-Synchronisé avec PaginationPlus
- Notre CSS cible `.tiptap-page` (classe custom)
- PaginationPlus génère ses propres wrappers de page
- Les pages ne s'affichent pas → l'extension pense qu'il n'y a rien → re-calcule → boucle

### 3. Conflit NodeView React + Mesure DOM
- `ChapterHeaderView` et `BookImageView` sont des NodeViews React
- PaginationPlus mesure le DOM pour paginer
- Les NodeViews peuvent ne pas être montés au moment de la mesure
- Résultat: Dimensions = 0 → re-calcul

### 4. Absence de Throttle sur le Re-calcul
- Chaque caractère tapé → `onUpdate` → re-pagination
- Pas de debounce/throttle sur le calcul de pagination
- CPU saturé

---

## ✅ Solution Proposée

### Option A: Réparer PaginationPlus (RISQUÉ)
1. Compléter la config avec toutes les marges
2. Adapter le CSS pour les classes générées par l'extension
3. Ajouter un throttle sur la pagination
4. Tester si compatible avec NodeViews React

**Risque** : L'extension peut avoir d'autres incompatibilités cachées

### Option B: Désactiver Temporairement (SAFE)
1. Retourner à un document continu sans pagination automatique
2. Implémenter un système de "pages visuelles" en CSS pur
3. Les sauts de page seraient décoratifs, pas fonctionnels
4. Terminer Phase 5 (Migration) puis revenir sur la pagination

**Avantage** : Livre fonctionnel immédiatement

### Option C: Alternative - CSS Paged Media (FUTUR)
1. Utiliser `@page` CSS + paged.js polyfill
2. Plus natif et compatible avec l'impression
3. Nécessite recherche et test

---

## 🎯 Recommandation

**Désactiver PaginationPlus immédiatement** pour débloquer le développement.

Implémenter un système de pages visuelles basique:
- Un document continu Tiptap (comme avant)
- Des "marqueurs de page" visuels en CSS (fond simulé, numéros)
- Break points CSS pour les chapitres
- Navigation par scroll

Une fois le livre 100% fonctionnel avec migration, **revenir** sur une vraie pagination si nécessaire.

---

## ✅ Status Update: 2026-02-13 - RESOLVED

**PaginationPlus is ENABLED and WORKING.**

### 1. Fix for Infinite Loop / Re-calculation
- Configuring `tiptap-pagination-plus` with correct ephemeral classes and dimensions solved the infinite loop.

### 2. Fix for "Pagination Drift" (Edit vs View Mode)
- **Problem**: `useBookPages` was using `view.posAtCoords` to find split points. In View Mode, the `BookFlipView` overlay obstructed the editor, causing `posAtCoords` to fail (return null/-1), leading to 0 pages or incorrect splits.
- **Solution**: Refactored `useBookPages.ts` to use `view.posAtDOM(element, 0)`. This method uses the DOM structure to find positions, which works regardless of visual overlays or visibility.
- **Result**: Chapters and Pagination Gaps are correctly detected in both Edit and View modes. Visual synchronization is perfect.

### 3. Current Implementation (v2.47.0)
- **Engine**: `ColumnarEditor.tsx` using `column-width` and `column-gap` CSS properties.
- **Pagination**: Automated by the browser's multi-column layout.
- **Coupling**: Decoupled measurement via `contentRef` to allow empty page cleanup.
- **Navigation**: Spread-based logic with boundary detection.

**Action**: Columnar CSS is the final strategy. Legacy pagination extensions are obsolete.

---

## Actions Immédiates

1. Désactiver `PaginationPlus` dans `useBookEditor.ts`
2. Simplifier `BookStyles.css` pour un document continu élégant
3. Garder `BookSpreadView` pour la navigation
4. Tester et valider la saisie de texte
5. Continuer Phase 5 (Migration)
