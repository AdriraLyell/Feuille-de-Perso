> **Date** : 2026-02-13 | **Statut** : COMPLETED (v2.47.0) | **Difficulte** : 5/10

---

## Contexte

Le journal a été entièrement réécrit en mode "Livre numérique" via un moteur d'édition moderne (Tiptap) couplé à une pagination CSS native (`column-width`). 

**Choix technologique final** : Après évaluation de `tiptap-pagination-plus`, nous avons opté pour une approche **Columnar CSS Native** car elle offre un reflow instantané sans les boucles de calcul infinies des extensions DOM-heavy.

---

## Architecture Globale

### Approche : Document Tiptap unique + `tiptap-pagination-plus` + Affichage livre

- **Un seul document ProseMirror** contient tout le contenu (chapitres, texte, images) dans un flux continu
- **`tiptap-pagination-plus`** calcule automatiquement les coupures de page par mesure DOM
- **Un adaptateur custom** ajoute les regles metier (chapitres, sommaire, orphelines, images)
- **L'affichage livre** utilise scroll programmatique + navigation par paires de pages

### Schema du Document Tiptap

```
doc
  +-- chapterHeading     (node custom - frontiere de chapitre, date + titre)
  +-- paragraph           (standard)
  +-- heading             (h2, h3 - sous-titres)
  +-- bulletList / orderedList (standard)
  +-- blockquote          (standard)
  +-- bookImage           (node custom atom - image IndexedDB)
  +-- horizontalRule      (standard)
  +-- ...
```

---

## Fichiers a Creer

### Extensions Tiptap (`src/extensions/`)

| Fichier | Role |
|---------|------|
| `chapterHeading.ts` | Node block custom : id, date, showHeader, isBookmarked. Contenu inline (titre editable). Force un saut de page avant. NodeView React avec date picker et toggle bookmark. |
| `bookImage.ts` | Node atom block : imageId, placementId, width, height, align (left/right/center), fit (cover/contain/fill). NodeView React avec chargement async IndexedDB, resize, controles d'alignement/suppression. |

### Composants (`src/components/campaign/book/`)

| Fichier | Role |
|---------|------|
| `DigitalBookEditor.tsx` | Orchestrateur principal. Cree l'instance Tiptap avec `tiptap-pagination-plus`, gere persistence debounced vers CharacterSheetData. |
| `BookEditorContext.tsx` | Context React fournissant : `editor`, `paginationResult`, `currentSpreadIndex`, `tocEntries`, navigation. |
| `BookSpreadView.tsx` | Layout livre : container `overflow: hidden` montrant 2 pages, scroll programmatique par paires, fleches de navigation. Superpose le cadre visuel (spine, ombres, texture papier, numeros de page). |
| `BookToolbar.tsx` | Barre d'outils Tiptap : gras, italique, souligne, listes, titres h2/h3, alignement, insertion chapitre, insertion image, signet. |
| `BookTableOfContents.tsx` | Page sommaire auto-generee depuis les `chapterHeading` nodes. Affiche titre, date et numero de page. Cliquable pour naviguer. |
| `ChapterHeaderView.tsx` | NodeView React du `chapterHeading` : bordure decorative, selecteur de date, texte de titre, toggle signet. |
| `BookImageView.tsx` | NodeView React du `bookImage` : chargement IndexedDB, decompression GZIP, handles de resize, controles align/fit/delete. |

### Services et Hooks

| Fichier | Role |
|---------|------|
| `src/services/BookPaginationAdapter.ts` | Surcouche sur `tiptap-pagination-plus`. Ajoute : sauts de chapitre forces, controle orphelines/veuves, images non coupees, generation du sommaire. Retourne `PageBreakInfo[]` et `TOCEntry[]`. |
| `src/hooks/useBookEditor.ts` | Setup Tiptap : extensions, configuration, persistence debounced vers CharacterSheetData. |
| `src/hooks/useBookPagination.ts` | Lie l'editeur au moteur de pagination : recalcul debounced (200ms) a chaque `onUpdate`, expose le resultat via context. |

### Migration

| Fichier | Role |
|---------|------|
| `src/utils/migrations/migrateBookDocument.ts` | Convertit `campaignNotes[]` (HTML) en document ProseMirror JSON via `generateJSON()` de Tiptap. Regroupe les pages non-continuation en chapitres. Convertit les images en nodes `bookImage`. |

