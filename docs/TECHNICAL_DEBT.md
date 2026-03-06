# Dette Technique & Frontières de Typage (v2.99.0)

Ce document répertorie les 20 warnings ESLint résiduels après le passage au typage strict (100% sans erreurs). Ces exceptions sont tolérées car elles se situent aux frontières de l'application ou dépendent de bibliothèques tierces.

## 1. Frontières de Données (JSON & Migrations)
**Fichiers :** 	emplateImporter.ts, estoreMysticLinks.ts, useAttributePresets.ts
**Warnings :** Utilisation de ny pour manipuler des objets JSON dont la structure n'est pas garantie à la compilation.
**Raison :** Ces fichiers traitent des données importées (backups, templates) ou des migrations historiques.
**Solution Puriste :** Implémenter **Zod** pour valider et transformer ces JSON en objets strictement typés dès l'entrée.

## 2. Intégration Bibliothèques Tierces (Tiptap & Supabase)
**Fichiers :** ookImage.ts, chapterHeading.ts, LibraryMapper.ts, ormulaEvaluator.ts
**Warnings :** Casts s any lors de l'appel à des fonctions de bibliothèque (ReactNodeViewRenderer) ou lors du mappage de colonnes JSONB.
**Raison :** Les types internes des bibliothèques sont parfois trop rigides ou ne correspondent pas parfaitement à nos interfaces métier.
**Solution Puriste :** Surcharger les types globaux (.d.ts) ou créer des couches de conversion (Type Guards) exhaustives.

## 3. Paramètres de Composants Volontairement Inutilisés
**Fichiers :** BookChapterSidebar.tsx, CampaignConflictModal.tsx
**Warnings :** Props destructurées mais non lues.
**Raison :** Ces props sont conservées pour maintenir la cohérence de l'interface ou pour des évolutions futures (ex: callbacks de fermeture).
**Note :** Elles devraient être préfixées par _ pour satisfaire ESLint si on souhaite un "zéro warning" absolu.

---
**Conclusion :** Le projet est techniquement sain. Les erreurs TypeScript sont à 0. Les warnings restants sont des choix pragmatiques documentés.
