// ==============
// DEV.JS (v0.74 - Konsolidacja PICKUP_CLASS_MAP)
// Lokalizacja: /js/services/dev.js
// ==============

import { findFreeSpotForPickup } from '../core/utils.js';
import { perkPool } from '../config/perks.js';
import { PLAYER_CONFIG, GAME_CONFIG, WEAPON_CONFIG } from '../config/gameData.js';

// POPRAWKA v0.71: Import 3 podklas broni z nowego folderu
import { AutoGun } from '../config/weapons/autoGun.js';
import { OrbitalWeapon } from '../config/weapons/orbitalWeapon.js';
import { NovaWeapon } from '../config/weapons/novaWeapon.js';

// POPRAWKA v0.74: USUNIĘTO 6 INDYWIDUALNYCH IMPORTÓW PICKUPÓW
// import { HealPickup } from '../entities/pickups/healPickup.js';
// ...

// POPRAWKA v0.74: Import mapy z managera efektów
import { PICKUP_CLASS_MAP } from '../managers/effects.js';

/**
 * Eksportowane ustawienia deweloperskie.
 */
export const devSettings = {
    godMode: false,
    allowedEnemies: ['all'],
    allowedPickups: ['all'],
    presetLoaded: false
};

// POPRAWKA v0.74: USUNIĘTO LOKALNĄ MAPĘ DLA KLAS PICKUPÓW
// const PICKUP_CLASS_MAP = {
//     heal: HealPickup,
//     magnet: MagnetPickup,
//     shield: ShieldPickup,
//     speed: SpeedPickup,
//     bomb: BombPickup,
//     freeze: FreezePickup
// };

// Wewnętrzna referencja do stanu gry i funkcji startu
let gameState = {};
let startRunCallback = () => {};

// Funkcja obliczająca XP potrzebne na dany poziom
function calculateXpNeeded(level) {
    let xp = GAME_CONFIG.INITIAL_XP_NEEDED || 5;
    for (let i = 1; i < level; i++) {
        xp = Math.floor(xp * GAME_CONFIG.XP_GROWTH_FACTOR) + GAME_CONFIG.XP_GROWTH_ADD;
    }
    return xp;
}

/**
 * Funkcja wywołująca start gry
 */
function callStartRun() {
    if (gameState.game.inMenu || !gameState.game.running) {
        startRunCallback();
    } else {
        console.warn("[DEV] Nie można uruchomić gry automatycznie (gra już działa).");
    }
}

/**
 * Funkcja wywoływana z HTML (onclick) do zastosowania ustawień.
 */
function applyDevSettings() {
    if (!gameState.game || !gameState.settings || !gameState.player) {
        console.error("DEV ERROR: Stan gry nie został zainicjowany w module DEV.");
        return;
    }
    
    const { game, settings, player } = gameState;
    
    if (!game.inMenu && game.running) {
        game.level = parseInt(document.getElementById('devLevel').value) || 1;
        game.health = parseInt(document.getElementById('devHealth').value) || PLAYER_CONFIG.INITIAL_HEALTH;
        game.maxHealth = parseInt(document.getElementById('devMaxHealth').value) || PLAYER_CONFIG.INITIAL_HEALTH;
        game.xp = parseInt(document.getElementById('devXP').value) || 0;
        
        game.xpNeeded = calculateXpNeeded(game.level);
        
        const autoGun = player.getWeapon(AutoGun);
        const orbital = player.getWeapon(OrbitalWeapon);
        const nova = player.getWeapon(NovaWeapon);
        
        if (autoGun) {
            autoGun.bulletDamage = parseInt(document.getElementById('devDamage').value) || WEAPON_CONFIG.AUTOGUN.BASE_DAMAGE;
            autoGun.fireRate = parseInt(document.getElementById('devFireRate').value) || WEAPON_CONFIG.AUTOGUN.BASE_FIRE_RATE;
            autoGun.multishot = parseInt(document.getElementById('devMultishot').value) || 0;
            autoGun.pierce = parseInt(document.getElementById('devPierce').value) || 0;
        }
        if (orbital) {
            orbital.level = parseInt(document.getElementById('devOrbital').value) || 0;
            orbital.updateStats();
        }
        if (nova) {
            nova.level = parseInt(document.getElementById('devNova').value) || 0;
        }
    }
    
    devSettings.godMode = document.getElementById('devGodMode').checked;
    settings.spawn = parseFloat(document.getElementById('devSpawnRate').value) || GAME_CONFIG.INITIAL_SPAWN_RATE;
    settings.maxEnemies = parseInt(document.getElementById('devMaxEnemies').value) || GAME_CONFIG.MAX_ENEMIES;
    
    const enemySelect = document.getElementById('devEnemyType');
    devSettings.allowedEnemies = Array.from(enemySelect.selectedOptions).map(o => o.value);
    
    const pickupSelect = document.getElementById('devPickupType');
    devSettings.allowedPickups = Array.from(pickupSelect.selectedOptions).map(o => o.value);
    
    console.log('✅ Ustawienia Dev zastosowane!');
}

