
export interface ImageConfig {
    width: number;
    height: number;
    
    // Mode Flow (Habillage texte)
    marginTop: number;
    align: 'left' | 'right';
    
    // Mode Absolute (Position libre)
    x?: number;
    y?: number;
    mode?: 'flow' | 'absolute';

    // Mode d'affichage de l'image dans le cadre
    fit?: 'cover' | 'contain' | 'fill';
}

export interface NoteImage {
    id: string; // Unique placement ID
    imageId: string; // IndexedDB Blob ID
    config: ImageConfig;
}

export interface CampaignNoteEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  // Deprecated singular fields (kept for migration types if needed, but handled in code)
  imageId?: string; 
  imageConfig?: ImageConfig;
  // New Array Field
  images?: NoteImage[]; 
}

// --- NEW TYPES FOR PARTY MEMBERS ---
export interface PartyColumn {
    id: string;
    label: string;
    width?: number; // Width in pixels
}

export interface PartyMemberEntry {
    id: string;
    name: string; // Personnage (Fixed)
    player: string; // Joueur (Fixed)
    data: Record<string, string>; // Dynamic columns data (key = columnId)
}
