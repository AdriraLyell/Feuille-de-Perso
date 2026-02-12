---
trigger: always_on
---

# RÈGLES DE L'AGENT - Feuille de Perso

Ces règles sont la source de vérité pour le comportement de l'agent dans ce workspace.

## 1. ARCHITECTURE & PRINCIPES
- **Hybrid Database Engine** : Supabase est maître. L'app est "Online First", mais doit TOUJOURS fonctionner Offline (via `default_rules.json`).
- **Chirurgie du Code** : Modifications minimales et précises. Ne jamais réécrire un fichier complet inutilement.
- **Typage Strict** : Éviter `any` et `@ts-ignore`. Préférer les structures Zod et les types inférés.
- **UX Premium** : Interfaces vivantes, micro-animations, feedback visuel immédiat.

## 2. DOCUMENTATION DE RÉFÉRENCE
*Consulter ces fichiers avant toute intervention majeure pour limiter l'usage des tokens :*
- [L'Audit & Roadmap](file:///d:/Projet%20JdR/feuille-de-perso/docs/AUDIT_SUMMARY.md) : État des dettes techniques et tâches à venir.
- [Sécurité RLS](file:///d:/Projet%20JdR/feuille-de-perso/docs/RLS_POLICIES.md) : Politiques d'accès Supabase.
- [Schémas Zod](file:///d:/Projet%20JdR/feuille-de-perso/src/schemas/characterSchema.ts) : Structure de données pivot.

## 3. PROTOCOLE DE VERSIONNING (OBLIGATOIRE)
Avant chaque fin de tâche (notify_user) :
1. Incrémenter la version dans `package.json`.
2. Mettre à jour `src/data/changelog.json` avec la version, date et type de changement.
3. Vérifier l'intégrité via `npm run build`.

## 4. GESTION DES TOKENS & DOCS
- **Maintenance Proactive** : L'agent doit mettre à jour les documents de référence (`docs/AUDIT_SUMMARY.md`, `docs/RLS_POLICIES.md`) après chaque modification majeure ou résolution de problème.
- **Concision** : Toujours rester synthétique dans les docs pour limiter l'usage des tokens de contexte.
- **Source Unique** : Ce fichier (`regle.md`) est l'unique source de règles de l'agent. `.cursorrules` est obsolète.

## 5. EMPLACEMENT DES FICHIERS
- **Code** : `src/`
- **Docs** : `docs/`
- **Brain** : `<appDataDir>/brain/<uuid>/` (Artifacts temporaires).
