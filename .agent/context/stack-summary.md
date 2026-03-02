# STACK TECHNIQUE

## Cœur & Rendu
- **Framework** : React 19
- **Build Tool** : Vite
- **Global State Management** : Zustand
- **Local State** : React Hooks (`useState`, `useReducer`, `useRef`)
- **Routing** : React Router (ou TanStack Router)

## Styling & UI
- **CSS Framework** : Tailwind CSS v4 (obligatoire, pas de SCSS/CSS natif)
- **Éditeur Riche** : Tiptap (avec CSS Columns pour le rendu format livre)

## Backend & Data
- **BaaS / Database** : Supabase (PostgreSQL)
- **Validation** : Zod (pivot schema pour toutes les entrées/sorties)
- **Sécurité** : Row Level Security (RLS) strict sur Supabase

## Outillage
- **Langage** : TypeScript (mode strict, `any` interdit)
- **Linting** : ESLint
- **Tests** : Vitest / Testing Library
