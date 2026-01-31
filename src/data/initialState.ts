
import { CharacterSheetData, LibrarySkillEntry } from '../types';
import { createDotEntry, createAttributeEntry, createCombatEntry, generateId } from '../utils/factories';

export const DEFAULT_THEME = {
    creationColor: '#2563eb', // blue-600
    xpColor: '#292524'        // stone-800
};

// Define initial skills first to use them for Library generation
const INITIAL_SKILLS = {
    talents: [
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
    competences: [
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
      createDotEntry('Jouer : '), createDotEntry('Jouer : '),
      createDotEntry(''), // Spacer
    ],
    competences_col_2: [
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
      createDotEntry('Mêlée'), createDotEntry('Bagarre'),createDotEntry('Lancé'),createDotEntry('Tir'),
      createDotEntry(''), // Spacer
      createDotEntry('Art Martial : '), createDotEntry('Art Martial : '),
    ],
    connaissances: [
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
    autres_competences: [
       createDotEntry('Pilotage'), createDotEntry('Conduite'), createDotEntry('Photo'),
       createDotEntry('Communication'), createDotEntry('Artisanat : '), createDotEntry('Artisanat : '),
       createDotEntry('Féerie'), createDotEntry('Bestiaire'), createDotEntry('Horlogerie'),
       createDotEntry('Automate'),
    ],
    competences2: [
      createDotEntry('Acrobatie'), createDotEntry('Escalade'), createDotEntry('Saut'),
      createDotEntry('Course')
    ],
    autres: [
    ],
    arrieres_plans: [
      createDotEntry('Alliés'), createDotEntry('Contacts'), createDotEntry('Mentor'),
      createDotEntry('Ressources'), createDotEntry('Célébrité'), createDotEntry('Statut'),
      createDotEntry('Influence'), createDotEntry('Talisman'), createDotEntry('Arcane'),
    ]
};

// Generate Default Library from Skills
const generateDefaultSkillLibrary = (): LibrarySkillEntry[] => {
    const lib: LibrarySkillEntry[] = [];
    const seenNames = new Set<string>();

    Object.keys(INITIAL_SKILLS).forEach(key => {
        if (key === 'arrieres_plans') return; // Skip backgrounds in default library
        // @ts-ignore
        INITIAL_SKILLS[key].forEach((skill: any) => {
            if (skill.name && skill.name.trim() !== '') {
                const normalized = skill.name.trim().toLowerCase();
                if (!seenNames.has(normalized)) {
                    seenNames.add(normalized);
                    lib.push({
                        id: generateId(),
                        name: skill.name,
                        defaultCategory: key,
                        description: ""
                    });
                }
            }
        });
    });
    return lib.sort((a, b) => a.name.localeCompare(b.name));
};

export const INITIAL_DATA: CharacterSheetData = {
  creationConfig: {
      active: false,
      mode: 'rangs',
      pointsDistributionMode: 'global', 
      startingXP: 350,
      pointsBuckets: { 
          attributes: 60,
          skills: 140,
          backgrounds: 20
      },
      attributePoints: 12,
      attributeCost: 6,
      attributeMin: -1,
      attributeMax: 3,
      backgroundPoints: 7,
      rankSlots: { 1: 10, 2: 8, 3: 6, 4: 2, 5: 0 },
      cardConfig: {
          active: true,
          bestSkillsCount: 6,
          increment: 0.5,
          baseStart: 2
      }
  },
  theme: DEFAULT_THEME,
  header: {
    name: '', age: '', sex: '',
    player: '', born: '', height: '',
    chronicle: '', nature: '', hair: '',
    status: '', conduct: '', eyes: '',
  },
  experience: { gain: '0', spent: '0', rest: '0' },
  // Default Attributes Configuration
  attributeSettings: [
      { id: 'physique', label: 'Physique' },
      { id: 'mental', label: 'Mental' },
      { id: 'social', label: 'Social' }
  ],
  attributes: {
    physique: [
      createAttributeEntry('Force'),
      createAttributeEntry('Constitution'),
      createAttributeEntry('Dextérité'),
      createAttributeEntry('Agilité'),
    ],
    mental: [
      createAttributeEntry('Intellect'),
      createAttributeEntry('Volonté'),
      createAttributeEntry('Intuition'),
      createAttributeEntry('Perception'),
    ],
    social: [
      createAttributeEntry('Charisme'),
      createAttributeEntry('Empathie'),
      createAttributeEntry('Apparence'),
      createAttributeEntry('Communication'),
    ]
  },
  secondaryAttributesActive: false,
  secondaryAttributes: {
      physique: [
          createAttributeEntry('Corpulence'),
          createAttributeEntry('Apparence'),
      ],
      mental: [
          createAttributeEntry('Conscience'),
          createAttributeEntry('Attraction'),
      ],
      social: [
          createAttributeEntry('Présence'),
          createAttributeEntry('Charme'),
      ],
      mystique: [
          createAttributeEntry('Aura'),
          createAttributeEntry('Fascination'),
      ]
  },
  skills: INITIAL_SKILLS, // Use the extracted object
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
  skillLibrary: generateDefaultSkillLibrary(), // Pre-filled by default
  xpLogs: [],
  appLogs: [],
  campaignNotes: [], 
  partyNotes: { 
      members: [],
      columns: [],
      staticColWidths: { character: 200, player: 200 }
  }
};
