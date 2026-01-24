import { CharacterSheetData, ChangelogEntry } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const APP_VERSION = "1.7.2";

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "1.7.2",
        date: new Date().toLocaleDateString('fr-FR'),
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
    },
    {
        version: "1.6.3",
        date: "21/01/2026 14:00",
        type: 'patch',
        changes: [
            "UI (Attributs) : Intégration du bonus directement dans la case Total (code couleur Vert/Rouge). Survoler pour voir le détail.",
            "UI (Page 2) : Correction du contraste (texte noir sur fond blanc) dans la fenêtre d'édition des Vertus/Défauts."
        ]
    },
    {
        version: "1.6.2",
        date: "21/01/2026 13:30",
        type: 'patch',
        changes: [
            "UI : Amélioration visuelle de l'affichage des bonus d'attributs (Vert pour bonus, Rouge pour malus, gestion du signe +/-).",
        ]
    },
    {
        version: "1.6.1",
        date: "21/01/2026 13:00",
        type: 'patch',
        changes: [
            "UI : Correction du contraste des menus déroulants dans la bibliothèque (Texte sombre sur fond blanc garanti).",
            "Système : Mise à jour du Journal des Modifications."
        ]
    },
    {
        version: "1.6.0",
        date: "21/01/2026 12:00",
        type: 'major',
        changes: [
            "Bibliothèque : Refonte visuelle complète de l'éditeur de traits.",
            "Bibliothèque : Les effets mécaniques sont maintenant affichés sous forme de 'Cartes' distinctes avec icônes et codes couleurs.",
            "Bibliothèque : Ajout de l'effet 'Bonus Attribut' (+X dans un attribut).",
            "Bibliothèque : Amélioration de la lisibilité des menus déroulants et des champs de saisie.",
            "Système : Prise en charge des bonus d'attributs dans le calcul du coût d'XP."
        ]
    },
    {
        version: "1.5.0",
        date: "21/01/2026 10:00",
        type: 'major',
        changes: [
            "Système d'Effets Mécaniques : Les Vertus et Défauts de la bibliothèque peuvent maintenant avoir des effets scriptés.",
            "Effet : 'Bonus XP' - Ajoute automatiquement de l'expérience disponible si le trait est présent sur la fiche.",
            "Effet : 'Compétence Gratuite' - Permet de rendre les X premiers rangs d'une compétence spécifique gratuits en XP.",
            "Bibliothèque : Nouvelle interface pour ajouter et configurer ces effets sur les traits.",
        ]
    },
    {
        version: "1.4.16",
        date: "20/01/2026 18:10",
        type: 'patch',
        changes: [
            "UI (Page 2) : Augmentation de la taille de police des champs 'Armes', 'Vertus' et 'Défauts' (0.9rem) pour correspondre exactement à celle des zones de texte (Notebook).",
        ]
    },
    {
        version: "1.4.15",
        date: "20/01/2026 18:05",
        type: 'patch',
        changes: [
            "UI (Page 2) : Réduction de la hauteur des lignes des champs texte (Notebook), traits et réputation (22px) pour gagner de l'espace.",
        ]
    },
    {
        version: "1.4.14",
        date: "20/01/2026 18:00",
        type: 'patch',
        changes: [
            "UI : Réduction agressive de la hauteur des lignes pour les compétences (20px), attributs et tables (22px) afin de maximiser l'espace vertical disponible.",
            "UI : Réduction de la hauteur des compteurs (36px)."
        ]
    },
    {
        version: "1.4.13",
        date: "20/01/2026 17:55",
        type: 'patch',
        changes: [
            "UI : Réduction de la hauteur des lignes des compétences, attributs et tables pour gagner de l'espace vertical.",
        ]
    },
    {
        version: "1.4.12",
        date: "20/01/2026 17:50",
        type: 'patch',
        changes: [
            "UI : Masquage des flèches d'incrémentation (spinners) sur les champs d'Attributs pour alléger l'interface.",
        ]
    },
    {
        version: "1.4.11",
        date: "20/01/2026 17:45",
        type: 'patch',
        changes: [
            "UI : Retour à une largeur de champ standard pour les attributs (w-6) tout en conservant les flèches d'incrémentation (spinners).",
        ]
    },
    {
        version: "1.4.10",
        date: "20/01/2026 17:40",
        type: 'patch',
        changes: [
            "UI : Activation des flèches d'incrémentation (spinners) sur les champs de valeur des Attributs.",
            "UI : Élargissement des champs d'attributs pour une meilleure lisibilité des chiffres."
        ]
    },
    {
        version: "1.4.9",
        date: "20/01/2026 17:35",
        type: 'patch',
        changes: [
            "Config : Ajout d'un champ 'Coût XP (Attributs)' dans l'onglet Attributs.",
            "Vous pouvez désormais modifier le multiplicateur de coût d'expérience pour les attributs (par défaut 6)."
        ]
    },
    {
        version: "1.4.8",
        date: "20/01/2026 17:30",
        type: 'patch',
        changes: [
            "Config : Le 'Système de Cartes' est désormais indépendant du 'Mode Création'.",
            "Il est possible d'activer et de configurer le calcul automatique de la carte sans activer le mode création complet (HUD de points)."
        ]
    },
    {
        version: "1.4.7",
        date: "20/01/2026 17:20",
        type: 'patch',
        changes: [
            "UI : Harmonisation complète du widget Expérience.",
            "Les libellés (Gain, Dépensé, Reste, Cartes) et les champs de saisie sont maintenant parfaitement alignés avec une largeur uniforme.",
            "Correction orthographique : 'Cartes' est désormais au pluriel."
        ]
    },
    {
        version: "1.4.6",
        date: "20/01/2026 17:15",
        type: 'patch',
        changes: [
            "UI : Ajustement cosmétique du widget Expérience.",
            "Les champs de valeur (Gain, Dépensé, Reste) ont désormais une largeur fixe pour accueillir environ 6 chiffres, améliorant l'alignement."
        ]
    },
    {
        version: "1.4.5",
        date: "20/01/2026 17:10",
        type: 'patch',
        changes: [
            "UI : Ajustement de la grille des Attributs.",
            "La colonne 'Expérience' a été rétrécie d'un tiers pour donner plus d'espace aux colonnes d'Attributs, facilitant l'affichage quand 4 catégories sont actives."
        ]
    },
    {
        version: "1.4.4",
        date: "20/01/2026 17:00",
        type: 'patch',
        changes: [
            "UX : Amélioration de l'affichage des spécialisations sur la fiche.",
            "L'info-bulle s'ouvre désormais au clic (et non au survol) et se ferme en quittant la zone.",
            "L'indicateur visuel (curseur ?) n'apparaît que si la compétence possède des spécialisations.",
            "Allègement visuel de l'info-bulle (suppression du compteur)."
        ]
    },
    {
        version: "1.4.3",
        date: "20/01/2026 16:35",
        type: 'minor',
        changes: [
            "Configuration Attributs : Ajout des 'Emplacements Rapides' (Préréglages) pour configurer instantanément la structure (Standard ou Mystique).",
            "UX : Ajout d'une fenêtre de confirmation sécurisée avant d'appliquer un préréglage d'attributs.",
            "Système : Amélioration de la gestion de l'historique des versions (Dates fixes)."
        ]
    },
    {
        version: "1.4.2",
        date: "20/01/2026 16:03",
        type: 'patch',
        changes: [
            "Configuration Attributs : Mise à jour des noms par défaut pour les 4 catégories (Physique, Mental, Social, Mystique).",
            "Import/Export : Amélioration de la gestion du 'Template' pour inclure dynamiquement toutes les catégories d'attributs configurées."
        ]
    },
    {
        version: "1.4.1",
        date: "27/02/2024 11:30",
        type: 'patch',
        changes: [
            "Configuration des Attributs : Uniformisation du nombre d'attributs pour toutes les catégories.",
            "Configuration des Attributs : Affichage des catégories sur une seule ligne.",
            "Amélioration du contraste des champs de saisie dans les paramètres."
        ]
    },
    {
        version: "1.4.0",
        date: "27/02/2024 11:00",
        type: 'major',
        changes: [
            "Système d'Attributs Dynamique : Ajout d'un onglet de configuration pour les attributs.",
            "Possibilité de définir 1 à 4 catégories d'attributs (ex: Physique, Mental, Social, Mystique).",
            "Possibilité de définir 1 à 5 attributs par catégorie et de les renommer.",
            "Migration automatique des anciens attributs vers la nouvelle structure."
        ]
    },
    {
        version: "1.3.5",
        date: "27/02/2024 10:30",
        type: 'patch',
        changes: [
            "Correction de la date du Changelog : Utilisation de l'heure système locale.",
            "Amélioration de l'alignement vertical des champs d'en-tête (alignement sur la ligne de base)."
        ]
    },
    {
        version: "1.3.4",
        date: "27/02/2024 10:00",
        type: 'patch',
        changes: [
            "Correction du bug d'affichage des dates dans le Changelog.",
            "Ajout de l'heure de publication dans le journal des modifications."
        ]
    },
    {
        version: "1.3.3",
        date: "27/02/2024",
        type: 'patch',
        changes: [
            "Amélioration cosmétique de l'en-tête : ajout de deux-points (:) aux libellés.",
            "Ajustement de l'alignement vertical entre le libellé et le champ de saisie manuscrit."
        ]
    },
    {
        version: "1.3.2",
        date: "26/02/2024",
        type: 'patch',
        changes: [
            "Réorganisation visuelle de l'en-tête de la fiche de personnage.",
            "L'en-tête est désormais plus compact, tenant sur 2 lignes.",
            "Ajustement dynamique de la largeur des champs (Nom plus grand, Age plus petit, etc.)."
        ]
    },
    {
        version: "1.3.1",
        date: "26/02/2024",
        type: 'patch',
        changes: [
            "Refonte de l'interface de Configuration (Settings).",
            "Séparation distincte entre l'activation du 'Mode Création' et du 'Système de Cartes'.",
            "Déplacement du sélecteur de méthode (Rangs vs Points) dans la colonne principale.",
            "Repositionnement de la note d'information en tête de section pour une meilleure visibilité.",
            "Clarification des libellés des boutons d'activation."
        ]
    },
    {
        version: "1.3.0",
        date: "26/02/2024",
        type: 'major',
        changes: [
            "Refonte complète du système d'Import/Export.",
            "Export Modulaire : Personnage Complet, Système de Jeu (Template + Biblio), Template seul ou Bibliothèque seule.",
            "Import Intelligent : Analyse du fichier et propose des options de fusion (Bibliothèque) ou de remplacement (Template).",
            "Sécurité : Protection contre la fusion de structures incompatibles."
        ]
    },
    {
        version: "1.2.0-beta",
        date: "2024-02-24",
        type: 'minor',
        changes: [
            "Implémentation du système d'Effets Scriptés pour les traits (Vertus/Défauts).",
            "La bibliothèque permet désormais d'ajouter des effets mécaniques (Bonus XP, Modification d'Attribut, etc.).",
            "Le HUD de création calcule automatiquement les bonus d'XP provenant des traits."
        ]
    },
    {
        version: "1.1.1",
        date: "2024-02-23",
        type: 'patch',
        changes: [
            "Correction du message d'aide de la bibliothèque vide lorsqu'elle est consultée depuis la fiche."
        ]
    },
    {
        version: "1.1.0",
        date: "2024-02-23",
        type: 'minor',
        changes: [
            "Ajout du Changelog (Journal des modifications).",
            "Amélioration de l'UX Bibliothèque : le nom est vide par défaut à la création.",
            "Amélioration de l'UX Bibliothèque : suppression automatique si annulation d'un trait vide.",
            "UI Bibliothèque : Remplacement du menu déroulant par des boutons à bascule pour le type (Vertu/Défaut)."
        ]
    },
    {
        version: "1.0.5",
        date: "2024-02-22",
        type: 'patch',
        changes: [
            "Renommage de l'onglet 'Spécialisations' en 'Spécialisations Imposées' dans la configuration.",
            "Correction mineure sur l'affichage des totaux."
        ]
    },
    {
        version: "1.0.4",
        date: "2024-02-20",
        type: 'minor',
        changes: [
            "Ajout de la Bibliothèque de Traits (Vertus/Défauts).",
            "Système de recherche et de filtres par tags pour la bibliothèque."
        ]
    },
    {
        version: "1.0.0",
        date: "2024-01-01",
        type: 'major',
        changes: [
            "Lancement initial de la feuille de personnage.",
            "Système de gestion d'XP (Mode Création par Rangs ou Points).",
            "Support de l'impression et de l'export JSON."
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
};