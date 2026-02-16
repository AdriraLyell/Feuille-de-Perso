# Plan de Correction : Migration & Contraintes Images

## Objectif
Corriger l'import des images de l'ancien journal vers le nouveau Grimoire et sécuriser l'affichage pour éviter les débordements verticaux.

## Changements Proposés

### 1. Limite de hauteur (`src/components/campaign/book/BookImageView.tsx`)
- Ajouter une contrainte `max-height: 800px` au style de l'image.
- S'assurer que le ratio est conservé (`width: auto` si nécessaire quand la hauteur est contrainte).

### 2. Correction Migration (`src/utils/migrations/migrateCampaignNotes.ts`)
- Détecter si `width` est en pixels (type `number`).
- **Logique de conversion** :
  - Si `width > 500px` (ou centré) → `100%`.
  - Sinon → convertir en pourcentage approximatif de la colonne (~600px) : `Math.min(100, Math.round((px / 600) * 100)) + '%'`.
- S'assurer que les images migrées n'ont pas de hauteur fixée qui pourrait écraser le ratio (laisser `auto` ou vide par défaut).

## Plan de Vérification

### Tests Manuels
1. **Migration** :
   - (Idéalement) Importer un JSON d'ancien personnage (si disponible).
   - À défaut : Vérifier que le code compile et que la logique TypeScript est saine.
2. **Affichage** :
   - Insérer une image très haute dans le journal.
   - Vérifier qu'elle est contrainte à 800px et ne déborde pas sur la page suivante (ou ne laisse pas une page vide).
   - Vérifier que le redimensionnement manuel fonctionne toujours.

### Validation Automatique
- exécution de `npm run typecheck` pour s'assurer qu'aucune régression de type n'est introduite.
