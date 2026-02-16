# Historique Ancien (Legacy Changelog)

## [2.45.13] - 2026-02-12 [PATCH]

- 📖 Livre : Suppression totale des barres de défilement (ascenseurs) en mode lecture pour une immersion parfaite
- 🎨 UI : Ajustement des conteneurs parents pour éviter les débordements visuels et masquer les scrollbars sur toutes les résolutions
- 📏 Mise en page : Centrage amélioré du livre dans son écrin de bois

## [2.45.12] - 2026-02-12 [PATCH]

- 📖 Livre : Préservation intégrale de la mise en forme (gras, italique, etc.) lors du découpage des paragraphes géants
- 🛠️ Algorithme : Utilisation de l'API Range du DOM pour un découpage HTML structurellement sûr
- 📏 Précision : Mesures de hauteur encore plus fidèles grâce au rendu des balises réelles lors du calcul du split

## [2.45.11] - 2026-02-12 [PATCH]

- 📖 Livre : Rétablissement de la vue double-page (cote-à-cote)
- ✨ UX : Suppression du flickering via la désactivation des coins interactifs (showPageCorners)
- 🎨 Style : Nettoyage des ombres CSS redondantes pour laisser le moteur FlipBook gérer le relief
- 🚀 Performance : Optimisation de l'auto-dimensionnement (autoSize: true)

## [2.45.10] - 2026-02-12 [BUGFIX]

- 🐛 Fix : Correction majeure du BookPageSplitter pour gérer les paragraphes géants sans ponctuation
- 🔄 Algorithme : Implémentation d'une file d'attente (queue) pour le traitement récursif des blocs
- 🔤 Fallback : Ajout d'un découpage mot-par-mot si le découpage par phrases ne suffit pas
- 🪵 Logging : Transition vers le logger système (logger.log/info) pour le suivi de la pagination

## [2.45.9] - 2026-02-12 [PATCH]

- 🐛 Fix Critique : Correction du dimensionnement du BookPageSplitter (contenu tronqué en mode Lecture)
- 📐 Constants : Séparation correcte des dimensions totales (722×980) et zone de contenu (562×836)
- 📏 CSS : Passage du padding en pixels (72px 80px) pour garantir la synchronisation avec les constantes JS

## [2.45.8] - 2026-02-12 [MINOR]

- 📖 Livre Numérique : Harmonisation rigoureuse des dimensions (722px) entre modes Écriture et Lecture
- 📏 Layout : Enforced fixed width et correction de l'élargissement infini via overflow-wrap: break-word
- ✂️ Pagination : Correction du BookPageSplitter (mesures précises via matching des classes CSS)
- 🖼️ Viewer : Optimisation du rendu double-page avec react-pageflip (size: fixed)

## [2.45.7] - 2026-02-12 [MINOR]

- Phase C : Typage strict des handlers admin (value: any → unknown ou génériques)
- AdminCountersEditor : Typage générique <K extends keyof RulesCounterDefinition>
- AdminTraitLibrary : Typage générique <K extends keyof TraitEffect>
- AdminCreationEditor et sous-composants : any → unknown pour champs dynamiques

## [2.45.6] - 2026-02-12 [MINOR]

- Refactoring majeur de CreationHUD.tsx (537 → 168 lignes)
- Extraction de useCreationBudget hook pour la logique de calcul
- Extraction de BudgetGauge et CreationValidationModal en composants réutilisables
- Suppression de tous les @ts-ignore dans CreationHUD via typage strict

## [2.45.5] - 2026-02-12 [PATCH]

- 🧹 Audit : Suppression de 12 fichiers de débris à la racine du projet (logs, tests, doublons)
- 🛠️ Build : Correction de 4 erreurs de compilation pré-existantes (imports manquants, exports dupliqués, accès typé)
- 📄 Docs : Mise à jour de regle.md, AUDIT_SUMMARY.md et .gitignore
- 🔄 Version : Résolution de la désynchronisation de version entre package.json et constants.ts

