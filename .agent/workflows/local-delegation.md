# Workflow de Délégation Local Agent (Qwen3)

Ce workflow définit comment déléguer des tâches à l'agent local LM Studio pour optimiser les tokens Cloud et la performance.

## 1. Préparation du Contexte
- Extraire uniquement les fichiers ou définitions nécessaires (Type Definitions, Interfaces).
- Tronquer les fichiers de données volumineux si seule la structure compte.

## 2. Choix du Profil (via `local_agent_config.json`)
- **TECH_STRICT** : Pour le refactoring, la correction de bugs techniques, ou la génération de code Zod/TypeScript.
- **LORE_CREATIVE** : Pour la rédaction de lore, descriptions d'objets ou dePNJ.

## 3. Appel de l'Outil
// turbo
Utiliser `lmstudio_chat` avec les paramètres suivants :
- `system_prompt` : Charger l'un des fichiers de `.agent/prompts_local/`.
- `integrations` : Toujours inclure `["mcp/filesystem"]` si l'agent doit écrire directement le résultat.

## 4. Récupération & Validation
- Si l'agent a écrit un fichier direct : Vérifier son existence et sa validité via `ls` ou `cat`.
- Si l'agent a répondu en JSON : Parser le résultat et l'intégrer.

## 5. Critères de Délégation Automatique
- Refactoring de plus de 200 lignes.
- Génération de jeux de données de test (> 50 entrées).
- Analyse de logs bruts de plus de 100 lignes.
