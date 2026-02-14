# Plan d’implémentation — Éditeur de livre paginé

## Objectif global

Créer un éditeur de livre numérique avec :

- pagination dynamique
- reflow automatique
- affichage double-page
- images inline
- chapitres + sommaire
- entêtes facultatives

Le document logique est la source de vérité.  
Les pages sont toujours calculées, jamais stockées.

---

## Architecture générale

```
édition utilisateur
→ document structuré (AST)
→ moteur de layout paginé
→ cache par chapitre
→ renderer double-page
```

Séparation stricte :

- modèle du document ≠ pages ≠ affichage

---

## Phase 1 — Modèle de document

### Objectif

Créer un document structuré indépendant du rendu.

### Types de nœuds

- document
- chapitre
- paragraphe
- texte
- image
- entête
- métadonnées

### Contraintes

- insertion/suppression texte
- insertion/suppression images
- édition chapitres
- undo/redo
- aucune notion de page dans le modèle

---

## Phase 2 — Moteur de layout paginé

### Objectif

Transformer le document en pages calculées.

### Structure d’une page

- largeur fixe
- hauteur fixe
- marges
- zone entête

### Algorithme

```
pour chaque chapitre:
    créer page vide
    cursor = haut de la zone écrivable

    pour chaque bloc:
        mesurer hauteur bloc

        si bloc > espace restant:
            sauvegarder page
            nouvelle page
            cursor = haut

        placer bloc
        cursor += hauteur
```

Blocs :

- paragraphe texte
- image
- entête

---

## Phase 3 — Layout incrémental

### Objectif

Limiter les recalculs.

### Règles

Lors d’une édition :

1. identifier chapitre impacté
2. recalculer ce chapitre
3. recascade chapitres suivants
4. garder le cache des chapitres précédents

---

## Phase 4 — Renderer double-page

### Objectif

Afficher le livre comme un ouvrage physique.

### Règles

- affichage paysage
- 2 pages côte à côte
- navigation par paires
- virtualisation
- rendu pages visibles + buffer

Les pages ne sont pas éditables directement.

---

## Phase 5 — Gestion des images

- images = blocs inline
- pas de superposition texte
- respect marges
- texte se réorganise automatiquement

Si l’image ne rentre pas :

→ nouvelle page

---

## Phase 6 — Entêtes et chapitres

### Entêtes

- facultatives
- date + titre
- générées automatiquement
- n’affectent pas le flux texte

### Chapitres

- ID stable
- sommaire généré automatiquement
- mise à jour après reflow

---

## Phase 7 — Pipeline d’édition

```
édition utilisateur
→ mise à jour document
→ chapitre marqué dirty
→ recalcul layout chapitre
→ recascade pagination
→ mise à jour renderer
```

---

## Phase 8 — Contraintes de performance

- pagination par chapitre
- cache de layout
- rendu virtualisé
- recomposition déterministe
- pas de dépendance DOM pour layout

---

## Résultat attendu

- reflow stable
- pagination cohérente
- édition fluide
- affichage livre réaliste
- logique traitement de texte moderne

Les pages sont toujours un résultat calculé.
Jamais la structure source.
