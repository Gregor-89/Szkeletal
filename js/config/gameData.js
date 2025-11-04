// ==============
// GAMEDATA.JS (v0.65 - Pełna centralizacja danych)
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

// --- Konfiguracja Gry i Spawnowania ---
export const GAME_CONFIG = {
  // Bazowa szansa na spawn wroga w każdej klatce.
  INITIAL_SPAWN_RATE: 0.02,
  // Maksymalna liczba wrogów dozwolona jednocześnie na mapie.
  MAX_ENEMIES: 110,
  // Czas (w milisekundach), co jaki pojawia się Elita.
  ELITE_SPAWN_INTERVAL: 24000,
  // Ilość XP potrzebna do zdobycia pierwszego poziomu.
  INITIAL_XP_NEEDED: 5,
  // Mnożnik, o jaki rośnie wymagane XP na kolejny poziom (np. 1.4 = +40%).
  XP_GROWTH_FACTOR: 1.4,
  // Stała wartość dodawana do wymaganego XP na kolejny poziom.
  XP_GROWTH_ADD: 2,
};

// --- Konfiguracja Broni ---
export const WEAPON_CONFIG = {
  AUTOGUN: {
    // Prędkość pocisków AutoGuna w pikselach na sekundę.
    BASE_SPEED: 864,
    // Bazowe obrażenia każdego pocisku.
    BASE_DAMAGE: 1,
    // Czas (w milisekundach) między wystrzałami. Mniej = szybciej.
    BASE_FIRE_RATE: 500,
    // Rozmiar (promień) pocisków.
    BASE_SIZE: 3,
  },
  RANGED_ENEMY_BULLET: {
    // Prędkość pocisków wystrzeliwanych przez Wrogów Dystansowych.
    SPEED: 504
  }
};

// --- Konfiguracja Pickupów ---
// Szanse na wypadnięcie bonusu po pokonaniu wroga.
const BASE_DROP_RATES = {
  heal: 0.02, // Było: 0.04
  magnet: 0.012, // Było: 0.025
  speed: 0.01, // Było: 0.02
  shield: 0.007, // Było: 0.015
  bomb: 0.005, // Było: 0.01
  freeze: 0.005 // Było: 0.01
};

export const PICKUP_CONFIG = {
  // Czas życia bonusu na ziemi (w sekundach), zanim zniknie.
  BASE_LIFE: 14,
  // --- Czas trwania efektów (w sekundach) ---
  MAGNET_DURATION: 1.5, // Zmienione z 1.0 na 1.5
  SHIELD_DURATION: 8.0,
  SPEED_DURATION: 8.0,
  FREEZE_DURATION: 5.0,
  // --- Konfiguracja Bomby ---
  BOMB_RADIUS: 200 // Promień (w pikselach) wybuchu bomby
};

// --- Konfiguracja Ulepszeń (Perków) ---
export const PERK_CONFIG = {
  // Każdy obiekt definiuje WARTOŚĆ ulepszenia i MAKSYMALNY poziom
  firerate: {
    value: 0.85, // Mnożnik czasu odnowienia (0.85 = +15% prędkości)
    max: 5
  },
  damage: {
    value: 1, // +1 obrażeń
    max: 6
  },
  multishot: {
    value: 1, // +1 pocisk
    max: 4
  },
  pierce: {
    value: 1, // +1 przebicia
    max: 4
  },
  orbital: {
    max: 5,
    // Skalowanie Orbitala (logika w OrbitalWeapon.js):
    // Obrażenia = 1 + floor(poziom / 2)
    DAMAGE_BASE: 1,
    DAMAGE_LEVEL_DIVISOR: 2,
    // Promień = (28 + 6 * poziom) * 1.5
    RADIUS_BASE: 28,
    RADIUS_PER_LEVEL: 6,
    RADIUS_MULTIPLIER: 1.5,
    // Prędkość = 1.2 + 0.2 * poziom
    SPEED_BASE: 1.2,
    SPEED_PER_LEVEL: 0.2
  },
  nova: {
    max: 5,
    // Skalowanie Novy (logika w NovaWeapon.js):
    // Cooldown = max(0.6, 2.2 - 0.3 * poziom)
    COOLDOWN_BASE: 2.2,
    COOLDOWN_REDUCTION_PER_LEVEL: 0.3,
    COOLDOWN_MIN: 0.6,
    // Liczba = min(24, 8 + 2 * poziom)
    COUNT_BASE: 8,
    COUNT_PER_LEVEL: 2,
    COUNT_MAX: 24
  },
  speed: {
    value: 1.10, // Mnożnik prędkości (+10%)
    max: 4
  },
  pickup: {
    value: 1.40, // Mnożnik zasięgu (+40%)
    max: 3
  },
  health: {
    value: 20, // +20 HP
    max: 3
  }
};

