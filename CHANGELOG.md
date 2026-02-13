# Historique Ancien (Legacy Changelog)

## [2.24.7] - 2026-02-08 [BUGFIX]

- Coûts: Correction critique de la synchronisation des compteurs (Volonté, Santé...) qui écrasait leur Valeur de Création, rendant leur coût nul.
- Règles: Blocage effectif de l'augmentation des compteurs dont le coût XP est nul ou négatif (sauf en mode Création).
- Logic: Préservation stricte de la 'Valeur de Création' pour les catégories de type 'Compteur' lors des mises à jour.

## [2.24.6] - 2026-02-08 [BUGFIX]

- Coûts: Résolution du bug où les compteurs (Volonté, etc.) coûtaient 0 XP en mode création malgré les réglages MJ.
- HUD: Correction du ciblage des coûts de compteurs pour utiliser l'identifiant de compétence au lieu de la catégorie.
- Fiche: La 'Valeur de Création' des compteurs et historiques est désormais isolée pour permettre le calcul correct du surcoût.

## [2.24.5] - 2026-02-08 [IMPROVEMENT]

- Coûts: Unification de la formule de calcul (Base × Multiplicateur) pour les arrières-plans et les compteurs.
- Admin: Renommage des 'Facteurs' en 'Multiplicateurs' pour une meilleure clarté pédagogique.
- Fiche: Correction du calcul des coûts dans le HUD de création pour s'aligner sur les règles dynamiques.

## [2.24.4] - 2026-02-08 [BUGFIX]

- Fiche: Correction critique de la perte de campagne (SyncInfo) liée à une omission dans le schéma de validation Zod.
- Core: Nettoyage et consolidation du moteur de réconciliation des règles.

## [2.24.3] - 2026-02-08 [BUGFIX]

- Fiche: Correction de la perte de connexion à la campagne lors de la reprise de session (migration des règles corrigée).
- Fiche: Nettoyage intelligent des compétences obsolètes lors du changement de campagne (on ne garde que les scores > 0).
- Core: Persistance du lien vers la campagne (Sync Info) assurée lors de la réconciliation.

## [2.24.2] - 2026-02-08 [BUGFIX]

