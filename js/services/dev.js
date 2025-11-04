// ==============
// DEV.JS (v0.55 - Reorganizacja folderów)
// Lokalizacja: /js/services/dev.js
// ==============

import { findFreeSpotForPickup } from '../core/utils.js';
import { perkPool } from '../config/perks.js';
import { INITIAL_SETTINGS, AutoGun, OrbitalWeapon, NovaWeapon } from '../config/weapon.js';
import { 
    HealPickup, MagnetPickup, ShieldPickup, 
    SpeedPickup, BombPickup, FreezePickup 
} from '../entities/pickup.js';

/**
 * Eksportowane ustawienia deweloperskie.
 */
export const devSettings = {
    godMode: false,
    allowedEnemies: ['all'],
    allowedPickups: ['all'],
    presetLoaded: false 
};

// Mapa dla klas pickupów
const PICKUP_CLASS_MAP = {
    heal: HealPickup,
    magnet: MagnetPickup,
    shield: ShieldPickup,
    speed: SpeedPickup,
    bomb: BombPickup,
    freeze: FreezePickup
};

// Wewnętrzna referencja do stanu gry, ustawiana przez initDevTools
let gameState = {};

// Funkcja obliczająca XP potrzebne na dany poziom
function calculateXpNeeded(level) {
    let xp = INITIAL_SETTINGS.xpNeeded || 5; 
    for (let i = 1; i < level; i++) {
        xp = Math.floor(xp * 1.4) + 2;
    }
    return xp;
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
        game.health = parseInt(document.getElementById('devHealth').value) || 100;
        game.maxHealth = parseInt(document.getElementById('devMaxHealth').value) || 100;
        game.xp = parseInt(document.getElementById('devXP').value) || 0;
        
        game.xpNeeded = calculateXpNeeded(game.level);

        const autoGun = player.getWeapon(AutoGun);
        const orbital = player.getWeapon(OrbitalWeapon);
        const nova = player.getWeapon(NovaWeapon);

        if (autoGun) {
            autoGun.bulletDamage = parseInt(document.getElementById('devDamage').value) || 1;
            autoGun.fireRate = parseInt(document.getElementById('devFireRate').value) || 500;
            autoGun.multishot = parseInt(document.getElementById('devMultishot').value) || 0;
            autoGun.pierce = parseInt(document.getElementById('devPierce').value) || 0;
        }
        if (orbital) {
            orbital.level = parseInt(document.getElementById('devOrbital').value) || 0;
            orbital.updateStats(); // Wymuś aktualizację statystyk Orbitala
        }
        if (nova) {
            nova.level = parseInt(document.getElementById('devNova').value) || 0;
        }
    }

    devSettings.godMode = document.getElementById('devGodMode').checked;
    settings.spawn = parseFloat(document.getElementById('devSpawnRate').value) || 0.02;
    settings.maxEnemies = parseInt(document.getElementById('devMaxEnemies').value) || 110;

    const enemySelect = document.getElementById('devEnemyType');
    devSettings.allowedEnemies = Array.from(enemySelect.selectedOptions).map(o => o.value);

    const pickupSelect = document.getElementById('devPickupType');
    devSettings.allowedPickups = Array.from(pickupSelect.selectedOptions).map(o => o.value);

    alert('✅ Ustawienia Dev zastosowane!');
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
    
    const PickupClass = PICKUP_CLASS_MAP[type];
    if (PickupClass) {
        pickups.push(new PickupClass(pos.x, pos.y));
    } else {
        console.warn(`DEV: Nieznany typ pickupa do spawnienia: ${type}`);
    }
}

/**
 * Funkcja pomocnicza do stosowania presetów
 * @param {number} level - Docelowy poziom gracza
 * @param {number} perkLevelOffset - 0 dla max, 1 dla "prawie max"
 */
function applyDevPreset(level, perkLevelOffset = 0) {
    if (!gameState.game || !gameState.settings || !gameState.perkLevels || !gameState.player) {
        alert('❌ BŁĄD DEV: Stan gry nie jest gotowy. Uruchom grę przynajmniej raz (aby zainicjować stan).');
        return;
    }
    
    const { game, settings, perkLevels, player } = gameState;

    // Resetuj statystyki do stanu początkowego, aby uniknąć nakładania się
    Object.assign(settings, { ...INITIAL_SETTINGS, lastFire: settings.lastFire, lastElite: settings.lastElite });
    
    player.reset(gameState.canvas.width, gameState.canvas.height); // Resetuje gracza i broń
    
    player.speed = 3; 
    game.pickupRange = 24;
    game.maxHealth = 100;
    game.health = 100;

    for (let key in perkLevels) {
        delete perkLevels[key];
    }

    // Ustawienia gry
    game.level = level;
    game.time = 121; 
    devSettings.allowedEnemies = ['all']; 
    
    game.xp = 0;
    game.xpNeeded = calculateXpNeeded(game.level);

    // Zastosuj perki
    perkPool.forEach(perk => {
        const targetLevel = Math.max(0, perk.max - perkLevelOffset);
        if (targetLevel > 0) {
            perkLevels[perk.id] = targetLevel;
            for (let i = 0; i < targetLevel; i++) {
                perk.apply(gameState, perk);
            }
        }
    });

    // Zaktualizuj UI w Dev Menu, aby odzwierciedlić zmiany
    const autoGun = player.getWeapon(AutoGun);
    const orbital = player.getWeapon(OrbitalWeapon);
    const nova = player.getWeapon(NovaWeapon);

    document.getElementById('devLevel').value = game.level;
    document.getElementById('devHealth').value = game.health;
    document.getElementById('devMaxHealth').value = game.maxHealth;
    document.getElementById('devXP').value = game.xp; // Pokaż 0 XP
    
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
    
    alert(`✅ Preset załadowany! Poziom: ${game.level}, Perki: ${perkLevelOffset === 0 ? 'Max' : 'Prawie Max'}\nPrzejdź do zakładki "Gra" i kliknij "Start Gry".`);
}

function devPresetAlmostMax() {
    applyDevPreset(10, 1); // Poziom 10, 1 poziom do końca perka
}

function devPresetMax() {
    applyDevPreset(10, 0); // Poziom 10, max perki
}


/**
 * Inicjalizuje moduł dev, przekazując referencje do stanu gry.
 */
export function initDevTools(stateRef) {
    gameState = stateRef;
    
    window.applyDevSettings = applyDevSettings;
    window.devSpawnPickup = devSpawnPickup;
    window.devPresetAlmostMax = devPresetAlmostMax;
    window.devPresetMax = devPresetMax;
}