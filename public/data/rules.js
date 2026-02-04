window.EXTERNAL_RULES = {
    "version": "2.12.55",
    "theme": {
        "creationColor": "#2563eb",
        "xpColor": "#292524",
        "dotSymbol": "circle"
    },
    "configurations": {
        "global": {
            "maxAttributeScore": 5,
            "maxSkillScore": 5,
            "secondaryAttributes": false
        },
        "creation": {
            "mode": "rangs",
            "startingXP": 350,
            "pointsDistributionMode": "global",
            "pointsBuckets": {
                "attributes": 60,
                "skills": 140,
                "backgrounds": 20
            },
            "attributePoints": 12,
            "backgroundPoints": 7,
            "attributeMin": -1,
            "attributeMax": 3,
            "rankSlots": {
                "1": 10,
                "2": 8,
                "3": 6,
                "4": 2,
                "5": 0
            },
            "extendedSkills": false,
            "active": false,
            "attributeCost": 6,
            "cardConfig": {
                "active": true,
                "bestSkillsCount": 6,
                "increment": 0.5,
                "baseStart": 2
            }
        },
        "xpCosts": {
            "attribute": 6,
            "skill": 3,
            "newSkill": 3,
            "specialization": 2
        },
        "cards": {
            "active": true,
            "baseStart": 2,
            "increment": 0.5,
            "bestSkillsCount": 6,
            "ranks": [
                "Valet",
                "Dame",
                "Roi"
            ],
            "counts": [
                "Un",
                "Deux",
                "Trois",
                "Quatre"
            ],
            "maxLabel": "Quatre Rois (Max)"
        }
    },
    "definitions": {
        "attributes": {
            "physique": [
                "Force",
                "Constitution",
                "Dextérité",
                "Agilité"
            ],
            "mental": [
                "Intellect",
                "Volonté",
                "Intuition",
                "Perception"
            ],
            "social": [
                "Charisme",
                "Empathie",
                "Apparence",
                "Communication"
            ]
        },
        "secondaryAttributes": {
            "physique": [
                "Corpulence",
                "Apparence"
            ],
            "mental": [
                "Conscience",
                "Attraction"
            ],
            "social": [
                "Présence",
                "Charme"
            ],
            "mystique": [
                "Aura",
                "Fascination"
            ]
        },
        "skills": {
            "talents": [
                "Vigilance",
                "Repérage",
                "T.O.C",
                "",
                "Athlétisme",
                "Esquive",
                "",
                "Charme",
                "Charisme",
                "Duperie",
                "Psychologie",
                "Instruction",
                "Maîtrise",
                "",
                "Cuisine",
                "Tenir Alcool",
                "",
                "Style",
                "Jeu"
            ],
            "competences": [
                "Armurerie",
                "Bricolage",
                "",
                "Electricité",
                "Hydraulique",
                "Mécanique",
                "",
                "Commander",
                "Diplomatie",
                "Etiquette",
                "Intimidation",
                "Intrigue",
                "",
                "Chant",
                "Comédie / Théâtre",
                "Conte",
                "Danse",
                "Dessin",
                "Ecriture",
                "Musique",
                "Saltimbanque / Jongle",
                "",
                "Animaux",
                "Pistage",
                "Survie",
                "",
                "Jouer : ",
                "Jouer : ",
                ""
            ],
            "competences_col_2": [
                "Chirurgie",
                "Discrétion",
                "Equitation",
                "Evaluation",
                "Falsification",
                "Natation",
                "Prestidigitation",
                "Serrures",
                "",
                "Concentration",
                "Méditation",
                "",
                "Attelage",
                "Canotage",
                "Navigation",
                "",
                "Entraînement",
                "Explosifs",
                "",
                "Mêlée",
                "Bagarre",
                "Lancé",
                "Tir",
                "",
                "Art Martial : ",
                "Art Martial : "
            ],
            "connaissances": [
                "Biologie",
                "Droit",
                "",
                "Finance",
                "Géographie",
                "Histoire",
                "Légendes",
                "",
                "Investigation",
                "Politique",
                "Sc. Physiques",
                "Chimie",
                "",
                "Occultisme",
                "Mythologie",
                "Sc. Humaines",
                "Sc. Sociales",
                "Théologie",
                "Ecclésiastique",
                "",
                "Région",
                "Streetwise",
                "",
                "Linguistique",
                "Médecine"
            ],
            "autres_competences": [
                "Pilotage",
                "Conduite",
                "Photo",
                "Communication",
                "Artisanat : Forge",
                "Artisanat : ",
                "Féerie",
                "Bestiaire",
                "Horlogerie",
                "Automate",
                "Cartomancie",
                "Ecriture Mystique",
                "Herboristerie",
                "Alchimie",
                "Vision Mystique",
                "Vision Féerique",
                "Intuition"
            ],
            "competences2": [
                "Acrobatie",
                "Escalade",
                "Saut",
                "Course",
                "Manipulation des Poisons",
                "Déguisement",
                "Empalmage",
                "Japon"
            ],
            "autres": [
                "Ninjutsu",
                "Taijutsu",
                "Shinobi",
                "",
                "Zanji Shinjinken-Ryu",
                "Gui Long",
                "An Yin Kung Fu",
                "",
                "Wui Wing Chun",
                "Snake Style Kung Fu",
                "Tai-Chi Ch'uan",
                "Mien-Ch'uan",
                "Chi Hsuan Men",
                "TIen-Hsueh"
            ],
            "arrieres_plans": [
                "Alliés",
                "Contacts",
                "Mentor",
                "Ressources",
                "Célébrité",
                "Statut",
                "Influence",
                "Talisman",
                "Arcane",
                "Equipement",
                "Ingrédients"
            ]
        },
        "labels": {
            "talents": "Talents",
            "competences": "Compétences",
            "competences_col_2": "Compétences (Suite)",
            "connaissances": "Connaissances",
            "competences2": "Compétences Secondaires",
            "autres_competences": "Autres Compétences",
            "autres": "Autres",
            "physique": "Physique",
            "mental": "Mental",
            "social": "Social",
            "mystique": "Mystique"
        },
        "backgrounds": [
            "Alliés",
            "Contacts",
            "Mentor",
            "Ressources",
            "Célébrité",
            "Statut",
            "Influence",
            "Talisman",
            "Arcane",
            "Equipement",
            "Ingrédients"
        ],
        "counters": {
            "volonte": {
                "id": "volonte",
                "name": "Volonté",
                "max": 3,
                "xpCost": 5
            },
            "confiance": {
                "id": "confiance",
                "name": "Confiance",
                "max": 3,
                "xpCost": 5
            }
        }
    },
    "libraries": {
        "traits": [
            {
                "id": "l80rw72gm",
                "name": "Cadeau MJ",
                "type": "desavantage",
                "cost": "5",
                "description": "Bonus offert par le MJ",
                "tags": [
                    "mj",
                    "cadeau"
                ],
                "effects": []
            },
            {
                "id": "27hybts0z",
                "name": "Etranger",
                "type": "desavantage",
                "cost": "2",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "31knlq1xw",
                "name": "Curieux",
                "type": "desavantage",
                "cost": "2",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "cvb4iaq8u",
                "name": "Mal des Transports",
                "type": "desavantage",
                "cost": "3",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "35byyexj9",
                "name": "Enfant",
                "type": "desavantage",
                "cost": "3",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "406i9uq49",
                "name": "Seul au Monde",
                "type": "desavantage",
                "cost": "2",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "b4su9ob6a",
                "name": "Règles",
                "type": "desavantage",
                "cost": "2",
                "description": "Arts Martiaux",
                "tags": [],
                "effects": []
            },
            {
                "id": "qhsbib53c",
                "name": "Allergie",
                "type": "desavantage",
                "cost": "2",
                "description": "Matériau qui est le point faible de la créature scellée",
                "tags": [],
                "effects": []
            },
            {
                "id": "gice3jgxx",
                "name": "Addiction",
                "type": "desavantage",
                "cost": "2",
                "description": "Thé - Céremonie",
                "tags": [],
                "effects": []
            },
            {
                "id": "bg6qovqvk",
                "name": "Ennemi",
                "type": "desavantage",
                "cost": "3",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "py8mr8e76",
                "name": "Recherché",
                "type": "desavantage",
                "cost": "1",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "h5ii3z1lg",
                "name": "Possédé",
                "type": "desavantage",
                "cost": "5",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "0i1j6c4kw",
                "name": "Mauvaises Nuits",
                "type": "desavantage",
                "cost": "3",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "eew87u5in",
                "name": "Amnésie",
                "type": "desavantage",
                "cost": "2",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "3lrtkvj9x",
                "name": "Marche dans les Ombres",
                "type": "avantage",
                "cost": "2",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "z41ohltyl",
                "name": "Maitre",
                "type": "avantage",
                "cost": "3",
                "description": "",
                "tags": [],
                "effects": [
                    {
                        "id": "h6wxnagx8",
                        "type": "free_skill_rank",
                        "value": 5,
                        "target": "Bagarre"
                    }
                ]
            },
            {
                "id": "o83xervd2",
                "name": "Reflexes Rapides",
                "type": "avantage",
                "cost": "1",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "oobdgthdl",
                "name": "Hyperlaxite",
                "type": "avantage",
                "cost": "1",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "ny4i8hfzm",
                "name": "Héros d'Exception",
                "type": "avantage",
                "cost": "3",
                "description": "",
                "tags": [],
                "effects": [
                    {
                        "id": "dod5zpi6j",
                        "type": "xp_bonus",
                        "value": 20
                    }
                ]
            },
            {
                "id": "le2wsayjc",
                "name": "XCT Pack",
                "type": "avantage",
                "cost": "5",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "5qcasdidj",
                "name": "Petit Dormeur",
                "type": "avantage",
                "cost": "1",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "awghegaqm",
                "name": "Apprentissage Rapide",
                "type": "avantage",
                "cost": "2",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "vmxd17jtc",
                "name": "XCT Art Martiaux",
                "type": "avantage",
                "cost": "5",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "5syhnofnw",
                "name": "Ambidextre",
                "type": "avantage",
                "cost": "1",
                "description": "",
                "tags": [],
                "effects": []
            },
            {
                "id": "iyh98j31l",
                "name": "Action Supplémentaire",
                "type": "avantage",
                "cost": "5",
                "description": "",
                "tags": [],
                "effects": []
            }
        ],
        "skills": [
            {
                "id": "nw7qt2gwg",
                "name": "Acrobatie",
                "description": "",
                "defaultCategory": "competences2"
            },
            {
                "id": "mx9fzdotz",
                "name": "Alchimie",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "y4pm3l9o9",
                "name": "An Yin Kung Fu",
                "description": "",
                "defaultCategory": "autres"
            },
            {
                "id": "ucz0kd63z",
                "name": "Animaux",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "is4l5llor",
                "name": "Armurerie",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "zhkaj4hrs",
                "name": "Art Martial : ",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "b9chr4aej",
                "name": "Artisanat : ",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "ebk26fe1q",
                "name": "Artisanat : Forge",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "nfysnms0j",
                "name": "Athlétisme",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "59je3ncwr",
                "name": "Attelage",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "btb9hi0m0",
                "name": "Automate",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "9w5vnoken",
                "name": "Bagarre",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "ig9t3byyz",
                "name": "Bestiaire",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "2gzohj9cg",
                "name": "Biologie",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "ege2eaayn",
                "name": "Bricolage",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "h3xlsv6oc",
                "name": "Canotage",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "xzp9eq8dc",
                "name": "Cartomancie",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "4u6jlwaxk",
                "name": "Chant",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "pn95hfmib",
                "name": "Charisme",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "lzi0an68i",
                "name": "Charme",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "3cgvdi4ij",
                "name": "Chi Hsuan Men",
                "description": "",
                "defaultCategory": "autres"
            },
            {
                "id": "vf14gqc8r",
                "name": "Chimie",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "drxxcqihk",
                "name": "Chirurgie",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "0un7zeq7r",
                "name": "Comédie / Théâtre",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "qwcqyuspz",
                "name": "Commander",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "bm25h1c0q",
                "name": "Communication",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "dfa0e1087",
                "name": "Concentration",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "w9wuflmox",
                "name": "Conduite",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "s5oeazxya",
                "name": "Conte",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "p9nm6uqsq",
                "name": "Course",
                "description": "",
                "defaultCategory": "competences2"
            },
            {
                "id": "tp0me4d7u",
                "name": "Cuisine",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "dwgajum1y",
                "name": "Danse",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "yw1zmtm14",
                "name": "Déguisement",
                "description": "",
                "defaultCategory": "competences2"
            },
            {
                "id": "i7sesxlxu",
                "name": "Dessin",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "3gldq50re",
                "name": "Diplomatie",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "7kamh10de",
                "name": "Discrétion",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "qwtrlqrpd",
                "name": "Droit",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "hd9sutdlm",
                "name": "Duperie",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "f64dino4h",
                "name": "Ecclésiastique",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "3iy0kav2k",
                "name": "Ecriture",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "fo0k9ywg9",
                "name": "Ecriture Mystique",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "9v4whuq26",
                "name": "Electricité",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "ceejs9t1v",
                "name": "Empalmage",
                "description": "",
                "defaultCategory": "competences2"
            },
            {
                "id": "m2t699a2x",
                "name": "Entraînement",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "y3vify8e0",
                "name": "Equitation",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "mmk9z40qg",
                "name": "Escalade",
                "description": "",
                "defaultCategory": "competences2"
            },
            {
                "id": "b5g9msw3e",
                "name": "Esquive",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "zw1or1kib",
                "name": "Etiquette",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "87wq1bmb2",
                "name": "Evaluation",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "nl72wr5g5",
                "name": "Explosifs",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "zcx88fp9q",
                "name": "Falsification",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "anrqfwwkh",
                "name": "Féerie",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "55b538po9",
                "name": "Finance",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "j7ypzjhku",
                "name": "Géographie",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "ers6wjdtt",
                "name": "Gui Long",
                "description": "",
                "defaultCategory": "autres"
            },
            {
                "id": "tavzn8iea",
                "name": "Herboristerie",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "6buup145t",
                "name": "Histoire",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "xp14dmnj5",
                "name": "Horlogerie",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "dcyj4mowa",
                "name": "Hydraulique",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "y9ejqdlg9",
                "name": "Instruction",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "w8kn8q4k9",
                "name": "Intimidation",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "1z7scs9o5",
                "name": "Intrigue",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "ojkgvm5o5",
                "name": "Intuition",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "t9ih67mfu",
                "name": "Investigation",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "v6sa3xckw",
                "name": "Japon",
                "description": "",
                "defaultCategory": "competences2"
            },
            {
                "id": "hm9be7702",
                "name": "Jeu",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "xia72wlly",
                "name": "Jouer : ",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "j8q9dtrxb",
                "name": "Lancé",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "5bc8sgx33",
                "name": "Légendes",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "1a6n3hzxn",
                "name": "Linguistique",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "w42ltj0l0",
                "name": "Maîtrise",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "avp7ietoj",
                "name": "Manipulation des Poisons",
                "description": "",
                "defaultCategory": "competences2"
            },
            {
                "id": "mxd5y6ewm",
                "name": "Mécanique",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "v1xith9xb",
                "name": "Médecine",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "s6tuzt9io",
                "name": "Méditation",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "pmqpizfkl",
                "name": "Mêlée",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "rvjcpwzk1",
                "name": "Mien-Ch'uan",
                "description": "",
                "defaultCategory": "autres"
            },
            {
                "id": "px5i53pen",
                "name": "Musique",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "jthplgnq7",
                "name": "Mythologie",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "0fu43psjo",
                "name": "Natation",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "159ss5wfj",
                "name": "Navigation",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "hdkpfbne7",
                "name": "Ninjutsu",
                "description": "",
                "defaultCategory": "autres"
            },
            {
                "id": "95ss3270a",
                "name": "Occultisme",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "1lh9s6omc",
                "name": "Photo",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "o8quwercf",
                "name": "Pilotage",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "e1xunk6uf",
                "name": "Pistage",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "qvugd0e8y",
                "name": "Politique",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "7h1qmziqd",
                "name": "Prestidigitation",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "a2ybn74ad",
                "name": "Psychologie",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "m3qfv1h3h",
                "name": "Région",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "r3zwx4yko",
                "name": "Repérage",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "qkuf0yd9n",
                "name": "Saltimbanque / Jongle",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "o09r8lrxf",
                "name": "Saut",
                "description": "",
                "defaultCategory": "competences2"
            },
            {
                "id": "1o9q1qrbq",
                "name": "Sc. Humaines",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "ktrjx403q",
                "name": "Sc. Physiques",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "nqwyhvkkf",
                "name": "Sc. Sociales",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "e2vzf7ek4",
                "name": "Serrures",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "i99ocf2pv",
                "name": "Shinobi",
                "description": "",
                "defaultCategory": "autres"
            },
            {
                "id": "wn3nb0bpf",
                "name": "Snake Style Kung Fu",
                "description": "",
                "defaultCategory": "autres"
            },
            {
                "id": "pg7kycb0e",
                "name": "Streetwise",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "qetfs57gg",
                "name": "Style",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "fdostemwi",
                "name": "Survie",
                "description": "",
                "defaultCategory": "competences"
            },
            {
                "id": "fky93vhv3",
                "name": "T.O.C",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "3ea8qjxia",
                "name": "Tai-Chi Ch'uan",
                "description": "",
                "defaultCategory": "autres"
            },
            {
                "id": "097tl70qj",
                "name": "Taijutsu",
                "description": "",
                "defaultCategory": "autres"
            },
            {
                "id": "ud87x78wc",
                "name": "Tenir Alcool",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "9kcabb191",
                "name": "Théologie",
                "description": "",
                "defaultCategory": "connaissances"
            },
            {
                "id": "7nqwyo04a",
                "name": "TIen-Hsueh",
                "description": "",
                "defaultCategory": "autres"
            },
            {
                "id": "vw0ib5cr6",
                "name": "Tir",
                "description": "",
                "defaultCategory": "competences_col_2"
            },
            {
                "id": "2xghm67bw",
                "name": "Vigilance",
                "description": "",
                "defaultCategory": "talents"
            },
            {
                "id": "3za6flhue",
                "name": "Vision Féerique",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "q56s562uq",
                "name": "Vision Mystique",
                "description": "",
                "defaultCategory": "autres_competences"
            },
            {
                "id": "zhxyp3xvr",
                "name": "Wui Wing Chun",
                "description": "",
                "defaultCategory": "autres"
            },
            {
                "id": "r5v74jgod",
                "name": "Zanji Shinjinken-Ryu",
                "description": "",
                "defaultCategory": "autres"
            },
            {
                "id": "46zm114ul",
                "name": "AAAA",
                "description": ""
            }
        ],
        "specializations": []
    },
    "lastUpdated": 1770199245415
};