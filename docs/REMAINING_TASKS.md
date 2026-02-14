# État des lieux - Tâches restantes (v2.49.6)

## 🎯 Priorités Immédiates

### 1. Issue 4.2 — Fin du Typage Strict (Haut)
Il reste deux phases majeures du plan `PLAN_ISSUES_MOYENNES.md` :
- [ ] **Phase C** : Typer les handlers d'événements dans l'administration (environ 7 fichiers concernés : `AdminCountersEditor`, `AdminCreationEditor`, `AdminSkillsEditor`, `PartyTable`, `AdminTraitLibrary`).
- [ ] **Phase E** : Typer le layout dynamique (`useSheetLayout.ts` et `CharacterSheet.tsx`). C'est une partie complexe car elle touche à la structure même de l'affichage des colonnes.

### 2. Issue 4.1 — Adoption du Logger (Moyen)
- [ ] Remplacer les **15 `console.log`** restants par l'usage de `src/utils/logger.ts`.
- [ ] S'assurer que les erreurs critiques utilisent `ErrorService`.

### 3. Issue 4.3 — Hygiène des fichiers (Moyen)
- [ ] Vérifier si `admin/components/AdventureLog.tsx` ou d'autres nouveaux fichiers dépassent les 400 lignes.
- [ ] Extraire les composants monolithiques si nécessaire.

## 🛠️ Suggestions QoL (Quality of Life)
- [ ] **Nettoyage package.json** : Retirer `tiptap-pagination-plus` qui n'est plus utilisé.
- [ ] **Quota IndexedDB** : Ajouter une notification visuelle si le stockage navigateur est plein (important pour les images).
- [ ] **Fusion des constantes** : Regrouper `src/constants.ts` et `src/constants/app.ts`.

## 📈 Score Global
- **12/15** Correctifs appliqués.
- Les fondations (Cloud, Sync, Variables CSS, Types de base) sont solides.