- Fiche: Correction du bug de restauration des arrières-plans lors de la reprise de session (dynamisation de l'ID de catégorie).

## [2.24.1] - 2026-02-08 [BUGFIX]

- Bibliothèque: Correction d'une erreur 400 lors de l'import des Historiques (suppression de la colonne default_category inexistante).

## [2.24.0] - 2026-02-07 [FEATURE]

- Bibliothèque: Ajout de cases à cocher d'activation/désactivation pour tous les éléments (Traits, Compétences, Spéc., Historiques, Compteurs).
- Bibliothèque: Les éléments globaux inactifs sont désormais affichés dans la barre latérale pour permettre leur activation.
- Admin: Extension de l'Assistant d'Import pour inclure les Historiques et les Compteurs depuis les fiches personnages.
- Sync: Implémentation d'un mécanisme de rafraîchissement global des règles après import ou modification.
- Fix: Restauration des fonctions de sauvegarde cloud dans l'interface d'administration.

## [2.23.1] - 2026-02-07 [PATCH]

- Correction critique des erreurs de syntaxe UUID (22P02)
- Normalisation de la génération d'identifiants (crypto.randomUUID)
- Ajout d'une couche de sécurité dans LibraryService pour la conversion automatique des IDs legacy

## [2.23.0] - 2026-02-07 [FEATURE]

- Réserve Universelle: Implémentation de la 'Réserve de Variantes' pour les traits, compétences et historiques.
- Admin: Nouveau système de gestion des variantes suggérées par module, permettant aux MJ de définir des choix rapides.
- Joueur: Interface de sélection de variante intégrée au drag-and-drop de compétences et à l'édition de traits.
- Database: Création de tables dédiées pour le stockage des variantes globales et locales avec support RLS.
- Performance: Optimisation du chargement des bibliothèques avec mapping intelligent des variantes.

## [2.22.0] - 2026-02-07 [FEATURE]

- Architecture: Implémentation de la 'Réserve Universelle' (Master Reserve) pour une gestion centralisée des traits et spécialisations.
- Database: Migration vers un modèle hybride permettant l'héritage et la pioche de ressources globales par les campagnes.
- Admin: Mise à jour de l'Assistant d'Import permettant de choisir la destination (Campagne locale vs Réserve Universelle).
- Core: Stratégie de 'Snapshot de Déploiement' garantissant le fonctionnement offline total des ressources universelles piochées.

## [2.21.9] - 2026-02-07 [FEATURE]

- Admin: Nouvel 'Assistant d'Import Bibliothèque' permettant d'importer des traits, compétences et spécialisations directement depuis une fiche personnage vers la bibliothèque de campagne.
- Admin: Détection automatique des doublons lors de l'import pour préserver l'intégrité des données.
- Admin: Interface multi-onglets interactive pour le tri et la sélection des éléments à importer.

## [2.21.8] - 2026-02-07 [IMPROVEMENT]

- Admin: Renommage des catégories de compétences par leurs noms réels (Talents, Compétences, etc.) dans la vue personnage.
- Admin: Récupération dynamique des labels depuis les règles de la campagne associée.

## [2.21.7] - 2026-02-07 [FEATURE]

- Admin: Ajout de la visualisation des spécialisations dans la vue 'Fiche Personnage'.
- Admin: Les spécialisations imposées s'affichent sous forme de badges contrastés, les spécialisations libres en italique.

## [2.21.6] - 2026-02-07 [BUGFIX]

- Fiche: Correction du verrouillage automatique des règles lors du chargement d'un personnage depuis le Cloud.
- Fiche: Synchronisation automatique de la campagne lors de l'import d'un fichier JSON ou d'un personnage Cloud.
- UX: Redirection automatique vers l'onglet 'Bibliothèque' si l'utilisateur est en mode 'Online'.

## [2.21.5] - 2026-02-07 [IMPROVEMENT]

- Admin: Extension de la désambiguïsation visuelle à l'onglet 'Compétences' de l'administration.
- UX Admin: Les colonnes portant le même nom affichent désormais le suffixe ' (suite)' pour une meilleure clarté lors de l'édition.

## [2.21.4] - 2026-02-07 [IMPROVEMENT]

- Bibliothèque: Ajout d'une gestion automatique des labels en doublon (Désambiguïsation).
- Bibliothèque: Ajout automatique du suffixe ' (suite)' pour les colonnes portant le même nom dans les listes de sélection.

## [2.21.3] - 2026-02-07 [IMPROVEMENT]

- Bibliothèque: Alignement des codes techniques de catégories avec la structure réelle (`Col_Comp_X`).
- Bibliothèque: Résolution dynamique des labels de catégories basés sur les règles du Setting actif.
- UX Admin: Correction de l'affichage 'Aucune' dans la bibliothèque de compétences.
- UX Admin: Amélioration de l'aide contextuelle pour afficher la correspondance exacte des colonnes par Setting.

## [2.21.2] - 2026-02-07 [IMPROVEMENT]

- Admin: Remplacement du `confirm` navigateur par une modale thématique dans la Master List des joueurs.
- UX: Amélioration de la cohérence visuelle pour toutes les actions de suppression dans l'administration.

## [2.21.1] - 2026-02-07 [IMPROVEMENT]

- Admin: Remplacement de la fenêtre de saisie navigateur par une modale thématique pour la duplication de campagne.
- UX: Amélioration de l'esthétique et de la cohérence visuelle lors de la création d'une copie.

## [2.21.0] - 2026-02-07 [FEATURE]

- Admin: Ajout de la possibilité de dupliquer une campagne existante.
- Admin: La duplication crée une nouvelle campagne avec les mêmes règles et bibliothèques, mais sans copier les personnages.
- Admin: Les identifiants des bibliothèques locales sont régénérés lors de la duplication pour garantir l'indépendance des données.

## [2.20.16] - 2026-02-07 [BUGFIX]

- Data: Correction du bug de remise à zéro des attributs lors de la reprise de session.
- Migration: Normalisation systématique des identifiants de catégories d'attributs dans les règles (ex: 'Physique' -> 'pave_attributs_1').
- Sécurité: La réconciliation des attributs est désormais additive, empêchant la suppression accidentelle de valeurs si les règles sont incomplètes ou mal formées.

## [2.20.15] - 2026-02-07 [BUGFIX]

- Sécurité: Changement de stratégie de réconciliation (Additve). Les compétences existantes du personnage ne sont plus jamais supprimées lors du chargement d'une nouvelle campagne, même si la campagne est incomplète.
- Migration: Correction d'un bug où les règles chargées depuis GitHub restaient en format legacy, causant des conflits d'affichage.
- Stabilité: Ajout de logs de débogage avancés dans le CharacterContext pour tracer les flux de données.
- Fix: Résolution du blocage (boucle infinie) lors de la résolution des conflits de session au démarrage.

## [2.20.14] - 2026-02-07 [BUGFIX]

- Fix: Correction de la perte des compétences lors du chargement des campagnes en ligne (reconstruction du layout depuis la bibliothèque).
- Fix: Correction d'une boucle infinie (UI bloquée) lors d'un conflit de campagne au démarrage.
- Stabilité: Ajout de garde-fous globaux et gestion d'erreurs sur le chargement des données Supabase.

## [2.20.13] - 2026-02-07 [FEATURE]

- Sécurité: Ajout d'une modale de conflit lors du changement de campagne pour éviter les pertes de données.
- UX: Nouveau bouton 'Reprendre ma session' pour charger instantanément la campagne associée au personnage local.
- Sauvegarde: Option de sauvegarde de secours (JSON) intégrée directement dans la modale de conflit.
- Core: Extraction de la logique d'exportation vers un utilitaire partagé.

## [2.20.12] - 2026-02-07 [REFACTOR]

- Optimisation: Évitement de la re-compression des images déjà optimisées (prévention de la perte de qualité).
- Core: Décompression à la volée uniquement lors de l'affichage (données stockées compressées partout).
- Fix: Correction des imports et de la gestion de la mémoire à l'affichage des images.

## [2.20.11] - 2026-02-07 [FEATURE]

- Export/Import: Intégration de la compression d'images (JPEG + GZIP) dans les fichiers .json.
- Optimisation: Réduction de 70-85% de la taille des fichiers d'exportation.
- Core: Centralisation de la logique de traitement d'images pour réutilisation.
- Rétrocompatibilité: Les anciens fichiers JSON non compressés restent parfaitement importables.
