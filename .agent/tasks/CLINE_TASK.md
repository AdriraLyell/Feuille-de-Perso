# Mission : Test de collaboration Antigravity + Cline

## Objectif
Remplacer les logs standards par le logger du projet dans un fichier spécifique pour valider ton accès aux outils.

## Étapes
1. **Fichier cible** : `src/components/CharacterSheetSpecializations.tsx`.
2. **Action** : 
   - Identifie les `console.log` et `console.error`.
   - Remplace-les par les méthodes du logger (`logger.info`, `logger.error`).
   - Importe le logger depuis `src/utils/logger`.
3. **Vérification** :
   - Lance un `npm run build` via ton terminal pour vérifier que le code est toujours valide.
   - Vérifie que le bouton de promotion dans le même fichier possède bien le style CSS `cursor: pointer`.

Une fois terminé, informe l'utilisateur pour que je (Antigravity) puisse valider le résultat.
