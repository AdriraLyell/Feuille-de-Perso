# Synthèse des bibliothèques utilisées

## Dépendances (runtime)

### 1. @supabase/supabase-js
- `createClient(url, key)` - Initialisation du client
- `supabase.from(table).select()` - Query data
- `supabase.auth.getSession()` - Session courante
- `supabase.auth.onAuthStateChange()` - Écoute auth
- `supabase.auth.signOut()` - Déconnexion

### 2. @tiptap/* (éditeur WYSIWYG)
- `useEditor(options)` - Création de l'éditeur
- `editor.getJSON()` / `editor.chain()` - Manipulation contenu
- `onUpdate` - Callback lors des modifications
- Extensions: StarterKit, Placeholder, TextAlign, Underline
- `Node`, `ReactNodeViewRenderer` - Custom nodes

### 3. clsx
- `clsx(...inputs)` - Composition conditionnelle de classes CSS

### 4. framer-motion (animations)
- `motion.component` - Composants animés
- `initial/animate/exit` props
- `AnimatePresence` - Animations entrée/sortie
- Transitions avec duration/delay

### 5. idb-keyval (stockage IndexedDB)
- `get(key)` / `set(key, value)` / `del(key)` - CRUD
- `entries()` - List entries
- Promises-based API

### 6. lucide-react (icônes)
- Imports individuels: `Settings`, `BookOpen`, etc.
- Type `LucideIcon` pour les props
- Composants SVG prêts à l'emploi

### 7. pako (compression)
- `pako.gzip(bytes)` - Compression GZIP
- `pako.ungzip(bytes)` - Décompression

### 8. react/react-dom
**Hooks principaux:**
- `useState`, `useEffect`, `useCallback`, `useMemo`
- `createContext` / `useContext` - State management
- `forwardRef`, `lazy`, `Suspense`

### 9. react-pageflip (livre papier)
- `<HTMLFlipBook>` - Composant principal
- Props: width, height, size, flippingTime
- Callback `onFlip(index)` pour changement de page

### 10. tailwind-merge
- `twMerge(...classes)` - Fusion de classes Tailwind sans conflits

### 11. uuid
- Génération d'IDs uniques (non utilisé dans le code)

### 12. zod (validation)
- `z.object()`, `z.string()`, `z.number()` - Schémas
- `z.enum()` / `z.array()` - Types composés
- `.parse()` / `.safeParse()` - Validation
- `z.infer<typeof schema>` - Extraction de type

## Développement (devDependencies)

### vite
- Build: `vite build`
- Dev: `vite dev`
- Plugin: @vitejs/plugin-react, vite-plugin-singlefile

### typescript
- Typage: `tsc --noEmit`
- tsconfig.json configuration

### eslint + typescript-eslint
- Linting JS/TS
- Plugin jsx-a11y pour accessibilité

### tailwindcss + autoprefixer
- CSS framework
- PostCSS integration

### vitest
- Tests: `vitest`, `vitest --ui`
- `describe`, `it`, `expect`, `vi.mock`

### @testing-library/react
- `render(component)` - Mount composant
- `screen.getByRole()`, `screen.getByText()` - Queries
- `act(() => { ... })` - Updates async

### playwright
- Tests E2E: `playwright test`
- `page.route()`, `page.goto()`, `expect(locator).toBeVisible()`

## Patterns fréquents dans le code

```typescript
// Utility classes
const cn = (...inputs) => twMerge(clsx(inputs));

// Supabase client
export const supabase = createClient(url, key);

// Editor setup
useEditor({
  extensions: [StarterKit.configure({...})],
  content,
  onUpdate: ({ editor }) => update(editor.getJSON())
});

// Zod validation
const schema = z.object({ field: z.string() });
const result = schema.safeParse(data);
```
