import { GAME_CONSTANTS } from "./game-constants.js";

(async () => {
    "use strict";

    function mergeConstants(defaults, overrides) {
        if (Array.isArray(defaults)) {
            return Array.isArray(overrides) ? overrides.slice() : defaults.slice();
        }

        const result = { ...(defaults || {}) };
        if (!overrides || typeof overrides !== "object") {
            return result;
        }

        Object.keys(overrides).forEach(key => {
            const overrideVal = overrides[key];
            const defaultVal = defaults ? defaults[key] : undefined;

            if (Array.isArray(overrideVal)) {
                result[key] = overrideVal.slice();
            } else if (overrideVal && typeof overrideVal === "object") {
                result[key] = mergeConstants(defaultVal || {}, overrideVal);
            } else {
                result[key] = overrideVal;
            }
        });

        return result;
    }

    const resolvedConstants = mergeConstants(GAME_CONSTANTS);
    const hpFormatter = new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const hpStatFormatter = new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 0
    });
    const {
        BASE_CAPACITY,
        MAX_HUNGER,
        MAX_THIRST,
        BODY_PARTS,
        WOUND_TYPES,
        MUSIC_SOURCES,
        MUSIC_VOLUMES,
        SOUND_EFFECTS,
        DEFAULT_RARITY_CHANCES,
        RARITY_LABELS,
        RARITY_NAMES_TO_LEVEL,
        REAL_SECONDS_PER_GAME_HOUR,
        ACTION_TIME_ACCELERATION,
        TIME_COST_STEP_HOURS,
        MOVE_DURATION_MS,
        DEFAULT_USE_DURATION_MS,
        DEFAULT_CRAFT_DURATION_MS,
        ATTACK_COOLDOWN_MS,
        ENEMY_ATTACK_COOLDOWN_MS,
        LOOT_PICKUP_DURATION_MS,
        LOST_THROWABLE_SEARCH_SECONDS,
        BLEED_DAMAGE_INTERVAL_MINUTES,
        HUNGER_DAMAGE_INTERVAL_MINUTES,
        WOUND_HEALING,
        DEFAULT_START_HOUR,
        XP_INITIAL_THRESHOLD,
        XP_THRESHOLD_GROWTH,
        heroDefaults
    } = resolvedConstants;

    const ITEM_TEMPLATES = window.ITEM_TEMPLATES || {};
    const GAME_STORY = window.GAME_STORY || { scenes: {} };
    const scenes = GAME_STORY.scenes || {};
    const locations = GAME_STORY.locations || {};

    const GAME_MINUTES_PER_MS = 60 / (REAL_SECONDS_PER_GAME_HOUR * 1000);

    const hero = {
        name: heroDefaults.name,
        hp: heroDefaults.hp,
        maxHp: heroDefaults.maxHp,
        force: heroDefaults.force,
        finesse: heroDefaults.finesse,
        audace: heroDefaults.audace,
        hunger: heroDefaults.hunger,
        thirst: heroDefaults.thirst,
        experience: heroDefaults.experience,
        nextStatThreshold: heroDefaults.nextStatThreshold
    };

    const currentQuest = "Trouver un moyen de sortir du bâtiment";

    const audioUserGesturePromise = new Promise(resolve => {
        const unlock = () => {
            document.removeEventListener("click", unlock);
            document.removeEventListener("keydown", unlock);
            resolve();
        };

        document.addEventListener("click", unlock, { once: true });
        document.addEventListener("keydown", unlock, { once: true });
    });

    function ensureAudioUserGesture() {
        return audioUserGesturePromise;
    }

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

    function createMusicController() {
        let currentAudio = null;
        let currentContext = null;
        let playlist = [];
        let playlistIndex = 0;
        let fadeTimer = null;

        function ensureUserGesture() {
            return ensureAudioUserGesture();
        }

        function shuffle(list) {
            const copy = list.slice();
            for (let i = copy.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        }

        function cleanupAudioElement() {
            if (fadeTimer) {
                clearInterval(fadeTimer);
                fadeTimer = null;
            }

            if (currentAudio) {
                currentAudio.removeEventListener("ended", handleTrackEnded);
                currentAudio.pause();
                currentAudio.src = "";
                currentAudio = null;
            }
        }

        function setCurrentVolume(context) {
            if (!currentAudio) return;
            const target = typeof MUSIC_VOLUMES[context] === "number"
                ? MUSIC_VOLUMES[context]
                : 0.6;
            currentAudio.volume = target;
        }

        function playTrack() {
            if (!playlist.length) return;

            cleanupAudioElement();
            const src = playlist[playlistIndex];
            currentAudio = new Audio(src);
            currentAudio.loop = false;
            setCurrentVolume(currentContext);
            currentAudio.addEventListener("ended", handleTrackEnded);
            currentAudio.play().catch(err => {
                console.warn("Lecture audio impossible", err);
            });
        }

        function handleTrackEnded() {
            playlistIndex = (playlistIndex + 1) % playlist.length;
            if (playlistIndex === 0) {
                playlist = shuffle(playlist);
            }
            playTrack();
        }

        function fadeOutCurrent(durationMs, onComplete) {
            if (!currentAudio || durationMs <= 0) {
                cleanupAudioElement();
                onComplete?.();
                return;
            }

            const startVolume = currentAudio.volume;
            const startTime = performance.now();

            fadeTimer = setInterval(() => {
                const elapsed = performance.now() - startTime;
                const ratio = Math.max(0, 1 - elapsed / durationMs);
                currentAudio.volume = Math.max(0, startVolume * ratio);

                if (elapsed >= durationMs) {
                    clearInterval(fadeTimer);
                    fadeTimer = null;
                    cleanupAudioElement();
                    onComplete?.();
                }
            }, 50);
        }

        function startPlaylist(context) {
            const sources = MUSIC_SOURCES[context] || [];
            if (sources.length === 0) return;

            playlist = shuffle(sources);
            playlistIndex = 0;
            currentContext = context;
            playTrack();
        }

        function playContext(context, { fadeOutMs = 0 } = {}) {
            const sources = MUSIC_SOURCES[context] || [];
            if (!sources.length) return;

            ensureUserGesture().then(() => {
                if (currentContext === context && currentAudio) {
                    setCurrentVolume(context);
                    return;
                }

                const begin = () => startPlaylist(context);

                if (fadeOutMs > 0 && currentAudio) {
                    fadeOutCurrent(fadeOutMs, begin);
                    return;
                }

                cleanupAudioElement();
                begin();
            });
        }

        function stopAll() {
            cleanupAudioElement();
            currentContext = null;
            playlist = [];
            playlistIndex = 0;
        }

        return {
            playCalm(opts = {}) {
                playContext("calm", opts);
            },
            playActions(opts = {}) {
                playContext("actions", opts);
            },
            playSad(opts = {}) {
                playContext("sad", opts);
            },
            stopAll
        };
    }

    // État des lieux (pour conserver le loot)
    const locationsState = {}; // { [locationId]: { lootNodes: HTMLElement[], lootGenerated: boolean, defeatedCombats: Set<string>, flags: Set<string>, lootApplied: Set<string>, statusMessages: Record<string, string>, lostThrowables: LostThrowableEntry[] } }

    let itemCounter = 0;
    let currentSceneId = null;
    let currentLocationId = null;
    let currentTimeContext = "fast";
    let equippedWeaponTemplateId = null;
    let equippedBagTemplateId = null;
    let wounds = [];
    let combatState = { active: false, enemies: [] };
    let lastNeedStatus = null;
    const visitedLocations = new Set();
    let gameTimeMinutes = DEFAULT_START_HOUR * 60;
    let elapsedHoursBuffer = 0;
    let lastRealTickMs = null;
    let gameClockInterval = null;
    let actionInProgress = false;
    let actionProgressInterval = null;
    let actionTimeout = null;
    let combatApproachTimer = null;
    let needHourBuffer = 0;
    let activePickupSequenceToken = null;
    let affameDamageMinuteBuffer = 0;
    let activeLostThrowableSearch = null;
    let affameDamageRemainder = 0;
    let affameActive = false;
    let defeatState = { active: false, message: "" };
    const musicController = createMusicController();

    // DOM
    let storyTitleEl;
    let storyTextEl;
    let choicesEl;
    let logEl;
    let woundsEl;
    let woundHeaderEl;
    let timeContextEl;
    let choiceTitleEl;
    let groundPanelEl;
    let takeAllBtn;
    let newGameScreenEl;
    let newGameFormEl;
    let newGameNameInput;

    let hpEl;
    let forceEl;
    let finesseEl;
    let audaceEl;
    let hungerEl;
    let thirstEl;
    let heroNameEl;
    let experienceEl;
    let nextThresholdEl;
    let gameClockEl;

    let capacityEl;
    let bagNameEl;
    let inventoryEl;
    let lootEl;
    let lostThrowableActionsEl;

    let toastContainerEl;
    let combatModalEl;
    let combatModalTitleEl;
    let combatModalLocationEl;
    let combatModalDifficultyEl;
    let combatModalDescriptionEl;
    let combatModalConfirmBtn;

    let outcomeModalEl;
    let outcomeModalTitleEl;
    let outcomeModalDescriptionEl;
    let outcomeModalEffectEl;
    let outcomeModalConfirmBtn;

    let questModalEl;
    let questModalDescriptionEl;
    let questModalCloseBtn;

    let defeatModalEl;
    let defeatModalMessageEl;
    let defeatModalRestartBtn;

    let actionOverlayEl;
    let actionOverlayTextEl;
    let actionProgressBarEl;
    let actionOverlayCancelBtn;

    let damageFlashEl;
    let assetLoaderEl;
    let assetLoaderProgressEl;

    let tagQuestBtn;
    let tagActionsBtn;
    let tagInventoryBtn;
    let tagStatsBtn;
    let tagWoundsBtn;
    let tagWoundCountEl;

    let restartBtn;
    let equippedWeaponNameEl;
    let attackPreviewEl;

    let mapSectionEl;
    let mapHeaderEl;
    let mapGridEl;
    let mapCanvasEl;
    const mapLayouts = new Map();
    const mapMetricsByFloor = new Map();
    const STAIR_ICON_SRC = "assets/stairs-icon.svg";
    let stairIconImg = null;
    let stairIconPromise = null;

    const BASE_IMAGE_ASSETS = ["assets/images/new-game.jpg", STAIR_ICON_SRC];
    const SOUND_EFFECT_SOURCES = Object.values(SOUND_EFFECTS || {});
    const AUDIO_ASSETS = [...Object.values(MUSIC_SOURCES || {}).flat(), ...SOUND_EFFECT_SOURCES];
    const PRELOAD_ASSETS = Array.from(new Set([...BASE_IMAGE_ASSETS, ...AUDIO_ASSETS].filter(Boolean)));
    let assetPreloadPromise = null;
    let assetsReady = false;
    const soundEffectPool = new Map();

    let selectedItemNameEl;
    let selectedItemInfoEl;
    let selectedItemButtonsEl;
    let selectedItemEl;

    let craftInfoEl;
    let craftListEl;

    let hasInitialized = false;

    function initGame() {
        if (hasInitialized) return;
        hasInitialized = true;

        storyTitleEl = document.getElementById("story-title");
        storyTextEl = document.getElementById("story-text");
        choicesEl = document.getElementById("choices");
        logEl = document.getElementById("log");
        woundsEl = document.getElementById("wounds");
        woundHeaderEl = document.getElementById("wound-header");
        timeContextEl = document.getElementById("time-context");
        choiceTitleEl = document.getElementById("choice-title");

        hpEl = document.getElementById("stat-hp");
        forceEl = document.getElementById("stat-force");
        finesseEl = document.getElementById("stat-finesse");
        audaceEl = document.getElementById("stat-audace");
        hungerEl = document.getElementById("stat-hunger");
        thirstEl = document.getElementById("stat-thirst");
        heroNameEl = document.getElementById("hero-name");
        experienceEl = document.getElementById("stat-xp");
        nextThresholdEl = document.getElementById("stat-xp-threshold");
        gameClockEl = document.getElementById("game-clock");

        capacityEl = document.getElementById("capacity-value");
        bagNameEl = document.getElementById("bag-name");
        inventoryEl = document.getElementById("inventory-zone");
        lootEl = document.getElementById("loot-zone");
        lostThrowableActionsEl = document.getElementById("lost-throwable-actions");

        equippedWeaponNameEl = document.getElementById("equipped-weapon-name");
        attackPreviewEl = document.getElementById("attack-preview");

        selectedItemNameEl = document.getElementById("selected-item-name");
        selectedItemInfoEl = document.getElementById("selected-item-info");
        selectedItemButtonsEl = document.getElementById("selected-item-buttons");

        mapSectionEl = document.getElementById("map-section");
        mapHeaderEl = mapSectionEl && mapSectionEl.querySelector(".map-header");
        mapGridEl = document.getElementById("map-grid");
        mapCanvasEl = document.getElementById("map-canvas");
        loadStairIcon();

        craftInfoEl = document.getElementById("craft-info");
        craftListEl = document.getElementById("craft-list");
        groundPanelEl = document.getElementById("ground-panel");
        takeAllBtn = document.getElementById("take-all-btn");

        toastContainerEl = document.getElementById("toast-container");

        combatModalEl = document.getElementById("combat-modal");
        combatModalTitleEl = document.getElementById("combat-modal-title");
        combatModalLocationEl = document.getElementById("combat-modal-location");
        combatModalDifficultyEl = document.getElementById("combat-modal-difficulty");
        combatModalDescriptionEl = document.getElementById("combat-modal-description");
        combatModalConfirmBtn = document.getElementById("combat-modal-confirm");
        if (combatModalConfirmBtn) {
            combatModalConfirmBtn.addEventListener("click", () => {
                closeCombatIntroModal();
                activateCombatAfterIntro();
                scrollToTarget("#story-title");
            });
        }

        outcomeModalEl = document.getElementById("outcome-modal");
        outcomeModalTitleEl = document.getElementById("outcome-modal-title");
        outcomeModalDescriptionEl = document.getElementById("outcome-modal-description");
        outcomeModalEffectEl = document.getElementById("outcome-modal-effect");
        outcomeModalConfirmBtn = document.getElementById("outcome-modal-confirm");
        if (outcomeModalConfirmBtn) {
            outcomeModalConfirmBtn.addEventListener("click", closeOutcomeModal);
        }

        questModalEl = document.getElementById("quest-modal");
        questModalDescriptionEl = document.getElementById("quest-modal-description");
        questModalCloseBtn = document.getElementById("quest-modal-close");
        if (questModalCloseBtn) {
            questModalCloseBtn.addEventListener("click", closeQuestModal);
        }

        defeatModalEl = document.getElementById("defeat-modal");
        defeatModalMessageEl = document.getElementById("defeat-modal-message");
        defeatModalRestartBtn = document.getElementById("defeat-modal-restart");
        if (defeatModalRestartBtn) {
            defeatModalRestartBtn.addEventListener("click", () => {
                closeDefeatModal();
                restartGame();
            });
        }

        actionOverlayEl = document.getElementById("action-overlay");
        actionOverlayTextEl = document.getElementById("action-overlay-text");
        actionProgressBarEl = document.getElementById("action-progress-bar");
        actionOverlayCancelBtn = document.getElementById("action-overlay-cancel");

        damageFlashEl = document.getElementById("damage-flash");
        assetLoaderEl = document.getElementById("asset-loader");
        assetLoaderProgressEl = document.getElementById("asset-loader-progress");

        tagQuestBtn = document.getElementById("tag-quest");
        tagActionsBtn = document.getElementById("tag-actions");
        tagInventoryBtn = document.getElementById("tag-inventory");
        tagStatsBtn = document.getElementById("tag-stats");
        tagWoundsBtn = document.getElementById("tag-wounds");
        tagWoundCountEl = document.getElementById("tag-wound-count");
        newGameScreenEl = document.getElementById("new-game-screen");
        newGameFormEl = document.getElementById("new-game-form");
        newGameNameInput = document.getElementById("new-game-name");
        setupTagNavigation();

        restartBtn = document.getElementById("restart-btn");
        if (restartBtn) {
            restartBtn.addEventListener("click", restartGame);
        }

        if (takeAllBtn) {
            takeAllBtn.addEventListener("click", takeAllLoot);
        }

        resetGameClock();
        setupQuestShortcut();
        setupNewGameScreen();
        bootstrapGameLoading();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initGame);
    } else {
        initGame();
    }

    async function bootstrapGameLoading() {
        const totalAssets = PRELOAD_ASSETS.length;
        const shouldShowLoader = totalAssets > 0;

        if (shouldShowLoader) {
            showAssetLoader(totalAssets);
        }

        try {
            await ensureAssetsLoaded((completed, total) => {
                if (shouldShowLoader) {
                    updateAssetLoaderProgress(completed, total);
                }
            });
        } finally {
            if (shouldShowLoader) {
                hideAssetLoader();
            }
        }

        showNewGameScreen();
    }

    function setupTagNavigation() {
        const tags = [tagActionsBtn, tagInventoryBtn, tagStatsBtn, tagWoundsBtn].filter(Boolean);
        tags.forEach(tag => {
            tag.addEventListener("click", () => {
                const targetSelector = tag.dataset.target;
                if (!targetSelector) return;
                scrollToTarget(targetSelector);
            });
        });
    }

    function setupQuestShortcut() {
        if (questModalDescriptionEl) {
            questModalDescriptionEl.textContent = currentQuest;
        }

        if (tagQuestBtn) {
            tagQuestBtn.addEventListener("click", showQuestModal);
        }
    }

    function scrollToTarget(selector) {
        const target = document.querySelector(selector);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function updateAssetLoaderProgress(completed, total) {
        if (!assetLoaderProgressEl) return;
        if (total <= 0) {
            assetLoaderProgressEl.textContent = "Préparation des ressources";
            return;
        }

        assetLoaderProgressEl.textContent = `Chargement des ressources : ${completed}/${total}`;
    }

    function showAssetLoader(total) {
        if (!assetLoaderEl) return;
        assetLoaderEl.classList.remove("hidden");
        updateAssetLoaderProgress(0, total);
    }

    function hideAssetLoader() {
        assetLoaderEl?.classList.add("hidden");
    }

    function preloadImage(src) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => resolve(src);
            img.src = src;
        });
    }

    function preloadAudio(src) {
        return new Promise(resolve => {
            const audio = new Audio();

            const cleanup = () => {
                audio.removeEventListener("canplaythrough", cleanup);
                audio.removeEventListener("error", cleanup);
                resolve(src);
            };

            audio.addEventListener("canplaythrough", cleanup);
            audio.addEventListener("error", cleanup);
            audio.preload = "auto";
            audio.src = src;
            audio.load();

            if (audio.readyState >= 3) {
                cleanup();
            }
        });
    }

    function preloadAsset(src) {
        if (!src) return Promise.resolve();
        if (/(\.mp3|\.m4a)(\?.*)?$/i.test(src)) {
            return preloadAudio(src);
        }

        return preloadImage(src);
    }

    function ensureAssetsLoaded(onProgress) {
        if (assetsReady) {
            onProgress?.(PRELOAD_ASSETS.length, PRELOAD_ASSETS.length);
            return Promise.resolve();
        }

        if (!assetPreloadPromise) {
            if (PRELOAD_ASSETS.length === 0) {
                assetsReady = true;
                assetPreloadPromise = Promise.resolve();
                return assetPreloadPromise;
            }

            let completed = 0;
            const total = PRELOAD_ASSETS.length;
            onProgress?.(completed, total);

            assetPreloadPromise = Promise.all(
                PRELOAD_ASSETS.map(src =>
                    preloadAsset(src).finally(() => {
                        completed += 1;
                        onProgress?.(completed, total);
                    })
                )
            ).then(() => {
                assetsReady = true;
            });
        }

        return assetPreloadPromise;
    }

    /* --- Héros & stats --- */

    function setupNewGameScreen() {
        if (newGameFormEl) {
            newGameFormEl.addEventListener("submit", event => {
                event.preventDefault();
                const value = (newGameNameInput?.value || "").trim();
                startNewGame(value || heroDefaults.name);
            });
        }
    }

    function showNewGameScreen() {
        if (!newGameScreenEl) return;
        document.body.classList.remove("has-game-overlay");
        if (newGameNameInput) {
            newGameNameInput.value = heroDefaults.name;
            setTimeout(() => newGameNameInput?.focus(), 120);
        }
        newGameScreenEl.classList.remove("hidden");
        musicController.playSad({ fadeOutMs: 600 });
    }

    function hideNewGameScreen() {
        newGameScreenEl?.classList.add("hidden");
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
        hero.experience = heroDefaults.experience;
        hero.nextStatThreshold = heroDefaults.nextStatThreshold;
        lastNeedStatus = null;
        wounds = [];

        if (heroNameEl) {
            heroNameEl.textContent = hero.name;
        }
        equippedWeaponTemplateId = null;
        equippedBagTemplateId = null;
        updateStatsUI();
        renderWounds();
    }

    function resetGameStateForNewRun() {
        endBlockingAction();
        stopCombatApproachTimer();
        document.body.classList.remove("combat-active");
        defeatState = { active: false, message: "" };
        closeDefeatModal();

        if (inventoryEl) inventoryEl.innerHTML = "";
        if (lootEl) lootEl.innerHTML = "";

        selectedItemEl = null;
        if (selectedItemNameEl) selectedItemNameEl.textContent = "Aucun";
        if (selectedItemInfoEl) selectedItemInfoEl.textContent = "";
        if (selectedItemButtonsEl) selectedItemButtonsEl.innerHTML = "";

        for (const key in locationsState) {
            if (Object.prototype.hasOwnProperty.call(locationsState, key)) {
                delete locationsState[key];
            }
        }

        visitedLocations.clear();
        mapLayouts.clear();
        mapMetricsByFloor.clear();

        currentLocationId = null;
        currentSceneId = null;
        currentTimeContext = "fast";
        activePickupSequenceToken = null;
        affameDamageMinuteBuffer = 0;
        affameDamageRemainder = 0;
        affameActive = false;

        if (logEl) logEl.innerHTML = "";
    }

    async function startNewGame(chosenName) {
        const safeName = typeof chosenName === "string" && chosenName.trim()
            ? chosenName.trim()
            : heroDefaults.name;
        heroDefaults.name = safeName;

        const totalAssets = PRELOAD_ASSETS.length;
        const shouldShowLoader = !assetsReady && totalAssets > 0;

        if (shouldShowLoader) {
            showAssetLoader(totalAssets);
        }

        try {
            await ensureAssetsLoaded((completed, total) => {
                if (shouldShowLoader) {
                    updateAssetLoaderProgress(completed, total);
                }
            });
        } finally {
            if (shouldShowLoader) {
                hideAssetLoader();
            }
        }

        resetGameStateForNewRun();
        hideNewGameScreen();
        document.body.classList.add("has-game-overlay");

        resetGameClock();
        startGameClockLoop();
        initHero();
        setupInitialInventory();
        updateCapacityUI();

        musicController.playCalm({ fadeOutMs: 600 });

        renderScene("intro");
        logMessage("Bienvenue, survivant. Clique sur un objet pour le voir, l'équiper, le consommer ou le prendre.");
    }

    function restartGame() {
        showNewGameScreen();
    }

    function resetGameClock() {
        gameTimeMinutes = DEFAULT_START_HOUR * 60;
        elapsedHoursBuffer = 0;
        lastRealTickMs = performance.now();
        needHourBuffer = 0;
        updateGameClockUI();
    }

    function getTimeFlowMultiplier() {
        if (isTimeFrozen()) return 0;
        return isActionInProgress() ? ACTION_TIME_ACCELERATION : 1;
    }

    function startGameClockLoop() {
        if (gameClockInterval) return;
        lastRealTickMs = performance.now();
        gameClockInterval = setInterval(() => {
            const now = performance.now();
            if (lastRealTickMs == null) {
                lastRealTickMs = now;
                return;
            }
            const deltaMs = Math.max(0, now - lastRealTickMs);
            lastRealTickMs = now;
            if (isTimeFrozen()) return;
            const gainedMinutes = deltaMs * GAME_MINUTES_PER_MS * getTimeFlowMultiplier();
            if (gainedMinutes > 0) {
                addGameMinutes(gainedMinutes, { silent: true });
            }
        }, 250);
    }

    function formatHp(value) {
        const numeric = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(numeric)) return hpFormatter.format(0);
        return hpFormatter.format(numeric);
    }

    function formatHpStat(value) {
        const numeric = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(numeric)) return hpStatFormatter.format(0);
        return hpStatFormatter.format(Math.round(numeric));
    }

    function updateStatsUI() {
        if (hpEl) hpEl.textContent = `${formatHpStat(hero.hp)} / ${formatHpStat(hero.maxHp)}`;
        if (forceEl) forceEl.textContent = String(hero.force);
        if (finesseEl) finesseEl.textContent = String(hero.finesse);
        if (audaceEl) audaceEl.textContent = String(hero.audace);
        updateExperienceUI();
        updateNeedsUI();
        updateEquippedWeaponUI();
        updateCapacityUI();
    }

    function updateExperienceUI() {
        if (experienceEl) {
            experienceEl.textContent = `${hero.experience} XP`;
        }
        if (nextThresholdEl) {
            if (hero.experience >= hero.nextStatThreshold) {
                nextThresholdEl.textContent = "Palier atteint : bonus disponible";
            } else {
                const remaining = hero.nextStatThreshold - hero.experience;
                nextThresholdEl.textContent = `${remaining} XP avant le prochain bonus`;
            }
        }
    }

    function getNeedState() {
        const totalNeed = (hero.hunger + hero.thirst)/2;
        if (totalNeed < 15) {
            return {
                label: "bien nourri",
                healModifier: 1.2,
                regenPerUnit: 1,
                damagePerUnit: 0
            };
        }
        if (totalNeed < 25) {
            return {
                label: "nourri",
                healModifier: 1,
                regenPerUnit: 0.5,
                damagePerUnit: 0
            };
        }
        if (totalNeed < 35) {
            return {
                label: "faim",
                healModifier: 0.7,
                regenPerUnit: 0,
                damagePerUnit: 0
            };
        }
        return {
            label: "affamé",
            healModifier: 0.5,
            regenPerUnit: 0,
            damagePerUnit: 0.6
        };
    }

    function updateNeedsUI() {
        const needState = getNeedState();
        hero.hunger = Math.max(0, Math.min(MAX_HUNGER, hero.hunger));
        hero.thirst = Math.max(0, Math.min(MAX_THIRST, hero.thirst));
        const hungerVal = Math.round(hero.hunger);
        const thirstVal = Math.round(hero.thirst);
        if (hungerEl) {
            hungerEl.textContent = `${hungerVal} / ${MAX_HUNGER} (${needState.label})`;
        }
        if (thirstEl) {
            thirstEl.textContent = `${thirstVal} / ${MAX_THIRST} (${needState.label})`;
        }

        const nowAffame = needState.label === "affamé";
        if (nowAffame && !affameActive) {
            affameDamageMinuteBuffer = 0;
            affameDamageRemainder = 0;
        } else if (!nowAffame) {
            affameDamageMinuteBuffer = 0;
            affameDamageRemainder = 0;
        }
        affameActive = nowAffame;

        if (needState.label !== lastNeedStatus) {
            lastNeedStatus = needState.label;
            logMessage(`Ton état alimentaire passe à : ${needState.label}.`);
        }
    }

    function computeExperienceRewardFromDifficulty(difficulty) {
        if (!Number.isFinite(difficulty)) return 1;
        return Math.max(1, Math.round(difficulty));
    }

    function grantExperience(amount, source = "combat") {
        const xpGain = Math.max(0, Math.round(amount || 0));
        if (xpGain <= 0) return;
        hero.experience += xpGain;
        logMessage(`Tu gagnes ${xpGain} XP (${source}).`);
        showToast(`+${xpGain} XP`, "info");
        handleStatGainThreshold();
        updateStatsUI();
    }

    function describeStatLabel(key) {
        switch (key) {
            case "force":
                return "Force";
            case "finesse":
                return "Finesse";
            case "audace":
                return "Audace";
            default:
                return key;
        }
    }

    function grantRandomStatPoint() {
        const stats = ["force", "finesse", "audace"];
        const stat = stats[Math.floor(Math.random() * stats.length)];
        hero[stat] = Math.max(0, (hero[stat] || 0) + 1);
        const label = describeStatLabel(stat);
        logMessage(`Palier franchi ! ${label} +1.`);
        showToast(`${label} +1`, "success");
    }

    function handleStatGainThreshold() {
        let gained = false;
        while (hero.experience >= hero.nextStatThreshold) {
            grantRandomStatPoint();
            hero.nextStatThreshold = Math.ceil(hero.nextStatThreshold * XP_THRESHOLD_GROWTH);
            gained = true;
        }
        if (gained) {
            logMessage(
                `Prochain palier de caractéristique à ${hero.nextStatThreshold} XP.`
            );
        }
    }

    function getAvailableBandageItems() {
        const bandages = [];
        [inventoryEl, lootEl].forEach(zone => {
            if (!zone) return;
            zone.querySelectorAll(".item").forEach(itemEl => {
                const quality = parseInt(itemEl.dataset.bandageQuality || "0", 10) || 0;
                if (quality > 0) {
                    bandages.push(itemEl);
                }
            });
        });
        return bandages;
    }

    function refreshWoundsIfRelevant() {
        if (wounds.length) {
            renderWounds();
        }
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
            ok.textContent = "Aucune blessure en cours. Tes PV remonteront progressivement.";
            woundsEl.appendChild(ok);
            updateWoundTagUI();
            return;
        }

        const bandageItems = getAvailableBandageItems();

        wounds.forEach(w => {
            const row = document.createElement("div");
            row.classList.add("wound-row");

            const desc = document.createElement("div");
            desc.classList.add("wound-description");
            const statusParts = [];
            if (w.bleeding && !w.bandaged) statusParts.push("saigne");
            if (w.bandaged) statusParts.push("bandée");
            const turnsLeft = Math.max(1, Math.ceil(w.remainingTime));
            statusParts.push(`guérison estimée : ${turnsLeft} unité(s) de temps`);
            desc.textContent = `${w.type} au ${w.part} (${statusParts.join(", ")})`;

            const statusBubble = document.createElement("span");
            statusBubble.classList.add("wound-badge");
            if (w.bleeding) {
                statusBubble.classList.add("wound-badge-danger");
                statusBubble.textContent = "Saigne";
            } else if (w.bandaged) {
                statusBubble.classList.add("wound-badge-success");
                statusBubble.textContent = "Bandé";
            }
            if (statusBubble.textContent) {
                desc.appendChild(statusBubble);
            }
            row.appendChild(desc);

            const usableBandages = bandageItems.filter(itemEl => {
                const quality = parseInt(itemEl.dataset.bandageQuality || "0", 10) || 0;
                return quality > 0 && (
                    !w.bandaged ||
                    w.bleeding ||
                    quality > (w.bandageQuality || 0)
                );
            });

            if (usableBandages.length) {
                const actions = document.createElement("div");
                actions.classList.add("wound-actions");
                usableBandages.forEach(itemEl => {
                    const quality = parseInt(itemEl.dataset.bandageQuality || "0", 10) || 0;
                    const improving = w.bandaged && !w.bleeding && quality > (w.bandageQuality || 0);
                    const btn = document.createElement("button");
                    btn.classList.add("small-btn", "wound-action-btn");
                    const itemName = itemEl.dataset.name || "bandage";
                    btn.textContent = improving
                        ? `Améliorer avec ${itemName}`
                        : `Utiliser ${itemName}`;
                    btn.addEventListener("click", () => {
                        useConsumableItem(itemEl, { targetWoundId: w.id });
                    });
                    actions.appendChild(btn);
                });
                row.appendChild(actions);
            }

            woundsEl.appendChild(row);
        });

        updateWoundTagUI();
    }

    function updateWoundTagUI() {
        if (!tagWoundsBtn) return;
        if (!wounds.length) {
            tagWoundsBtn.classList.add("hidden");
            tagWoundsBtn.classList.remove("tag-danger", "tag-warning");
            if (tagWoundCountEl) tagWoundCountEl.textContent = "";
            return;
        }

        tagWoundsBtn.classList.remove("hidden");
        const hasUnbandaged = wounds.some(w => !w.bandaged || w.bleeding);
        tagWoundsBtn.classList.toggle("tag-danger", hasUnbandaged);
        tagWoundsBtn.classList.toggle("tag-warning", !hasUnbandaged);
        if (tagWoundCountEl) {
            tagWoundCountEl.textContent = `${wounds.length}`;
        }
    }

    function triggerDamageEffect(type = "normal") {
        if (!damageFlashEl) return;
        const effectClass = type === "time" ? "damage-flash-time" : "damage-flash-normal";
        damageFlashEl.classList.remove("damage-flash-normal", "damage-flash-time", "is-active");
        void damageFlashEl.offsetWidth;
        damageFlashEl.classList.add(effectClass, "is-active");
    }

    function getSoundEffectFromPool(key) {
        const cached = soundEffectPool.get(key);
        if (cached) return cached;

        const src = SOUND_EFFECTS?.[key];
        if (!src) return null;

        const createAudio = () => {
            const audio = new Audio(src);
            audio.preload = "auto";
            audio.load();
            return audio;
        };

        const pool = { audios: [createAudio(), createAudio()], index: 0 };
        soundEffectPool.set(key, pool);
        return pool;
    }

    function playSoundEffect(key) {
        const pool = getSoundEffectFromPool(key);
        if (!pool) return;

        ensureAudioUserGesture().then(() => {
            const audio = pool.audios[pool.index];
            pool.index = (pool.index + 1) % pool.audios.length;

            try {
                audio.currentTime = 0;
                audio.volume = SOUND_EFFECTS.GLOBAL_VOLUME;
                audio.play().catch(err => {
                    console.warn("Impossible de jouer l'effet sonore", err);
                });
            } catch (err) {
                console.warn("Impossible de déclencher l'effet sonore", err);
            }
        });
    }

    function showDefeatModal(message) {
        if (!defeatModalEl) return;
        if (defeatModalMessageEl) {
            defeatModalMessageEl.textContent = message;
        }
        defeatModalEl.classList.remove("hidden");
        defeatModalEl.classList.add("open");
        if (defeatModalRestartBtn) {
            defeatModalRestartBtn.focus();
        }
    }

    function closeDefeatModal() {
        if (!defeatModalEl) return;
        defeatModalEl.classList.remove("open");
        defeatModalEl.classList.add("hidden");
    }

    function handleHeroDefeat(reason) {
        if (defeatState.active) return;

        const message = reason || "Tu succombes à tes blessures.";
        defeatState = { active: true, message };
        musicController.playSad();
        endBlockingAction();
        stopCombatApproachTimer();
        renderScene("gameOver");
        showDefeatModal(message);
    }

    function applyHeroDamage(rawAmount, opts = {}) {
        const amount = Math.max(0, rawAmount || 0);
        if (amount <= 0) return 0;
        hero.hp = Math.max(0, hero.hp - amount);
        const damageType = opts.type || "normal";
        playSoundEffect(damageType === "time" ? "lightDamage" : "hightDamage");
        triggerDamageEffect(damageType);
        if (hero.hp <= 0) {
            const reason =
                opts.reason ||
                (damageType === "time"
                    ? "Le temps et tes blessures t'ont achevé."
                    : "Tu es mortellement blessé.");
            handleHeroDefeat(reason);
        }
        return amount;
    }

    function applyEffect(effect) {
        if (!effect) return;
        if (typeof effect.hpChange === "number") {
            if (effect.hpChange < 0) {
                const inflicted = applyHeroDamage(-effect.hpChange, { type: effect.damageType || "normal" });
                registerWound(Math.max(1, Math.round(inflicted)));
            } else {
                hero.hp = Math.min(hero.maxHp, hero.hp + effect.hpChange);
            }
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

        const existingOnPart = wounds.find(w => w.part === part && w.bandaged);
        if (existingOnPart) {
            existingOnPart.bandaged = false;
            existingOnPart.bandageQuality = 0;
            existingOnPart.bleeding = true;
            existingOnPart.bleedMinutesBuffer = 0;
            existingOnPart.bleedDamageRemainder = 0;
            logMessage(
                `Le bandage sur ta blessure au ${part} se déchire sous le nouvel impact !`
            );
        }

        const wound = {
            id: `wound-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            part,
            type,
            bandaged: false,
            bandageQuality: 0,
            bleeding: true,
            remainingTime: baseHeal,
            baseHealTime: baseHeal,
            severity,
            bleedRate,
            bleedMinutesBuffer: 0,
            bleedDamageRemainder: 0
        };
        wounds.push(wound);
        logMessage(
            `Tu subis une ${type} au ${part}. La plaie saigne, un bandage aiderait à la stabiliser.`
        );
        renderWounds();
    }

    function applyBandage(quality, targetId) {
        if (!wounds.length) {
            logMessage("Aucune blessure à bander pour l'instant.");
            return false;
        }

        const sanitizedQuality = Math.max(0, quality || 0);
        const target = targetId
            ? wounds.find(w => w.id === targetId)
            : wounds.find(
                w => !w.bandaged || w.bleeding || sanitizedQuality > (w.bandageQuality || 0)
            );

        if (!target) {
            logMessage(
                targetId
                    ? "Tu ne trouves pas de blessure correspondante pour ce bandage."
                    : "Aucune blessure ne peut bénéficier de ce bandage."
            );
            return false;
        }

        const previousQuality = target.bandageQuality || 0;
        const wasBandaged = target.bandaged && !target.bleeding;
        if (wasBandaged && sanitizedQuality <= previousQuality) {
            logMessage("Cette blessure possède déjà un bandage équivalent ou meilleur.");
            return false;
        }

        target.bandaged = true;
        target.bleeding = false;
        target.bandageQuality = sanitizedQuality;
        target.bleedMinutesBuffer = 0;
        target.bleedDamageRemainder = 0;
        const bonusReduction = 1 + target.bandageQuality;
        target.remainingTime = Math.max(1, target.remainingTime - bonusReduction);
        renderWounds();
        if (wasBandaged && sanitizedQuality > previousQuality) {
            logMessage(
                `Tu améliores le bandage sur ta ${target.part} (${target.type}) avec une meilleure qualité.`
            );
        } else {
            const stillBleeding = target.bleeding && sanitizedQuality < 2;
            const statusLabel = stillBleeding
                ? "Le bandage de fortune ralentit l'hémorragie."
                : "La plaie est stabilisée.";
            logMessage(`Tu poses un bandage sur ta ${target.type} au ${target.part}. ${statusLabel}`);
        }
        return true;
    }

    function isTimeFrozen() {
        return combatState.active || defeatState.active;
    }

    function formatClockLabel(minutesTotal = gameTimeMinutes) {
        const totalMinutes = Math.max(0, Math.floor(minutesTotal));
        const days = Math.floor(totalMinutes / (24 * 60));
        const minutesInDay = totalMinutes % (24 * 60);
        const hours = Math.floor(minutesInDay / 60);
        const minutes = minutesInDay % 60;
        return {
            dayLabel: days + 1,
            timeLabel: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
        };
    }

    function updateGameClockUI() {
        const { dayLabel, timeLabel } = formatClockLabel();
        if (gameClockEl) {
            gameClockEl.textContent = timeLabel;
            gameClockEl.setAttribute("title", `Jour ${dayLabel} • ${timeLabel}`);
        }
        if (timeContextEl) {
            timeContextEl.textContent = "";
        }
    }

    function formatTimeUnits(hours) {
        const totalMinutes = Math.round(hours * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = Math.abs(totalMinutes % 60);
        if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, "0")}`;
        if (h > 0) return `${h}h`;
        return `${m}min`;
    }

    function addGameMinutes(minutes, opts = {}) {
        if (!Number.isFinite(minutes) || minutes <= 0) return;
        gameTimeMinutes += minutes;
        updateGameClockUI();
        accumulateTimeHours(minutes / 60, opts);
    }

    function accumulateTimeHours(hours, opts = {}) {
        if (!Number.isFinite(hours) || hours <= 0) return;
        elapsedHoursBuffer += hours;
        while (elapsedHoursBuffer >= TIME_COST_STEP_HOURS) {
            applyTimeCost(TIME_COST_STEP_HOURS, { silent: opts.silent !== false });
            elapsedHoursBuffer -= TIME_COST_STEP_HOURS;
        }
    }

    function setTagButtonsDisabled(disabled) {
        [tagActionsBtn, tagInventoryBtn, tagStatsBtn].forEach(btn => {
            if (btn) {
                btn.disabled = disabled;
                btn.setAttribute("aria-disabled", String(disabled));
            }
        });

        if (tagWoundsBtn) {
            const shouldDisableWounds = disabled && !combatState.active;
            tagWoundsBtn.disabled = shouldDisableWounds;
            tagWoundsBtn.setAttribute("aria-disabled", String(shouldDisableWounds));
        }
    }

    function showChoiceSpinner(label) {
        if (!choicesEl) return;
        choicesEl.innerHTML = "";
        const spinner = document.createElement("div");
        spinner.classList.add("choice-spinner");

        const loader = document.createElement("div");
        loader.classList.add("loader");
        const text = document.createElement("div");
        text.classList.add("label");
        text.textContent = label || "Action en cours...";

        spinner.appendChild(loader);
        spinner.appendChild(text);
        choicesEl.appendChild(spinner);
    }

    function startBlockingAction(label, durationMs, opts = {}) {
        const safeDuration = Math.max(300, durationMs || 0);
        const indeterminate = opts.indeterminate === true;
        endBlockingAction();
        actionInProgress = true;
        document.body.classList.add("action-blocked");
        if (opts.hideInventory !== false) {
            document.body.classList.add("inventory-hidden");
        }
        if (opts.spinnerInChoices) {
            showChoiceSpinner(label);
        }
        setTagButtonsDisabled(true);

        const overlayProgressEl = actionProgressBarEl?.parentElement;
        const showOverlay = actionOverlayEl && opts.useOverlay !== false;

        if (showOverlay) {
            actionOverlayEl.classList.remove("hidden");
            if (actionOverlayTextEl) actionOverlayTextEl.textContent = label || "Action en cours";
            if (actionProgressBarEl) {
                actionProgressBarEl.style.width = indeterminate ? "100%" : "0%";
                actionProgressBarEl.classList.toggle("indeterminate", indeterminate);
            }
            if (overlayProgressEl) {
                overlayProgressEl.classList.toggle("indeterminate", indeterminate);
            }
            if (actionOverlayCancelBtn) {
                const showCancel = typeof opts.onCancel === "function";
                actionOverlayCancelBtn.classList.toggle("hidden", !showCancel);
                if (showCancel) {
                    actionOverlayCancelBtn.textContent = opts.cancelLabel || "Annuler";
                } else {
                    actionOverlayCancelBtn.textContent = "";
                }
            }
        }

        if (!indeterminate) {
            const start = performance.now();
            actionProgressInterval = setInterval(() => {
                if (!actionProgressBarEl) return;
                const elapsed = performance.now() - start;
                const percent = Math.min(100, Math.round((elapsed / safeDuration) * 100));
                actionProgressBarEl.style.width = `${percent}%`;
            }, 120);
        }

        return new Promise(resolve => {
            let resolved = false;
            const resolvePromise = value => {
                if (resolved) return;
                resolved = true;
                resolve(value || { cancelled: false });
            };

            const finalize = () => {
                endBlockingAction();
                resolvePromise({ cancelled: false });
            };

            actionTimeout = setTimeout(finalize, safeDuration);

            if (actionOverlayCancelBtn && typeof opts.onCancel === "function") {
                actionOverlayCancelBtn.onclick = () => {
                    if (actionTimeout) clearTimeout(actionTimeout);
                    actionTimeout = null;
                    opts.onCancel();
                    endBlockingAction();
                    resolvePromise({ cancelled: true });
                };
            }
        });
    }

    function endBlockingAction() {
        if (actionTimeout) clearTimeout(actionTimeout);
        if (actionProgressInterval) clearInterval(actionProgressInterval);
        actionTimeout = null;
        actionProgressInterval = null;
        if (actionOverlayEl) actionOverlayEl.classList.add("hidden");
        if (actionProgressBarEl) {
            actionProgressBarEl.style.width = "0%";
            actionProgressBarEl.classList.remove("indeterminate");
            const overlayProgressEl = actionProgressBarEl.parentElement;
            if (overlayProgressEl) {
                overlayProgressEl.classList.remove("indeterminate");
            }
        }
        if (actionOverlayCancelBtn) {
            actionOverlayCancelBtn.classList.add("hidden");
            actionOverlayCancelBtn.textContent = "";
            actionOverlayCancelBtn.onclick = null;
        }
        actionInProgress = false;
        document.body.classList.remove("action-blocked");
        document.body.classList.remove("inventory-hidden");
        setTagButtonsDisabled(false);
    }

    function isActionInProgress() {
        return actionInProgress;
    }

    function processWoundsOverTime(timeUnits, silent = false) {
        if (!timeUnits || timeUnits <= 0 || !wounds.length) return;

        const elapsedMinutes = timeUnits * 60;

        let bleedDamage = 0;
        let totalRegen = 0;
        const needState = getNeedState();
        const bandageProfiles = (WOUND_HEALING && WOUND_HEALING.BANDAGE_QUALITY_EFFECTS) || {};
        const defaultBandageProfile = bandageProfiles[0] || { bleedMultiplier: 1, healPerCycle: 0 };
        const bleedRange = (WOUND_HEALING && WOUND_HEALING.BLEED_DAMAGE_RANGE) || {
            min: 0.1,
            max: 0.8
        };

        const woundLoadPenalty = Math.max(
            1,
            1 + (wounds.length - 1) * (WOUND_HEALING?.WOUND_COUNT_PENALTY || 0)
        );

        wounds.forEach(wound => {
            const bandageProfile = bandageProfiles[wound.bandageQuality] || defaultBandageProfile;
            const typeFactor = (WOUND_HEALING?.TYPE_FACTORS && WOUND_HEALING.TYPE_FACTORS[wound.type]) || 1;
            const severityFactor = Math.min(
                WOUND_HEALING?.MAX_SEVERITY_FACTOR || 1,
                1 + (Math.max(1, wound.severity) - 1) * (WOUND_HEALING?.SEVERITY_GRADIENT || 0)
            );

            wound.bleedMinutesBuffer = (wound.bleedMinutesBuffer || 0) + elapsedMinutes;
            while (wound.bleedMinutesBuffer >= BLEED_DAMAGE_INTERVAL_MINUTES) {
                wound.bleedMinutesBuffer -= BLEED_DAMAGE_INTERVAL_MINUTES;

                const bleedBase = Math.min(
                    bleedRange.max,
                    bleedRange.min + (wound.severity - 1) * (bleedRange.max - bleedRange.min)
                );
                if (wound.bleeding) {
                    const damageThisCycle = bleedBase * bandageProfile.bleedMultiplier * typeFactor;
                    bleedDamage += damageThisCycle;
                }

                const healSpeed =
                    (WOUND_HEALING?.BASE_PROGRESS_PER_CYCLE || 0.5) *
                    (wound.bandaged ? 1 : WOUND_HEALING?.UNBANDAGED_HEALING_FACTOR || 1) *
                    needState.healModifier *
                    severityFactor;
                const healProgress = healSpeed / woundLoadPenalty;
                wound.remainingTime -= healProgress;

                const naturalRegen = healProgress * (WOUND_HEALING?.HP_PER_HEAL_PROGRESS || 0);
                const bandageRegen = (bandageProfile.healPerCycle || 0) * needState.healModifier;
                totalRegen += naturalRegen + bandageRegen;
            }
        });

        if (bleedDamage > 0) {
            applyHeroDamage(bleedDamage, { type: "time", reason: "Tu te vides de ton sang." });
            if (!silent) {
                logMessage(
                    `Une plaie saigne encore et te coûte ${bleedDamage.toFixed(1)} PV pendant le temps qui passe.`
                );
            }
        }

        if (totalRegen > 0 && hero.hp > 0) {
            const before = hero.hp;
            hero.hp = Math.min(hero.maxHp, hero.hp + totalRegen);
            const gained = hero.hp - before;
            if (gained > 0 && !silent) {
                logMessage(
                    `Tes soins et ton état (${needState.label}) te rendent ${gained.toFixed(1)} PV pendant la convalescence.`
                );
            }
        }

        const beforeCount = wounds.length;
        wounds = wounds.filter(w => w.remainingTime > 0 && hero.hp > 0);
        if (beforeCount !== wounds.length && !silent) {
            logMessage("Certaines blessures se referment enfin.");
        }

        renderWounds();
    }

    /* --- Temps / faim / soif --- */

    function applyTimeCost(timeUnits, opts = {}) {
        if (!timeUnits || timeUnits <= 0) return;

        const silent = Boolean(opts.silent);

        const hungerBefore = hero.hunger;
        const thirstBefore = hero.thirst;

        needHourBuffer += timeUnits;
        let hungerGain = 0;
        let thirstGain = 0;
        while (needHourBuffer >= 1) {
            hungerGain += 1;
            thirstGain += 1;
            needHourBuffer -= 1;
        }

        hero.hunger += hungerGain;
        hero.thirst += thirstGain;

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
            applyHeroDamage(damage, { type: "time", reason: "La faim et la soif t'achèvent." });
            logMessage(`La faim et la soif t'épuisent : tu perds ${damage} PV.`);
        }

        processWoundsOverTime(timeUnits, silent);
        applyNeedBasedRecovery(timeUnits, silent);

        updateStatsUI();

        if (!silent) {
            const hungerDelta = Math.max(0, Math.round((hero.hunger - hungerBefore) * 10) / 10);
            const thirstDelta = Math.max(0, Math.round((hero.thirst - thirstBefore) * 10) / 10);
            const deltaLabel = formatTimeUnits(timeUnits);
            if (hungerDelta > 0 || thirstDelta > 0) {
                logMessage(`Le temps passe (${deltaLabel}) : faim +${hungerDelta}, soif +${thirstDelta}.`);
            } else {
                logMessage(`Le temps passe (${deltaLabel}).`);
            }
        }
    }

    function applyNeedBasedRecovery(timeUnits, silent = false) {
        const needState = getNeedState();
        const nowAffame = needState.label === "affamé";
        if (nowAffame && !affameActive) {
            affameDamageMinuteBuffer = 0;
            affameDamageRemainder = 0;
        } else if (!nowAffame) {
            affameDamageMinuteBuffer = 0;
            affameDamageRemainder = 0;
        }
        affameActive = nowAffame;
        const canRecoverNaturally =
            wounds.length === 0 && (needState.label === "bien nourri" || needState.label === "nourri");
        const regen = canRecoverNaturally
            ? Math.max(0, Math.round(needState.regenPerUnit * timeUnits))
            : 0;
        if (regen > 0 && hero.hp > 0 && hero.hp < hero.maxHp) {
            const before = hero.hp;
            hero.hp = Math.min(hero.maxHp, hero.hp + regen);
            const gained = hero.hp - before;
            if (gained > 0 && !silent) {
                logMessage(
                    `Ton corps récupère ${gained} PV grâce à tes réserves (${needState.label}).`
                );
            }
        }

        if (needState.damagePerUnit > 0 && hero.hp > 0) {
            const elapsedMinutes = timeUnits * 60;
            if (affameActive) {
                affameDamageMinuteBuffer += elapsedMinutes;
                let totalPenalty = 0;
                while (affameDamageMinuteBuffer >= HUNGER_DAMAGE_INTERVAL_MINUTES) {
                    const damageFloat =
                        needState.damagePerUnit * (HUNGER_DAMAGE_INTERVAL_MINUTES / 60) +
                        affameDamageRemainder;
                    const penalty = Math.floor(damageFloat);
                    affameDamageRemainder = damageFloat - penalty;
                    totalPenalty += penalty;
                    affameDamageMinuteBuffer -= HUNGER_DAMAGE_INTERVAL_MINUTES;
                }
                if (totalPenalty > 0) {
                    applyHeroDamage(totalPenalty, {
                        type: "time",
                        reason: "Tu t'effondres, terrassé par la faim."
                    });
                    if (!silent) {
                        logMessage(
                            `Tu t'affaiblis (${needState.label}) et perds ${totalPenalty} PV en attendant.`
                        );
                    }
                }
            } else {
                affameDamageMinuteBuffer = 0;
                affameDamageRemainder = 0;
            }
        }
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
        appendItemToZone(el, inventoryEl);
        refreshWoundsIfRelevant();
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
        div.dataset.itemId = item.instanceId;
        div.dataset.value = String(item.value);
        div.dataset.name = item.name;
        div.dataset.templateId = item.templateId;
        div.dataset.category = item.category;
        div.dataset.rarity = item.rarity;

        const hasWeapon = !!item.weaponStats;
        const isThrowable = !!(item.weaponStats && item.weaponStats.throwable);
        const hasBag = !!item.bagStats;
        div.dataset.hasWeapon = hasWeapon ? "true" : "false";
        div.dataset.hasBag = hasBag ? "true" : "false";
        div.dataset.throwable = isThrowable ? "true" : "false";

        if (hasWeapon) {
            div.dataset.baseDamage = String(item.weaponStats.baseDamage || 0);
            div.dataset.forceMult = String(item.weaponStats.forceMultiplier || 0);
            div.dataset.finesseMult = String(item.weaponStats.finesseMultiplier || 0);
            const range = Number.isFinite(item.weaponStats.range)
                ? Math.max(0, item.weaponStats.range)
                : 1;
            div.dataset.range = String(range);
        } else {
            div.dataset.baseDamage = "0";
            div.dataset.forceMult = "0";
            div.dataset.finesseMult = "0";
            div.dataset.range = "0";
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

        div.addEventListener("click", () => handleItemClick(div));

        const labelSpan = document.createElement("span");
        labelSpan.classList.add("item-label");
        const typeLabel = getItemShortTypeLabel(item);
        labelSpan.textContent = typeLabel
            ? `${item.name} (${typeLabel})`
            : item.name;

        const metaContainer = document.createElement("div");
        metaContainer.classList.add("item-meta");

        const valueSpan = document.createElement("span");
        valueSpan.classList.add("value");
        valueSpan.textContent = item.value;

        metaContainer.appendChild(valueSpan);

        div.appendChild(labelSpan);
        div.appendChild(metaContainer);

        return div;
    }

    function refreshItemInlineActions(itemEl) {
        if (!itemEl) return;
        const metaContainer =
            itemEl.querySelector(".item-meta") || itemEl;
        metaContainer.querySelectorAll(".inline-action").forEach(btn => btn.remove());

        const originZone = itemEl.parentElement;
        const zoneType =
            originZone && originZone.dataset ? originZone.dataset.zone : "";

        if (zoneType !== "loot") return;

        const takeBtn = document.createElement("button");
        takeBtn.classList.add("small-btn", "inline-action");
        takeBtn.textContent = "Prendre";
        takeBtn.addEventListener("click", evt => {
            evt.stopPropagation();
            takeItemToInventory(itemEl);
        });
        metaContainer.appendChild(takeBtn);
    }

    function appendItemToZone(itemEl, zoneEl) {
        if (!itemEl || !zoneEl) return;
        zoneEl.appendChild(itemEl);
        refreshItemInlineActions(itemEl);
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

    function updateGroundPanelVisibility() {
        if (!groundPanelEl) return;
        groundPanelEl.style.display = combatState.active ? "none" : "";
    }

    /* --- Crafting --- */

    function getZoneTemplateCounts(zoneEl) {
        const counts = {};
        if (!zoneEl) return counts;
        zoneEl.querySelectorAll(".item").forEach(el => {
            const tplId = el.dataset.templateId;
            if (!tplId) return;
            counts[tplId] = (counts[tplId] || 0) + 1;
        });
        return counts;
    }

    function getInventoryTemplateCounts() {
        return getZoneTemplateCounts(inventoryEl);
    }

    function hasItemInInventory(templateId, counts = null) {
        if (!templateId) return false;
        const sourceCounts = counts || getInventoryTemplateCounts();
        return !!(sourceCounts && sourceCounts[templateId] > 0);
    }

    function getGroundTemplateCounts() {
        return getZoneTemplateCounts(lootEl);
    }

    function getAvailableTemplateCounts() {
        const inventoryCounts = getInventoryTemplateCounts();
        const groundCounts = getGroundTemplateCounts();
        const combined = { ...inventoryCounts };
        for (const tplId in groundCounts) {
            if (!Object.prototype.hasOwnProperty.call(groundCounts, tplId)) continue;
            combined[tplId] = (combined[tplId] || 0) + groundCounts[tplId];
        }
        return combined;
    }

    function resolveRecipeConsumption(recipe, counts) {
        if (!recipe || !Array.isArray(recipe.ingredients) || !recipe.ingredients.length) {
            return null;
        }

        const available = { ...counts };
        const chosenIngredients = [];

        for (const ing of recipe.ingredients) {
            if (Array.isArray(ing)) {
                const pick = ing.find(id => available[id] > 0);
                if (!pick) return null;
                chosenIngredients.push(pick);
                available[pick] -= 1;
            } else {
                if (!available[ing]) return null;
                chosenIngredients.push(ing);
                available[ing] -= 1;
            }
        }

        const consumeSource =
            Array.isArray(recipe.consume) && recipe.consume.length
                ? recipe.consume
                : chosenIngredients;
        const consumeCounts = {};

        consumeSource.forEach(entry => {
            if (Array.isArray(entry)) {
                const pick = entry.find(id => chosenIngredients.includes(id))
                    || entry.find(id => counts[id] > 0);
                if (!pick) return;
                consumeCounts[pick] = (consumeCounts[pick] || 0) + 1;
            } else {
                consumeCounts[entry] = (consumeCounts[entry] || 0) + 1;
            }
        });

        return { consumeCounts, chosenIngredients };
    }

    function isRecipeCraftable(recipe, counts) {
        return !!resolveRecipeConsumption(recipe, counts);
    }

    function computeCraftableTemplates() {
        const result = [];
        const counts = getAvailableTemplateCounts();
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

        craftInfoEl.textContent =
            "Fabriquer prend du temps réel : un compte à rebours bloque les autres actions.";

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

    function getCraftDurationMs(templateId) {
        const tpl = ITEM_TEMPLATES[templateId];
        const seconds = tpl && Number.isFinite(tpl.craftDurationSec)
            ? tpl.craftDurationSec
            : DEFAULT_CRAFT_DURATION_MS / 1000;
        return Math.max(500, seconds * 1000);
    }

    function performCraft(outputTemplateId, recipe) {
        if (combatState.active) {
            logMessage("Impossible de fabriquer pendant un combat : le temps est figé.");
            return;
        }
        if (isActionInProgress()) {
            showToast("Une autre action est déjà en cours.", "info");
            return;
        }

        const counts = getAvailableTemplateCounts();
        const resolved = resolveRecipeConsumption(recipe, counts);
        if (!resolved) {
            logMessage("Tu n'as plus les ressources nécessaires pour fabriquer ça.");
            refreshCraftingUI();
            return;
        }

        const consumedCounts = resolved.consumeCounts;
        const unequipState = { weaponChanged: false, bagChanged: false };

        const removeFromZone = (zoneEl, tplId, remaining) => {
            if (!zoneEl || remaining <= 0) return remaining;
            const itemEls = Array.from(
                zoneEl.querySelectorAll(`.item[data-template-id="${tplId}"]`)
            );
            for (const el of itemEls) {
                if (remaining <= 0) break;
                if (el.classList.contains("equipped-weapon")) {
                    equippedWeaponTemplateId = null;
                    unequipState.weaponChanged = true;
                }
                if (el.classList.contains("equipped-bag")) {
                    equippedBagTemplateId = null;
                    unequipState.bagChanged = true;
                }
                el.remove();
                remaining -= 1;
            }
            return remaining;
        };

        for (const tplId in consumedCounts) {
            if (!Object.prototype.hasOwnProperty.call(consumedCounts, tplId)) continue;
            let toRemove = consumedCounts[tplId];
            toRemove = removeFromZone(inventoryEl, tplId, toRemove);
            toRemove = removeFromZone(lootEl, tplId, toRemove);
            if (toRemove > 0) {
                console.warn("Impossible de retirer assez d'items pour le craft", tplId);
            }
        }

        // Met à jour immédiatement les options de craft après consommation
        refreshCraftingUI();

        if (unequipState.weaponChanged) updateEquippedWeaponUI();
        if (unequipState.bagChanged) updateCapacityUI();
        updateCapacityUI();

        const outTpl = ITEM_TEMPLATES[outputTemplateId];
        const craftedName = outTpl ? outTpl.name : outputTemplateId;
        const craftLabel = `Fabrication de « ${craftedName} »`;
        const durationMs = getCraftDurationMs(outputTemplateId);

        const finalizeCraft = () => {
            const outputValue = outTpl && typeof outTpl.value === "number" ? outTpl.value : 0;
            const currentLoad = calculateInventoryLoad();
            const maxCap = getCurrentMaxCapacity();
            const canCarry = currentLoad + outputValue <= maxCap;

            if (canCarry) {
                addItemToInventory(outputTemplateId);
                logMessage(`Tu fabriques ${craftedName} et le ranges dans ton inventaire.`);
            } else {
                const craftedItem = createItemFromTemplate(outputTemplateId);
                if (craftedItem) {
                    const el = createItemElement(craftedItem);
                    appendItemToZone(el, lootEl);
                    logMessage(
                        `Tu fabriques ${craftedName} mais n'as pas assez de place : tu le laisses au sol.`
                    );
                }
            }

            updateCapacityUI();
            refreshWoundsIfRelevant();
            renderWounds();
            refreshCraftingUI();
        };

        logMessage(`${craftLabel} en cours...`);
        startBlockingAction(craftLabel, durationMs, { hideInventory: true }).then(finalizeCraft);
    }

    /* --- Panneau d'actions sur l'objet --- */

    function refreshSelectedItemUI() {
        if (!selectedItemEl || !selectedItemEl.isConnected) {
            clearSelectedItem();
            return;
        }

        renderSelectedItemDetails(selectedItemEl);
    }

    function handleItemClick(itemEl) {
        selectedItemEl = itemEl;
        renderSelectedItemDetails(itemEl);
    }

    function renderSelectedItemDetails(itemEl) {
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
        const templateId = itemEl.dataset.templateId || "";
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
        const onGround = originZoneType === "loot";
        const alreadyEquippedAsWeapon = templateId && templateId === equippedWeaponTemplateId;
        const alreadyEquippedAsBag = templateId && templateId === equippedBagTemplateId;

        // Équipement : seulement si dans l'inventaire
        if (inInventory && hasWeapon) {
            if (alreadyEquippedAsWeapon) {
                const info = document.createElement("div");
                info.textContent = "Déjà équipé comme arme.";
                info.classList.add("selected-info");
                selectedItemButtonsEl.appendChild(info);
            } else {
                const equipBtn = document.createElement("button");
                equipBtn.classList.add("small-btn");
                equipBtn.textContent = "Équiper comme arme";
                equipBtn.addEventListener("click", () => {
                    equipBtn.disabled = true;
                    equipWeaponFromElement(itemEl);
                    refreshSelectedItemUI();
                });
                selectedItemButtonsEl.appendChild(equipBtn);
            }
        }

        if (inInventory && hasBag) {
            if (alreadyEquippedAsBag) {
                const info = document.createElement("div");
                info.textContent = "Déjà équipé comme sac.";
                info.classList.add("selected-info");
                selectedItemButtonsEl.appendChild(info);
            } else {
                const bagBtn = document.createElement("button");
                bagBtn.classList.add("small-btn");
                bagBtn.textContent = "Équiper comme sac";
                bagBtn.addEventListener("click", () => {
                    bagBtn.disabled = true;
                    equipBagFromElement(itemEl);
                    refreshSelectedItemUI();
                });
                selectedItemButtonsEl.appendChild(bagBtn);
            }
        }

        if (inInventory) {
            const dropBtn = document.createElement("button");
            dropBtn.classList.add("small-btn");
            dropBtn.textContent = "Jeter au sol";
            dropBtn.disabled = !canDropItems();
            dropBtn.addEventListener("click", () => {
                dropItemToGround(itemEl);
            });
            selectedItemButtonsEl.appendChild(dropBtn);

            if (!canDropItems()) {
                const info = document.createElement("div");
                info.textContent =
                    "Impossible de déposer un objet pendant une action rapide ou en combat.";
                info.classList.add("selected-info");
                selectedItemButtonsEl.appendChild(info);
            }
        }

        const isFoodOrDrink = hungerRestore > 0 || thirstRestore > 0;
        const isBandage = bandageQuality > 0;
        if (isBandage) {
            if (!wounds.length) {
                const info = document.createElement("div");
                info.textContent = "Tu dois être blessé pour poser un bandage.";
                info.classList.add("selected-info");
                selectedItemButtonsEl.appendChild(info);
            } else {
                const usableWounds = wounds.filter(
                    w => !w.bandaged || w.bleeding || bandageQuality > (w.bandageQuality || 0)
                );

                if (!usableWounds.length) {
                    const info = document.createElement("div");
                    info.textContent =
                        "Aucune blessure ne peut bénéficier d'un bandage de cette qualité.";
                    info.classList.add("selected-info");
                    selectedItemButtonsEl.appendChild(info);
                }

                usableWounds.forEach(w => {
                    const useBtn = document.createElement("button");
                    useBtn.classList.add("small-btn");
                    const improving = w.bandaged && !w.bleeding && bandageQuality > (w.bandageQuality || 0);
                    useBtn.textContent = improving
                        ? `Améliorer le bandage sur ${w.part}`
                        : `Utiliser sur ${w.part}`;
                    useBtn.addEventListener("click", () => {
                        useConsumableItem(itemEl, { targetWoundId: w.id });
                    });
                    selectedItemButtonsEl.appendChild(useBtn);
                });
            }
        }

        if (heal > 0 || isFoodOrDrink) {
            const useBtn = document.createElement("button");
            useBtn.classList.add("small-btn");
            useBtn.textContent = "Utiliser";
            useBtn.addEventListener("click", () => {
                useConsumableItem(itemEl, { isFoodOrDrink });
            });
            selectedItemButtonsEl.appendChild(useBtn);
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
        selectedItemEl = null;
        if (selectedItemNameEl) selectedItemNameEl.textContent = "Aucun";
        if (selectedItemInfoEl) selectedItemInfoEl.textContent = "";
        if (selectedItemButtonsEl) selectedItemButtonsEl.innerHTML = "";
    }

    async function takeAllLoot() {
        if (!lootEl || !inventoryEl) return;
        const groundItems = Array.from(lootEl.querySelectorAll(".item"));
        if (!groundItems.length) {
            logMessage("Il n'y a rien à ramasser ici.");
            return;
        }

        const sequenceToken = Symbol("pickup-sequence");
        activePickupSequenceToken = sequenceToken;
        let takenCount = 0;

        for (const itemEl of groundItems) {
            if (activePickupSequenceToken !== sequenceToken) break;

            const value = parseInt(itemEl.dataset.value || "0", 10) || 0;
            const currentLoad = calculateInventoryLoad();
            const maxCap = getCurrentMaxCapacity();
            if (currentLoad + value > maxCap) {
                showToast("Inventaire plein", "danger");
                activePickupSequenceToken = null;
                break;
            }

            const success = await takeItemToInventory(itemEl, {
                asPartOfSequence: true,
                sequenceToken
            });
            if (!success) break;
            takenCount += 1;
        }

        clearSelectedItem();
        updateCapacityUI();

        if (takenCount > 0) {
            logMessage(`Tu ramasses ${takenCount} objet(s) au sol.`);
            showToast("Ramassage effectué", "success");
        }

        refreshWoundsIfRelevant();
        refreshCurrentSceneOptionButtons();
        activePickupSequenceToken = null;
    }

    async function takeItemToInventory(itemEl, opts = {}) {
        if (!inventoryEl) return false;
        const originZone = itemEl.parentElement;
        if (!originZone || !originZone.dataset) return false;
        const zoneType = originZone.dataset.zone;
        if (zoneType !== "loot") return false;

        const { asPartOfSequence = false, sequenceToken = null } = opts;
        if (asPartOfSequence && activePickupSequenceToken && sequenceToken !== activePickupSequenceToken) {
            return false;
        }

        const value = parseInt(itemEl.dataset.value || "0", 10) || 0;
        const currentTotal = calculateInventoryLoad();
        const newTotal = currentTotal + value;
        const maxCap = getCurrentMaxCapacity();

        if (newTotal > maxCap) {
            showToast("Inventaire plein", "danger");
            if (asPartOfSequence && activePickupSequenceToken === sequenceToken) {
                activePickupSequenceToken = null;
            }
            return false;
        }

        const pickupLabel = `Ramassage : ${itemEl.dataset.name || "objet"}`;
        await startBlockingAction(pickupLabel, LOOT_PICKUP_DURATION_MS, { hideInventory: false });

        appendItemToZone(itemEl, inventoryEl);
        updateCapacityUI();
        logMessage(`Tu prends ${itemEl.dataset.name} avec toi.`);
        showToast(`Tu ramasses ${itemEl.dataset.name}.`, "success");
        clearSelectedItem();
        refreshWoundsIfRelevant();
        refreshCurrentSceneOptionButtons();
        return true;
    }

    function canDropItems() {
        return !combatState.active && !isActionInProgress();
    }

    function dropItemToGround(itemEl, opts = {}) {
        if (!lootEl || !itemEl) return false;
        const { forced = false, silent = false } = opts;

        if (!forced && !canDropItems()) {
            logMessage("Tu n'as pas le temps de déposer quelque chose au sol.");
            return false;
        }

        if (itemEl.classList.contains("equipped-weapon")) {
            equippedWeaponTemplateId = null;
            itemEl.classList.remove("equipped-weapon");
            updateEquippedWeaponUI();
        }
        if (itemEl.classList.contains("equipped-bag")) {
            equippedBagTemplateId = null;
            itemEl.classList.remove("equipped-bag");
        }

        appendItemToZone(itemEl, lootEl);
        updateCapacityUI();
        clearSelectedItem();

        if (!silent) {
            const name = itemEl.dataset.name || "objet";
            logMessage(`Tu poses ${name} au sol.`);
            showToast(`${name} est laissé au sol.`, "info");
        }

        refreshWoundsIfRelevant();

        return true;
    }

    function createLostThrowableEntryFromElement(itemEl) {
        if (!itemEl) return null;
        return {
            id: `lost-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            templateId: itemEl.dataset.templateId || "",
            name: itemEl.dataset.name || "arme de jet",
            rarity: parseInt(itemEl.dataset.rarity || "1", 10) || 1
        };
    }

    function registerLostThrowable(itemEl) {
        const state = getLocationState(currentLocationId);
        if (!state || !itemEl) return;
        const entry = createLostThrowableEntryFromElement(itemEl);
        if (!entry) return;

        state.lostThrowables = state.lostThrowables || [];
        state.lostThrowables.push(entry);
        itemEl.remove();
        logMessage(`${entry.name} est quelque part au sol, à toi de le retrouver.`);
        refreshLostThrowableActions();
        updateCapacityUI();
        clearSelectedItem();
    }

    function removeLostThrowableEntry(state, entryId) {
        if (!state?.lostThrowables) return;
        state.lostThrowables = state.lostThrowables.filter(e => e.id !== entryId);
    }

    function refreshLostThrowableActions() {
        if (!lostThrowableActionsEl) return;
        const state = getLocationState(currentLocationId);
        const lost = state?.lostThrowables || [];
        lostThrowableActionsEl.innerHTML = "";

        if (!lost.length) {
            lostThrowableActionsEl.classList.add("hidden");
            return;
        }

        lostThrowableActionsEl.classList.remove("hidden");
        lost.forEach(entry => {
            const row = document.createElement("div");
            row.classList.add("lost-throwable-row");

            const label = document.createElement("div");
            label.classList.add("label");
            label.textContent = `Objet égaré : ${entry.name}`;

            const btn = document.createElement("button");
            btn.classList.add("secondary-btn", "inline-btn");
            btn.textContent = `Rechercher ${entry.name}`;
            btn.addEventListener("click", () => searchForLostThrowable(entry.id));

            row.appendChild(label);
            row.appendChild(btn);
            lostThrowableActionsEl.appendChild(row);
        });
    }

    function computeRealMsFromSeconds(seconds) {
        return Math.max(0, Math.round(Math.max(0, seconds) * 1000));
    }

    async function searchForLostThrowable(entryId) {
        if (!entryId) return;
        if (isActionInProgress()) {
            showToast("Une action est déjà en cours.", "info");
            return;
        }
        if (activeLostThrowableSearch) {
            showToast("Tu recherches déjà une arme de jet.", "info");
            return;
        }

        const state = getLocationState(currentLocationId);
        if (!state || !Array.isArray(state.lostThrowables)) return;
        const entry = state.lostThrowables.find(e => e.id === entryId);
        if (!entry) return;

        const minSeconds = Math.max(0, LOST_THROWABLE_SEARCH_SECONDS?.min ?? 0);
        const maxSeconds = Math.max(minSeconds, LOST_THROWABLE_SEARCH_SECONDS?.max ?? minSeconds);
        const span = Math.max(0, maxSeconds - minSeconds);
        const searchSeconds = Math.round(minSeconds + Math.random() * span);
        const durationMs = computeRealMsFromSeconds(searchSeconds);
        const gameMinutesCost = searchSeconds / 60;
        const label = `Recherche de ${entry.name}`;
        activeLostThrowableSearch = entryId;

        try {
            const result = await startBlockingAction(label, durationMs, {
                hideInventory: true,
                spinnerInChoices: true,
                indeterminate: true,
                cancelLabel: "Arrêter la recherche",
                onCancel: () => {
                    activeLostThrowableSearch = null;
                    logMessage("Tu abandonnes la recherche pour l'instant.");
                    showToast("Recherche interrompue", "info");
                }
            });

            if (result && result.cancelled) {
                return;
            }

            if (gameMinutesCost > 0) {
                addGameMinutes(gameMinutesCost, { silent: false });
            }

            const item = createItemFromTemplate(entry.templateId);
            if (item && lootEl) {
                const node = createItemElement(item);
                appendItemToZone(node, lootEl);
                logMessage(`Tu remets la main sur ${entry.name}.`);
                showToast(`${entry.name} retrouvé`, "success");
            } else {
                logMessage("Impossible de remettre la main sur cette arme de jet.");
                showToast("L'arme de jet reste introuvable.", "warning");
            }

            removeLostThrowableEntry(state, entryId);
            updateCapacityUI();
        } finally {
            activeLostThrowableSearch = null;
            renderScene(currentSceneId);
        }
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
        if (combatState?.active) {
            renderCombatUI();
        }
        logMessage(`Tu équipes : ${itemEl.dataset.name} comme arme.`);
        showToast(`${itemEl.dataset.name} équipé(e) comme arme.`, "info");
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
        showToast(`${itemEl.dataset.name} équipé(e) comme sac.`, "info");
    }

    function getUseDurationMs(templateId) {
        const tpl = ITEM_TEMPLATES[templateId];
        const seconds = tpl && Number.isFinite(tpl.useDurationSec)
            ? tpl.useDurationSec
            : DEFAULT_USE_DURATION_MS / 1000;
        return Math.max(600, seconds * 1000);
    }

    function useConsumableItem(itemEl, opts) {
        if (!itemEl) return;
        if (combatState.active) {
            logMessage("Impossible de consommer ou se soigner pendant un combat gelé.");
            return;
        }
        if (isActionInProgress()) {
            showToast("Attends la fin de l'action en cours.", "info");
            return;
        }

        const heal = parseInt(itemEl.dataset.heal || "0", 10) || 0;
        const hungerRestore =
                  parseInt(itemEl.dataset.hungerRestore || "0", 10) || 0;
        const thirstRestore =
                  parseInt(itemEl.dataset.thirstRestore || "0", 10) || 0;
        const bandageQuality =
                  parseInt(itemEl.dataset.bandageQuality || "0", 10) || 0;
        const isFoodOrDrink = opts && opts.isFoodOrDrink;
        const targetWoundId = opts && opts.targetWoundId;
        const isBandage = bandageQuality > 0;
        const name = itemEl.dataset.name || "objet";
        const templateId = itemEl.dataset.templateId;

        const overlayLabel = isFoodOrDrink
            ? `Consommation de « ${name} »`
            : isBandage
                ? `Soin avec « ${name} »`
                : `Utilisation de « ${name} »`;

        const applyEffects = () => {
            if (isBandage) {
                const applied = applyBandage(bandageQuality, targetWoundId);
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

            if (itemEl.isConnected) {
                itemEl.remove();
            }
            refreshWoundsIfRelevant();
            updateStatsUI();
            updateCapacityUI();
            clearSelectedItem();
        };

        logMessage(`${overlayLabel} en cours...`);
        startBlockingAction(overlayLabel, getUseDurationMs(templateId), { hideInventory: true })
            .then(applyEffects);
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

    function getEquippedWeaponElement() {
        if (!inventoryEl) return null;
        return inventoryEl.querySelector(".item.equipped-weapon");
    }

    function getThrowableWeaponElements() {
        if (!inventoryEl) return [];
        return Array.from(
            inventoryEl.querySelectorAll('.item[data-throwable="true"]')
        );
    }

    function hasThrowableWeapon() {
        return getThrowableWeaponElements().length > 0;
    }

    function describeDistance(distance) {
        if (distance <= 0) return "au contact";
        if (distance === 1) return "très proche";
        if (distance === 2) return "à portée";
        return "loin";
    }

    function describeCombatDifficulty(difficulty) {
        if (difficulty >= 20) return "Mortel";
        if (difficulty >= 16) return "Éprouvant";
        if (difficulty >= 12) return "Risque notable";
        if (difficulty >= 8) return "Modéré";
        return "Mineur";
    }

    function getLocationLabel(locationId = currentLocationId) {
        const location = locations[locationId] || {};
        return location.mapLabel || location.name || "Lieu inconnu";
    }

    function computeApproachDuration(distance) {
        if (distance <= 0) return 0;
        if (distance === 1) return 10000;
        if (distance === 2) return 16000;
        return 22000;
    }

    function buildApproachState(distance) {
        const initial = Math.max(0, distance || 0);
        const totalMs = computeApproachDuration(initial);
        return {
            initialDistance: initial,
            totalMs,
            remainingMs: totalMs,
            contactTriggered: false
        };
    }

    function computeApproachPercent() {
        const approach = combatState.approach;
        if (!approach || !approach.totalMs) return 100;
        const percent = 100 * (1 - approach.remainingMs / approach.totalMs);
        return Math.max(0, Math.min(100, percent));
    }

    function updateApproachMeterUI() {
        const fill = choicesEl && choicesEl.querySelector(".approach-fill");
        const label = choicesEl && choicesEl.querySelector(".approach-label");
        if (fill) {
            fill.style.height = `${computeApproachPercent()}%`;
        }
        if (label) {
            label.textContent = `Rapprochement : ${describeDistance(combatState.distance)}`;
        }
    }

    function syncCombatDistanceFromApproach() {
        const approach = combatState.approach;
        if (!approach || (!approach.totalMs && approach.initialDistance === 0)) return;
        const ratio = approach.totalMs === 0 ? 0 : approach.remainingMs / approach.totalMs;
        const nextDistance = Math.max(0, Math.ceil(approach.initialDistance * ratio));
        const previousDistance = combatState.distance;
        if (nextDistance !== combatState.distance) {
            combatState.distance = nextDistance;
            const enemy = combatState.enemies && combatState.enemies[0];
            if (enemy) {
                logMessage(`${enemy.name} se rapproche (${describeDistance(nextDistance)}).`);
            }
        }

        if (approach.remainingMs <= 0 && approach.initialDistance > 0 && !approach.contactTriggered) {
            approach.contactTriggered = true;
            attemptEnemyAttack();
        }

        if (previousDistance !== combatState.distance && combatState.distance === 0 && combatState.active) {
            renderCombatUI();
        }
    }

    function startCombatApproachTimer() {
        stopCombatApproachTimer();
        const approach = combatState.approach;
        if (!combatState.active || combatState.awaitingIntroConfirm) return;
        if (!approach || approach.totalMs <= 0) {
            if (combatState.active) {
                combatApproachTimer = setInterval(() => {
                    if (!combatState.active) {
                        stopCombatApproachTimer();
                        return;
                    }
                    const attacked = attemptEnemyAttack();
                    if (attacked && combatState.active) renderCombatUI();
                }, 200);
            }
            return;
        }
        combatApproachTimer = setInterval(() => {
            if (!combatState.active) {
                stopCombatApproachTimer();
                return;
            }
            if (combatState.approach && combatState.approach.totalMs > 0) {
                combatState.approach.remainingMs = Math.max(0, combatState.approach.remainingMs - 200);
                syncCombatDistanceFromApproach();
                updateApproachMeterUI();
            }
            const attacked = attemptEnemyAttack();
            if (attacked && combatState.active) renderCombatUI();
        }, 200);
    }

    function stopCombatApproachTimer() {
        if (combatApproachTimer) clearInterval(combatApproachTimer);
        combatApproachTimer = null;
    }

    function attemptEnemyAttack(opts = {}) {
        if (!combatState.active) return false;
        if (combatState.awaitingIntroConfirm) return false;
        const enemy = combatState.enemies && combatState.enemies[0];
        if (!enemy) return false;

        syncCombatDistanceFromApproach();
        updateApproachMeterUI();

        if (combatState.distance > 0 && !opts.ignoreDistance) {
            if (opts.logApproach) {
                logMessage(
                    `${enemy.name} continue de se rapprocher (${describeDistance(combatState.distance)}).`
                );
            }
            return false;
        }

        const now = performance.now();
        if (!opts.ignoreCooldown && now < (combatState.nextEnemyAttackAt || 0)) {
            return false;
        }

        const roll = rollDice(6, 1);
        const damage = enemy.baseDamage + roll.sum;
        applyHeroDamage(damage, { type: "normal", reason: "Ton adversaire t'assène le coup fatal." });
        registerWound(Math.ceil(damage / 3));
        logMessage(`${enemy.name} riposte et inflige ${damage} dégâts.`);
        showToast(`Tu es blessé : -${damage} PV`, "danger");
        combatState.nextEnemyAttackAt = now + ENEMY_ATTACK_COOLDOWN_MS;
        updateStatsUI();

        if (hero.hp <= 0 || defeatState.active) {
            return true;
        }
        return true;
    }

    function activateCombatAfterIntro() {
        if (!combatState.active) return;
        combatState.awaitingIntroConfirm = false;
        renderCombatUI();
        startCombatApproachTimer();
        attemptEnemyAttack();
    }

    function showCombatIntroModal(enemy, difficulty, startDistance) {
        if (!combatModalEl) {
            renderCombatUI();
            return false;
        }
        const locationLabel = getLocationLabel(currentLocationId);
        const distanceLabel = describeDistance(startDistance);
        const difficultyLabel = describeCombatDifficulty(difficulty);

        if (combatModalTitleEl) {
            combatModalTitleEl.textContent = "Un combat commence";
        }
        if (combatModalLocationEl) {
            combatModalLocationEl.textContent = `Lieu : ${locationLabel}`;
        }
        if (combatModalDifficultyEl) {
            combatModalDifficultyEl.textContent =
                `Difficulté estimée : ${difficulty} (${difficultyLabel})`;
        }
        if (combatModalDescriptionEl) {
            combatModalDescriptionEl.textContent =
                `Tu engages le combat ${distanceLabel} de ${enemy.name}. ` +
                `Prépare-toi à agir vite dans cet environnement.`;
        }

        combatModalEl.classList.remove("hidden");
        combatModalEl.classList.add("open");

        if (combatModalConfirmBtn) {
            combatModalConfirmBtn.focus();
        }
        return true;
    }

    function closeCombatIntroModal() {
        if (!combatModalEl) return;
        combatModalEl.classList.remove("open");
        combatModalEl.classList.add("hidden");
    }

    function showOutcomeModal(title, description, effectText) {
        if (!outcomeModalEl) return;
        if (outcomeModalTitleEl) outcomeModalTitleEl.textContent = title;
        if (outcomeModalDescriptionEl) outcomeModalDescriptionEl.textContent = description;
        if (outcomeModalEffectEl) outcomeModalEffectEl.textContent = effectText;
        outcomeModalEl.classList.remove("hidden");
        outcomeModalEl.classList.add("open");
        if (outcomeModalConfirmBtn) outcomeModalConfirmBtn.focus();
    }

    function closeOutcomeModal() {
        if (!outcomeModalEl) return;
        outcomeModalEl.classList.remove("open");
        outcomeModalEl.classList.add("hidden");
    }

    function showQuestModal() {
        if (!questModalEl) return;
        if (questModalDescriptionEl) {
            questModalDescriptionEl.textContent = currentQuest;
        }
        questModalEl.classList.remove("hidden");
        questModalEl.classList.add("open");
        questModalCloseBtn?.focus();
    }

    function closeQuestModal() {
        if (!questModalEl) return;
        questModalEl.classList.remove("open");
        questModalEl.classList.add("hidden");
    }

    function getEquippedWeaponRange() {
        const tpl = getEquippedWeaponTemplate();
        if (!tpl) return 0;
        const reach = tpl.weaponStats?.range;
        if (Number.isFinite(reach)) {
            // Toute arme devrait offrir au moins une étape d'engagement avant le contact.
            return Math.max(1, reach);
        }
        return 1;
    }

    function canUseMelee() {
        if (!combatState?.active) return false;
        const reach = getEquippedWeaponRange();
        return combatState.distance <= reach;
    }

    function canUseRanged() {
        return combatState.distance <= 2;
    }

    function computeStartDistance(option) {
        const location = locations[currentLocationId] || {};
        if (typeof option.startDistance === "number") {
            return Math.max(0, Math.round(option.startDistance));
        }
        const range = option.startDistanceRange || location.enemyDistanceRange || {};
        const min = Number.isFinite(range.min) ? Math.max(0, Math.round(range.min)) : 0;
        const max = Number.isFinite(range.max) ? Math.max(min, Math.round(range.max)) : min + 1;
        const span = Math.max(0, max - min);
        return min + Math.round(Math.random() * span);
    }

    function startCombat(option, optionIndex) {
        const d = option.diceTest || {};
        const enemyName =
            option.enemyName || d.description || option.text || "adversaire";
        const difficulty = Math.max(6, d.difficulty || 10);
        const enemy = {
            id: `enemy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: enemyName,
            hp: difficulty,
            maxHp: difficulty,
            baseDamage: Math.max(2, Math.round(difficulty / 4)),
            fleeDifficulty: Math.max(8, difficulty)
        };

        const startDistance = computeStartDistance(option);

        stopCombatApproachTimer();

        combatState = {
            active: true,
            difficulty,
            enemies: [enemy],
            victoryScene: option.successScene || (d && d.successScene),
            defeatScene: option.failScene || (d && d.failScene),
            victoryEffect: option.successEffect,
            defeatEffect: option.failEffect,
            previousTimeContext: currentTimeContext,
            distance: startDistance,
            attackCooldownEndsAt: 0,
            nextEnemyAttackAt: performance.now(),
            approach: buildApproachState(startDistance),
            awaitingIntroConfirm: false,
            originCombatId:
                typeof optionIndex === "number"
                    ? `${currentSceneId}:${optionIndex}`
                    : null,
            originLocationId: currentLocationId
        };
        currentTimeContext = "fast";
        document.body.classList.add("combat-active");
        updateGroundPanelVisibility();
        musicController.playActions();
        renderCombatUI();
        logMessage(`Un combat s'engage contre ${enemy.name}.`);
        logMessage(`Le zombie est ${describeDistance(combatState.distance)}.`);
        showToast(`Combat contre ${enemy.name}`, "info");
        const introShown = showCombatIntroModal(enemy, difficulty, combatState.distance);
        combatState.awaitingIntroConfirm = introShown;
        if (!introShown) {
            activateCombatAfterIntro();
        }
    }

    function renderCombatUI() {
        if (!choicesEl || !combatState.active) return;
        if (choiceTitleEl) choiceTitleEl.textContent = "Actions de combat";
        choicesEl.innerHTML = "";

        const status = document.createElement("div");
        status.classList.add("combat-status");
        status.textContent = combatState.enemies
            .map(e => `${e.name} (${e.hp}/${e.maxHp} PV)`).join(" • ");
        choicesEl.appendChild(status);

        const distanceInfo = document.createElement("div");
        distanceInfo.classList.add("combat-distance");
        distanceInfo.textContent = `Distance : ${describeDistance(combatState.distance)}`;
        choicesEl.appendChild(distanceInfo);

        const approachWrapper = document.createElement("div");
        approachWrapper.classList.add("combat-approach");
        const track = document.createElement("div");
        track.classList.add("approach-track");
        const fill = document.createElement("div");
        fill.classList.add("approach-fill");
        track.appendChild(fill);
        const approachLabel = document.createElement("div");
        approachLabel.classList.add("approach-label");
        approachLabel.textContent = `Rapprochement : ${describeDistance(combatState.distance)}`;
        approachWrapper.appendChild(track);
        approachWrapper.appendChild(approachLabel);
        choicesEl.appendChild(approachWrapper);

        if (combatState.distance > 0) {
            const approachBtn = document.createElement("button");
            approachBtn.classList.add("choice-btn");
            approachBtn.textContent = "Se rapprocher";
            approachBtn.addEventListener("click", approachEnemy);
            choicesEl.appendChild(approachBtn);
        }

        const now = performance.now();
        const cooldownRemainingMs = Math.max(0, (combatState.attackCooldownEndsAt || 0) - now);
        const meleeInCooldown = cooldownRemainingMs > 0;
        const inMeleeRange = canUseMelee();

        if (inMeleeRange) {
            const attackBtn = document.createElement("button");
            attackBtn.classList.add("choice-btn");
            attackBtn.textContent = meleeInCooldown
                ? `Attaque au corps à corps (${(cooldownRemainingMs / 1000).toFixed(1)}s)`
                : "Attaque au corps à corps";
            attackBtn.disabled = !combatState.enemies.length || meleeInCooldown;
            attackBtn.addEventListener("click", performMeleeAttack);
            choicesEl.appendChild(attackBtn);
        } else if (combatState.enemies.length) {
            const info = document.createElement("div");
            info.classList.add("combat-distance");
            const reach = getEquippedWeaponRange();
            info.textContent =
                "L'adversaire est hors de portée pour une attaque au corps à corps." +
                (reach > 0
                    ? ` (portée actuelle de l'arme : ${reach})`
                    : " (tu combats à mains nues)");
            choicesEl.appendChild(info);
        }

        const throwableElements = getThrowableWeaponElements();
        if (throwableElements.length === 0) {
            const noThrow = document.createElement("div");
            noThrow.classList.add("combat-distance");
            noThrow.textContent = "Aucune arme de jet disponible.";
            choicesEl.appendChild(noThrow);
        } else {
            const throwContainer = document.createElement("div");
            throwContainer.classList.add("throw-buttons");
            throwableElements.forEach(el => {
                const btn = document.createElement("button");
                btn.classList.add("choice-btn");
                const itemName = el.dataset.name || "objet";
                btn.textContent = `Lancer ${itemName}`;
                btn.disabled = meleeInCooldown || !canUseRanged();
                btn.addEventListener("click", () => performRangedAttack(el));
                throwContainer.appendChild(btn);
            });
            choicesEl.appendChild(throwContainer);
        }

        const fleeBtn = document.createElement("button");
        fleeBtn.classList.add("choice-btn");
        fleeBtn.textContent = "Fuir";
        fleeBtn.addEventListener("click", attemptFlee);
        choicesEl.appendChild(fleeBtn);

        updateApproachMeterUI();
    }

    function computeHeroInitiativeChance() {
        const finesse = Math.max(0, hero.finesse || 0);
        const baseChance = 0.35;
        const finesseBonus = Math.min(0.4, finesse * 0.08);
        return Math.min(0.9, baseChance + finesseBonus);
    }

    function computeThrowableHitChance(distance) {
        const finesse = Math.max(0, hero.finesse || 0);
        const base = 0.5 + Math.min(0.35, finesse * 0.06);
        const penalty = Math.max(0, distance) * 0.08;
        return Math.max(0.25, Math.min(0.95, base - penalty));
    }

    function heroWinsApproachInitiative() {
        const chance = computeHeroInitiativeChance();
        const roll = Math.random();
        return roll < chance;
    }

    function approachEnemy() {
        if (!combatState.active) return;
        const enemy = combatState.enemies?.[0];
        if (!enemy) {
            endCombat(true);
            return;
        }

        if (combatState.distance <= 0) {
            logMessage("Tu es déjà au contact de l'ennemi.");
            return;
        }

        combatState.distance = Math.max(0, combatState.distance - 1);
        combatState.approach = buildApproachState(combatState.distance);
        logMessage(
            `Tu te rapproches de ${enemy.name} (${describeDistance(combatState.distance)}).`
        );
        updateApproachMeterUI();
        startCombatApproachTimer();

        if (combatState.distance === 0) {
            if (heroWinsApproachInitiative()) {
                const percent = Math.round(computeHeroInitiativeChance() * 100);
                logMessage(
                    `Ta finesse te donne l'initiative (${percent}% de chance) : tu es prêt à frapper avant ${enemy.name}.`
                );
            } else {
                logMessage(
                    `${enemy.name} profite de ton approche pour tenter de frapper en premier !`
                );
                enemyTurn();
            }
        } else {
            enemyTurn();
        }
        if (combatState.active) renderCombatUI();
    }

    function performMeleeAttack() {
        if (!combatState.active) return;
        syncCombatDistanceFromApproach();
        const enemy = combatState.enemies?.[0];
        if (!enemy) {
            endCombat(true);
            return;
        }

        const now = performance.now();
        if (now < (combatState.attackCooldownEndsAt || 0)) {
            const remaining = Math.max(0, combatState.attackCooldownEndsAt - now);
            logMessage(`Tu dois patienter encore ${(remaining / 1000).toFixed(1)}s avant de frapper.`);
            return;
        }

        if (!canUseMelee()) {
            logMessage("Tu es trop loin pour frapper, rapproche-toi d'abord.");
            return;
        }

        const roll = rollDice(6, 1);
        const damage = computeBaseAttackPower() + roll.sum;
        enemy.hp = Math.max(0, enemy.hp - damage);
        logMessage(
            `Tu attaques ${enemy.name} et infliges ${damage} dégâts (jet ${roll.rolls.join(", ")}).`
        );
        showToast(`Coup porté : ${damage} dégâts`, "success");

        combatState.attackCooldownEndsAt = now + ATTACK_COOLDOWN_MS;
        setTimeout(() => {
            if (combatState.active) renderCombatUI();
        }, ATTACK_COOLDOWN_MS);

        if (enemy.hp <= 0) {
            logMessage(`${enemy.name} s'effondre.`);
            combatState.enemies.shift();
            if (!combatState.enemies.length) {
                endCombat(true);
                return;
            }
        }

        enemyTurn();
        if (combatState.active) renderCombatUI();
    }

    function performRangedAttack(throwable) {
        if (!combatState.active) return;
        syncCombatDistanceFromApproach();
        const enemy = combatState.enemies?.[0];
        if (!enemy) {
            endCombat(true);
            return;
        }

        const now = performance.now();
        if (now < (combatState.attackCooldownEndsAt || 0)) {
            const remaining = Math.max(0, combatState.attackCooldownEndsAt - now);
            logMessage(`Ton attaque est en récupération pendant encore ${(remaining / 1000).toFixed(1)}s.`);
            return;
        }

        const weaponEl = getEquippedWeaponElement();
        const chosenThrowable = throwable || (weaponEl && weaponEl.dataset.throwable === "true"
            ? weaponEl
            : getThrowableWeaponElements()[0]);

        if (!canUseRanged()) {
            logMessage("La cible est trop loin pour une attaque à distance efficace.");
            return;
        }

        if (!chosenThrowable) {
            logMessage("Aucune arme de jet disponible.");
            return;
        }

        const base = parseFloat(chosenThrowable.dataset.baseDamage || "0") || 0;
        const finesseBonus = hero.finesse * 0.8;
        const damage = Math.max(1, Math.round(base + finesseBonus));
        const hitChance = computeThrowableHitChance(combatState.distance);
        const didHit = Math.random() < hitChance;
        const targetName = chosenThrowable.dataset.name || "arme";

        if (didHit) {
            enemy.hp = Math.max(0, enemy.hp - damage);
            logMessage(
                `Tu lances ${targetName} sur ${enemy.name}, infligeant ${damage} dégâts.`
            );
            showToast(`Lancer réussi (${Math.round(hitChance * 100)}%) : ${damage} dégâts`, "success");
        } else {
            logMessage(
                `Tu lances ${targetName}, mais ${enemy.name} échappe au projectile (chance ${(hitChance * 100).toFixed(0)}%).`
            );
            showToast("Lancer manqué", "warning");
        }

        combatState.attackCooldownEndsAt = now + ATTACK_COOLDOWN_MS;
        setTimeout(() => {
            if (combatState.active) renderCombatUI();
        }, ATTACK_COOLDOWN_MS);

        registerLostThrowable(chosenThrowable);
        if (equippedWeaponTemplateId === chosenThrowable.dataset.templateId) {
            equippedWeaponTemplateId = null;
        }
        updateEquippedWeaponUI();
        updateCapacityUI();

        if (didHit && enemy.hp <= 0) {
            logMessage(`${enemy.name} est neutralisé par ton lancer.`);
            combatState.enemies.shift();
            if (!combatState.enemies.length) {
                endCombat(true);
                return;
            }
        }

        enemyTurn();
        if (combatState.active) renderCombatUI();
    }

    function attemptFlee() {
        if (!combatState.active) return;
        const roll = rollDice(6, 2);
        const difficulty = combatState.enemies?.[0]
            ? combatState.enemies[0].fleeDifficulty
            : 10;
        const total = roll.sum + hero.audace;
        logMessage(
            `Fuite : jet ${roll.rolls.join(" + ")} + audace (${hero.audace}) = ${total} (difficulté ${difficulty}).`
        );

        if (total >= difficulty) {
            logMessage("Tu parviens à te dégager du combat !");
            showToast("Fuite réussie", "success");
            endCombat(false);
        } else {
            logMessage("Tu n'arrives pas à fuir, l'ennemi en profite !");
            showToast("Fuite ratée", "warning");
            const forcedHit = attemptEnemyAttack({ ignoreCooldown: true, ignoreDistance: true });
            if (!forcedHit) {
                combatState.nextEnemyAttackAt = performance.now() + ENEMY_ATTACK_COOLDOWN_MS;
            }
            if (combatState.active) renderCombatUI();
        }
    }

    function enemyTurn() {
        const attacked = attemptEnemyAttack({ logApproach: true });
        if (attacked && combatState.active) {
            renderCombatUI();
        }
    }

    function endCombat(victory) {
        closeCombatIntroModal();
        stopCombatApproachTimer();
        musicController.playCalm({ fadeOutMs: 1500 });

        const previousCombat = combatState;
        const nextSceneId = victory
            ? previousCombat.victoryScene
            : previousCombat.defeatScene;
        const effectToApply = victory
            ? previousCombat.victoryEffect
            : previousCombat.defeatEffect;
        if (victory) {
            const difficulty = previousCombat.difficulty || 0;
            const reward = computeExperienceRewardFromDifficulty(difficulty);
            grantExperience(reward, `Combat (difficulté ${difficulty})`);
        }

        if (victory && previousCombat.originCombatId && previousCombat.originLocationId) {
            const state = getLocationState(previousCombat.originLocationId);
            if (state && state.defeatedCombats) {
                state.defeatedCombats.add(previousCombat.originCombatId);
            }
        }
        showToast(victory ? "Victoire" : "Défaite", victory ? "success" : "danger");
        currentTimeContext = previousCombat.previousTimeContext || currentTimeContext;
        combatState = { active: false, enemies: [] };
        document.body.classList.remove("combat-active");
        updateGroundPanelVisibility();
        if (choiceTitleEl) choiceTitleEl.textContent = "Que fais-tu ?";
        refreshCraftingUI();
        addGameMinutes(10, { silent: false });

        if (effectToApply) {
            applyEffect(effectToApply);
        }

        if (hero.hp <= 0) {
            handleHeroDefeat("Tu t'effondres après ce combat.");
            return;
        }

        if (nextSceneId) {
            renderScene(nextSceneId);
        } else {
            renderScene(currentSceneId);
        }
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

    function showToast(text, type = "info") {
        if (!toastContainerEl || !text) return;
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.textContent = text;
        toastContainerEl.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("fade-out");
            setTimeout(() => toast.remove(), 400);
        }, 3000);
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

    /* --- Carte --- */

    const MAP_DIR_OFFSETS = {
        north: { dx: 0, dy: -1, label: "Nord" },
        south: { dx: 0, dy: 1, label: "Sud" },
        west: { dx: -1, dy: 0, label: "Ouest" },
        east: { dx: 1, dy: 0, label: "Est" },
        northeast: { dx: 1, dy: -1, label: "Nord-Est" },
        southeast: { dx: 1, dy: 1, label: "Sud-Est" },
        northwest: { dx: -1, dy: -1, label: "Nord-Ouest" },
        southwest: { dx: -1, dy: 1, label: "Sud-Ouest" }
    };

    function loadStairIcon() {
        if (stairIconPromise) return stairIconPromise;

        stairIconPromise = new Promise(resolve => {
            const img = new Image();

            img.onload = () => {
                stairIconImg = img;
                resolve(img);

                if (currentSceneId && scenes[currentSceneId]) {
                    renderMap(scenes[currentSceneId]);
                }
            };

            img.onerror = () => resolve(null);
            img.src = STAIR_ICON_SRC;
        });

        return stairIconPromise;
    }

    function getLocationLabel(locationId) {
        if (!locationId) return "Lieu";
        const location = locations[locationId];
        if (location && location.mapLabel) return location.mapLabel;
        return locationId;
    }

    function getLocationFloor(locationId) {
        const location = locations[locationId];
        const floor = location && location.mapFloor;
        return floor === 0 || floor ? floor : "ground";
    }

    function getLocationSize(locationId) {
        const location = locations[locationId];
        const size = location && location.mapSize;
        const width = size && Number.isFinite(size.width) ? Math.max(1, Math.round(size.width)) : 1;
        const height = size && Number.isFinite(size.height) ? Math.max(1, Math.round(size.height)) : 1;
        return { width, height };
    }

    function formatFloorLabel(floor) {
        if (typeof floor === "number") {
            if (floor === 0) return "RDC / Extérieur";
            if (floor === 1) return "1er étage";
            return `${floor}e étage`;
        }
        return `Niveau ${floor}`;
    }

    function computeMapBounds(placements) {
        if (!placements.size) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 1, height: 1 };
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        placements.forEach(({ x, y, size }) => {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + size.width - 1);
            maxY = Math.max(maxY, y + size.height - 1);
        });

        return {
            minX,
            minY,
            maxX,
            maxY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    }

    function buildMapLayout(locationId, floor) {
        const placements = new Map();
        const queue = [{ id: locationId, x: 0, y: 0 }];
        const spacing = 0;

        while (queue.length > 0) {
            const current = queue.shift();
            if (placements.has(current.id)) continue;

            const currentLocation = locations[current.id];
            if (!currentLocation || getLocationFloor(current.id) !== floor) continue;

            const size = getLocationSize(current.id);
            placements.set(current.id, { ...current, size });

            const mapPaths = currentLocation.mapPaths || {};
            Object.entries(mapPaths).forEach(([direction, targetLocationId]) => {
                const offset = MAP_DIR_OFFSETS[direction];
                if (!offset) return;

                const targetFloor = getLocationFloor(targetLocationId);
                const targetSize = getLocationSize(targetLocationId);

                if (targetFloor !== floor) return;

                const xSpacing = (offset.dx >= 0 ? size.width : targetSize.width) + spacing;
                const ySpacing = (offset.dy >= 0 ? size.height : targetSize.height) + spacing;

                const targetX = current.x + offset.dx * xSpacing;
                const targetY = current.y + offset.dy * ySpacing;

                if (!placements.has(targetLocationId) && !queue.some(entry => entry.id === targetLocationId)) {
                    queue.push({ id: targetLocationId, x: targetX, y: targetY });
                }
            });
        }

        const bounds = computeMapBounds(placements);

        return { placements, bounds };
    }

    function getCachedMapLayout(locationId, floor) {
        const key = String(floor);
        if (!mapLayouts.has(key)) {
            mapLayouts.set(key, buildMapLayout(locationId, floor));
        }
        return mapLayouts.get(key);
    }

    function wrapTextToLines(ctx, text, maxWidth) {
        const words = text.split(/\s+/);
        const lines = [];
        let current = "";

        words.forEach(word => {
            const next = current ? `${current} ${word}` : word;
            if (ctx.measureText(next).width <= maxWidth || !current) {
                current = next;
            } else {
                lines.push(current);
                current = word;
            }
        });

        if (current) {
            lines.push(current);
        }
        return lines;
    }

    function getCanvasMetrics(bounds, floor) {
        const key = String(floor === 0 || floor ? floor : "default");
        if (mapMetricsByFloor.has(key)) {
            return mapMetricsByFloor.get(key);
        }

        const rawGridWidth = mapGridEl && mapGridEl.clientWidth;
        const availableWidth = Math.max(320, (rawGridWidth || 640)) - 20;
        const padding = 24;
        const unit = Math.max(48, Math.min(120, (availableWidth - padding * 2) / Math.max(1, bounds.width)));
        const width = Math.max(320, Math.round(bounds.width * unit + padding * 2));
        const height = Math.max(220, Math.round(bounds.height * unit + padding * 2));
        const metrics = { unit, padding, width, height };

        mapMetricsByFloor.set(key, metrics);
        return metrics;
    }

    function drawInterFloorMarkers(ctx, positions) {
        const markerSizeRatio = 0.28;
        const offsetInsetRatio = 0.18;

        Object.entries(locations).forEach(([id, location]) => {
            if (!positions.has(id)) return;
            const pos = positions.get(id);
            const mapPaths = location && location.mapPaths ? location.mapPaths : {};

            loadStairIcon();
            const hasIcon = stairIconImg && stairIconImg.complete && stairIconImg.naturalWidth > 0;

            Object.entries(mapPaths).forEach(([direction, targetId]) => {
                if (getLocationFloor(targetId) === getLocationFloor(id)) return;
                const offset = MAP_DIR_OFFSETS[direction];
                if (!offset) return;

                const size = Math.min(pos.w, pos.h) * markerSizeRatio;
                const inset = size * offsetInsetRatio;
                const maxInsetX = pos.w / 2 - inset - size / 2;
                const maxInsetY = pos.h / 2 - inset - size / 2;
                const centerX = pos.x + pos.w / 2 + offset.dx * maxInsetX;
                const centerY = pos.y + pos.h / 2 + offset.dy * maxInsetY;

                const stairWidth = size;
                const stairHeight = size;
                const strokeColor = "#ffffff";
                const lineWidth = Math.max(2, size * 0.16);
                const stepSpan = stairWidth / 3;
                const stepRise = stairHeight / 3;
                const arrowLength = size * 0.74;
                const arrowHead = arrowLength * 0.32;

                ctx.save();
                ctx.translate(centerX, centerY);
                if (direction === "east") ctx.rotate(Math.PI / 2);
                if (direction === "west") ctx.rotate(-Math.PI / 2);
                if (direction === "south") ctx.rotate(Math.PI);
                if (hasIcon) {
                    const iconSize = size * 1.05;
                    ctx.drawImage(stairIconImg, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
                } else {
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = lineWidth;
                    ctx.lineJoin = "round";
                    ctx.lineCap = "round";

                    const startX = -stairWidth / 2;
                    const startY = stairHeight / 2;

                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(startX, startY - stepRise);
                    ctx.lineTo(startX + stepSpan, startY - stepRise);
                    ctx.lineTo(startX + stepSpan, startY - stepRise * 2);
                    ctx.lineTo(startX + stepSpan * 2, startY - stepRise * 2);
                    ctx.lineTo(startX + stepSpan * 2, startY - stepRise * 3);
                    ctx.lineTo(startX + stepSpan * 3, startY - stepRise * 3);
                    ctx.stroke();

                    const angle = -Math.PI / 4;
                    const normalX = Math.cos(angle + Math.PI / 2);
                    const normalY = Math.sin(angle + Math.PI / 2);
                    const arrowOffset = size * 0.42;
                    const arrowBaseAnchorX = startX + stepSpan * 2.1;
                    const arrowBaseAnchorY = startY - stepRise * 3.4;
                    const arrowBaseX = arrowBaseAnchorX + normalX * arrowOffset;
                    const arrowBaseY = arrowBaseAnchorY + normalY * arrowOffset;
                    const arrowTipX = arrowBaseX + arrowLength * Math.cos(angle);
                    const arrowTipY = arrowBaseY + arrowLength * Math.sin(angle);

                    ctx.beginPath();
                    ctx.moveTo(arrowBaseX, arrowBaseY);
                    ctx.lineTo(arrowTipX, arrowTipY);
                    ctx.stroke();

                    const leftHeadX = arrowTipX - arrowHead * Math.cos(angle - Math.PI / 6);
                    const leftHeadY = arrowTipY - arrowHead * Math.sin(angle - Math.PI / 6);
                    const rightHeadX = arrowTipX - arrowHead * Math.cos(angle + Math.PI / 6);
                    const rightHeadY = arrowTipY - arrowHead * Math.sin(angle + Math.PI / 6);

                    ctx.beginPath();
                    ctx.moveTo(arrowTipX, arrowTipY);
                    ctx.lineTo(leftHeadX, leftHeadY);
                    ctx.moveTo(arrowTipX, arrowTipY);
                    ctx.lineTo(rightHeadX, rightHeadY);
                    ctx.stroke();
                }

                ctx.restore();
            });
        });
    }

    function drawMapCanvas(layout, { locationId, reachableIds, floor }) {
        if (!mapCanvasEl) return;

        const { placements, bounds } = layout;
        const ctx = mapCanvasEl.getContext("2d");
        const metrics = getCanvasMetrics(bounds, floor);

        mapCanvasEl.width = metrics.width;
        mapCanvasEl.height = metrics.height;

        ctx.clearRect(0, 0, mapCanvasEl.width, mapCanvasEl.height);
        ctx.fillStyle = "#0b0f19";
        ctx.fillRect(0, 0, mapCanvasEl.width, mapCanvasEl.height);

        const positions = new Map();
        placements.forEach((placement, id) => {
            const x = metrics.padding + (placement.x - bounds.minX) * metrics.unit;
            const y = metrics.padding + (placement.y - bounds.minY) * metrics.unit;
            const w = placement.size.width * metrics.unit;
            const h = placement.size.height * metrics.unit;
            positions.set(id, { x, y, w, h });
        });

        // Liens entre salles
        const drawnLinks = new Set();
        placements.forEach((placement, id) => {
            const location = locations[id];
            const mapPaths = location && location.mapPaths ? location.mapPaths : {};
            const pos = positions.get(id);
            if (!pos) return;

            Object.entries(mapPaths).forEach(([direction, targetId]) => {
                if (!positions.has(targetId)) return;
                if (getLocationFloor(targetId) !== getLocationFloor(id)) return;

                const key = [id, targetId].sort().join(":");
                if (drawnLinks.has(key)) return;
                drawnLinks.add(key);

                const targetPos = positions.get(targetId);
                if (!targetPos) return;

                const from = { x: pos.x + pos.w / 2, y: pos.y + pos.h / 2 };
                const to = { x: targetPos.x + targetPos.w / 2, y: targetPos.y + targetPos.h / 2 };

                ctx.strokeStyle = "rgba(126, 179, 255, 0.35)";
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
            });
        });

        placements.forEach((placement, id) => {
            const pos = positions.get(id);
            if (!pos) return;

            const isCurrent = id === locationId;
            const isReachable = reachableIds.has(id);
            const isVisited = visitedLocations.has(id);

            const fill = isCurrent
                ? "#1f4c7d"
                : isReachable
                    ? "#24552c"
                    : isVisited
                        ? "#1d2336"
                        : "#2b1a1a";
            const stroke = isCurrent ? "#82b5ff" : isReachable ? "#3ad06a" : "#3a2b2b";

            const { x, y, w, h } = pos;
            const radius = Math.min(14, w / 4, h / 4);

            ctx.fillStyle = fill;
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 2.4;

            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
            ctx.lineTo(x + w, y + h - radius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
            ctx.lineTo(x + radius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#e8edf7";
            ctx.font = `${Math.max(12, Math.min(16, w / 6))}px 'Inter', sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const lines = wrapTextToLines(ctx, getLocationLabel(id), w - 10);
            const totalHeight = lines.length * 18;
            let textY = y + h / 2 - totalHeight / 2 + 9;
            lines.forEach(line => {
                ctx.fillText(line, x + w / 2, textY);
                textY += 18;
            });

            if (isCurrent) {
                ctx.fillStyle = "#9cdfa7";
                ctx.font = "12px 'Inter', sans-serif";
                ctx.fillText("Ici", x + w / 2, y + h - 12);
            }
        });

        drawInterFloorMarkers(ctx, positions);
    }

    function renderMap(scene) {
        if (!mapSectionEl || !mapCanvasEl) return;
        const locationId = scene.locationId || scene.id;

        const floor = getLocationFloor(locationId);
        const layout = getCachedMapLayout(locationId, floor);

        if (!layout.placements.size) {
            mapSectionEl.classList.add("hidden");
            return;
        }

        const reachableIds = new Set();
        const currentLocation = locations[locationId];
        const mapPaths = currentLocation && currentLocation.mapPaths ? currentLocation.mapPaths : {};
        Object.entries(mapPaths).forEach(([direction, targetId]) => {
            const targetFloor = getLocationFloor(targetId);
            if (targetFloor === floor) {
                reachableIds.add(targetId);
            }
        });

        drawMapCanvas(layout, { locationId, reachableIds, floor });

        if (mapHeaderEl) {
            mapHeaderEl.textContent = `Carte du lieu — ${formatFloorLabel(floor)}`;
        }

        mapSectionEl.classList.remove("hidden");
    }

    /* --- Gestion des lieux & scènes --- */

    function getLocationState(locationId) {
        if (!locationId || locationId === "none") return null;
        let state = locationsState[locationId];
        if (!state) {
            state = {
                lootNodes: [],
                lootGenerated: false,
                defeatedCombats: new Set(),
                flags: new Set(),
                lootApplied: new Set(),
                statusMessages: {},
                lostThrowables: []
            };
            locationsState[locationId] = state;
        }
        if (!state.defeatedCombats) {
            state.defeatedCombats = new Set();
        }
        if (!state.flags) {
            state.flags = new Set();
        }
        if (!state.lootApplied) {
            state.lootApplied = new Set();
        }
        if (!state.statusMessages) {
            state.statusMessages = {};
        }
        if (!state.lostThrowables) {
            state.lostThrowables = [];
        }
        return state;
    }

    function saveLocationState(locationId) {
        if (!locationId || locationId === "none") return;
        if (!lootEl) return;

        const state = getLocationState(locationId);
        if (!state) return;
        state.lootGenerated = true;

        state.lootNodes = [];

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

    }

    function addLocationFlag(locationId, flag) {
        const state = getLocationState(locationId);
        if (!state || !flag) return;
        state.flags.add(flag);
    }

    function hasLocationFlag(locationId, flag) {
        const state = getLocationState(locationId);
        if (!state || !flag) return false;
        return state.flags.has(flag);
    }

    function addLocationStatus(locationId, key, text) {
        const state = getLocationState(locationId);
        if (!state || !key || !text) return;
        state.statusMessages[key] = text;
    }

    function getLocationStatuses(locationId) {
        const state = getLocationState(locationId);
        if (!state) return [];
        return Object.values(state.statusMessages).filter(Boolean);
    }

    function applyOutcomeLootOnce(locationId, key, templates = []) {
        const state = getLocationState(locationId);
        if (!state || !key || state.lootApplied.has(key) || !lootEl) return;

        let added = false;
        if (!state || !key || state.lootApplied.has(key)) return;
        const fragment = document.createDocumentFragment();
        templates.forEach(templateId => {
            const item = createItemFromTemplate(templateId);
            if (!item) return;
            const node = createItemElement(item);
            appendItemToZone(node, lootEl);
            added = true;
        });

        if (added) {
            fragment.appendChild(node);
        }

        if (fragment.childNodes.length > 0 && lootEl) {
            lootEl.appendChild(fragment);
            state.lootApplied.add(key);
            saveLocationState(locationId);
            updateCapacityUI();
        }
    }

    function handleLocationOutcome(option, success) {
        const locationId = currentLocationId;
        if (!locationId) return;

        if (option.stateFlagOnAttempt) {
            addLocationFlag(locationId, option.stateFlagOnAttempt);
        }
        if (success && option.stateFlagOnSuccess) {
            addLocationFlag(locationId, option.stateFlagOnSuccess);
        }
        if (!success && option.stateFlagOnFail) {
            addLocationFlag(locationId, option.stateFlagOnFail);
        }

        const outcomeDetails = option.outcomeDetails || {};
        const lootKey =
            outcomeDetails.lootKey ||
            option.stateFlagOnAttempt ||
            option.stateFlagOnSuccess ||
            option.lockedByFlag;
        const lootTemplates = success
            ? outcomeDetails.lootOnSuccess
            : outcomeDetails.lootOnFail;
        if (Array.isArray(lootTemplates) && lootTemplates.length > 0) {
            applyOutcomeLootOnce(locationId, lootKey || `${currentSceneId}:${option.text}:loot`, lootTemplates);
        }

        if (success && outcomeDetails.statusOnSuccess) {
            addLocationStatus(locationId, `${option.text}-success`, outcomeDetails.statusOnSuccess);
        }
        if (!success && outcomeDetails.statusOnFail) {
            addLocationStatus(locationId, `${option.text}-fail`, outcomeDetails.statusOnFail);
        }
    }

    function updateOptionButtonState(btn, option, index, scene, locationState, inventoryCounts) {
        if (!btn || !option) return;

        const counts = inventoryCounts || getInventoryTemplateCounts();
        const missingRequiredItem = option.requiredItem && !hasItemInInventory(option.requiredItem, counts);
        const requirementLabel = option.requiredItem
            ? ITEM_TEMPLATES[option.requiredItem]?.name || option.requiredItem
            : null;
        const isCombatOption = option.diceTest && option.diceTest.type === "combat";
        const combatOptionId = isCombatOption
            ? `${scene?.id || currentSceneId}:${index}`
            : null;
        const alreadyDefeated =
            isCombatOption &&
            locationState?.defeatedCombats &&
            locationState.defeatedCombats.has(combatOptionId);
        const lockedByFlag = option.lockedByFlag && locationState?.flags?.has(option.lockedByFlag);

        const labels = [];
        if (missingRequiredItem && requirementLabel) {
            labels.push(`besoin : ${requirementLabel}`);
        }
        if (alreadyDefeated) {
            labels.push("ennemi vaincu");
        }
        if (lockedByFlag) {
            labels.push(option.lockedLabel || "déjà effectué");
        }

        btn.textContent = labels.length > 0
            ? `${option.text} (${labels.join(" ; ")})`
            : option.text;

        const shouldDisable = missingRequiredItem || alreadyDefeated || lockedByFlag;
        btn.disabled = shouldDisable;
        btn.setAttribute("aria-disabled", String(shouldDisable));
    }

    function refreshCurrentSceneOptionButtons() {
        if (!choicesEl || combatState.active) return;
        const scene = scenes[currentSceneId];
        const locationState = getLocationState(currentLocationId);
        if (!scene || !locationState || !Array.isArray(scene.options)) return;

        const inventoryCounts = getInventoryTemplateCounts();
        choicesEl.querySelectorAll(".choice-btn").forEach(btn => {
            const optionIndex = parseInt(btn.dataset.optionIndex || "-1", 10);
            if (!Number.isInteger(optionIndex) || optionIndex < 0) return;
            const option = scene.options[optionIndex];
            if (!option) return;
            updateOptionButtonState(btn, option, optionIndex, scene, locationState, inventoryCounts);
        });
    }

    function renderScene(sceneId) {
        const scene = scenes[sceneId];
        if (!scene) {
            console.error("Scène inconnue", sceneId);
            return;
        }

        combatState = { active: false };
        document.body.classList.remove("combat-active");
        updateGroundPanelVisibility();
        if (choiceTitleEl) {
            choiceTitleEl.textContent = "Que fais-tu ?";
        }

        const oldLocation = currentLocationId;
        if (oldLocation && oldLocation !== "none") {
            saveLocationState(oldLocation);
        }

        currentSceneId = sceneId;
        currentLocationId = scene.locationId || sceneId;
        currentTimeContext = scene.timeContext || "fast";
        visitedLocations.add(currentLocationId);

        if (storyTitleEl) storyTitleEl.textContent = scene.title;
        if (storyTextEl) {
            const statusTexts = getLocationStatuses(currentLocationId);
            const suffix = statusTexts.length > 0 ? ` ${statusTexts.join(" ")}` : "";
            storyTextEl.textContent = `${scene.text}${suffix}`;
        }

        updateGameClockUI();

        renderMap(scene);

        const state = getLocationState(currentLocationId);
        if (!state) return;

        if (choicesEl) {
            choicesEl.innerHTML = "";
            const inventoryCounts = getInventoryTemplateCounts();
            scene.options.forEach((option, index) => {
                const btn = document.createElement("button");
                btn.classList.add("choice-btn");
                btn.dataset.optionIndex = `${index}`;
                btn.dataset.sceneId = scene.id;
                updateOptionButtonState(btn, option, index, scene, state, inventoryCounts);
                btn.addEventListener("click", () => handleOption(option, index));
                choicesEl.appendChild(btn);
            });
        }

        if (!lootEl) return;

        lootEl.innerHTML = "";

        if (!state.lootGenerated) {
            spawnLootForScene(scene);
            state.lootGenerated = true;
        } else {
            state.lootNodes.forEach(node => appendItemToZone(node, lootEl));
        }

        updateCapacityUI();
        refreshWoundsIfRelevant();
        refreshLostThrowableActions();
    }

    function handleOption(option, optionIndex = 0) {
        if (combatState.active) {
            logMessage("Tu es déjà en plein combat, concentre-toi !");
            return;
        }
        if (isActionInProgress()) {
            showToast("Une action est en cours, patiente quelques secondes.", "info");
            return;
        }
        if (option.restart) {
            restartGame();
            return;
        }

        if (option.effect) {
            applyEffect(option.effect);
            if (hero.hp <= 0) {
                handleHeroDefeat("Tu succombes aux conséquences de ton choix.");
                return;
            }
        }

        const scene = scenes[currentSceneId];
        const locationState = getLocationState(currentLocationId);
        const isCombatOption = option.diceTest && option.diceTest.type === "combat";
        const combatOptionId = isCombatOption
            ? `${currentSceneId}:${optionIndex}`
            : null;

        if (option.lockedByFlag && locationState?.flags?.has(option.lockedByFlag)) {
            showToast("Cette action a déjà été tentée ici.", "info");
            return;
        }

        if (
            isCombatOption &&
            locationState &&
            locationState.defeatedCombats &&
            locationState.defeatedCombats.has(combatOptionId)
        ) {
            showToast("L'ennemi de ce lieu est déjà neutralisé.", "info");
            return;
        }
        if (option.requiredItem && !hasItemInInventory(option.requiredItem)) {
            const requirementLabel =
                ITEM_TEMPLATES[option.requiredItem]?.name || option.requiredItem;
            showToast(`Il te manque ${requirementLabel} pour faire cela.`, "warning");
            return;
        }
        if (option.diceTest) {
            if (option.diceTest.type === "combat") {
                startCombat(option, optionIndex);
                return;
            }
            resolveDiceOption(option);
            return;
        }

        if (option.nextScene) {
            const targetScene = scenes[option.nextScene];
            const destinationLabel = targetScene?.title || option.text || "nouveau lieu";
            startBlockingAction(`Déplacement vers « ${destinationLabel} »`, MOVE_DURATION_MS, {
                spinnerInChoices: true,
                hideInventory: true
            }).then(() => {
                renderScene(option.nextScene);
            });
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
        showToast(
            success ? "Jet réussi" : "Jet raté",
            success ? "success" : "warning"
        );

        if (success && option.successEffect) {
            applyEffect(option.successEffect);
        }
        if (!success && option.failEffect) {
            applyEffect(option.failEffect);
        }

        if (option.outcomeDetails || option.stateFlagOnAttempt || option.stateFlagOnSuccess) {
            handleLocationOutcome(option, success);
        }

        if (hero.hp <= 0) {
            handleHeroDefeat("Tu succombes après ce jet.");
            return;
        }

        if (option.outcomeModal) {
            const modal = option.outcomeModal;
            const description = success
                ? modal.successDescription || modal.description || "Action réussie."
                : modal.failDescription || modal.description || "Action échouée.";
            const effectText = success
                ? modal.successEffect || "L'effet positif s'applique."
                : modal.failEffect || "Tu subis les conséquences.";
            showOutcomeModal(modal.title || option.text, description, effectText);
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
        if (!lootEl) return;

        lootEl.innerHTML = "";

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
            appendItemToZone(el, lootEl);
            generatedLootCount += 1;
        });

        for (let i = 0; i < randomLootCount; i += 1) {
            const rarity = pickRarityFromChances(rarityChances);
            const templateId = pickRandomTemplateByRarity(randomLootPool, rarity);
            if (!templateId) continue;

            const item = createItemFromTemplate(templateId);
            if (!item) continue;
            const el = createItemElement(item);
            appendItemToZone(el, lootEl);
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
