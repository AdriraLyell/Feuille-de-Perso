import { DotEntry, AttributeEntry, CombatEntry } from '../types/primitives';

export const generateId = () => crypto.randomUUID();

export const createDotEntry = (name: string, value = 0, variant?: string): DotEntry => ({
  id: generateId(),
  name,
  value,
  creationValue: 0,
  max: 5,
  variant
});

export const createAttributeEntry = (name: string): AttributeEntry => ({
  id: generateId(),
  name,
  val1: "0",
  val2: "",
  val3: "",
  creationVal1: 0,
  creationVal2: 0,
  creationVal3: 0,
});

export const createCombatEntry = (): CombatEntry => ({
  id: generateId(),
  weapon: '',
  level: '',
  init: '',
  attack: '',
  damage: '',
  parry: '',
});
