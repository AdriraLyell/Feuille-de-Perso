
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
}

export interface ThemeConfig {
    creationColor: string; // Couleur des points "acquis à la création"
    xpColor: string;       // Couleur des points "acquis par XP"
}

export interface ExperienceData {
  gain: string;
  spent: string;
  rest: string;
}

export interface XPEntry {
  id: string;
  date: string;
  scenario: string;
  spendingLocation?: string; // New field: Lieu de dépense / Investissement
  amount: number;
  mj: string;
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

// Nouveau : Entrée pour la réserve de compétences
export interface LibrarySkillEntry {
    id: string;
    name: string;
    description?: string;
    defaultCategory?: string; // Hint for auto-placement (optional)
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
