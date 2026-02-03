window.EXTERNAL_RULES = {
    "version": "2.12.38",
    "theme": {
        "creationColor": "#2563eb",
        "xpColor": "#292524",
        "dotSymbol": "circle"
    },
    "configurations": {
        "global": {
            "maxAttributeScore": 5,
            "maxSkillScore": 5
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
            "extendedSkills": false
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
                "Athlétisme",
                "Esquive",
                "Charme",
                "Charisme",
                "Duperie",
                "Psychologie",
                "Instruction",
                "Maîtrise",
                "Cuisine",
                "Tenir Alcool",
                "Style",
                "Jeu"
            ],
            "competences": [
                "Armurerie",
                "Bricolage",
                "Electricité",
                "Hydraulique",
                "Mécanique",
                "Commander",
                "Diplomatie",
                "Etiquette",
                "Intimidation",
                "Intrigue",
                "Chant",
                "Comédie / Théâtre",
                "Conte",
                "Danse",
                "Dessin",
                "Ecriture",
                "Musique",
                "Saltimbanque / Jongle",
                "Animaux",
                "Pistage",
                "Survie",
                "Jouer"
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
                "Concentration",
                "Méditation",
                "Attelage",
                "Canotage",
                "Navigation",
                "Entraînement",
                "Explosifs",
                "Mêlée",
                "Bagarre",
                "Lancé",
                "Tir",
                "Art Martial"
            ],
            "connaissances": [
                "Biologie",
                "Droit",
                "Finance",
                "Géographie",
                "Histoire",
                "Légendes",
                "Investigation",
                "Politique",
                "Sc. Physiques",
                "Chimie",
                "Occultisme",
                "Mythologie",
                "Sc. Humaines",
                "Sc. Sociales",
                "Théologie",
                "Ecclésiastique",
                "Région",
                "Streetwise",
                "Linguistique",
                "Médecine"
            ],
            "competences2": [
                "Acrobatie",
                "Escalade",
                "Saut",
                "Course"
            ],
            "autres_competences": [
                "Pilotage",
                "Conduite",
                "Photo",
                "Communication",
                "Artisanat",
                "Féerie",
                "Bestiaire",
                "Horlogerie",
                "Automate"
            ],
            "autres": []
        },
        "labels": {
            "talents": "Talents",
            "competences": "Compétences",
            "competences_col_2": "Compétences (Suite)",
            "connaissances": "Connaissances",
            "competences2": "Compétences Secondaires",
            "autres_competences": "Autres Compétences",
            "autres": "Autres"
        }
    },
    "libraries": {
        "traits": [],
        "skills": [],
        "specializations": []
    }
}
