---
trigger: always_on
---

Règles de GEMINI Cli : [cli.md](./cli.md)
Règles de GEMINI Cloud (Antigravity) : [cloud.md](./cloud.md)
Règles de LM Studio (via MCP): [local.md](./local.md)

**RÈGLE TRANSVERSE : PLAN FIRST**
Toute tâche complexe ou analytique nécessite un `implementation_plan` (artifact IDE) validé par l'utilisateur avant toute modification.

**GESTION DES CAPTURES D'ÉCRAN**
- Le dossier `temp_screenshots/` à la racine est réservé aux captures d'écran de l'utilisateur.
- Gemini CLI doit systématiquement vérifier ce dossier si l'utilisateur mentionne un bug visuel ou une erreur de console en capture.
- Les fichiers dans ce dossier sont temporaires et peuvent être supprimés lors des phases de nettoyage du projet.

**RÈGLE TRANSVERSE : ZÉRO ÉCHEC CI**
Interdiction stricte de `push` sans avoir validé localement :
1. **Tests** : `npm run test` (ou `npx vitest run {file}`) sur les fichiers impactés ET la suite globale.
2. **Lint** : `npm run lint` ou outil MCP `eslint` sur les fichiers modifiés.
En cas d'échec de la CI sur GitHub, la priorité absolue (Task #1) est la reproduction locale de l'erreur avant toute tentative de fix.

**PHASE DE NETTOYAGE (MAINTENANCE)**
- Lors des commandes de "nettoyage", le dossier `temp_screenshots/` doit être vidé.
- Les fichiers de log temporaires et les résidus de build doivent aussi être nettoyés.