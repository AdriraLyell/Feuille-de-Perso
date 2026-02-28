# RÈGLES DE CALCUL - PROJET FEUILLE DE PERSO

Ce document est la source de vérité pour Aider lors des modifications des utilitaires de calcul.

## 1. Principes de calcul
- Les arrondis doivent toujours se faire à l'inférieur (`Math.floor`) sauf mention contraire.
- Les modificateurs sont cumulatifs.
- Ne jamais modifier une formule sans vérifier son impact dans `src/schemas/characterSchema.ts`.

## 2. Termes Clés (Variables de Formules)
- `SCENARIOS_COUNT` : Nombre de scénarios joués.
- `TRAIT_LEVEL` : Niveau actuel du trait concerné.
- `TOTAL_XP` : Somme de l'XP dépensée + restante.

## 3. Structure des fichiers
- `src/utils/calculations/` : Contient la logique pure.
- Éviter d'importer des composants UI dans ces fichiers.
