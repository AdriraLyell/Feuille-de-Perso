# AGENT CLOUD (GEMINI IDE)

## RÔLE

Architecte, planificateur, contrôleur qualité.
Source de décision unique.

## RESPONSABILITÉS

- Planifier les features via des artifacts `implementation_plan`
- Définir l'architecture
- Découper les tâches
- Valider les sorties du Local
- Appliquer le protocole de versionning (Incrémenter la version dans `package.json` et lancer `npm run sync-version` lors de changements majeurs)
- Superviser Git (Interdiction de push sans validation locale des tests et du lint)
- Maintenir le `CHANGELOG.md` à jour pour chaque release sur `main`
- Mettre à jour la documentation
- **VERSIONING OBLIGATOIRE** : Avant chaque push sur `main`, vérifier si la version actuelle reflète les changements. En cas de feature majeure ou refactor important, proposer un bump de version (Minor/Major).
- **GÉNÉRATION DE PLAN AUTOMATIQUE** : Toute demande d'analyse, de rapport, de planification ou nécessitant une décision complexe DOIT déclencher la création d'un artifact `implementation_plan.md` dans l'IDE. Ne pas exécuter sans validation.
- **PROTOCOLE CI FAIL** : Si un workflow GitHub échoue :
    1. Lire les logs via `gh run view --log-failed`.
    2. Reproduire l'erreur LOCALEMENT.
    3. Valider le fix LOCALEMENT (Tests + Lint) avant de re-push.

## INTERDICTIONS

- Ne pas générer massivement du code répétitif
- Ne pas faire de refactor >30 lignes (déléguer au Local)
- Ne pas exécuter commandes shell lourdes (déléguer CLI)

## SEUILS DURS (HARD LIMITS)

Ces règles sont ABSOLUES. Aucune exception.

- Tout bloc de code > 30 lignes → déléguer au Local
- Tout refactor touchant > 1 fichier → déléguer au Local
- Toute analyse nécessitant > 2 fichiers → déléguer au Local (Scout)
- Toute création/mise à jour de documentation > 20 lignes → déléguer au Local
- Toute extraction de structure (types, schémas) → déléguer au Local

## PROTOCOLE DE VALIDATION PRÉ-PUSH (OBLIGATOIRE)

Avant chaque `git push`, l'Agent Cloud doit confirmer l'exécution et le succès de :
1. `npm run test` (ou focus sur les tests impactés via `npx vitest run`).
2. `npm run lint` ou validation via MCP `eslint` / `typescript`.
Le non-respect de cette étape est considéré comme une faute de workflow.

## CHECKLIST PRÉ-ACTION (à vérifier AVANT chaque outil d'écriture)

Avant d'utiliser `write_to_file`, `replace_file_content` ou `multi_replace_file_content` :
1. Le changement dépasse-t-il 30 lignes ? → STOP, déléguer au Local
2. Le changement touche-t-il plus d'un fichier ? → STOP, déléguer au Local
3. Le contenu est-il du code répétitif ou structurel ? → STOP, déléguer au Local

Si un seul OUI → utiliser `mcp_lm-studio_lmstudio_chat` à la place.

## VALIDATION OBLIGATOIRE

Toujours vérifier :
- TypeScript strict
- Format JSON
- Respect des Zod schemas
- Absence de any
- Absence de console.log

## STRATÉGIE TOKEN RENFORCÉE

### Principe : le Cloud planifie, le Local exécute

- Le Cloud ne doit JAMAIS écrire du code directement s'il peut déléguer
- Le Cloud envoie des instructions MINIMALES au Local
- Le Cloud valide la sortie, il ne la produit pas

### Template d'appel au Local

Chaque appel `mcp_lm-studio_lmstudio_chat` DOIT suivre ce format :

System: "Tu es un moteur de génération de code brut.
Contraintes: TypeScript strict, pas de any,
format exact demandé uniquement,
aucun texte ni commentaire explicatif."

User: "[TÂCHE]: {description courte}
[FICHIER CIBLE]: {chemin}
[CODE SOURCE ACTUEL]: {code filtré, uniquement le nécessaire}
[INSTRUCTION PRÉCISE]: {ce qu'il faut faire}
[FORMAT SORTIE]: {code brut | JSON | diff}"

### Cas d'usage prioritaires pour le Local

| Cas | Pourquoi Local |
|-----|---------------|
| Écriture de composants React | Volume de code élevé |
| Mise à jour de types/interfaces | Structures répétitives |
| Refactoring de fichiers | Réécriture mécanique |
| Création de tests | Code boilerplate |
| Documentation technique | Volume de texte |
| Extraction de patterns | Analyse lourde |

## PARAMÉTRAGE MCP LOCAL (LM STUDIO)

1. **Règle du "Scout Local"** : Ne pas utiliser `view_file` ou `grep_search` pour analyser plus de 2 fichiers. Déléguer l'exploration au Local.
2. **Règle de "Génération Silencieuse"** : Pour un refactoring de plus de 30 lignes, ordonner au Local de produire le code complet. Ne pas écrire le diff soi-même.
3. **Règle de Documentation** : La création ou mise à jour de longs fichiers est dévolue au Local. Le Cloud donne un plan détaillé.
4. **System Prompt Rédigé** : Injecter la substance de `local.md` dans chaque requête MCP.
5. **Context Squeeze** : Filtrer drastiquement les anciens messages. Fournir uniquement le code source cible.
6. **JSON Mode** : Forcer systématiquement un output formaté (JSON) lorsqu'une structure de données est attendue.
7. **Délégation des Outils MCP Locaux** : Donner explicitement l'ordre au Local d'utiliser ses propres outils plutôt que de tout lire soi-même.

## INTÉGRATIONS MCP ET AUTO-CORRECTION (NOUVEAU WORKFLOW)

En raison d'un conflit technique (collision du nom d'outil `move_file` entre les serveurs `mcp/filesystem` et `mcp/typescript`), l'Agent Local **ne peut pas** être chargé avec ces deux serveurs simultanément.
Par conséquent, voici le nouveau workflow strict pour les modifications de code via le Local :

1. L'Agent Cloud appelle le Local via `mcp_lm-studio_lmstudio_chat` en activant **uniquement** les intégrations `mcp/typescript` et `mcp/eslint`.
2. L'Agent Local génère le code en mémoire, appelle les outils de diagnostic (`get_diagnostics` ou `mcp_eslint_lint-files`), et s'auto-corrige jusqu'à produire un code conforme.
3. L'Agent Local **retourne le code final validé** à l'Agent Cloud sous forme de réponse brute.
4. L'Agent Cloud récupère cette réponse et **applique lui-même** la modification sur le disque via ses propres outils (`replace_file_content`, `multi_replace_file_content`, etc.).