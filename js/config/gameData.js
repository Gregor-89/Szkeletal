// ==============
// GAMEDATA.JS (v0.91-SCALE - Powiększenie pocisków gracza)
// Lokalizacja: /js/config/gameData.js
// ==============

// Ten plik centralizuje wszystkie "magiczne liczby" gry,
// aby ułatwić balansowanie i "fine-tuning".

// --- Konfiguracja Gracza ---
export const PLAYER_CONFIG = {
  // Bazowa prędkość poruszania się gracza w pikselach na sekundę.
  BASE_SPEED: 432,
  // Rozmiar (promień) kolizji gracza.
  SIZE: 15,
  // Początkowa i maksymalna ilość zdrowia.
  INITIAL_HEALTH: 100,
  // Początkowy zasięg (promień) przyciągania XP i pickupów.
  INITIAL_PICKUP_RANGE: 24,
  // Wartość leczenia z pickupa "Serce".
  HEAL_AMOUNT: 30
};

// --- Konfiguracja Kolizji ---
export const COLLISION_CONFIG = {
  // Procentowe spowolnienie nałożone na gracza podczas kolizji z Oblężnikiem (0.75 = -75% prędkości)
  WALL_COLLISION_SLOWDOWN: 0.75,
  // Czas trwania spowolnienia Oblężnika (żeby utrzymać się w smoleniu)
  WALL_SLOWDOWN_DURATION: 0.35
};

// --- Konfiguracja Gry i Spawnowania ---
export const GAME_CONFIG = {
  // Czas (w sekundach) bez spawnów na początku gry.
  SPAWN_GRACE_PERIOD: 4.0,

  // ZBALANSOWANIE v0.81f: Dalsze zmniejszenie (z 0.01 na 0.008)
  INITIAL_SPAWN_RATE: 0.008,
  
  // ZMIANA V0.86F: Zwiększenie twardego limitu wrogów
  MAX_ENEMIES: 400, 
  // ZBALANSOWANIE v0.83s: Zwiększenie interwału spawnu Elity (z 72s na 144s)
  ELITE_SPAWN_INTERVAL: 144000,
  
  // Dynamiczny limit wrogów
  INITIAL_MAX_ENEMIES: 3,
  // ZMIANA V0.86F: Zwiększenie tempa wzrostu limitu
  ENEMY_LIMIT_GROWTH_PER_MINUTE: 20, 
  
  // XP
  INITIAL_XP_NEEDED: 5,
  XP_GROWTH_FACTOR: 1.4,
  XP_GROWTH_ADD: 2,
};

// --- Konfiguracja Wydarzenia Oblężenia (Siege Event) ---
export const SIEGE_EVENT_CONFIG = {
  // Czas (w sekundach), co jaki ma miejsce Wydarzenie Oblężenia.
  SIEGE_EVENT_INTERVAL: 45.0,
  // Czas gry (w sekundach), po którym Event może się zacząć.
  SIEGE_EVENT_START_TIME: 150, // 2:30 min
  
  // Czas (w sekundach) ostrzeżenia przed spawnem wrogów.
  SIEGE_WARNING_TIME: 3.0,
  
  // ZMIANA v0.91Y-Final: Promień pierścienia (zwiększony dla dużych wrogów)
  SIEGE_EVENT_RADIUS: 900, 
  // ZMIANA v0.91Z-Final: Zmniejszono liczbę wrogów
  SIEGE_EVENT_COUNT: 40, 
};

// --- Konfiguracja Autodestrukcji Oblężnika (Wall) ---
export const WALL_DETONATION_CONFIG = {
  // Czas (w sekundach), po jakim Oblężnik zacznie przygotowywać się do detonacji
  WALL_DECAY_TIME: 33.75, 
  // Czas (w sekundach), przez jaki Oblężnik miga przed detonacją
  WALL_DETONATION_WARNING_TIME: 3.0,
  // Maksymalna losowa różnica czasu detonacji między jednostkami
  WALL_DETONATION_TIME_VARIANCE: 6.0,
  // ZMIANA v0.91Y-Final: Promień wybuchu
  WALL_DETONATION_RADIUS: 400, 
  // ZMIANA v0.91Y: Obrażenia
  WALL_DETONATION_DAMAGE: 15 
};