---

## Fichiers a Modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/CampaignNotes.tsx` | Remplacer le contenu de l'onglet Journal par `<DigitalBookEditor />`. Conserver l'onglet Groupe tel quel. Conserver le shell visuel (barre d'onglets, cadre du livre, ombres). |
| `src/types/campaign.ts` | Ajouter `BookDocument { content: JSONContent; formatVersion: number; }` |
| `src/types/character.ts` | Ajouter `bookDocument?: BookDocument` dans `CharacterSheetData` |
| `src/utils/migrations/registry.ts` | Ajouter version 2 avec `migrateBookDocument`. `CURRENT_SCHEMA_VERSION = 2` |
| `src/components/campaign/constants.ts` | Ajouter constantes : `PAGE_CONTENT_WIDTH = 722`, `PAGE_CONTENT_HEIGHT = 980`, `CHAPTER_HEADER_HEIGHT = 62` |

---

## Moteur de Pagination - Architecture

**Dimensions** : contenu utile = 722 x 980px (page 772x1092 - padding 25x56).

### Couche 1 : `tiptap-pagination-plus` (page breaks automatiques)

Configuration de base :
```typescript
PaginationPlus.configure({
  pageHeight: 980,
  pageWidth: 722,
  pageGap: 0,        // pas de gap visuel (on gere l'affichage nous-memes)
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
})
```

La bibliotheque gere automatiquement :
- Le calcul des positions de page breaks par mesure DOM
- Le recalcul a chaque modification du document
- L'insertion de separateurs visuels (que nous remplacerons par notre propre rendu)

### Couche 2 : `BookPaginationAdapter.ts` (logique metier custom)

Surcouche sur les page breaks de `tiptap-pagination-plus` :
1. **Sauts de chapitre forces** : avant chaque noeud `chapterHeading`, forcer un saut de page
2. **Controle orphelines/veuves** : si <2 lignes sur une page, repousser le paragraphe entier
3. **Images non coupees** : si une image chevauche une frontiere de page, la pousser a la page suivante
4. **Generation du sommaire** : traverser le document ProseMirror, collecter les `chapterHeading` avec leurs numeros de page calcules
5. **Headers de chapitre** : soustraire 62px de la hauteur utile sur les pages avec en-tete

### Performance
- Debounce 200ms sur `onUpdate`
- Rendu virtualise : 3 spreads max (precedent, courant, suivant)
- Lazy loading des images distantes du viewport courant

---

## Dependances a Installer

```bash
npm install @tiptap/extension-text-align tiptap-pagination-plus
```

1. **`@tiptap/extension-text-align`** (~5KB gzipped) : alignement de texte (gauche, centre, droite, justifie).

2. **`tiptap-pagination-plus`** (MIT, compatible Tiptap v3) : **Bibliotheque cle pour le moteur de pagination.** Cette extension gere le calcul automatique des page breaks par mesure de hauteur du contenu DOM. Elle supporte :
   - Dimensions en pixels (`pageHeight`, `pageWidth`) - compatible avec nos 722x980
   - Headers/footers personnalisables par page avec HTML
   - Gap et marges configurables
   - Tables qui se coupent entre pages

> **Alternatives evaluees et ecartees :**
> - `tiptap-extension-pagination` (hugs7) : approche structurelle (noeuds Page) - plus rigide pour le reflow
> - `@tiptap-pro/extension-pages` : extension officielle Tiptap mais **payante**
> - `prosemirror-pagination` : ancien (93 stars), derniere mise a jour lointaine

---

## Migration des Donnees

**Strategie** : schema version 1 -> 2

1. Si `bookDocument` existe deja : ne rien faire
2. Si `campaignNotes[]` est vide : ne rien faire
3. Pour chaque `CampaignNoteEntry` :
   - Si `isContinuation === false` : creer un noeud `chapterHeading` avec `id`, `date`, `title`, `isBookmarked`
   - Convertir `content` (HTML string) en noeuds ProseMirror via `generateJSON(html, extensions)`
   - Convertir chaque `images[]` en noeud `bookImage`
4. Assembler en `{ type: 'doc', content: [...] }`
5. Stocker dans `bookDocument: { content, formatVersion: 1 }`

L'ancien `campaignNotes[]` **n'est pas supprime** (rollback possible).

---

## Gestion des Images

