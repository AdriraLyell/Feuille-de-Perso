
export interface DotEntry {
  id: string;
  name: string;
  value: number;
  creationValue?: number; // Valeur acquise à la création (coût 0 XP)
  current?: number; // Valeur temporaire (Utilisé / Carrés)
  max: number;
  variant?: string; // Précision pour les compétences variables (ex: "Artisanat : Forge")
  definitionId?: string; // ID de la définition parente (pour lien solide)
  mysticAbilityId?: string; // Link to Mystic Ability ID
  description?: string; // New: Description info-bubble
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
  campaignStartDate?: string;
  fictionCurrentDate?: string;
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

export interface ReputationEntry {
  reputation: string;
  lieu: string;
  valeur: string;
}

export interface TraitEntry {
  name: string;
  value: string;
  description?: string;
  tag?: string;
  variant?: string; // Précision (ex: pour "Allergie", variant="Chats")
  definitionId?: string; // ID de la définition parente
  mysticAbilityId?: string; // Link to Mystic Ability
  associatedCounterId?: string; // Link to a dynamically created trait counter
  hasAutoCounter?: boolean;
  autoCounterName?: string;
  isXPUpgradeable?: boolean;
  masterSkillTarget?: string; // Nom de compétence mise au rang 5 (effet master_skill)
  isPostCreation?: boolean;
  creationValue?: string;
  type?: 'avantage' | 'desavantage';
}

export type FormulaOperator = 'ADD' | 'SET' | 'SUB';

export type EffectType = 'free_skill_rank' | 'master_skill' | 'block_skill_increase' | 'formula' | 'auto_counter' | 'xp_upgradeable';

export interface TraitEffect {
  id: string;
  type: EffectType; // Note: 'free_skill_rank', 'master_skill', 'block_skill_increase' are being phased out in favor of 'formula' + operator
  value: number; // Montant XP ou Rang Max Gratuit
  method?: 'fixed' | 'per_scenario';
  target?: string; // Nom de la compétence ciblée (pour free_skill_rank) ou cible de la formule
  source?: string; // Nom du trait d'origine (optionnel)
  associatedCounterId?: string; // Rétrocompatibilité ou option alternative
  formula?: string; // (Legacy/Transitoire) La formule à évaluer (ex: "+2", "Volonté / 2")
  formulaId?: string; // NEW: Le lien vers la formule globale du Dictionnaire
  operator?: FormulaOperator; // NEW: Comment appliquer le résultat (Défaut: ADD)
}

export interface PostItData {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tabId: string; // The tab they are placed on ('p1', 'p2', 'specs', 'xp', 'notes', etc)
}

