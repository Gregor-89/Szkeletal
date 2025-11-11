// ==============
// GAMEDATA.JS (v0.82b - FIX: Balans i naprawa Pioruna)
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

// NOWA WŁAŚCIWOŚĆ v0.75: Konfiguracja Kolizji
export const COLLISION_CONFIG = {
  // Procentowe spowolnienie nałożone na gracza podczas kolizji z Oblężnikiem (0.75 = -75% prędkości)
  WALL_COLLISION_SLOWDOWN: 0.75,
  // Czas trwania spowolnienia Oblężnika (żeby utrzymać się w smoleniu)
  WALL_SLOWDOWN_DURATION: 0.35
};

// --- Konfiguracja Gry i Spawnowania ---
export const GAME_CONFIG = {
  // NOWE v0.81d: Czas (w sekundach) bez spawnów na początku gry.
  SPAWN_GRACE_PERIOD: 4.0,

  // ZBALANSOWANIE v0.81f: Dalsze zmniejszenie (z 0.01 na 0.008)
  INITIAL_SPAWN_RATE: 0.008,
  
  // ZBALANSOWANIE v0.76: Zwiększenie limitu wrogów (110 -> 300)
  // Maksymalna liczba wrogów dozwolona jednocześnie na mapie (TWARDY LIMIT).
  MAX_ENEMIES: 300,
  // Czas (w milisekundach) co jaki pojawia się Elita.
  ELITE_SPAWN_INTERVAL: 24000,
  
  // NOWE v0.78: Dynamiczny limit wrogów
  // ZBALANSOWANIE v0.81f: Dalsze zmniejszenie (5 -> 3)
  INITIAL_MAX_ENEMIES: 3,
  // ZBALANSOWANIE v0.81f: Dalsze spowolnienie (35 -> 18)
  ENEMY_LIMIT_GROWTH_PER_MINUTE: 18,
  
  // Ilość XP potrzebna do zdobycia pierwszego poziomu.
  INITIAL_XP_NEEDED: 5,
  // Mnożnik, o jaki rośnie wymagane XP na kolejny poziom (np. 1.4 = +40%).
  XP_GROWTH_FACTOR: 1.4,
  // Stała wartość dodawana do wymaganego XP na kolejny poziom.
  XP_GROWTH_ADD: 2,
};

// --- Konfiguracja Wydarzenia Oblężenia (Siege Event) ---
export const SIEGE_EVENT_CONFIG = {
  // Czas (w sekundach), co jaki ma miejsce Wydarzenie Oblężenia.
  SIEGE_EVENT_INTERVAL: 45.0,
  // Czas gry (w sekundach), po którym Event może się zacząć.
  SIEGE_EVENT_START_TIME: 150, // 2:30 min
  
  // NOWA WŁAŚCIWOŚĆ: Czas (w sekundach) ostrzeżenia przed spawnem wrogów.
  SIEGE_WARNING_TIME: 3.0,
  
  // Promień (w pikselach) od gracza, na jakim spawnuje się pierścień.
  SIEGE_EVENT_RADIUS: 500,
  // ZBALANSOWANIE v0.76: Zwiększenie liczby wrogów (68 -> 85)
  // Liczba wrogów 'wall' w pierścieniu.
  SIEGE_EVENT_COUNT: 85,
};

// --- Konfiguracja Autodestrukcji Oblężnika (Wall) ---
export const WALL_DETONATION_CONFIG = {
  // ZBALANSOWANIE v0.76: Wydłużenie czasu życia (15.0 -> 22.5 -> 33.75)
  // Czas (w sekundach), po jakim Oblężnik zacznie przygotowywać się do detonacji
  WALL_DECAY_TIME: 33.75, // Zmieniono z 22.5 na 33.75 (+50%)
  // Czas (w sekundach), przez jaki Oblężnik miga przed detonacją
  WALL_DETONATION_WARNING_TIME: 3.0,
  // Maksymalna losowa różnica czasu detonacji między jednostkami (np. od 0 do 6s)
  WALL_DETONATION_TIME_VARIANCE: 6.0, // (Bez zmian v0.75)
  // ZBALANSOWANIE v0.76: Zwiększenie promienia wybuchu (100 -> 200)
  // Promień (w pikselach) efektu AreaNuke po detonacji
  WALL_DETONATION_RADIUS: 200,
  // POPRAWKA v0.77u: Dodano brakującą wartość obrażeń
  WALL_DETONATION_DAMAGE: 5
};


