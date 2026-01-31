
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const createDotEntry = (name: string, value = 0): any => ({
  id: generateId(),
  name,
  value,
  creationValue: 0,
  max: 5,
});

export const createAttributeEntry = (name: string): any => ({
  id: generateId(),
  name,
  val1: "", // Init as string
  val2: "", 
  val3: "",
  creationVal1: 0,
  creationVal2: 0,
  creationVal3: 0,
});

export const createCombatEntry = (): any => ({
  id: generateId(),
  weapon: '',
  level: '',
  init: '',
  attack: '',
  damage: '',
  parry: '',
});