## [2.45.4] - 2026-02-12 [PATCH]

- ✨ Landing Page Wow Effect : Refonte immersive de RulesSourceSelector avec le thème 'Mystic' Premium
- 🛡️ Secure Entry : Harmonisation du LoginScreen avec la même esthétique (lueurs, textures, boutons thématiques)
- 📱 Mobile UX : Implémentation d'un menu 'hamburger' animé dans la navigation diégétique
- 🎨 Micro-Interactions : Ajout d'animations Framer Motion sur les cartes de sélection et les boutons d'action
- 📏 Responsive : Optimisation de la typographie et des espacements pour tablettes et smartphones

# Historique Ancien (Legacy Changelog)

## [2.45.3] - 2026-02-12 [PATCH]

- 🛡️ Sécurité & Fiabilité : Ajout de blocs try/catch/finally sur toutes les actions asynchrones de l'Admin
- 🧩 Type Safety : Suppression massive de types 'any' et de '@ts-ignore' dans le moteur de réconciliation
- 🧪 Tests : Correction de la suite de tests pour supporter le nouveau typage des compteurs
- 🧹 Code Clean : Suppression de console.logs et typage strict des accesseurs d'état

## [2.45.2] - 2026-02-12 [PATCH]

- 🛡️ Hotfix : Correction d'un crash critique 'process is not defined' sur l'écran de connexion
- 🏗️ Architecture : Transition finale vers le format JSON pour l'exportation et la publication des règles
- 🧹 Nettoyage : Suppression de l'injection obsolète de rules.js dans admin.html
- 🎨 UI/UX : Refonte de la modale de déploiement GitHub avec le thème Premium Dark Mystic
- 🛠️ Core : Mise à jour du RulesGenerator pour une sortie JSON pure

## [2.45.1] - 2026-02-12 [PATCH]

- ✨ Animations Admin : Intégration de framer-motion (MotionFade, MotionCard) sur l'ensemble des éditeurs admin
- 🎨 Premium Aesthetic : Application du thème sombre 'Mystic' avec effets de verre et de parchemin sur CharacterReadOnlyView
- 🎭 UX : Effets d'apparition séquencés (staggered) sur les boutons du header et les cartes de catégories
- 💎 Polish : Amélioration visuelle de l'éditeur de création, des coûts et des compteurs

## [2.45.0] - 2026-02-12 [MINOR]

- 🎨 Admin Thème : Refonte complète de l'interface d'administration (Thème Mystic & Victorien)
- ✨ UI/UX : Harmonisation des couleurs (Pierre/Ambre) sur les éditeurs de compétences et propriétés
- 🛠️ Composants : Mise à jour des cartes de catégories, de la sidebar et des panneaux de configuration
- 🌚 Thème sombre : Support natif du thème Mystic sur les modales de confirmation et d'édition
- 💎 Polish : Amélioration des transitions, des ombres et des effets de survol pour un rendu premium

# Historique Ancien (Legacy Changelog)

## [2.44.5] - 2026-02-12 [MINOR]

- 🧪 Test Automation : Mise en place d'une suite complète de tests E2E avec Playwright
- 📡 Robustesse Réseau : Validation des scénarios de repli (Offline, Rate Limit API, CDN Failure)
- 💾 Tests d'Intégration : Couverture des services CampaignService et OfflineStorageService
- 🛡️ Correction de Bug : Élimination des doublons dans l'affichage des campagnes cachées
- 🔧 RulesLoader : Gestion optimisée des erreurs 403/429 pour la résilience du chargement

## [2.44.4] - 2026-02-12 [PATCH]

- 🏗️ Architecture : Suppression définitive de l'injection script rules.js
- 🔧 Service : Bascule complète vers un chargement de règles JSON via API/CDN
- 🛡️ Résilience : Intégration de defaultRules.ts comme ultime fallback embarqué
- 🧹 Nettoyage : Suppression de PlayerService au profit de CampaignService unifié
- 💾 Migration : Amélioration de migrateRulesToV2 pour garantir l'intégrité des bibliothèques

