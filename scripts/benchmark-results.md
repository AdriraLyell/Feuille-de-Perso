# Benchmark Results

| Model | Params | Prompt | Tok/s | OutTok | Tool | Preview |
|---|---|---|---|---|---|---|
| qwen3-coder-next | Default Ref | Logique pure | 16.06 | 130 | ❌ | Analysons la situation :  - 5 machines → 5 widgets en 5 minu... |
| qwen3-coder-next | Default Ref | Tool call (Filesystem) | 15.04 | 262 | ✅ | Voici la liste des fichiers et dossiers dans le répertoire `... |
| qwen3-coder-next | Low Temp | Logique pure | 15.64 | 118 | ❌ | Chaque machine met 5 minutes pour fabriquer 1 widget (puisqu... |
| qwen3-coder-next | Low Temp | Tool call (Filesystem) | 15.50 | 265 | ✅ | Voici la liste des fichiers et dossiers dans le répertoire `... |
| qwen3-coder-next | Fast Batch | Logique pure | 15.84 | 130 | ❌ | Analysons la situation :  - 5 machines → 5 widgets en 5 minu... |
| qwen3-coder-next | Fast Batch | Tool call (Filesystem) | 15.55 | 266 | ✅ | Voici la liste des fichiers et dossiers dans le répertoire `... |
| qwen3-coder-30b | Default Ref | Logique pure | 102.97 | 48 | ❌ | Chaque machine met 5 minutes pour fabriquer un widget. Donc,... |
| qwen3-coder-30b | Default Ref | Tool call (Filesystem) | 88.39 | 259 | ✅ | Je vais utiliser l'outil de listing de répertoire pour affic... |
| qwen3-coder-30b | Low Temp | Logique pure | 88.99 | 61 | ❌ | Chaque machine met 5 minutes pour fabriquer un widget. Donc,... |
| qwen3-coder-30b | Low Temp | Tool call (Filesystem) | 89.01 | 372 | ✅ | Je vais utiliser l'outil de listing de répertoire pour affic... |
| qwen3-coder-30b | Fast Batch | Logique pure | 103.02 | 48 | ❌ | Chaque machine met 5 minutes pour fabriquer un widget. Donc,... |
| qwen3-coder-30b | Fast Batch | Tool call (Filesystem) | 89.57 | 259 | ✅ | Je vais utiliser l'outil de listing de répertoire pour affic... |
| devstral-small-2-2512 | Default Ref | Logique pure | 16.32 | 22 | ❌ | 5 minutes. Le taux de production est constant : chaque machi... |
| devstral-small-2-2512 | Default Ref | Tool call (Filesystem) | 15.40 | 219 | ✅ | Voici la liste des fichiers et dossiers dans le répertoire `... |
| devstral-small-2-2512 | Low Temp | Logique pure | 15.82 | 28 | ❌ | Elles prendraient également 5 minutes. Le taux de production... |
| devstral-small-2-2512 | Low Temp | Tool call (Filesystem) | 15.44 | 219 | ✅ | Voici la liste des fichiers et dossiers dans le répertoire `... |
| devstral-small-2-2512 | Fast Batch | Logique pure | 16.37 | 22 | ❌ | 5 minutes. Le taux de production est constant : chaque machi... |
| devstral-small-2-2512 | Fast Batch | Tool call (Filesystem) | 15.50 | 219 | ✅ | Voici la liste des fichiers et dossiers dans le répertoire `... |
