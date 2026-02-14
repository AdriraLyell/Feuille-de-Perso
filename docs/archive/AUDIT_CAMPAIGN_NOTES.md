# Audit: Onglet Notes de Campagne

## 1. État des Lieux

L'architecture actuelle est inutilement complexe et visuellement redondante.

### Structure
1.  **`CampaignNotes.tsx`** : Conteneur principal + UI "Livre" (Bordures, fond papier).
2.  **`DigitalBookEditor.tsx`** : Wrapper vide.
3.  **`BookEditorContext.tsx`** : Context global + **Calcul lourd des pages**.
4.  **`BookLayout.tsx`** : Affiche l'éditeur ET ré-affiche un fond "Table en bois".

### Visuel : L'effet "Poupées Russes"
Le problème "cadres imbriqués" vient de la superposition de deux environnements complets :

1.  **Couche 1 (CampaignNotes)** : Fond "Wood Pattern" + Cadre "Livre" (Ombres, pages crèmes).
2.  **Couche 2 (BookLayout)** : Fond "Dark Wood" (qui remplit le cadre livre) + Editeur.

**Résultat** : On a une table, sur laquelle est posé un livre, et DANS le livre, on a une autre table sombre sur laquelle sont posées les pages.

## 2. Plan d'Action (Refactoring)

### Phase A : Nettoyage Visuel (Immédiat)
1.  **Supprimer le fond et le conteneur de `BookLayout`**. Il doit être transparent et ne contenir que les pages (ou l'éditeur) pour s'intégrer dans le "Livre" déjà dessiné par `CampaignNotes`.
2.  **Repositionner la `BookToolbar`**. Elle flotte actuellement en absolu, potentiellement au-dessus du header de `CampaignNotes`. L'intégrer proprement dans le flux.

### Phase B : Simplification Structurelle
1.  **Supprimer `DigitalBookEditor.tsx`**.
2.  **Déplacer `useBookEditor` dans `CampaignNotes`**.
3.  **Extraire la logique de pagination** de `BookEditorContext` vers un hook `useBookPagination`.

## 3. Proposition Technique

**Nouveau `CampaignNotes.tsx` (Pseudo-code) :**
```tsx
const CampaignNotes = () => {
  // 1. Initialiser l'éditeur ici
  const editor = useBookEditor(data);
  const [viewMode, setViewMode] = useState('edit');

  return (
    <Container "Fond Bois">
       <Livre "Cadre Papier">
          <Header "Onglets" />
          
          <Content>
             {tab === 'journal' ? (
                <>
                   <ToolBar embedded={true} /> {/* Intégré, pas flottant */}
                   <EditorContent editor={editor} />
                </>
             ) : (
                <PartyTable />
             )}
          </Content>
       </Livre>
    </Container>
  )
}
```

Cela divise par 3 le nombre de composants impliqués.