# Historique Ancien (Legacy Changelog)

## [2.44.3] - 2026-02-11 [MINOR]

- 💾 Hybrid Database : Implémentation du OfflineStorageService (IndexedDB)
- 📡 Résilience : Chargement 'Online First' avec repli automatique sur le cache local
- 🌐 Connectivity : Détection intelligente de l'état hors ligne (isOffline)
- 💾 Persistance : Les campagnes chargées depuis Supabase sont désormais auto-cachées localement
- 🛡️ Typage : Ajout de la source 'cache' au schéma RulesData

## [2.44.2] - 2026-02-11 [PATCH]

- 🛡️ Typage : Éradication finale des 'as any' dans AdminApp, SyncModal et CharacterReadOnly
- ♿ Accessibilité : Gestion du focus et support touche Echap dans les modales thématiques
- 🏷️ UX : Ajout de labels ARIA sur l'ensemble de la navigation diégétique
- 🧹 Code : Nettoyage des stubs ts-ignore dans les générateurs d'état initial
- 🔧 Service : Ajout de checkSchema dans CampaignService pour la validation manuelle

## [2.44.1] - 2026-02-11 [MINOR]

- 🚀 MJ Dashboard : Implémentation de l'archivage des campagnes
- 📝 Métadonnées : Ajout d'une description de campagne et d'un message d'accueil MJ
- 👁️ Visibilité : Contrôle MJ sur l'affichage des infos de campagne pour les joueurs
- 🛡️ Base de Données : Migration PostgreSQL pour supporter les nouvelles métadonnées
- 🧑‍🚀 Expérience Joueur : Modal d'information de campagne avec message de bienvenue automatique

## [2.44.0] - 2026-02-12 [MINOR]

- 🏗️ Architecture : Refonte majeure du MainLayout via les hooks useNavigationState, usePrintManager et useRulesSync
- 🏗️ Architecture : Refactorisation de SettingsView via le hook useSettingsManager
- 🏗️ Architecture : Refactorisation de CharacterSheetPage2 via useTraitEditor et useReputationManager
- 🏗️ Architecture : Refactorisation de LibraryView via useSkillLibrary
- 🧹 Code : Suppression de code dupliqué et amélioration de la séparation des préoccupations
- 🛡️ Stabilité : Correction des types TypeScript et amélioration de la robustesse de la synchro des règles

## [2.43.3] - 2026-02-11 [PATCH]

- 🏗️ Architecture : Extraction de la logique complexe de CharacterSheet.tsx vers useEditMode et useVariableSkills
- 🏗️ Architecture : Modularisation de LibraryView.tsx via le nouveau hook useSkillLibrary
- 🧹 Nettoyage : Réduction de la taille des composants principaux (~300 lignes extraites)
- 🚀 Performance : Optimisation des rendus via useMemo dans les nouveaux hooks

## [2.43.2] - 2026-02-11 [PATCH]

- 💎 Qualité : Suppression massive de 'as any' pour un typage TypeScript strict (~90 occurrences)
- ♿ Accessibilité : Installation de eslint-plugin-jsx-a11y et corrections sémantique (main, nav, aside)
- 🏷️ UX : Ajout de labels ARIA sur les boutons d'actions (Déconnexion, Suppression, Publication)
- 🛡️ Typage : Sécurisation du processus d'import de bibliothèque avec validation de types

## [2.43.1] - 2026-02-11 [PATCH]

- 🛡️ Sécurité : Mise à jour vers Vite 7 et correction des vulnérabilités (npm audit)
- 🧩 Fiabilité : Implémentation d'un Error Boundary global (fallback UI en français)
- 🚀 CI/CD : Renforcement du workflow de déploiement (Type Check, Lint, Tests unitaires obligatoires)