// --- Konfiguracja UI ---
export const UI_CONFIG = {
  // Czas (w sekundach) odliczania przy wznawianiu gry.
  RESUME_TIMER: 0.75,
  // Czas (w milisekundach) pauzy na ekran level-up (przed pokazaniem perków).
  LEVEL_UP_PAUSE: 700
};

// --- Konfiguracja Efektów Wizualnych (VFX) ---
export const EFFECTS_CONFIG = {
  // Wskaźnik wybuchu bomby
  BOMB_INDICATOR_LIFE: 0.375, // Czas trwania animacji (w sekundach)
  
  // Konfetti (poziom wyżej / skrzynia)
  CONFETTI_COUNT: 80, // Ilość cząsteczek
  CONFETTI_LIFE: 0.7, // Czas życia (w sekundach)
  CONFETTI_SPEED_MIN: 180, // Min. prędkość początkowa (px/s)
  CONFETTI_SPEED_MAX: 420, // Max. prędkość początkowa (px/s)
  CONFETTI_INITIAL_UP_VELOCITY: -210, // Siła wystrzału w górę (px/s)
  CONFETTI_GRAVITY: 360, // Grawitacja (px/s^2)
  CONFETTI_FRICTION: 1.0, // Tarcie (1.0 = 100% zaniku na sekundę)
  CONFETTI_ROTATION_SPEED: 12, // Maks. prędkość obrotu (radiany/s)
  
  // Wybuch bomby (cząsteczki)
  NUKE_PARTICLE_COUNT: 40,
  NUKE_PARTICLE_SPEED: 300, // (px/s)
  NUKE_PARTICLE_LIFE: 0.6 // (w sekundach)
};

// --- Konfiguracja Przeciwników ---
// Definicje statystyk dla każdego typu przeciwnika.
export const ENEMY_STATS = {
  // Prędkości są w pikselach na sekundę.
  standard: { type: 'standard', hp: 3, speed: 173, size: 10, damage: 5, color: '#FFC107', score: 10, xp: 1, drops: BASE_DROP_RATES },
  horde: { type: 'horde', hp: 3, speed: 144, size: 8, damage: 5, color: '#8BC34A', score: 10, xp: 1, drops: BASE_DROP_RATES },
  aggressive: { type: 'aggressive', hp: 3, speed: 173, size: 10, damage: 5, color: '#2196F3', score: 10, xp: 1, drops: BASE_DROP_RATES },
  kamikaze: { type: 'kamikaze', hp: 2.4, speed: 158, size: 9, damage: 8, color: '#FFEB3B', score: 10, xp: 1, drops: BASE_DROP_RATES },
  splitter: { type: 'splitter', hp: 4, speed: 158, size: 12, damage: 5, color: '#EC407A', score: 10, xp: 1, drops: BASE_DROP_RATES },
  tank: { type: 'tank', hp: 9, speed: 101, size: 14, damage: 5, color: '#795548', score: 20, xp: 1, drops: BASE_DROP_RATES },
  ranged: { type: 'ranged', hp: 4, speed: 144, size: 10, damage: 5, color: '#00BCD4', score: 10, xp: 1, drops: BASE_DROP_RATES },
  elite: { type: 'elite', hp: 24, speed: 130, size: 18, damage: 5, color: '#9C27B0', score: 80, xp: 7, drops: {} } // Elita nie dropi bonusów, tylko skrzynię
};