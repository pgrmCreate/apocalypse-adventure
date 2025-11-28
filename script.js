(() => {
    "use strict";

    const BASE_CAPACITY = 15;
    const MAX_HUNGER = 50;
    const MAX_THIRST = 50;
    const BODY_PARTS = ["bras", "jambe", "torse", "tête", "main"];
    const WOUND_TYPES = ["morsure", "entaille", "griffure", "impact", "perforation"];

    const ITEM_TEMPLATES = window.ITEM_TEMPLATES || {};
    const GAME_STORY = window.GAME_STORY || { scenes: {} };
    const scenes = GAME_STORY.scenes || {};
    const locations = GAME_STORY.locations || {};

    const DEFAULT_RARITY_CHANCES = {
        1: 0.75,
        2: 0.2,
        3: 0.05
    };

    const RARITY_LABELS = {
        1: "Très peu rare",
        2: "Peu rare",
        3: "Rare"
    };

    const RARITY_NAMES_TO_LEVEL = {
        common: 1,
        "peu courant": 2,
        uncommon: 2,
        rare: 3
    };

    const heroDefaults = {
        name: "Alex",
        hp: 10,
        maxHp: 10,
        force: 2,
        finesse: 2,
        audace: 2,
        hunger: 0,
        thirst: 0
    };

    const hero = {
        name: heroDefaults.name,
        hp: heroDefaults.hp,
        maxHp: heroDefaults.maxHp,
        force: heroDefaults.force,
        finesse: heroDefaults.finesse,
        audace: heroDefaults.audace,
        hunger: heroDefaults.hunger,
        thirst: heroDefaults.thirst
    };

    function normalizeRarity(rawRarity) {
        if (typeof rawRarity === "number" && Number.isFinite(rawRarity)) {
            return Math.max(1, Math.round(rawRarity));
        }

        if (typeof rawRarity === "string") {
            const lowered = rawRarity.trim().toLowerCase();
            const namedValue = RARITY_NAMES_TO_LEVEL[lowered];
            if (namedValue) return namedValue;

            const parsed = parseInt(lowered, 10);
            if (!Number.isNaN(parsed)) {
                return Math.max(1, Math.round(parsed));
            }
        }

        return 1;
    }

    // État des lieux (pour conserver loot + objets posés)
    const locationsState = {}; // { [locationId]: { lootNodes: HTMLElement[], discardNodes: HTMLElement[], lootGenerated: boolean } }

    let itemCounter = 0;
    let currentSceneId = null;
    let currentLocationId = null;
    let currentTimeContext = "fast";
    let equippedWeaponTemplateId = null;
    let equippedBagTemplateId = null;
    let wounds = [];

    // DOM
    let storyTitleEl;
    let storyTextEl;
    let choicesEl;
    let logEl;
    let woundsEl;
    let woundHeaderEl;
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

    let craftInfoEl;
    let craftListEl;

    document.addEventListener("DOMContentLoaded", () => {
        storyTitleEl = document.getElementById("story-title");
        storyTextEl = document.getElementById("story-text");
        choicesEl = document.getElementById("choices");
        logEl = document.getElementById("log");
        woundsEl = document.getElementById("wounds");
        woundHeaderEl = document.getElementById("wound-header");
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

        craftInfoEl = document.getElementById("craft-info");
        craftListEl = document.getElementById("craft-list");

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

        chooseHeroName();
        initHero();
        setupInitialInventory();
        updateCapacityUI();

        renderScene("intro");
        logMessage("Bienvenue, survivant. Clique sur un objet pour le voir, l'équiper, le consommer, le prendre ou le jeter.");
    });

    /* --- Héros & stats --- */

    function chooseHeroName() {
        const proposed = prompt(
            "Choisis le nom de ton survivant avant de commencer :",
            heroDefaults.name
        );
        if (typeof proposed === "string" && proposed.trim()) {
            heroDefaults.name = proposed.trim();
        }
    }

    function initHero() {
        hero.name = heroDefaults.name;
        hero.hp = heroDefaults.hp;
        hero.maxHp = heroDefaults.maxHp;
        hero.force = heroDefaults.force;
        hero.finesse = heroDefaults.finesse;
        hero.audace = heroDefaults.audace;
        hero.hunger = heroDefaults.hunger;
        hero.thirst = heroDefaults.thirst;
        wounds = [];

        if (heroNameEl) {
            heroNameEl.textContent = hero.name;
        }
        equippedWeaponTemplateId = null;
        equippedBagTemplateId = null;
        updateStatsUI();
        renderWounds();
    }

    function restartGame() {
        if (inventoryEl) inventoryEl.innerHTML = "";
        if (lootEl) lootEl.innerHTML = "";
        if (discardEl) discardEl.innerHTML = "Glisse ici ce que tu abandonnes.";

        if (selectedItemNameEl) selectedItemNameEl.textContent = "Aucun";
        if (selectedItemInfoEl) selectedItemInfoEl.textContent = "";
        if (selectedItemButtonsEl) selectedItemButtonsEl.innerHTML = "";

        // reset lieux
        for (const key in locationsState) {
            if (Object.prototype.hasOwnProperty.call(locationsState, key)) {
                delete locationsState[key];
            }
        }

        initHero();
        setupInitialInventory();
        updateCapacityUI();

        if (logEl) logEl.innerHTML = "";

        currentLocationId = null;
        currentSceneId = null;
        renderScene("intro");
        logMessage("Nouvelle partie lancée.");
    }

    function updateStatsUI() {
        if (hpEl) hpEl.textContent = `${hero.hp} / ${hero.maxHp}`;
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

    function renderWounds() {
        if (!woundsEl || !woundHeaderEl) return;
        woundHeaderEl.textContent = wounds.length
            ? `Blessures (${wounds.length})`
            : "Blessures";
        woundsEl.innerHTML = "";
        if (!wounds.length) {
            const ok = document.createElement("div");
            ok.classList.add("wound-ok");
            ok.textContent = "Aucune blessure en cours. Tes PV remonteront à fond.";
            woundsEl.appendChild(ok);
            return;
        }

        wounds.forEach(w => {
            const row = document.createElement("div");
            row.classList.add("wound-row");
            const statusParts = [];
            if (w.bleeding && !w.bandaged) statusParts.push("saigne");
            if (w.bandaged) statusParts.push("bandée");
            const turnsLeft = Math.max(1, Math.ceil(w.remainingTime));
            statusParts.push(`guérison estimée : ${turnsLeft} unité(s) de temps`);
            row.textContent = `${w.type} au ${w.part} (${statusParts.join(", ")})`;
            woundsEl.appendChild(row);
        });
    }

    function applyEffect(effect) {
        if (!effect) return;
        if (typeof effect.hpChange === "number") {
            hero.hp += effect.hpChange;
            if (effect.hpChange < 0) {
                registerWound(Math.abs(effect.hpChange));
            }
            if (hero.hp < 0) hero.hp = 0;
            if (hero.hp > hero.maxHp) hero.hp = hero.maxHp;
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

    /* --- Blessures et soins --- */

    function registerWound(damage) {
        if (!Number.isFinite(damage) || damage <= 0) return;
        const part =
            BODY_PARTS[Math.floor(Math.random() * BODY_PARTS.length)] || "corps";
        const type =
            WOUND_TYPES[Math.floor(Math.random() * WOUND_TYPES.length)] || "blessure";
        const severity = Math.max(1, Math.ceil(damage));
        const baseHeal = Math.max(3, severity * 3);
        const bleedRate = Math.max(1, Math.ceil(severity / 2));
        const wound = {
            id: `wound-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            part,
            type,
            bandaged: false,
            bandageQuality: 0,
            bleeding: true,
            remainingTime: baseHeal,
            baseHealTime: baseHeal,
            bleedRate
        };
        wounds.push(wound);
        logMessage(
            `Tu subis une ${type} au ${part}. La plaie saigne, un bandage aiderait à la stabiliser.`
        );
        renderWounds();
    }

    function applyBandage(quality) {
        if (!wounds.length) {
            logMessage("Aucune blessure à bander pour l'instant.");
            return false;
        }
        const target =
            wounds.find(w => !w.bandaged || w.bleeding) || wounds[0];
        target.bandaged = true;
        target.bleeding = false;
        target.bandageQuality = Math.max(0, quality || 0);
        const bonusReduction = 1 + target.bandageQuality;
        target.remainingTime = Math.max(1, target.remainingTime - bonusReduction);
        renderWounds();
        logMessage(
            `Tu poses un bandage sur ta ${target.type} au ${target.part}. La plaie est stabilisée.`
        );
        return true;
    }

    function processWoundsOverTime(timeUnits) {
        if (!timeUnits || timeUnits <= 0 || !wounds.length) return;

        let bleedDamage = 0;
        wounds.forEach(wound => {
            if (!wound.bandaged && wound.bleeding) {
                bleedDamage += wound.bleedRate * timeUnits;
                wound.remainingTime += timeUnits * 0.5;
            } else {
                const healRate =
                    1 + (wound.bandageQuality ? wound.bandageQuality * 0.6 : 0.4);
                wound.remainingTime -= timeUnits * healRate;
                const regain = Math.max(0, Math.round(timeUnits * healRate * 0.3));
                if (regain > 0) {
                    hero.hp = Math.min(hero.maxHp, hero.hp + regain);
                }
            }
        });

        if (bleedDamage > 0) {
            hero.hp = Math.max(0, hero.hp - bleedDamage);
            logMessage(
                `Une plaie saigne encore et te coûte ${bleedDamage} PV pendant le temps qui passe.`
            );
        }

        const beforeCount = wounds.length;
        wounds = wounds.filter(w => w.remainingTime > 0 && hero.hp > 0);
        if (beforeCount !== wounds.length) {
            logMessage("Certaines blessures se referment enfin.");
        }
        if (wounds.length === 0 && hero.hp > 0) {
            hero.hp = hero.maxHp;
            logMessage("Tu n'as plus de plaies ouvertes : tes forces reviennent au maximum.");
        }

        renderWounds();
    }

    /* --- Temps / faim / soif --- */

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
            damage += extra * 2; // la soif fait plus mal
            hero.thirst = MAX_THIRST;
        }

        if (damage > 0) {
            hero.hp -= damage;
            if (hero.hp < 0) hero.hp = 0;
            logMessage(`La faim et la soif t'épuisent : tu perds ${damage} PV.`);
        }

        processWoundsOverTime(timeUnits);

        updateStatsUI();
        logMessage(`Le temps passe : faim +${timeUnits}, soif +${timeUnits}.`);
    }

    /* --- Inventaire & objets --- */

    function setupInitialInventory() {
        if (!inventoryEl) return;
        inventoryEl.innerHTML = "";

        const firstBagEl = inventoryEl.querySelector('.item[data-has-bag="true"]');
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

    function createItemFromTemplate(templateId) {
        const tpl = ITEM_TEMPLATES[templateId];
        if (!tpl) {
            console.warn("Template introuvable:", templateId);
            return null;
        }
        itemCounter += 1;
        return {
            templateId,
            instanceId: `${templateId}-${itemCounter}`,
            name: tpl.name,
            value: tpl.value,
            category: tpl.type || "divers",
            rarity: normalizeRarity(tpl.rarity),
            weaponStats: tpl.weaponStats || null,
            bagStats: tpl.bagStats || null,
            heal: tpl.heal || 0,
            bandageQuality: tpl.bandageQuality || 0,
            hungerRestore: tpl.hungerRestore || 0,
            thirstRestore: tpl.thirstRestore || 0
        };
    }

    function getTemplateRarity(templateId) {
        const tpl = ITEM_TEMPLATES[templateId];
        if (!tpl) return 1;
        return normalizeRarity(tpl.rarity);
    }

    function getItemShortTypeLabel(item) {
        if (item.weaponStats && item.bagStats) {
            return `outil/sac & arme`;
        }
        if (item.weaponStats) {
            return `arme`;
        }
        if (item.bagStats) {
            return `sac, cap. ${item.bagStats.capacity}`;
        }
        if (item.bandageQuality > 0) {
            return `bandage (qual. ${item.bandageQuality})`;
        }
        if (item.heal > 0 && (item.hungerRestore > 0 || item.thirstRestore > 0)) {
            return `soin & ration`;
        }
        if (item.heal > 0) {
            return `+${item.heal} PV`;
        }
        if (item.category === "consommable") {
            return "consommable";
        }
        if (item.category === "outil") {
            return "outil";
        }
        return item.category;
    }

    function createItemElement(item) {
        const div = document.createElement("div");
        div.classList.add("item");
        div.setAttribute("draggable", "true");
        div.dataset.itemId = item.instanceId;
        div.dataset.value = String(item.value);
        div.dataset.name = item.name;
        div.dataset.templateId = item.templateId;
        div.dataset.category = item.category;
        div.dataset.rarity = item.rarity;

        const hasWeapon = !!item.weaponStats;
        const hasBag = !!item.bagStats;
        div.dataset.hasWeapon = hasWeapon ? "true" : "false";
        div.dataset.hasBag = hasBag ? "true" : "false";

        if (hasWeapon) {
            div.dataset.baseDamage = String(item.weaponStats.baseDamage || 0);
            div.dataset.forceMult = String(item.weaponStats.forceMultiplier || 0);
            div.dataset.finesseMult = String(item.weaponStats.finesseMultiplier || 0);
        } else {
            div.dataset.baseDamage = "0";
            div.dataset.forceMult = "0";
            div.dataset.finesseMult = "0";
        }

        if (hasBag) {
            div.dataset.capacity = String(item.bagStats.capacity || 0);
        } else {
            div.dataset.capacity = "0";
        }

        div.dataset.heal = String(item.heal || 0);
        div.dataset.bandageQuality = String(item.bandageQuality || 0);
        div.dataset.hungerRestore = String(item.hungerRestore || 0);
        div.dataset.thirstRestore = String(item.thirstRestore || 0);

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

    function getEquippedBagTemplate() {
        if (!equippedBagTemplateId) return null;
        const tpl = ITEM_TEMPLATES[equippedBagTemplateId];
        if (!tpl || !tpl.bagStats) return null;
        return tpl;
    }

    function getCurrentMaxCapacity() {
        const bagTpl = getEquippedBagTemplate();
        if (bagTpl && bagTpl.bagStats && bagTpl.bagStats.capacity > 0) {
            return bagTpl.bagStats.capacity;
        }
        return BASE_CAPACITY;
    }

    function updateCapacityUI() {
        const current = calculateInventoryLoad();
        const maxCap = getCurrentMaxCapacity();

        if (capacityEl) {
            capacityEl.textContent = `${current} / ${maxCap}`;
            if (current > maxCap) {
                capacityEl.classList.add("over-limit");
            } else {
                capacityEl.classList.remove("over-limit");
            }
        }

        if (bagNameEl) {
            const bagTpl = getEquippedBagTemplate();
            bagNameEl.textContent = bagTpl
                ? bagTpl.name
                : "Aucun (poches seulement)";
        }

        refreshCraftingUI();
    }

    /* --- Crafting --- */

    function getInventoryTemplateCounts() {
        const counts = {};
        if (!inventoryEl) return counts;
        inventoryEl.querySelectorAll(".item").forEach(el => {
            const tplId = el.dataset.templateId;
            if (!tplId) return;
            counts[tplId] = (counts[tplId] || 0) + 1;
        });
        return counts;
    }

    function isRecipeCraftable(recipe, counts) {
        if (!recipe || !Array.isArray(recipe.ingredients) || !recipe.ingredients.length) {
            return false;
        }
        const needed = {};
        recipe.ingredients.forEach(id => {
            needed[id] = (needed[id] || 0) + 1;
        });
        for (const id in needed) {
            if (!Object.prototype.hasOwnProperty.call(needed, id)) continue;
            if (!counts[id] || counts[id] < needed[id]) {
                return false;
            }
        }
        return true;
    }

    function computeCraftableTemplates() {
        const result = [];
        if (currentTimeContext !== "slow") return result;
        const counts = getInventoryTemplateCounts();
        for (const templateId in ITEM_TEMPLATES) {
            if (!Object.prototype.hasOwnProperty.call(ITEM_TEMPLATES, templateId)) continue;
            const tpl = ITEM_TEMPLATES[templateId];
            if (!tpl.canCraft) continue;
            if (isRecipeCraftable(tpl.canCraft, counts)) {
                result.push({ templateId, template: tpl, recipe: tpl.canCraft });
            }
        }
        return result;
    }

    function refreshCraftingUI() {
        if (!craftListEl || !craftInfoEl) return;

        craftListEl.innerHTML = "";

        if (currentTimeContext !== "slow") {
            craftInfoEl.textContent =
                "Tu ne peux fabriquer qu'en contexte de temps long (hors action immédiate).";
            return;
        }

        craftInfoEl.textContent =
            "Si tu as les bons matériaux sur toi, tu peux fabriquer :";

        const craftable = computeCraftableTemplates();
        if (!craftable.length) {
            const empty = document.createElement("div");
            empty.classList.add("craft-empty");
            empty.textContent = "Rien à fabriquer pour l'instant.";
            craftListEl.appendChild(empty);
            return;
        }

        craftable.forEach(entry => {
            const row = document.createElement("div");
            row.classList.add("craft-row");

            const label = document.createElement("span");
            label.textContent = entry.template.name;

            const btn = document.createElement("button");
            btn.classList.add("small-btn");
            btn.textContent = "Fabriquer";
            btn.addEventListener("click", () => {
                performCraft(entry.templateId, entry.recipe);
            });

            row.appendChild(label);
            row.appendChild(btn);
            craftListEl.appendChild(row);
        });
    }

    function performCraft(outputTemplateId, recipe) {
        if (currentTimeContext !== "slow") {
            logMessage(
                "Tu n'as pas le temps de fabriquer quoi que ce soit en pleine action rapide."
            );
            return;
        }

        const counts = getInventoryTemplateCounts();
        if (!isRecipeCraftable(recipe, counts)) {
            logMessage("Tu n'as plus les ressources nécessaires pour fabriquer ça.");
            refreshCraftingUI();
            return;
        }

        const consumeList =
                  recipe && Array.isArray(recipe.consume) && recipe.consume.length
                      ? recipe.consume
                      : (recipe && recipe.ingredients) || [];

        const consumedCounts = {};
        consumeList.forEach(id => {
            consumedCounts[id] = (consumedCounts[id] || 0) + 1;
        });

        if (inventoryEl) {
            for (const tplId in consumedCounts) {
                if (!Object.prototype.hasOwnProperty.call(consumedCounts, tplId)) continue;
                let toRemove = consumedCounts[tplId];
                const itemEls = Array.from(
                    inventoryEl.querySelectorAll(`.item[data-template-id="${tplId}"]`)
                );
                for (const el of itemEls) {
                    if (toRemove <= 0) break;
                    el.remove();
                    toRemove -= 1;
                }
            }
        }

        addItemToInventory(outputTemplateId);
        updateCapacityUI();

        const outTpl = ITEM_TEMPLATES[outputTemplateId];
        const craftedName = outTpl ? outTpl.name : outputTemplateId;
        logMessage(`Tu fabriques ${craftedName}.`);
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

        const itemEl = document.querySelector(`.item[data-item-id="${itemId}"]`);
        if (!(itemEl instanceof HTMLElement)) return;

        const originZone = itemEl.parentElement;
        if (originZone === zone) return;

        const zoneType = zone.dataset.zone;
        if (!zoneType) return;

        if (zoneType === "inventory") {
            const value = parseInt(itemEl.dataset.value || "0", 10) || 0;
            const currentTotal = calculateInventoryLoad();
            const originIsInventory =
                      originZone && originZone.dataset.zone === "inventory";
            const newTotal = originIsInventory
                ? currentTotal
                : currentTotal + value;

            const maxCap = getCurrentMaxCapacity();
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
            zone.appendChild(itemEl);
        } else if (zoneType === "loot") {
            zone.appendChild(itemEl);
        } else if (zoneType === "discard") {
            if (
                itemEl.classList.contains("equipped-weapon") &&
                equippedWeaponTemplateId &&
                itemEl.dataset.templateId === equippedWeaponTemplateId
            ) {
                equippedWeaponTemplateId = null;
                itemEl.classList.remove("equipped-weapon");
                updateEquippedWeaponUI();
            }
            if (
                itemEl.classList.contains("equipped-bag") &&
                equippedBagTemplateId &&
                itemEl.dataset.templateId === equippedBagTemplateId
            ) {
                equippedBagTemplateId = null;
                itemEl.classList.remove("equipped-bag");
                updateCapacityUI();
            }
            zone.appendChild(itemEl);
        }

        updateCapacityUI();
        clearSelectedItem();
    }

    /* --- Panneau d'actions sur l'objet --- */

    function handleItemClick(itemEl) {
        if (!selectedItemNameEl || !selectedItemInfoEl || !selectedItemButtonsEl) {
            return;
        }
        const name = itemEl.dataset.name || "Objet";
        const category = itemEl.dataset.category || "divers";
        const heal = parseInt(itemEl.dataset.heal || "0", 10) || 0;
        const baseDamage = parseFloat(itemEl.dataset.baseDamage || "0") || 0;
        const hungerRestore =
                  parseInt(itemEl.dataset.hungerRestore || "0", 10) || 0;
        const thirstRestore =
                  parseInt(itemEl.dataset.thirstRestore || "0", 10) || 0;
        const bandageQuality =
                  parseInt(itemEl.dataset.bandageQuality || "0", 10) || 0;
        const capacity =
                  parseInt(itemEl.dataset.capacity || "0", 10) || 0;
        const weight = itemEl.dataset.value || "?";
        const hasWeapon = itemEl.dataset.hasWeapon === "true";
        const hasBag = itemEl.dataset.hasBag === "true";
        const rarity = parseInt(itemEl.dataset.rarity || "1", 10) || 1;

        const originZone = itemEl.parentElement;
        const originZoneType =
                  originZone && originZone.dataset ? originZone.dataset.zone : "";

        selectedItemNameEl.textContent = name;

        const rarityLabel = RARITY_LABELS[rarity] || rarity;
        let infoText = `Rareté : ${rarityLabel}. Type : ${category}. Charge : ${weight}. `;
        if (hasWeapon) {
            const fMult = parseFloat(itemEl.dataset.forceMult || "0");
            const fiMult = parseFloat(itemEl.dataset.finesseMult || "0");
            infoText += `Peut servir d'arme : dégâts de base ${baseDamage}, profite de Force x${fMult} et Finesse x${fiMult}. `;
        }
        if (hasBag) {
            infoText += `Peut servir de sac : capacité maximale ${capacity} si équipé. `;
        }
        if (bandageQuality > 0) {
            infoText += `Soin : bandage (qualité ${bandageQuality}) pour stabiliser une plaie. `;
        }
        if (heal > 0 || hungerRestore > 0 || thirstRestore > 0) {
            const parts = [];
            if (heal > 0) parts.push(`+${heal} PV`);
            if (hungerRestore > 0) parts.push(`faim -${hungerRestore}`);
            if (thirstRestore > 0) parts.push(`soif -${thirstRestore}`);
            infoText += `Consommable : ${parts.join(", ")}.`;
        }

        selectedItemInfoEl.textContent = infoText.trim();

        selectedItemButtonsEl.innerHTML = "";

        const inInventory = originZoneType === "inventory";
        const onGround = originZoneType === "loot" || originZoneType === "discard";

        // Équipement : seulement si dans l'inventaire
        if (inInventory && hasWeapon) {
            const equipBtn = document.createElement("button");
            equipBtn.classList.add("small-btn");
            equipBtn.textContent = "Équiper comme arme";
            equipBtn.addEventListener("click", () => {
                equipWeaponFromElement(itemEl);
            });
            selectedItemButtonsEl.appendChild(equipBtn);
        }

        if (inInventory && hasBag) {
            const bagBtn = document.createElement("button");
            bagBtn.classList.add("small-btn");
            bagBtn.textContent = "Équiper comme sac";
            bagBtn.addEventListener("click", () => {
                equipBagFromElement(itemEl);
            });
            selectedItemButtonsEl.appendChild(bagBtn);
        }

        const isFoodOrDrink = hungerRestore > 0 || thirstRestore > 0;
        if (heal > 0 || isFoodOrDrink || bandageQuality > 0) {
            const useBtn = document.createElement("button");
            useBtn.classList.add("small-btn");
            useBtn.textContent = "Utiliser";
            useBtn.addEventListener("click", () => {
                useConsumableItem(itemEl, { isFoodOrDrink });
            });
            selectedItemButtonsEl.appendChild(useBtn);
        }

        if (inInventory) {
            const dropBtn = document.createElement("button");
            dropBtn.classList.add("small-btn");
            dropBtn.textContent = "Jeter (poser au sol)";
            dropBtn.addEventListener("click", () => {
                dropItemToDiscard(itemEl);
            });
            selectedItemButtonsEl.appendChild(dropBtn);
        }

        if (onGround) {
            const takeBtn = document.createElement("button");
            takeBtn.classList.add("small-btn");
            takeBtn.textContent = "Prendre";
            takeBtn.addEventListener("click", () => {
                takeItemToInventory(itemEl);
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

    function clearSelectedItem() {
        if (selectedItemNameEl) selectedItemNameEl.textContent = "Aucun";
        if (selectedItemInfoEl) selectedItemInfoEl.textContent = "";
        if (selectedItemButtonsEl) selectedItemButtonsEl.innerHTML = "";
    }

    function dropItemToDiscard(itemEl) {
        if (!discardEl) return;
        const originZone = itemEl.parentElement;
        if (!originZone || originZone.dataset.zone !== "inventory") return;

        if (
            itemEl.classList.contains("equipped-weapon") &&
            equippedWeaponTemplateId &&
            itemEl.dataset.templateId === equippedWeaponTemplateId
        ) {
            equippedWeaponTemplateId = null;
            itemEl.classList.remove("equipped-weapon");
            updateEquippedWeaponUI();
        }
        if (
            itemEl.classList.contains("equipped-bag") &&
            equippedBagTemplateId &&
            itemEl.dataset.templateId === equippedBagTemplateId
        ) {
            equippedBagTemplateId = null;
            itemEl.classList.remove("equipped-bag");
            updateCapacityUI();
        }

        discardEl.appendChild(itemEl);
        updateCapacityUI();
        logMessage(`Tu jettes ${itemEl.dataset.name} au sol.`);
        clearSelectedItem();
    }

    function takeItemToInventory(itemEl) {
        if (!inventoryEl) return;
        const originZone = itemEl.parentElement;
        if (!originZone || !originZone.dataset) return;
        const zoneType = originZone.dataset.zone;
        if (zoneType !== "loot" && zoneType !== "discard") return;

        const value = parseInt(itemEl.dataset.value || "0", 10) || 0;
        const currentTotal = calculateInventoryLoad();
        const newTotal = currentTotal + value;
        const maxCap = getCurrentMaxCapacity();

        if (newTotal > maxCap) {
            logMessage(
                `Tu n'as plus de place pour ${itemEl.dataset.name}. (${newTotal} / ${maxCap})`
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
        updateCapacityUI();
        logMessage(`Tu prends ${itemEl.dataset.name} avec toi.`);
        clearSelectedItem();
    }

    function equipWeaponFromElement(itemEl) {
        const hasWeapon = itemEl.dataset.hasWeapon === "true";
        if (!hasWeapon) return;
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
        const hasBag = itemEl.dataset.hasBag === "true";
        if (!hasBag) return;
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
        const hungerRestore =
                  parseInt(itemEl.dataset.hungerRestore || "0", 10) || 0;
        const thirstRestore =
                  parseInt(itemEl.dataset.thirstRestore || "0", 10) || 0;
        const bandageQuality =
                  parseInt(itemEl.dataset.bandageQuality || "0", 10) || 0;
        const isFoodOrDrink = opts && opts.isFoodOrDrink;
        const isBandage = bandageQuality > 0;
        const name = itemEl.dataset.name || "objet";

        const scene = scenes[currentSceneId];
        const context = (scene && scene.timeContext) || currentTimeContext;

        if (isFoodOrDrink && context === "fast") {
            logMessage(
                "En pleine action rapide, tu n'as pas le temps de manger ou boire."
            );
            return;
        }

        if (isBandage) {
            const applied = applyBandage(bandageQuality);
            if (!applied) return;
        } else if (heal > 0 && !isFoodOrDrink) {
            const before = hero.hp;
            hero.hp = Math.min(hero.maxHp, hero.hp + heal);
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
        clearSelectedItem();
    }

    /* --- Combat --- */

    function getEquippedWeaponTemplate() {
        if (!equippedWeaponTemplateId) return null;
        const tpl = ITEM_TEMPLATES[equippedWeaponTemplateId];
        if (!tpl || !tpl.weaponStats) return null;
        return tpl;
    }

    function computeBaseAttackPower() {
        const tpl = getEquippedWeaponTemplate();
        if (!tpl || !tpl.weaponStats) {
            const base = 1;
            const value =
                      base +
                      Math.round(hero.force * 0.6 + hero.finesse * 0.4);
            return value;
        }
        const base = tpl.weaponStats.baseDamage || 1;
        const fMult =
                  typeof tpl.weaponStats.forceMultiplier === "number"
                      ? tpl.weaponStats.forceMultiplier
                      : 0.7;
        const fiMult =
                  typeof tpl.weaponStats.finesseMultiplier === "number"
                      ? tpl.weaponStats.finesseMultiplier
                      : 0.3;

        const value =
                  base +
                  Math.round(hero.force * fMult + hero.finesse * fiMult);
        return value;
    }

    function updateEquippedWeaponUI() {
        if (!equippedWeaponNameEl || !attackPreviewEl) return;
        const tpl = getEquippedWeaponTemplate();
        if (tpl && tpl.weaponStats) {
            equippedWeaponNameEl.textContent = tpl.name;
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

    /* --- Gestion des lieux & scènes --- */

    function saveLocationState(locationId) {
        if (!locationId || locationId === "none") return;
        if (!lootEl || !discardEl) return;

        let state = locationsState[locationId];
        if (!state) {
            state = { lootNodes: [], discardNodes: [], lootGenerated: true };
            locationsState[locationId] = state;
        }

        state.lootNodes = [];
        state.discardNodes = [];

        while (lootEl.firstChild) {
            const node = lootEl.firstChild;
            lootEl.removeChild(node);
            if (
                node instanceof HTMLElement &&
                node.classList.contains("item")
            ) {
                state.lootNodes.push(node);
            }
        }

        while (discardEl.firstChild) {
            const node = discardEl.firstChild;
            discardEl.removeChild(node);
            if (
                node instanceof HTMLElement &&
                node.classList.contains("item")
            ) {
                state.discardNodes.push(node);
            }
        }
    }

    function renderScene(sceneId) {
        const scene = scenes[sceneId];
        if (!scene) {
            console.error("Scène inconnue", sceneId);
            return;
        }

        const oldLocation = currentLocationId;
        if (oldLocation && oldLocation !== "none") {
            saveLocationState(oldLocation);
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

        if (!lootEl || !discardEl) return;

        let state = locationsState[currentLocationId];
        if (!state) {
            state = {
                lootNodes: [],
                discardNodes: [],
                lootGenerated: false
            };
            locationsState[currentLocationId] = state;
        }

        lootEl.innerHTML = "";
        discardEl.innerHTML = "";

        if (!state.lootGenerated) {
            spawnLootForScene(scene);
            state.lootGenerated = true;
        } else {
            state.lootNodes.forEach(node => lootEl.appendChild(node));
            if (state.discardNodes.length > 0) {
                state.discardNodes.forEach(node =>
                    discardEl.appendChild(node)
                );
            } else {
                discardEl.textContent = "Glisse ici ce que tu abandonnes.";
            }
        }

        updateCapacityUI();
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
        if (
            scene &&
            scene.timeContext === "slow" &&
            typeof option.timeCost === "number" &&
            option.timeCost > 0
        ) {
            applyTimeCost(option.timeCost);
            if (hero.hp <= 0) {
                renderScene("gameOver");
                return;
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
            ? option.successScene || (d && d.successScene)
            : option.failScene || (d && d.failScene);

        if (nextSceneId) {
            renderScene(nextSceneId);
        }
    }

    function getSceneRarityChances(scene, location) {
        const custom = scene.randomLootRarity || {};
        const locationCustom = location.randomLootRarity || {};
        return {
            1:
                typeof custom[1] === "number"
                    ? custom[1]
                    : typeof locationCustom[1] === "number"
                    ? locationCustom[1]
                    : DEFAULT_RARITY_CHANCES[1],
            2:
                typeof custom[2] === "number"
                    ? custom[2]
                    : typeof locationCustom[2] === "number"
                    ? locationCustom[2]
                    : DEFAULT_RARITY_CHANCES[2],
            3:
                typeof custom[3] === "number"
                    ? custom[3]
                    : typeof locationCustom[3] === "number"
                    ? locationCustom[3]
                    : DEFAULT_RARITY_CHANCES[3]
        };
    }

    function pickRarityFromChances(chances) {
        const entries = Object.entries(chances).filter(([, value]) =>
            typeof value === "number" && value > 0
        );
        if (entries.length === 0) return 1;

        const total = entries.reduce((sum, [, value]) => sum + value, 0);
        let roll = Math.random() * total;

        for (const [rarity, value] of entries) {
            roll -= value;
            if (roll <= 0) return Number(rarity);
        }

        return Number(entries[entries.length - 1][0]);
    }

    function resolveRandomLootPool(randomLootValue) {
        if (
            randomLootValue &&
            typeof randomLootValue === "object" &&
            !Array.isArray(randomLootValue)
        ) {
            if (Object.keys(randomLootValue).length === 0) {
                return Object.keys(ITEM_TEMPLATES);
            }
        }

        if (!Array.isArray(randomLootValue)) return [];

        const pool = [];
        randomLootValue.forEach(entry => {
            if (typeof entry === "string") {
                if (ITEM_TEMPLATES[entry]) pool.push(entry);
                return;
            }
            if (entry && typeof entry === "object" && typeof entry.id === "string") {
                if (ITEM_TEMPLATES[entry.id]) pool.push(entry.id);
            }
        });

        return pool;
    }

    function computeRandomLootCount(quantity) {
        if (typeof quantity !== "number" || !Number.isFinite(quantity)) return 0;

        const safeQuantity = Math.max(0, quantity);
        const baseCount = Math.floor(safeQuantity);
        const fractional = safeQuantity - baseCount;
        return baseCount + (Math.random() < fractional ? 1 : 0);
    }

    function pickRandomTemplateByRarity(pool, rarity) {
        if (!Array.isArray(pool) || pool.length === 0) return null;
        const matching = pool.filter(templateId => getTemplateRarity(templateId) === rarity);
        const chosenPool = matching.length > 0 ? matching : pool;
        const index = Math.floor(Math.random() * chosenPool.length);
        return chosenPool[index];
    }

    function spawnLootForScene(scene) {
        if (!lootEl || !discardEl) return;

        lootEl.innerHTML = "";
        discardEl.textContent = "Glisse ici ce que tu abandonnes.";

        const location = locations[scene.locationId || scene.id] || {};

        const minLoot = [];
        const minSeen = new Set();
        [location.minLoot, scene.minLoot].forEach(list => {
            if (!Array.isArray(list)) return;
            list.forEach(templateId => {
                if (typeof templateId !== "string") return;
                if (minSeen.has(templateId)) return;
                minSeen.add(templateId);
                minLoot.push(templateId);
            });
        });

        const sceneLootPool = resolveRandomLootPool(scene.randomLoot || []);
        const randomLootPool =
            sceneLootPool.length > 0
                ? sceneLootPool
                : resolveRandomLootPool(location.randomLoot || []);
        const rarityChances = getSceneRarityChances(scene, location);
        const randomLootQuantity =
            typeof scene.randomLootQuantity === "number"
                ? scene.randomLootQuantity
                : typeof location.randomLootQuantity === "number"
                ? location.randomLootQuantity
                : randomLootPool.length > 0
                ? 1
                : 0;
        const randomLootCount = computeRandomLootCount(randomLootQuantity);

        let generatedLootCount = 0;

        minLoot.forEach(templateId => {
            const item = createItemFromTemplate(templateId);
            if (!item) return;
            const el = createItemElement(item);
            lootEl.appendChild(el);
            generatedLootCount += 1;
        });

        for (let i = 0; i < randomLootCount; i += 1) {
            const rarity = pickRarityFromChances(rarityChances);
            const templateId = pickRandomTemplateByRarity(randomLootPool, rarity);
            if (!templateId) continue;

            const item = createItemFromTemplate(templateId);
            if (!item) continue;
            const el = createItemElement(item);
            lootEl.appendChild(el);
            generatedLootCount += 1;
        }

        updateCapacityUI();
        if (generatedLootCount > 0) {
            logMessage(
                "Tu trouves quelques objets dans ce lieu. À toi de décider quoi garder."
            );
        }
    }
})();
