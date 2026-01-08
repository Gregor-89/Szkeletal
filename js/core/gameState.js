// ==============
// GAMESTATE.JS (v1.0.1 - Fixed Imports & Full Settings)
// Lokalizacja: /js/core/gameState.js
// ==============

import { PLAYER_CONFIG, GAME_CONFIG, HUNGER_CONFIG, SIEGE_EVENT_CONFIG } from '../config/gameData.js';

// System integralności (Anty-cheat)
export const SALT = 7492; 
export const encrypt = (val) => Math.floor((val * 17 + SALT) ^ 0xDEADBEEF); 

const _gState = {
    score: 0,
    health: PLAYER_CONFIG.INITIAL_HEALTH,
    _sShadow: encrypt(0), 
    _hShadow: encrypt(PLAYER_CONFIG.INITIAL_HEALTH), 
    _cheater: false 
};

/**
 * Główny obiekt stanu gry: stan instancji.
 */
export const game = {
    level: 1, 
    maxHealth: PLAYER_CONFIG.INITIAL_HEALTH, 
    time: 0, 
    running: false, 
    paused: true, 
    inMenu: true,
    xp: 0, 
    xpNeeded: GAME_CONFIG.INITIAL_XP_NEEDED, 
    pickupRange: PLAYER_CONFIG.INITIAL_PICKUP_RANGE, 
    magnet: false, 
    magnetT: 0, 
    shakeT: 0, 
    shakeMag: 0, 
    hyper: false,
    shield: false, 
    shieldT: 0, 
    speedT: 0, 
    freezeT: 0, 
    screenShakeDisabled: false, 
    manualPause: false,
    collisionSlowdown: 0,
    triggerChestOpen: false,
    playerHitFlashT: 0, 
    newEnemyWarningT: 0, 
    newEnemyWarningType: null, 
    seenEnemyTypes: [], 
    dynamicEnemyLimit: GAME_CONFIG.INITIAL_MAX_ENEMIES, 
    introSeen: false,
    isDying: false,
    totalKills: 0,
    hunger: HUNGER_CONFIG.MAX_HUNGER,
    maxHunger: HUNGER_CONFIG.MAX_HUNGER,
    starvationTimer: 0,
    quoteTimer: 0,
    zoomLevel: 1.0 
};

// Logika Get/Set dla score i health z walidacją cienia (Integrity Check)
Object.defineProperty(game, 'score', {
    get: () => _gState.score,
    set: (val) => {
        if (encrypt(_gState.score) !== _gState._sShadow) {
            _gState._cheater = true;
            console.warn("Integrity Check Fail!");
        }
        _gState.score = val;
        _gState._sShadow = encrypt(val);
    },
    enumerable: true
});

Object.defineProperty(game, 'health', {
    get: () => _gState.health,
    set: (val) => {
        if (encrypt(_gState.health) !== _gState._hShadow) {
            _gState._cheater = true;
            console.warn("Integrity Check Fail!");
        }
        _gState.health = val;
        _gState._hShadow = encrypt(val);
    },
    enumerable: true
});

Object.defineProperty(game, 'isCheated', {
    get: () => _gState._cheater,
    set: (val) => { if(val === true) _gState._cheater = true; },
    enumerable: true
});

game._getShadows = () => ({ s: _gState._sShadow, h: _gState._hShadow, c: _gState._cheater });
game._setShadows = (s, h, c) => {
    _gState._sShadow = s; _gState._hShadow = h; _gState._cheater = c;
};

/**
 * Ustawienia sesji spawnowania i zdarzeń.
 */
export const settings = { 
    spawn: GAME_CONFIG.INITIAL_SPAWN_RATE,
    maxEnemies: GAME_CONFIG.MAX_ENEMIES,
    eliteInterval: GAME_CONFIG.ELITE_SPAWN_INTERVAL,
    lastFire: 0, 
    lastElite: 0,
    lastHazardSpawn: 0, 
    lastSiegeEvent: 0,
    currentSiegeInterval: SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME,
    siegeState: 'idle'
};

// Referencja do aktualnego stanu dla całego silnika
export const gameStateRef = {
    game,
    settings,
    perkLevels: {},
    player: null,
    camera: null,
    enemies: [],
    chests: [],
    pickups: [],
    hazards: [],
    stars: [],
    bombIndicators: [],
    obstacles: [],
    bullets: [],
    eBullets: [],
    gems: [],
    particles: [],
    hitTexts: [],
    bulletsPool: null,
    eBulletsPool: null,
    gemsPool: null,
    particlePool: null,
    hitTextPool: null,
    trails: [],
    confettis: [],
    enemyIdCounter: 0,
    siegeSpawnQueue: []
};