/**
 * Funkcja wywoływana z HTML (onclick) do spawnowania pickupów.
 */
function devSpawnPickup(type) {
    if (!gameState.game || !gameState.pickups || !gameState.player) {
        console.error("DEV ERROR: Stan gry nie został zainicjowany w module DEV.");
        return;
    }
    
    const { game, pickups, player } = gameState;
    
    if (!game.running || game.paused) {
        alert('❌ Rozpocznij grę przed używaniem tej funkcji!');
        return;
    }
    const pos = findFreeSpotForPickup(pickups, player.x, player.y);
    
    const PickupClass = PICKUP_CLASS_MAP[type]; // Używa zaimportowanej mapy
    if (PickupClass) {
        pickups.push(new PickupClass(pos.x, pos.y));
    } else {
        console.warn(`DEV: Nieznany typ pickupa do spawnienia: ${type}`);
    }
}

/**
 * Funkcja pomocnicza do stosowania presetów
 */
function applyDevPreset(level, perkLevelOffset = 0) {
    if (!gameState.game || !gameState.settings || !gameState.perkLevels || !gameState.player) {
        alert('❌ BŁĄD DEV: Stan gry nie jest gotowy. Uruchom grę przynajmniej raz (aby zainicjować stan).');
        return;
    }
    
    const { game, settings, perkLevels, player } = gameState;
    
    Object.assign(settings, {
        spawn: GAME_CONFIG.INITIAL_SPAWN_RATE,
        maxEnemies: GAME_CONFIG.MAX_ENEMIES,
        eliteInterval: GAME_CONFIG.ELITE_SPAWN_INTERVAL,
        lastFire: settings.lastFire,
        lastElite: settings.lastElite
    });
    
    const worldWidth = gameState.canvas.width * (gameState.camera.worldWidth / gameState.camera.viewWidth);
    const worldHeight = gameState.canvas.height * (gameState.camera.worldHeight / gameState.camera.viewHeight);
    player.reset(worldWidth, worldHeight);
    
    game.pickupRange = PLAYER_CONFIG.INITIAL_PICKUP_RANGE;
    game.maxHealth = PLAYER_CONFIG.INITIAL_HEALTH;
    game.health = PLAYER_CONFIG.INITIAL_HEALTH;
    
    for (let key in perkLevels) {
        delete perkLevels[key];
    }
    
    game.level = level;
    game.time = 121;
    devSettings.allowedEnemies = ['all'];
    
    game.xp = 0;
    game.xpNeeded = calculateXpNeeded(game.level);
    
    perkPool.forEach(perk => {
        const targetLevel = Math.max(0, perk.max - perkLevelOffset);
        if (targetLevel > 0) {
            perkLevels[perk.id] = targetLevel;
            for (let i = 0; i < targetLevel; i++) {
                perk.apply(gameState, perk);
            }
        }
    });
    
    const autoGun = player.getWeapon(AutoGun);
    const orbital = player.getWeapon(OrbitalWeapon);
    const nova = player.getWeapon(NovaWeapon);
    
    document.getElementById('devLevel').value = game.level;
    document.getElementById('devHealth').value = game.health;
    document.getElementById('devMaxHealth').value = game.maxHealth;
    document.getElementById('devXP').value = game.xp;
    
    if (autoGun) {
        document.getElementById('devDamage').value = autoGun.bulletDamage;
        document.getElementById('devFireRate').value = autoGun.fireRate;
        document.getElementById('devMultishot').value = autoGun.multishot;
        document.getElementById('devPierce').value = autoGun.pierce;
    }
    if (orbital) {
        document.getElementById('devOrbital').value = orbital.level;
    }
    if (nova) {
        document.getElementById('devNova').value = nova.level;
    }
    
    devSettings.presetLoaded = true;
    
    callStartRun();
}

function devPresetAlmostMax() {
    applyDevPreset(10, 1);
}

function devPresetMax() {
    applyDevPreset(10, 0);
}


/**
 * Inicjalizuje moduł dev, przekazując referencje do stanu gry.
 */
export function initDevTools(stateRef, startRunFn) {
    gameState = stateRef;
    startRunCallback = startRunFn;
    
    window.applyDevSettings = applyDevSettings;
    window.devSpawnPickup = devSpawnPickup;
    window.devPresetAlmostMax = devPresetAlmostMax;
    window.devPresetMax = devPresetMax;
    
    console.log('[DEBUG] js/services/dev.js: Dev Tools zainicjalizowane z callbackiem startRun.');
}