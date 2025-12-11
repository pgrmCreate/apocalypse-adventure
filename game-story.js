// Histoire refondue : scenes ouvertes, narration detaillee, pas d'actions absurdes (ex: fouiller sa propre chambre)

window.GAME_STORY = {
    scenes: {
        // --- Appartement du heros ---

        intro: {
            id: "intro",
            title: "Chambre barricadee",
            text:
                "Tu as passe plusieurs jours enferme au 3e etage. Les planches sur la fenetre et le matelas contre la porte ont tenu, mais la reserve baisse et les bruits dans l'immeuble se rapprochent. Il est temps de sortir avec methode.",
            locationId: "apt_main",
            timeContext: "slow",
            minLoot: [],
            randomLoot: [],
          options: [
              {
                  text: "Retirer la barricade et rejoindre le salon",
                  nextScene: "aptLiving",
                  timeCost: 1,
                  setFlagOnAttempt: "barricade_removed",
                  setFlagOnSuccess: "barricade_removed",
                  hideIfFlag: "barricade_removed"
              },
              {
                  text: "Rejoindre le salon",
                    nextScene: "aptLiving",
                    timeCost: 1,
                    showIfFlag: "barricade_removed"
                },
                {
                    text: "Respirer et maintenir le calme avant de bouger",
                    nextScene: "intro",
                    timeCost: 0
                }
            ]
        },

        aptLiving: {
            id: "aptLiving",
            title: "Salon encombre",
            text:
                "Le salon est praticable, couvert de couvertures et de meubles pousses contre les murs. Le couloir est au sud, la cuisine a l'est, ta chambre a l'ouest. Rien ne semble immediatement dangereux, mais chaque bruit compte.",
            locationId: "apt_living",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["waterBottle", "paper", "energyBar"],
            randomLootRarity: { 1: 0.8, 2: 0.18, 3: 0.02 },
            options: [
                {
                    text: "Retourner dans la chambre",
                    nextScene: "intro",
                    timeCost: 1
                },
                {
                    text: "Aller a la cuisine",
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
            title: "Cuisine ravagee",
            text:
                "Les placards sont portes ouverts, l'odeur d'epices et de poussiere se melange. Quelques boites ont roule sous la table. Tout bruit attire ton attention; mieux vaut rester rapide.",
            locationId: "apt_kitchen",
            timeContext: "slow",
            minLoot: ["cannedFood", "waterBottle"],
            randomLoot: ["knife", "matches", "energyBar", "flare"],
            randomLootRarity: { 1: 0.75, 2: 0.2, 3: 0.05 },
            options: [
                {
                    text: "Ouvrir le placard renverse (risque de morsure)",
                    diceTest: {
                        type: "combat",
                        diceCount: 2,
                        diceSides: 6,
                        difficulty: 9,
                        description:
                            "Un corps maigre tente de s'extraire du placard renverse. Tu le repousses pour garder la main."
                    },
                    successScene: "aptKitchen",
                    failScene: "aptKitchen",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -3 },
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
            title: "Couloir du 3e etage",
            text:
                "La moquette est couverte de papiers et de traces de pas seches. La porte du voisin 3B est entrouverte. Au fond, la cage d'escalier descend vers les etages inferieurs.",
            locationId: "apt_hallway",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["pen", "paper", "cloth", "flare"],
            randomLootRarity: { 1: 0.88, 2: 0.1, 3: 0.02 },
            options: [
                {
                    text: "Observer l'appartement 3B",
                    nextScene: "neighbor3Door",
                    timeCost: 1
                },
                {
                    text: "Descendre vers la cage d'escalier",
                    nextScene: "stairs3Encounter",
                    timeCost: 1
                },
                {
                    text: "Revenir au salon",
                    nextScene: "aptLiving",
                    timeCost: 1
                }
            ]
        },

        neighbor3Door: {
            id: "neighbor3Door",
            title: "Porte de l'appartement 3B",
            text:
                "La serrure est arrachee de l'interieur. Un filet d'odeur metallique s'echappe, melange de rouille et de sang sec. Tu distingues un sac renverse dans l'entree.",
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
                    text: "Revenir dans le couloir",
                    nextScene: "aptHallway",
                    timeCost: 0
                }
            ]
        },

        neighbor3Inside: {
            id: "neighbor3Inside",
            title: "Appartement 3B",
            text:
                "Le salon est renverse, mais silencieux. Des provisions oubliees et une trousse de secours ouverte trainent sur la table. Les murs portent des griffures profondes.",
            locationId: "apt_neighbor3",
            timeContext: "slow",
            minLoot: ["bandage"],
            randomLoot: ["antisepticSpray", "energyBar", "cloth", "cigarette"],
            randomLootRarity: { 1: 0.7, 2: 0.2, 3: 0.1 },
            options: [
                {
                    text: "Revenir dans le couloir",
                    nextScene: "aptHallway",
                    timeCost: 1
                }
            ]
        },

        // --- Escalier ---

        stairs3Encounter: {
            id: "stairs3Encounter",
            title: "Cage d'escalier du 3e",
            text:
                "Un rodeur tangue a mi-palier, la bouche ouverte. Il te voit a peine, mais bloque la descente. Tu dois agir vite ou faire demi-tour.",
            locationId: "stairs3",
            timeContext: "fast",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Le repousser et le finir",
                    diceTest: {
                        type: "combat",
                        diceCount: 2,
                        diceSides: 6,
                        difficulty: 10,
                        description: "Tu frappes avant qu'il ne puisse agripper tes vetements."
                    },
                    successScene: "stairs3Clear",
                    failScene: "aptHallway",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -4 },
                    startDistanceRange: { min: 0, max: 1 }
                },
                {
                    text: "Faire diversion et se faufiler",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "finesse",
                        difficulty: 8,
                        description: "Tu descends deux marches, fais tinter la rampe, puis glisses sur le cote."
                    },
                    successScene: "stairs3Clear",
                    failScene: "aptHallway",
                    successEffect: {},
                    failEffect: { hpChange: -2 },
                    startDistanceRange: { min: 1, max: 2 }
                },
                {
                    text: "Revenir au couloir",
                    nextScene: "aptHallway",
                    timeCost: 0
                }
            ]
        },

        stairs3Clear: {
            id: "stairs3Clear",
            title: "Escalier degage",
            text:
                "Le palier est calme. Les marches grincent mais tu peux descendre sans te faire surprendre. Des traces de sang seche indiquent un passage recent.",
            locationId: "stairs3",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["bandage", "cloth"],
            randomLootRarity: { 1: 0.82, 2: 0.15, 3: 0.03 },
            options: [
                {
                    text: "Descendre au 2e etage",
                    nextScene: "landing2",
                    timeCost: 1
                },
                {
                    text: "Remonter vers ton etage",
                    nextScene: "aptHallway",
                    timeCost: 1
                }
            ]
        },

        // --- 2e etage ---

        landing2: {
            id: "landing2",
            title: "Palier du 2e",
            text:
                "Le palier est silencieux, couvert de poussiere. La porte du 2A est entrouverte. Une ampoule grignote encore un peu de courant et clignote a intervalle regulier.",
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
                    text: "Descendre au 1er etage",
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
            title: "Appartement 2A - Atelier improvise",
            text:
                "Des planches, des clous et une perceuse cassee trainent. Un bricolage de barricade a ete commence puis abandonne. L'air sent la poussiere et l'huile.",
            locationId: "apt2",
            timeContext: "slow",
            minLoot: ["plank", "rustyPipe"],
            randomLoot: ["bandage", "cloth", "nail", "flare"],
            randomLootRarity: { 1: 0.7, 2: 0.2, 3: 0.1 },
            options: [
                {
                    text: "Ouvrir le coffre a outils renverse",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "force",
                        difficulty: 9,
                        description: "Le couvercle est coince par une planche, tu forces en gardant l'oreille tendue."
                    },
                    successScene: "apt2",
                    failScene: "apt2",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -2 }
                },
                {
                    text: "Revenir sur le palier",
                    nextScene: "landing2",
                    timeCost: 1
                }
            ]
        },

        // --- 1er etage ---

        landing1: {
            id: "landing1",
            title: "Palier du 1er",
            text:
                "Tu entends des grattements derriere certaines portes, sans savoir si ce sont des survivants ou pire. La porte du 1A est entrouverte. En dessous, le hall d'entree.",
            locationId: "landing1",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["cannedFood", "cloth", "energyBar"],
            randomLootRarity: { 1: 0.83, 2: 0.14, 3: 0.03 },
            options: [
                {
                    text: "Entrer dans l'appartement 1A",
                    nextScene: "apt1",
                    timeCost: 1
                },
                {
                    text: "Descendre vers le hall d'entree",
                    nextScene: "groundHall",
                    timeCost: 1
                },
                {
                    text: "Remonter au 2e",
                    nextScene: "landing2",
                    timeCost: 1
                }
            ]
        },

        apt1: {
            id: "apt1",
            title: "Appartement 1A - Pieces intactes",
            text:
                "Cet appartement est surprenamment intact. Une table renversee sert de barricade legere. Sur le frigo est scotchee une cle rouillee etiquetee 'Garage'.",
            locationId: "apt1",
            timeContext: "slow",
            minLoot: ["garageKey", "waterBottle", "energyBar"],
            randomLoot: ["medkit", "antisepticSpray", "towel"],
            randomLootRarity: { 1: 0.7, 2: 0.2, 3: 0.1 },
            options: [
                {
                    text: "Verifier la chambre obscure",
                    diceTest: {
                        type: "combat",
                        diceCount: 2,
                        diceSides: 6,
                        difficulty: 10,
                        description: "Quelque chose se cache sous le lit. Tu degages le matelas et prevois un geste rapide."
                    },
                    successScene: "apt1",
                    failScene: "apt1",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -3 },
                    startDistanceRange: { min: 0, max: 1 }
                },
                {
                    text: "Revenir sur le palier",
                    nextScene: "landing1",
                    timeCost: 1
                }
            ]
        },

        // --- Rez-de-chaussee ---

        groundHall: {
            id: "groundHall",
            title: "Hall d'entree",
            text:
                "Le hall baigne dans une lumiere poussiereuse. La porte vitree principale est cloutee de l'exterieur. Un couloir mene vers une porte en acier: le garage.",
            locationId: "groundHall",
            timeContext: "fast",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Examiner la porte principale",
                    nextScene: "mainDoorWork",
                    timeCost: 1
                },
                {
                    text: "Chercher l'acces au garage",
                    nextScene: "garageEntrance",
                    timeCost: 1
                },
                {
                    text: "Remonter au 1er etage",
                    nextScene: "landing1",
                    timeCost: 1
                }
            ]
        },

        mainDoorWork: {
            id: "mainDoorWork",
            title: "Porte clouee de l'immeuble",
            text:
                "Des planches et des chaines ferment la porte principale. En poussant ton oreille contre la vitre, tu n'entends que le vent. Avec du levier, tu pourrais ouvrir une issue sur la rue.",
            locationId: "groundHall",
            timeContext: "slow",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Utiliser un pied-de-biche pour degager les planches",
                    requiredItem: "crowbar",
                    nextScene: "streetIntro",
                    timeCost: 1
                },
                {
                    text: "Degonder patiemment a mains nues",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "force",
                        difficulty: 9,
                        description: "Tu tires sur les charnieres en evitant les eclats."
                    },
                    successScene: "streetIntro",
                    failScene: "groundHall",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -1 }
                },
                {
                    text: "Laisser la porte pour l'instant",
                    nextScene: "groundHall",
                    timeCost: 0
                }
            ]
        },

        // --- Garage ---

        garageEntrance: {
            id: "garageEntrance",
            title: "Porte du garage",
            text:
                "Une porte en acier abimee, tracee de chocs. La serrure semble fatiguee. Des traces de pneus indiquent des sorties recentes avant l'evacuation.",
            locationId: "garage",
            timeContext: "slow",
            minLoot: ["plank"],
            randomLoot: ["cannedFood", "waterBottle", "rustyPipe", "matches"],
            randomLootRarity: { 1: 0.65, 2: 0.25, 3: 0.1 },
            options: [
                {
                    text: "Utiliser la cle du garage",
                    requiredItem: "garageKey",
                    nextScene: "garageShadow",
                    timeCost: 1
                },
                {
                    text: "Forcer la serrure avec finesse",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "finesse",
                        difficulty: 7,
                        description: "Tu glisses un outil dans la serrure et cherches a faire sauter le pene."
                    },
                    successScene: "garageShadow",
                    failScene: "groundHall",
                    successEffect: {},
                    failEffect: { hpChange: -1 }
                },
                {
                    text: "Revenir dans le hall",
                    nextScene: "groundHall",
                    timeCost: 1
                }
            ]
        },

        garageShadow: {
            id: "garageShadow",
            title: "Sous-sol encombre",
            text:
                "Tu progresses entre les voitures et les piliers. Un moteur a ete laisse ouvert, des outils trainent. Les grognements sont etouffes par le beton. La rampe de sortie mene a une ruelle.",
            locationId: "garage",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["cannedFood", "waterBottle", "flare", "kitchenPan"],
            randomLootRarity: { 1: 0.65, 2: 0.25, 3: 0.1 },
            options: [
                {
                    text: "Avancer vers la rampe en evitant les silhouettes",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "finesse",
                        difficulty: 8,
                        description: "Tu respires lentement et te glisses entre les voitures pour rejoindre la lumiere."
                    },
                    successScene: "outsideRamp",
                    failScene: "garageShadow",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -2 },
                    startDistanceRange: { min: 1, max: 2 }
                },
                {
                    text: "Ramasser des pieces detachables et souffler un instant",
                    nextScene: "garageShadow",
                    timeCost: 2
                },
                {
                    text: "Remonter vers le hall",
                    nextScene: "groundHall",
                    timeCost: 1
                }
            ]
        },

        outsideRamp: {
            id: "outsideRamp",
            title: "Sortie du garage",
            text:
                "La rampe debouche sur une ruelle. L'air exterieur est lourd, mais libre. Tu entends des corbeaux et des pas lointains. La porte du garage reste ouverte derriere toi.",
            locationId: "outside",
            timeContext: "fast",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Aller vers la ruelle principale",
                    nextScene: "streetIntro",
                    timeCost: 1
                },
                {
                    text: "Revenir dans le garage",
                    nextScene: "garageShadow",
                    timeCost: 1
                }
            ]
        },

        // --- Rue et exterieur ---

        streetIntro: {
            id: "streetIntro",
            title: "Ruelle",
            text:
                "La ruelle colle aux murs des immeubles. A gauche, la facade d'une pharmacie. Plus loin, un square envahi de brume. Des camions bloques ferment une partie de la rue, laissant un passage vers un quai de livraison.",
            locationId: "street_alley",
            timeContext: "slow",
            minLoot: ["cloth"],
            randomLoot: ["flare", "energyBar", "waterBottle"],
            randomLootRarity: { 1: 0.8, 2: 0.15, 3: 0.05 },
            options: [
                {
                    text: "Traverser vers la pharmacie",
                    nextScene: "pharmacyFront",
                    timeCost: 1
                },
                {
                    text: "Couper par le square",
                    nextScene: "parkSquare",
                    timeCost: 1
                },
                {
                    text: "Prendre le passage vers le quai de livraison",
                    nextScene: "deliveryYard",
                    timeCost: 1
                },
                {
                    text: "Descendre vers l'entree de metro",
                    nextScene: "subwayEntrance",
                    timeCost: 1
                },
                {
                    text: "Retourner vers la rampe du garage",
                    nextScene: "outsideRamp",
                    timeCost: 1
                }
            ]
        },

        pharmacyFront: {
            id: "pharmacyFront",
            title: "Devanture de pharmacie",
            text:
                "Les vitrines sont fissurees mais tiennent encore. Une porte laterale laisse passer un courant d'air. L'interieur semble sombre mais ordonne.",
            locationId: "pharmacy_front",
            timeContext: "slow",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Entrer dans la pharmacie",
                    nextScene: "pharmacyInside",
                    timeCost: 1
                },
                {
                    text: "Revenir dans la ruelle",
                    nextScene: "streetIntro",
                    timeCost: 1
                }
            ]
        },

        pharmacyInside: {
            id: "pharmacyInside",
            title: "Pharmacie",
            text:
                "Les rayons sont a moitie vides. Des boites renversees jonchent le sol. Un bruit de verre provient de l'arriere-boutique, peut-etre un animal ou pire.",
            locationId: "pharmacy_inside",
            timeContext: "slow",
            minLoot: ["bandage", "cleanBandage"],
            randomLoot: ["medkit", "waterBottle", "antisepticSpray", "energyBar"],
            randomLootRarity: { 1: 0.68, 2: 0.2, 3: 0.12 },
            options: [
                {
                    text: "Verifier l'arriere-boutique",
                    diceTest: {
                        type: "combat",
                        diceCount: 2,
                        diceSides: 6,
                        difficulty: 9,
                        description: "Une silhouette boiteuse sort de derriere le comptoir. Tu anticipes sa trajectoire."
                    },
                    successScene: "pharmacyInside",
                    failScene: "pharmacyInside",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -3 },
                    startDistanceRange: { min: 1, max: 2 }
                },
                {
                    text: "Sortir vers la ruelle",
                    nextScene: "streetIntro",
                    timeCost: 1
                }
            ]
        },

        // --- Square ---

        parkSquare: {
            id: "parkSquare",
            title: "Square envahi",
            text:
                "Les bancs sont renverses et l'herbe haute. Des sacs de sable ecrases jalonnent le chemin central. Au nord-est, un kiosque effondre; au sud, la bouche de metro; a l'est, un campement; au nord, la ruelle.",
            locationId: "park",
            timeContext: "slow",
            minLoot: ["towel"],
            randomLoot: ["plank", "bandage", "cloth", "energyBar"],
            randomLootRarity: { 1: 0.85, 2: 0.12, 3: 0.03 },
            options: [
                {
                    text: "Approcher du bassin asseche",
                    nextScene: "parkFountain",
                    timeCost: 1
                },
                {
                    text: "Aller vers le kiosque effondre",
                    nextScene: "parkKiosk",
                    timeCost: 1
                },
                {
                    text: "Rejoindre le campement a l'est",
                    nextScene: "survivorCamp",
                    timeCost: 1
                },
                {
                    text: "Descendre vers la bouche de metro",
                    nextScene: "subwayEntrance",
                    timeCost: 1
                },
                {
                    text: "Retourner vers la ruelle",
                    nextScene: "streetIntro",
                    timeCost: 1
                },
                {
                    text: "Gravir l'escalier de secours",
                    nextScene: "fireEscapeLanding",
                    timeCost: 1
                }
            ]
        },

        parkFountain: {
            id: "parkFountain",
            title: "Bassin asseche",
            text:
                "Le bassin est recouvert de feuilles et de detritus. Une grille d'evacuation laisse entendre un grattement faible, peut-etre un petit animal ou quelque chose de coince.",
            locationId: "park_fountain",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["bandage", "antisepticSpray", "toothbrush"],
            randomLootQuantity: 1,
            options: [
                {
                    text: "Soulever la grille rapidement",
                    diceTest: {
                        type: "skill",
                        diceCount: 1,
                        diceSides: 6,
                        stat: "audace",
                        difficulty: 5,
                        description: "Tu glisses tes doigts sous la grille et jettes un oeil sans t'attarder."
                    },
                    successScene: "parkFountain",
                    failScene: "parkFountain",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -1 },
                    timeCost: 1
                },
                {
                    text: "Revenir au centre du square",
                    nextScene: "parkSquare",
                    timeCost: 1
                },
                {
                    text: "Suivre le chemin vers la bouche de metro",
                    nextScene: "subwayEntrance",
                    timeCost: 1
                },
                {
                    text: "Remonter vers le kiosque",
                    nextScene: "parkKiosk",
                    timeCost: 1
                }
            ]
        },

        parkKiosk: {
            id: "parkKiosk",
            title: "Kiosque effondre",
            text:
                "Un ancien kiosque a journaux effondre. Des caisses sont renversees, et des boites de conserve sont dissimulees sous des magazines trempes.",
            locationId: "park_kiosk",
            timeContext: "slow",
            minLoot: ["cannedFood"],
            randomLoot: ["paper", "flare", "energyBar"],
            randomLootQuantity: 1,
            options: [
                {
                    text: "Soulever les caisses et recuperer ce qui reste",
                    nextScene: "parkKiosk",
                    timeCost: 1
                },
                {
                    text: "Retourner vers le square",
                    nextScene: "parkSquare",
                    timeCost: 1
                },
                {
                    text: "Rejoindre la ruelle par le nord-est",
                    nextScene: "streetIntro",
                    timeCost: 1
                }
            ]
        },

        survivorCamp: {
            id: "survivorCamp",
            title: "Campement de fortune",
            text:
                "Une tente ecrasee et un feu eteint. Un survivant blesse t'observe, mefiant mais lucide. Il semble avoir des vivres a echanger contre un peu d'aide.",
            locationId: "camp",
            timeContext: "fast",
            minLoot: [],
            randomLoot: ["cannedFood"],
            options: [
                {
                    text: "Lui parler calmement et proposer de l'eau",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "audace",
                        difficulty: 8,
                        description: "Tu avances mains ouvertes, expliques ton plan et proposes de partager."
                    },
                    successScene: "parkSquare",
                    failScene: "parkSquare",
                    successEffect: { hpChange: 2, finesseChange: 1 },
                    failEffect: { hpChange: -1 }
                },
                {
                    text: "Ramasser ce qui traine sans l'inquieter",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "finesse",
                        difficulty: 9,
                        description: "Tu fouilles rapidement les sacs ouverts en gardant un oeil sur lui."
                    },
                    successScene: "parkSquare",
                    failScene: "parkSquare",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -1 }
                },
                {
                    text: "Quitter le campement",
                    nextScene: "parkSquare",
                    timeCost: 1
                }
            ]
        },

        subwayEntrance: {
            id: "subwayEntrance",
            title: "Bouche de metro",
            text:
                "L'escalier plonge dans l'obscurite. Le souffle d'air est froid. Des affiches dechirees indiquent une evacuation avortee. Tu peux surveiller les environs ou tenter une descente rapide.",
            locationId: "subway_entrance",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["flare"],
            options: [
                {
                    text: "Descendre un palier et ecouter",
                    diceTest: {
                        type: "skill",
                        diceCount: 1,
                        diceSides: 6,
                        stat: "audace",
                        difficulty: 4,
                        description: "Tu descends quelques marches et t'arretes pour guetter les bruits."
                    },
                    successScene: "subwayEntrance",
                    failScene: "subwayEntrance",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -1 },
                    timeCost: 1
                },
                {
                    text: "Remonter vers le square",
                    nextScene: "parkSquare",
                    timeCost: 1
                },
                {
                    text: "Revenir vers la ruelle",
                    nextScene: "streetIntro",
                    timeCost: 1
                }
            ]
        },

        // --- Zone arriere / quai ---

        deliveryYard: {
            id: "deliveryYard",
            title: "Quai de livraison",
            text:
                "Des camions bloques, des palettes et un portail entrouvert. On entend des chaines qui grincent. Des boites de conserve ont roule sous un camion couche.",
            locationId: "delivery_yard",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["cannedFood", "plank", "energyBar"],
            randomLootQuantity: 1,
            options: [
                {
                    text: "Inspecter sous le camion couche",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "finesse",
                        difficulty: 8,
                        description: "Tu te glisses sous le chassis en surveillant les ombres."
                    },
                    successScene: "deliveryYard",
                    failScene: "deliveryYard",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -2 }
                },
                {
                    text: "Retourner vers la ruelle",
                    nextScene: "streetIntro",
                    timeCost: 1
                },
                {
                    text: "Gravir l'escalier de secours voisin",
                    nextScene: "fireEscapeLanding",
                    timeCost: 1
                }
            ]
        },

        fireEscapeLanding: {
            id: "fireEscapeLanding",
            title: "Palier d'escalier de secours",
            text:
                "Depuis le palier metallique, tu domines la ruelle et le square. Les barreaux grincent, mais tu apercois un appartement entrouvert a hauteur d'epaules.",
            locationId: "fire_escape",
            timeContext: "slow",
            minLoot: [],
            randomLoot: ["paper", "energyBar"],
            randomLootQuantity: 1,
            options: [
                {
                    text: "Entrer par l'appartement ouvert",
                    diceTest: {
                        type: "skill",
                        diceCount: 1,
                        diceSides: 6,
                        stat: "finesse",
                        difficulty: 7,
                        description: "Tu te hisses par la fenetre en prenant appui sur la rambarde."
                    },
                    successScene: "fireEscapeLanding",
                    failScene: "fireEscapeLanding",
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -1 },
                    timeCost: 1
                },
                {
                    text: "Redescendre vers le quai de livraison",
                    nextScene: "deliveryYard",
                    timeCost: 1
                },
                {
                    text: "Descendre l'echelle vers le square",
                    nextScene: "parkSquare",
                    timeCost: 1
                }
            ]
        },

        // --- Game over generique ---

        gameOver: {
            id: "gameOver",
            title: "Tu ne te releves pas",
            text:
                "Le monde continuera de pourrir sans toi. Ta survie s'acheve ici, mais d'autres tenteront leur chance.",
            locationId: "none",
            timeContext: "slow",
            minLoot: [],
            randomLoot: [],
            options: [
                {
                    text: "Recommencer depuis le debut",
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
            minLoot: [],
            randomLoot: [],
            randomLootRarity: {},
            randomLootQuantity: 0,
            enemyDistanceRange: { min: 0, max: 1 }
        },

        apt_living: {
            mapLabel: "Salon (3A)",
            mapPaths: { west: "apt_main", east: "apt_kitchen", south: "apt_hallway" },
            mapFloor: 3,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: ["waterBottle", "paper", "energyBar"],
            randomLootRarity: { 1: 0.8, 2: 0.18, 3: 0.02 },
            randomLootQuantity: 0.5,
            enemyDistanceRange: { min: 0, max: 1 }
        },

        apt_kitchen: {
            mapLabel: "Cuisine (3A)",
            mapPaths: { west: "apt_living" },
            mapFloor: 3,
            mapSize: { width: 1, height: 1 },
            minLoot: ["cannedFood", "waterBottle"],
            randomLoot: ["knife", "matches", "energyBar", "flare"],
            randomLootRarity: { 1: 0.75, 2: 0.2, 3: 0.05 },
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
            randomLoot: ["pen", "paper", "cloth", "flare"],
            randomLootRarity: { 1: 0.88, 2: 0.1, 3: 0.02 },
            randomLootQuantity: 0.5,
            enemyDistanceRange: { min: 1, max: 2 }
        },

        apt_neighbor3: {
            mapLabel: "Appartement 3B",
            mapPaths: { west: "apt_hallway" },
            mapFloor: 3,
            mapSize: { width: 2, height: 1 },
            minLoot: ["bandage"],
            randomLoot: ["antisepticSpray", "energyBar", "cloth", "cigarette"],
            randomLootRarity: { 1: 0.7, 2: 0.2, 3: 0.1 },
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
            randomLootRarity: { 1: 0.82, 2: 0.15, 3: 0.03 },
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
            minLoot: ["plank", "rustyPipe"],
            randomLoot: ["bandage", "cloth", "nail", "flare"],
            randomLootRarity: { 1: 0.7, 2: 0.2, 3: 0.1 },
            randomLootQuantity: 1,
            enemyDistanceRange: { min: 1, max: 2 }
        },

        landing1: {
            mapLabel: "Palier 1er",
            mapPaths: { north: "landing2", east: "apt1", south: "groundHall" },
            mapFloor: 1,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: ["cannedFood", "cloth", "energyBar"],
            randomLootRarity: { 1: 0.83, 2: 0.14, 3: 0.03 },
            randomLootQuantity: 0.8,
            enemyDistanceRange: { min: 1, max: 2 }
        },

        apt1: {
            mapLabel: "Appartement 1A",
            mapPaths: { west: "landing1" },
            mapFloor: 1,
            mapSize: { width: 2, height: 1 },
            minLoot: ["waterBottle", "garageKey", "energyBar"],
            randomLoot: ["medkit", "antisepticSpray", "towel"],
            randomLootRarity: { 1: 0.7, 2: 0.2, 3: 0.1 },
            randomLootQuantity: 1,
            enemyDistanceRange: { min: 0, max: 1 }
        },

        groundHall: {
            mapLabel: "Hall d'entree",
            mapPaths: { north: "landing1", east: "garage" },
            mapFloor: 0,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: [],
            randomLootRarity: { 1: 0.8, 2: 0.2 },
            randomLootQuantity: 1,
            enemyDistanceRange: { min: 1, max: 2 }
        },

        garage: {
            mapLabel: "Garage",
            mapPaths: { west: "groundHall", south: "outside" },
            mapFloor: 0,
            mapSize: { width: 3, height: 2 },
            minLoot: ["plank"],
            randomLoot: ["cannedFood", "waterBottle", "anvil", "matches", "crowbar", "nail", "kitchenPan"],
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
            randomLoot: ["toothbrush", "towel", "matches", "lighter", "flare", "energyBar"],
            randomLootRarity: { 1: 0.8, 2: 0.15, 3: 0.05 },
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
            mapLabel: "Pharmacie (interieur)",
            mapPaths: { west: "pharmacy_front" },
            mapFloor: 0,
            mapSize: { width: 2, height: 2 },
            minLoot: ["bandage", "cleanBandage"],
            randomLoot: ["medkit", "waterBottle", "antisepticSpray", "energyBar"],
            randomLootRarity: { 1: 0.68, 2: 0.2, 3: 0.12 },
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
            randomLoot: ["plank", "bandage", "cloth", "energyBar"],
            randomLootRarity: { 1: 0.85, 2: 0.12, 3: 0.03 },
            randomLootQuantity: 1.3
        },

        camp: {
            mapLabel: "Camp de fortune",
            mapPaths: { west: "park" },
            mapFloor: 0,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: ["cannedFood", "waterBottle", "energyBar"],
            randomLootRarity: { 1: 0.72, 2: 0.23, 3: 0.05 },
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
            randomLoot: ["cannedFood", "plank", "energyBar"],
            randomLootRarity: { 1: 0.8, 2: 0.15, 3: 0.05 },
            randomLootQuantity: 0.8
        },

        subway_entrance: {
            mapLabel: "Bouche de metro",
            mapPaths: { northwest: "street_alley", north: "park_fountain" },
            mapFloor: 0,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: ["flare"],
            randomLootRarity: { 1: 0.85, 2: 0.15 },
            randomLootQuantity: 0.6
        },

        park_kiosk: {
            mapLabel: "Kiosque effondre",
            mapPaths: { southwest: "park", northeast: "street_alley" },
            mapFloor: 0,
            mapSize: { width: 2, height: 1 },
            minLoot: ["cannedFood"],
            randomLoot: ["paper", "flare", "energyBar"],
            randomLootRarity: { 1: 0.85, 2: 0.12, 3: 0.03 },
            randomLootQuantity: 0.8
        },

        park_fountain: {
            mapLabel: "Bassin asseche",
            mapPaths: { north: "park", northeast: "park_kiosk", south: "subway_entrance" },
            mapFloor: 0,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: ["bandage", "antisepticSpray", "toothbrush"],
            randomLootRarity: { 1: 0.78, 2: 0.18, 3: 0.04 },
            randomLootQuantity: 0.6
        },

        fire_escape: {
            mapLabel: "Escalier de secours",
            mapPaths: { southwest: "delivery_yard", south: "park" },
            mapFloor: 0,
            mapSize: { width: 2, height: 1 },
            minLoot: [],
            randomLoot: ["paper", "energyBar"],
            randomLootRarity: { 1: 0.82, 2: 0.15, 3: 0.03 },
            randomLootQuantity: 0.6
        },

        none: {
            minLoot: [],
            randomLoot: [],
            randomLootRarity: {},
            randomLootQuantity: 0
        }
    }
};
