// ==============
// GAMEDATA.JS (v1.30 - Speed Balance & Shop Config)
// Lokalizacja: /js/config/gameData.js
// ==============

export const PLAYER_CONFIG = {
  BASE_SPEED: 175, // ZMNIEJSZONO Z 240 dla balansu (poprzednie wersje miały ok. 160-180)
  SIZE: 15,
  INITIAL_HEALTH: 120,
  INITIAL_PICKUP_RANGE: 30,
  HEAL_AMOUNT: 20 
};

export const COLLISION_CONFIG = {
  WALL_COLLISION_SLOWDOWN: 0.75,
  WALL_SLOWDOWN_DURATION: 0.35
};

export const SPAWN_TIMINGS = {
    STANDARD: 0,
    HORDE: 40,
    AGGRESSIVE: 90,
    KAMIKAZE: 140,
    SPLITTER: 190,
    TANK: 260,
    SNAKEEATER: 290,
    RANGED: 310
};

export const GAME_CONFIG = {
  SPAWN_GRACE_PERIOD: 4.0,
  INITIAL_SPAWN_RATE: 0.006, 
  MAX_ENEMIES: 400,
  ELITE_SPAWN_INTERVAL: 144, 
  INITIAL_MAX_ENEMIES: 3,
  ENEMY_LIMIT_GROWTH_PER_MINUTE: 15, 
  
  INITIAL_XP_NEEDED: 4,   
  XP_GROWTH_ADD: 6,
  XP_GROWTH_EARLY: 1.4, 
  XP_GROWTH_LATE: 1.25,
  XP_THRESHOLD_LEVEL: 6 
};

// KONFIGURACJA SKLEPU
export const SHOP_CONFIG = {
    BASE_COST: 4000,
    COST_MULTIPLIER: 1.5,
    UPGRADES: {
        autogun: { id: 'autogun', dependsOn: null, icon: 'img/icons/autogun.png' },
        firerate: { id: 'firerate', dependsOn: 'autogun', icon: 'img/icons/firerate.png' },
        damage: { id: 'damage', dependsOn: 'autogun', icon: 'img/icons/damage.png' },
        multishot: { id: 'multishot', dependsOn: 'autogun', icon: 'img/icons/multishot.png' },
        pierce: { id: 'pierce', dependsOn: 'autogun', icon: 'img/icons/pierce.png' },
        orbital: { id: 'orbital', dependsOn: null, icon: 'img/icons/orbital.jpg' },
        nova: { id: 'nova', dependsOn: null, icon: 'img/icons/nova.png' },
        chainLightning: { id: 'chainLightning', dependsOn: null, icon: 'img/icons/lightning.png' },
        speed: { id: 'speed', dependsOn: null, icon: 'img/icons/speed.png' },
        health: { id: 'health', dependsOn: null, icon: 'img/icons/health.png' },
        pickup: { id: 'pickup', dependsOn: null, icon: 'img/icons/magnet.png' }
    }
};

export const ZOOM_CONFIG = {
  MIN: 0.6,
  MAX: 1.3,
  DEFAULT: 1.0
};

export const HUNGER_CONFIG = {
  MAX_HUNGER: 100,
  DECAY_RATE: 5.0, 
  STARVATION_DAMAGE: 1, 
  STARVATION_TICK: 1.0, 
  VIGNETTE_COLOR_START: 'rgba(255, 0, 0, 0.0)',
  VIGNETTE_COLOR_END: 'rgba(180, 0, 0, 0.35)', 
  PULSE_SPEED: 4.0, 
  
  TEXT_OFFSET_WARNING: -40, 
  TEXT_OFFSET_QUOTE: -65,

  QUOTES: [
    "Ziemniaczki jeść muszę, bo się uduszę!",
    "Gdy głód doskwiera, to mi sytość odbiera!",
    "Gdy nie zjem mych pyszności, to braknie mi sytości!",
    "Dajcie mnie ziemniaki, bo mam w kiszkach braki!",
    "Kiszki marsza grają, gdzieś tu się ziemniaczki czają!"
  ]
};

