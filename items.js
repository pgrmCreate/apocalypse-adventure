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
        rarity: "uncommon",
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
        rarity: "uncommon",
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
        rarity: "rare",
        weaponStats: {
            baseDamage: 4,
            forceMultiplier: 1.4,
            finesseMultiplier: 0.2
        }
    },

    plank: {
        name: "Planche de bois",
        value: 6,
        type: "outil",
        rarity: "common",
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
        rarity: "common"
    },

    bandage: {
        name: "Bandage",
        value: 2,
        type: "consommable",
        rarity: "common",
        heal: 3
    },

    cannedFood: {
        name: "Conserve de haricots",
        value: 4,
        type: "consommable",
        rarity: "common",
        heal: 2,
        hungerRestore: 3
    },

    waterBottle: {
        name: "Bouteille d'eau",
        value: 3,
        type: "consommable",
        rarity: "common",
        heal: 1,
        thirstRestore: 3
    },

    medkit: {
        name: "Trousse de soins",
        value: 6,
        type: "consommable",
        rarity: "rare",
        heal: 5
    },

    satchel: {
        name: "Cartable",
        value: 5,
        type: "sac",
        rarity: "uncommon",
        bagStats: {
            capacity: 30
        }
    },
    smallBag: {
        name: "Petit sac à dos",
        value: 5,
        type: "sac",
        rarity: "uncommon",
        bagStats: {
            capacity: 35
        }
    },

    bigBag: {
        name: "Gros sac de rando",
        value: 8,
        type: "sac",
        rarity: "rare",
        bagStats: {
            capacity: 50
        }
    },

    // Exemple de craft : planche + couteau -> lance artisanale
    spear: {
        name: "Lance artisanale",
        value: 7,
        type: "arme",
        rarity: "uncommon",
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
    }
};
