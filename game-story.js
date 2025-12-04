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
                    text: "Passer dans le salon",
                    nextScene: "aptLiving",
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
            minLoot: ["satchel", "toothbrush"],
            randomLoot: ["cannedFood", "waterBottle", "cloth", "bandage"],
            randomLootRarity: { 1: 0.8, 2: 0.2},
            options: [
                {
                    text: "Revenir t'asseoir un instant",
                    nextScene: "intro",
                    timeCost: 0
                },
                {
                    text: "Ouvrir l'armoire qui cogne au fond",
                    diceTest: {
                        type: "combat",
                        diceCount: 1,
                        diceSides: 6,
                        difficulty: 8,
                        description:
                            "Un rôdeur enfermé tente de sortir de la penderie."
                    },
                    successScene: "aptMainSearch",
                    failScene: "aptMainSearch",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -3 },
                    startDistanceRange: { min: 0, max: 1 }
                },
                {
                    text: "Passer dans le salon",
                    nextScene: "aptLiving",
                    timeCost: 1
                }
            ]
        },

        aptLiving: {
            id: "aptLiving",
            title: "Salon encombré",
            text:
                "Le salon est en désordre mais praticable. La lumière filtrant des planches donne au tapis une teinte poussiéreuse. Le couloir est visible au sud, la cuisine à l'est et ta chambre à l'ouest.",
            locationId: "apt_living",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["waterBottle", "paper"],
            randomLootRarity: { 1: 0.85, 2: 0.13, 3: 0.02 },
            options: [
                {
                    text: "Retourner dans ta chambre",
                    nextScene: "intro",
                    timeCost: 1
                },
                {
                    text: "Aller à la cuisine",
                    nextScene: "aptKitchen",
                    timeCost: 1
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
                "L'odeur de nourriture avariée flotte encore. Quelques conserves ont survécu aux premiers jours de panique et un petit briquet traîne près du four éteint.",
            locationId: "apt_kitchen",
            timeContext: "slow",
            minLoot: ["cannedFood", "towel", "knife"],
            randomLoot: ["waterBottle", "knife", "cloth", "matches", "lighter"],
            randomLootRarity: { 1: 0.85, 2: 0.15 },
            options: [
                {
                    text: "Inspecter le placard qui s'ouvre tout seul",
                    diceTest: {
                        type: "combat",
                        diceCount: 2,
                        diceSides: 6,
                        difficulty: 10,
                        description:
                            "Une silhouette décharnée jaillit avec un couteau rouillé."
                    },
                    successScene: "aptKitchen",
                    failScene: "aptKitchen",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -4 },
                    startDistanceRange: { min: 0, max: 1 }
                },
                {
                    text: "Retourner au salon",
                    nextScene: "aptLiving",
                    timeCost: 1
                }
            ]
        },

        aptHallway: {
            id: "aptHallway",
            title: "Couloir du 3e étage",
            text:
                "La moquette est maculée de traces de pas sèches. Des feuilles volantes annotées traînent au sol et la porte de ton voisin en face est entrebâillée. La cage d’escalier est au bout du couloir.",
            locationId: "apt_hallway",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["plank", "cloth", "pen", "paper"],
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
                    nextScene: "aptLiving",
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
                "L’appartement est renversé, mais personne ne semble là. Sur la table, quelques provisions oubliées et un paquet de cigarettes écrasé.",
            locationId: "apt_neighbor3",
            timeContext: "slow",
            minLoot: ["cannedFood"],
            randomLoot: ["waterBottle", "bandage", "towel"],
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
            randomLoot: ["bandage", "cloth"],
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
            randomLoot: ["bandage", "toothbrush"],
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
                "Une odeur de moisissure et de produits ménagers mélangés. Des cartons éventrés, une armoire renversée… et des outils de bricolage abandonnés dans l'entrée.",
            locationId: "apt2",
            timeContext: "slow",
            minLoot: ["bandage", "towel"],
            randomLoot: ["sportBag", "plank", "cloth", "nail"],
            randomLootRarity: { 1: 0.65, 2: 0.25, 3: 0.1 },
            options: [
                {
                    text: "Revenir sur le palier",
                    nextScene: "landing2",
                    timeCost: 1
                },
                {
                    text: "Forcer la chambre barricadée",
                    requiredItem: "hammer",
                    diceTest: {
                        type: "combat",
                        diceCount: 2,
                        diceSides: 6,
                        difficulty: 11,
                        description:
                            "Un voisin transformé se jette sur toi dès que la porte cède."
                    },
                    successScene: "apt2",
                    failScene: "apt2",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -4 },
                    startDistanceRange: { min: 1, max: 2 }
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
            randomLoot: ["cannedFood", "cloth"],
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
                "Le salon est en désordre, mais relativement épargné. Une table renversée, des verres brisés, des papiers griffonnés éparpillés et une cuisine encore pleine de traces de vie normale.",
            locationId: "apt1",
            timeContext: "slow",
            minLoot: ["waterBottle", "towel", "garageKey"],
            randomLoot: ["medkit", "toothbrush", "pen", "paper"],
            randomLootRarity: { 1: 0.7, 2: 0.2, 3: 0.1 },
            options: [
                {
                    text: "Revenir sur le palier",
                    nextScene: "landing1",
                    timeCost: 1
                },
                {
                    text: "Explorer la chambre plongée dans le noir",
                    diceTest: {
                        type: "combat",
                        diceCount: 2,
                        diceSides: 6,
                        difficulty: 10,
                        description:
                            "Un occupant malade rampe hors du lit dès que tu avances."
                    },
                    successScene: "apt1",
                    failScene: "apt1",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -3 },
                    startDistanceRange: { min: 0, max: 1 }
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
                    requiredItem: "garageKey",
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
                    requiredItem: "garageKey",
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
            minLoot: ["plank", "cloth"],
            randomLoot: ["cannedFood", "waterBottle", "anvil", "matches"],
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
                    text: "Suivre la ruelle vers la grande avenue",
                    nextScene: "streetIntro",
                    timeCost: 1
                },
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
                    text: "Te traîner jusqu'à la ruelle",
                    nextScene: "streetIntro",
                    timeCost: 2
                },
                {
                    text: "Fin de ce chapitre — recommencer",
                    restart: true
                }
            ]
        },

        streetIntro: {
            id: "streetIntro",
            title: "Ruelle déserte",
            text:
                "Derrière l'immeuble, la ruelle est jonchée de sacs-poubelle et de journaux détrempés. Quelques silhouettes errent au loin, attirées par rien. Au bout, une avenue silencieuse et une pharmacie barricadée.",
            locationId: "street_alley",
            timeContext: "slow",
            minLoot: ["cloth"],
            randomLoot: ["toothbrush", "towel", "matches", "lighter"],
            randomLootQuantity: 1,
            options: [
                {
                    text: "Approcher de la pharmacie",
                    nextScene: "pharmacyFront",
                    timeCost: 1
                },
                {
                    text: "Couper par le square voisin",
                    nextScene: "parkSquare",
                    timeCost: 1
                },
                {
                    text: "Retourner vers le garage (improbable)",
                    nextScene: "garageExit",
                    timeCost: 1
                },
                {
                    text: "Remonter l'impasse au nord-est jusqu'aux livraisons",
                    nextScene: "deliveryYard",
                    timeCost: 1
                },
                {
                    text: "Descendre vers la bouche de métro au sud-est",
                    nextScene: "subwayEntrance",
                    timeCost: 1
                }
            ]
        },

        deliveryYard: {
            id: "deliveryYard",
            title: "Quai de livraison encombré",
            text:
                "Une série de quais s'enfonce entre deux immeubles. Des palettes renversées et un camion frigorifique bloqué te laissent un couloir étroit pour progresser.",
            locationId: "delivery_yard",
            timeContext: "slow",
            minLoot: ["plank"],
            randomLoot: ["bandage", "matches", "waterBottle"],
            randomLootRarity: { 1: 0.8, 2: 0.15, 3: 0.05 },
            options: [
                {
                    text: "Fouiller le camion frigorifique renversé",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "finesse",
                        difficulty: 8,
                        description:
                            "Tu te glisses par la porte arrière en espérant éviter le bruit de métal qui résonne."
                    },
                    successScene: "deliveryYard",
                    failScene: "deliveryYard",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -2 },
                    timeCost: 1
                },
                {
                    text: "Suivre l'échelle de secours jusqu'aux balcons (nord-est)",
                    nextScene: "fireEscapeLanding",
                    timeCost: 1
                },
                {
                    text: "Revenir à la ruelle",
                    nextScene: "streetIntro",
                    timeCost: 1
                }
            ]
        },

        subwayEntrance: {
            id: "subwayEntrance",
            title: "Bouche de métro condamnée",
            text:
                "Les grilles du métro sont soudées mais l'escalier reste praticable. L'odeur d'ozone et de poussière remonte avec un courant d'air froid.",
            locationId: "subway_entrance",
            timeContext: "fast",
            minLoot: ["waterBottle"],
            randomLoot: ["paper", "pen", "lighter"],
            randomLootQuantity: 1,
            options: [
                {
                    text: "Tenter de forcer une grille latérale",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "audace",
                        difficulty: 10,
                        description:
                            "Tes doigts cherchent une faille pour faire levier avant qu'un rôdeur ne t'entende."
                    },
                    successScene: "subwayEntrance",
                    failScene: "subwayEntrance",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -3 },
                    timeCost: 1
                },
                {
                    text: "Contourner par la grille sud pour rejoindre le square",
                    nextScene: "parkSquare",
                    timeCost: 1
                },
                {
                    text: "Remonter vers la ruelle",
                    nextScene: "streetIntro",
                    timeCost: 1
                }
            ]
        },

        pharmacyFront: {
            id: "pharmacyFront",
            title: "Devanture de la pharmacie",
            text:
                "Les vitres sont brisées mais des étagères renversées bloquent l'entrée. Des grognements proviennent de l'intérieur.",
            locationId: "pharmacy_front",
            timeContext: "fast",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Forcer un passage discret",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "finesse",
                        difficulty: 9,
                        description:
                            "Tu soulèves une étagère en espérant ne réveiller personne."
                    },
                    successScene: "pharmacyInside",
                    failScene: "pharmacyInside",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -3 }
                },
                {
                    text: "Rebrousser chemin vers la ruelle",
                    nextScene: "streetIntro"
                }
            ]
        },

        pharmacyInside: {
            id: "pharmacyInside",
            title: "Pharmacie pillée",
            text:
                "Les rayons sont sens dessus dessous, mais quelques boîtes sont intactes. L'arrière-boutique sent encore l'alcool médical.",
            locationId: "pharmacy_inside",
            timeContext: "slow",
            minLoot: ["bandage", "cleanBandage"],
            randomLoot: ["medkit", "waterBottle", "towel"],
            randomLootRarity: { 1: 0.7, 2: 0.2, 3: 0.1 },
            options: [
                {
                    text: "Retourner dehors",
                    nextScene: "streetIntro",
                    timeCost: 1
                }
            ]
        },

        parkSquare: {
            id: "parkSquare",
            title: "Square silencieux",
            text:
                "Un petit parc envahi par les feuilles mortes. Des bancs renversés, une aire de jeux abandonnée, et des sacs à dos oubliés.",
            locationId: "park",
            timeContext: "slow",
            minLoot: ["towel"],
            randomLoot: ["plank", "toothbrush", "bandage", "cloth"],
            randomLootQuantity: 1.3,
            options: [
                {
                    text: "Récupérer tout ce qui traîne (temps)",
                    nextScene: "parkSquare",
                    timeCost: 2
                },
                {
                    text: "Repérer un campement de fortune",
                    nextScene: "survivorCamp",
                    timeCost: 1
                },
                {
                    text: "Revenir vers la ruelle",
                    nextScene: "streetIntro",
                    timeCost: 1
                },
                {
                    text: "Remonter l'allée nord-est vers un kiosque fermé",
                    nextScene: "parkKiosk",
                    timeCost: 1
                },
                {
                    text: "Descendre vers le bassin asséché au sud-ouest",
                    nextScene: "dryFountain",
                    timeCost: 1
                }
            ]
        },

        parkKiosk: {
            id: "parkKiosk",
            title: "Kiosque effondré",
            text:
                "Le kiosque à journaux est couché sur le côté. Des magazines détrempés forment un tapis glissant et une petite caisse reste coincée sous un panneau.",
            locationId: "park_kiosk",
            timeContext: "slow",
            minLoot: ["paper"],
            randomLoot: ["pen", "matches", "waterBottle"],
            randomLootRarity: { 1: 0.75, 2: 0.2, 3: 0.05 },
            options: [
                {
                    text: "Tenter d'ouvrir la caisse",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "finesse",
                        difficulty: 7,
                        description:
                            "Tu fais sauter le cadenas rouillé en espérant ne pas attirer l'attention."
                    },
                    lockedByFlag: "park_kiosk_crate_opened",
                    lockedLabel: "caisse ouverte",
                    successScene: "parkKiosk",
                    failScene: "parkKiosk",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -1 },
                    stateFlagOnSuccess: "park_kiosk_crate_opened",
                    outcomeDetails: {
                        lootOnSuccess: ["cannedFood", "waterBottle", "matches"],
                        statusOnSuccess: "La caisse a été ouverte.",
                        successDescription: "Le cadenas cède dans un claquement sec.",
                        failDescription: "Le cadenas résiste et t'écorche les doigts.",
                        successEffect:
                            "Tu gagnes en audace et récupères quelques vivres cachés dans la caisse.",
                        failEffect: "Tu perds 1 PV et restes bredouille."
                    },
                    outcomeModal: {
                        title: "Caisse du kiosque",
                        successDescription: "Le verrou tombe et la caisse s'entrouvre enfin.",
                        failDescription: "Tu secoues la caisse, mais le cadenas tient bon.",
                        successEffect: "Audace +1 et du loot supplémentaire apparaît au sol.",
                        failEffect: "Tu subis -1 PV en écorchant tes doigts."
                    },
                    timeCost: 1
                },
                {
                    text: "Continuer vers la ruelle par le passage nord-est",
                    nextScene: "streetIntro",
                    timeCost: 1
                },
                {
                    text: "Revenir dans le square",
                    nextScene: "parkSquare",
                    timeCost: 1
                }
            ]
        },

        dryFountain: {
            id: "dryFountain",
            title: "Bassin asséché",
            text:
                "Un ancien bassin ornemental envahi de feuilles mortes et d'emballages vides. L'écho porte loin ici, et tu entends parfois un grattement sous la grille d'évacuation.",
            locationId: "park_fountain",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["bandage", "cloth", "toothbrush"],
            randomLootQuantity: 1,
            options: [
                {
                    text: "Inspecter la grille d'évacuation",
                    diceTest: {
                        type: "combat",
                        diceCount: 1,
                        diceSides: 6,
                        difficulty: 7,
                        description:
                            "Tu soulèves la grille pour voir ce qui bouge dessous."
                    },
                    successScene: "dryFountain",
                    failScene: "dryFountain",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -2 },
                    timeCost: 1
                },
                {
                    text: "Remonter vers le kiosque au nord-est",
                    nextScene: "parkKiosk",
                    timeCost: 1
                },
                {
                    text: "Suivre le chemin sud vers la bouche de métro",
                    nextScene: "subwayEntrance",
                    timeCost: 1
                },
                {
                    text: "Rejoindre le centre du square",
                    nextScene: "parkSquare",
                    timeCost: 1
                }
            ]
        },

        fireEscapeLanding: {
            id: "fireEscapeLanding",
            title: "Palier d'escalier de secours",
            text:
                "Depuis le palier métallique, tu domines la ruelle et le square. Les barreaux grincent au moindre mouvement et un appartement entrouvert laisse échapper une odeur de brûlé.",
            locationId: "fire_escape",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["paper", "cloth"],
            randomLootQuantity: 1,
            options: [
                {
                    text: "Jeter un coup d'œil dans l'appartement ouvert",
                    diceTest: {
                        type: "skill",
                        diceCount: 1,
                        diceSides: 6,
                        stat: "audace",
                        difficulty: 5,
                        description:
                            "Tu te hisses par la fenêtre en prenant appui sur la rambarde."
                    },
                    successScene: "fireEscapeLanding",
                    failScene: "fireEscapeLanding",
                    successEffect: { hpChange: 1 },
                    failEffect: { hpChange: -1 },
                    timeCost: 1
                },
                {
                    text: "Redescendre vers le quai de livraison",
                    nextScene: "deliveryYard",
                    timeCost: 1
                },
                {
                    text: "Descendre l'échelle vers le square (sud)",
                    nextScene: "parkSquare",
                    timeCost: 1
                }
            ]
        },

        survivorCamp: {
            id: "survivorCamp",
            title: "Campement de fortune",
            text:
                "Une tente écrasée, un feu éteint. Tu entends un murmure: un survivant blessé qui te regarde avec méfiance.",
            locationId: "camp",
            timeContext: "fast",
            minLoot: [],
            randomLoot: ["cannedFood"],
            options: [
                {
                    text: "Lui tendre un peu d'eau et gagner sa confiance",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "audace",
                        difficulty: 8,
                        description:
                            "Tu approches les mains ouvertes en promettant d'aider."
                    },
                    lockedByFlag: "camp_survivor_interaction",
                    lockedLabel: "survivant déjà approché",
                    successScene: "parkSquare",
                    failScene: "parkSquare",
                    successEffect: { hpChange: 2, finesseChange: 1 },
                    failEffect: { hpChange: -2 },
                    stateFlagOnAttempt: "camp_survivor_interaction",
                    stateFlagOnSuccess: "camp_survivor_charmed",
                    outcomeDetails: {
                        lootOnSuccess: ["bandage", "waterBottle"],
                        statusOnSuccess: "Le survivant a été amadoué et partage ses ressources.",
                        statusOnFail: "Le survivant reste sur ses gardes après ton approche.",
                        successDescription: "Tu tends l'eau et le blessé se détend enfin.",
                        failDescription: "Il détourne le visage, persuadé que tu veux le voler.",
                        successEffect:
                            "Tu gagnes sa confiance : il soigne tes blessures, améliore ta finesse et laisse tomber quelques objets.",
                        failEffect: "Il te repousse brusquement et te blesse (-2 PV)."
                    },
                    outcomeModal: {
                        title: "Approche du survivant",
                        successDescription: "Le regard du survivant s'adoucit et il te tend ses trouvailles.",
                        failDescription: "Le survivant se crispe et te repousse violemment.",
                        successEffect: "PV +2, Finesse +1 et du loot apparaît au sol.",
                        failEffect: "Tu perds 2 PV et n'obtiens rien."
                    }
                },
                {
                    text: "Fouiller discrètement le camp",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "finesse",
                        difficulty: 10,
                        description:
                            "Tu cherches des vivres sans attirer l'attention du survivant."
                    },
                    lockedByFlag: "camp_scavenged",
                    lockedLabel: "camp déjà fouillé",
                    successScene: "parkSquare",
                    failScene: "parkSquare",
                    successEffect: {},
                    failEffect: { hpChange: -1 },
                    stateFlagOnAttempt: "camp_scavenged",
                    outcomeDetails: {
                        lootOnSuccess: ["cannedFood", "matches"],
                        statusOnSuccess: "Le camp a été fouillé et vidé de ses réserves.",
                        statusOnFail: "Le camp a été fouillé sans grand succès.",
                        successDescription: "Tu récupères discrètement quelques provisions.",
                        failDescription: "Une bourrasque renverse une gamelle et tu te coupes en la rattrapant.",
                        successEffect: "De nouvelles ressources apparaissent au sol.",
                        failEffect: "Tu perds 1 PV et n'as presque rien trouvé."
                    },
                    outcomeModal: {
                        title: "Fouille du camp",
                        successDescription: "Tu rafles quelques objets sans réveiller le blessé.",
                        failDescription: "Ta fouille bâclée te coûte une coupure douloureuse.",
                        successEffect: "Du loot supplémentaire est déposé au sol.",
                        failEffect: "-1 PV, et le camp semble vide."
                    }
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
            mapLabel: "Ta chambre (3A)",
            mapPaths: { east: "apt_living" },
            mapFloor: 3,
            mapSize: { width: 2, height: 1 },
            minLoot: ["satchel", "toothbrush"],
            randomLoot: ["bandage"],
            randomLootRarity: { 1: 0.8, 2: 0.2 },
            randomLootQuantity: 0.5,
            enemyDistanceRange: { min: 0, max: 1 }
        },

        apt_living: {
            mapLabel: "Salon (3A)",
            mapPaths: { west: "apt_main", east: "apt_kitchen", south: "apt_hallway" },
            mapFloor: 3,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: ["waterBottle", "paper"],
            randomLootRarity: { 1: 0.85, 2: 0.13, 3: 0.02 },
            randomLootQuantity: 0.4,
            enemyDistanceRange: { min: 0, max: 1 }
        },

        apt_kitchen: {
            mapLabel: "Cuisine (3A)",
            mapPaths: { west: "apt_living" },
            mapFloor: 3,
            mapSize: { width: 1, height: 1 },
            minLoot: ["cannedFood", "towel"],
            randomLoot: ["waterBottle", "knife", "cloth", "matches", "lighter"],
            randomLootRarity: { 1: 0.85, 2: 0.15 },
            randomLootQuantity: 1,
            enemyDistanceRange: { min: 0, max: 1 }
        },

        apt_hallway: {
            mapLabel: "Couloir 3e",
            mapPaths: {
                north: "apt_living",
                east: "apt_neighbor3",
                south: "stairs3"
            },
            mapFloor: 3,
            mapSize: { width: 3, height: 1 },
            minLoot: [],
            randomLoot: ["plank", "cloth", "pen", "paper"],
            randomLootRarity: { 1: 0.9, 2: 0.09, 3: 0.01 },
            randomLootQuantity: 0.5,
            enemyDistanceRange: { min: 1, max: 2 }
        },

        apt_neighbor3: {
            mapLabel: "Appartement 3B",
            mapPaths: { west: "apt_hallway" },
            mapFloor: 3,
            mapSize: { width: 2, height: 1 },
            minLoot: ["cannedFood"],
            randomLoot: ["waterBottle", "bandage", "towel", "cigarette"],
            randomLootRarity: { 1: 0.78, 2: 0.18, 3: 0.04 },
            randomLootQuantity: 1,
            enemyDistanceRange: { min: 1, max: 2 }
        },

        stairs3: {
            mapLabel: "Escalier (3e)",
            mapPaths: { north: "apt_hallway", south: "landing2" },
            mapFloor: 3,
            mapSize: { width: 1, height: 2 },
            minLoot: [],
            randomLoot: ["bandage", "cloth"],
            randomLootRarity: { 1: 0.8, 2: 0.17, 3: 0.03 },
            randomLootQuantity: 0.8,
            enemyDistanceRange: { min: 1, max: 2 }
        },

        landing2: {
            mapLabel: "Palier 2e",
            mapPaths: { north: "stairs3", east: "apt2", south: "landing1" },
            mapFloor: 2,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: ["bandage", "toothbrush"],
            randomLootRarity: { 1: 0.82, 2: 0.15, 3: 0.03 },
            randomLootQuantity: 0.8,
            enemyDistanceRange: { min: 1, max: 2 }
        },

        apt2: {
            mapLabel: "Appartement 2A",
            mapPaths: { west: "landing2" },
            mapFloor: 2,
            mapSize: { width: 2, height: 1 },
            minLoot: ["towel", "hammer"],
            randomLoot: ["bandage", "bigBag", "plank", "cloth", "nail"],
            randomLootRarity: { 1: 0.65, 2: 0.25, 3: 0.1 },
            randomLootQuantity: 1,
            enemyDistanceRange: { min: 1, max: 2 }
        },

        landing1: {
            mapLabel: "Palier 1er",
            mapPaths: { north: "landing2", east: "apt1", south: "groundHall" },
            mapFloor: 1,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: ["cannedFood", "cloth"],
            randomLootRarity: { 1: 0.85, 2: 0.12, 3: 0.03 },
            randomLootQuantity: 0.8,
            enemyDistanceRange: { min: 1, max: 2 }
        },

        apt1: {
            mapLabel: "Appartement 1A",
            mapPaths: { west: "landing1" },
            mapFloor: 1,
            mapSize: { width: 2, height: 1 },
            minLoot: ["waterBottle", "towel", "smallBag", "garageKey"],
            randomLoot: [],
            randomLootRarity: { 1: 0.7, 2: 0.15, 3: 0.05 },
            randomLootQuantity: 1,
            enemyDistanceRange: { min: 0, max: 1 }
        },

        groundHall: {
            mapLabel: "Hall d'entrée",
            mapPaths: { north: "landing1", east: "garage" },
            mapFloor: 0,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: [],
            randomLootRarity: {1: 0.8, 2: 0.2},
            randomLootQuantity: 2,
            enemyDistanceRange: { min: 1, max: 2 }
        },

        garage: {
            mapLabel: "Garage",
            mapPaths: { west: "groundHall", south: "outside" },
            mapFloor: 0,
            mapSize: { width: 3, height: 2 },
            minLoot: ["plank", "cloth"],
            randomLoot: ["cannedFood", "waterBottle", "anvil", "matches", "crowbar", "nail"],
            randomLootRarity: { 1: 0.6, 2: 0.25, 3: 0.15 },
            randomLootQuantity: 1.2,
            enemyDistanceRange: { min: 1, max: 2 }
        },

        street_alley: {
            mapLabel: "Ruelle",
            mapPaths: {
                west: "outside",
                east: "pharmacy_front",
                south: "park",
                northeast: "delivery_yard",
                southeast: "subway_entrance"
            },
            mapFloor: 0,
            mapSize: { width: 3, height: 1 },
            minLoot: ["cloth"],
            randomLoot: ["toothbrush", "towel", "matches", "lighter"],
            randomLootRarity: { 1: 0.85, 2: 0.13, 3: 0.02 },
            randomLootQuantity: 1,
            enemyDistanceRange: { min: 2, max: 4 }
        },

        pharmacy_front: {
            mapLabel: "Pharmacie (devant)",
            mapPaths: { west: "street_alley", east: "pharmacy_inside" },
            mapFloor: 0,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: [],
            randomLootRarity: {},
            randomLootQuantity: 0
        },

        pharmacy_inside: {
            mapLabel: "Pharmacie (intérieur)",
            mapPaths: { west: "pharmacy_front" },
            mapFloor: 0,
            mapSize: { width: 2, height: 2 },
            minLoot: ["bandage", "cleanBandage"],
            randomLoot: ["medkit", "waterBottle", "towel"],
            randomLootRarity: { 1: 0.7, 2: 0.2, 3: 0.1 },
            randomLootQuantity: 1.2
        },

        park: {
            mapLabel: "Square",
            mapPaths: {
                north: "street_alley",
                east: "camp",
                northeast: "park_kiosk",
                southwest: "park_fountain",
                south: "subway_entrance",
                northwest: "fire_escape"
            },
            mapFloor: 0,
            mapSize: { width: 3, height: 2 },
            minLoot: ["towel"],
            randomLoot: ["plank", "toothbrush", "bandage", "cloth"],
            randomLootRarity: { 1: 0.88, 2: 0.1, 3: 0.02 },
            randomLootQuantity: 1.3
        },

        camp: {
            mapLabel: "Camp de fortune",
            mapPaths: { west: "park" },
            mapFloor: 0,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: ["cannedFood", "waterBottle"],
            randomLootRarity: { 1: 0.7, 2: 0.25, 3: 0.05 },
            randomLootQuantity: 0.6
        },

        outside: {
            mapLabel: "Sortie du garage",
            mapPaths: { north: "garage", east: "street_alley" },
            mapFloor: 0,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: [],
            randomLootRarity: {},
            randomLootQuantity: 0
        },

        delivery_yard: {
            mapLabel: "Quai de livraison",
            mapPaths: { southwest: "street_alley", northeast: "fire_escape" },
            mapFloor: 0,
            mapSize: { width: 3, height: 1 },
            minLoot: [],
            randomLoot: [],
            randomLootRarity: {},
            randomLootQuantity: 0
        },

        subway_entrance: {
            mapLabel: "Bouche de métro",
            mapPaths: { northwest: "street_alley", north: "park_fountain" },
            mapFloor: 0,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: [],
            randomLootRarity: {},
            randomLootQuantity: 0
        },

        park_kiosk: {
            mapLabel: "Kiosque effondré",
            mapPaths: { southwest: "park", northeast: "street_alley" },
            mapFloor: 0,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: [],
            randomLootRarity: {},
            randomLootQuantity: 0
        },

        park_fountain: {
            mapLabel: "Bassin asséché",
            mapPaths: { north: "park", northeast: "park_kiosk", south: "subway_entrance" },
            mapFloor: 0,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: [],
            randomLootRarity: {},
            randomLootQuantity: 0
        },

        fire_escape: {
            mapLabel: "Escalier de secours",
            mapPaths: { southwest: "delivery_yard", south: "park" },
            mapFloor: 0,
            mapSize: { width: 2, height: 1 },
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