// --- Konfiguracja Zagrożeń (Hazards) ---
export const HAZARD_CONFIG = {
  // Czas (w sekundach) pomiędzy kolejnymi spawnami Pól Zagrożenia (Hazards).
  SPAWN_INTERVAL: 6.0,
  // ZBALANSOWANIE v0.77t: Zwiększenie dystansu (z 50 na 150)
  MIN_DIST_FROM_PLAYER: 150,
  // ZBALANSOWANIE v0.77t: Zwiększenie limitu (z 20 na 200)
  MAX_HAZARDS: 200,
  // ZBALANSOWANIE v0.77t: Zwiększenie rozmiaru (z 40 na 60)
  SIZE: 60,
  // Czas życia Hazardu, zanim samoczynnie zniknie (Decay)
  HAZARD_LIFE: 45.0,
  // Czas (w sekundach) ostrzeżenia przed aktywacją Hazardu (Warning)
  HAZARD_WARNING_TIME: 3.0,
  // Obrażenia zadawane przez Hazard (Damage over Time) w sekundach.
  DAMAGE_PER_SECOND: 25, // (Gracz)
  // Mnożnik spowolnienia nałożonego na gracza (0.5 = -50% prędkości).
  SLOWDOWN_MULTIPLIER: 0.5,
  // Mnożnik spowolnienia nałożonego na WROGÓW
  HAZARD_ENEMY_SLOWDOWN_MULTIPLIER: 0.7, // -30% prędkości
  // Obrażenia zadawane WROGOM przez Hazard (Damage over Time) w sekundach.
  HAZARD_ENEMY_DAMAGE_PER_SECOND: 0.4, // (Osłabienie obrażeń dla wrogów)
  
  // --- Mega Hazard ---
  MEGA_HAZARD_PROBABILITY: 0.20, // Rzadszy Mega Hazard
  // ZBALANSOWANIE v0.77t: Zwiększenie mnożników (z 2.5/6.0 na 4.0/8.0)
  MEGA_HAZARD_BASE_MULTIPLIER: 4.0, // Min. mnożnik rozmiaru
  MEGA_HAZARD_MAX_MULTIPLIER: 8.0, // Max. mnożnik rozmiaru
  // NOWE MULTIPLERY DLA OSOBNEJ KONTROLI OBRAŻEŃ
  MEGA_HAZARD_PLAYER_DAMAGE_MULTIPLIER: 0.6, // Niewiele większe od zwykłego
  MEGA_HAZARD_ENEMY_DAMAGE_MULTIPLIER: 1.0, // Obrażenia wroga x1 (czyli takie same jak Standard)
  
  // --- Zanikanie Bagna ---
  // Małe dropy (XP, Pickupy): Zanik 100% w 15 sekund. Współczynnik: 1 / 15 = 0.067
  HAZARD_PICKUP_DECAY_RATE: 0.067,
  // Duże dropy (Skrzynie): Zanik 100% w 15 sekund. Ujednolicono z Pickupami.
  HAZARD_CHEST_DECAY_RATE: 0.067,
};

