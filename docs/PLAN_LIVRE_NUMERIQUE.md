# Éditeur de Livre Numérique — Statut Implémentation

> **Date** : 2026-02-14 | **Statut** : IMPLÉMENTÉ (v2.49.0) | **Difficulté** : 5/10

---

## Contexte

Le journal de campagne a été entièrement réécrit en mode "Livre numérique" via un moteur d'édition Tiptap couplé à une pagination CSS native (`column-width`).

**Choix technologique final** : Après évaluation de `tiptap-pagination-plus` (boucles de recalcul infinies, incompatibilité NodeView React), nous avons opté pour une approche **CSS Columns Native** offrant un reflow instantané géré nativement par le navigateur.

> Historique de l'évaluation pagination : voir `docs/archive/AUDIT_PAGINATION.md`

---

## Architecture Globale

### Approche : Document Tiptap unique + CSS Columns Native

- **Un seul document ProseMirror** contient tout le contenu (chapitres, texte, images) dans un flux continu
- **CSS `column-width` + `column-gap`** gère la pagination automatiquement (navigateur natif)
- **Extensions custom** : `chapterHeading.ts` et `bookImage.ts` avec NodeViews React
- **L'affichage livre** utilise scroll programmatique + navigation par paires de pages (spreads)

### Schéma du Document Tiptap

```
doc
  +-- chapterHeading     (node custom - frontière de chapitre, date + titre)
  +-- paragraph           (standard)
  +-- heading             (h2, h3 - sous-titres)
  +-- bulletList / orderedList (standard)
  +-- blockquote          (standard)
  +-- bookImage           (node custom atom - image IndexedDB avec resize/pan)
  +-- horizontalRule      (standard)
```

---

## Inventaire des Fichiers

### Extensions Tiptap (`src/extensions/`)

| Fichier | Rôle | Statut |
|---------|------|--------|
| `chapterHeading.ts` | Node block custom : date, level. Contenu inline (titre éditable). Force saut de page via CSS `break-before: page`. NodeView React. | ✅ DONE |
| `bookImage.ts` | Node atom block : imageId (IndexedDB), width, height, align, caption, filter, fit, posX, posY. NodeView React avec chargement async, resize, pan & scan. Draggable. | ✅ DONE |

### Composants (`src/components/campaign/book/`)

| Fichier | Rôle | Statut |
|---------|------|--------|
| `ColumnarEditor.tsx` | Éditeur principal. Instance Tiptap. Orchestre les sous-composants (`Toolbar`, `PageBackground`, `ChaptersSidebar`). | ✅ DONE |
| `ColumnarEditorStyles.tsx` | Composant injectant les styles CSS globaux spécifiques au livre (ProseMirror, colonnes, effets). | ✅ DONE |
| `BookImageView.tsx` | NodeView React du `bookImage` : chargement IndexedDB, handles de resize, contrôles align/fit/filter/delete, pan & scan. | ✅ DONE |
| `ChapterHeaderView.tsx` | NodeView React du `chapterHeading` : bordure décorative, sélecteur de date, titre éditable. | ✅ DONE |
| `BookTableOfContents.tsx` | Sommaire auto-généré depuis les noeuds `chapterHeading`. Affiche titre et date. | ✅ DONE |
| `useBookTableOfContents.ts` | Hook scannant le document Tiptap pour collecter les `chapterHeading`. | ✅ DONE |

### Sous-composants (`src/components/campaign/book/components/`)

| Fichier | Rôle | Statut |
|---------|------|--------|
| `BookEditorToolbar.tsx` | Barre d'outils riche (Gras, Couleur, Highlight, Listes, Images, Alignement). | ✅ DONE |
| `BookPageBackground.tsx` | Rendu visuel des pages (fond parchemin, numérotation, ombres de reliure). | ✅ DONE |
| `BookChapterSidebar.tsx` | Barre latérale pour l'insertion rapide de chapitres. | ✅ DONE |

### Utilitaires

| Fichier | Rôle | Statut |
|---------|------|--------|
| `src/utils/book/BookPageSplitter.ts` | Découpe HTML en pages pour rendu. | ✅ DONE |

### Migration

| Fichier | Rôle | Statut |
|---------|------|--------|
| `src/utils/migrations/migrateCampaignNotes.ts` | Convertit `campaignNotes[]` (ancien format HTML) en `bookDocument` (Tiptap JSON). Regroupe les pages en chapitres. | ✅ DONE |
| `src/utils/migrations/migrateBookImages.ts` | Migration runtime : convertit les images base64 inline en références IndexedDB. | ✅ DONE |

### Fichiers Modifiés

