
import { CharacterSheetData, ChangelogEntry } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const APP_VERSION = "1.9.4";

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "1.9.4",
        date: new Date().toLocaleDateString('fr-FR'),
        type: 'patch',
        changes: [
            "UI (Notes de Campagne) : Application d'un format fixe en mode Portrait (900x1270px) pour éviter les ascenseurs horizontaux et garantir un ratio cohérent."
        ]
    },
    {
        version: "1.9.3",
        date: new Date().toLocaleDateString('fr-FR'),
        type: 'patch',
        changes: [
            "UI (Notes de Campagne) : Les boutons de navigation (Précédent/Suivant) sont désormais ancrés visuellement aux bords du livre (flex layout) au lieu d'être fixés à l'écran, améliorant le confort de lecture lors du défilement."
        ]
    },
    {
        version: "1.9.2",
        date: new Date().toLocaleDateString('fr-FR'),
        type: 'patch',
        changes: [
            "UI (Notes de Campagne) : Adaptation automatique du format au mode Paysage (format A4 paysage 1.414:1) pour une meilleure cohérence visuelle avec les autres onglets."
        ]
    },
    {
        version: "1.9.1",
        date: new Date().toLocaleDateString('fr-FR'),
        type: 'patch',
        changes: [
            "UI (Paysage) : Rééquilibrage de la page 'Détails' (35% Haut / 65% Bas) pour maximiser l'espace des Traits et Notes.",
            "UI (Paysage) : Alignement strict des sections 'Réputation', 'Contacts' et 'Armes'.",
            "UI (Paysage) : Réduction du nombre de lignes affichées pour 'Réputation' et 'Armes' afin d'éliminer les ascenseurs vides."
        ]
    },
    {
        version: "1.9.0",
        date: new Date().toLocaleDateString('fr-FR'),
        type: 'minor',
        changes: [
            "Fonctionnalité : Refonte des Notes de Campagne.",
            "Fonctionnalité : Ajout d'un onglet 'Membres du Groupe' dans le carnet de notes.",
            "Système : Tableau dynamique pour gérer les autres joueurs (colonnes personnalisables).",
            "UI : Navigation par onglets à l'intérieur du journal."
        ]
    },
    {
        version: "1.8.0",
        date: "22/01/2026",
        type: 'minor',
        changes: [
            "Fonctionnalité : Ajout d'un nouvel onglet 'Notes de Campagne' pour tenir le journal de vos aventures.",
            "UI : Intégration du style Notebook (lignes manuscrites) dans le journal de campagne.",
            "Système : Support de l'impression et de l'export pour le journal de campagne."
        ]
    },
    {
        version: "1.7.8",
        date: "21/01/2026 18:00",
        type: 'patch',
        changes: [
            "DevOps : Ajout du workflow GitHub Actions pour le déploiement automatique sur GitHub Pages.",
            "Système : Mise à jour des configurations de dépendances."
        ]
    },
    {
        version: "1.7.7",
        date: "21/01/2026 17:45",
        type: 'patch',
        changes: [
            "UI (Détails) : Correction de la hauteur de la fenêtre d'édition pour garantir le défilement de la bibliothèque en mode sélection simple.",
            "UI (Bibliothèque) : Suppression de l'espace vide inutile en bas de liste lors de la sélection simple."
        ]
    },
    {
        version: "1.7.6",
        date: "21/01/2026 17:30",
        type: 'patch',
        changes: [
            "UI (Détails) : Ajout d'un bouton 'Sélection Multiple' directement dans la fenêtre d'édition d'une Vertu/Défaut.",
            "UI (Correctif) : Résolution définitive du problème de scroll dans la fenêtre d'édition des traits (le scroll est maintenant interne à la bibliothèque).",
        ]
    },
    {
        version: "1.7.5",
        date: "21/01/2026 17:15",
        type: 'patch',
        changes: [
            "UI (Bibliothèque) : Correction d'un problème de scroll empêchant de voir les derniers éléments lors de la sélection.",
            "UI (Bibliothèque) : Amélioration de l'interface de sélection multiple (bouton d'action toujours visible).",
            "UX : Amélioration de la réactivité du clic sur les lignes de la bibliothèque."
        ]
    },
    {
        version: "1.7.4",
        date: "21/01/2026 17:00",
        type: 'patch',
        changes: [
            "Gestion XP : Renommage de la colonne 'Lieu de Dépense' en 'Notes & Commentaires'.",
            "Gestion XP : Réduction de la largeur des colonnes MJ et XP de 50%.",
        ]
    },
    {
        version: "1.7.3",
        date: "21/01/2026 16:45",
        type: 'patch',
        changes: [
            "Système : Ajustement du script de déploiement pour compatibilité avec l'export.",
            "UI : Correctif styles d'impression et mode paysage."
        ]
    },
    {
        version: "1.7.2",
        date: "21/01/2026 16:30",
        type: 'patch',
        changes: [
            "UI : Correction d'un problème d'affichage sur les petits écrans qui empêchait de voir le côté gauche de la fiche (scroll bloqué).",
        ]
    },
    {
        version: "1.7.1",
        date: "21/01/2026 16:00",
        type: 'patch',
        changes: [
            "Gestion XP : Ajout d'une colonne 'Lieu de Dépense' pour préciser les investissements.",
            "Gestion XP : Optimisation de la largeur des colonnes (Date et XP réduites au nécessaire).",
            "Gestion XP : Réduction de la taille de police des valeurs d'XP pour aligner les lignes pointillées.",
            "Gestion XP : Nettoyage de l'en-tête de la grille."
        ]
    },
    {
        version: "1.7.0",
        date: "21/01/2026 15:00",
        type: 'minor',
        changes: [
            "Guide Utilisateur : Ajout d'un manuel interactif dans l'application.",
            "Config : Ajout d'une option pour activer 2 'Attributs Secondaires' par catégorie.",
            "UI : Affichage des attributs secondaires avec une démarcation visuelle sur la fiche.",
            "Système : Valeurs par défaut personnalisées (Corpulence/Apparence, Conscience/Attraction, etc.)."
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
  val1: 0,
  val2: 0,
  val3: 0,
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
          active: false,
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
      // Default for 4th custom category if used
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
    weapons: Array(5).fill(null).map(createCombatEntry),
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
    lieux_importants: '',
    contacts: '',
    reputation: Array(7).fill({ reputation: '', lieu: '', valeur: '' }), // Increased to 7
    connaissances: '', 
    valeurs_monetaires: '',
    armes_list: Array(10).fill(''),
    vertus: Array(28).fill(null).map(() => ({ name: '', value: '' })),
    defauts: Array(28).fill(null).map(() => ({ name: '', value: '' })),
    equipement: '', // Changed to empty string for notebook style
    notes: '',
  },
  specializations: {},
  imposedSpecializations: {},
  library: [], // New Library Field
  xpLogs: [],
  appLogs: [],
  campaignNotes: [], // Initialisé vide
  partyNotes: { // Initialisation Groupe
      members: [],
      columns: [],
      staticColWidths: { character: 200, player: 200 }
  }
};