export const MAP_CONFIG = {
  TREES_COUNT: 450,
  ROCKS_COUNT: 250,
  HUTS_COUNT: 45,
  WATER_COUNT: 60,
  SHRINE_COUNT: 10, 
  SAFE_ZONE_RADIUS: 600, 
  
  OBSTACLE_STATS: {
    tree: { 
        type: 'tree', variants: 6, size: 96, minScale: 2.5, maxScale: 5.0, 
        hitboxScale: 0.15, spriteOffset: -0.4, hasShadow: true, shadowScale: 0.80, 
        shadowOffsetY: 8, hp: Infinity, isSolid: true, canRotate: false 
    },
    rock: { 
        type: 'rock', variants: 6, size: 64, minScale: 1.0, maxScale: 3.5, 
        hitboxScale: 0.8, spriteOffset: 0, hasShadow: true, shadowScale: 1.5, 
        shadowOffsetY: 25, hp: Infinity, isSolid: true, canRotate: true 
    },
    hut: { 
        type: 'hut', variants: 7, size: 110, minScale: 3.5, maxScale: 3.5, 
        hitboxScale: 0.7, spriteOffset: -0.25, hasShadow: true, shadowScale: 1.4, 
        shadowOffsetY: 12, hp: 1200, isSolid: true, dropChance: 0.4, canRotate: false 
    },
    water: { 
        type: 'water', variants: 6, size: 140, minScale: 0.7, maxScale: 2.2, 
        hitboxScale: 0.9, spriteOffset: 0, hasShadow: false, shadowScale: 0, 
        shadowOffsetY: 0, hp: Infinity, isSolid: false, isSlow: true, slowFactor: 0.5, canRotate: true 
    },
    shrine: { 
        type: 'shrine', variants: 1, size: 180, minScale: 1.4, maxScale: 1.4, 
        hitboxScale: 0.6, spriteOffset: -0.3, hasShadow: true, shadowScale: 1.0, 
        shadowOffsetY: 20, hp: Infinity, isSolid: true, canRotate: false, 
        cooldown: 120, healAmount: 999, text: "Rzyć umyta, sytość zdobyta", textOffset: -85 
    }
  }
};

export const SIEGE_EVENT_CONFIG = {
  SIEGE_EVENT_INTERVAL: 45.0,
  SIEGE_EVENT_START_TIME: 180,
  SIEGE_WARNING_TIME: 5.0,
  SIEGE_EVENT_RADIUS: 900,
  SIEGE_EVENT_COUNT: 40,
};

export const WALL_DETONATION_CONFIG = {
  WALL_DECAY_TIME: 60.5,
  WALL_DETONATION_WARNING_TIME: 6.0,
  WALL_DETONATION_TIME_VARIANCE: 12.0,
  WALL_DETONATION_RADIUS: 300,
  WALL_DETONATION_DAMAGE: 15
};

export const HAZARD_CONFIG = {
  SPAWN_INTERVAL: 12.0,
  MIN_DIST_FROM_PLAYER: 150,
  MAX_HAZARDS: 200,
  SIZE: 60,
  HAZARD_LIFE: 45.0,
  HAZARD_WARNING_TIME: 3.0,
  DAMAGE_PER_SECOND: 25,
  SLOWDOWN_MULTIPLIER: 0.5,
  HAZARD_ENEMY_SLOWDOWN_MULTIPLIER: 0.3,
  HAZARD_ENEMY_DAMAGE_PER_SECOND: 0.4,
  MEGA_HAZARD_PROBABILITY: 0.20,
  MEGA_HAZARD_BASE_MULTIPLIER: 4.0,
  MEGA_HAZARD_MAX_MULTIPLIER: 8.0,
  MEGA_HAZARD_PLAYER_DAMAGE_MULTIPLIER: 0.6,
  MEGA_HAZARD_ENEMY_DAMAGE_MULTIPLIER: 1.0,
  HAZARD_PICKUP_DECAY_RATE: 0.067,
  HAZARD_CHEST_DECAY_RATE: 0.067,
};

