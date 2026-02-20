
import { TraitEffect } from './primitives';

export interface CreationConfig {
  active: boolean;
  mode: 'points' | 'rangs';

  // Pour le mode Points (XP)
  pointsDistributionMode?: 'global' | 'buckets'; // Nouveau : Choix du type de répartition
  startingXP: number; // Utilisé si 'global'
  pointsBuckets?: { // Utilisé si 'buckets'
    attributes: number;
    skills: number;
    backgrounds: number;
  };

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

  backgroundCost?: number; // Default 2
  // Nouvelle option pour autoriser les rangs > 5
  extendedSkills?: boolean;
}

export interface ThemeConfig {
  creationColor: string; // Couleur des points "acquis à la création"
  xpColor: string;       // Couleur des points "acquis par XP"
  dotSymbol?: string;    // Forme des points de notation
  skillColors?: {
    variable?: string;
    mysticDefault?: string;
    mysticOverrides?: Record<string, string>;
  };
}

export interface ExperienceBreakdownItem {
  id?: string;
  name: string;
  amount: number;
  count?: number;
  category?: string;
}

export interface ExperienceBreakdown {
  gains: ExperienceBreakdownItem[];
  attributes: ExperienceBreakdownItem[];
  skills: ExperienceBreakdownItem[];
  traits: ExperienceBreakdownItem[];
  counters: ExperienceBreakdownItem[];
  mystic?: ExperienceBreakdownItem[];
}

export interface ExperienceData {
  gain: string;
  gainTooltip?: string;
  spent: string;
  rest: string;
  breakdown?: ExperienceBreakdown;
}

export interface XPEntry {
  id: string;
  date?: string | null;
  scenario?: string | null;
  spendingLocation?: string | null; // New field: Lieu de dépense / Investissement
  amount: number;
  mj?: string | null;
  countsAsScenario?: boolean;
}

export interface XPTransaction {
  id: string;
  timestamp: string; // ISO string with time
  type: 'earn' | 'spend' | 'refund';
  description: string;
  amount: number;
  source?: string;
  relatedId?: string;
}


export interface LibraryEntry {
  id: string;
  type: 'avantage' | 'desavantage' | 'vertu' | 'defaut'; // Renamed from vertu/defaut but kept for legacy
  name: string;
  cost?: string | null; // The numeric part (primary cost or min)
  pointsLabel?: string; // The display label (ex: "1, 3, 5")
  isVariableCost?: boolean;
  description?: string | null;
  tags?: string[] | null;
  isVariable?: boolean; // Si vrai, demande une précision (variant) à l'ajout
  variants?: string[] | null; // Liste des variantes suggérées (ex: "Chats", "Pollen" pour Allergie)
  effects?: TraitEffect[] | null; // New Effects System
  isGlobal?: boolean;
  isActive?: boolean;
  isLocked?: boolean;
  globalUsage?: number;
  mysticAbilityId?: string | null; // ID of the linked Mystic Ability
}

// Nouveau : Entrée pour la réserve de compétences
export interface LibrarySkillEntry {
  id: string;
  name: string;
  description?: string | null;
  defaultCategory?: string | null; // Hint for auto-placement (optional)
  isVariable?: boolean; // Si vrai, permet les doublons avec des variants différents (ex: "Artisanat : Forge")
  variants?: string[] | null; // Liste des variantes suggérées (ex: "Forge", "Histoire", "Épées")
  isGlobal?: boolean; // True if from global library
  isActive?: boolean; // True if selected for this campaign
  isLocked?: boolean;
  globalUsage?: number;
  mysticAbilityId?: string | null; // Links this skill to a specific mystic ability
  isCustomized?: boolean; // Vrai si la compétence a été modifiée localement pour ce setting
  masterDefinition?: { // Pour le bouton "Reset"
    name: string;
    description: string;
    isVariable: boolean;
    mysticAbilityId?: string;
    defaultCategory?: string;
  };
}

// Nouveau : Entrée pour le catalogue des spécialisations
export interface LibrarySpecializationEntry {
  id: string;
  name: string;
  skillIds: string[];      // IDs des compétences parentes (ex: "competences_armes_feu")
  defaultMinLevel: number; // Seuil minimum par défaut (0-5)
  description?: string;
  isGlobal?: boolean;
  isActive?: boolean;
  isLocked?: boolean;
  globalUsage?: number;
}

export type LibraryBackgroundEntry = LibrarySkillEntry;

export interface LibraryCounterEntry {
  id: string;
  name: string;
  description?: string | null; // New: Description for tooltip
  maxValue?: number | null; // Default 10
  defaultValue?: number | null; // Default 0
  xpCost?: number | null; // 0 = free
  defaultCategory?: string | null;
  appearance?: 'squares_only' | null;
  isGlobal?: boolean;
  isActive?: boolean;
  isLocked?: boolean;
  globalUsage?: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'success' | 'danger' | 'info';
  category: 'sheet' | 'settings' | 'both';
  deduplicationId?: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}

export interface BonusInfo {
  value: number;
  sources: string[];
}
export interface AttributePreset {
  id: string;
  name: string;
  description: string;
  hasSecondary: boolean;
  structure: {
    id: string;
    label: string;
    attrs: string[];
    secondaryAttrs?: string[];
  }[];
  isOfficial: boolean;
}

export interface SuggestionEntry {
  id: string; // UUID
  type: 'skill' | 'background' | 'variant' | 'trait';
  name: string;
  category: string;
  parentId?: string; // For variants: ID of the parent skill/trait
  timestamp: number;
}
