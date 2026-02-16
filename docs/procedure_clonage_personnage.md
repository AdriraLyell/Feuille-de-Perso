# Procédure de Copie de Personnage (Clonage)

Cette procédure permet de dupliquer un personnage existant, de le renommer et de l'attribuer à un nouveau joueur directement en base de données via SQL.

## Requête SQL de Référence

```sql
INSERT INTO characters (
  setting_id,
  character_name,
  player_name,
  created_by,
  data
)
SELECT
  setting_id,
  'NOM_NOUVEAU_PERSONNAGE', -- ex: 'Akane'
  'NOM_JOUEUR_CIBLE',      -- ex: 'Polo'
  'UUID_UTILISATEUR_CIBLE', -- ex: 'd109fff7-bacf-4091-a017-96cbeee58897'
  jsonb_set(
    jsonb_set(
      jsonb_set(
        data,
        '{header,name}',
        '"NOM_NOUVEAU_PERSONNAGE"'
      ),
      '{header,player}',
      '"NOM_JOUEUR_CIBLE"'
    ),
    '{syncInfo}',
    '{}'::jsonb -- On réinitialise les infos de synchro pour éviter les conflits
  )
FROM characters
WHERE id = 'UUID_PERSONNAGE_SOURCE';
```

## Étapes de Validation

1.  **Identifier la source** : Trouver l'ID du personnage à copier via :
    `SELECT id, character_name FROM characters WHERE character_name = 'Source';`
2.  **Identifier la cible** : Trouver l'UUID du joueur cible dans `auth.users` ou via ses autres fiches :
    `SELECT created_by FROM characters WHERE player_name = 'Polo' LIMIT 1;`
3.  **Exécuter** : Adapter et lancer la requête `INSERT INTO ... SELECT`.
4.  **Vérifier** : S'assurer que le JSON interne (`data->header->name`) et les colonnes de la table (`character_name`) sont cohérents.

## Cas d'usage : Migration MJ
Très utile pour créer des pré-tirés ou transférer la propriété d'un personnage sans passer par l'export/import de fichiers JSON.