export const WEAPON_CONFIG = {
  AUTOGUN: { BASE_SPEED: 800, BASE_DAMAGE: 5, BASE_FIRE_RATE: 900, BASE_SIZE: 3, SPRITE: 'projectile_venom', SPRITE_SCALE: 4.0 },
  NOVA: { SPRITE: 'projectile_nova', SPRITE_SCALE: 4.0 },
  RANGED_ENEMY_BULLET: { SPEED: 400, DAMAGE: 10, SIZE: 12, SPRITE_WIDTH: 22, SPRITE_HEIGHT: 64, TRAIL_COLOR: '#29b6f6', TRAIL_LIFE: 0.1, TRAIL_SPEED: 80, TRAIL_INTERVAL: 0.05 },
  LUMBERJACK_AXE: { SPEED: 550, DAMAGE: 25, SIZE: 48, SPRITE_WIDTH: 40, SPRITE_HEIGHT: 86, TRAIL_INTERVAL: 0.015, TRAIL_SIZE: 20, TRAIL_OFFSET: 40, TRAIL_OPACITY: 0.40, ROTATION_SPEED: 8, IMPACT_PARTICLE_COUNT: 60 }
};

const BASE_DROP_RATES = { heal: 0.02, magnet: 0.012, speed: 0.01, shield: 0.007, bomb: 0.005, freeze: 0.005 };

export const PICKUP_CONFIG = { 
    BASE_LIFE: 14, 
    MAGNET_DURATION: 3.0, 
    SHIELD_DURATION: 8.0, 
    SPEED_DURATION: 8.0, 
    FREEZE_DURATION: 5.0, 
    BOMB_RADIUS: 400 
};

export const GEM_CONFIG = { BASE_LIFE: 35.0, FADE_TIME: 5.0 };

export const PERK_CONFIG = {
  firerate: { value: 0.80, max: 6 },
  damage: { max: 6 }, 
  multishot: { value: 1, max: 4 },
  pierce: { value: 1, max: 4 },
  autogun: { max: 1 },
  orbital: { max: 5, calculateDamage: (level) => (3 + level * 2), calculateRadius: (level) => ((50 + 6 * level) * 2.25), calculateSpeed: (level) => (1.2 + 0.2 * level) },
  nova: { max: 6, calculateDamage: (level) => (15 + level * 4), calculateCooldown: (level) => Math.max(0.5, 3.0 - (level * 0.4)), calculateCount: (level) => 2 + level, calculatePierce: (level) => 1 + Math.floor(level / 3) },
  speed: { value: 1.10, max: 4 },
  pickup: { value: 1.40, max: 3 }, 
  health: { value: 20, max: 3 }, 
  whip: { max: 5, HITBOX_RADIUS: 30, calculateCooldown: (level) => (Math.max(1.0, 3.0 - 0.4 * level)), calculateDamage: (level) => (10 + (level - 1) * 2.5), calculateDrawScale: (level) => (100 + 25 * (level - 1)), calculateCount: (level) => { const counts = [0, 1, 2, 3, 4, 4]; return counts[level] || 4; } },
  chainLightning: { max: 6, VISUAL_DURATION: 0.25, calculateCooldown: (level) => [0, 2.5, 2.3, 2.1, 1.9, 1.7, 1.6][level] || 1.6, calculateDamage: (level) => (10 + level * 3), calculateTargets: (level) => [0, 1, 2, 3, 4, 5, 6][level] || 6, }
};

export const UI_CONFIG = { RESUME_TIMER: 0.75, LEVEL_UP_PAUSE: 700, LOW_HEALTH_THRESHOLD: 0.25 };

export const WORLD_CONFIG = { SIZE: 24 };

export const EFFECTS_CONFIG = { 
    BOMB_INDICATOR_LIFE: 0.375, 
    CONFETTI_COUNT: 80, 
    CONFETTI_LIFE: 1.67, 
    CONFETTI_SPEED_MIN: 180, 
    CONFETTI_SPEED_MAX: 420, 
    CONFETTI_INITIAL_UP_VELOCITY: -210, 
    CONFETTI_GRAVITY: 6, 
    CONFETTI_FRICTION: 1.0, 
    CONFETTI_ROTATION_SPEED: 12, 
    NUKE_PARTICLE_COUNT: 40, 
    NUKE_PARTICLE_SPEED: 300, 
    NUKE_PARTICLE_LIFE: 0.6 
};

