
import { CharacterSheetData, ChangelogEntry } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const APP_VERSION = "1.9.35";

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "1.9.35",
        date: "25/01/2026 17:15",
        type: 'patch',
        changes: [
            "UI (Notes de Campagne) : Activation du défilement horizontal dans le tableau 'Groupe' lorsque la largeur totale des colonnes dépasse l'espace disponible."
        ]
    },
    {
        version: "1.9.34",
        date: "25/01/2026 17:00",
        type: 'patch',
        changes: [
            "UI (Notes de Campagne) : Les titres de colonnes trop longs dans le tableau Groupe sont désormais tronqués (...) et affichent leur nom complet au survol."
        ]
    },
    {
        version: "1.9.33",
        date: "25/01/2026 16:30",
        type: 'patch',
        changes: [
            "UI (Notes de Campagne) : Le bouton 'Ajouter un membre' dans l'onglet Groupe est maintenant intégré directement dans le tableau (dernière ligne) pour être toujours visible à la suite des données."
        ]
    },
    {
        version: "1.9.32",
        date: "25/01/2026 16:00",
        type: 'patch',
        changes: [
            "UI (Fiche) : Déplacement du bouton d'activation du 'Mode Création' dans le bandeau supérieur de la fiche de personnage (coin haut droit).",
            "UI (Configuration) : Suppression de l'interrupteur 'Mode Création' dans les paramètres (désormais accessible directement depuis la fiche)."
        ]
    },
    {
        version: "1.9.31",
        date: "25/01/2026 15:30",
        type: 'patch',
        changes: [
            "UI (Configuration) : Renommage de l'onglet 'Paramètres de Création' en 'Paramètres' dans la barre de navigation (pilule) pour plus de concision."
        ]
    },
    {
        version: "1.9.30",
        date: "25/01/2026 15:00",
        type: 'patch',
        changes: [
            "UI (Configuration) : Renommage du bloc 'Paramètres Généraux' en 'Paramètres de Création' dans l'onglet de configuration."
        ]
    },
    {
        version: "1.9.29",
        date: "25/01/2026 14:30",
        type: 'patch',
        changes: [
            "Système : Correction du format des dates dans le journal des modifications. Les dates sont désormais statiques pour garantir l'exactitude de l'historique."
        ]
    },
    {
        version: "1.9.28",
        date: "25/01/2026",
        type: 'patch',
        changes: [
            "Config : Le Système de Carte (calcul automatique) est désormais activé par défaut pour les nouvelles fiches."
        ]
    },
    {
        version: "1.9.27",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UI (Configuration) : L'onglet 'Création Personnage' est renommé 'Paramètres de Création'.",
            "UX (Configuration) : Les paramètres de création (coûts XP, limites, rangs) sont désormais modifiables à tout moment, sans avoir besoin d'activer le mode création."
        ]
    },
    {
        version: "1.9.26",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UI (Sauvegarde) : Les onglets Sauvegarder et Charger ont maintenant la même largeur et sont centrés dans la modale."
        ]
    },
    {
        version: "1.9.25",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UI (Journal) : Ajout d'un bouton sur les images pour basculer le mode d'affichage : Remplir (Zoom), Ajuster (Entier) ou Étirer."
        ]
    },
    {
        version: "1.9.24",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UI (Journal) : Correction d'un bug où les contrôles des images s'affichaient au survol de la page entière. Ils ne s'affichent désormais qu'au survol de l'image.",
        ]
    },
    {
        version: "1.9.23",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UI (Sauvegarde) : Refonte de la fenêtre de Sauvegarde/Chargement avec un système d'onglets pour une meilleure clarté.",
            "UI (Sauvegarde) : Les options sont désormais présentées de manière distincte pour éviter les confusions."
        ]
    },
    {
        version: "1.9.22",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "Système : Correction critique. Les images du journal de campagne sont maintenant correctement incluses dans le fichier de sauvegarde (JSON).",
            "Système : Optimisation du processus d'import/export pour les données volumineuses."
        ]
    },
    {
        version: "1.9.21",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UX (Notes) : Les contrôles des images (déplacement, redimensionnement, suppression) ne sont désormais visibles et actifs qu'au survol de la souris.",
            "UX (Notes) : Amélioration de la stabilité visuelle lors du déplacement des images."
        ]
    },
    {
        version: "1.9.20",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UI (Détails) : Le widget Réputation est maintenant dynamique.",
            "UI (Détails) : Navigation au clavier dans la Réputation (Entrée passe au champ/ligne suivant).",
            "UI (Détails) : Appuyer sur Entrée dans la dernière case de Réputation crée automatiquement une nouvelle ligne.",
            "UI (Détails) : Réduction de l'affichage initial de la Réputation à 4 lignes pour aérer la mise en page (avec ascenseur si dépassement)."
        ]
    },
    {
        version: "1.9.19",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UI (Détails) : Ajustement précis de l'alignement vertical des lignes du widget Réputation pour correspondre parfaitement à la grille du carnet Connaissances voisin.",
            "Correctif : Suppression d'un décalage de 6px qui désynchronisait les bordures."
        ]
    },
    {
        version: "1.9.18",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UI (Détails) : Intégration des en-têtes de colonnes du widget Réputation (Réputation, Lieu, Valeur) directement dans la barre de titre.",
            "UI (Détails) : Alignement vertical des lignes de Réputation avec les lignes du carnet Connaissances voisin.",
            "UI (Détails) : Suppression de l'ascenseur vertical dans le widget Réputation pour un rendu plus propre."
        ]
    },
    {
        version: "1.9.17",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UI (Détails - Portrait) : Ajustement fin de la hauteur de la section Traits (720px) pour réduire l'espace vide avant les Notes."
        ]
    },
    {
        version: "1.9.16",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UI (Détails) : Alignement précis du badge 'Total' des avantages/désavantages avec la colonne des valeurs (réduction de la largeur à 32px pour correspondre à la colonne)."
        ]
    },
    {
        version: "1.9.15",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UI (Détails - Portrait) : Ajustement de la hauteur de la section Traits/Equipement (750px) pour éviter l'apparition d'un ascenseur vertical sur les listes complètes (28 lignes).",
            "UI (Détails - Portrait) : Repositionnement automatique de la section Notes pour un meilleur équilibre visuel."
        ]
    },
    {
        version: "1.9.14",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UI (Détails - Portrait) : Harmonisation de la mise en page avec le mode paysage.",
            "UI (Détails - Portrait) : La section 'Traits - Signes Particuliers' occupe désormais les 2/3 de la largeur en bas de page.",
            "UI (Détails - Portrait) : 'Equipement' et 'Notes' sont déplacés dans une colonne latérale (1/3 largeur)."
        ]
    },
    {
        version: "1.9.13",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "Système : Vérification de la version du fichier lors de l'import. Une alerte s'affiche si la version du fichier diffère de celle de l'application."
        ]
    },
    {
        version: "1.9.12",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "Système : Le nom des fichiers de sauvegarde inclut désormais la date et l'heure en préfixe (JJ-MM-AAAA_HHhMM).",
            "Système : La version de l'application est incluse dans les métadonnées du fichier JSON exporté (si absente)."
        ]
    },
    {
        version: "1.9.11",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UI (Détails - Portrait) : Réorganisation majeure de la mise en page.",
            "UI (Détails - Portrait) : L'image du personnage est considérablement agrandie en hauteur.",
            "UI (Détails - Portrait) : Les widgets 'Valeurs Monétaires' et 'Armes' sont maintenant alignés sous les blocs précédents."
        ]
    },
    {
        version: "1.9.10",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "UI (Config Attributs) : Renommage du terme 'Catégorie' en 'Pavé' pour correspondre aux retours utilisateurs."
        ]
    },
    {
        version: "1.9.9",
        date: "24/01/2026",
        type: 'patch',
        changes: [
            "Système : Changement du stockage des attributs (Texte au lieu de Nombre) pour permettre la distinction entre un champ vide et une valeur '0' explicite.",
            "UI : Le chiffre '0' saisi dans un attribut reste désormais visible après la sauvegarde."
        ]
    },
    {
        version: "1.9.8",
        date: "24/01/2026",
        type: 'minor',
        changes: [
            "Terminologie : Renommage global de 'Vertus' en 'Avantages' et 'Défauts' en 'Désavantages' pour mieux coller à la sémantique du jeu."
        ]
    },
    {
        version: "1.9.7",
        date: "24/01/2026",
        type: 'minor',
        changes: [
            "UI (Détails) : Conversion du widget 'Armes' en champ texte libre (style carnet) pour plus de flexibilité, harmonisé avec les autres champs."
        ]
    },
    {
        version: "1.9.6",
        date: "24/01/2026",
        type: 'minor',
        changes: [
            "UI (Détails) : Ajout d'un widget d'image de personnage en haut à gauche.",
            "UI (Détails) : Réorganisation de la mise en page pour intégrer l'image de manière harmonieuse (Portrait & Paysage).",
            "Fonctionnalité : Import/Export de l'image du personnage inclus dans le fichier de sauvegarde."
        ]
    },
    {
        version: "1.9.5",
        date: "23/01/2026",
        type: 'minor',
        changes: [
            "Fonctionnalité (Détails) : Ajout d'un cadre pour importer une image du personnage (Portrait ou Illustration).",
            "UI (Détails) : Réorganisation de la mise en page pour intégrer l'image tout en conservant les widgets existants.",
            "UI (Détails) : Réduction de la taille de la zone Équipement pour libérer de l'espace."
        ]
    },
    {
        version: "1.9.4",
        date: "22/01/2026",
        type: 'patch',
        changes: [
            "UI (Notes de Campagne) : Application d'un format fixe en mode Portrait (900x1270px) pour éviter les ascenseurs horizontaux et garantir un ratio cohérent."
        ]
    },
    {
        version: "1.9.3",
        date: "22/01/2026",
        type: 'patch',
        changes: [
            "UI (Notes de Campagne) : Les boutons de navigation (Précédent/Suivant) sont désormais ancrés visuellement aux bords du livre (flex layout) au lieu d'être fixés à l'écran, améliorant le confort de lecture lors du défilement."
        ]
    },
    {
        version: "1.9.2",
        date: "22/01/2026",
        type: 'patch',
        changes: [
            "UI (Notes de Campagne) : Adaptation automatique du format au mode Paysage (format A4 paysage 1.414:1) pour une meilleure cohérence visuelle avec les autres onglets."
        ]
    },
    {
        version: "1.9.1",
        date: "22/01/2026",
        type: 'patch',
        changes: [
            "UI (Paysage) : Rééquilibrage de la page 'Détails' (35% Haut / 65% Bas) pour maximiser l'espace des Traits et Notes.",
            "UI (Paysage) : Alignement strict des sections 'Réputation', 'Contacts' et 'Armes'.",
            "UI (Paysage) : Réduction du nombre de lignes affichées pour 'Réputation' et 'Armes' afin d'éliminer les ascenseurs vides."
        ]
    },
    {
        version: "1.9.0",
        date: "22/01/2026",
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
    reputation: Array(4).fill({ reputation: '', lieu: '', valeur: '' }), // Reduced to 4 for new sheets
    connaissances: '', 
    valeurs_monetaires: '',
    armes_list: '', 
    avantages: Array(28).fill(null).map(() => ({ name: '', value: '' })), // Renamed from vertus
    desavantages: Array(28).fill(null).map(() => ({ name: '', value: '' })), // Renamed from defauts
    equipement: '', 
    notes: '',
    characterImage: '', // Initialized empty
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
