# Schéma de Base de Données

## 1. Tables de Configuration (Settings)
- **`game_settings`** : Stocke les campagnes et leurs configurations JSON (`configurations`, `definitions`).
- **`attribute_presets`** : Préréglages de structures d'attributs.

## 2. Bibliothèques (Libraries)
- **`libraries_traits`** : Avantages et Désavantages.
- **`libraries_skills`** : Compétences de base.
- **`libraries_specializations`** : Spécialisations liées aux compétences.
- **`libraries_backgrounds`** : Arrière-plans.
- **`libraries_counters`** : Compteurs (Volonté, etc.).
- **`libraries_traits_variants`** : Variantes de noms pour les Traits (ex: "Peureux" pour "Phobie").
- **`libraries_skills_variants`** : Variantes de noms pour les Compétences.
- **`libraries_backgrounds_variants`** : Variantes de noms pour les Arrière-plans.

## 3. Relations (Mappings)
Lient les éléments des bibliothèques à une campagne spécifique :
- `rel_setting_traits`
- `rel_setting_skills`
- `rel_setting_specializations`
- `rel_setting_backgrounds`
- `rel_setting_counters`

## 4. Données Utilisateurs
- **`characters`** : Fiches de personnages synchronisées au format JSON. Les images (portraits et grimoire) sont compressées inline dans le JSON via `ImageSyncResolver.ts` (WebP + GZIP).
- **`character_images`** : ~~Images de personnages compressées.~~ **DÉPRÉCIÉ** — Plus référencé dans le code source depuis v2.49.0. Les images sont désormais gérées inline dans le champ JSON de `characters`. La table peut encore exister en base mais n'est plus utilisée.

## 5. Schémas de données (Zod)
Les interfaces de la base de données sont mappées via TypeScript (`src/types/database.ts`) et validées via Zod dans l'application :
- `CharacterSheetDataSchema` (dans `src/schemas/characterSchema.ts`) : Source de vérité pour la structure d'une fiche.
- `rulesSchema.ts` : Source de vérité pour une configuration de campagne.
