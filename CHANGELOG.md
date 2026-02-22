# Historique Ancien (Legacy Changelog)

## [2.49.88] - 2026-02-17 [FEAT]

- 🖼️ Grimoire : Ajout du mode 'Déplacement Libre' (F) pour les images
- 🖱️ UX : Déplacement des images par Drag & Drop dans tout l'espace de la page
- 🔄 UI : Nouveau bouton de réinitialisation de la position et support des coordonnées persistantes

## [2.49.87] - 2026-02-16 [FIX]

- 🐞 Sidebar : Fix du bouton Reset qui pouvait échouer selon l'état des données
- ⚠️ React : Correction de l'avertissement 'value prop on select should not be null'
- 🔧 Système : Robustesse accrue de la gestion des états de personnalisation (isCustomized)

## [2.49.86] - 2026-02-16 [FEAT]

- 🔓 Bibliothèque : Réactivation de l'édition globale pour les compétences personnalisées
- 🛡️ Système : Verrouillage strict de la suppression pour les compétences surchargées localement
- 🎨 UI : Harmonisation visuelle avec une icône de surcharge Cyan unifiée (Bibliothèque & Réserve)

## [2.49.85] - 2026-02-16 [FEAT]

- 🔒 Bibliothèque : Verrouillage de l'édition globale si une compétence est personnalisée localement
- 🔄 Réserve : Nouveau bouton 'Reset' pour restaurer instantanément une compétence à son état d'origine
- 🏗️ Système : Stockage de la définition master pour permettre la réinitialisation sans perte de données

## [2.49.84] - 2026-02-16 [FEAT]

- 🧠 Admin : Distinction claire entre édition de la Bibliothèque Globale et Personnalisation de Campagne
- 🛡️ Système : La modification via l'onglet Bibliothèque met désormais à jour la base master pour tous les réglages
- 🖋️ UI : Titres de modales explicites selon le contexte d'édition (Base Globale vs Campagne)

## [2.49.83] - 2026-02-16 [FIX]

- 🔍 Bibliothèques : Correction de la visibilité des compétences à variantes (Artisanat, etc.) en mode filtré
- 🛠️ Système : Amélioration de la détection 'Global' pour le catalogue chargé depuis JSON
- 🎨 UI : Ajustement de la visibilité des boutons d'édition dans les listes administratives

# Historique Ancien (Legacy Changelog)

## [2.49.82] - 2026-02-16 [FEAT]

- 🚀 Système : Utilisation d'un Portal React pour les modales (correction confinement UI)
- 🔄 Admin : Restauration du bouton 'Modifier' dans la bibliothèque globale de compétences
- 🎨 UI : Amélioration de la cohérence visuelle entre la bibliothèque et la réserve

# Historique Ancien (Legacy Changelog)

## [2.49.81] - 2026-02-16 [FEAT]

- 🎨 Admin : Migration de la personnalisation des compétences vers la Réserve (sidebar)
- 🧹 Admin : Restauration de l'UI épurée de la Bibliothèque globale (suppression édition/badges)
- 🛡️ Système : Support complet des overrides de compétences par campagne via la sidebar

## [2.49.80] - 2026-02-16 [FEAT]

