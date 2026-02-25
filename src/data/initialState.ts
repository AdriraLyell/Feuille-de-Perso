import { THEME } from '../constants/theme';
import { defaultRules } from './defaultRules';
import { CharacterSheetData, LibrarySkillEntry, DotEntry, ThemeConfig, AttributeEntry } from '../types';
import { createDotEntry, createAttributeEntry, createCombatEntry, generateId } from '../utils/factories';

export const DEFAULT_THEME: ThemeConfig = {
  creationColor: THEME.colors.status.info, // Synchronized with palette
  xpColor: THEME.colors.background.surface, // Stone-800
  dotSymbol: 'circle',
  skillColors: {
    variable: THEME.colors.primary.main,      // Amber-600
    mysticDefault: '#8b5cf6', // Keeping violet for mystic contrast
    mysticOverrides: {}
  }
};

export const DEFAULT_MYSTIC_ABILITIES = [
  'Arts Martiaux',
  'Magies Mineures',
  'Magies',
  'Talents Exceptionnels',
  'Psy'
];

// --- Factories for Initial Data ---

// Generate Initial Skills with fresh IDs
const getInitialSkills = (): Record<string, DotEntry[]> => ({
  Col_Comp_1: [
    createDotEntry('Vigilance'), createDotEntry('Repérage'), createDotEntry('T.O.C'),
    createDotEntry(''), // Spacer
    createDotEntry('Athlétisme'), createDotEntry('Esquive'),
    createDotEntry(''), // Spacer
    createDotEntry('Charme'), createDotEntry('Charisme'), createDotEntry('Duperie'), createDotEntry('Psychologie'),
    createDotEntry('Instruction'), createDotEntry('Maîtrise'),
    createDotEntry(''), // Spacer
    createDotEntry('Cuisine'), createDotEntry('Tenir Alcool'),
    createDotEntry(''), // Spacer
    createDotEntry('Style'), createDotEntry('Jeu'),
  ],
  Col_Comp_2: [
    createDotEntry('Armurerie'), createDotEntry('Bricolage'),
    createDotEntry(''), // Spacer
    createDotEntry('Electricité'), createDotEntry('Hydraulique'), createDotEntry('Mécanique'),
    createDotEntry(''), // Spacer
    createDotEntry('Commander'), createDotEntry('Diplomatie'), createDotEntry('Etiquette'),
    createDotEntry('Intimidation'), createDotEntry('Intrigue'),
    createDotEntry(''), // Spacer
    createDotEntry('Chant'), createDotEntry('Comédie / Théâtre'), createDotEntry('Conte'),
    createDotEntry('Danse'), createDotEntry('Dessin'), createDotEntry('Ecriture'),
    createDotEntry('Musique'), createDotEntry('Saltimbanque / Jongle'),
    createDotEntry(''), // Spacer
    createDotEntry('Animaux'), createDotEntry('Pistage'), createDotEntry('Survie'),
    createDotEntry(''), // Spacer
    createDotEntry('Jouer', 0, ''),
    createDotEntry(''), // Spacer
  ],
  Col_Comp_3: [
    createDotEntry('Chirurgie'), createDotEntry('Discrétion'), createDotEntry('Equitation'),
    createDotEntry('Evaluation'), createDotEntry('Falsification'), createDotEntry('Natation'),
    createDotEntry('Prestidigitation'), createDotEntry('Serrures'),
    createDotEntry(''), // Spacer
    createDotEntry('Concentration'), createDotEntry('Méditation'),
    createDotEntry(''), // Spacer
    createDotEntry('Attelage'), createDotEntry('Canotage'), createDotEntry('Navigation'),
    createDotEntry(''), // Spacer
    createDotEntry('Entraînement'), createDotEntry('Explosifs'),
    createDotEntry(''), // Spacer
    createDotEntry('Mêlée'), createDotEntry('Bagarre'), createDotEntry('Lancé'), createDotEntry('Tir'),
    createDotEntry(''), // Spacer
    createDotEntry('Art Martial', 0, ''),
  ],
  Col_Comp_4: [
    createDotEntry('Biologie'), createDotEntry('Droit'),
    createDotEntry(''), // Spacer
    createDotEntry('Finance'), createDotEntry('Géographie'), createDotEntry('Histoire'), createDotEntry('Légendes'),
    createDotEntry(''), // Spacer
    createDotEntry('Investigation'), createDotEntry('Politique'), createDotEntry('Sc. Physiques'), createDotEntry('Chimie'),
    createDotEntry(''), // Spacer
    createDotEntry('Occultisme'), createDotEntry('Mythologie'), createDotEntry('Sc. Humaines'),
    createDotEntry('Sc. Sociales'), createDotEntry('Théologie'), createDotEntry('Ecclésiastique'),
    createDotEntry(''), // Spacer
    createDotEntry('Région'), createDotEntry('Streetwise'),
    createDotEntry(''), // Spacer
    createDotEntry('Linguistique'), createDotEntry('Médecine'),
  ],
  Col_Comp_5: [
    createDotEntry('Pilotage'), createDotEntry('Conduite'), createDotEntry('Photo'),
    createDotEntry('Communication'), createDotEntry('Artisanat', 0, ''),
    createDotEntry('Féerie'), createDotEntry('Bestiaire'), createDotEntry('Horlogerie'),
    createDotEntry('Automate'),
  ],
  Col_Comp_6: [
    createDotEntry('Acrobatie'), createDotEntry('Escalade'), createDotEntry('Saut'),
    createDotEntry('Course')
  ],
  Col_Comp_7: [
  ],
  Col_Comp_8: [
    createDotEntry('Alliés'), createDotEntry('Contacts'), createDotEntry('Mentor'),
    createDotEntry('Ressources'), createDotEntry('Célébrité'), createDotEntry('Statut'),
    createDotEntry('Influence'), createDotEntry('Talisman'), createDotEntry('Arcane'),
  ],
  Col_Comp_9: [
    createDotEntry('Volonté'), createDotEntry('Confiance')
  ]
});

