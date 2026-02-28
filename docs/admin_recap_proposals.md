# Propositions : Vue Admin - Récapitulatif Comparatif HTML des Joueurs

L'objectif est de fournir un outil au Gardien (depuis l'interface d'administration) permettant de générer une vue synthétique et compacte de tous les personnages d'une chronique (setting), idéalement pour les comparer d'un seul coup d'œil.

---

## 1. Déclenchement (Où se trouve le bouton)

### Option 1 : Depuis la carte de la Chronique (Dashboard)
Ajout d'une nouvelle icône d'action contextuelle directement sur la carte de chaque chronique (à côté de "Dupliquer", "Cacher", "Supprimer").
- **Action :** "Générer la Synthèse des Personnages" (icône œil ou impression).
- **Pro :** Accès direct depuis le point d'entrée naturel du Gardien.

### Option 2 : Depuis la modale de conflit / info de campagne
Lorsque l'on clique sur une chronique ou via un nouveau menu "Gérer les joueurs" dédié à chaque carte.
- **Pro :** Évite de surcharger la carte de campagne d'icônes principales si l'espace manque.

---

## 2. Le Format de Sortie

Au vu de la demande (données compactes, persos côte à côte pour comparatif), le format le plus adapté est :

### La Matrice Comparative HTML (Générée à la volée)
- **Principe :** Le clic depuis l'admin ne crée pas un PDF téléchargé ou n'imprime pas directement. Au lieu de cela, il génère une page HTML statique (complète avec son CSS en dur) et propose soit :
    1.  De l'ouvrir dans un **nouvel onglet** (idéal pour un deuxième écran).
    2.  De **télécharger** ce fichier `matrice-[nom-chronique].html`.
- **Pourquoi ce format :** Le format "nouvel onglet / fichier HTML statique" permet d'appliquer une grille fluide (CSS Grid / Flexbox) qui s'adaptera à l'écran du Gardien, ce qui est parfait pour une matrice "côte à côte". L'impression papier d'un tableau comparatif est souvent catastrophique (colonnes coupées), un affichage écran dédié est bien supérieur.

---

## 3. Dispositions Visuelles (Layout)

L'enjeu est la compacité extrême. Voici deux approches pour afficher les données :

### Proposition A : La Grille "Carte d'Identité" (Style Kanban)
Chaque personnage est représenté sous forme de "carte" très dense. Les cartes sont alignées côte à côte.
- **Organisation :** 3 à 5 cartes par ligne selon la taille de l'écran.
- **Contenu par carte (Très dense) :**
    - **Header :** `Nom du PJ (Nom Joueur)`
    - **Jauges (Mini-barres) :** `Santé: 8/10 | Volonté: 1/5 | XP: 12`
    - **Attributs (Ligne unique) :** `FOR:2 DEX:3 INT:1 SOC:4`
    - **Top Compétences :** Seulement le top 5 ou 6 des compétences les plus élevées, format "pill" ou texte très petit (ex: `Athlétisme 3`, `Mêlée 2`).
    - **Spécialités :** Liste par mots-clés séparés par virgules.
    - **Traits (Icones ou Abréviés) :** `(+) Chanceux | (-) Borgne`
- **Avantage :** Lisible, design modulaire, s'adapte à tous les écrans.
- **Inconvénient :** La comparaison "ligne à ligne" d'une statistique spécifique (ex: qui a la meilleure Perception ?) demande de balayer l'écran des yeux.

### Proposition B : Le Grand Tableau Croisé (La Matrice "Maitre du Jeu")
Inspiré des vieux écrans de maitre du jeu, c'est un tableau de données pur et dur avec entêtes fixées.
- **Organisation :** Les Personnages en Colonnes (Vertical), Les Statistiques en Lignes (Horizontal). Ou l'inverse.
- **Structure (Colonnes = Personnages) :**
    - **Ligne 1 (Entête) :** PJ 1 | PJ 2 | PJ 3 | PJ 4
    - **Ligne 2 (Concept) :** Combattant | Erudit | Voleur | Mage
    - **Ligne 3 (Vitals) :** 10 HP / 5 Vol | 6 HP / 8 Vol | ...
    - **Ligne 4 (Attributs) :** F:3 D:2 I:1 | F:1 D:2 I:4 | ...
    - **Ligne 5 (Compétences - Filtre Croisé) *:** *C'est la partie complexe.* On n'affiche en liste que les compétences que *quelqu'un* possède dans le groupe. Si personne n'a "Pilotage", la ligne disparait.
- **Avantage :** Comparaison instantanée ("Ok, c'est X qui a la meilleure Discrétion").
- **Inconvénient :** Les listes de spécialisations et avantages textuels sont verbeuses et "cassent" la structure stricte d'un tableau de chiffres. Difficile à lire si le groupe possède des compétences très hétérogènes.

### Proposition C : Le Format Hybride (L'Écran de Contrôle)
On combine les forces des deux.
- **Haut de page : Le "Radar" du Groupe (Tableau)**
    - Un tableau strict et compact uniquement pour les chiffres durs : **Vitals (Santé/Volonté), Expérience, et Attributs.**
- **Bas de page : Les "Dossiers" (Grille de cartes)**
    - Sous forme de cartes (Prop A), on liste pour chaque PJ les données descriptives : **Arrière-plans, Top Compétences, Spécialités, Avantages/Désavantages.**

---

## 4. Choix Techniques Recommandés pour la suite

1.  **Génération statique :** Créer un composant React "fantôme" (sans état, que de l'affichage) alimenté par un tableau de données PJ.
2.  **Styles in-line / CSS embarqué :** S'assurer que le HTML généré contient ses propres classes utilitaires (soit du Tailwind compilé injecté, soit un bloc `<style>` propre) pour garantir que le fichier soit 100% autonome et "offline-proof" une fois téléchargé par le MJ.
3.  **Filtrage Intelligent :** La logique de préparation des données devra écarter les compétences à 0, ne garder que le nom court des traits, et peut-être tronquer les descriptions trop longues pour forcer la compacité.