export const ENEMY_STATS = {
  standard: { type: 'standard', hp: 7, speed: 105, size: 60, damage: 10, color: '#D32F2F', score: 10, xp: 1, drops: BASE_DROP_RATES },
  horde: { type: 'horde', hp: 8, speed: 95, size: 43, damage: 8, color: '#2E7D32', score: 10, xp: 1, drops: BASE_DROP_RATES },
  aggressive: { 
      type: 'aggressive', 
      hp: 12, 
      speed: 94, 
      size: 52, 
      damage: 10, 
      color: '#E91E63', 
      score: 10, 
      xp: 1, 
      drops: BASE_DROP_RATES,
      chargeBonus: 1.6 
  },
  kamikaze: { type: 'kamikaze', hp: 5, speed: 150, size: 36, damage: 25, color: '#76FF03', score: 10, xp: 1, drops: BASE_DROP_RATES },
  splitter: { type: 'splitter', hp: 12, speed: 140, size: 52, damage: 10, color: '#B71C1C', score: 10, xp: 1, drops: BASE_DROP_RATES },
  tank: { type: 'tank', hp: 100, speed: 70, size: 108, damage: 15, color: '#F5F5F5', score: 20, xp: 1, drops: BASE_DROP_RATES },
  ranged: { type: 'ranged', hp: 12, speed: 110, size: 54, damage: 10, color: '#795548', score: 15, xp: 1, drops: BASE_DROP_RATES, attackRange: 300, attackCooldown: 1.8, projectileSpeed: WEAPON_CONFIG.RANGED_ENEMY_BULLET.SPEED, projectileDamage: WEAPON_CONFIG.RANGED_ENEMY_BULLET.DAMAGE },
  
  elite: { type: 'elite', hp: 200, speed: 115, size: 120, damage: 15, color: '#9C27B0', score: 80, xp: 1, drops: {} }, 
  wall: { type: 'wall', hp: 160, speed: 8, size: 88, damage: 20, color: '#9E9E9E', score: 25, xp: 0, drops: {} },
  lumberjack: { 
    type: 'lumberjack', 
    hp: 240, 
    speed: 120, 
    size: 90, 
    damage: 20, 
    color: '#8D6E63', 
    score: 100, 
    xp: 2, 
    drops: {}, 
    attackRange: 350, 
    attackCooldown: 2.2,
    shadowOffset: 0.15 
  },
  snakeEater: { 
    type: 'snakeEater', 
    hp: 200, 
    speed: 30, 
    size: 120, 
    damage: 0, 
    color: '#4CAF50', 
    score: 150, 
    xp: 3, 
    drops: {}, 
    healAmount: 999, 
    healCooldown: 60.0, 
    hasShadow: false,
    shadowOffsetY: 50,      
    healthBarOffsetY: -125,   
    quoteOffsetY: -100,
    hitTextOffsetY: 0
  }
};

export const MUSIC_CONFIG = {
  MENU_PLAYLIST: [
    'music_1.mp3',
    'music_2.mp3',
    'music_3.mp3'
  ],
  GAMEPLAY_PLAYLIST: [
    'music_1.mp3',
    'music_2.mp3',
    'music_3.mp3',
    'music_4.mp3',
    'music_5.mp3',
    'music_6.mp3'
  ],
  INTRO_PLAYLIST: [
    'intro_1.mp3',
    'intro_2.mp3'
  ],
  VOLUME: 0.4,
  FADE_TIME: 1.0
};

export const SKINS_CONFIG = [
  { id: 'default', name: 'Drakul (Standard)', assetIdle: 'player_static', assetSprite: 'player_spritesheet', locked: false },
  { id: 'hot', name: 'Drakul (Hot)', assetIdle: 'player_hot_idle', assetSprite: 'player_hot_spritesheet', locked: true }
];