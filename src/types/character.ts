
import {
  AttributeEntry,
  AttributeCategoryDef,
  DotEntry,
  HeaderInfo,
  CombatEntry,
  ReputationEntry,
  TraitEntry,
  PostItData
} from './primitives';
import {
  CreationConfig,
  ThemeConfig,
  ExperienceData,
  LibraryEntry,
  LibrarySkillEntry,
  LibrarySpecializationEntry,
  LibraryBackgroundEntry,
  LibraryCounterEntry,
  XPEntry,
  XPTransaction,
  LogEntry,
  SuggestionEntry
} from './system';
import {
  CampaignNoteEntry,
  PartyMemberEntry,
  PartyColumn,
  ImposedSpecialization,
  BookDocument
} from './campaign';

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

export interface CharacterSheetData {
  creationConfig: CreationConfig;
  theme: ThemeConfig; // New Theme Config
  header: HeaderInfo;
  postIts?: PostItData[]; // Les notes visuelles

  // Dynamic Attributes Structure
  attributes: Record<string, AttributeEntry[]>;
  // Secondary Attributes Structure (Optional, 2 per category)
  secondaryAttributes: Record<string, AttributeEntry[]>;
  secondaryAttributesActive: boolean;

  // Metadata for attribute categories (order, labels)
  attributeSettings: AttributeCategoryDef[];

  skills: Record<string, DotEntry[]>;
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
    [key: string]: DotEntry | DotEntry[]; // Allow dynamic counters
    custom: DotEntry[];
  };
  experience: ExperienceData;
  xpCosts?: {
    attributeFactor: number;
    skillFactor: number;
    specializationFactor: number;
    traitCost?: number;
  };
  page2: Page2Data;
  // Key is skill ID, Value is array of specialization strings (Player defined based on dots)
  specializations: Record<string, string[]>;
  // Key is skill ID, Value is array of imposed specialization objects (Config defined)
  imposedSpecializations: Record<string, ImposedSpecialization[]>;
  library: LibraryEntry[]; // New field for the Virtue/Flaw library
  skillLibrary: LibrarySkillEntry[]; // New field for Skill Reserve
  specializationLibrary?: LibrarySpecializationEntry[]; // Catalogue de spécialisations réutilisables
  backgroundLibrary?: LibraryBackgroundEntry[]; // Catalogue d'arrière-plans
  counterLibrary?: LibraryCounterEntry[]; // Catalogue de compteurs
  mysticAbilities?: LibrarySkillEntry[] | null; // Categories of mystic powers (Martial Arts, Magic, etc.)
  xpLogs: XPEntry[];
  xpTransactions: XPTransaction[];
  appLogs: LogEntry[];
  campaignNotes: CampaignNoteEntry[];
  bookDocument?: BookDocument;
  partyNotes?: {
    members: PartyMemberEntry[];
    columns: PartyColumn[];
    staticColWidths?: { // Widths for the fixed columns
      character: number;
      player: number;
    };
  };
  // Sync information for online mode
  syncInfo?: {
    syncId?: string;      // UUID from database
    settingId?: string;   // Campaign ID
    settingName?: string; // Campaign name (cached for display)
    lastSynced?: number;  // Timestamp of last sync
    lastSyncedHash?: string; // Digital signature of the data at last sync
    isAutoSyncEnabled?: boolean; // New: Automatic cloud save
    mjMessage?: string;   // Note left by the MJ when signaling an update
    localSettings?: {
      expertMode?: boolean;
      activeRulesId?: string;
    };
    syncMode?: 'manual' | 'auto'; // Distinction pour le trigger historique
  };
  appVersion?: string; // Version de l'application lors de la sauvegarde
  _rulesVersion?: string; // Version des règles appliquées (pour optimisation de la réconciliation)
  _rulesLastUpdated?: number; // Timestamp des règles appliquées
  _schemaVersion?: number; // Version du schéma de données (pour migrations séquentielles)
  suggestions?: SuggestionEntry[]; // Nouveau : Suggestions envoyées au MJ
}

export type SkillCategoryKey = keyof CharacterSheetData['skills'];
export type AttributeCategoryKey = keyof CharacterSheetData['attributes'];
