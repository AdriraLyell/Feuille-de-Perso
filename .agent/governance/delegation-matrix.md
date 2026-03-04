# MATRICE DE DÉLÉGATION

| Tâche | Responsable | Seuil |
|-------|------------|-------|
| Architecture | Cloud | toujours |
| Plan d'implémentation | Cloud | toujours |
| Écriture de code (< 30 lignes) | Cloud | si trivial |
| Écriture de code (> 30 lignes) | Local (MCP) | obligatoire |
| Refactor (1 fichier, < 30 lignes) | Cloud | si trivial |
| Refactor (> 1 fichier ou > 30 lignes) | Local (MCP) | obligatoire |
| Analyse de fichiers (≤ 2) | Cloud | autorisé |
| Analyse de fichiers (> 2) | Local (MCP) | obligatoire |
| Documentation (< 20 lignes) | Cloud | autorisé |
| Documentation (> 20 lignes) | Local (MCP) | obligatoire |
| Commandes Git | CLI | toujours |
| CI Debug | CLI | toujours |
| Migration DB | CLI + MCP | toujours |
| Validation TypeScript | CLI | toujours |
| Validation qualitative | Cloud | toujours |