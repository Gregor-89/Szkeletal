// ==============
// GAMEDATA.JS (v0.97b - Sizes & Scales)
// Lokalizacja: /js/config/gameData.js
// ==============

export const PLAYER_CONFIG = {
  BASE_SPEED: 432,
  SIZE: 15,
  INITIAL_HEALTH: 100,
  INITIAL_PICKUP_RANGE: 24,
  HEAL_AMOUNT: 30
};

export const COLLISION_CONFIG = {
  WALL_COLLISION_SLOWDOWN: 0.75,
  WALL_SLOWDOWN_DURATION: 0.35
};

export const GAME_CONFIG = {
  SPAWN_GRACE_PERIOD: 4.0,
  INITIAL_SPAWN_RATE: 0.008,
  MAX_ENEMIES: 400,
  ELITE_SPAWN_INTERVAL: 144,
  INITIAL_MAX_ENEMIES: 3,
  ENEMY_LIMIT_GROWTH_PER_MINUTE: 20,
  INITIAL_XP_NEEDED: 5,
  XP_GROWTH_FACTOR: 1.4,
  XP_GROWTH_ADD: 2,
};

// KONFIGURACJA MAPY v0.97b
export const MAP_CONFIG = {
  TREES_COUNT: 250,
  ROCKS_COUNT: 150,
  HUTS_COUNT: 30,
  WATER_COUNT: 50,
  
  SAFE_ZONE_RADIUS: 500,
  
  // Definicje obiektów ze skalowaniem
  OBSTACLE_STATS: {
    tree: {
      type: 'tree',
      variants: 3,
      size: 96,
      minScale: 2.0, // Od 2x
      maxScale: 3.0, // Do 3x
      hitboxScale: 0.2, // Bardzo mały hitbox (tylko pień) przy tak dużej koronie
      hp: Infinity,
      isSolid: true
    },
    rock: {
      type: 'rock',
      variants: 3,
      size: 64,
      minScale: 0.5, // Od 0.5x
      maxScale: 4.0, // Do 4x
      hitboxScale: 0.8,
      hp: Infinity,
      isSolid: true
    },
    hut: {
      type: 'hut',
      variants: 4,
      size: 160,
      minScale: 4.0, // Sztywne 4x
      maxScale: 4.0,
      hitboxScale: 0.8,
      hp: 400, // Więcej HP bo są ogromne
      isSolid: true,
      dropChance: 1.0
    },
    water: {
      type: 'water',
      variants: 3,
      size: 140,
      minScale: 1.0, // Od 1x
      maxScale: 3.0, // Do 3x
      hitboxScale: 0.8, // Trochę mniejszy obszar spowolnienia niż grafika
      hp: Infinity,
      isSolid: false,
      isSlow: true,
      slowFactor: 0.5
    }
  }
};

export const SIEGE_EVENT_CONFIG = {
  SIEGE_EVENT_INTERVAL: 45.0,
  SIEGE_EVENT_START_TIME: 150,
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
  AUTOGUN: {
    BASE_SPEED: 864,
    BASE_DAMAGE: 1,
    BASE_FIRE_RATE: 650,
    BASE_SIZE: 3,
    SPRITE: 'projectile_venom',
    SPRITE_SCALE: 4.0
  },
  NOVA: {
    SPRITE: 'projectile_nova',
    SPRITE_SCALE: 4.0
  },
  RANGED_ENEMY_BULLET: {
    SPEED: 432,
    DAMAGE: 10,
    SIZE: 12,
    SPRITE_WIDTH: 22,
    SPRITE_HEIGHT: 64,
    TRAIL_COLOR: '#29b6f6',
    TRAIL_LIFE: 0.1,
    TRAIL_SPEED: 80,
    TRAIL_INTERVAL: 0.05
  }
};

const BASE_DROP_RATES = {
  heal: 0.02,
  magnet: 0.012,
  speed: 0.01,
  shield: 0.007,
  bomb: 0.005,
  freeze: 0.005
};

export const PICKUP_CONFIG = {
  BASE_LIFE: 14,
  MAGNET_DURATION: 3.0,
  SHIELD_DURATION: 8.0,
  SPEED_DURATION: 8.0,
  FREEZE_DURATION: 5.0,
  BOMB_RADIUS: 200
};