// --- Konfiguracja Broni ---
export const WEAPON_CONFIG = {
  AUTOGUN: {
    // Prędkość pocisków AutoGuna w pikselach na sekundę.
    BASE_SPEED: 864,
    // Bazowe obrażenia każdego pocisku.
    BASE_DAMAGE: 1,
    // Czas (w milisekundach) między wystrzałami. Mniej = szybciej.
    // ZBALANSOWANIE v0.81e: Wolniejszy start (500 -> 650)
    BASE_FIRE_RATE: 650,
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
  // ZBALANSOWANIE v0.76: Wydłużenie czasu Magnesu (1.5s -> 2.0s)
  MAGNET_DURATION: 2.0, // Zmienione z 1.5 na 2.0
  SHIELD_DURATION: 8.0,
  SPEED_DURATION: 8.0,
  FREEZE_DURATION: 5.0,
  // --- Konfiguracja Bomby ---
  BOMB_RADIUS: 200 // Promień (w pikselach) wybuchu bomby
};

// --- NOWA KONFIGURACJA (v0.76): Czas Życia Gemów ---
export const GEM_CONFIG = {
  // Czas (w sekundach), po jakim Gem XP zniknie
  BASE_LIFE: 35.0,
  // Czas (w sekundach) migotania przed zniknięciem
  FADE_TIME: 5.0
};

// --- Konfiguracja Ulepszeń (Perków) ---
export const PERK_CONFIG = {
  // Każdy obiekt definiuje WARTOŚĆ ulepszenia i MAKSYMALNY poziom
  firerate: {
    // ZBALANSOWANIE v0.81e: Mocniejszy bonus (0.85 -> 0.80)
    value: 0.80,
    // ZBALANSOWANIE v0.81e: Więcej poziomów (5 -> 6)
    max: 6
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
  // NOWY PERK v0.81b
  autogun: {
    max: 1
  },
  orbital: {
    max: 5,
    // POPRAWKA v0.73: Logika przeniesiona z OrbitalWeapon.js
    /** Damage = 1 + floor(level / 2) */
    calculateDamage: (level) => (1 + Math.floor(level / 2)),
    /** Radius = (28 + 6 * level) * 1.5 */
    calculateRadius: (level) => ((28 + 6 * level) * 1.5),
    /** Speed (rad/s) = 1.2 + 0.2 * level */
    calculateSpeed: (level) => (1.2 + 0.2 * level)
  },
  nova: {
    max: 5,
    // POPRAWKA v0.73: Logika przeniesiona z NovaWeapon.js
    /** Cooldown = max(0.6, 2.2 - 0.3 * level) */
    calculateCooldown: (level) => (Math.max(0.6, 2.2 - 0.3 * level)),
    /** Count = min(24, 8 + 2 * level) */
    calculateCount: (level) => (Math.min(24, 8 + 2 * level))
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
  },
  
  // BROŃ BAZOWA v0.81b
  whip: {
    max: 5,
    // NOWE v0.81g: Promień hitboxa (kolizji)
    HITBOX_RADIUS: 20,
    /** Cooldown (s) = max(1.0, 3.0 - 0.4 * level) */
    calculateCooldown: (level) => (Math.max(1.0, 3.0 - 0.4 * level)),
    /** Damage = 1 + floor(level / 2) */
    calculateDamage: (level) => (1 + Math.floor(level / 2)),
    /** POPRAWKA v0.81g: Zmiana nazwy na 'DrawScale' (to jest rozmiar wizualny) */
    calculateDrawScale: (level) => (60 + 20 * (level - 1)),
    
    // POPRAWKA v0.80a: Logika Asymetryczna
    /** Count (liczba cięć) = Lvl 1: 1, Lvl 2: 2, Lvl 3: 3, Lvl 4+: 4 */
    calculateCount: (level) => {
        const counts = [0, 1, 2, 3, 4, 4]; // [0] = placeholder
        return counts[level] || 4;
    }
  },
  
  // NOWA BROŃ v0.82a
  chainLightning: {
    // POPRAWKA v0.82b: Zwiększono max poziom do 6
    max: 6,
    VISUAL_DURATION: 0.25, // Czas (s) przez jaki piorun jest widoczny
    // POPRAWKA v0.82b: Dodano Lvl 6 i zmieniono Lvl 1
    // Wartości [0] to placeholder
    calculateCooldown: (level) => [0, 2.5, 2.3, 2.1, 1.9, 1.7, 1.6][level] || 1.6,
    calculateDamage: (level) => [0, 1, 2, 2, 3, 3, 4][level] || 4,
    calculateTargets: (level) => [0, 1, 2, 3, 4, 5, 6][level] || 6,
  }
};

// --- Konfiguracja UI ---
export const UI_CONFIG = {
  // Czas (w sekundach) odliczania przy wznawianiu gry.
  RESUME_TIMER: 0.75,
  // Czas (w milisekundach) pauzy na ekran level-up (przed pokazaniem perków).
  LEVEL_UP_PAUSE: 700,
  // POPRAWKA v0.77m: Dodano brakującą stałą.
  // Procent (0.0 - 1.0), poniżej którego HP aktywuje pulsowanie.
  LOW_HEALTH_THRESHOLD: 0.25
};

// --- Konfiguracja Świata Gry ---
export const WORLD_CONFIG = {
  // ZBALANSOWANIE v0.76: Zwiększenie rozmiaru świata (2 -> 8)
  // Rozmiar świata (np. 8 oznacza świat 8x8 ekranów)
  SIZE: 8
};

// --- Konfiguracja Efektów Wizualnych (VFX) ---
export const EFFECTS_CONFIG = {
  // Wskaźnik wybuchu bomby
  BOMB_INDICATOR_LIFE: 0.375, // Czas trwania animacji (w sekundach)
  
  // Konfetti (poziom wyżej / skrzynia)
  // POPRAWKA V0.67: Parametry starszej wersji (przeliczone na sekundy)
  CONFETTI_COUNT: 80, // Ilość cząsteczek
  CONFETTI_LIFE: 1.67, // Czas życia (100 klatek / 60 FPS)
  CONFETTI_SPEED_MIN: 180, // Min. prędkość początkowa (3 px/klatkę * 60)
  CONFETTI_SPEED_MAX: 420, // Max. prędkość początkowa (7 px/klatkę * 60)
  CONFETTI_INITIAL_UP_VELOCITY: -210, // Siła wystrzału w górę (-3.5 px/klatkę * 60)
  CONFETTI_GRAVITY: 6, // Grawitacja (0.1 px/klatkę * 60)
  CONFETTI_FRICTION: 1.0, // Tarcie (1.0 = 100% zaniku na sekundę)
  CONFETTI_ROTATION_SPEED: 12, // Maks. prędkość obrotu (radiany/s)
  
  // Wybuchu bomby (cząsteczki)
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
  // POPRAWKA v0.77w: Zmieniono XP Elity z 7 na 1
  elite: { type: 'elite', hp: 24, speed: 130, size: 18, damage: 5, color: '#9C27B0', score: 80, xp: 1, drops: {} }, // Elita nie dropi bonusów, tylko skrzynię
  // ZBALANSOWANIE v0.76: Dalsze zmniejszenie prędkości Oblężnika (26 -> 20)
  wall: { type: 'wall', hp: 24, speed: 20, size: 16, damage: 8, color: '#607D8B', score: 25, xp: 0, drops: {} } // Zmieniono speed: 26 -> 20, HP (pozostaje 24)
};

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.82b] js/config/gameData.js: Zaktualizowano balans Pioruna (6 poziomów, Lvl 1 = 1 cel).');