// Generate Default Library from Skills (Helper)
const generateDefaultSkillLibrary = (skills: Record<string, DotEntry[]>): LibrarySkillEntry[] => {
  const lib: LibrarySkillEntry[] = [];
  const seenNames = new Set<string>();

  // Skills that are variable by default
  const defaultVariableSkills = ['artisanat', 'jouer', 'art martial'];

  Object.keys(skills).forEach(key => {
    if (key === 'Col_Comp_8') return; // Skip backgrounds in default library
    skills[key].forEach((skill) => {
      if (skill.name && skill.name.trim() !== '') {
        const normalized = skill.name.trim().toLowerCase();
        if (!seenNames.has(normalized)) {
          seenNames.add(normalized);
          lib.push({
            id: generateId(),
            name: skill.name,
            defaultCategory: key,
            description: "",
            isVariable: defaultVariableSkills.includes(normalized)
          });
        }
      }
    });
  });
  return lib.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Generates a FRESH initial state with unique IDs.
 * Use this function for Reset or New Character operations.
 */
export const getInitialCharacterData = (): CharacterSheetData => {
  const skills = getInitialSkills();
  return {
    creationConfig: {
      active: false,
      mode: defaultRules.configurations.creation.mode,
      pointsDistributionMode: 'global',
      startingXP: defaultRules.configurations.creation.startingXP,
      pointsBuckets: defaultRules.configurations.creation.pointsBuckets,
      attributePoints: defaultRules.configurations.creation.attributePoints || 12,
      attributeCost: defaultRules.configurations.xpCosts.attributeFactor,
      attributeMin: defaultRules.configurations.creation.attributeMin,
      attributeMax: defaultRules.configurations.creation.attributeMax,
      backgroundPoints: defaultRules.configurations.creation.backgroundPoints || 7,
      rankSlots: defaultRules.configurations.creation.rankSlots,
      cardConfig: {
        active: defaultRules.configurations.cards.active,
        bestSkillsCount: defaultRules.configurations.cards.bestSkillsCount,
        increment: defaultRules.configurations.cards.increment,
        baseStart: defaultRules.configurations.cards.baseStart
      },
      extendedSkills: defaultRules.configurations.creation.extendedSkills || false
    },
    theme: JSON.parse(JSON.stringify(DEFAULT_THEME)),
    header: {
      name: '', age: '', sex: '',
      player: '', born: '', height: '',
      chronicle: '', nature: '', hair: '',
      status: '', conduct: '', eyes: '',
      campaignStartDate: '',
      fictionCurrentDate: '',
    },
    syncInfo: {
      isAutoSyncEnabled: false
    },
    experience: { gain: '0', spent: '0', rest: '0' },
    // Default Attributes Configuration
    attributeSettings: defaultRules.definitions.skillCategories
      .filter(cat => cat.behavior === 'Compétence' && cat.id.startsWith('pave_attributs'))
      .map(cat => ({ id: cat.id, label: cat.label }))
      .length > 0 ? defaultRules.definitions.skillCategories
        .filter(cat => cat.behavior === 'Compétence' && cat.id.startsWith('pave_attributs'))
        .map(cat => ({ id: cat.id, label: cat.label })) : [
      { id: 'pave_attributs_1', label: 'Physique' },
      { id: 'pave_attributs_2', label: 'Mental' },
      { id: 'pave_attributs_3', label: 'Social' }
    ],
    attributes: {
      pave_attributs_1: [
        createAttributeEntry('Force'),
        createAttributeEntry('Constitution'),
        createAttributeEntry('Dextérité'),
        createAttributeEntry('Agilité'),
      ],
      pave_attributs_2: [
        createAttributeEntry('Intellect'),
        createAttributeEntry('Volonté'),
        createAttributeEntry('Intuition'),
        createAttributeEntry('Perception'),
      ],
      pave_attributs_3: [
        createAttributeEntry('Charisme'),
        createAttributeEntry('Empathie'),
        createAttributeEntry('Apparence'),
        createAttributeEntry('Communication'),
      ]
    },
    secondaryAttributesActive: false,
    secondaryAttributes: {
      pave_attributs_1: [
        createAttributeEntry('Corpulence'),
        createAttributeEntry('Apparence'),
      ],
      pave_attributs_2: [
        createAttributeEntry('Conscience'),
        createAttributeEntry('Attraction'),
      ],
      pave_attributs_3: [
        createAttributeEntry('Présence'),
        createAttributeEntry('Charme'),
      ]
    },
    skills: skills,
    combat: {
      weapons: [
        createCombatEntry(),
        createCombatEntry(),
        createCombatEntry(),
        createCombatEntry(),
        createCombatEntry(),
      ],
      armor: [
        { type: '', protection: '', weight: '' },
        { type: '', protection: '', weight: '' }
      ],
      stats: { agility: '', dexterity: '', force: '', size: '' }
    },
    counters: {
      volonte: { id: 'volonte', name: 'Volonté', value: 3, creationValue: 3, max: 10, current: 0 },
      confiance: { id: 'confiance', name: 'Confiance', value: 3, creationValue: 3, max: 10, current: 0 },
      custom: [],
    },
    page2: {
      lieux_importants: "",
      contacts: "",
      reputation: [
        ...Array(7).fill(null).map(() => ({ reputation: '', lieu: '', valeur: '' }))
      ],
      connaissances: "",
      valeurs_monetaires: "",
      armes_list: "",
      avantages: [
        ...Array(28).fill(null).map(() => ({ name: '', value: '' }))
      ],
      desavantages: [
        ...Array(28).fill(null).map(() => ({ name: '', value: '' }))
      ],
      equipement: "",
      notes: "",
      characterImage: '',
    },
    specializations: {},
    imposedSpecializations: {},
    library: [],
    skillLibrary: generateDefaultSkillLibrary(skills),
    specializationLibrary: [],
    backgroundLibrary: [],
    counterLibrary: [],
    xpLogs: [],
    xpTransactions: [],
    appLogs: [],
    campaignNotes: [],
    mysticAbilities: DEFAULT_MYSTIC_ABILITIES.map(name => ({
      id: generateId(),
      name,
      description: "",
      isActive: true,
      isGlobal: true
    })),
    partyNotes: {
      members: [],
      columns: [],
      staticColWidths: { character: 200, player: 200 }
    }
  };
};

/**
 * @deprecated Use getInitialCharacterData() instead to ensure fresh IDs.
 * Kept for backward compatibility with existing imports.
 */
export const INITIAL_DATA: CharacterSheetData = getInitialCharacterData();

/**
 * @deprecated Use getInitialCharacterData() internal logic.
 */
export const INITIAL_SKILLS: Record<string, DotEntry[]> = getInitialSkills();