export const GEM_CONFIG = {
  BASE_LIFE: 35.0,
  FADE_TIME: 5.0
};

export const PERK_CONFIG = {
  firerate: { value: 0.80, max: 6 },
  damage: { value: 1, max: 6 },
  multishot: { value: 1, max: 4 },
  pierce: { value: 1, max: 4 },
  autogun: { max: 1 },
  orbital: {
    max: 5,
    calculateDamage: (level) => (1 + Math.floor(level / 2)),
    calculateRadius: (level) => ((50 + 6 * level) * 2.25),
    calculateSpeed: (level) => (1.2 + 0.2 * level)
  },
  nova: {
    max: 6,
    calculateDamage: (level) => 4 + (level * 3),
    calculateCooldown: (level) => Math.max(0.5, 2.3 - (level * 0.3)),
    calculateCount: (level) => 8 + (level * 2),
    calculatePierce: (level) => 1 + Math.floor(level / 3)
  },
  speed: { value: 1.10, max: 4 },
  pickup: { value: 1.40, max: 3 },
  health: { value: 20, max: 3 },
  whip: {
    max: 5,
    HITBOX_RADIUS: 30,
    calculateCooldown: (level) => (Math.max(1.0, 3.0 - 0.4 * level)),
    calculateDamage: (level) => (1 + Math.floor(level / 2)),
    calculateDrawScale: (level) => (100 + 25 * (level - 1)),
    calculateCount: (level) => {
      const counts = [0, 1, 2, 3, 4, 4];
      return counts[level] || 4;
    }
  },
  chainLightning: {
    max: 6,
    VISUAL_DURATION: 0.25,
    calculateCooldown: (level) => [0, 2.5, 2.3, 2.1, 1.9, 1.7, 1.6][level] || 1.6,
    calculateDamage: (level) => [0, 1, 2, 2, 3, 3, 4][level] || 4,
    calculateTargets: (level) => [0, 1, 2, 3, 4, 5, 6][level] || 6,
  }
};

export const UI_CONFIG = {
  RESUME_TIMER: 0.75,
  LEVEL_UP_PAUSE: 700,
  LOW_HEALTH_THRESHOLD: 0.25
};

export const WORLD_CONFIG = {
  SIZE: 16
};

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
  standard: { type: 'standard', hp: 3, speed: 173, size: 60, damage: 5, color: '#D32F2F', score: 10, xp: 1, drops: BASE_DROP_RATES },
  horde: { type: 'horde', hp: 3, speed: 144, size: 43, damage: 5, color: '#2E7D32', score: 10, xp: 1, drops: BASE_DROP_RATES },
  aggressive: { type: 'aggressive', hp: 3, speed: 173, size: 52, damage: 5, color: '#E91E63', score: 10, xp: 1, drops: BASE_DROP_RATES },
  kamikaze: { type: 'kamikaze', hp: 2.4, speed: 158, size: 36, damage: 8, color: '#76FF03', score: 10, xp: 1, drops: BASE_DROP_RATES },
  splitter: { type: 'splitter', hp: 4, speed: 158, size: 52, damage: 5, color: '#B71C1C', score: 10, xp: 1, drops: BASE_DROP_RATES },
  tank: { type: 'tank', hp: 27, speed: 101, size: 108, damage: 5, color: '#F5F5F5', score: 20, xp: 1, drops: BASE_DROP_RATES },
  ranged: { type: 'ranged', hp: 4, speed: 120, size: 54, damage: 5, color: '#795548', score: 15, xp: 1, drops: BASE_DROP_RATES, attackRange: 300, attackCooldown: 1.8, projectileSpeed: WEAPON_CONFIG.RANGED_ENEMY_BULLET.SPEED, projectileDamage: WEAPON_CONFIG.RANGED_ENEMY_BULLET.DAMAGE },
  elite: { type: 'elite', hp: 48, speed: 130, size: 120, damage: 5, color: '#9C27B0', score: 80, xp: 1, drops: {} },
  wall: { type: 'wall', hp: 20, speed: 8, size: 88, damage: 15, color: '#9E9E9E', score: 25, xp: 0, drops: {} }
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
  VOLUME: 0.4,
  FADE_TIME: 1.0
};