## [2.43.0] - 2026-02-11 [MINOR]

- 🏗️ Refonte majeure architecturale : Extraction de plus de 1500 lignes de logique vers des hooks personnalisés
- 🧩 AdminApp : Extraction de useAdminAuth et useAdminRulesHandler (Optimisation de 60%)
- 📖 CampaignNotes : Refonte complète du journal avec useJournal et useJournalImages
- 🎨 TraitLibrary : Modularisation de la bibliothèque de traits et des sélections
- 🧙 LibraryImportWizard : Simplification de l'assistant d'importation via useLibraryImport
- 🛡️ Renforcement du typage TypeScript Strict sur l'ensemble des nouveaux modules

## [2.42.1] - 2026-02-11 [PATCH]

- 💄 Amélioration de l'accessibilité du bouton de déconnexion dans l'Admin
- 🏠 Ajout du bouton de déconnexion sur le Tableau de Bord
- 👥 Ajout du bouton de déconnexion sur la vue des Joueurs Globaux

## [2.42.0] - 2026-02-11 [MINOR]

- 🛡️ Hardening de la sécurité RLS (Supabase) : Transition vers les claims JWT pour plus de robustesse
- 🚀 Correction des erreurs 403 Forbidden dans l'administration des campagnes
- 🔧 Consolidation des politiques de bibliothèques (Skills, Traits, Backgrounds)
- 🆕 Support multi-campagne : Gestion automatisée de la propriété des personnages (created_by)

## [2.41.0] - 2026-02-11 [MINOR]

- Audit Phase 2 : Amélioration de la Qualité et du Typage
- Refonte de DatabaseService : Suppression des types 'any' au profit de Partial<T>
- Nettoyage de rulesReconciler : Suppression des assertions 'as any' pour une réconciliation typée
- Unification de la limitation du débit GitHub API dans RulesLoader et githubService
- Centralisation des constantes UI (couleurs, espacement) dans src/constants/theme.ts
- Ajout de tests unitaires pour RulesContext et CharacterContext (Stabilité et robustesse)
- Correction des incohérences de schéma Zod pour la validation des configurations de campagne

## [2.40.2] - 2026-02-11 [PATCH]

- Mise à jour de la documentation d'architecture (functional_scope.md, db_schema.md)
- Ajustements de l'Audit Summary (Phase 1)

## [2.40.1] - 2026-02-11 [PATCH]

- Correction d'un crash dans le modal Changelog dû à des données non définies
- Ajout de protections contre les erreurs de rendu dans ChangelogModal

## [2.40.0] - 2026-02-11 [MINOR]

- Refactorisation du Reconciler : Extraction de skillsReconciler.ts pour une meilleure maintenabilité
- Standardisation des variables CSS et nettoyage des styles orphelins

## [2.35.6] - 2026-02-10

- Refactoring majeur du Journal : Extraction du composant JournalPage.
- Optimisation du code de CampaignNotes (~150 lignes retirées).

## [2.34.16] - 2026-02-10

- [object Object]

## [2.35.7] - 2026-02-10

- Refactoring technique du Journal : Centralisation des constantes de dimensions et de mise en page.

## [2.33.2] - 2026-02-10

- [object Object]

## [2.33.1] - 2026-02-10

- [object Object]

## [2.33.0] - 2026-02-10

- [object Object]
- [object Object]
- [object Object]
- [object Object]

## [2.32.8] - 2026-02-10

- [object Object]
- [object Object]
- [object Object]

## [2.32.7] - 2026-02-10

- [object Object]
- [object Object]

## [2.32.6] - 2026-02-10

- [object Object]
- [object Object]
- [object Object]
- [object Object]

## [2.32.5] - 2026-02-10

- [object Object]
- [object Object]
- [object Object]
- [object Object]
- [object Object]

## [2.32.4] - 2026-02-10