| Fichier | Modification | Statut |
|---------|-------------|--------|
| `src/components/CampaignNotes.tsx` | Onglet Journal utilise `ColumnarEditor`. Onglet Groupe conservé. | ✅ DONE |
| `src/schemas/characterSchema.ts` | Ajout `BookDocumentSchema` et champ `bookDocument` dans CharacterSheetData. | ✅ DONE |
| `src/utils/migrations/registry.ts` | Version 2 avec `migrateCampaignNotes` et `migrateBookImages`. | ✅ DONE |

### Fichiers Supprimés (ancien système journal)

| Fichier | Raison |
|---------|--------|
| `JournalPage.tsx` | Remplacé par ColumnarEditor |
| `NotebookTextarea.tsx` | Remplacé par Tiptap |
| `RichTextToolbar.tsx` | Toolbar intégrée dans ColumnarEditor |
| `TableOfContents.tsx` | Remplacé par BookTableOfContents |
| `useJournal.ts` | Logique intégrée dans ColumnarEditor |

---

## Moteur de Pagination — CSS Columns Native

### Fonctionnement

- `ColumnarEditor.tsx` utilise `column-width` et `column-gap` sur le conteneur Tiptap
- Le contenu s'écoule naturellement entre les colonnes (= pages)
- Les chapitres forcent un saut via `break-before: page` CSS sur `.chapter-header-wrapper`
- La navigation par paires (spreads) est gérée par scroll programmatique

### Avantages vs PaginationPlus

- Pas de boucle de recalcul (reflow instantané par le navigateur)
- Compatible avec tous les NodeViews React (pas de conflit DOM)
- Pas de dépendance externe pour la pagination
- Performance native sans debounce nécessaire

### Dimensions

- Page : fond parchemin (#fdfbf7), texture papier
- Affichage spread : 2 pages côte à côte, spine central avec ombres

---

## Gestion des Images

- **Stockage** : IndexedDB via `imageDB.ts` (local) + compression WebP+GZIP pour sync cloud
- **Dans le document** : noeud `bookImage` atom avec `imageId` référençant IndexedDB
- **Alignement** :
  - `center` : bloc pleine largeur
  - `left`/`right` : CSS `float`, le texte s'écoule autour (habillage)
- **Contrôles** : resize (poignées magnétiques 25/50/100%), pan & scan (posX/posY), filtre (grayscale), fit (cover/contain/fill)
- **Sync cloud** : `ImageSyncResolver.ts` résout les IDs locaux ↔ données compressées lors de la synchronisation

---

## Dépendances

```bash
npm install @tiptap/extension-text-align
```

> **Note** : `tiptap-pagination-plus` est encore dans `package.json` mais n'est plus importé. À retirer lors d'un nettoyage futur.

---

## Statut des Phases

| Phase | Description | Statut |
|-------|-------------|--------|
| 1 — Fondation | Extensions Tiptap + setup éditeur | ✅ DONE |
| 2 — Pagination | CSS Columns natif (PaginationPlus abandonné) | ✅ DONE |
| 3 — Rendu Livre | ColumnarEditor + styles CSS (spreads, parchemin) | ✅ DONE |
| 4 — Images & Chapitres | BookImageView + ChapterHeaderView + resize/pan | ✅ DONE |
| 5 — Migration | migrateCampaignNotes + migrateBookImages | ✅ DONE |
| 6 — Tests | Tests manuels OK. Tests E2E dédiés à écrire. | 🚧 PARTIEL |

### Reste à faire

- [ ] Tests E2E du flux complet (édition, navigation, images)
- [ ] Cas limites : document vide, 1 page, 50+ pages avec images
- [ ] En-tête de page optionnel (date + chapitre sur les pages concernées)
- [ ] Retirer `tiptap-pagination-plus` de package.json

---

## Vérification

1. **Édition** : Taper du texte, vérifier le reflow entre colonnes/pages
2. **Chapitres** : Insérer un chapitre, vérifier qu'il apparaît dans le sommaire
3. **Images** : Insérer une image alignée, vérifier l'habillage texte et le resize
4. **Navigation** : Naviguer par flèches entre spreads
5. **Migration** : Charger un personnage avec d'anciennes notes, vérifier la conversion
6. **Sync cloud** : Synchroniser un personnage avec images, vérifier compression/décompression
7. **Onglet Groupe** : Vérifier que le `PartyTable` fonctionne toujours

---

## Références

- Détails techniques des chapitres : `docs/MECHANICS_CHAPTERS.md`
- Historique pagination : `docs/archive/AUDIT_PAGINATION.md`
- Plan original (théorique) : `docs/archive/plan_editeur_livre.md`
