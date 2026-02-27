# Guide du Système de Formules (v2.96.1)

Ce document unifie la documentation technique, le guide d'utilisation et le plan de migration du moteur de règles par formules. Le système vise à transformer l'application d'un simple "calculateur passif" en un "moteur de règles actif" où le MJ a le contrôle des calculs sans modification de code.

## 1. Philosophie & Architecture

Le système sépare la **Logique** (le calcul) de l'**Objet** (le trait, le compteur ou l'effet sur la fiche). 
Au lieu de coder des effets en dur (`attribute_bonus`, `xp_bonus`), tout passe par un moteur mathématique (basé sur `expr-eval`).

L'éditeur admin propose deux entités principales :
1. **Variable MJ (Calcul Interne)** : Briques de calcul ou constantes (`PUISSANCE_FEU = Intelligence + Art_Magique`). Invisibles pour les joueurs, elles sont réutilisables dans d'autres formules.
2. **Modificateur (Effet de Trait)** : Application d'un calcul sur une cible spécifique de la fiche (Ex: `Cible: Force`, `Action: Bonus`). Modifie dynamiquement la valeur ciblée.

## 2. Guide d'Utilisation (Pour le MJ)

### Écrire une formule
Pour utiliser une variable dans une équation, tapez son **nom exact** :
- **Variables MJ** : Si vous avez créé une variable nommée `MENACE`, tapez `MENACE * 2`.
- **Variables Système** : `SCENARIOS_COUNT` (nombre de scénarios validés), `TRAIT_LEVEL` (niveau du trait portant l'effet).
- **Caractéristiques de la Fiche** : Attributs (`Force`, `Volonté`) ou Compétences (`Bagarre`, `Discrétion`).
- **Agrégats prédéfinis** : `SUM_MYSTIC` (Somme de toutes les compétences étiquetées 'Mystique').

### Créer un Agrégat Personnalisé (Nouveau)
Il est possible de créer des sommes ou opérations sur plusieurs éléments sans coder, via le mode **Agrégat** d'une Variable MJ :
- **Opération** : Somme, Compte (nombre d'éléments > 0), Maximum, Moyenne.
- **Cible** : Compétences, Attributs ou Traits.
- **Filtre** : Par Tag, Catégorie ou Nom (ex: `Cible=Traits`, `Filtre=Tag`, `Valeur=Magie`).

### Créer une Réserve Dynamique (ex: Mana)
Pour qu'un compteur ait un maximum calculé d'après les stats du personnage :
1. Créez une **Variable MJ** nommée `MAX_MANA` avec l'équation `Volonté * 5`.
2. Dans la bibliothèque des Compteurs, créez un nouveau compteur "Mana".
3. Dans **Valeur Max (Calculée)**, sélectionnez votre nouveau `MAX_MANA`.
4. Ajoutez le compteur à la fiche personnage étudiée.

## 3. État Technique Actuel (Ground Truth)

### ✅ Mécaniques fonctionnant par Formules :
- **Modifications des Caractéristiques** : Bonus d'Attributs, de Compétences et de Compteurs via `useCharacterBonuses`.
- **Forcer Variante (Nouveau)** : Les formules peuvent exiger une précision du joueur (ex: choix d'une Bagarre). Cette "Variante" devient dynamiquement la cible de l'effet.
- **Rangs de Compétence Gratuit** : Géré via l'opérateur `ADD` sur une cible de type Compétence.
- **Maîtrises de Compétence** : Géré via l'opérateur `SET` (fixe la valeur cible à x, typiquement 5) avec assistant de sélection intelligent.
- **Gain d'Expérience** : Calculs dynamiques de bonus/malus d'XP basés sur le niveau du trait ou du nombre de scénarios.
- **Réserves (Compteurs)** : Capacité maximale (`maxValue`) calculée dynamiquement ou héritée.
- **Blocage de Progression** : Géré par le type d'effet `block_skill_increase` via formule.

### 🛠️ Système d'Opérateurs
Chaque formule appliquée définit comment son résultat impacte la cible :
- **ADD** (Défaut) : Ajoute le résultat de la formule à la valeur actuelle (ex: `Physique + 2`).
- **SUB** : Soustrait le résultat (ex: `XP - (TRAIT_LEVEL * 5)`).
- **SET** : Remplace la valeur actuelle par le résultat (ex: `Maîtrise = 5`).

### ⚡ Forcer Variante (Dynamique)
Lorque l'option **"Forcer Variante"** est active dans une formule globale :
1.  **Cible Dynamique** : Le champ "Cible" de la formule ne sert plus de destination finale mais de **Catégorie de Suggestion**.
2.  **Saisie Joueur** : À l'ajout du trait, le joueur DOIT choisir une variante (ex: une compétence spécifique).
3.  **Redirection** : Le moteur redirige automatiquement l'effet vers la variante choisie par le joueur.

**Exemple : Maître d'Arme**
- Formule: `Cible="Compétence"`, `Type="Maîtrise"`, `Equation="5"`, `Forcer Variante=ON`.
- Résultat: Le joueur choisit "Épée", l'effet s'applique sur "Épée" (valeur=5).

---

## 4. Architecture & Injection de Contexte

L'injection de variables contextuelles est désormais centralisée dans `src/utils/formulaEvaluator.ts`. Le calcul d'un trait ou d'une dépense d'XP injecte automatiquement les variables suivantes sans configuration manuelle :

- `TRAIT_LEVEL` : Le niveau (1 à 5) du trait portant l'effet.
- `SCENARIOS_COUNT` : Le nombre total de scénarios validés sur la fiche.

## 5. Maintenance des Données

Pour garantir l'intégrité du système, un script de migration est disponible pour mettre à jour les fichiers JSON locaux (mode offline) :
```bash
npm run migrate:traits
```
Ce script convertit les anciens effets sémantiques (legacy) en liens vers le dictionnaire central des formules.

---

## 📅 ANNEXE : Référence des Cibles et Effets

Afin de configurer correctement une **Formule (Modificateur/Effet)**, voici la liste des paramètres attendus par le moteur de jeu :

### 🎯 Valeurs possibles pour la "CIBLE"
Le champ Cible indique au moteur quel élément de la fiche doit recevoir le résultat du calcul.
Il doit s'agir du **nom exact** de l'élément tel qu'il apparaît sur la fiche de personnage ou dans la base de données.

*   **Attributs** : Tapez le nom d'un des 9 attributs (ex: `Vigueur`). Modifie le bonus passif de l'attribut.
*   **Compétences** : Tapez le nom d'une compétence existante (ex: `Bagarre`).
*   **Compteurs / Réserves** : Tapez le nom de la jauge (ex: `Force Vitale`).
*   **Expérience** : Tapez `XP` pour cibler le montant d'expérience.
*   **Catégories (Suggestion)** : Si **Forcer Variante** est actif, vous pouvez saisir `Compétence` ou `Attribut` pour filtrer automatiquement la liste proposée au joueur.

### ⚙️ Liste des "TYPES D'EFFET"
Le Type d'effet indique au moteur si la formule doit suivre un comportement standard ou déclencher une logique spéciale.

1.  **Calcul Standard (Attribut, XP, Réserve)**
    *   **Usage** : Type par défaut pour la majorité des effets. Le moteur détecte automatiquement la cible.
    *   **Cible attendue** : Un nom d'Attribut, un Compteur ou `XP`.
    *   **Résultat** : Ajoute, soustrait ou fixe la valeur ciblée selon l'opération choisie.

2.  **Blocage de Progression**
    *   **Usage** : Empêche le joueur d'augmenter une compétence par lui-même.
    *   **Cible attendue** : Un nom de Compétence.
    *   **Note** : Bloque la compétence si le résultat du calcul est supérieur à 0.

3.  **Maîtrise (Forcer à 5)**
    *   **Usage** : Sémantique spéciale pour les traits de "Maîtrise". Déclenche un assistant (Wizard) permettant de choisir une compétence (même non possédée) et de l'ajouter automatiquement à la fiche.
    *   **Cible attendue** : Un nom de Compétence ou `Compétence` (si Forcer Variante est ON).

4.  **Rang Gratuit (Cumulable)**
    *   **Usage** : Similaire au calcul standard mais typé sémantiquement pour les rangs offerts.
    *   **Cible attendue** : Un nom de Compétence.
