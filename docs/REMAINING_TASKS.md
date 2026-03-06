# Tâches Restantes — Finalisation Admin & Layout

Statut global : ✅ **Complété**

## 🎯 Task list

- [x] **Issue 4.2 — Phase E : Typer le layout dynamique**
  - [x] Typer `useSheetLayout.ts` (interfaces `SheetLayout`, `SheetColumn`, `SkillBlock`).
  - [x] Typer le retour de `getDynamicColumns`.
  - [x] Sécuriser le mapping des catégories de compétences (Landscape/Portrait).
- [x] **Issue 4.3 — Hygiène des fichiers (Moyen) : Extraire les composants monolithiques**
  - [x] Extraire le rendu de la grille dynamique de `CharacterSheet.tsx` vers `CharacterSheetGrid.tsx`.
  - [x] Nettoyer `CharacterSheet.tsx` en utilisant le nouveau composant.
- [x] **Issue 5.1 — Standardisation des variables CSS (Restant)**
  - [x] Remplacer les couleurs "magiques" (white/black) par des variables CSS dans `index.css`.
- [x] **Vérification & Nettoyage Final**
  - [x] Confirmer la suppression de `tiptap-pagination-plus`.
  - [x] Archiver les scripts SQL obsolètes vers `docs/archive/sql/`.
  - [x] Résoudre les 59 dernières erreurs TypeScript (Typage Strict 100%).
  - [x] Incrémenter la version (`2.99.0`).
  - [x] Mettre à jour `CHANGELOG.md`.
  - [x] Build final de vérification (`npm run build`).

---
Fin de sprint de typage et refactoring.