- 🛠️ Admin : Implémentation du système de surcharge locale des compétences par campagne (overrides)
- 🛡️ Bibliothèque : Protection contre la suppression des compétences globales si elles sont personnalisées dans un setting
- 📂 Exports : Découplage des exports de compétences (génération d'un `skills_[campaign].json` spécifique)
- 📥 Imports : Support de l'import flexible des bibliothèques via JSON (détection automatique du format spécifique)
- 🎨 UI : Ajout d'un badge 'Custom' dans la réserve pour identifier les compétences modifiées localement

## [2.49.79] - 2026-02-16 [FEAT]

- 🎨 Admin : Optimisation visuelle des badges dans la réserve (icônes uniquement pour Variantes et Habilités Mystiques)

## [2.49.78] - 2026-02-16 [FEAT]

- 🎨 Admin : Ajout de l'icône 'Habilité Mystique' (Sparkles) dans la réserve des compétences pour une identification rapide
- 🛡️ Schéma : Intégration de `mysticAbilityId` dans le schéma de validation des compétences de la bibliothèque

## [2.49.77] - 2026-02-16 [FIX]

- 🔄 Recréation : Rétablissement du statut 'variable' (ex: Artisanat : ..., Langue : ...) pour les compétences le nécessitant
- 🧹 Skills : Le nettoyage préserve désormais l'intention de spécialisation des compétences tout en effaçant le choix précédent

## [2.49.76] - 2026-02-16 [FIX]

- 🔄 Recréation : Nettoyage automatique des variantes et compétences personnalisées pour ne garder que le socle de la campagne
- 🧹 Skills : Correction de la persistance des compétences vides ou hors-règles lors du reset forcé par le MJ

## [2.49.75] - 2026-02-16 [FEAT]

- 👤 Personnage : Clonage du personnage Ayame vers Nika pour le joueur Polo effectué avec succès

## [2.49.74] - 2026-02-16 [FEAT]

- 🔄 Recréation : Amélioration chirurgicale du processus de reset pour préserver l'Identité, le Social, l'Équipement et l'Image du personnage
- 🛡️ Traits : Conservation des Avantages/Désavantages lors d'une recréation imposée par le MJ
- 💰 XP : Simplification du remboursement basé sur l'intégralité de l'historique des logs de progression
- 🎨 UI : Mise à jour de la modale de recréation pour clarifier les éléments préservés et réinitialisés

## [2.49.73] - 2026-02-16 [FIX]

- 🛡️ Sécurité : Suppression de l'attribution automatique de propriété dans DatabaseService pour éviter le verrouillage des fiches legacy
- 👤 Personnage : Déverrouillage des fiches d'Ayame et Louise (reset created_by à NULL) pour restaurer l'accès public
- 🔓 RLS : Mise à jour des politiques Supabase pour autoriser la lecture anonyme des fiches sans propriétaire

## [2.49.72] - 2026-02-16 [DOCS]

- 📝 Documentation : Mise à jour exhaustive du schéma de base de données (mystic_abilities, vues, relations)
- 📝 Documentation : Ajout du guide de procédure pour le clonage de personnage via SQL
- 👤 Personnage : Clonage de Ayame vers Akane pour le joueur Polo effectué avec succès

## [2.49.71] - 2026-02-16 [FIX]

- 🛡️ CI : Correction des erreurs de typage TypeScript bloquant le workflow (RecreationService)
- 🧩 UI : Fix du typage missing onUpdate dans le composant AttributeBlock
- 🧹 Lint : Suppression d'un double cast booléen redondant dans AdminSkillLibrary

## [2.49.70] - 2026-02-16 [FIX]

- 📖 Journal : Fix de la conversion des dimensions d'images lors de la migration (px vers %)
- 🖼️ UI : Ajout d'une limite de hauteur maximale (800px) pour les images du Grimoire
- 📏 Migration : Correction du ratio d'aspect forcé à 'auto' pour les images importées

## [2.49.69] - 2026-02-16 [FIX]

- 📂 Admin : Déplacement de la fonctionnalité de recréation vers les paramètres spécifiques de chaque campagne (Fiches des Destins)
- 🧩 Imports : Correction d'une erreur de référence sur l'icône RotateCcw
- ⏳ UX : Ajout d'états de chargement et verrouillage pendant le processus de recréation

# Historique Ancien (Legacy Changelog)

## [2.49.68] - 2026-02-16 [FEAT]

- 🔄 Recréation : Implémentation du système de 'Respec' pour les personnages (Admin)
- 💰 XP : Remboursement automatique de l'XP de progression (attributs, compétences, compteurs) lors d'une recréation
- 🛡️ Mode Création : Réactivation du mode création avec injection du remboursement et redistribution auto
- 🎨 UI : Nouvelle modale de confirmation 'Recréation Éthérée' avec bilan des gains d'XP et avertissements

## [2.49.67] - 2026-02-16 [FEAT]

- 🛡️ Attributs : Verrouillage de la valeur de création (val1) une fois le mode création validé
- 📈 XP : Implémentation de l'achat d'attributs via la colonne val2 avec calcul auto de l'XP dépensée
- 🎨 UI : Feedback visuel (opacité, curseur) sur les champs d'attributs verrouillés

## [2.49.66] - 2026-02-16 [FIX]

- 🩹 Image : Correction du préfixe Data URI manquant lors de la décompression (fix 431 Request Header Too Large)
- 🛡️ Stabilité : Détection automatique des schémas d'images corrompus dans les registres admin

## [2.49.65] - 2026-02-16 [FIX]

- 🐛 Admin : Correction critique du chargement des portraits compressés (GZIP) dans la vue Admin
- 🖼️ UI : Amélioration de la gestion des erreurs d'image (fallback silhouette)

## [2.49.64] - 2026-02-16 [FIX]

- 🖼️ Admin : Correction du bug d'affichage des portraits manquants d'Ayame (Seigneurs des Mystères)
- 🛡️ UI : Ajout d'un placeholder 'Silhouette' explicite en cas d'erreur de chargement d'image
- 🐛 Fix : Gestion robuste des IDs d'images morts dans la vue Admin

## [2.49.63] - 2026-02-16 [FIX]

- 🛡️ Schema : Correction de la structure `mysticAbilities` dans le validateur Zod (LibrarySkillEntry vs DotEntry).
- 🚀 Import : Résolution du bug empêchant l'import de fiches contenant des capacités mystiques.

## [2.49.62] - 2026-02-15 [FIX]

- 🩹 Personnage : Restauration manuelle des attributs d'Ayame (3,1,3,3...) dans le Cloud
- 🛡️ Schema : Correction de la validation Zod (mysticAbilities) pour éviter les resets de fiche
- 🔍 Sync : Information MJ ajoutée pour guider la joueuse lors de la prochaine synchro

## [2.49.61] - 2026-02-15 [FIX]

- 🐞 Sync : Correction des erreurs de typage bloquant le build
- 🔍 Debug : Ajout de logs dans la console pour le suivi de la synchronisation cloud

## [2.49.60] - 2026-02-15 [FEAT]

- 🔔 Synchronisation : Notification automatique des mises à jour disponibles sur le Cloud
- ✨ UI : Ajout d'un indicateur visuel (badge ambre pulsant) sur le bouton Sync
- 🛡️ Sync : Préservation des métadonnées de synchronisation lors des mises à jour partielles

## [2.49.59] - 2026-02-15 [FIX]

- 💾 Admin : Correction ordre de sauvegarde (Habilités avant Compétences) pour garantir les liens

## [2.49.58] - 2026-02-15 [FIX]

- 🔍 Admin : Ajout d'un filtre 'Mystique' dans la réserve de compétences
- 🐞 Admin : Correction de l'erreur d'import dans LibraryLoader

## [2.49.57] - 2026-02-15 [FEAT]

- 🔗 Admin : Possibilité de lier les compétences à des 'Habilités Mystiques'
- 🎨 UI : Nouvelle option dans l'édition de compétence pour désigner une habilité mystique
- 🗄️ BDD : Migration SQL pour supporter le lien entre compétences et habilités

# Historique Ancien (Legacy Changelog)

## [2.49.56] - 2026-02-15 [FEAT]

- 🔮 Admin : Ajout de la bibliothèque des 'Habilités Mystiques'
- 📚 Data : Configuration par défaut (Arts Martiaux, Magies, Psy, etc.)
- 🛠️ Admin : Interface de gestion complète (CRUD) pour les habilités mystiques
- 🔄 Migration : Initialisation automatique de la bibliothèque pour les campagnes existantes

# Historique Ancien (Legacy Changelog)

## [2.49.55] - 2026-02-15 [FEAT]

- ⚙️ Admin : Ajout d'un paramètre de configuration mondiale pour le coût en XP des traits
- 📊 Budget : Intégration du coût des traits dans le calcul du budget de création (Mode Points)
- ⚖️ XP : Préparation du moteur de calcul d'XP pour supporter les traits achetés après création
- 🛡️ Typage : Mise à jour du schéma de données et des réconciliateurs pour inclure le traitCost

## [2.49.54] - 2026-02-15 [FEAT]

- 📝 Terminologie : Remplacement de 'Échelon' par 'Rang' dans tout le système d'administration
- 🎨 UI : Retrait de la mention 'Niveau du Talent' dans la configuration des rangs
- 🖋️ UI : Remplacement de 'Slots' par 'Rangs Disponibles' pour une meilleure clarté sémantique

## [2.49.53] - 2026-02-15 [FEAT]

- 🌐 Admin : Traduction en français des onglets de bibliothèques (Skills, Backgrounds, Counters, Specializations)
- 🏗️ Refactoring : Amélioration de la structure des onglets de bibliothèques dans AdminApp.tsx

## [2.49.52] - 2026-02-15 [DOCS]

- 📝 Documentation : Création du guide complet sur la gestion des conflits et la synchronisation sécurisée (SYNC_CONFLICT_MANAGEMENT.md)
- 🏗️ Architecture : Synthèse des scénarios de réconciliation (Ajout/Suppression MJ, Dirty Checking)

## [2.49.51] - 2026-02-15 [FIX]

- 🐛 Fix : Correction d'une erreur de syntaxe blockante (return manquant) dans CharacterReadOnlyView
- 🛡️ Stabilité : Restauration de l'import RefreshCw manquant dans GlobalPlayersView
- 🏷️ Typage : Ajout du type RulesData manquant sur le paramètre merged de CharacterReadOnlyView

## [2.49.50] - 2026-02-15 [FEAT]

- 🏛️ Admin : Restriction du signal de mise à jour MJ aux personnages liés à une campagne uniquement
- 🧹 Clean : Retrait du bouton de mise à jour de la Master List globale pour éviter les actions hors contexte
- 🛠️ Architecture : Ajout de la prop 'allowForceUpdate' au composant CharacterReadOnlyView pour un contrôle granulaire

## [2.49.49] - 2026-02-15 [FIX]

- 🐛 Fix : Correction d'une erreur de référence sur ThematicModal dans la Master List des joueurs
- 🛡️ Stabilité : Vérification des imports manquants suite à la mise à jour des signaux MJ

## [2.49.48] - 2026-02-15 [FEAT]

- 🛡️ Synchronisation : Implémentation du '3-Way Hash Check' (Dirty Check) pour éviter d'écraser des modifications locales par mégarde
- 💬 Admin : Possibilité pour le MJ d'envoyer un message personnalisé lors d'un signal de mise à jour
- 🔔 UX : Affichage des notes du MJ et alerte de 'Version plus récente disponible' dans la modale de synchronisation du joueur
- ⚙️ Service : Optimisation du CharacterSyncService pour gérer les messages et les signatures numériques (hashes)

## [2.49.47] - 2026-02-15 [FEAT]

- 🏛️ Admin : Allègement du Registre des Destins (retrait des colonnes Col 4 et Col 8)
- ⚡ Performance : Restauration de la vue SQL simplifiée pour les résumés de personnages

## [2.49.46] - 2026-02-15 [FEAT]

- 🏛️ Admin : Intégration avancée de la Master List avec le thème 'Mystic' (texture cuir, glassmorphism)
- 📊 Data : Ajout des colonnes de compétences prioritaires (Savoirs et Arrière-plans) directement dans le registre
- ⚡ Performance : Optimisation de la vue SQL pour extraire les compétences sans charger toute la fiche
- 🔍 UX : Amélioration de la recherche et des filtres orphelins avec retour visuel thématique

## [2.49.45] - 2026-02-15 [FEAT]

- 🎨 Admin : Alignement parfait de la Master List avec le thème 'Mystic' (MotionCard et structure de table)
- 🌑 UI : Correction du fond de page en vue globale (remplacement du gris par le noir pierre pierre)
- 🖋️ Typographie : Utilisation de polices Serif et gestion fine de l'espacement pour les registres
- ✨ UX : Intégration de MotionFade sur les lignes de tableaux pour une apparition fluide

## [2.49.44] - 2026-02-15 [FEAT]

- 🎨 Admin : Application du thème 'Mystic' à la Master List des Voyageurs
- 🖋️ UI : Refonte visuelle des registres globaux (couleurs ambre/pierre et typographie serif)
- 📜 Fiche : Restauration des colonnes de compétences manquantes (Col_Comp_4 et Col_Comp_8)
- 🛡️ Fix : Robustesse accrue sur les filtres de catégories de compétences (insensibilité à la casse)

## [2.49.43] - 2026-02-15 [FEAT]

- 🖥️ Admin : Expansion verticale massive de l'onglet Joueurs
- 📏 UI : Alignement des hauteurs de listes de personnages sur le système des bibliothèques (calc(100vh - 120px))
- 🔍 UX : Élargissement de la vue détaillée des personnages (max-w-7xl) pour une meilleure vision d'ensemble
- 📊 Global : La Master List des joueurs occupe désormais tout l'espace vertical disponible

## [2.49.42] - 2026-02-15 [FEAT]

- 📏 Admin : Augmentation de la hauteur verticale des vues de listes (Bibliothèques & Personnages)
- 🖥️ UX : Utilisation optimisée de l'espace vertical pour une meilleure visibilité des données
- 📜 Sync : Ajout d'une barre de défilement sur la liste des personnages de campagne

## [2.49.41] - 2026-02-15 [FEAT]

- 🏛️ Admin : Harmonisation de la terminologie des Traits
- 🖋️ UI : Renommage de 'Éclats de Fortune' en 'Avantages' et 'Fardeaux de l'Ombre' en 'Désavantages' dans la vue ReadOnly
- 🛠️ Admin : Mise à jour des descriptifs de la bibliothèque de traits pour utiliser 'Désavantages' au lieu de 'Défauts'

## [2.49.40] - 2026-02-15 [FIX]

- ✨ UI : Correction du tronquage des tooltips via React Portals
- 🧩 UX : Ajout du composant PortalTooltip pour les variantes (Traits, Compétences, Historiques)
- 🏗️ Refactoring : Migration des listes de variantes vers le système de portail pour éviter le clipping overflow

## [2.49.39] - 2026-02-15 [FIX]

- 🐛 Fix : Correction d'une violation des règles des Hooks React (useState dans un .map)
- 🏗️ Refactoring : Extraction des items de bibliothèque en sous-composants pour stabiliser le rendu

## [2.49.38] - 2026-02-15 [FEAT]

- ✨ UX : Ajout d'infobulles dynamiques listant les variantes au survol de l'icône dans la bibliothèque
- 📚 Bibliothèques : Implémentation pour les Traits, Compétences et Arrière-plans
- 🛡️ Stabilité : Gestion du repli (fallback) vers le titre classique si aucune variante n'est définie

## [2.49.37] - 2026-02-15 [REFACTOR]

- 🛠️ Refactoring : Modularisation de RuleCalculationsService.ts
- 📏 Code Health : Extraction des calculs d'XP (xpCalculator.ts) et de Tarot (cardCalculator.ts)
- 🏗️ Architecture : Simplification du service central vers un pattern Façade

## [2.49.36] - 2026-02-15 [FIX]

- 🐛 Fix : Correction d'un plantage dans le ColumnarEditor
- 🛡️ Stabilité : Ajout d'une garde contre les accès nuls lors de l'initialisation de l'éditeur Tiptap

## [2.49.35] - 2026-02-15 [REFACTOR]

- 🛠️ Refactoring : Simplification de CampaignService.ts
- 📏 Code Health : Extraction de la logique de réconciliation des règles dans campaignReconciler.ts
- 🏗️ Architecture : Amélioration de la séparation des préoccupations entre les services de base de données et la logique métier

## [2.49.34] - 2026-02-15 [REFACTOR]

- 🛠️ Refactoring : Éclatement du hook useAttributeEditor en modules spécialisés
- 📏 Code Health : Extraction de useAttributeStructure (gestion des catégories) et useAttributePresets (gestion des préréglages)
- 🏗️ Architecture : Amélioration de la modularité et réduction de la dette technique sur l'administration des attributs

## [2.49.33] - 2026-02-15 [REFACTOR]

- 🛠️ Refactoring : Extraction de la logique de AdminTraitLibrary dans le hook useAdminTraitLibrary
- 📏 Code Health : Réduction de la taille de AdminTraitLibrary.tsx (517 -> 240 lignes)

## [2.49.32] - 2026-02-15 [REFACTOR]

- 🛠️ Refactoring : Extraction de la logique de ColumnarEditor dans des hooks spécialisés (Navigation, Dessin)
- 🛡️ Typage : Élimination des types 'any' résiduels dans les factories et le grimoire
- 🧹 Ménage : Suppression de la dépendance inutilisée 'tiptap-pagination-plus' et nettoyage des imports Admin

## [2.49.31] - 2026-02-15 [FIX]

- 📔 Journal : Suppression de la barre de défilement verticale parasite sur Windows via overflow-y: auto
- 👥 Groupe : Restauration des dimensions fixes du tableau de groupe (1484x1000px) pour préserver l'alignement avec le grimoire
- 📐 Layout : Optimisation de la gestion de l'overflow pour déléguer les barres de défilement globales au navigateur

## [2.49.30] - 2026-02-15 [FIX]

- 📱 Responsive : Activation du défilement horizontal sur les petits écrans (suppression de 'no-scrollbar')
- 📐 Layout : Ajustement des contraintes de largeur minimale pour éviter le troncage du grimoire
- 📔 Chapitres : Finalisation du renommage de la sidebar et de l'alignement des info-bulles

## [2.49.29] - 2026-02-15 [FIX]

- 🏛️ UI : Renommage de la sidebar 'Structure' en 'Chapitres' pour plus de clarté
- 🐛 Fix : Correction du troncage des info-bulles (tooltips) dans la barre latérale en les déplaçant vers la gauche

## [2.49.28] - 2026-02-15 [FEAT]

- 🖌️ Édition : Ajout d'une palette de surlignage 'Aquarelle' (5 couleurs immersives)
- 🧹 Outils : Implémentation d'une gomme (Eraser) pour effacer instantanément toute la mise en forme du texte
- ✨ UX : Activation du mode multicolore pour le surlignage Tiptap
- 🛡️ Typage : Optimisation de la configuration des extensions du livre

## [2.49.27] - 2026-02-15 [FEAT]

- 🏛️ UI : Réorganisation du journal de campagne avec une nouvelle barre latérale de structure
- 📔 Structure : Déplacement des boutons 'Chapitre' vers la sidebar latérale pour un espace de travail plus propre
- 🎨 Design : Amélioration de la barre d'outils supérieure et maintien du bouton Image dans le menu texte
- 🖋️ Édition : Rétablissement de l'affichage des numéros de listes avec style ambré thématique
- 🎨 Palette : Ajout d'une sélection d'encres (Noir, Bleu, Sang, Vert, Or, Violet) dans l'éditeur
- 🛠️ Maintenance : Migration sécurisée des imports Tiptap TextStyle vers des exports nommés

## [2.49.26] - 2026-02-15 [MAINTENANCE]

- 🏗️ Refactoring : Extraction des extensions Tiptap de `ColumnarEditor.tsx` vers `/extensions/bookExtensions.ts`
- 🏗️ Refactoring : Extraction de la logique métier de `AdminSkillLibrary.tsx` vers le hook `useAdminSkillLibrary.ts`
- 🛡️ Typage : Amélioration de la sécurité des types dans `ImageSyncResolver.ts` (supression restrictive de `any`)
- 🛡️ Typage : Typage strict des extensions Tiptap `ChapterHeading` et `BookImage`
- 🧹 Nettoyage : Remplacement des derniers `console.error` par `logger.error` dans le module de déploiement
- 📈 Maintenance : Allègement des fichiers composants volumineux pour une meilleure maintenabilité

## [2.49.25] - 2026-02-15 [FEAT]

- ✒️ Grimoire : Nouvelles fonctions d'édition (Souligné, Barré, Listes à puces/numéros)
- 📜 Grimoire : Style 'Citation' (Blockquote) immersif avec bordures et guillemets stylisés
- 🖋️ Grimoire : Surlignage type 'Encre Ambre' pour marquer les passages clés
- 📏 Grimoire : Ligne de séparation décorative (Horizontal Rule) avec icône ◈
- 🛠️ UI : Barre d'outils réorganisée en groupes logiques et icônes affinées

## [2.49.23] - 2026-02-14 [FIX]



## [2.49.22] - 2026-02-14 [FIX]



## [2.49.21] - 2026-02-14 [CHORE]



## [2.49.20] - 2026-02-14 [CHORE]



## [2.49.19] - 2026-02-14 [CHORE]



## [2.49.18] - 2026-02-14 [FEAT]

- 📖 Grimoire : Table des Matières dynamique et interactive (TOC)
- 🖼️ Grimoire : Mode 'Tracer une zone' pour insérer et dimensionner des images directement dans le livre
- 🧭 Navigation : Correction de l'accès aux Notes de Campagne et ajustement des onglets
- 👋 Campagne : Ajout d'une modale d'information de campagne (Welcome Message) pour les joueurs

## [2.49.17] - 2026-02-14 [FIX]

- 🚀 Performance : Lazy-loading du Grimoire numérique pour accélérer le chargement initial de la fiche personnage
- 🛡️ Stabilité : Résolution du warning 'flushSync' de React 18 lors de l'initialisation de TiPTap
- 📱 Responsive : Ajustement du titre principal de la fiche pour éviter les débordements sur petits écrans
- 🧹 Code Health : Nettoyage des imports statiques lourds au profit du chargement à la demande

## [2.49.16] - 2026-02-14 [CHORE]



## [2.49.15] - 2026-02-14 [FIX]



## [2.49.14] - 2026-02-14 [REFACTOR]



## [2.49.13] - 2026-02-14 [REFACTOR]



## [2.49.12] - 2026-02-14 [CHORE]



## [2.49.11] - 2026-02-14 [FIX]

- 📊 Admin : Repositionnement de la colonne 'Taille' entre 'Dernière Sync' et 'Actions'
- 📂 Admin : Ajout de la colonne 'Taille' dans la vue par campagne (`CampaignCharactersView`)
- 🎨 UI : Alignement centré et style mono pour les indicateurs de taille

# Historique Ancien (Legacy Changelog)

## [2.49.10] - 2026-02-14 [FEAT]

- 📊 Admin : Affichage de la taille des données (JSONB) pour chaque personnage dans la Master List
- ⚡ Performance : Optimisation via une vue SQL (`pg_column_size`) pour éviter de charger les données complètes lors du listing
- 📁 UI : Ajout d'une colonne 'Taille' avec formatage intelligent (o, ko, Mo)

## [2.49.9] - 2026-02-14 [FEAT]

- 📦 Stockage : Implémentation du `StorageMonitor` pour visualiser l'espace IndexedDB (Cloud / Réglages)
- 🔔 Alertes : Ajout d'indicateurs visuels globaux dans la barre de navigation (Orange >= 70%, Rouge >= 90%)
- 📱 Mobile : Intégration des alertes de stockage dans le menu mobile
- 🔄 UX : Rafraîchissement automatique des statistiques de stockage lors du focus de la page

## [2.49.8] - 2026-02-14 [REFACTOR]

- 📂 Structure : Déplacement de `src/constants.ts` vers `src/constants/app.ts` pour une meilleure organisation
- 🔗 Imports : Mise à jour de tous les chemins d'importation des constantes globales à travers le projet
- 🛠️ Build : Mise à jour du script `sync-version` pour supporter la nouvelle structure de fichiers

## [2.49.7] - 2026-02-14 [MAINTENANCE]

- 🛡️ Typage Admin : Refonte complète de la sécurité des types pour la gestion des bibliothèques (Phase C & E)
- 🧹 Code Health : Éradication massive des `@ts-ignore` et `any` dans les composants d'administration critiques
- 🔧 Hooks Admin : Typage strict des handlers génériques pour la mise à jour des compteurs et de la configuration de création
- 🧩 Composants : Amélioration de la robustesse de `AdminTraitLibrary`, `AdminBackgroundLibrary` et `AdminCounterLibrary`
- 🛡️ DB Fetches : Sécurisation des appels `DatabaseService` dans les services de chargement et d'import (Phase D)

## [2.49.6] - 2026-02-14 [REFACTOR]

- 🎨 Design System : Extraction des constantes magiques vers des variables CSS (--color-paper, --shadow-sheet, etc.)
- 🧹 Nettoyage : Standardisation du fichier index.css et suppression des redondances de couleurs hexadécimales
- 📏 Géométrie : Centralisation des dimensions de la fiche (Portrait/Paysage) et des facteurs de zoom d'impression
- 🛡️ Stabilité : Validation du build de production avec le nouveau système de variables

## [2.49.5] - 2026-02-14 [MAINTENANCE]

- 🧠 Refactoring Majeur : Optimisation complète de `SkillsEditor` et `ImportPanel` (réduction de 50% du code)
- 🏗️ Architecture : Création de hooks dédiés `useSkillsEditorActions` et `useImportLogic`
- 🧩 Composants : Extraction de `SkillCategoryEditor`, `FileDropZone`, `FileAnalysisHeader`, `MigrationSuccessModal`
- 🚀 Performance : Allègement significatif des composants critiques de la fiche joueur
- 🔧 Types : Éradication des `any` critiques dans les migrations et l'import/export (+50 corrections)
- 🛡️ Stabilité : Renforcement de la logique d'import de fichiers JSON avec typage strict

## [2.49.4] - 2026-02-14 [REFACTOR]

- 🧠 Refactoring Admin : Extraction massive de la logique vers `useDashboardActions`, `useSkillEditorActions` et `useCreationEditorActions`
- 🧩 Modularité : Décomposition des composants `AdminDashboard`, `AdminSkillsEditor` et `AdminCreationEditor` en sous-composants réutilisables
- 📉 Dette Technique : Réduction drastique de la taille des fichiers Admin principaux (jusqu'à -60% de lignes)
- 🧹 Dépendances : Suppression de `tiptap-pagination-plus` (obsolète)
- 🔧 Types : Correction et alignement des types pour `useLibraryImport` et `CandidateLine`
- 🐛 Fix : Résolution du chemin d'import critique pour `useCampaignLabels` dans l'admin
- ✅ Build : Validation finale du build de production et de l'administration

## [2.49.3] - 2026-02-14 [REFACTOR]

- 🧠 Refactoring : Extraction massive des sections de `CharacterReadOnlyView.tsx` en 10 sous-composants modulaires
- 📚 Admin : Décomposition de `AdminSpecializationLibrary.tsx` pour une meilleure maintenance
- 🚀 Performance : Réduction de la taille des fichiers composants et isolation des responsabilités UI
- 🎨 UI : Conservation de l'esthétique premium tout en simplifiant la structure du code

## [2.49.2] - 2026-02-14 [FEAT]

- Renforcement du typage strict des éditeurs Admin (Creation, Counters, Skills)
- Correction des imports de types et signatures génériques dans les composants Admin
- Suppression des types 'any' résiduels dans LibraryLoader et LibraryImporter
- Validation du build complet sans erreurs de typage

## [2.49.1] - 2026-02-14 [PATCH]

- 🛡️ Typage Strict : Amélioration de la sécurité des types dans l'éditeur de compétences Admin
- 🧹 Refactoring : Extraction de la logique de réconciliation des compétences et historiques vers `skillsReconciler.ts`
- 🔧 Hooks : Renforcement du typage pour `useCharacterSheetActions` et suppression des `any` résiduels
- 🐛 Fix : Correction des types pour `BookDocument` et `ChapterHeading`

## [2.49.0] - 2026-02-14 [MINOR]

- ☁️ Cloud Sync : Activation de la synchronisation des images (Grimoire & Portraits) vers le cloud
- 🗜️ Compression : Implémentation du pipeline WebP (qualité 50%) + GZIP pour minimiser le poids sur Supabase
- 🔄 Synchronisation : Les images vous suivent désormais sur tous vos appareils via le Cloud
- 👀 Admin : Les MJ peuvent désormais voir les illustrations des joueurs dans la vue Administrateur
- 🛡️ Architecture : Conversion automatique IDs locaux <-> Données compressées lors des cycles de Sync

## [2.48.21] - 2026-02-13 [PATCH]

- 🛠️ Fix Resizing : Correction des poignées de redimensionnement qui étaient masquées par le cadre blanc
- 📏 Précision : Décalage des poignées vers l'extérieur et augmentation de leur priorité visuelle (z-index)

## [2.48.20] - 2026-02-13 [PATCH]

- 🛠️ Fix Toolbar : Correction d'un bug qui empêchait de quitter le mode 'Recadrage' à cause de l'interception des clics par le conteneur d'image
- 🖱️ UX : La barre d'outils est désormais isolée des interactions de glissement de l'image

## [2.48.19] - 2026-02-13 [PATCH]

- 📸 Pan & Scan : Nouveau mode de recadrage interne pour les images en mode 'Remplir' (Cover)
- 🖱️ Interaction : Cliquez sur l'icône de cadrage et faites glisser l'image à l'intérieur de son cadre pour choisir la meilleure zone
- 💾 Sauvegarde : La position du cadrage (posX/posY) est désormais conservée par image
- ✨ UI : Ajout d'indices visuels lors du mode recadrage

## [2.48.18] - 2026-02-13 [PATCH]

- 🎨 Esthétique : Suppression du fond gris derrière les images (fond transparent)
- 🖼️ Design : Renforcement du cadre blanc (5px) pour un effet 'Polaroid/Photo'
- 🌗 Ombres : Amélioration des ombres portées pour une meilleure intégration sur le papier

## [2.48.17] - 2026-02-13 [PATCH]

- 🎯 Centrage : Les images centrées respectent désormais leur largeur personnalisée (plus besoin de forcer 100%)
- 📏 Correction Auto : Résolution du bug de hauteur infinie et de rendu vide pour les images verticales en mode Auto
- 💎 Stabilité : Amélioration de la robustesse CSS pour prévenir les dépendances circulaires de hauteur

## [2.48.16] - 2026-02-13 [PATCH]

- 🖱️ Déplacement : Activation du Drag & Drop natif pour déplacer les images dans le flow du texte
- 🧹 Nettoyage : Suppression du filtre Sépia (obsolète)
- 🏗️ Stabilité : Correction des types d'images et nettoyage des imports

## [2.48.15] - 2026-02-13 [PATCH]

- 🔳 Images : Ajout de poignées de redimensionnement multidirectionnelles
- ↔️ Axe Horizontal : Nouvelle barre latérale pour ajuster uniquement la largeur (avec magnétisme)
- ↕️ Axe Vertical : Nouvelle barre inférieure pour ajuster uniquement la hauteur
- 📐 Coin Diagonal : Conservation de la poignée de coin pour un redimensionnement libre
- 🖱️ Ergonomie : Curseurs contextuels indiquant l'axe de redimensionnement

## [2.48.14] - 2026-02-13 [PATCH]

- 🔳 Images : Remplacement des boutons S/M/L par un redimensionnement manuel fluide
- 🧲 Aimant Magnétique : Le redimensionnement s'accroche proprement aux tailles standards (25%, 33%, 50%, 75%, 100%)
- 📝 Habillage Texte : Le texte enroule désormais les images alignées à gauche ou à droite
- 🛡️ Limites Intelligentes : L'image s'auto-limite à 55% de largeur en mode habillage pour préserver la lisibilité

## [2.48.13] - 2026-02-13 [PATCH]

- ✨ Journal : Restauration du traçage visuel des images
- 🖱️ Mode Dessin : Cliquer sur le bouton Image permet désormais de tracer directement un rectangle sur la page pour définir la zone d'insertion
- 📏 Intelligence : La largeur et la hauteur de l'image sont automatiquement calculées d'après votre tracé
- 🎯 Précision : L'image est insérée à l'emplacement exact (paragraphe) où vous relâchez la souris

## [2.48.12] - 2026-02-13 [PATCH]

- 🔳 Images : Restauration du concept de 'Zone Rectangulaire'
- 📏 Contrôle Height : Ajout de boutons +/- pour ajuster la hauteur de l'image indépendamment de sa largeur
- 🖼️ Mode Remplissage : Ajout d'un bouton pour basculer entre 'Ajuster' (Contain) et 'Remplir' (Cover - zoom pour remplir le cadre)
- 🔄 Flexibilité : Bouton 'Auto' pour revenir au ratio naturel de l'image

## [2.48.11] - 2026-02-13 [PATCH]

- 🛠️ Fix Layout : Correction de la mise à jour dynamique de la zone de défilement lors du redimensionnement massif d'images
- 📏 Pagination : Ajout d'un système de synchronisation plus robuste pour détecter les nouvelles pages créées par le reflow CSS

## [2.48.10] - 2026-02-13 [PATCH]

- 🛠️ Fix Image : Correction de la visibilité des contrôles sur les petites images (25%)
- 📏 Mise en page : La barre d'outils de l'image peut désormais déborder du cadre et passer à la ligne si nécessaire

## [2.48.9] - 2026-02-13 [PATCH]

- 🎨 UI Image : Ajout de filtres visuels (Sépia, Noir & Blanc) pour coller à l'esthétique Grimoire
- ✏️ Légendes : Édition directe des légendes sous les images
- 🖼️ Design : Ajout d'un cadre 'photo' avec ombre portée pour dissocier l'image du parchemin

## [2.48.8] - 2026-02-13 [MINOR]

- 🖼️ Images : Phase 1 de l'optimisation du Grimoire
- 💾 Stockage : Migration du Base64 vers IndexedDB (gain de place massif dans les sauvegardes)
- 🔄 Auto-Migration : Script automatique convertissant les anciennes images lors du chargement ou de l'import
- 🛠️ Extension : Activation de l'extension BookImage avec gestion de l'alignement et de la taille

## [2.48.7] - 2026-02-13 [PATCH]

- 🛡️ Schéma : Correction critique du Zod schema pour inclure bookDocument (évite la perte de données au rechargement)
- 🔧 Typage : Amélioration du typage dans ChapterHeaderView (suppression des 'any' Tiptap)
- 📋 Task List : Mise à jour du suivi de progression du Grimoire

## [2.48.6] - 2026-02-13 [MINOR]

- 📖 Sommaire : Implémentation du Sommaire dynamique (Table des Matières) automatique en début de livre
- 🚀 Navigation : Support de la navigation par clic depuis le sommaire vers les chapitres correspondants
- 🔄 Migration : Automatisation de la migration des anciennes notes de journal vers le nouveau format Grimoire (v2)
- 🧹 Clean Up : Suppression des anciens composants de journal obsolètes (NotebookTextarea, useJournal, etc.)

## [2.48.5] - 2026-02-13 [PATCH]

- 🧠 UX : Migration vers la sélection native Tiptap (setTextSelection) pour un surlignage fiable et persistant des titres de chapitres

## [2.48.4] - 2026-02-13 [PATCH]

- 🎯 UX : Correction critique de la sélection locale des chapitres (ne saute plus au premier chapitre du livre)

## [2.48.3] - 2026-02-13 [PATCH]

- ✍️ UX : Garantie de la sélection automatique du titre (surlignage) lors de la création d'un chapitre via un cycle de rendu stabilisé

## [2.48.2] - 2026-02-13 [PATCH]

- ✍️ UX : Correction de la sélection du titre lors de l'ajout d'un chapitre (désormais correctement surligné pour modification immédiate)

## [2.48.1] - 2026-02-13 [PATCH]

- 📅 UX : L'icône calendrier ouvre désormais un sélecteur de date natif
- ✍️ UX : Auto-focus et sélection automatique du texte lors de la création d'un chapitre pour une saisie immédiate

## [2.48.0] - 2026-02-13 [MINOR]

- 📖 Journal : Implémentation de la création manuelle de Chapitres/Sessions
- 🛠️ Interface : Ajout d'une barre d'outils flottante persistante pour le formatage (Gras, Italique)
- 🔖 Structure : Les chapitres forcent désormais un saut de page (double-page) pour une organisation claire du récit
- 📅 Metadata : Intégration d'un champ Date intelligent au sein de chaque en-tête de chapitre
- 🖼️ Média : Accès rapide à l'insertion d'images via la barre d'outils

## [2.47.0] - 2026-02-13 [MINOR]

- 🎨 UI : Ajustement précis des marges (100px table, 50px toolbar) pour un rendu premium
- 🏛️ Structure : Calibration du tableau de groupe (PartyTable) sur les dimensions du grimoire (1484x1000px)
- 📜 Esthétique : Migration vers un thème unifié 'Parchemin ivoire' (#fbf4e9) pour tout le module campagne
- 🐞 Bugfix : Nettoyage automatique des pages vides lors de la suppression de texte
- 📖 Expérience : Navigation intelligente (masquage flèches aux limites) et affichage forcé par paires de pages (spreads)
- 🏗️ Robustesse : Correction du bug de décalage de 40px en fin de livre (ghost shift)

## [2.46.0] - 2026-02-13 [MAJOR]

- 📖 Journal : Implémentation du nouveau moteur 'Columnar' basé sur les colonnes CSS natives
- 🚀 Performance : Suppression de toute la logique de pagination lourde au profit d'un rendu navigateur ultra-fluide
- 🎨 UI : Nouveau design en double-page (spread) avec navigation ancrées et centrage dynamique
- 🖼️ Média : Gestion optimisée des images (évite les coupes entre colonnes) et intégration Tiptap Image
- 🧹 Clean Up : Suppression massive de code obsolète (BookLayout, FlipView, BookEditorContext, etc.)

## [2.45.22] - 2026-02-13 [FIX]

- 📖 Pagination : Correction du décalage Chapitres/Pages entre les modes Édition et Lecture
- 🔧 Core : Robustesse de la détection de coupe (posAtDOM) pour supporter les overlays graphiques
- 🧹 Code Clean : Suppression du code de debug (window.editor)

## [2.45.21] - 2026-02-13 [FIX]

- 📖 Livre : Correction de la pagination en mode Lecture. Les pages sont désormais calculées correctement même quand l'éditeur est masqué.
- 📏 Dimensions : Ajustement des hauteurs (Page: 1000px, Cadre: 1200px) pour un meilleur équilibre entre espace et pagination cohérente.

## [2.45.20] - 2026-02-13 [PATCH]

- 📖 Livre : L'ombre de la pliure centrale est maintenant limitée à la hauteur réelle des pages du livre (et ne déborde plus sur l'en-tête)
- 🏗️ Refactoring : Déplacement de la décoration de pliure dans BookFlipView pour un alignement au pixel près

## [2.45.19] - 2026-02-13 [PATCH]

- 👥 Groupe : Suppression de l'ombre de pliure centrale dans l'onglet Groupe pour une meilleure lisibilité du tableau

## [2.45.18] - 2026-02-13 [PATCH]

- 📖 Livre : Agrandissement vertical du cadre (1200px -> 1400px) et de l'effet table
- 🎨 UI : Retrait de l'ombre de pliure centrale en mode Édition pour une vue plus 'plate' et moderne

## [2.45.17] - 2026-02-13 [REFACTOR]

- 🏗️ Architecture : Refactorisation majeure de CampaignNotes (suppression de DigitalBookEditor)
- ⚡ Performance : Extraction de la logique de calcul des pages vers useBookPages
- 🎨 UI : Correction des cadres imbriqués et suppression des backgrounds redondants

## [2.45.16] - 2026-02-13 [PATCH]

- 📖 Livre : Ajout d'une page vierge à droite si le nombre de pages est impair pour respecter l'aspect 'livre ouvert'
- 🎨 UI : Masquage du numéro de page sur les pages vierges
- 📐 Layout : Alignement vertical (Top) parfait entre les modes Édition et Lecture (0px delta)

## [2.45.15] - 2026-02-12 [MINOR]

- 📖 Livre numérique : Ajout d'une séparation visuelle entre les pages en mode édition
- ✨ UX : Intégration de 'tiptap-pagination-plus' pour gérer les sauts de page dynamiquement
- 📐 Layout : Ajustement des marges et du rendu pour correspondre au format papier

## [2.45.14] - 2026-02-12 [PATCH]

- 📖 Livre : Correction de la pagination pour éviter la disparition de la dernière ligne en bas de page
- 📏 Algorithme : Prise en compte précise des marges et fusion des blocks (margin-collapse) lors du calcul des pages
- ⚡ Performance : Optimisation de la découpe des longs paragraphes par recherche binaire

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