- **Stockage** : inchange (IndexedDB via `imageDB.ts` + compression GZIP via `ImageCompressionService.ts`)
- **Dans le document** : noeud `bookImage` atom avec `imageId` referencant IndexedDB
- **Alignement** :
  - `center` : bloc pleine largeur, hauteur ajoutee directement au budget de page
  - `left`/`right` : CSS `float` + `shape-outside`, le texte s'ecoule autour
- **Contrainte** : si le bas d'une image depasse la limite de page, l'image entiere passe a la page suivante (pas de coupure d'image)
- **Upload** : toolbar "Inserer Image" -> compression -> IndexedDB -> insertion noeud `bookImage` au curseur

---

## Affichage Double Page

### Approche : Scroll continu + Navigation par paires (Google Docs style)

`tiptap-pagination-plus` rend l'editeur comme un document continu vertical avec des separateurs (gaps) entre chaque page. **Pas de viewport clippe** : l'editeur fonctionne naturellement avec curseur et selection standards.

**Layout** :
1. L'editeur Tiptap est rendu dans un container scrollable vertical avec `tiptap-pagination-plus` configure pour nos dimensions (722x980px)
2. Chaque page est une section du flux vertical : fond blanc (#fdfbf7), padding 25/56px, texture papier
3. Les gaps entre pages simulent l'espace du livre (spine + marge)
4. Le container parent a `overflow: hidden` et montre exactement **2 pages de haut** cote a cote

**Mise en page livre** :
- Le container est style en CSS Grid ou Flex pour afficher **2 colonnes** (gauche + droite)
- `tiptap-pagination-plus` rend les pages verticalement ; notre CSS les reorganise visuellement en paires horizontales
- Alternativement : 2 instances de rendu (gauche = pages impaires, droite = pages paires) partageant le meme document Tiptap via scroll offset

**Navigation** :
- Fleches gauche/droite naviguent entre les spreads (paires de pages)
- Scroll programmatique vers `spreadIndex * (pageHeight + gap)`
- Clavier : Ctrl+Left / Ctrl+Right
- L'edition est directe : cliquer sur n'importe quelle page visible et taper
- Le curseur fonctionne naturellement - pas de gestion speciale necessaire

**Sommaire** : page 0 (toujours a gauche sur le premier spread), rendu comme composant React separe

**Cadre livre** : superpose en CSS (spine avec ombres, bordures, numeros de page en `position: absolute`)

---

## Sequence d'Implementation

### Phase 1 : Fondation (jours 1-2) ✅
- [x] Installer `@tiptap/extension-text-align` et `tiptap-pagination-plus`
- [x] Creer les extensions `chapterHeading` et `bookImage` (squelettes)
- [x] Creer `useBookEditor.ts` avec setup Tiptap basique + `tiptap-pagination-plus`
- [x] Creer `DigitalBookEditor.tsx` rendant un editeur continu pagine basique
- [x] Brancher dans `CampaignNotes.tsx` (onglet journal)

### Phase 2 : Moteur de Pagination (Partiel / Désactivé temporairement) ⚠️
- [x] Creer `BookPaginationAdapter.ts` par-dessus `tiptap-pagination-plus`
- [x] Ajouter les sauts de chapitre forces (Intégré dans ChapterHeading)
- [x] Ajouter le controle orphelines/veuves (Via CSS global)
- [x] Creer `useBookPagination.ts` (Intégré dans `useBookEditor`)
- [ ] Generer le sommaire automatique depuis les page breaks calcules (Suspendu pour stabilité)
- [ ] Tests unitaires de l'adaptateur
- **Note** : `PaginationPlus` a été désactivé temporairement car il causait des boucles de rendu et d'édition. Fallback vers un document continu unique.

### Phase 3 : Rendu Livre (jours 6-8) 🚧
- [ ] Creer `BookEditorContext.tsx`
- [x] Creer `BookToolbar.tsx` - Ajout boutons insertion Chapitre et Image
- [x] Styles CSS (`BookStyles.css`) - Support mode page unique et double page (CSS Columns)
- [ ] Animation de tourne-page (`PageTurnAnimation.tsx`)

### Phase 4 : Images & Chapitres (jours 9-11) 🚧
- [x] Extension `bookImage.ts` (taille, alignement, legende, stockage IDB)
- [x] Composant `BookImageView.tsx` (Rendu image depuis IDB, handles partiels)
- [x] Extension `chapterHeading.ts` (design, date, signet)
- [x] Composant `ChapterHeaderView.tsx` (Input date, Bookmark toggle)
- [x] Integration Toolbar (Boutons Chapitre/Image fonctionnels)
- [ ] En-tete de page optionnel (date + chapitre sur les pages concernees)

### Phase 5 : Migration & Integration (jours 12-14)
- Creer `migrateBookDocument.ts`
- Mettre a jour `registry.ts` (version 2)
- Tester la migration avec des donnees reelles
- Mettre a jour types (`campaign.ts`, `character.ts`)
- Verifier que l'onglet Groupe fonctionne toujours

### Phase 6 : Tests & Robustesse (jours 15-17)
- Tests E2E du flux complet
- Cas limites : document vide, 1 page, 50+ pages
- Performance avec beaucoup d'images
- Export/import avec le nouveau format

---

## Evaluation de Faisabilite

| Composant | Difficulte | Risque |
|-----------|-----------|--------|
| Setup Tiptap + pagination-plus | Facile | Faible - packages deja installes / npm install |
| Extension ChapterHeading | Moyen | Faible - pattern standard NodeView |
| Extension BookImage | Moyen | Moyen - chargement async IndexedDB |
| Moteur de pagination | Moyen | Moyen - `tiptap-pagination-plus` + adaptateur custom |
| Affichage livre double-page | Moyen | Moyen - scroll continu + navigation par paires, pas de clipping |
| Layout livre (cadre visuel) | Facile | Faible - reutilise le design existant |
| Sommaire auto | Facile | Faible - traversee du document |
| Toolbar | Facile | Faible - API Tiptap standard |
| Migration donnees | Moyen | Moyen - HTML legacy inconsistant |

**Verdict global : FAISABLE, difficulte 5/10.** L'utilisation de `tiptap-pagination-plus` pour la pagination ET l'approche "scroll continu avec navigation par paires" (au lieu du viewport clippe) reduisent considerablement les risques. Plus aucun composant n'est a risque "Eleve".

**Strategie de mitigation** : Si l'approche single-editor s'avere trop instable, un fallback est possible vers un editeur Tiptap par page (version amelioree du systeme actuel, mais avec Tiptap au lieu de contenteditable). On perdrait le reflow cross-page automatique mais on gagnerait quand meme toutes les autres ameliorations.

---

## Verification

1. **Edition** : Taper du texte sur une page, verifier que le reflow repousse le contenu sur les pages suivantes
2. **Chapitres** : Inserer un chapitre, verifier qu'il apparait dans le sommaire avec le bon numero de page
3. **Images** : Inserer une image alignee a droite, verifier que le texte s'ecoule autour sans chevauchement
4. **Navigation** : Naviguer par fleches entre les spreads, cliquer sur une page pour l'editer directement
5. **En-tete** : Activer l'en-tete de chapitre avec date et titre, verifier la coherence sur les pages du chapitre
6. **Migration** : Charger un personnage existant avec des notes de campagne, verifier que le contenu et les images sont preserves
7. **Onglet Groupe** : Verifier que le `PartyTable` fonctionne toujours identiquement
8. **Tests** : `npm run test` - tous les tests existants passent + nouveaux tests pour `BookPaginationAdapter`

---

## References

- [tiptap-pagination-plus](https://github.com/RomikMakavana/tiptap-pagination-plus) - Bibliotheque de pagination Tiptap (MIT)
- [tiptap-extension-pagination](https://github.com/hugs7/tiptap-extension-pagination) - Alternative structurelle (ecartee)
- [Tiptap Discussion #5960](https://github.com/ueberdosis/tiptap/discussions/5960) - Community Pagination
- [Building a Print-Perfect Editor (Jan 2026)](https://medium.com/@sanyammunot03/building-a-print-perfect-document-editor-with-tiptap-next-js-0bcbaafa28c7)
- [Badon Writer](https://discuss.prosemirror.net/t/a-new-text-editor-with-pagination/6667) - Editeur pagine ProseMirror (CSS float technique)
- [itzbharathh/TipTap-Editor](https://github.com/itzbharathh/TipTap-Editor) - Editeur pagine CSS-based
- [Paged.js](https://github.com/pagedjs/pagedjs) - Polyfill CSS Paged Media
