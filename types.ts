
export interface CreationConfig {
  active: boolean;
  mode: 'points' | 'rangs';
  startingXP: number; // Pour le mode Points
  
  // Pour le mode Rangs
  attributePoints: number; // Points à dépenser dans les attributs
  attributeCost: number; // Coût en XP par point d'attribut (défaut 6)
  attributeMin: number; // Limite min par attribut (ex: -2)
  attributeMax: number; // Limite max par attribut (ex: 3)
  backgroundPoints: number; // Points à dépenser dans les arrière-plans
  rankSlots: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };

  // Configuration pour le calcul de la Carte
  cardConfig: {
      active: boolean;
      bestSkillsCount: number; // Défaut 6
      increment: number; // Défaut 0.5
      baseStart: number; // Défaut 2
  };
}

export interface DotEntry {
  id: string;
  name: string;
  value: number;
  creationValue?: number; // Valeur acquise à la création (coût 0 XP)
  current?: number; // Valeur temporaire (Utilisé / Carrés)
  max: number;
}

export interface AttributeEntry {
  id: string;
  name: string;
  val1: string; // Changed to string to support "" vs "0"
  val2: string; // Changed to string
  val3: string; // Changed to string
  // Valeurs à la création pour calcul XP (Restent en number pour la logique)
  creationVal1?: number;
  creationVal2?: number;
  creationVal3?: number;
}

export interface AttributeCategoryDef {
    id: string;
    label: string;
}

export interface SectionData {
  id: string;
  title: string;
  items: DotEntry[];
}

export interface HeaderInfo {
  name: string;
  age: string;
  sex: string;
  player: string;
  born: string;
  height: string;
  chronicle: string;
  nature: string;
  hair: string;
  status: string;
  conduct: string;
  eyes: string;
}

export interface CombatEntry {
  id: string;
  weapon: string;
  level: string; // " / " format in image
  init: string;
  attack: string;
  damage: string;
  parry: string;
}

export interface ExperienceData {
  gain: string;
  spent: string;
  rest: string;
}

export interface ReputationEntry {
  reputation: string;
  lieu: string;
  valeur: string;
}

export interface TraitEntry {
  name: string;
  value: string;
}

export type EffectType = 'xp_bonus' | 'free_skill_rank' | 'attribute_bonus';

export interface TraitEffect {
    id: string;
    type: EffectType;
    value: number; // Montant XP ou Rang Max Gratuit
    target?: string; // Nom de la compétence ciblée (pour free_skill_rank)
}

export interface LibraryEntry {
  id: string;
  type: 'avantage' | 'desavantage'; // Renamed from vertu/defaut
  name: string;
  cost: string;
  description: string;
  tags?: string[];
  effects?: TraitEffect[]; // New Effects System
}

export interface Page2Data {
  lieux_importants: string;
  contacts: string; 
  reputation: ReputationEntry[];
  connaissances: string; 
  valeurs_monetaires: string; 
  armes_list: string;
  avantages: TraitEntry[]; // Renamed from vertus
  desavantages: TraitEntry[]; // Renamed from defauts
  equipement: string; 
  notes: string;
  characterImage?: string; // Base64 string (Legacy / Export carrier)
  characterImageId?: string; // IndexedDB Key (New persistent storage)
}

export interface XPEntry {
  id: string;
  date: string;
  scenario: string;
  spendingLocation?: string; // New field: Lieu de dépense / Investissement
  amount: number;
  mj: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'success' | 'danger' | 'info';
  category: 'sheet' | 'settings' | 'both';
  deduplicationId?: string;
}

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

export interface CharacterSheetData {
  creationConfig: CreationConfig;
  header: HeaderInfo;
  
  // Dynamic Attributes Structure
  attributes: Record<string, AttributeEntry[]>;
  // Secondary Attributes Structure (Optional, 2 per category)
  secondaryAttributes: Record<string, AttributeEntry[]>;
  secondaryAttributesActive: boolean;

  // Metadata for attribute categories (order, labels)
  attributeSettings: AttributeCategoryDef[]; 

  skills: {
    talents: DotEntry[];
    competences: DotEntry[]; // Center column top 1
    competences_col_2: DotEntry[]; // Center column top 2 (New)
    connaissances: DotEntry[]; // Right column top
    competences2: DotEntry[]; // Center column bottom (Competences Secondaires)
    autres_competences: DotEntry[]; // Left column bottom (Autres Competences)
    autres: DotEntry[]; // Right column bottom (Autres)
    arrieres_plans: DotEntry[]; // Right column bottom (Arrieres Plans)
  };
  combat: {
    weapons: CombatEntry[];
    armor: {
      type: string;
      protection: string;
      weight: string;
    }[];
    stats: {
      agility: string;
      dexterity: string;
      force: string;
      size: string;
    }
  };
  counters: {
    volonte: DotEntry;
    confiance: DotEntry;
    custom: DotEntry[];
  };
  experience: ExperienceData;
  page2: Page2Data;
  // Key is skill ID, Value is array of specialization strings (Player defined based on dots)
  specializations: Record<string, string[]>;
  // Key is skill ID, Value is array of imposed specialization strings (Config defined)
  imposedSpecializations: Record<string, string[]>;
  library: LibraryEntry[]; // New field for the Virtue/Flaw library
  xpLogs: XPEntry[];
  appLogs: LogEntry[];
  campaignNotes: CampaignNoteEntry[];
  partyNotes: {
      members: PartyMemberEntry[];
      columns: PartyColumn[];
      staticColWidths?: { // Widths for the fixed columns
          character: number;
          player: number;
      };
  };
}

export interface ChangelogEntry {
    version: string;
    date: string;
    changes: string[];
    type: 'major' | 'minor' | 'patch';
}

export type SkillCategoryKey = keyof CharacterSheetData['skills'];
export type AttributeCategoryKey = keyof CharacterSheetData['attributes'];
