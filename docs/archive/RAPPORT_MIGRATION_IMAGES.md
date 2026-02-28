# Rapport : Migration des Images du Journal

## 1. Comportement de l'import (Transition "Ancien" -> "Nouveau")

L'analyse du code de migration (`src/utils/migrations/migrateCampaignNotes.ts`) révèle une **anomalie critique** dans la conversion des dimensions des images.

### Mécanisme actuel
Lors de l'import, le système tente de convertir les dimensions stockées dans l'ancien format (`CampaignNote`) vers le nouveau format (`BookDocument`).

- **Ancien format** : Les images étaient définies par une zone dessinée (ex: `NoteImage`). La propriété `width` était stockée en **pixels** (type `number`).
  - *Exemple* : Une image de 300px de large avait `width: 300`.
- **Nouveau format** : Le Grimoire utilise des dimensions en **pourcentage** (type `string`) relatives à la largeur de la colonne de texte.
  - *Exemple* : Une image prenant toute la largeur doit avoir `width: "100%"`.

### Le problème détecté
La fonction de migration convertit naïvement le nombre en chaîne de caractères en ajoutant un symbole `%` :

```typescript
// Extrait de migrateCampaignNotes.ts
width: typeof img.config?.width === 'number' 
    ? `${img.config.width}%`  // <--- ERREUR ICI
    : (img.config?.width || '100%'),
```

**Conséquence** : Une image qui faisait **300 pixels** de large dans l'ancien journal se retrouve avec une instruction de largeur de **300%** dans le nouveau Grimoire.
- Visuellement, l'image sera **3x plus large que la colonne**, ce qui brisera la mise en page (overflow) et rendra l'image difficilement redimensionnable par l'utilisateur (les poignées seront hors champ).

---

## 2. Comparatif des Dimensions Maxima

Voici les contraintes techniques pour les zones d'images dans les deux systèmes :

| Caractéristique | Ancien Journal (Canvas/Draw) | Nouveau Grimoire (CSS Columns) |
|----------------|------------------------------|--------------------------------|
| **Unité de stockage** | **Pixels** (ex: `450`) | **Pourcentage** (ex: `"100%"`) |
| **Largeur Max** | Pas de limite stricte dans les données.<br>Visuellement limité par le conteneur (~800px). | **100%** de la colonne.<br>(L’appli limite à 55% si aligné à gauche/droite). |
| **Hauteur Max** | Libre (Pixels). | Libre (Pixels), min 50px.<br>Défaut : "auto" (ratio conservé). |
| **Limite Poids** | 100MB (Quota Global IndexedDB). | 100MB (Quota Global IndexedDB). |
| **Migration** | ID conservé (Blob inchangé). | ID conservé (Blob inchangé). |

## 3. Synthèse

L'import actuel **ne gère pas correctement la conversion d'unité (px → %)**. 
Les images importées apparaîtront disproportionnées (du ratio `pixels/1` au lieu de `pixels/largeur_colonne`).

*Note : Comme demandé, aucune modification n'a été appliquée au code.*