// --- Konfiguracja Zagrożeń (Hazards) ---
export const HAZARD_CONFIG = {
  // Czas (w sekundach) pomiędzy kolejnymi spawnami.
  SPAWN_INTERVAL: 6.0,
  // Dystans i limity
  MIN_DIST_FROM_PLAYER: 150,
  MAX_HAZARDS: 200,
  SIZE: 60,
  // Czas życia
  HAZARD_LIFE: 45.0,
  HAZARD_WARNING_TIME: 3.0,
  // Obrażenia i spowolnienie
  DAMAGE_PER_SECOND: 25, 
  SLOWDOWN_MULTIPLIER: 0.5,
  HAZARD_ENEMY_SLOWDOWN_MULTIPLIER: 0.7, 
  HAZARD_ENEMY_DAMAGE_PER_SECOND: 0.4, 
  
  // --- Mega Hazard ---
  MEGA_HAZARD_PROBABILITY: 0.20, 
  MEGA_HAZARD_BASE_MULTIPLIER: 4.0, 
  MEGA_HAZARD_MAX_MULTIPLIER: 8.0, 
  MEGA_HAZARD_PLAYER_DAMAGE_MULTIPLIER: 0.6, 
  MEGA_HAZARD_ENEMY_DAMAGE_MULTIPLIER: 1.0, 
  
  // --- Zanikanie Bagna ---
  HAZARD_PICKUP_DECAY_RATE: 0.067,
  HAZARD_CHEST_DECAY_RATE: 0.067,
};

// --- Konfiguracja Broni ---
export const WEAPON_CONFIG = {
  AUTOGUN: {
    BASE_SPEED: 864,
    BASE_DAMAGE: 1,
    BASE_FIRE_RATE: 650,
    BASE_SIZE: 3,
    // Grafika
    SPRITE: 'projectile_venom',
    // ZMIANA v0.91-SCALE: Zwiększono skalę z 2.0 na 4.0
    SPRITE_SCALE: 4.0
  },
  NOVA: {
    // Grafika
    SPRITE: 'projectile_nova',
    // ZMIANA v0.91-SCALE: Zwiększono skalę z 2.0 na 4.0
    SPRITE_SCALE: 4.0
  },
  RANGED_ENEMY_BULLET: {
    SPEED: 432, 
    DAMAGE: 10, 
    SIZE: 12, 
    SPRITE_WIDTH: 22, 
    SPRITE_HEIGHT: 64,
    // Konfiguracja Śladu
    TRAIL_COLOR: '#29b6f6', 
    TRAIL_LIFE: 0.1, 
    TRAIL_SPEED: 80, 
    TRAIL_INTERVAL: 0.05 
  }
};

// --- Konfiguracja Pickupów ---
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
  MAGNET_DURATION: 2.0, 
  SHIELD_DURATION: 8.0,
  SPEED_DURATION: 8.0,
  FREEZE_DURATION: 5.0,
  BOMB_RADIUS: 200 
};

// --- Czas Życia Gemów ---
export const GEM_CONFIG = {
  BASE_LIFE: 35.0,
  FADE_TIME: 5.0
};

