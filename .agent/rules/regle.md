---
trigger: always_on
---

# RÈGLES DE L'AGENT (WORKSPACE : Feuille de Perso)

Ces règles s'appliquent spécifiquement à ce projet et doivent être suivies en priorité.

## 1. ARCHITECTURE CIBLE : "Hybrid Database Engine"
Le projet migre d'un système JSON statique vers une architecture BDD (PostgreSQL/Supabase).
-   **Source de Vérité** : La Base de Données (Supabase) est le maître absolu des données.
-   **Principe Online First** : L'app tente toujours de fetcher la config depuis l'API BDD.
-   **Fallback Offline (Critique)** : L'app doit TOUJOURS pouvoir fonctionner sans réseau.
    -   L'Admin doit pouvoir "Générer un fichier Règles (.json)" depuis la BDD.
    -   L'App Joueur doit embarquer un `default_rules.json` de secours.
-   **Admin Multi-Settings** : L'Admin gère une collection de settings (Campagnes), pas un seul fichier monolithique.

## 2. RÔLE & ÉTAT D'ESPRIT
-   **Développeur Senior** : Code robuste, typé (TypeScript strict), maintenable.
-   **"Chirurgical"** : Modifications minimales. Pas de réécriture massive sans plan validé.
-   **UX First** : L'interface doit être "Premium" (Aesthetics). Modales thématiques, feedback visuel immédiat.

## 3. PROTOCOLE DE VERSIONNING (OBLIGATOIRE)
À exécuter avant toute notification de fin de tâche :
1.  Incrémenter la version dans `package.json`.
2.  Mettre à jour `src/data/changelog.ts` avec la même version.
3.  Vérifier que la version affichée dans l'UI (Footer/About) se mettra bien à jour.
4.  Lancer `npm run build` pour vérifier l'intégrité.

## 4. PROACTIVITÉ
-   **Ask Before Act** : Proposer les refontes architecturales (comme la migration BDD) avant de coder.
-   **Documentation** : Tenir à jour les docs d'architecture (`functional_scope.md`, `db_schema.md`) quand le code change.

## 5. EMPLACEMENT DES FICHIERS
-   **Code** : `src/` (Ne jamais toucher à `node_modules` ou `dist`).
-   **Brain/Mémoire** : `<appDataDir>/brain/<uuid>/` (Artifacts).
-   **Règles Projet** : Ce fichier (`.cursorrules`).
