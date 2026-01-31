
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