// --- Konfiguracja Ulepszeń (Perków) ---
export const PERK_CONFIG = {
  firerate: {
    value: 0.80,
    max: 6
  },
  damage: {
    value: 1, 
    max: 6
  },
  multishot: {
    value: 1, 
    max: 4
  },
  pierce: {
    value: 1, 
    max: 4
  },
  autogun: {
    max: 1
  },
  orbital: {
    max: 5,
    calculateDamage: (level) => (1 + Math.floor(level / 2)),
    calculateRadius: (level) => ((50 + 6 * level) * 2.25), 
    calculateSpeed: (level) => (1.2 + 0.2 * level)
  },
  nova: {
    max: 5,
    calculateCooldown: (level) => (Math.max(0.6, 2.2 - 0.3 * level)),
    calculateCount: (level) => (Math.min(24, 8 + 2 * level))
  },
  speed: {
    value: 1.10, 
    max: 4
  },
  pickup: {
    value: 1.40, 
    max: 3
  },
  health: {
    value: 20, 
    max: 3
  },
  
  // BROŃ BAZOWA v0.81b
  whip: {
    max: 5,
    HITBOX_RADIUS: 20,
    calculateCooldown: (level) => (Math.max(1.0, 3.0 - 0.4 * level)),
    calculateDamage: (level) => (1 + Math.floor(level / 2)),
    calculateDrawScale: (level) => (80 + 25 * (level - 1)),
    calculateCount: (level) => {
        const counts = [0, 1, 2, 3, 4, 4]; 
        return counts[level] || 4;
    }
  },
  
  // NOWA BROŃ v0.82a
  chainLightning: {
    max: 6,
    VISUAL_DURATION: 0.25, 
    calculateCooldown: (level) => [0, 2.5, 2.3, 2.1, 1.9, 1.7, 1.6][level] || 1.6,
    calculateDamage: (level) => [0, 1, 2, 2, 3, 3, 4][level] || 4,
    calculateTargets: (level) => [0, 1, 2, 3, 4, 5, 6][level] || 6,
  }
};

// --- Konfiguracja UI ---
export const UI_CONFIG = {
  RESUME_TIMER: 0.75,
  LEVEL_UP_PAUSE: 700,
  LOW_HEALTH_THRESHOLD: 0.25
};

// --- Konfiguracja Świata Gry ---
export const WORLD_CONFIG = {
  SIZE: 8
};

// --- Konfiguracja Efektów Wizualnych (VFX) ---
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

// --- Konfiguracja Przeciwników ---
export const ENEMY_STATS = {
  standard: { 
      type: 'standard', 
      hp: 3, 
      speed: 173, 
      size: 52, 
      damage: 5, 
      color: '#FFC107', 
      score: 10, 
      xp: 1, 
      drops: BASE_DROP_RATES 
  },
  horde: { 
      type: 'horde', 
      hp: 3, 
      speed: 144, 
      size: 39, 
      damage: 5, 
      color: '#8BC34A', 
      score: 10, 
      xp: 1, 
      drops: BASE_DROP_RATES 
  },
  aggressive: { 
      type: 'aggressive', 
      hp: 3, 
      speed: 173, 
      size: 52, 
      damage: 5, 
      color: '#2196F3', 
      score: 10, 
      xp: 1, 
      drops: BASE_DROP_RATES 
  },
  kamikaze: { 
      type: 'kamikaze', 
      hp: 2.4, 
      speed: 158, 
      size: 36, 
      damage: 8, 
      color: '#FFEB3B', 
      score: 10, 
      xp: 1, 
      drops: BASE_DROP_RATES 
  },
  splitter: { 
      type: 'splitter', 
      hp: 4, 
      speed: 158, 
      size: 52, 
      damage: 5, 
      color: '#EC407A', 
      score: 10, 
      xp: 1, 
      drops: BASE_DROP_RATES 
  },
  tank: { 
      type: 'tank', 
      hp: 27, 
      speed: 101, 
      size: 108, 
      damage: 5, 
      color: '#795548', 
      score: 20, 
      xp: 1, 
      drops: BASE_DROP_RATES 
  },
  ranged: { 
    type: 'ranged', 
    hp: 4, 
    speed: 120, 
    size: 52, 
    damage: 5, 
    color: '#00BCD4', 
    score: 15, 
    xp: 1, 
    drops: BASE_DROP_RATES,
    
    attackRange: 300, 
    attackCooldown: 1.8, 
    projectileSpeed: WEAPON_CONFIG.RANGED_ENEMY_BULLET.SPEED, 
    projectileDamage: WEAPON_CONFIG.RANGED_ENEMY_BULLET.DAMAGE, 
  },
  elite: { 
      type: 'elite', 
      hp: 48, 
      speed: 130, 
      size: 120, 
      damage: 5, 
      color: '#9C27B0', 
      score: 80, 
      xp: 1, 
      drops: {} 
  },
  wall: { 
      type: 'wall', 
      hp: 17, 
      speed: 20, 
      size: 88, 
      damage: 15, 
      color: '#607D8B', 
      score: 25, 
      xp: 0, 
      drops: {} 
  }
};