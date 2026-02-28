# Gestion des Conflits et Synchronisation Sécurisée

Ce document détaille les mécanismes de protection des données lors de la synchronisation entre les fiches de personnages locales (IndexedDB) et le Cloud (Supabase), ainsi que la gestion des mises à jour poussées par le MJ.

## 1. L'Architecture "3-Way Hash Check"

Pour éviter toute perte de données, l'application utilise une vérification à trois points basée sur des signatures numériques (Hash) :

- **Hash Local** : Empreinte actuelle des données sur l'appareil du joueur.
- **Hash de Dernière Sync (`lastSyncedHash`)** : Empreinte des données lors de la dernière sauvegarde réussie sur le Cloud.
- **Hash Cloud** : Empreinte de la version actuellement stockée sur le serveur.

### Scénarios de Détection

| État Local | État Cloud | Action | Résultat |
| :--- | :--- | :--- | :--- |
| **Clean** (Local == LastSync) | **Identique** (Cloud == LastSync) | À jour | Aucune action requise. |
| **Clean** (Local == LastSync) | **Plus récent** (Cloud > LastSync) | Mise à jour simple | Le joueur est averti qu'une version plus récente existe. Chargement sécurisé. |
| **Dirty** (Local != LastSync) | **Identique** (Cloud == LastSync) | Sauvegarde simple | Les modifs locales sont poussées vers le cloud sans risque. |
| **Dirty** (Local != LastSync) | **Plus récent** (Cloud > LastSync) | **CONFLIT** | Ouverture du moteur de résolution de conflit (Comparateur). |

---

## 2. Signal de Mise à Jour MJ (MJ Push)

Le MJ peut signaler une modification manuelle depuis l'interface Admin (uniquement via une campagne spécifique).

### Fonctionnement technique :
1. Le MJ rédige un message optionnel.
2. Le système injecte ce message dans `syncInfo.mjMessage` sur le cloud.
3. Le champ `last_synced` est mis à jour sur Supabase.
4. Au prochain chargement du joueur, le système détecte une date plus récente et affiche le message du MJ en surbrillance dans la modale de synchronisation.

---

## 3. Réconciliation des Règles vs Données

Une distinction stricte est faite entre la **structure** (Règles) et les **valeurs** (Données du personnage).

### Ajout d'éléments (MJ)
- **Nouvel Attribut/Compétence** : Apparaît automatiquement sur la fiche du joueur lors de la prochaine synchronisation. La structure est "poussée" sans modifier les scores existants.
- **Modif Bibliothèque** : Les nouvelles descriptions ou coûts d'XP sont mis à jour, mais les achats passés (archivés dans les logs d'XP) restent inchangés.

### Suppression d'éléments (MJ) : Protection Anti-Destruction
Pour éviter de casser une fiche accidentellement, le système applique ces règles :
- **Si l'élément possède des points (>0)** : Il n'est **jamais supprimé**. Il devient "Orphelin". Il reste visible sur la fiche pour que le joueur ne perde pas son investissement.
- **Si l'élément est vide (0 point)** : Il est nettoyé automatiquement lors de la réconciliation pour désencombrer l'interface.

---

## 4. Glossaire des États de Synchro

- **Synchronisé** : Les versions locale et cloud sont identiques.
- **Modifié localement (Dirty)** : Le joueur a fait des changements non encore sauvegardés.
- **Mise à jour disponible** : Le MJ ou un autre appareil a poussé une version plus récente sur le cloud.
- **Conflit** : Des modifications divergentes existent des deux côtés. Le joueur doit choisir quelle version conserver ou fusionner manuellement.

---

*Dernière mise à jour : 2026-02-15 (v2.49.51)*
