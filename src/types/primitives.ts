
export interface DotEntry {
  id: string;
  name: string;
  value: number;
  creationValue?: number; // Valeur acquise à la création (coût 0 XP)
  current?: number; // Valeur temporaire (Utilisé / Carrés)
  max: number;
  variant?: string; // Précision pour les compétences variables (ex: "Artisanat : Forge")
  definitionId?: string; // ID de la définition parente (pour lien solide)
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
  masterSkillTarget?: string; // Nom de compétence mise au rang 5 (effet master_skill)
  isPostCreation?: boolean;
  creationValue?: string;
  type?: 'avantage' | 'desavantage';
}

export type EffectType = 'xp_bonus' | 'free_skill_rank' | 'attribute_bonus' | 'auto_counter' | 'master_skill' | 'block_skill_increase' | 'counter_max_bonus' | 'xp_upgradeable';
export interface TraitEffect {
  id: string;
  type: EffectType;
  value: number; // Montant XP ou Rang Max Gratuit
  method?: 'fixed' | 'per_scenario';
  target?: string; // Nom de la compétence ciblée (pour free_skill_rank)
  source?: string; // Nom du trait d'origine (optionnel)
  associatedCounterId?: string; // Rétrocompatibilité ou option alternative
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

