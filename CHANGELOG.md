# Historique Ancien (Legacy Changelog)

## [2.20.12] - 2026-02-07 [REFACTOR]

- Optimisation: Évitement de la re-compression des images déjà optimisées (prévention de la perte de qualité).
- Core: Décompression à la volée uniquement lors de l'affichage (données stockées compressées partout).
- Fix: Correction des imports et de la gestion de la mémoire à l'affichage des images.

## [2.20.11] - 2026-02-07 [FEATURE]

- Export/Import: Intégration de la compression d'images (JPEG + GZIP) dans les fichiers .json.
- Optimisation: Réduction de 70-85% de la taille des fichiers d'exportation.
- Core: Centralisation de la logique de traitement d'images pour réutilisation.
- Rétrocompatibilité: Les anciens fichiers JSON non compressés restent parfaitement importables.
