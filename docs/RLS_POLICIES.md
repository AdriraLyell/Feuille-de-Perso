# Row Level Security (RLS) Policies

Ce document résume les politiques de sécurité appliquées à la base de données Supabase pour le projet.

## Principes Généraux
-   **Anonyme/Joueur** : Accès en lecture seule sur les réglages publics et les bibliothèques associées.
-   **Administrateur** : Accès total (CRUD) sur toutes les tables. La vérification se fait via `auth.jwt() -> 'role' = 'admin'`.

## Détail par Table

### 1. `game_settings`
-   **SELECT** : Autorisé si `is_public = true` OU si l'utilisateur est admin.
-   **INSERT/UPDATE/DELETE** : Réservé aux administrateurs.

### 2. Bibliothèques (`libraries_traits`, `libraries_skills`, etc.) et Variantes (`*_variants`)
-   **SELECT** : Autorisé pour tous les utilisateurs authentifiés.
-   **INSERT/UPDATE/DELETE** : Réservé aux administrateurs.

### 3. Relations (`rel_setting_skills`, etc.)
-   **SELECT** : Autorisé pour tous.
-   **INSERT/UPDATE/DELETE** : Réservé aux administrateurs.

### 4. `characters`
-   **SELECT** : Autorisé pour :
    1.  Le créateur du personnage (basé sur `created_by`).
    2.  L'administrateur.
    3.  **Tous** (anonymes inclus) si `created_by` est NULL (permet le chargement des fiches "legacy" ou créées sans compte).
-   **INSERT/UPDATE/DELETE** : Autorisé pour le créateur ou l'administrateur.

## Authentification & Rôles
Le système de sécurité vérifie le rôle `admin` dans deux emplacements du jeton JWT :
1. `auth.jwt() -> 'app_metadata' -> 'role'`
2. `auth.jwt() -> 'user_metadata' -> 'role'` (Fallback)

> [!IMPORTANT]
> Après avoir promu un utilisateur en SQL, celui-ci **doit se déconnecter et se reconnecter** pour que ses nouvelles autorisations soient prises en compte dans son jeton de session.

## Commandes de Promotion Admin
```sql
-- Promotion via app_metadata (Recommandé)
UPDATE auth.users 
SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}' 
WHERE email = 'user@example.com';
```
