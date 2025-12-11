// ==============
// DEV.JS (v1.03 - XP Calculation Fix)
// Lokalizacja: /js/services/dev.js
// ==============

import { findFreeSpotForPickup } from '../core/utils.js';
import { perkPool } from '../config/perks.js';
import { PLAYER_CONFIG, GAME_CONFIG, WEAPON_CONFIG, SIEGE_EVENT_CONFIG } from '../config/gameData.js';

import { AutoGun } from '../config/weapons/autoGun.js';
import { OrbitalWeapon } from '../config/weapons/orbitalWeapon.js';
import { NovaWeapon } from '../config/weapons/novaWeapon.js';
import { WhipWeapon } from '../config/weapons/whipWeapon.js';
import { ChainLightningWeapon } from '../config/weapons/chainLightningWeapon.js';

import { HealPickup } from '../entities/pickups/healPickup.js';
import { MagnetPickup } from '../entities/pickups/magnetPickup.js';
import { ShieldPickup } from '../entities/pickups/shieldPickup.js';
import { SpeedPickup } from '../entities/pickups/speedPickup.js';
import { BombPickup } from '../entities/pickups/bombPickup.js';
import { FreezePickup } from '../entities/pickups/freezePickup.js';
import { Chest } from '../entities/chest.js';

import { confirmOverlay, confirmText, btnConfirmYes } from '../ui/domElements.js';

const PICKUP_CLASS_MAP = {
    'heal': HealPickup,
    'magnet': MagnetPickup,
    'shield': ShieldPickup,
    'speed': SpeedPickup,
    'bomb': BombPickup,
    'freeze': FreezePickup
};

export let devStartTime = 0;

let lastScenarioAction = null;

export function resetDevTime() {
    devStartTime = 0;
}

export const devSettings = {
    godMode: false,
    debugHitboxes: false,
    allowedEnemies: ['all'],
    allowedPickups: ['all'],
    presetLoaded: false,
    justStartedFromMenu: false, 
    forcedSpawnRate: null, 
    forcedMaxEnemies: null
};

let gameState = {};
let loadConfigCallback = () => {};
let startRunCallback = () => {};

// ZMIANA: Zaktualizowano logikę obliczania XP, aby pasowała do hybrydowego systemu z gameData.js
// Wcześniej używano nieistniejącego XP_GROWTH_FACTOR, co powodowało NaN przy poziomach > 1
function calculateXpNeeded(level) {
    let xp = GAME_CONFIG.INITIAL_XP_NEEDED || 5;
    const threshold = GAME_CONFIG.XP_THRESHOLD_LEVEL || 10;
    const earlyFactor = GAME_CONFIG.XP_GROWTH_EARLY || 1.5;
    const lateFactor = GAME_CONFIG.XP_GROWTH_LATE || 1.35;
    const addVal = GAME_CONFIG.XP_GROWTH_ADD || 6;

    for (let i = 1; i < level; i++) {
        let factor = (i <= threshold) ? earlyFactor : lateFactor;
        xp = Math.floor(xp * factor) + addVal;
    }
    return xp;
}

function showDevConfirmModal(text) {
    let btnConfirmNo = document.getElementById('btnConfirmNo');
    if (!confirmOverlay || !confirmText || !btnConfirmYes || !btnConfirmNo) return;
    
    confirmText.textContent = text;
    confirmOverlay.style.display = 'flex';
    btnConfirmYes.style.display = 'none';
    
    let newBtnNo = btnConfirmNo.cloneNode(true);
    newBtnNo.textContent = 'OK';
    btnConfirmNo.parentNode.replaceChild(newBtnNo, btnConfirmNo);
    btnConfirmNo = newBtnNo; 
    
    const timerId = setTimeout(() => {
        confirmOverlay.style.display = 'none';
        btnConfirmYes.style.display = 'inline-block';
        btnConfirmNo.textContent = 'Anuluj';
    }, 1500);
    
    btnConfirmNo.onclick = () => {
        clearTimeout(timerId);
        confirmOverlay.style.display = 'none';
        btnConfirmYes.style.display = 'inline-block';
        let originalBtnNo = document.getElementById('btnConfirmNo');
        if (originalBtnNo) originalBtnNo.textContent = 'Anuluj';
    };
}

