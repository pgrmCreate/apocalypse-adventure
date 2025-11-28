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
            finesseMultiplier: 1.0
        }
    },

    bat: {
        name: "Batte de base-ball",
        value: 8,
        type: "arme",
        rarity: 2,
        weaponStats: {
            baseDamage: 3,
            forceMultiplier: 1.0,
            finesseMultiplier: 0.5
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
            finesseMultiplier: 0.2
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
            finesseMultiplier: 0.3
        }
    },

    matches: {
        name: "Boîte d'allumettes",
        value: 1,
        type: "outil",
        rarity: 1
    },

    cloth: {
        name: "Torchon",
        value: 1,
        type: "divers",
        rarity: 1
    },

    towel: {
        name: "Serviette",
        value: 2,
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
        rarity: 1,
        heal: 0,
        bandageQuality: 1
    },

    cannedFood: {
        name: "Conserve de haricots",
        value: 4,
        type: "consommable",
        rarity: 2,
        hungerRestore: 3
    },

    waterBottle: {
        name: "Bouteille d'eau",
        value: 3,
        type: "consommable",
        rarity: 2,
        thirstRestore: 3
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
        rarity: 1,
        bagStats: {
            capacity: 30
        }
    },
    smallBag: {
        name: "Petit sac à dos",
        value: 5,
        type: "sac",
        rarity: 2,
        bagStats: {
            capacity: 35
        }
    },

    bigBag: {
        name: "Gros sac de rando",
        value: 8,
        type: "sac",
        rarity: 3,
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
            finesseMultiplier: 0.8
        },
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
        rarity: 1,
        weaponStats: {
            baseDamage: 2,
            forceMultiplier: 0.7,
            finesseMultiplier: 0.5
        },
        canCraft: {
            ingredients: ["plank", "cloth", "matches"],
            consume: ["plank", "cloth", "matches"]
        }
    },

    cleanBandage: {
        name: "Bandage stérilisé",
        value: 3,
        type: "consommable",
        rarity: 2,
        heal: 0,
        bandageQuality: 2,
        canCraft: {
            ingredients: ["bandage", "towel"],
            consume: ["bandage", "towel"]
        }
    }
};
