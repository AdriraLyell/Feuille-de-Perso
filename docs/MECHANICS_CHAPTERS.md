# Mécaniques des Chapitres du Journal

Ce document détaille le fonctionnement technique et les règles de mise en place des chapitres dans le module "Journal de Campagne".

## 1. Modèle de Données (Tiptap Node)

Le chapitre est un **Nœud Tiptap** personnalisé nommé `chapterHeading`.
- **Fichier** : `src/extensions/chapterHeading.ts`
- **Type** : `block` (bloc de contenu)
- **Contenu** : `inline*` (texte modifiable)

### Attributs
Chaque chapitre possède les métadonnées suivantes :
- `id` : Identifiant unique.
- `date` : Date du chapitre (par défaut : `new Date()`).
- `isBookmarked` : Booléen pour les signets (par défaut : `false`).

### Commandes
- `setChapterHeading` : Convertit la sélection en chapitre.
- `toggleChapterHeading` : Bascule entre Chapitre et Paragraphe.

---

## 2. Représentation Visuelle (NodeView)

Le rendu est géré par un composant React **NodeView** pour permettre l'interactivité.
- **Fichier** : `src/components/campaign/book/ChapterHeaderView.tsx`

### Interface Utilisateur
- **Date** : Input date à gauche (`font-handwriting`).
- **Titre** : Zone de contenu Tiptap (`font-serif`, `text-2xl`, `bold`).
- **Actions** : Bouton "Signet" (Bookmark) apparaissant au survol (`hover`).

### Structure DOM
```html
<div class="chapter-header-wrapper ...">
  <div class="flex ...">
    <!-- Date + Icone -->
    <!-- Contenu Titre -->
    <!-- Bouton Bookmark -->
  </div>
</div>
```

---

## 3. Règles de Mise en Page (CSS)

Le style est défini pour garantir que le chapitre marque une rupture visuelle forte.
- **Fichier** : `src/components/campaign/book/BookStyles.css`

### Sauts de Page
Le CSS force le navigateur (ou le moteur d'impression) à considérer le chapitre comme un début de page :
```css
.chapter-header-wrapper {
    break-inside: avoid;        /* Empêche de couper le titre en deux */
    break-before: page;         /* Force une nouvelle page AVANT le chapitre */
    page-break-before: always;  /* Compatibilité héritée */
    width: 100%;
}
```

---

## 4. Moteur de Pagination (CSS Columns)

La pagination est gérée nativement par le CSS via `ColumnarEditor.tsx`.

### Mécanisme
- **Fichier** : `src/components/campaign/book/ColumnarEditor.tsx`
- **Méthode** : CSS `column-width` + `column-gap` créent des colonnes = pages
- **Chapitres** : Le CSS `break-before: page` sur `.chapter-header-wrapper` force un saut de colonne automatique

### Sommaire Dynamique
- **Fichier** : `src/components/campaign/book/useBookTableOfContents.ts`
- Le hook scanne le document Tiptap pour collecter les noeuds `chapterHeading`
- Génère les entrées du sommaire (titre, date) affichées par `BookTableOfContents.tsx`
- Navigation par clic vers le chapitre correspondant

### Navigation
- Affichage par paires de pages (spreads) avec scroll programmatique
- Flèches gauche/droite pour naviguer entre les spreads

---

## 5. Résumé pour le Développement

1. **Pour créer un chapitre** : Utiliser la commande `editor.chain().setChapterHeading().run()`.
2. **Pour modifier le style** : Éditer `ChapterHeaderView.tsx` (structure) ou `BookStyles.css` (layout).
3. **Pour la pagination** : Gérée nativement par CSS Columns dans `ColumnarEditor.tsx`. Le CSS `break-before: page` sur `.chapter-header-wrapper` force les sauts de colonne.
