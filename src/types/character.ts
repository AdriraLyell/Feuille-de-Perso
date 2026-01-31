
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
    XPEntry, 
    LogEntry 
} from './system';
import { 
    CampaignNoteEntry, 
    PartyMemberEntry, 
    PartyColumn 
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
  skillLibrary: LibrarySkillEntry[]; // New field for Skill Reserve
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

export type SkillCategoryKey = keyof CharacterSheetData['skills'];
export type AttributeCategoryKey = keyof CharacterSheetData['attributes'];
