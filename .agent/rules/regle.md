---
trigger: always_on
---

# RÈGLES DE L'AGENT - Feuille de Perso

Ces règles sont la source de vérité pour le comportement de l'agent dans ce workspace.

## 1. ARCHITECTURE & PRINCIPES
- **Hybrid Database Engine** : Supabase est maître. L'app est "Online First", mais doit TOUJOURS fonctionner Offline (via `default_rules.json`).
- **Chirurgie du Code** : Modifications minimales et précises. Ne jamais réécrire un fichier complet inutilement.
- **Typage Strict** : Éviter `any` et `@ts-ignore`. Préférer les structures Zod et les types inférés.
- **UX Premium** : Interfaces vivantes, micro-animations, feedback visuel immédiat.
- **Outil de Navigation (Playwright)** : Utiliser le `browser_subagent` pour valider visuellement les changements complexes (ex: pagination, overflow, responsive) lorsque les logs ne suffisent pas.
- **Logging** : Utiliser `src/utils/logger.ts` au lieu de `console.log` directement.

## 2. DOCUMENTATION DE RÉFÉRENCE
*Consulter ces fichiers avant toute intervention majeure pour limiter l'usage des tokens :*
- [Audit & Roadmap](docs/AUDIT_SUMMARY.md) : État des dettes techniques et tâches à venir.
- [Plan Issues](docs/PLAN_ISSUES_MOYENNES.md) : Plan détaillé de résolution des issues de typage et structure.
- [Livre Numérique](docs/PLAN_LIVRE_NUMERIQUE.md) : Architecture et statut de l'éditeur de livre (Tiptap + CSS Columns).
- [Mécaniques Chapitres](docs/MECHANICS_CHAPTERS.md) : Fonctionnement technique des chapitres du grimoire.
- [Sécurité RLS](docs/RLS_POLICIES.md) : Politiques d'accès Supabase.
- [Périmètre Fonctionnel](docs/functional_scope.md) : Vision, rôles et fonctionnalités clés.
- [Schéma DB](docs/db_schema.md) : Tables Supabase et relations.
- [Schémas Zod](src/schemas/characterSchema.ts) : Structure de données pivot.
- **Archives** : `docs/archive/` contient les documents résolus ou supercédés (historique).

## 3. PROTOCOLE DE VERSIONNING (OBLIGATOIRE)
Avant chaque fin de tâche (notify_user) :
1. Incrémenter la version dans `package.json`.
2. Mettre à jour `src/data/changelog.json` avec la version, date et type de changement.
3. Vérifier l'intégrité via `npm run build`, si cela n'a pas été fait pendant le code
4. Mettre à jour les fichiers .md creer lors des phases de planifications (task.md, implementation plan, ou autres)


> Le script `npm run sync-version` synchronise automatiquement `src/constants.ts` depuis `package.json`.

## 4. GESTION DES TOKENS & DOCS
- **Maintenance Proactive** : Mettre à jour les docs de référence (`docs/AUDIT_SUMMARY.md`, `docs/RLS_POLICIES.md`) après chaque modification majeure.
- **Concision** : Toujours rester synthétique dans les docs pour limiter l'usage des tokens de contexte.
- **Source Unique** : `.agent/rules/regle.md` est l'unique source de règles de l'agent.

## 5. HYGIÈNE DU PROJET
- **Racine propre** : Ne jamais laisser de fichiers temporaires (`*.log`, `test_output*`, debug HTML) à la racine. Utiliser le `.gitignore`.
- **Pas de doublons de docs** : Un seul fichier par sujet (ex: un seul changelog = `src/data/changelog.json`).
- **Constantes** : `src/constants/` pour les constantes métier (db, theme). `src/constants.ts` pour les constantes globales (version, repo).

## 6. EMPLACEMENT DES FICHIERS
- **Code** : `src/`
- **Docs** : `docs/`
- **Règles Agent** : `.agent/rules/`
- **Brain** : `<appDataDir>/brain/<uuid>/` (Artifacts temporaires).