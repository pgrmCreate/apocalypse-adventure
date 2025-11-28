(() => {
    "use strict";

    const BASE_CAPACITY = 20;
    const MAX_HUNGER = 10;
    const MAX_THIRST = 10;

    const itemDefs = (typeof ITEM_DEFINITIONS !== "undefined") ? ITEM_DEFINITIONS : {};

    const heroDefaults = {
        name: "Alex",
        hp: 10,
        force: 2,
        finesse: 2,
        audace: 2,
        hunger: 0,
        thirst: 0
    };

    const hero = {
        name: heroDefaults.name,
        hp: heroDefaults.hp,
        force: heroDefaults.force,
        finesse: heroDefaults.finesse,
        audace: heroDefaults.audace,
        hunger: heroDefaults.hunger,
        thirst: heroDefaults.thirst
    };

    // --- SCÈNES & LIEUX (appart → escaliers → hall → garage → ruelle → rue → supermarché) ---

    const scenes = {
        intro: {
            id: "intro",
            title: "Appartement barricadé",
            text:
                "Tu es reclus dans ton appartement du 3e étage. Les fenêtres sont condamnées, la porte est barrée par une armoire. Pourtant, il faudra bien sortir un jour.",
            locationId: "apt_living",
            timeContext: "slow",
            options: [
                {
                    text: "Inspecter la cuisine",
                    nextScene: "aptKitchen"
                },
                {
                    text: "Inspecter la chambre",
                    nextScene: "aptBedroom"
                },
                {
                    text: "Sortir sur le palier du 3e étage",
                    nextScene: "floor3Corridor"
                }
            ]
        },

        aptKitchen: {
            id: "aptKitchen",
            title: "Cuisine",
            text:
                "La cuisine est sens dessus dessous, mais quelques réserves ont survécu aux premiers jours du chaos.",
            locationId: "apt_kitchen",
            timeContext: "slow",
            lootOnEnter: ["cannedFood", "waterBottle"],
            randomLootPool: ["knife", "matches"],
            randomLootCount: 1,
            options: [
                {
                    text: "Retourner dans le salon",
                    nextScene: "intro"
                },
                {
                    text: "Sortir sur le palier du 3e étage",
                    nextScene: "floor3Corridor"
                }
            ]
        },

        aptBedroom: {
            id: "aptBedroom",
            title: "Chambre",
            text:
                "Dans ta chambre, les tiroirs éventrés et le lit en vrac témoignent de tes nuits agitées.",
            locationId: "apt_bedroom",
            timeContext: "slow",
            lootOnEnter: ["bandage", "smallBag"],
            randomLootPool: ["medkit"],
            randomLootCount: 1,
            options: [
                {
                    text: "Retourner dans le salon",
                    nextScene: "intro"
                },
                {
                    text: "Sortir sur le palier du 3e étage",
                    nextScene: "floor3Corridor"
                }
            ]
        },

        floor3Corridor: {
            id: "floor3Corridor",
            title: "Palier du 3e étage",
            text:
                "Le couloir du 3e est silencieux. La porte de ton voisin est entrouverte, et l’escalier descend dans la pénombre.",
            locationId: "floor3_corridor",
            timeContext: "slow",
            randomLootPool: ["plank"],
            randomLootCount: 1,
            options: [
                {
                    text: "Rentrer dans ton appartement",
                    nextScene: "intro"
                },
                {
                    text: "Frapper chez le voisin",
                    nextScene: "neighbor3"
                },
                {
                    text: "Descendre l’escalier vers le 2e étage",
                    nextScene: "stairs3"
                }
            ]
        },

        neighbor3: {
            id: "neighbor3",
            title: "Appartement du voisin (3e)",
            text:
                "L’appartement du voisin est sensiblement plus en désordre que le tien. Il est parti précipitamment… ou il n’est jamais parti.",
            locationId: "neighbor3_apt",
            timeContext: "slow",
            lootOnEnter: ["cannedFood", "waterBottle"],
            randomLootPool: ["matches", "bandage"],
            randomLootCount: 1,
            options: [
                {
                    text: "Revenir sur le palier",
                    nextScene: "floor3Corridor"
                }
            ]
        },

        stairs3: {
            id: "stairs3",
            title: "Escalier du 3e",
            text:
                "À peine t’engages-tu dans l’escalier qu’un rôdeur lève la tête, à quelques marches en dessous. Impossible de l’ignorer.",
            locationId: "stairs3",
            timeContext: "fast",
            options: [
                {
                    text: "L'affronter au corps à corps",
                    diceTest: {
                        type: "combat",
                        diceCount: 2,
                        diceSides: 6,
                        difficulty: 12,
                        description:
                            "Tu frappes le zombie avec ton arme ou tes poings.",
                        successScene: "stairs3FightWon",
                        failScene: "stairs3Bitten"
                    },
                    successEffect: { audaceChange: 1 },
                    failEffect: { hpChange: -5 }
                },
                {
                    text: "Tenter de te faufiler en le contournant",
                    diceTest: {
                        type: "skill",
                        diceCount: 2,
                        diceSides: 6,
                        stat: "finesse",
                        difficulty: 8,
                        description:
                            "Tu descends lentement, en te collant au mur, espérant qu'il ne te remarque pas.",
                        successScene: "stairs3SneakSuccess",
                        failScene: "stairs3Bitten"
                    },
                    successEffect: {},
                    failEffect: { hpChange: -2 }
                }
            ]
        },

        stairs3FightWon: {
            id: "stairs3FightWon",
            title: "Rôdeur neutralisé",
            text:
                "Le zombie s’effondre dans un bruit humide. À côté de lui, un sac de sport éventré laisse dépasser une batte.",
            locationId: "stairs3",
            timeContext: "fast",
            lootOnEnter: ["bat"],
            options: [
                {
                    text: "Descendre vers le 2e étage",
                    nextScene: "floor2Corridor"
                },
                {
                    text: "Remonter sur le palier du 3e",
                    nextScene: "floor3Corridor"
                }
            ]
        },

        stairs3SneakSuccess: {
            id: "stairs3SneakSuccess",
            title: "Fuite réussie",
            text:
                "Ton cœur bat à tout rompre, mais tu parviens à passer à côté du rôdeur sans qu’il ne t’attrape.",
            locationId: "stairs3",
            timeContext: "fast",
            options: [
                {
                    text: "Continuer vers le 2e étage",
                    nextScene: "floor2Corridor"
                }
            ]
        },

        stairs3Bitten: {
            id: "stairs3Bitten",
            title: "Morsure",
            text:
                "Les dents du zombie se referment sur ton bras. La douleur est atroce, mais tu parviens à l’esquiver et tu dévales les marches.",
            locationId: "stairs3",
            timeContext: "fast",
            options: [
                {
                    text: "Continuer malgré la douleur vers le 2e étage",
                    nextScene: "floor2Corridor"
                }
            ]
        },

        floor2Corridor: {
            id: "floor2Corridor",
            title: "Palier du 2e étage",
            text:
                "Le couloir du 2e est jonché de sacs éventrés. Une porte est entrouverte, et l’escalier continue vers le bas.",
            locationId: "floor2_corridor",
            timeContext: "slow",
            randomLootPool: ["plank", "matches"],
            randomLootCount: 1,
            options: [
                {
                    text: "Remonter vers le 3e étage",
                    nextScene: "floor3Corridor"
                },
                {
                    text: "Entrer dans l’appartement du 2e",
                    nextScene: "neighbor2"
                },
                {
                    text: "Descendre l’escalier vers le 1er",
                    nextScene: "stairs2"
                }
            ]
        },

        neighbor2: {
            id: "neighbor2",
            title: "Appartement du 2e",
            text:
                "Une odeur de renfermé flotte dans l’air. Le logement semble abandonné depuis longtemps, mais quelques boîtes de conserve traînent encore.",
            locationId: "neighbor2_apt",
            timeContext: "slow",
            lootOnEnter: ["cannedFood"],
            randomLootPool: ["waterBottle", "bandage", "medkit"],
            randomLootCount: 1,
            options: [
                {
                    text: "Revenir sur le palier",
                    nextScene: "floor2Corridor"
                }
            ]
        },

        stairs2: {
            id: "stairs2",
            title: "Escalier vers le 1er",
            text:
                "Les marches gémissent sous ton poids. Pas de rôdeur en vue pour l’instant.",
            locationId: "stairs2",
            timeContext: "slow",
            options: [
                {
                    text: "Remonter vers le 2e étage",
                    nextScene: "floor2Corridor"
                },
                {
                    text: "Continuer vers le 1er étage",
                    nextScene: "floor1Corridor"
                }
            ]
        },

        floor1Corridor: {
            id: "floor1Corridor",
            title: "Palier du 1er étage",
            text:
                "Le couloir du 1er est couvert de traces de sang séché. Une porte a été forcée, une autre reste close.",
            locationId: "floor1_corridor",
            timeContext: "slow",
            randomLootPool: ["plank"],
            randomLootCount: 1,
            options: [
                {
                    text: "Monter au 2e étage",
                    nextScene: "stairs2"
                },
                {
                    text: "Entrer dans l’appartement forcé",
                    nextScene: "neighbor1"
                },
                {
                    text: "Descendre l’escalier vers le rez-de-chaussée",
                    nextScene: "stairs1"
                }
            ]
        },

        neighbor1: {
            id: "neighbor1",
            title: "Appartement du 1er",
            text:
                "Tout a déjà été retourné ici, mais un survivant pressé oublie toujours quelque chose.",
            locationId: "neighbor1_apt",
            timeContext: "slow",
            lootOnEnter: ["cannedFood"],
            randomLootPool: ["waterBottle", "matches"],
            randomLootCount: 1,
            options: [
                {
                    text: "Revenir sur le palier",
                    nextScene: "floor1Corridor"
                }
            ]
        },

        stairs1: {
            id: "stairs1",
            title: "Escalier vers le rez-de-chaussée",
            text:
                "Tu vois enfin la lumière du rez-de-chaussée filtrer à travers la cage d’escalier.",
            locationId: "stairs1",
            timeContext: "slow",
            options: [
                {
                    text: "Remonter vers le 1er étage",
                    nextScene: "floor1Corridor"
                },
                {
                    text: "Descendre vers le hall d’entrée",
                    nextScene: "lobby"
                }
            ]
        },

        lobby: {
            id: "lobby",
            title: "Hall d’entrée",
            text:
                "Le hall est jonché de prospectus et de sacs éventrés. La porte principale est solidement barricadée de l’extérieur.",
            locationId: "lobby",
            timeContext: "slow",
            randomLootPool: ["waterBottle"],
            randomLootCount: 1,
            options: [
                {
                    text: "Essayer d’ouvrir la porte principale",
                    nextScene: "lobbyDoorBlocked",
                    timeCost: 0
                },
                {
                    text: "Chercher l’accès au garage",
                    nextScene: "lobbyGarage"
                },
                {
                    text: "Remonter l’escalier",
                    nextScene: "stairs1"
                }
            ]
        },

        lobbyDoorBlocked: {
            id: "lobbyDoorBlocked",
            title: "Porte principale bloquée",
            text:
                "Tu tires, tu pousses… rien à faire. Quelqu’un a empilé des meubles de l’autre côté. Par ici, impossible de sortir.",
            locationId: "lobby",
            timeContext: "fast",
            options: [
                {
                    text: "Revenir dans le hall",
                    nextScene: "lobby"
                }
            ]
        },

        lobbyGarage: {
            id: "lobbyGarage",
            title: "Couloir vers le garage",
            text:
                "Une lourde porte coupe-feu mène au sous-sol. Des panneaux indiquent “Parking” et “Locaux techniques”.",
            locationId: "lobby_garage",
            timeContext: "slow",
            lootOnEnter: ["matches"],
            randomLootPool: ["plank"],
            randomLootCount: 1,
            options: [
                {
                    text: "Descendre au garage",
                    nextScene: "garage"
                },
                {
                    text: "Revenir dans le hall",
                    nextScene: "lobby"
                }
            ]
        },

        garage: {
            id: "garage",
            title: "Garage souterrain",
            text:
                "Le garage est plongé dans une semi-obscurité. Quelques voitures abandonnées, un établi, des cartons éventrés.",
            locationId: "garage",
            timeContext: "slow",
            lootOnEnter: ["cannedFood", "waterBottle", "bigBag"],
            randomLootPool: ["medkit", "bat"],
            randomLootCount: 1,
            options: [
                {
                    text: "Sortir par la rampe vers la ruelle",
                    nextScene: "streetAlley"
                },
                {
                    text: "Remonter vers le hall",
                    nextScene: "lobby"
                }
            ]
        },

        streetAlley: {
            id: "streetAlley",
            title: "Ruelle derrière l’immeuble",
            text:
                "L’air extérieur te frappe au visage. La ruelle est étroite, encombrée de poubelles et de carcasses de voitures. Plus loin, tu devines l’enseigne d’un supermarché.",
            locationId: "street_alley",
            timeContext: "fast",
            options: [
                {
                    text: "Revenir dans le garage",
                    nextScene: "garage"
                },
                {
                    text: "Longer les murs vers la rue principale",
                    nextScene: "streetToMarket"
                }
            ]
        },

        streetToMarket: {
            id: "streetToMarket",
            title: "Rue vers le supermarché",
            text:
                "La rue est presque déserte. Des silhouettes lointaines vacillent entre les voitures abandonnées.",
            locationId: "street",
            timeContext: "fast",
            options: [
                {
                    text: "Faire demi-tour vers la ruelle et le garage",
                    nextScene: "streetAlley"
                },
                {
                    text: "Avancer jusqu'au supermarché",
                    nextScene: "market"
                }
            ]
        },

        market: {
            id: "market",
            title: "Supermarché pillé",
            text:
                "À l’intérieur du supermarché, les rayons sont ravagés, mais il reste encore quelques ressources. Tu pourrais te barricader ici pour la nuit.",
            locationId: "market",
            timeContext: "slow",
            lootOnEnter: ["cannedFood", "cannedFood", "waterBottle", "medkit"],
            randomLootPool: ["anvil", "bat"],
            randomLootCount: 1,
            options: [
                {
                    text:
                        "Te barricader dans une réserve et tenter de dormir (nuit longue, tu auras faim et soif)",
                    nextScene: "goodEnd",
                    effect: { hpChange: 2 },
                    timeCost: 7
                },
                {
                    text:
                        "Repartir aussitôt explorer un autre quartier, malgré les risques",
                    nextScene: "badEnd",
                    effect: { audaceChange: 1 },
                    timeCost: 3
                }
            ]
        },

        goodEnd: {
            id: "goodEnd",
            title: "Une nuit de répit",
            text:
                "Tu cales des étagères contre les portes et t’installes derrière un comptoir. Pour la première fois depuis longtemps, tu as de quoi manger et un semblant d’abri. Demain sera un autre combat.",
            locationId: "end_good",
            timeContext: "slow",
            options: [
                {
                    text: "Recommencer l’aventure avec un autre chemin",
                    restart: true
                }
            ]
        },

        badEnd: {
            id: "badEnd",
            title: "Trop téméraire",
            text:
                "Tu t’éloignes du supermarché, attiré par une promesse floue de liberté. Les râles se multiplient. On n’entendra jamais ton dernier cri.",
            locationId: "end_bad",
            timeContext: "fast",
            options: [
                {
                    text: "Recommencer (et peut-être être plus prudent)",
                    restart: true
                }
            ]
        },

        gameOver: {
            id: "gameOver",
            title: "Tu ne te relèveras pas",
            text:
                "Le monde continuera de pourrir sans toi. Ta survie s’achève ici.",
            locationId: "end_dead",
            timeContext: "slow",
            options: [
                {
                    text: "Recommencer depuis le début",
                    restart: true
                }
            ]
        }
    };

    let itemCounter = 0;
    let currentSceneId = null;
    let currentLocationId = null;
    let currentTimeContext = "fast";
    let equippedWeaponTemplateId = null;
    let equippedBagTemplateId = null;
    let locationStates = {};

    // DOM refs
    let storyTitleEl;
    let storyTextEl;
    let choicesEl;
    let logEl;
    let timeContextEl;

    let hpEl;
    let forceEl;
    let finesseEl;
    let audaceEl;
    let hungerEl;
    let thirstEl;
    let heroNameEl;

    let capacityEl;
    let bagNameEl;
    let inventoryEl;
    let lootEl;
    let discardEl;

    let restartBtn;
    let equippedWeaponNameEl;
    let attackPreviewEl;

    let selectedItemNameEl;
    let selectedItemInfoEl;
    let selectedItemButtonsEl;

    document.addEventListener("DOMContentLoaded", () => {
        storyTitleEl = document.getElementById("story-title");
        storyTextEl = document.getElementById("story-text");
        choicesEl = document.getElementById("choices");
        logEl = document.getElementById("log");
        timeContextEl = document.getElementById("time-context");

        hpEl = document.getElementById("stat-hp");
        forceEl = document.getElementById("stat-force");
        finesseEl = document.getElementById("stat-finesse");
        audaceEl = document.getElementById("stat-audace");
        hungerEl = document.getElementById("stat-hunger");
        thirstEl = document.getElementById("stat-thirst");
        heroNameEl = document.getElementById("hero-name");

        capacityEl = document.getElementById("capacity-value");
        bagNameEl = document.getElementById("bag-name");
        inventoryEl = document.getElementById("inventory-zone");
        lootEl = document.getElementById("loot-zone");
        discardEl = document.getElementById("discard-zone");

        equippedWeaponNameEl = document.getElementById("equipped-weapon-name");
        attackPreviewEl = document.getElementById("attack-preview");

        selectedItemNameEl = document.getElementById("selected-item-name");
        selectedItemInfoEl = document.getElementById("selected-item-info");
        selectedItemButtonsEl = document.getElementById("selected-item-buttons");

        restartBtn = document.getElementById("restart-btn");
        if (restartBtn) {
            restartBtn.addEventListener("click", restartGame);
        }

        [inventoryEl, lootEl, discardEl].forEach(zone => {
            if (!zone) return;
            zone.addEventListener("dragover", handleDragOver);
            zone.addEventListener("dragenter", handleDragEnter);
            zone.addEventListener("dragleave", handleDragLeave);
            zone.addEventListener("drop", handleDrop);
        });

        initHero();
        setupInitialInventory();
        updateCapacityUI();

        renderScene("intro");
        logMessage("Bienvenue, survivant. Clique sur un objet pour le voir, l'équiper ou le consommer.");
    });

    /* --- Héros & stats --- */

    function initHero() {
        hero.name = heroDefaults.name;
        hero.hp = heroDefaults.hp;
        hero.force = heroDefaults.force;
        hero.finesse = heroDefaults.finesse;
        hero.audace = heroDefaults.audace;
        hero.hunger = heroDefaults.hunger;
        hero.thirst = heroDefaults.thirst;

        if (heroNameEl) {
            heroNameEl.textContent = hero.name;
        }
        equippedWeaponTemplateId = null;
        equippedBagTemplateId = null;
        updateStatsUI();
    }

    function restartGame() {
        if (inventoryEl) inventoryEl.innerHTML = "";
        if (lootEl) lootEl.innerHTML = "";
        if (discardEl) discardEl.innerHTML = "Glisse ici ce que tu abandonnes.";

        if (selectedItemNameEl) selectedItemNameEl.textContent = "Aucun";
        if (selectedItemInfoEl) selectedItemInfoEl.textContent = "";
        if (selectedItemButtonsEl) selectedItemButtonsEl.innerHTML = "";

        locationStates = {};
        currentLocationId = null;
        currentSceneId = null;

        initHero();
        setupInitialInventory();
        updateCapacityUI();

        if (logEl) logEl.innerHTML = "";

        renderScene("intro");
        logMessage("Nouvelle partie lancée.");
    }

    function updateStatsUI() {
        if (hpEl) hpEl.textContent = String(hero.hp);
        if (forceEl) forceEl.textContent = String(hero.force);
        if (finesseEl) finesseEl.textContent = String(hero.finesse);
        if (audaceEl) audaceEl.textContent = String(hero.audace);
        updateNeedsUI();
        updateEquippedWeaponUI();
        updateCapacityUI();
    }

    function updateNeedsUI() {
        if (hungerEl) hungerEl.textContent = `${hero.hunger} / ${MAX_HUNGER}`;
        if (thirstEl) thirstEl.textContent = `${hero.thirst} / ${MAX_THIRST}`;
    }

    function applyEffect(effect) {
        if (!effect) return;
        if (typeof effect.hpChange === "number") {
            hero.hp += effect.hpChange;
            if (hero.hp < 0) hero.hp = 0;
            if (hero.hp > heroDefaults.hp) hero.hp = heroDefaults.hp;
        }
        if (typeof effect.forceChange === "number") {
            hero.force = Math.max(0, hero.force + effect.forceChange);
        }
        if (typeof effect.finesseChange === "number") {
            hero.finesse = Math.max(0, hero.finesse + effect.finesseChange);
        }
        if (typeof effect.audaceChange === "number") {
            hero.audace = Math.max(0, hero.audace + effect.audaceChange);
        }
        updateStatsUI();
    }

    /* --- Temps & besoins (faim / soif) --- */

    function applyTimeCost(timeUnits) {
        if (!timeUnits || timeUnits <= 0) return;

        hero.hunger += timeUnits;
        hero.thirst += timeUnits;

        let damage = 0;
        if (hero.hunger > MAX_HUNGER) {
            const extra = hero.hunger - MAX_HUNGER;
            damage += extra;
            hero.hunger = MAX_HUNGER;
        }
        if (hero.thirst > MAX_THIRST) {
            const extra = hero.thirst - MAX_THIRST;
            damage += extra * 2;
            hero.thirst = MAX_THIRST;
        }

        if (damage > 0) {
            hero.hp -= damage;
            if (hero.hp < 0) hero.hp = 0;
            logMessage(`La faim et la soif t'épuisent : tu perds ${damage} PV.`);
        }

        updateStatsUI();
        logMessage(`Le temps passe : faim +${timeUnits}, soif +${timeUnits}.`);
    }

    /* --- Inventaire & objets --- */

    function setupInitialInventory() {
        if (!inventoryEl) return;
        inventoryEl.innerHTML = "";
        addItemToInventory("knife");
        addItemToInventory("matches");
        addItemToInventory("waterBottle");
        addItemToInventory("smallBag");

        const firstBagEl = inventoryEl.querySelector('.item[data-is-bag="true"]');
        if (firstBagEl instanceof HTMLElement) {
            equipBagFromElement(firstBagEl);
        }
    }

    function addItemToInventory(templateId) {
        const item = createItemFromTemplate(templateId);
        if (!item || !inventoryEl) return;
        const el = createItemElement(item);
        inventoryEl.appendChild(el);
    }

    function createItemFromTemplate(templateId, existingInstanceId) {
        const def = itemDefs[templateId];
        if (!def) {
            console.warn("Template introuvable:", templateId);
            return null;
        }

        let instanceId;
        if (existingInstanceId) {
            instanceId = existingInstanceId;
            const parts = instanceId.split("-");
            const maybe = parseInt(parts[parts.length - 1], 10);
            if (!Number.isNaN(maybe)) {
                if (maybe > itemCounter) itemCounter = maybe;
            }
        } else {
            itemCounter += 1;
            instanceId = `${templateId}-${itemCounter}`;
        }

        const isWeapon = !!def.weaponStats;
        const isBag = !!def.bagStats;

        return {
            templateId,
            instanceId,
            name: def.name,
            value: def.value,
            type: def.type || "divers",
            isWeapon,
            isBag,
            baseDamage: isWeapon && typeof def.weaponStats.baseDamage === "number" ? def.weaponStats.baseDamage : 0,
            forceMultiplier: isWeapon && typeof def.weaponStats.forceMultiplier === "number" ? def.weaponStats.forceMultiplier : 0,
            finesseMultiplier: isWeapon && typeof def.weaponStats.finesseMultiplier === "number" ? def.weaponStats.finesseMultiplier : 0,
            heal: def.heal || 0,
            hungerRestore: def.hungerRestore || 0,
            thirstRestore: def.thirstRestore || 0,
            capacity: isBag && def.bagStats && typeof def.bagStats.capacity === "number" ? def.bagStats.capacity : 0
        };
    }

    function getItemShortTypeLabel(item) {
        const parts = [];
        if (item.isWeapon) {
            parts.push(`arme dmg ${item.baseDamage}`);
        }
        if (item.isBag) {
            parts.push(`sac ${item.capacity}`);
        }
        if (item.heal > 0) {
            parts.push(`+${item.heal} PV`);
        }
        if (item.hungerRestore > 0) {
            parts.push(`faim -${item.hungerRestore}`);
        }
        if (item.thirstRestore > 0) {
            parts.push(`soif -${item.thirstRestore}`);
        }
        if (parts.length > 0) return parts.join(", ");
        if (item.type) return item.type;
        return "";
    }

    function createItemElement(item) {
        const div = document.createElement("div");
        div.classList.add("item");
        div.setAttribute("draggable", "true");
        div.dataset.itemId = item.instanceId;
        div.dataset.value = String(item.value);
        div.dataset.name = item.name;
        div.dataset.templateId = item.templateId;
        div.dataset.type = item.type;
        div.dataset.baseDamage = String(item.baseDamage);
        div.dataset.forceMult = String(item.forceMultiplier);
        div.dataset.finesseMult = String(item.finesseMultiplier);
        div.dataset.heal = String(item.heal);
        div.dataset.hungerRestore = String(item.hungerRestore);
        div.dataset.thirstRestore = String(item.thirstRestore);
        div.dataset.capacity = String(item.capacity);
        div.dataset.isWeapon = String(item.isWeapon);
        div.dataset.isBag = String(item.isBag);

        div.addEventListener("dragstart", handleDragStart);
        div.addEventListener("click", () => handleItemClick(div));

        const labelSpan = document.createElement("span");
        const typeLabel = getItemShortTypeLabel(item);
        labelSpan.textContent = typeLabel
            ? `${item.name} (${typeLabel})`
            : item.name;

        const valueSpan = document.createElement("span");
        valueSpan.classList.add("value");
        valueSpan.textContent = item.value;

        div.appendChild(labelSpan);
        div.appendChild(valueSpan);

        return div;
    }

    function calculateInventoryLoad() {
        if (!inventoryEl) return 0;
        const items = inventoryEl.querySelectorAll(".item");
        let sum = 0;
        items.forEach(el => {
            const value = parseInt(el.dataset.value || "0", 10) || 0;
            sum += value;
        });
        return sum;
    }

    function getEquippedBagDefinition() {
        if (!equippedBagTemplateId) return null;
        const def = itemDefs[equippedBagTemplateId];
        if (!def || !def.bagStats) return null;
        return def;
    }

    function getCurrentMaxCapacity() {
        const bagDef = getEquippedBagDefinition();
        if (bagDef && bagDef.bagStats && typeof bagDef.bagStats.capacity === "number") {
            return bagDef.bagStats.capacity;
        }
        return BASE_CAPACITY;
    }

    function updateCapacityUI() {
        if (!capacityEl) return;
        const current = calculateInventoryLoad();
        const maxCap = getCurrentMaxCapacity();

        capacityEl.textContent = `${current} / ${maxCap}`;
        if (current > maxCap) {
            capacityEl.classList.add("over-limit");
        } else {
            capacityEl.classList.remove("over-limit");
        }

        if (bagNameEl) {
            const bagDef = getEquippedBagDefinition();
            bagNameEl.textContent = bagDef ? bagDef.name : "Aucun (poches seulement)";
        }
    }

    /* --- Drag & drop --- */

    function handleDragStart(event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const itemId = target.dataset.itemId;
        if (!itemId || !event.dataTransfer) return;
        event.dataTransfer.setData("text/plain", itemId);
    }

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleDragEnter(event) {
        event.preventDefault();
        const zone = event.currentTarget;
        if (zone instanceof HTMLElement) {
            zone.classList.add("over");
        }
    }

    function handleDragLeave(event) {
        const zone = event.currentTarget;
        if (zone instanceof HTMLElement) {
            zone.classList.remove("over");
        }
    }

    function handleDrop(event) {
        event.preventDefault();
        const zone = event.currentTarget;
        if (!(zone instanceof HTMLElement)) return;
        zone.classList.remove("over");

        if (!event.dataTransfer) return;
        const itemId = event.dataTransfer.getData("text/plain");
        if (!itemId) return;

        const itemEl = document.querySelector(
            `.item[data-item-id="${itemId}"]`
        );
        if (!(itemEl instanceof HTMLElement)) return;

        const originZone = itemEl.parentElement;
        if (originZone === zone) return;

        const zoneType = zone.dataset.zone;
        if (!zoneType) return;

        if (zoneType === "inventory") {
            moveItemToInventory(itemEl);
        } else if (zoneType === "loot") {
            zone.appendChild(itemEl);
        } else if (zoneType === "discard") {
            moveItemToDiscard(itemEl);
        }

        updateCapacityUI();
    }

    function moveItemToInventory(itemEl) {
        if (!inventoryEl) return;
        const parentZone = itemEl.parentElement;
        if (parentZone && parentZone.dataset.zone === "inventory") return;

        const value = parseInt(itemEl.dataset.value || "0", 10) || 0;
        const currentTotal = calculateInventoryLoad();
        const maxCap = getCurrentMaxCapacity();
        const newTotal = currentTotal + value;

        if (newTotal > maxCap) {
            logMessage(
                `Inventaire plein : tu atteindrais ${newTotal} / ${maxCap}.`
            );
            if (capacityEl) {
                capacityEl.classList.add("over-limit");
                setTimeout(() => {
                    capacityEl.classList.remove("over-limit");
                }, 400);
            }
            return;
        }

        inventoryEl.appendChild(itemEl);
    }

    function moveItemToDiscard(itemEl) {
        if (!discardEl) return;
        const parentZone = itemEl.parentElement;
        if (parentZone && parentZone.dataset.zone === "discard") return;

        const templateId = itemEl.dataset.templateId;

        if (
            itemEl.classList.contains("equipped-weapon") &&
            equippedWeaponTemplateId &&
            templateId === equippedWeaponTemplateId
        ) {
            equippedWeaponTemplateId = null;
            itemEl.classList.remove("equipped-weapon");
            updateEquippedWeaponUI();
        }

        if (
            itemEl.classList.contains("equipped-bag") &&
            equippedBagTemplateId &&
            templateId === equippedBagTemplateId
        ) {
            equippedBagTemplateId = null;
            itemEl.classList.remove("equipped-bag");
            updateCapacityUI();
        }

        discardEl.appendChild(itemEl);
    }

    /* --- Panneau d'actions sur l'objet --- */

    function handleItemClick(itemEl) {
        if (!selectedItemNameEl || !selectedItemInfoEl || !selectedItemButtonsEl) {
            return;
        }
        const name = itemEl.dataset.name || "Objet";
        const type = itemEl.dataset.type || "divers";
        const heal = parseInt(itemEl.dataset.heal || "0", 10) || 0;
        const baseDamage = parseFloat(itemEl.dataset.baseDamage || "0") || 0;
        const hungerRestore = parseInt(itemEl.dataset.hungerRestore || "0", 10) || 0;
        const thirstRestore = parseInt(itemEl.dataset.thirstRestore || "0", 10) || 0;
        const capacity = parseInt(itemEl.dataset.capacity || "0", 10) || 0;
        const weight = itemEl.dataset.value || "?";
        const isWeapon = itemEl.dataset.isWeapon === "true";
        const isBag = itemEl.dataset.isBag === "true";

        selectedItemNameEl.textContent = name;

        let infoText = `Type : ${type} • Charge : ${weight}. `;
        if (isWeapon) {
            const fMult = parseFloat(itemEl.dataset.forceMult || "0");
            const fiMult = parseFloat(itemEl.dataset.finesseMult || "0");
            infoText += `Peut servir d'arme (dégâts de base ${baseDamage}, Force x${fMult}, Finesse x${fiMult}). `;
        }
        if (isBag) {
            infoText += `Peut servir de sac (capacité max ${capacity}). `;
        }
        if (heal > 0 || hungerRestore > 0 || thirstRestore > 0) {
            const parts = [];
            if (heal > 0) parts.push(`+${heal} PV`);
            if (hungerRestore > 0) parts.push(`faim -${hungerRestore}`);
            if (thirstRestore > 0) parts.push(`soif -${thirstRestore}`);
            infoText += `Effets : ${parts.join(", ")}.`;
        }
        selectedItemInfoEl.textContent = infoText;

        selectedItemButtonsEl.innerHTML = "";

        if (isWeapon) {
            const equipBtn = document.createElement("button");
            equipBtn.classList.add("small-btn");
            equipBtn.textContent = "Équiper comme arme";
            equipBtn.addEventListener("click", () => {
                equipWeaponFromElement(itemEl);
            });
            selectedItemButtonsEl.appendChild(equipBtn);
        }

        if (isBag) {
            const bagBtn = document.createElement("button");
            bagBtn.classList.add("small-btn");
            bagBtn.textContent = "Équiper comme sac";
            bagBtn.addEventListener("click", () => {
                equipBagFromElement(itemEl);
            });
            selectedItemButtonsEl.appendChild(bagBtn);
        }

        const healVal = heal;
        const isFoodOrDrink = hungerRestore > 0 || thirstRestore > 0;

        if (healVal > 0 || isFoodOrDrink) {
            const useBtn = document.createElement("button");
            useBtn.classList.add("small-btn");
            useBtn.textContent = "Utiliser";
            useBtn.addEventListener("click", () => {
                useConsumableItem(itemEl, { isFoodOrDrink });
            });
            selectedItemButtonsEl.appendChild(useBtn);
        }

        // Jeter / Prendre
        const parentZone = itemEl.parentElement;
        const zoneType = parentZone && parentZone.dataset ? parentZone.dataset.zone : null;

        if (zoneType === "inventory") {
            const dropBtn = document.createElement("button");
            dropBtn.classList.add("small-btn");
            dropBtn.textContent = "Jeter (poser au sol)";
            dropBtn.addEventListener("click", () => {
                moveItemToDiscard(itemEl);
                updateCapacityUI();
            });
            selectedItemButtonsEl.appendChild(dropBtn);
        } else if (zoneType === "loot" || zoneType === "discard") {
            const takeBtn = document.createElement("button");
            takeBtn.classList.add("small-btn");
            takeBtn.textContent = "Prendre";
            takeBtn.addEventListener("click", () => {
                moveItemToInventory(itemEl);
                updateCapacityUI();
            });
            selectedItemButtonsEl.appendChild(takeBtn);
        }

        if (!selectedItemButtonsEl.hasChildNodes()) {
            const info = document.createElement("div");
            info.textContent = "Aucune action directe disponible.";
            info.classList.add("selected-info");
            selectedItemButtonsEl.appendChild(info);
        }
    }

    function equipWeaponFromElement(itemEl) {
        const isWeapon = itemEl.dataset.isWeapon === "true";
        if (!isWeapon) return;
        const templateId = itemEl.dataset.templateId;
        if (!templateId) return;

        equippedWeaponTemplateId = templateId;

        document.querySelectorAll(".item.equipped-weapon").forEach(el => {
            el.classList.remove("equipped-weapon");
        });
        itemEl.classList.add("equipped-weapon");

        updateEquippedWeaponUI();
        logMessage(`Tu équipes : ${itemEl.dataset.name} comme arme.`);
    }

    function equipBagFromElement(itemEl) {
        const isBag = itemEl.dataset.isBag === "true";
        if (!isBag) return;
        const templateId = itemEl.dataset.templateId;
        if (!templateId) return;

        equippedBagTemplateId = templateId;

        document.querySelectorAll(".item.equipped-bag").forEach(el => {
            el.classList.remove("equipped-bag");
        });
        itemEl.classList.add("equipped-bag");

        updateCapacityUI();
        logMessage(`Tu équipes : ${itemEl.dataset.name} comme sac.`);
    }

    function useConsumableItem(itemEl, opts) {
        const heal = parseInt(itemEl.dataset.heal || "0", 10) || 0;
        const hungerRestore = parseInt(itemEl.dataset.hungerRestore || "0", 10) || 0;
        const thirstRestore = parseInt(itemEl.dataset.thirstRestore || "0", 10) || 0;
        const isFoodOrDrink = opts && opts.isFoodOrDrink;
        const name = itemEl.dataset.name || "objet";

        const scene = scenes[currentSceneId];
        const context = (scene && scene.timeContext) || currentTimeContext;

        if (isFoodOrDrink && context === "fast") {
            logMessage("En pleine action rapide, tu n'as pas le temps de manger ou boire.");
            return;
        }

        if (heal > 0) {
            const before = hero.hp;
            hero.hp += heal;
            if (hero.hp > heroDefaults.hp) hero.hp = heroDefaults.hp;
            const gained = hero.hp - before;
            if (gained > 0) {
                logMessage(`Tu utilises ${name} et regagnes ${gained} PV.`);
            }
        }

        if (hungerRestore > 0) {
            const before = hero.hunger;
            hero.hunger = Math.max(0, hero.hunger - hungerRestore);
            const diff = before - hero.hunger;
            if (diff > 0) {
                logMessage(`Ta faim diminue de ${diff}.`);
            }
        }

        if (thirstRestore > 0) {
            const before = hero.thirst;
            hero.thirst = Math.max(0, hero.thirst - thirstRestore);
            const diff = before - hero.thirst;
            if (diff > 0) {
                logMessage(`Ta soif diminue de ${diff}.`);
            }
        }

        itemEl.remove();
        updateStatsUI();
        updateCapacityUI();

        if (
            selectedItemNameEl &&
            selectedItemNameEl.textContent === name &&
            selectedItemButtonsEl &&
            selectedItemInfoEl
        ) {
            selectedItemNameEl.textContent = "Aucun";
            selectedItemInfoEl.textContent = "";
            selectedItemButtonsEl.innerHTML = "";
        }
    }

    /* --- Combat --- */

    function getEquippedWeaponDefinition() {
        if (!equippedWeaponTemplateId) return null;
        const def = itemDefs[equippedWeaponTemplateId];
        if (!def || !def.weaponStats) return null;
        return def;
    }

    function computeBaseAttackPower() {
        const def = getEquippedWeaponDefinition();
        if (!def) {
            const base = 1;
            const value =
                      base +
                      Math.round(hero.force * 0.6 + hero.finesse * 0.4);
            return value;
        }
        const ws = def.weaponStats;
        const base = typeof ws.baseDamage === "number" ? ws.baseDamage : 1;
        const fMult =
                  typeof ws.forceMultiplier === "number" ? ws.forceMultiplier : 0.7;
        const fiMult =
                  typeof ws.finesseMultiplier === "number" ? ws.finesseMultiplier : 0.3;

        const value =
                  base +
                  Math.round(hero.force * fMult + hero.finesse * fiMult);
        return value;
    }

    function updateEquippedWeaponUI() {
        if (!equippedWeaponNameEl || !attackPreviewEl) return;
        const def = getEquippedWeaponDefinition();
        if (def) {
            equippedWeaponNameEl.textContent = def.name;
        } else {
            equippedWeaponNameEl.textContent = "Aucune (poings seulement)";
        }
        const power = computeBaseAttackPower();
        attackPreviewEl.textContent = String(power);
    }

    /* --- Journal & dés --- */

    function logMessage(text) {
        if (!logEl) return;
        const entry = document.createElement("div");
        entry.textContent = text;
        logEl.prepend(entry);

        const maxEntries = 12;
        while (logEl.children.length > maxEntries) {
            const last = logEl.lastElementChild;
            if (!last) break;
            logEl.removeChild(last);
        }
    }

    function rollDice(sides, count) {
        const rolls = [];
        let sum = 0;
        for (let i = 0; i < count; i += 1) {
            const value = Math.floor(Math.random() * sides) + 1;
            rolls.push(value);
            sum += value;
        }
        return { rolls, sum };
    }

    /* --- États de lieux (loot + objets au sol) --- */

    function saveLocationState(locationId) {
        if (!locationId || !lootEl || !discardEl) return;

        const lootItems = [];
        lootEl.querySelectorAll(".item").forEach(el => {
            const templateId = el.dataset.templateId;
            const instanceId = el.dataset.itemId;
            if (templateId && instanceId) {
                lootItems.push({ templateId, instanceId });
            }
        });

        const floorItems = [];
        discardEl.querySelectorAll(".item").forEach(el => {
            const templateId = el.dataset.templateId;
            const instanceId = el.dataset.itemId;
            if (templateId && instanceId) {
                floorItems.push({ templateId, instanceId });
            }
        });

        locationStates[locationId] = {
            lootItems,
            floorItems
        };
    }

    function loadLocationState(locationId, scene) {
        if (!lootEl || !discardEl) return;

        let state = locationStates[locationId];

        lootEl.innerHTML = "";
        discardEl.innerHTML = "Glisse ici ce que tu abandonnes.";

        if (!state) {
            state = { lootItems: [], floorItems: [] };

            if (scene.lootOnEnter) {
                scene.lootOnEnter.forEach(templateId => {
                    const item = createItemFromTemplate(templateId);
                    if (!item) return;
                    state.lootItems.push({
                        templateId: item.templateId,
                        instanceId: item.instanceId
                    });
                    const el = createItemElement(item);
                    lootEl.appendChild(el);
                });
            }

            if (scene.randomLootPool && scene.randomLootCount) {
                const pool = scene.randomLootPool.slice();
                const count = Math.min(scene.randomLootCount, pool.length);
                for (let i = 0; i < count; i += 1) {
                    const index = Math.floor(Math.random() * pool.length);
                    const templateId = pool.splice(index, 1)[0];
                    const item = createItemFromTemplate(templateId);
                    if (!item) continue;
                    state.lootItems.push({
                        templateId: item.templateId,
                        instanceId: item.instanceId
                    });
                    const el = createItemElement(item);
                    lootEl.appendChild(el);
                }
            }

            locationStates[locationId] = state;
        } else {
            state.lootItems.forEach(data => {
                const item = createItemFromTemplate(data.templateId, data.instanceId);
                if (!item) return;
                const el = createItemElement(item);
                lootEl.appendChild(el);
            });

            state.floorItems.forEach(data => {
                const item = createItemFromTemplate(data.templateId, data.instanceId);
                if (!item) return;
                const el = createItemElement(item);
                discardEl.appendChild(el);
            });
        }

        updateCapacityUI();
    }

    /* --- Navigation dans les scènes --- */

    function renderScene(sceneId) {
        const scene = scenes[sceneId];
        if (!scene) {
            console.error("Scène inconnue", sceneId);
            return;
        }

        const previousLocation = currentLocationId;
        if (previousLocation) {
            saveLocationState(previousLocation);
        }

        currentSceneId = sceneId;
        currentLocationId = scene.locationId || sceneId;
        currentTimeContext = scene.timeContext || "fast";

        if (storyTitleEl) storyTitleEl.textContent = scene.title;
        if (storyTextEl) storyTextEl.textContent = scene.text;

        if (timeContextEl) {
            if (currentTimeContext === "fast") {
                timeContextEl.textContent =
                    "Contexte : action rapide (tu n'as pas le temps de manger ou boire).";
            } else {
                timeContextEl.textContent =
                    "Contexte : temps long (chaque choix consomme du temps, la faim et la soif augmentent).";
            }
        }

        loadLocationState(currentLocationId, scene);

        if (choicesEl) {
            choicesEl.innerHTML = "";
            scene.options.forEach(option => {
                const btn = document.createElement("button");
                btn.classList.add("choice-btn");
                btn.textContent = option.text;
                btn.addEventListener("click", () => handleOption(option));
                choicesEl.appendChild(btn);
            });
        }
    }

    function handleOption(option) {
        if (option.restart) {
            restartGame();
            return;
        }

        if (option.effect) {
            applyEffect(option.effect);
            if (hero.hp <= 0) {
                renderScene("gameOver");
                return;
            }
        }

        const scene = scenes[currentSceneId];
        if (scene && scene.timeContext === "slow") {
            const cost = typeof option.timeCost === "number" ? option.timeCost : 1;
            if (cost > 0) {
                applyTimeCost(cost);
                if (hero.hp <= 0) {
                    renderScene("gameOver");
                    return;
                }
            }
        }

        if (option.diceTest) {
            resolveDiceOption(option);
            return;
        }

        if (option.nextScene) {
            renderScene(option.nextScene);
        }
    }

    function resolveDiceOption(option) {
        const d = option.diceTest;
        const diceSides = d.diceSides || 6;
        const diceCount = d.diceCount || 2;
        const result = rollDice(diceSides, diceCount);

        let bonus = 0;
        let bonusLabel = "";
        if (d.type === "combat") {
            bonus = computeBaseAttackPower();
            bonusLabel = `puissance d'attaque (${bonus})`;
        } else if (d.stat && typeof hero[d.stat] === "number") {
            bonus = hero[d.stat];
            bonusLabel = `${d.stat} (${bonus})`;
        }

        const total = result.sum + bonus;
        const rollsStr = result.rolls.join(" + ");
        const bonusText = bonusLabel ? ` + ${bonusLabel}` : "";
        const kindText = d.type === "combat" ? "[COMBAT]" : "[TEST]";

        logMessage(
            `${kindText} ${d.description} Jet : ${rollsStr} = ${result.sum}${bonusText} → total ${total} (difficulté ${d.difficulty}) : ${
                total >= d.difficulty ? "RÉUSSITE" : "ÉCHEC"
            }.`
        );

        const success = total >= d.difficulty;

        if (success && option.successEffect) {
            applyEffect(option.successEffect);
        }
        if (!success && option.failEffect) {
            applyEffect(option.failEffect);
        }

        if (hero.hp <= 0) {
            renderScene("gameOver");
            return;
        }

        const nextSceneId = success
            ? option.successScene || d.successScene
            : option.failScene || d.failScene;
        if (nextSceneId) {
            renderScene(nextSceneId);
        }
    }
})();
