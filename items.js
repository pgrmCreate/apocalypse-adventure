// Définition des objets du jeu.
// Chaque objet a :
// - type : "outil", "consommable", "médical", "sac", etc.
// - value : charge (poids + encombrement)
// - weaponStats si l'objet peut servir d'arme
// - bagStats si l'objet peut servir de sac
// - heal / hungerRestore / thirstRestore pour les consommables
const ITEM_DEFINITIONS = {
    knife: {
        name: "Couteau de cuisine",
        value: 4,
        type: "outil",
        weaponStats: {
            baseDamage: 2,
            forceMultiplier: 0.5,
            finesseMultiplier: 1.0
        }
    },

    plank: {
        name: "Planche de bois",
        value: 6,
        type: "outil",
        weaponStats: {
            baseDamage: 2,
            forceMultiplier: 1.0,
            finesseMultiplier: 0.3
        }
    },

    bat: {
        name: "Batte de base-ball",
        value: 8,
        type: "arme improvisée",
        weaponStats: {
            baseDamage: 3,
            forceMultiplier: 1.0,
            finesseMultiplier: 0.4
        }
    },

    anvil: {
        name: "Enclume",
        value: 50,
        type: "outil lourd",
        weaponStats: {
            baseDamage: 4,
            forceMultiplier: 1.4,
            finesseMultiplier: 0.1
        }
    },

    matches: {
        name: "Boîte d'allumettes",
        value: 1,
        type: "outil"
    },

    bandage: {
        name: "Bandage",
        value: 2,
        type: "médical",
        heal: 3
    },

    medkit: {
        name: "Trousse de soins",
        value: 6,
        type: "médical",
        heal: 6
    },

    cannedFood: {
        name: "Conserve de haricots",
        value: 3,
        type: "consommable",
        heal: 1,
        hungerRestore: 3
    },

    waterBottle: {
        name: "Bouteille d'eau",
        value: 3,
        type: "consommable",
        heal: 1,
        thirstRestore: 4
    },

    smallBag: {
        name: "Petit sac à dos",
        value: 5,
        type: "sac",
        bagStats: {
            capacity: 35
        }
    },

    bigBag: {
        name: "Gros sac de rando",
        value: 8,
        type: "sac",
        bagStats: {
            capacity: 50
        }
    }
};
