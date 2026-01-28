
import { CharacterSheetData, ChangelogEntry } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const APP_VERSION = "1.9.39";

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "1.9.39",
        date: "26/01/2026 16:50",
        type: 'patch',
        changes: [
            "Ajustement de précision du lignage dans les zones de texte pour un remplissage parfaitement aligné.",
            "Amélioration du contraste de l'encre numérique pour la lecture sur écran.",
            "Fixation de l'horodatage en dur selon l'heure système au moment de la création."
        ]
    },
    {
        version: "1.9.38",
        date: "26/01/2026 14:00",
        type: 'patch',
        changes: [
            "Optimisation de l'impression : conservation de la mise en forme (lignes, couleurs d'encre) et amélioration du contraste.",
            "Correction des bordures indésirables sur les zones de texte lors de l'export PDF/Impression."
        ]
    },
    {
        version: "1.9.37",
        date: "26/01/2026 09:30",
        type: 'patch',
        changes: [
            "Amélioration visuelle des zones de texte (lignes plus visibles) pour faciliter le remplissage manuscrit.",
            "Ajout d'indices visuels pour les champs vides."
        ]
    }
];

const createDotEntry = (name: string, value = 0): any => ({
  id: generateId(),
  name,
  value,
  creationValue: 0,
  max: 5,
});

const createAttributeEntry = (name: string): any => ({
  id: generateId(),
  name,
  val1: "", // Init as string
  val2: "", 
  val3: "",
  creationVal1: 0,
  creationVal2: 0,
  creationVal3: 0,
});

const createCombatEntry = (): any => ({
  id: generateId(),
  weapon: '',
  level: '',
  init: '',
  attack: '',
  damage: '',
  parry: '',
});

export const INITIAL_DATA: CharacterSheetData = {
  creationConfig: {
      active: false,
      mode: 'rangs',
      startingXP: 350,
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
  skills: {
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
  },
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
  xpLogs: [],
  appLogs: [],
  campaignNotes: [], 
  partyNotes: { 
      members: [],
      columns: [],
      staticColWidths: { character: 200, player: 200 }
  }
};