- [object Object]
- [object Object]

## [2.32.3] - 2026-02-10

- [object Object]
- [object Object]
- [object Object]

## [2.32.2] - 2026-02-10

- [object Object]

## [2.32.1] - 2026-02-10

- [object Object]

## [2.32.0] - 2026-02-10

- [object Object]
- [object Object]
- [object Object]
- [object Object]

## [2.31.0] - 2026-02-09

- [object Object]
- [object Object]
- [object Object]
- [object Object]

## [2.30.5] - 2026-02-09

- [object Object]
- [object Object]

## [2.30.4] - 2026-02-09

- [object Object]
- [object Object]

## [2.30.3] - 2026-02-09

- [object Object]
- [object Object]

## [2.30.2] - 2026-02-09

- [object Object]
- [object Object]
- [object Object]

# Historique Ancien (Legacy Changelog)

## [2.30.1] - 2026-02-09

- [object Object]

## [2.30.0] - 2026-02-09

- [object Object]
- [object Object]
- [object Object]
- [object Object]

## [2.29.3] - 2026-02-09

- [object Object]
- [object Object]
- [object Object]

## [2.34.3] - 2026-02-10

- Restauration du champ Variantes dans la réserve de l'Administration.
- Correction du bug de suppression/espaces ('sticky text') dans les saisies de variantes (Admin & Librairies).
- Support de l'édition des descriptions et icônes de catégories dans l'Admin pour éviter la perte de données.
- Mappage complet des métadonnées (bulles d'info) pour les Arrière-plans et Compteurs.

## [2.34.2] - 2026-02-10

- Correction des bulles d'info (descriptions) sur les pavés de compétences de la fiche perso.
- Amélioration de la saisie des variantes dans l'administration (gestion fluide des virgules et espaces).
- Restauration des icônes de catégorie sur la fiche perso.

## [2.34.1] - 2026-02-10

- [object Object]
- [object Object]
- [object Object]

## [2.34.0] - 2026-02-10

- [object Object]
- [object Object]
- [object Object]
- [object Object]

## [2.33.2] - 2026-02-10

- [object Object]

## [2.33.1] - 2026-02-10

- [object Object]

## [2.33.0] - 2026-02-10

- [object Object]
- [object Object]
- [object Object]
- [object Object]

## [2.32.8] - 2026-02-10

- [object Object]
- [object Object]
- [object Object]

## [2.32.7] - 2026-02-10

- [object Object]
- [object Object]

## [2.32.6] - 2026-02-10

- [object Object]
- [object Object]
- [object Object]
- [object Object]

## [2.32.5] - 2026-02-10

- [object Object]
- [object Object]
- [object Object]
- [object Object]
- [object Object]

## [2.32.4] - 2026-02-10

- [object Object]
- [object Object]

## [2.32.3] - 2026-02-10

- [object Object]
- [object Object]
- [object Object]

## [2.32.2] - 2026-02-10

- [object Object]

## [2.32.1] - 2026-02-10

- [object Object]

## [2.32.0] - 2026-02-10

- [object Object]
- [object Object]
- [object Object]
- [object Object]

## [2.31.0] - 2026-02-09

- [object Object]
- [object Object]
- [object Object]
- [object Object]

## [2.30.5] - 2026-02-09

- [object Object]
- [object Object]

# Historique Ancien (Legacy Changelog)

## [2.30.4] - 2026-02-09

- [object Object]
- [object Object]

# Historique Ancien (Legacy Changelog)

## [2.30.3] - 2026-02-09

- [object Object]
- [object Object]

## [2.30.2] - 2026-02-09

- [object Object]
- [object Object]
- [object Object]

# Historique Ancien (Legacy Changelog)

## [2.30.1] - 2026-02-09

- [object Object]

# Historique Ancien (Legacy Changelog)

## [2.30.0] - 2026-02-09

- [object Object]
- [object Object]
- [object Object]
- [object Object]

## [2.29.3] - 2026-02-09

- [object Object]
- [object Object]
- [object Object]

## [2.29.2] - 2026-02-09

- [object Object]
- [object Object]

## [2.29.1] - 2026-02-09

- [object Object]
- [object Object]
- [object Object]

## [2.29.0] - 2026-02-09

- [object Object]
- [object Object]
- [object Object]

## [2.28.1] - 2026-02-09

- Fix : Correction du menu 'Source' sauté au démarrage à cause du cache (ajout de de l'état isSourceSelected).
- Fix : Correction des doublons de clés React (IDs dupliqués) dans les blocs de compétences quand les règles ont des noms identiques.

## [2.28.0] - 2026-02-09

- Réduction de l'inlining des assets (limite à 10Ko) pour accélérer le parsing HTML initial.
- Implémentation du Lazy Loading pour les modules Admin et les modales secondaires via React.lazy et Suspense.
- Mise en cache persistante des règles via IndexedDB (idb-keyval) pour un chargement instantané au rafraîchissement.
- Amélioration de la structure de build avec des fallbacks de chargement (loaders).

## [2.27.2] - 2026-02-09

- Retrait des animations de pulsation sur l'indicateur d'auto-sync pour plus de discrétion.

## [2.27.1] - 2026-02-09

- L'onglet 'Cloud' est désormais accessible en tout temps (hors réglages avancés).
- Ajout d'un feedback visuel en temps réel sur le bouton de synchronisation (icône en rotation + texte 'Sync...').
- Correction d'un problème de portée de variable dans le contexte de personnage.

## [2.27.0] - 2026-02-09

- Ajout d'un toggle d'auto-sync dans la modale de synchronisation.
- Nouvel onglet 'Cloud' dans les réglages de la fiche pour gérer l'auto-sync.
- Mécanisme de sauvegarde automatique debounced (10s) pour éviter les surcharges.
- Indicateurs visuels d'état de synchronisation dans la barre de navigation.

## [2.26.1] - 2026-02-09

- Fix: Correction d'un bug 400 lors du chargement des personnages orphelins (ID 'orphan')
- Refactor: Migration finale de PlayerService vers DatabaseService
- Robustesse: Centralisation totale des appels Supabase dans la couche service

## [2.26.0] - 2026-02-09

- Refactoring technique majeur : Centralisation des appels base de données (DatabaseService).
- Optimisation des performances : Utilisation de requêtes groupées pour les bibliothèques.
- Fiabilisation : Gestion d'erreurs uniforme pour les opérations de sauvegarde et chargement.

## [2.25.2] - 2026-02-09

- Validation : Tests E2E pour le RulesReconciler assurant la non-régression
- Optimisation : Versionning interne des règles pour limiter les recalculs
- Maintenance : Stabilisation du build suite au passage en TypeScript Strict

## [2.25.1] - 2026-02-09

- Tech : Migration complète des logs d'erreurs vers ErrorService pour une meilleure observabilité
- Fix : Correction d'un import dupliqué bloquant le build dans CharacterSyncService
- Refactoring : Nettoyage du code dans les composants d'administration et d'import/export

## [2.25.0] - 2026-02-09

- 🛡️ Activation du mode Strict TypeScript pour une sécurité accrue
- 🔧 Correction de +50 erreurs de typage implicites et de null checks
- 🐛 Correctifs multiples sur l'import de données et la synchro
- ⚡ Optimisation des scripts utilitaires

## [2.24.21] - 2026-02-09

- Fix : La liste des historiques est désormais complète même si certains ne sont définis que dans les colonnes de compétences
- Amélioration : Fusion automatique des définitions d'historiques pour garantir l'intégrité des données

## [2.24.20] - 2026-02-09

- Fix : Correction majeure des doublons de compétences dans les Historiques
- Amélioration : Algorithme de déduplication globale lors de la réconciliation des règles
- Sécurité : Critère de migration des Historiques affiné pour éviter les faux positifs

## [2.24.19] - 2026-02-09

- Fix : Robustesse des Historiques lors du chargement cloud
- Fix : Plus aucune perte de biographies personnalisées lors d'un changement de campagne
- Amélioration : Le système scanne désormais toutes les colonnes pour préserver les données historiques
- Fix : Correction d'une erreur potentielle (TypeError) dans le moteur de réconciliation

## [2.24.18] - 2026-02-09

- Hotfix UX : Amélioration de la réactivité après chargement cloud (plus besoin de rafraîchir)
- Correction : Réconciliation immédiate des données cloud avec les règles de la campagne active
- Amélioration : Forçage de la synchronisation des règles même si la campagne reste identique

## [2.24.17] - 2026-02-09

- Fix: Disparition des compteurs lors du chargement Cloud (IDs de catégories dynamiques)
- Fix: Migration non-destructive des compteurs pour préserver les compteurs personnalisés et système
- Fix: Crash du moteur de réconciliation dû à un import manquant (normalizeString)
- Fix: Robustesse accrue du calcul XP pour les compteurs personnalisés

## [2.24.16] - 2026-02-09

- Hotfix : Réalignement strict des IDs entre Compteurs et Compétences
- Correctif : Synchronisation des définitions utilisant les UUIDs de la bibliothèque
- Correctif : Réactivation de la réactivité du calcul d'XP sur les compteurs
- Amélioration de la réconciliation des règles pour préserver l'intégrité des IDs

## [2.24.15] - 2026-02-08

- Hotfix : Forçage de la synchronisation des définitions de compteurs avec la bibliothèque
- Correctif : Calcul du coût XP basé sur les valeurs de la bibliothèque (defaultValue/xpCost)
- Amélioration du mapping des éléments globaux au chargement de la campagne

## [2.24.14] - 2026-02-09

- Hotfix: Globalisation des compteurs de test ('testa', 'testb') pour corriger le coût XP nul et l'invisibilité entre campagnes.
- Cleanup: Suppression de l'ancienne section 'Compteurs Personnalisés' (redondante avec la Bibliothèque).
- Admin: Retrait du bouton de correctif temporaire après exécution réussie.

## [2.24.12] - 2026-02-09

- Fix: Les points inclus par défaut dans un compteur (ex: 3) sont bien gratuits (cout 0).
- Fix: Impossible de descendre un compteur en dessous de sa valeur par défaut.
- Fix: Masquage strict des compteurs de bibliothèque non assignés à la feuille.

## [2.24.11] - 2026-02-09

- Critique: Correction des coûts XP ignorés pour les compteurs système (Volonté).
- Fix: Correction de l'ordre d'affichage des compteurs dans la feuille.
- Fix: Rétablissement de l'affichage de la Bibliothèque (bug recherche vide).

## [2.24.10] - 2026-02-08

- Fix: Correction de la sensibilité aux accents pour la détection des Compteurs (Volonté vs Volonte).
- Fix: Nettoyage et robustesse du calcul des coûts liés aux bibliothèques.

## [2.24.9] - 2026-02-08

- Fix: Amélioration de la détection des Compteurs en Bibliothèque. Le système utilise maintenant le Nom (Name) en plus de l'ID pour faire la correspondance.
- Fix: Résolution définitive du blocage sur Volonté/Confiance (dont les IDs internes différaient des IDs de bibliothèque).

## [2.24.8] - 2026-02-08

- Fix: Les compteurs utilisent désormais la 'Bibliothèque' (Configuration Utilisateur) comme source de vérité pour le Coût XP et le Blocage, et non plus seulement les définitions système.
- Fix: Résolution du problème où les compteurs personnalisés (TestA, etc.) coûtaient 0 XP.
- Fix: Résolution du problème de blocage incorrect sur des compteurs standards (Volonté) modifiés en bibliothèque.

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
