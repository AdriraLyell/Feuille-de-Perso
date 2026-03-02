# MODE CIRCUIT COURT

## Activation

- Génération > 30 lignes de code
- Refactor touchant > 1 fichier
- Analyse de plus de 2 fichiers
- Création/mise à jour de documentation technique > 20 lignes
- Extraction de types ou de schémas

## Procédure

1. Cloud écrit plan minimal
2. Local (MCP) génère code sur disque
3. Cloud valide uniquement la diff
4. CLI commit

## VIOLATION = ÉCHEC

Si le Cloud exécute lui-même une tâche dépassant ces seuils,
c'est considéré comme un ÉCHEC de gouvernance, même si le résultat est correct.
Le Cloud doit s'auto-corriger immédiatement et déléguer au Local.

## Objectif

Minimiser l'usage token Cloud.