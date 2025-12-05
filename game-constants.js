export const GAME_CONSTANTS = {
    CACHE_BUSTER: "0.9.33",
    BASE_CAPACITY: 15,
    MAX_HUNGER: 50,
    MAX_THIRST: 50,
    BODY_PARTS: ["bras", "jambe", "torse", "tête", "main"],
    WOUND_TYPES: ["morsure", "entaille", "griffure", "impact", "perforation"],
    MUSIC_SOURCES: {
        calm: [
            "assets/music/calm/empty-city.mp3",
            "assets/music/calm/on-the-road.mp3",
            "assets/music/calm/suspense-248067.mp3"
        ],
        actions: [
            "assets/music/actions/action-cinematic-music-414074.mp3",
            "assets/music/actions/dark-cinematic-action-music-412728.mp3",
            "assets/music/actions/tense-action-music-414683.mp3"
        ],
        sad: ["assets/music/sad/suspence-calm.mp3"],
        epic: ["assets/music/epic/action-440170.mp3"]
    },
    MUSIC_VOLUMES: {
        calm: 0.45,
        actions: 0.8,
        sad: 0.6,
        epic: 0.7
    },
    SOUND_EFFECTS: {
        GLOBAL_VOLUME: 1,
        lightDamage: "assets/Sound/light-damage.m4a",
        hightDamage: "assets/Sound/hight-damage.m4a"
    },
    DEFAULT_RARITY_CHANCES: {
        1: 0.75,
        2: 0.2,
        3: 0.05
    },
    RARITY_LABELS: {
        1: "Très peu rare",
        2: "Peu rare",
        3: "Rare"
    },
    RARITY_NAMES_TO_LEVEL: {
        common: 1,
        "peu courant": 2,
        uncommon: 2,
        rare: 3
    },
    REAL_SECONDS_PER_GAME_HOUR: 210,
    ACTION_TIME_ACCELERATION: 6,
    TIME_COST_STEP_HOURS: 0.25,
    MOVE_DURATION_MS: 3000,
    DEFAULT_USE_DURATION_MS: 4000,
    DEFAULT_CRAFT_DURATION_MS: 4000,
    ATTACK_COOLDOWN_MS: 2000,
    ENEMY_ATTACK_COOLDOWN_MS: 3000,
    LOOT_PICKUP_DURATION_MS: 500,
    BLEED_DAMAGE_INTERVAL_MINUTES: 15,
    HUNGER_DAMAGE_INTERVAL_MINUTES: 30,
    DEFAULT_START_HOUR: 8,
    XP_INITIAL_THRESHOLD: 15,
    XP_THRESHOLD_GROWTH: 1.35,
    heroDefaults: {
        name: "Alex",
        hp: 30,
        maxHp: 30,
        force: 2,
        finesse: 2,
        audace: 2,
        hunger: 0,
        thirst: 0,
        experience: 0,
        nextStatThreshold: 15
    }
};
