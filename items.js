// Définition des objets du jeu
// Chaque objet a :
// - name : nom affiché
// - value : poids/volume abstrait (impacte la charge)
// - type : "outil", "consommable", "sac", etc. (catégorie affichée)
// - weaponStats : si l'objet peut être utilisé comme arme
// - bagStats    : si l'objet peut être équipé comme sac
// - heal / hungerRestore / thirstRestore : effets si consommable
// - canCraft : recette pour fabriquer CET objet (sortie)

window.ITEM_TEMPLATES = {
    knife: {
        name: "Couteau de cuisine",
        value: 4,
        type: "outil",
        rarity: 2,
        weaponStats: {
            baseDamage: 2,
            forceMultiplier: 0.5,
            finesseMultiplier: 1.0,
            throwable: true,
            range: 1
        }
    },

    bat: {
        name: "Batte de base-ball",
        value: 8,
        type: "arme",
        rarity: 3,
        weaponStats: {
            baseDamage: 3,
            forceMultiplier: 1.0,
            finesseMultiplier: 0.5,
            range: 1
        }
    },

    crowbar: {
        name: "Pied-de-biche",
        value: 9,
        type: "arme",
        rarity: 3,
        weaponStats: {
            baseDamage: 4,
            forceMultiplier: 1.1,
            finesseMultiplier: 0.4,
            range: 1
        }
    },

    anvil: {
        name: "Enclume",
        value: 50,
        type: "outil",
        rarity: 3,
        weaponStats: {
            baseDamage: 4,
            forceMultiplier: 1.4,
            finesseMultiplier: 0.2,
            range: 1
        }
    },

    plank: {
        name: "Planche de bois",
        value: 8,
        type: "outil",
        rarity: 1,
        weaponStats: {
            baseDamage: 2,
            forceMultiplier: 0.8,
            finesseMultiplier: 0.3,
            throwable: true,
            range: 1
        }
    },

    matches: {
        name: "Boîte d'allumettes",
        value: 1,
        type: "outil",
        rarity: 1
    },

    lighter: {
        name: "Briquet",
        value: 1,
        type: "outil",
        rarity: 2
    },

    cigarette: {
        name: "Cigarettes",
        value: 1,
        type: "consommable",
        rarity: 2,
        useDurationSec: 3
    },

    paper: {
        name: "Feuilles de papier",
        value: 1,
        type: "divers",
        rarity: 1
    },

    pen: {
        name: "Stylo",
        value: 1,
        type: "divers",
        rarity: 1
    },

    nail: {
        name: "Sachet de clous",
        value: 2,
        type: "divers",
        rarity: 1
    },

    hammer: {
        name: "Marteau",
        value: 5,
        type: "outil",
        rarity: 1,
        weaponStats: {
            baseDamage: 2,
            forceMultiplier: 0.9,
            finesseMultiplier: 0.4,
            throwable: true,
            range: 1
        }
    },

    garageKey: {
        name: "Clé du garage",
        value: 1,
        type: "clé",
        rarity: 2
    },

    cloth: {
        name: "Torchon",
        value: 3,
        type: "divers",
        rarity: 1
    },

    towel: {
        name: "Serviette",
        value: 4,
        type: "divers",
        rarity: 1
    },

    toothbrush: {
        name: "Brosse à dents",
        value: 1,
        type: "divers",
        rarity: 1
    },

    bandage: {
        name: "Bandage",
        value: 2,
        type: "consommable",
        rarity: 2,
        heal: 0,
        bandageQuality: 1,
        useDurationSec: 4
    },

    cannedFood: {
        name: "Conserve de petits pois",
        value: 3,
        type: "consommable",
        rarity: 2,
        hungerRestore: 3,
        useDurationSec: 6
    },

    improvisedBandage: {
        name: "Bandage de fortune",
        value: 2,
        type: "consommable",
        rarity: 1,
        heal: 0,
        bandageQuality: 1,
        useDurationSec: 4,
        craftDurationSec: 4,
        canCraft: {
            ingredients: ["tornCloth"],
            consume: ["tornCloth"]
        }
    },

    cannedFoodBeans: {
        name: "Conserve de haricots",
        value: 4,
        type: "consommable",
        rarity: 2,
        hungerRestore: 5,
        useDurationSec: 6
    },
    cannedFoodCarrots: {
        name: "Conserve de carottes",
        value: 4,
        type: "consommable",
        rarity: 2,
        hungerRestore: 4,
        useDurationSec: 6
    },

    waterBottle: {
        name: "Bouteille d'eau",
        value: 3,
        type: "consommable",
        rarity: 2,
        thirstRestore: 7
    },

    medkit: {
        name: "Trousse de soins",
        value: 6,
        type: "consommable",
        rarity: 3,
        heal: 5
    },

    satchel: {
        name: "Cartable",
        value: 5,
        type: "sac",
        rarity: 2,
        bagStats: {
            capacity: 30
        }
    },
    smallBag: {
        name: "Petit sac à dos",
        value: 5,
        type: "sac",
        rarity: 3,
        bagStats: {
            capacity: 35
        }
    },
    sportBag: {
        name: "Sac de sport",
        value: 5,
        type: "sac",
        rarity: 3,
        bagStats: {
            capacity: 40
        }
    },

    trailBag: {
        name: "Sac de rando",
        value: 8,
        type: "sac",
        rarity: 5,
        bagStats: {
            capacity: 50
        }
    },

    // Exemple de craft : planche + couteau -> lance artisanale
    spear: {
        name: "Lance artisanale",
        value: 7,
        type: "arme",
        rarity: 2,
        weaponStats: {
            baseDamage: 3,
            forceMultiplier: 0.9,
            finesseMultiplier: 0.8,
            throwable: true,
            range: 2
        },
        craftDurationSec: 7,
        // Recette de craft pour fabriquer une lance
        // - ingredients : les modèles nécessaires
        // - consume : ceux qui disparaissent (les autres restent dans l'inventaire)
        canCraft: {
            ingredients: ["plank", "knife"],
            consume: ["plank"] // le couteau reste, la planche est consommée
        }
    },

    torch: {
        name: "Torche improvisée",
        value: 6,
        type: "arme",
        rarity: 3,
        weaponStats: {
            baseDamage: 5,
            forceMultiplier: 0.7,
            finesseMultiplier: 0.8,
            range: 1
        },
        craftDurationSec: 8,
        canCraft: {
            ingredients: ["plank", "cloth", "matches"],
            consume: ["plank", "cloth", "matches"]
        }
    },
    studdedBat: {
        name: "Bat cloutée",
        value: 6,
        type: "arme",
        rarity: 6,
        weaponStats: {
            baseDamage: 7,
            forceMultiplier: 1,
            finesseMultiplier: 1,
            range: 1
        },
        craftDurationSec: 6,
        canCraft: {
            ingredients: ["bat", "nails"],
            consume: ["bat", "nails"]
        }
    },

    tornCloth: {
        name: "Tissu déchiré",
        value: 3,
        type: "divers",
        rarity: 1,
        craftDurationSec: 3,
        canCraft: {
            ingredients: [["towel", "cloth"]],
            consume: [["towel", "cloth"]]
        }
    },

    cleanBandage: {
        name: "Bandage stérilisé",
        value: 2,
        type: "consommable",
        rarity: 2,
        heal: 0,
        bandageQuality: 2,
        useDurationSec: 4,
        craftDurationSec: 6,
        canCraft: {
            ingredients: ["bandage", "towel"],
            consume: ["bandage", "towel"]
        }
    }
};
