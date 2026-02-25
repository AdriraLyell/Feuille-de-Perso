# Plan de Migration : Vers le "Tout Formule" (v2.90+)

Ce plan vise à unifier 100% des mécaniques sous un moteur unique, extensible et simple d'utilisation pour le MJ.

## 1. Vision Cible
Transformer le système d'un "Calculateur passif" en un "Moteur de règles actif".

### Avant (Rigide)
- Trait : Type=`formula`, Cible=`Physique`, Formule=`id_bonus_force`. 
- MJ doit choisir 3 champs.
- Mots-clés limités au code source.

### Après (Fluide)
- Trait : `Lien Formule` = `Bonus de Force (Global)`.
- MJ choisit **1 seul champ**. La formule "sait" qu'elle cible la `Force`.
- MJ crée ses propres mots-clés (ex: `MENACE = (Tueur + Combat) * 2`).

---

## 2. Étapes de Mise en Place (Ordre de priorité)

### Étape A : Registre de "Variables MJ"
- **Objectif** : Sortir les mots-clés du code source.
- **Principe** : Ajouter un onglet "Variables" dans l'éditeur MJ.
- **Exemple** : 
    - Nom : `PUISSANCE_FEU`
    - Formule : `Intelligence + Art_Magique`
    - *Résultat* : `PUISSANCE_FEU` devient utilisable dans TOUTES les autres formules.

### Étape B : Formules "Auto-Portantes" (Simplification UX)
- **Objectif** : Réduire la charge mentale lors de la création de traits.
- **Principe** : Déplacer la `Cible` et la `Catégorie d'Effet` dans la définition de la formule globale.
- **Conséquence** : Dans l'éditeur de trait, on ne sélectionne plus qu'une ligne.
- **Exemple** : Sélectionner "Santé Robuste" applique automatiquement `Vigueur * 3` sur la réserve `PV`.

### Étape C : Abstraction des Effets Sémantiques
- **Objectif** : Supprimer les types `master_skill` ou `block_skill_increase` du code.
- **Principe** :
    - Le **Blocage** devient une formule dont le résultat > 0 active l'interdiction.
    - Le **Rang Gratuit** devient une formule s'ajoutant au calcul final de la compétence.

### Étape D : Migration Unifiée
- **Objectif** : Nettoyer la base de données.
- **Faisabilité** : Techniquement, **oui**, tous les effets mécaniques actuels (`attribute_bonus`, `counter_max_bonus`, `xp_bonus`, `block_skill_increase`, `free_skill_rank`, `master_skill`) peuvent être traduits en formules ou en types de formules. Le script de migration créera automatiquement les entrées correspondantes dans le Dictionnaire MJ pour chaque variation trouvée.

---

## 3. Exemples Réels de Simplification

| Trait Réel | Effet Actuel (Legacy) | Migration : Formule Globale Dédiée |
|:---|:---|:---|
| **Héros d'Exception** | `xp_bonus: 20` | `Bonus Héros` (Cible: XP, Formule: 20) |
| **Maître** | `free_skill_rank: 5` | `Maîtrise` (Cible: Dynamique, Formule: 5) |
| **Action Suppl.** | *Narratif* | `Action Combat` (Cible: Actions, Formule: 1) |

---

## 4. Détail des Formules Globales (Dictionnaire MJ)

Voici comment chaque mécanique sera définie "sous le capot" dans le dictionnaire central pour que le MJ n'ait plus qu'à lier le trait à son nom.

### A. "Bonus Héros" (Ex: Héros d'Exception)
*   **Identifiant** : `HERO_XP`
*   **Cible** : `XP_TOTAL` (Variable système gérant le capital d'expérience)
*   **Logique** : `ADD` (Additionne le résultat au total)
*   **Formule** : `20`
*   **UX Trait** : Le MJ sélectionne simplement "Bonus Héros" dans une liste.

### B. "Maîtrise" (Ex: Maître)
*   **Identifiant** : `SKILL_MASTERY`
*   **Cible** : `TARGET_SKILL` (Variable dynamique choisie lors de l'ajout du trait)
*   **Logique** : `SET_RANK` (Nouvel opérateur : force la valeur au lieu d'ajouter)
*   **Formule** : `5`
*   **UX Trait** : Le MJ lie le trait à "Maîtrise". Le joueur choisit sa compétence.

## 5. Fonctionnement Technique (Sous le Capot)

Pour répondre à la question "est-ce hardcodé ?", voici la distinction entre le **Moteur** et les **Données**.

### A. Les Variables Système (Ex: `XP_TOTAL`)
Ce ne sont pas des valeurs figées, mais des **"Points d'Accès" (Accessors)** programmés dans le moteur (`formulaEvaluator.ts`).
- **Qui définit ?** Le code source de l'application.
- **Comment ça marche ?** Quand vous tapez `XP_TOTAL`, le moteur va lire en temps réel la valeur de l'XP dans la fiche du personnage. C'est un lien dynamique, pas une valeur fixe.

### B. Les Variables Dynamiques (Ex: `TARGET_SKILL`)
C'est un **"Espace Réservé" (Placeholder)**.
- **Qui définit ?** Le MJ lors de la définition de la formule globale.
- **Distinguer MJ vs Joueur** : Le MJ peut désormais définir la **Portée du Choix** :
    - **Fixe (MJ)** : Le MJ choisit la cible une fois pour toutes dans le dictionnaire (ex: "Maîtrise" cible toujours "Bagarre"). Le joueur n'a aucune option.
    - **Variable (Joueur)** : Le MJ laisse la cible en `TARGET_SKILL`. Lors de l'ajout du trait sur sa fiche, le joueur voit une liste déroulante pour choisir sa compétence (ex: choisir quelle compétence est sa "Maîtrise").

### C. La Logique d'Application (Ex: `SET_RANK`)
C'est un **"Opérateur de Sortie"**. 
- **Est-ce hardcodé ?** Oui, dans le sens où c'est une fonctionnalité du moteur (`ADD`, `SUB`, `SET`).
- **L'avantage** : Au lieu d'avoir un type de trait spécial nommé "Maître", on a simplement une formule dont l'opérateur final est "Forcer la valeur" (`SET`). Cela permet de créer n'importe quel effet "Rang de compétence = X" sans nouveau code.

---

## 6. Migration Unifiée & Faisabilité
Techniquement, **oui**, tous les effets mécaniques actuels peuvent être traduits. Le script de migration automatisé :
1.  Parcourra `traits.json`.
2.  Pour chaque effet non-vide, créera une Formule Globale correspondante (si elle n'existe pas).
3.  Remplacera l'objet `effects` par un simple `formulaId`.

---
## 7. Bénéfices attendus
1. **Maintenance** : Si le coût d'une règle change, on la modifie à **un seul endroit** (le dictionnaire) et tous les traits se mettent à jour.
2. **Flexibilité** : Le MJ peut créer des mécaniques complexes sans demander de modification de code.
3. **Ergonomie** : Moins de dropdowns, moins d'erreurs de configuration.
