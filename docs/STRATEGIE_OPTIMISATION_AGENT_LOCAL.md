# Stratégie d'Optimisation des Tokens via Agent Local (Qwen3)

Ce document détaille comment réduire l'utilisation du quota Cloud en déléguant des tâches à l'instance LM Studio locale.

## 1. Délégation par Nature de Tâche
- **Agent Local (Qwen3)** : Rédaction de contenu (lore, descriptions), génération de données de test, analyse de logs bruts, formatage de fichiers CSS ou schémas volumineux.
- **Agent Cloud (Antigravity)** : Pilotage des outils (Git, Supabase, Playwright), décisions architecturales complexes, validation finale.

## 2. Flux de "Circuit Court"
- L'agent local écrit ses résultats volumineux directement dans des fichiers temporaires (ex: `src/data/temp_gen.json`).
- Antigravity ne lit qu'un résumé ou valide la structure via un outil local, évitant de charger des milliers de tokens dans le contexte Cloud.

## 3. Paramétrage des Appels (LM Studio)
- **Température basse (0.1)** pour les tâches de code (TypeScript/Zod) afin d'assurer la précision et limiter les tokens inutiles.
- **Max Tokens dynamique** : Limite stricte à 500 tokens par défaut, augmentée uniquement pour la génération de contenu textuel JdR.

## 4. Templates de Prompts Locaux
- Stockage des "System Prompts" complexes dans `.agent/prompts_local/`.
- Les prompts sont injectés par script sans jamais transiter par le quota Cloud.

## 5. Auto-Review Locale
- Utilisation de Qwen3 pour relire et valider les propositions d'Antigravity avant application.
- Seul le résultat de la validation ("OK/NOT OK") est remonté au Cloud.
