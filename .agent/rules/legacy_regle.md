---
trigger: manual
---

# RÈGLES DE L'AGENT - Feuille de Perso

Ces règles sont la source de vérité pour le comportement de l'agent dans ce workspace.

Privilégier le Francais dans les docs/rapports/plans

## 1. ARCHITECTURE & PRINCIPES
- **Hybrid Database Engine** : Supabase est maître. L'app est "Online First", mais doit TOUJOURS fonctionner Offline (via `src/data/defaultRules.ts`).
- **Chirurgie du Code** : Modifications minimales et précises. Ne jamais réécrire un fichier complet inutilement pour préserver l'historique et limiter l'usage de tokens. Utiliser l'outil `replace_file_content` pour les éditions chirurgicales.

- **Typage Strict** : Éviter `any` et `@ts-ignore`. Préférer les structures Zod et les types inférés.
- **UX Premium** : Interfaces vivantes, micro-animations, feedback visuel immédiat.
- **Outil de Navigation (Playwright)** : Utiliser le `browser_subagent` pour valider visuellement les changements complexes (ex: pagination, overflow, responsive) lorsque les logs ne suffisent pas.
- **GitHub CLI (gh)** : Utiliser `gh run view --log` pour déboguer les échecs de CI directement depuis le terminal.
- **Supabase & DB Tools** : Utiliser le serveur MCP `supabase-mcp-server` pour les migrations (`apply_migration`), l'inspection (`execute_sql`) et les logs système.
- **Type Safety & Linting** : Utiliser les serveurs MCP `typescript` (renommage de symboles, diagnostics) et `eslint` pour garantir la conformité avant chaque commit.
- **Logging** : Utiliser `src/utils/logger.ts` au lieu de `console.log` directement.

## 1.1 ORCHESTRATION AGENT LOCAL (LM Studio / Qwen3)
- **Surveillance de la Qualité** : L'agent Cloud (Antigravity) doit SYSTÉMATIQUEMENT vérifier les sorties de l'agent local.
- **Vérification Critique** : Tester la validité du code (syntaxe, types), le respect du format (ex: JSON) et la pertinence du contenu par rapport au profil (`local_agent_config.json`).
- **Alerte & Ajustement** : Si la qualité est insuffisante (hallucinations, politesse excessive, imprécision), l'agent DOIT en informer l'utilisateur et proposer un ajustement des paramètres (`temperature`, `max_tokens`) ou du prompt.
- **Optimisation de Quota** : Privilégier le "Circuit Court" (écriture directe sur disque par le local) pour minimiser les tokens Cloud.

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
3. Vérifier l'intégrité via `npm run build`, si cela n'a pas été fait pendant le code.
4. Mettre à jour les fichiers .md créés lors des phases de planifications (task.md, implementation plan, ou autres).
5. Commiter sur `develop`. Ne jamais pousser sur `main` (ou créer de PR vers `main`) sans demande explicite de l'utilisateur.


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
- **Workflows Agent** : `.agent/workflows/`
- **Brain** : `<appDataDir>/brain/<uuid>/` (Artifacts temporaires).


## 7. WORKFLOW GIT (GitHub Flow+)

### Dépôts Distants (Remotes)
- **Principal** : `Feuille-de-Perso` (et NON `origin`). Toujours vérifier le nom via `git remote -v`.

### Gestion des Erreurs & Verrous (Windows/PS)
- **Fichiers Verrouillés** : Avant tout `git checkout` ou `merge`, arrêter le serveur de dev (`npm run dev`) et tuer les processus node résiduels (`taskkill /F /IM node.exe`).
- **Prompts Interactifs** : Si une commande Git s'interrompt avec une question (ex: `Should I try again? (y/n)`), **ne jamais répondre en boucle**. Arrêter la commande, identifier le verrou (souvent un dossier comme `sql/` ou `.context/` ouvert par un autre processus) et en informer l'utilisateur.
- **Restauration** : En cas d'échec de bascule de branche laissant des fichiers supprimés, utiliser `git restore .` pour stabiliser l'index avant de réessayer.

### Branches
- **`main`** : Production. **Interdit de push ou PR sans demande explicite.**
- **`develop`** : Intégration. Push direct autorisé. CI sans déploiement.
- **`feat/*`, `fix/*`, `chore/*`, `docs/*`** : Branches de travail éphémères depuis `develop`.
- **`hotfix/*`** : Corrections urgentes depuis `main` (bypass develop).

### Nommage des branches
`type/description-courte` en lowercase avec tirets. Ex: `feat/book-page-animations`, `fix/xp-counter-overflow`.

### Stratégie de merge
- `feat/*` → `develop` : **Squash merge** (1 commit propre par feature).
- `develop` → `main` : **Merge commit** (traçabilité, le merge commit marque le déploiement).
- `hotfix/*` → `main` : **Squash merge**, puis cherry-pick vers `develop`.

### Commits
Format : `type(scope): résumé impératif court` (max ~72 chars).
- Types : `feat`, `fix`, `chore`, `ci`, `docs`, `refactor`, `test`, `perf`
- Scopes : `admin`, `book`, `character`, `sync`, `ui`, `rules`

### CI/CD
- `.github/workflows/ci.yml` : Branches non-production (type check, lint, tests unitaires, E2E Playwright, build).
- `.github/workflows/deploy.yml` : Production `main` (idem + déploiement GitHub Pages).