# ARCHITECTURE RÉSUMÉE

## Principes Fondamentaux
- **Supabase maître** : Source de vérité unique via le client Supabase.
- **Online First / Offline Always** : Priorité au cloud, mais fonctionnement offline garanti.
- **Offline fallback** : Données par défaut dans `src/data/defaultRules.ts`.
- **Zod pivot schema** : Validation systématique de la donnée entrante et sortante.
- **Sécurité** : RLS (Row Level Security) strict côté DB.

## Front-End
- **State Management** : Zustand pour l'état global, `useState` pour l'état confiné aux composants. Pas d'inventions de patterns exotiques.
- **Routing** : Architecture standardisée via le routeur défini (React Router / TanStack Router).
- **Communication API** : Requêtes exclusivement via le SDK `@supabase/supabase-js`.
- **Styling** : Tailwind CSS v4 (règles utilitaires obligatoires, interdiction du CSS natif sauf exceptions isolées).
- **Rendu riche** : Tiptap + CSS Columns spécifiquement pour la fonctionnalité "Livre".