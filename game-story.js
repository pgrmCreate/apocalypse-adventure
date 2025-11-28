// Contient toute l'histoire : scènes, textes, choix, loot des lieux

window.GAME_STORY = {
    scenes: {
        // --- Appartement du héros ---

        intro: {
            id: "intro",
            title: "Chambre barricadée",
            text:
                "Tu es enfermé dans ta chambre, planches sur les fenêtres, matelas contre la porte. Les râles de la rue sont lointains, mais bien là.",
            locationId: "apt_main",
            timeContext: "slow",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Fouiller ta chambre",
                    nextScene: "aptMainSearch",
                    timeCost: 1
                },
                {
                    text: "Aller à la cuisine",
                    nextScene: "aptKitchen",
                    timeCost: 1
                },
                {
                    text: "Sortir dans le couloir de l'étage",
                    nextScene: "aptHallway",
                    timeCost: 1
                }
            ]
        },

        aptMainSearch: {
            id: "aptMainSearch",
            title: "Fouille de ta chambre",
            text:
                "Tu retournes chaque pile de vêtements, chaque tiroir. Tu avais caché quelques bricoles utiles pour le jour où tu devrais sortir.",
            locationId: "apt_main",
            timeContext: "slow",
            minLoot: ["bandage", "satchel"],
            randomLoot: ["cannedFood", "waterBottle"],
            randomLootRarity: { 1: 0.8, 2: 0.2},
            options: [
                {
                    text: "Revenir t'asseoir un instant",
                    nextScene: "intro",
                    timeCost: 0
                },
                {
                    text: "Sortir dans le couloir",
                    nextScene: "aptHallway",
                    timeCost: 1
                }
            ]
        },

        aptKitchen: {
            id: "aptKitchen",
            title: "Cuisine dévastée",
            text:
                "L'odeur de nourriture avariée flotte encore. Quelques conserves ont survécu aux premiers jours de panique.",
            locationId: "apt_kitchen",
            timeContext: "slow",
            minLoot: ["cannedFood"],
            randomLoot: ["waterBottle", "knife"],
            randomLootRarity: { 1: 0.85, 2: 0.15 },
            options: [
                {
                    text: "Retourner dans ta chambre",
                    nextScene: "intro",
                    timeCost: 1
                },
                {
                    text: "Passer par la porte qui donne sur le couloir",
                    nextScene: "aptHallway",
                    timeCost: 1
                }
            ]
        },

        aptHallway: {
            id: "aptHallway",
            title: "Couloir du 3e étage",
            text:
                "La moquette est maculée de traces de pas sèches. La porte de ton voisin en face est entrebâillée. La cage d’escalier est au bout du couloir.",
            locationId: "apt_hallway",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["plank"],
            randomLootRarity: { 1: 0.9, 2: 0.09, 3: 0.01 },
            options: [
                {
                    text: "Aller voir l'appartement d'en face (3B)",
                    nextScene: "neighbor3Door",
                    timeCost: 1
                },
                {
                    text: "Descendre dans la cage d'escalier",
                    nextScene: "stairs3Zombie",
                    timeCost: 1
                },
                {
                    text: "Retourner dans ton appartement",
                    nextScene: "intro",
                    timeCost: 1
                }
            ]
        },

        neighbor3Door: {
            id: "neighbor3Door",
            title: "Porte de l'appartement 3B",
            text:
                "La porte de l'appartement 3B est entrouverte, la serrure forée de l'intérieur. Un filet d’odeur métallique s'en échappe.",
            locationId: "apt_neighbor3",
            timeContext: "slow",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Entrer prudemment",
                    nextScene: "neighbor3Inside",
                    timeCost: 1
                },
                {
                    text: "Laisser tomber et revenir au couloir",
                    nextScene: "aptHallway",
                    timeCost: 0
                }
            ]
        },

        neighbor3Inside: {
            id: "neighbor3Inside",
            title: "Appartement 3B",
            text:
                "L’appartement est renversé, mais personne ne semble là. Sur la table, quelques provisions oubliées.",
            locationId: "apt_neighbor3",
            timeContext: "slow",
            minLoot: ["cannedFood"],
            randomLoot: ["waterBottle", "bandage"],
            randomLootRarity: { 1: 0.78, 2: 0.18, 3: 0.04 },
            options: [
                {
                    text: "Revenir dans le couloir",
                    nextScene: "aptHallway",
                    timeCost: 1
                }
            ]
        },

        // --- Escalier du 3e ---

        stairs3Zombie: {
            id: "stairs3Zombie",
            title: "Cage d'escalier du 3e",
            text:
                "Tu ouvres la porte de la cage d'escalier. Un zombie se tient à mi-palier, la tête penchée. Il lève brusquement les yeux vers toi.",
            locationId: "stairs3",
            timeContext: "fast",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "L'affronter au corps à corps",
                    diceTest: {
                        type: "combat",
                        diceCount: 2,
                        diceSides: 6,
                        difficulty: 12,
                        description:
                            "Tu essaies de l'abattre avant qu'il ne te morde."
                    },
                    successScene: "stairs3Clear",
                    failScene: "stairs3Hurt",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -4 }
                },
                {
                    text: "Essayer de te faufiler discrètement",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "finesse",
                        difficulty: 8,
                        description:
                            "Tu te colles contre la rambarde en espérant qu'il ne te remarque pas."
                    },
                    successScene: "stairs3Clear",
                    failScene: "stairs3Hurt",
                    successEffect: {},
                    failEffect: { hpChange: -2 }
                },
                {
                    text: "Refermer la porte et retourner dans le couloir",
                    nextScene: "aptHallway"
                }
            ]
        },

        stairs3Clear: {
            id: "stairs3Clear",
            title: "Escalier dégagé",
            text:
                "Le danger immédiat est passé. Entre les paliers, tu vois les portes des autres étages se dessiner dans la pénombre.",
            locationId: "stairs3",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["bandage"],
            randomLootRarity: { 1: 0.8, 2: 0.17, 3: 0.03 },
            options: [
                {
                    text: "Descendre au 2e étage",
                    nextScene: "landing2",
                    timeCost: 1
                },
                {
                    text: "Remonter au 3e (couloir)",
                    nextScene: "aptHallway",
                    timeCost: 1
                }
            ]
        },

        stairs3Hurt: {
            id: "stairs3Hurt",
            title: "Blessé dans l'escalier",
            text:
                "Tu t’en sors, mais en y laissant du sang et un peu de souffle. L’escalier est praticable, pour l’instant.",
            locationId: "stairs3",
            timeContext: "slow",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Descendre au 2e étage",
                    nextScene: "landing2",
                    timeCost: 1
                },
                {
                    text: "Remonter au 3e (couloir)",
                    nextScene: "aptHallway",
                    timeCost: 1
                }
            ]
        },

        // --- 2e étage ---

        landing2: {
            id: "landing2",
            title: "Palier du 2e étage",
            text:
                "Le palier du 2e est silencieux. La porte de l'appartement 2A est entrouverte, une lumière froide filtre de l'intérieur.",
            locationId: "landing2",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["bandage"],
            randomLootRarity: { 1: 0.82, 2: 0.15, 3: 0.03 },
            options: [
                {
                    text: "Entrer dans l'appartement 2A",
                    nextScene: "apt2",
                    timeCost: 1
                },
                {
                    text: "Descendre au 1er étage",
                    nextScene: "landing1",
                    timeCost: 1
                },
                {
                    text: "Remonter vers le 3e",
                    nextScene: "stairs3Clear",
                    timeCost: 1
                }
            ]
        },

        apt2: {
            id: "apt2",
            title: "Appartement 2A",
            text:
                "Une odeur de moisissure et de produits ménagers mélangés. Des cartons éventrés, une armoire renversée… mais aussi quelques choses utiles.",
            locationId: "apt2",
            timeContext: "slow",
            minLoot: ["bandage"],
            randomLoot: ["bigBag", "plank"],
            randomLootRarity: { 1: 0.65, 2: 0.25, 3: 0.1 },
            options: [
                {
                    text: "Revenir sur le palier",
                    nextScene: "landing2",
                    timeCost: 1
                }
            ]
        },

        // --- 1er étage ---

        landing1: {
            id: "landing1",
            title: "Palier du 1er étage",
            text:
                "Tu entends des bruits étouffés derrière certaines portes, sans savoir si ce sont des survivants… ou pire.",
            locationId: "landing1",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["cannedFood"],
            randomLootRarity: { 1: 0.85, 2: 0.12, 3: 0.03 },
            options: [
                {
                    text: "Entrer dans l'appartement 1A",
                    nextScene: "apt1",
                    timeCost: 1
                },
                {
                    text: "Descendre au rez-de-chaussée",
                    nextScene: "groundHall",
                    timeCost: 1
                },
                {
                    text: "Remonter au 2e étage",
                    nextScene: "landing2",
                    timeCost: 1
                }
            ]
        },

        apt1: {
            id: "apt1",
            title: "Appartement 1A",
            text:
                "Le salon est en désordre, mais relativement épargné. Une table renversée, des verres brisés, une cuisine encore pleine de traces de vie normale.",
            locationId: "apt1",
            timeContext: "slow",
            minLoot: ["waterBottle"],
            randomLoot: ["medkit"],
            randomLootRarity: { 1: 0.7, 2: 0.2, 3: 0.1 },
            options: [
                {
                    text: "Revenir sur le palier",
                    nextScene: "landing1",
                    timeCost: 1
                }
            ]
        },

        // --- Rez-de-chaussée & hall ---

        groundHall: {
            id: "groundHall",
            title: "Hall d'entrée",
            text:
                "Le hall est plongé dans une lumière poussiéreuse. La grande porte vitrée de l'immeuble est obstruée de l'extérieur pour empêcher les zombies d’entrer… ou de sortir.",
            locationId: "groundHall",
            timeContext: "fast",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Examiner la porte principale",
                    nextScene: "mainDoorBlocked"
                },
                {
                    text: "Chercher la porte qui mène au garage",
                    nextScene: "garageEntrance",
                    timeCost: 1
                },
                {
                    text: "Remonter au 1er étage",
                    nextScene: "landing1",
                    timeCost: 1
                }
            ]
        },

        mainDoorBlocked: {
            id: "mainDoorBlocked",
            title: "Porte condamnée",
            text:
                "Tu tires de toutes tes forces sur la poignée. À travers les vitres sales, tu vois des planches clouées et des chaînes à l'extérieur. Par ici, tu ne sortiras jamais.",
            locationId: "groundHall",
            timeContext: "slow",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Revenir dans le hall",
                    nextScene: "groundHall",
                    timeCost: 0
                },
                {
                    text: "Te résoudre à passer par le garage",
                    nextScene: "garageEntrance",
                    timeCost: 1
                }
            ]
        },

        // --- Garage ---

        garageEntrance: {
            id: "garageEntrance",
            title: "Entrée du garage",
            text:
                "Une rampe descend vers le sous-sol. Des voitures abandonnées, des flaques d’huile, des silhouettes immobiles entre les colonnes de béton.",
            locationId: "garage",
            timeContext: "slow",
            minLoot: ["plank"],
            randomLoot: ["cannedFood", "waterBottle", "anvil"],
            randomLootRarity: { 1: 0.6, 2: 0.25, 3: 0.15 },
            options: [
                {
                    text: "Prendre un peu de temps pour te poser et fouiller (temps long)",
                    nextScene: "garageEntrance",
                    timeCost: 2
                },
                {
                    text: "Te faufiler entre les voitures vers la sortie",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "finesse",
                        difficulty: 9,
                        description:
                            "Tu avances en évitant les vitres brisées et les silhouettes qui bougent à peine."
                    },
                    successScene: "garageExit",
                    failScene: "garageZombies",
                    successEffect: {},
                    failEffect: { hpChange: -2 }
                },
                {
                    text: "Remonter vers le hall",
                    nextScene: "groundHall",
                    timeCost: 1
                }
            ]
        },

        garageZombies: {
            id: "garageZombies",
            title: "Zombies entre les voitures",
            text:
                "Tu fais tomber une clé anglaise. Le bruit résonne, et plusieurs silhouettes se tournent vers toi.",
            locationId: "garage",
            timeContext: "fast",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Te frayer un passage en frappant",
                    diceTest: {
                        type: "combat",
                        diceCount: 2,
                        diceSides: 6,
                        difficulty: 11,
                        description:
                            "Tu frappes tout ce qui s'approche assez près, espérant atteindre la rampe de sortie."
                    },
                    successScene: "garageExit",
                    failScene: "garageExitInjured",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -4 }
                },
                {
                    text: "Battre en retraite vers le hall",
                    nextScene: "groundHall"
                }
            ]
        },

        garageExit: {
            id: "garageExit",
            title: "La rue par le garage",
            text:
                "Tu débouches enfin dans la ruelle derrière l'immeuble. Le ciel est gris, la ville est méconnaissable, mais tu es dehors.",
            locationId: "outside",
            timeContext: "slow",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Fin de ce chapitre — recommencer",
                    restart: true
                }
            ]
        },

        garageExitInjured: {
            id: "garageExitInjured",
            title: "Libre mais amoché",
            text:
                "Tu sors du garage en titubant, couvert de sang (pas uniquement le tien). Tu es vivant, pour l'instant.",
            locationId: "outside",
            timeContext: "slow",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Fin de ce chapitre — recommencer",
                    restart: true
                }
            ]
        },

        // --- Game over générique ---

        gameOver: {
            id: "gameOver",
            title: "Tu ne te relèveras pas",
            text:
                "Le monde continuera de pourrir sans toi. Ta survie s’achève ici, dans cet immeuble oublié.",
            locationId: "none",
            timeContext: "slow",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Recommencer depuis le début",
                    restart: true
                }
            ]
        }
    },

    locations: {
        apt_main: {
            minLoot: ["bandage", "satchel"],
            randomLoot: {},
            randomLootRarity: { 1: 0.8, 2: 0.2 },
            randomLootQuantity: 0.5
        },

        apt_kitchen: {
            minLoot: ["cannedFood"],
            randomLoot: ["waterBottle", "knife"],
            randomLootRarity: { 1: 0.85, 2: 0.15 },
            randomLootQuantity: 1
        },

        apt_hallway: {
            minLoot: [],
            randomLoot: ["plank"],
            randomLootRarity: { 1: 0.9, 2: 0.09, 3: 0.01 },
            randomLootQuantity: 0.5
        },

        apt_neighbor3: {
            minLoot: ["cannedFood"],
            randomLoot: ["waterBottle", "bandage"],
            randomLootRarity: { 1: 0.78, 2: 0.18, 3: 0.04 },
            randomLootQuantity: 1
        },

        stairs3: {
            minLoot: [],
            randomLoot: ["bandage"],
            randomLootRarity: { 1: 0.8, 2: 0.17, 3: 0.03 },
            randomLootQuantity: 0.8
        },

        landing2: {
            minLoot: [],
            randomLoot: ["bandage"],
            randomLootRarity: { 1: 0.82, 2: 0.15, 3: 0.03 },
            randomLootQuantity: 0.8
        },

        apt2: {
            minLoot: ["bandage"],
            randomLoot: ["bigBag", "plank"],
            randomLootRarity: { 1: 0.65, 2: 0.25, 3: 0.1 },
            randomLootQuantity: 1
        },

        landing1: {
            minLoot: [],
            randomLoot: ["cannedFood"],
            randomLootRarity: { 1: 0.85, 2: 0.12, 3: 0.03 },
            randomLootQuantity: 0.8
        },

        apt1: {
            minLoot: ["waterBottle"],
            randomLoot: ["medkit"],
            randomLootRarity: { 1: 0.7, 2: 0.2, 3: 0.1 },
            randomLootQuantity: 1
        },

        groundHall: {
            minLoot: [],
            randomLoot: [],
            randomLootRarity: {},
            randomLootQuantity: 0
        },

        garage: {
            minLoot: ["plank"],
            randomLoot: ["cannedFood", "waterBottle", "anvil"],
            randomLootRarity: { 1: 0.6, 2: 0.25, 3: 0.15 },
            randomLootQuantity: 1.2
        },

        outside: {
            minLoot: [],
            randomLoot: [],
            randomLootRarity: {},
            randomLootQuantity: 0
        },

        none: {
            minLoot: [],
            randomLoot: [],
            randomLootRarity: {},
            randomLootQuantity: 0
        }
    }
};