function callStartRun() {
    if (typeof startRunCallback === 'function') {
        console.log("[DEV] callStartRun: Rozpoczynam grę...");
        devSettings.presetLoaded = true;
        devSettings.justStartedFromMenu = true; 
        
        const menuOverlay = document.getElementById('menuOverlay');
        if (menuOverlay) menuOverlay.style.display = 'none';
        
        loadConfigCallback();
        startRunCallback();
    } else {
        console.error("[DEV] BŁĄD: startRunCallback nie jest funkcją!", startRunCallback);
    }
}

// Helpery do bezpiecznego pobierania wartości z DOM
function getVal(id, defaultValue) {
    const el = document.getElementById(id);
    if (!el) return defaultValue;
    const val = parseFloat(el.value);
    return isNaN(val) ? defaultValue : val;
}

function getCheck(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function devPresetEnemy(enemyType, autoStart = true) {
    console.log(`[Dev] Preset: ${enemyType}, AutoStart: ${autoStart}`);
    
    lastScenarioAction = () => devPresetEnemy(enemyType, false);

    const enemySelect = document.getElementById('devEnemyType');
    if (enemySelect) {
        for (let i = 0; i < enemySelect.options.length; i++) {
            enemySelect.options[i].selected = false;
        }
        let found = false;
        for (let i = 0; i < enemySelect.options.length; i++) {
            if (enemySelect.options[i].value === enemyType) {
                enemySelect.options[i].selected = true;
                found = true;
                break;
            }
        }
        if (!found && enemyType === 'lumberjack') {
            // Jeśli brakuje opcji w HTML, wymuś w pamięci
            devSettings.allowedEnemies = ['lumberjack'];
        }
    }

    const ENEMY_UNLOCK_TIMES = {
        'standard': 0, 'horde': 30, 'aggressive': 60, 'kamikaze': 90,
        'splitter': 120, 'tank': 180, 'ranged': 210, 'elite': 0, 
        'wall': SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME,
        'lumberjack': 0 
    };
    
    const requiredTime = ENEMY_UNLOCK_TIMES[enemyType] || 0;
    const jumpTime = Math.max(4.1, requiredTime + 1);

    setVal('devSpawnRate', 0.03);
    setVal('devMaxEnemies', 100);
    setVal('devTime', jumpTime);

    // Aplikacja ustawień (bezpieczna)
    applyDevSettings(true); 
    
    // Wymuszenie, na wypadek błędu w UI
    devSettings.allowedEnemies = [enemyType];
    devStartTime = jumpTime;

    if (gameState && gameState.game) {
        if (!gameState.game.seenEnemyTypes.includes(enemyType)) {
            gameState.game.seenEnemyTypes.push(enemyType);
        }
    }

    if (autoStart) {
        callStartRun();
    }

    setTimeout(() => {
        if (gameState && gameState.game && gameState.settings) {
            let autoGun = gameState.player.getWeapon(AutoGun);
            if (!autoGun) {
                const autogunPerk = perkPool.find(p => p.id === 'autogun');
                if (autogunPerk) {
                    autogunPerk.apply(gameState, autogunPerk); 
                    gameState.perkLevels['autogun'] = 1; 
                }
            }
            
            // Reset timerów
            if (enemyType === 'wall') {
                gameState.settings.lastSiegeEvent = -999999; 
            } else {
                gameState.settings.lastSiegeEvent = jumpTime + 10000;
            }

            if (enemyType === 'elite' || enemyType === 'lumberjack') {
                gameState.settings.lastElite = -999999; 
            } else {
                gameState.settings.lastElite = jumpTime + 10000;
            }
        }
    }, 200);
}

function devPresetMinimalWeapons() {
    if (!gameState.game) return;
    const { game, player, perkLevels } = gameState;
    
    const worldWidth = gameState.canvas.width * (gameState.camera.worldWidth / gameState.camera.viewWidth);
    const worldHeight = gameState.canvas.height * (gameState.camera.worldHeight / gameState.camera.viewHeight);
    player.reset(worldWidth, worldHeight);
    
    game.pickupRange = PLAYER_CONFIG.INITIAL_PICKUP_RANGE;
    game.health = PLAYER_CONFIG.INITIAL_HEALTH; game.maxHealth = PLAYER_CONFIG.INITIAL_HEALTH;
    
    for (let key in perkLevels) delete perkLevels[key];
    
    game.level = 10; game.time = 60; devSettings.allowedEnemies = ['all'];
    game.xp = 0; game.xpNeeded = calculateXpNeeded(game.level);
    
    setVal('devTime', game.time);
    setVal('devLevel', game.level);
    
    const weaponPerks = ['whip', 'autogun', 'orbital', 'nova', 'chainLightning'];
    weaponPerks.forEach(id => {
        if (id === 'whip') {
            perkLevels[id] = 1;
            return;
        }
        const perk = perkPool.find(p => p.id === id);
        if (perk) {
            perk.apply(gameState, perk); 
            perkLevels[id] = 1;
        }
    });

    applyDevSettings(true);
}

function applyDevPreset(targetLevel, perkLevelOffset = 0) {
    if (!gameState.game) return;
    const { game, settings, perkLevels, player } = gameState;
    
    const worldWidth = gameState.canvas.width * (gameState.camera.worldWidth / gameState.camera.viewWidth);
    const worldHeight = gameState.canvas.height * (gameState.camera.worldHeight / gameState.camera.viewHeight);
    player.reset(worldWidth, worldHeight);
    
    game.pickupRange = PLAYER_CONFIG.INITIAL_PICKUP_RANGE;
    game.health = PLAYER_CONFIG.INITIAL_HEALTH; game.maxHealth = PLAYER_CONFIG.INITIAL_HEALTH;
    
    for (let key in perkLevels) delete perkLevels[key];
    
    game.level = targetLevel; game.time = 600; devSettings.allowedEnemies = ['all'];
    game.xp = 0; game.xpNeeded = calculateXpNeeded(game.level);
    
    const whip = player.getWeapon(WhipWeapon); 
    const whipPerk = perkPool.find(p => p.id === 'whip');
    const targetWhipLevel = Math.max(1, (whipPerk.max || 5) - perkLevelOffset);
    if (targetWhipLevel > 1) {
        for(let i = 1; i < targetWhipLevel; i++) whip.upgrade(whipPerk);
        perkLevels['whip'] = targetWhipLevel; 
    } else {
        perkLevels['whip'] = 1;
    }

    let autoGun = null;
    const autogunPerk = perkPool.find(p => p.id === 'autogun');
    if (autogunPerk) { 
        autogunPerk.apply(gameState, autogunPerk); 
        perkLevels['autogun'] = 1; 
        autoGun = player.getWeapon(AutoGun); 
    }
    
    if (autoGun) {
        ['damage', 'firerate', 'multishot', 'pierce'].forEach(perkId => {
            const perk = perkPool.find(p => p.id === perkId);
            const targetLevel = Math.max(0, perk.max - perkLevelOffset);
            for (let i = 0; i < targetLevel; i++) perk.apply(gameState, perk);
            perkLevels[perkId] = targetLevel;
        });
    }
    
    perkPool.forEach(perk => {
        if (['orbital', 'nova', 'chainLightning', 'speed', 'pickup', 'health'].includes(perk.id)) {
             const targetLvl = Math.max(0, perk.max - perkLevelOffset);
             if (targetLvl > 0) {
                 perkLevels[perk.id] = targetLvl;
                 for (let i = 0; i < targetLvl; i++) {
                     perk.apply(gameState, perk);
                 }
             }
        }
    });
    
    setVal('devLevel', game.level);
    setVal('devTime', game.time);
    setVal('devWhip', perkLevels['whip'] || 1);
    setVal('devAutoGun', 1);
    
    if (autoGun) {
        setVal('devDamage', autoGun.bulletDamage);
        setVal('devFireRate', autoGun.fireRate);
        setVal('devMultishot', autoGun.multishot);
        setVal('devPierce', autoGun.pierce);
    }
    
    const orbital = player.getWeapon(OrbitalWeapon); 
    const nova = player.getWeapon(NovaWeapon); 
    const lightning = player.getWeapon(ChainLightningWeapon); 
    
    setVal('devOrbital', orbital ? orbital.level : 0);
    setVal('devNova', nova ? nova.level : 0);
    setVal('devLightning', lightning ? lightning.level : 0);
    
    devSettings.presetLoaded = true;
    applyDevSettings(true); 
}

function devPresetAlmostMax() { applyDevPreset(20, 1); }
function devPresetMax() { applyDevPreset(50, 0); }

function devStartPeaceful() {
    console.log('[Dev] Uruchamianie trybu pokojowego (spacer)...');
    lastScenarioAction = () => devStartPeaceful();
    devSettings.presetLoaded = true;
    devStartTime = 0;
    setVal('devSpawnRate', 0);
    setVal('devMaxEnemies', 0);
    
    if (gameState.settings) {
        gameState.settings.spawn = 0;
        gameState.settings.maxEnemies = 0;
        gameState.settings.eliteInterval = 999999;
        gameState.settings.currentSiegeInterval = 999999;
    }
    
    callStartRun();
}

function devStartScenario(type, autoStart = true) {
    console.log(`[Dev] Uruchamianie scenariusza: ${type.toUpperCase()}`);
    
    lastScenarioAction = () => devStartScenario(type, false);

    if (type === 'min') devPresetMinimalWeapons();
    else if (type === 'high') devPresetAlmostMax();
    else if (type === 'max') devPresetMax();
    else if (type === 'peaceful') {
         devStartPeaceful();
         return;
    }
    
    if (autoStart) {
        callStartRun();
    }
}

export function applyDevSettings(silent = false) {
    if (!gameState.game) return;
    
    const { game, settings, player, perkLevels } = gameState;
    
    // Bezpieczne pobieranie wartości (helpery)
    devStartTime = getVal('devTime', 0);
    if (!game.inMenu || game.manualPause) {
        game.time = devStartTime;
        settings.lastElite = game.time; 
        settings.lastSiegeEvent = game.time; 
    }
    
    game.health = getVal('devHealth', PLAYER_CONFIG.INITIAL_HEALTH);
    // FIX: Dodano fallback jeśli devMaxHealth nie istnieje w HTML
    game.maxHealth = getVal('devMaxHealth', PLAYER_CONFIG.INITIAL_HEALTH);
    
    game.level = getVal('devLevel', 1);
    game.xp = getVal('devXP', 0);
    game.xpNeeded = calculateXpNeeded(game.level);
    
    devSettings.godMode = getCheck('devGodMode');
    devSettings.debugHitboxes = getCheck('devDebugHitboxes');

    settings.spawn = getVal('devSpawnRate', GAME_CONFIG.INITIAL_SPAWN_RATE);
    settings.maxEnemies = getVal('devMaxEnemies', GAME_CONFIG.MAX_ENEMIES);
    
    const enemySelect = document.getElementById('devEnemyType');
    if (enemySelect) {
        devSettings.allowedEnemies = Array.from(enemySelect.selectedOptions).map(o => o.value);
    }
    
    if (!game.inMenu || game.manualPause) {
        const whipLvl = getVal('devWhip', 1);
        const whip = player.getWeapon(WhipWeapon);
        if (whip) {
            whip.level = 1;
            const whipPerk = perkPool.find(p => p.id === 'whip');
            for(let i = 1; i < whipLvl; i++) whip.upgrade(whipPerk);
            perkLevels['whip'] = whipLvl; 
        }

        const agLvl = getVal('devAutoGun', 0);
        let autoGun = player.getWeapon(AutoGun);
        if (agLvl > 0) {
            if (!autoGun) {
                const p = perkPool.find(x => x.id === 'autogun');
                p.apply({player}, p);
                autoGun = player.getWeapon(AutoGun);
            }
            if (autoGun) {
                autoGun.bulletDamage = getVal('devDamage', 1);
                autoGun.fireRate = getVal('devFireRate', 650);
                autoGun.multishot = getVal('devMultishot', 0);
                autoGun.pierce = getVal('devPierce', 0);
                perkLevels['autogun'] = 1;
            }
        } else if (autoGun) {
            player.weapons = player.weapons.filter(w => !(w instanceof AutoGun));
            delete perkLevels['autogun'];
        }
        
        const handleWeapon = (WeaponClass, lvlInputId, perkId) => {
            const lvl = getVal(lvlInputId, 0);
            let w = player.getWeapon(WeaponClass);
            if (lvl > 0) {
                if (!w) {
                    const p = perkPool.find(x => x.id === perkId);
                    p.apply(gameState, p); 
                    w = player.getWeapon(WeaponClass);
                }
                if (w) {
                    w.level = 0; 
                    const p = perkPool.find(x => x.id === perkId);
                    for(let i=0; i<lvl; i++) w.upgrade(p);
                    perkLevels[perkId] = lvl;
                }
            } else if (w) {
                player.weapons = player.weapons.filter(we => !(we instanceof WeaponClass));
                delete perkLevels[perkId];
            }
        };

        handleWeapon(OrbitalWeapon, 'devOrbital', 'orbital');
        handleWeapon(NovaWeapon, 'devNova', 'nova');
        handleWeapon(ChainLightningWeapon, 'devLightning', 'chainLightning');
    }
    
    devSettings.presetLoaded = true;
    console.log('[Dev] Ustawienia zastosowane.');
    
    if (!silent) {
        showDevConfirmModal('✅ Ustawienia Dev zastosowane!');
    }
}

function devSpawnPickup(type) {
    if (!gameState.game || !gameState.pickups || !gameState.player) return;
    const { game, pickups, player } = gameState;
    if (!game.running || game.paused) { alert('❌ Rozpocznij grę!'); return; }
    
    const pos = findFreeSpotForPickup(pickups, player.x, player.y);
    let p = null;
    if (type === 'chest') { gameState.chests.push(new Chest(pos.x, pos.y)); }
    else {
        const PickupClass = PICKUP_CLASS_MAP[type];
        if (PickupClass) p = new PickupClass(pos.x, pos.y);
    }
    if (p) pickups.push(p);
}

export function retryLastScenario() {
    if (lastScenarioAction) {
        console.log('[Dev] Ponawianie ostatniego scenariusza...');
        lastScenarioAction();
    }
}

export function initDevTools(stateRef, loadConfigFn, startRunFn) {
    gameState = stateRef;
    loadConfigCallback = loadConfigFn;
    startRunCallback = startRunFn;
    
    window.applyDevSettings = applyDevSettings;
    window.devSpawnPickup = devSpawnPickup;
    window.devPresetAlmostMax = devPresetAlmostMax;
    window.devPresetMax = devPresetMax;
    window.devPresetMinimalWeapons = devPresetMinimalWeapons;
    window.devPresetEnemy = devPresetEnemy; 
    window.devStartScenario = devStartScenario; 
    window.devStartPreset = devPresetEnemy; 
    window.retryLastScenario = retryLastScenario; 
    window.devStartPeaceful = devStartPeaceful; 
    
    console.log('[DEBUG-v1.03] js/services/dev.js: Dev Tools loaded & exported.');
}