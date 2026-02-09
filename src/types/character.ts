
import {
  AttributeEntry,
  AttributeCategoryDef,
  DotEntry,
  HeaderInfo,
  CombatEntry,
  ReputationEntry,
  TraitEntry
} from './primitives';
import {
  CreationConfig,
  ThemeConfig,
  ExperienceData,
  LibraryEntry,
  LibrarySkillEntry,
  LibrarySpecializationEntry,
  XPEntry,
  LogEntry
} from './system';
import {
  CampaignNoteEntry,
  PartyMemberEntry,
  PartyColumn,
  ImposedSpecialization
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
  };
  page2: Page2Data;
  // Key is skill ID, Value is array of specialization strings (Player defined based on dots)
  specializations: Record<string, string[]>;
  // Key is skill ID, Value is array of imposed specialization objects (Config defined)
  imposedSpecializations: Record<string, ImposedSpecialization[]>;
  library: LibraryEntry[]; // New field for the Virtue/Flaw library
  skillLibrary: LibrarySkillEntry[]; // New field for Skill Reserve
  specializationLibrary?: LibrarySpecializationEntry[]; // Catalogue de spécialisations réutilisables
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
  // Sync information for online mode
  syncInfo?: {
    syncId?: string;      // UUID from database
    settingId?: string;   // Campaign ID
    settingName?: string; // Campaign name (cached for display)
    lastSynced?: number;  // Timestamp of last sync
    isAutoSyncEnabled?: boolean; // New: Automatic cloud save
  };
  _rulesVersion?: string; // Version des règles appliquées (pour optimisation de la réconciliation)
  _schemaVersion?: number; // Version du schéma de données (pour migrations séquentielles)
}

export type SkillCategoryKey = keyof CharacterSheetData['skills'];
export type AttributeCategoryKey = keyof CharacterSheetData['attributes'];
