// ==============
// DEV.JS (v0.99 - FIX: Strict Mode & Auto-Start)
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
    forcedSpawnRate: null, 
    forcedMaxEnemies: null
};

let gameState = {};
let loadConfigCallback = () => {};
let startRunCallback = () => {};

function calculateXpNeeded(level) {
    let xp = GAME_CONFIG.INITIAL_XP_NEEDED || 5;
    for (let i = 1; i < level; i++) {
        xp = Math.floor(xp * GAME_CONFIG.XP_GROWTH_FACTOR) + GAME_CONFIG.XP_GROWTH_ADD;
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
    if (startRunCallback) {
        devSettings.presetLoaded = true;
        loadConfigCallback();
        startRunCallback();
        const menuOverlay = document.getElementById('menuOverlay');
        if (menuOverlay) menuOverlay.style.display = 'none';
    } else {
        console.warn("[DEV] Brak callbacka startRunCallback.");
    }
}

// FIX v0.99: Dodano parametr autoStart, aby uniknąć używania .caller
function devPresetEnemy(enemyType, autoStart = true) {
    console.log(`[Dev] Uruchamianie testu jednostki: ${enemyType.toUpperCase()}`);
    
    // Zapisujemy akcję z autoStart = false, żeby przy retry nie zapętlić gry
    lastScenarioAction = () => devPresetEnemy(enemyType, false);

    const enemySelect = document.getElementById('devEnemyType');
    if (enemySelect) {
        for (let i = 0; i < enemySelect.options.length; i++) {
            enemySelect.options[i].selected = false;
        }
        for (let i = 0; i < enemySelect.options.length; i++) {
            if (enemySelect.options[i].value === enemyType) {
                enemySelect.options[i].selected = true;
                break;
            }
        }
    }

    const ENEMY_UNLOCK_TIMES = {
        'standard': 0, 'horde': 30, 'aggressive': 60, 'kamikaze': 90,
        'splitter': 120, 'tank': 180, 'ranged': 210, 'elite': 0, 
        'wall': SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME 
    };
    
    const requiredTime = ENEMY_UNLOCK_TIMES[enemyType] || 0;
    const jumpTime = Math.max(4.1, requiredTime + 1);

    document.getElementById('devSpawnRate').value = "0.03"; 
    document.getElementById('devMaxEnemies').value = "100"; 
    
    const timeInput = document.getElementById('devTime');
    if (timeInput) timeInput.value = jumpTime;

    applyDevSettings(true); 
    devStartTime = jumpTime;

    if (gameState && gameState.game) {
        if (!gameState.game.seenEnemyTypes.includes(enemyType)) {
            gameState.game.seenEnemyTypes.push(enemyType);
        }
    }

    // FIX v0.99: Bezpieczne wywołanie startu
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
            if (enemyType === 'wall') gameState.settings.lastSiegeEvent = -999999; 
            else gameState.settings.lastSiegeEvent = jumpTime + 10000;

            if (enemyType === 'elite') gameState.settings.lastElite = -999999; 
            else gameState.settings.lastElite = jumpTime + 10000;
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
    
    document.getElementById('devTime').value = game.time;
    document.getElementById('devLevel').value = game.level;
    document.getElementById('devGodMode').checked = true; 
    
    const weaponPerks = ['whip', 'autogun', 'orbital', 'nova', 'chainLightning'];
    weaponPerks.forEach(id => {
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
    
    document.getElementById('devLevel').value = game.level;
    document.getElementById('devTime').value = game.time;
    document.getElementById('devWhip').value = perkLevels['whip'] || 1;
    document.getElementById('devAutoGun').value = 1;
    
    if (autoGun) {
        document.getElementById('devDamage').value = autoGun.bulletDamage;
        document.getElementById('devFireRate').value = autoGun.fireRate;
        document.getElementById('devMultishot').value = autoGun.multishot;
        document.getElementById('devPierce').value = autoGun.pierce;
    }
    
    const orbital = player.getWeapon(OrbitalWeapon); 
    const nova = player.getWeapon(NovaWeapon); 
    const lightning = player.getWeapon(ChainLightningWeapon); 
    
    document.getElementById('devOrbital').value = orbital ? orbital.level : 0;
    document.getElementById('devNova').value = nova ? nova.level : 0;
    document.getElementById('devLightning').value = lightning ? lightning.level : 0; 
    
    devSettings.presetLoaded = true;
    applyDevSettings(true); 
}

function devPresetAlmostMax() { applyDevPreset(20, 1); }
function devPresetMax() { applyDevPreset(50, 0); }

// FIX v0.99: Dodano parametr autoStart
function devStartScenario(type, autoStart = true) {
    console.log(`[Dev] Uruchamianie scenariusza: ${type.toUpperCase()}`);
    
    // Zapisujemy akcję z autoStart = false
    lastScenarioAction = () => devStartScenario(type, false);

    if (type === 'min') devPresetMinimalWeapons();
    else if (type === 'high') devPresetAlmostMax();
    else if (type === 'max') devPresetMax();
    
    // FIX v0.99: Bezpieczne wywołanie
    if (autoStart) {
        callStartRun();
    }
}

export function applyDevSettings(silent = false) {
    if (!gameState.game) return;
    
    const { game, settings, player, perkLevels } = gameState;
    
    const devTimeInput = document.getElementById('devTime');
    if (devTimeInput) {
        devStartTime = parseFloat(devTimeInput.value) || 0;
        if (!game.inMenu || game.manualPause) {
            game.time = devStartTime;
            settings.lastElite = game.time; 
            settings.lastSiegeEvent = game.time; 
        }
    }
    
    game.health = parseInt(document.getElementById('devHealth').value) || PLAYER_CONFIG.INITIAL_HEALTH;
    game.maxHealth = parseInt(document.getElementById('devMaxHealth').value) || PLAYER_CONFIG.INITIAL_HEALTH;
    game.level = parseInt(document.getElementById('devLevel').value) || 1;
    game.xp = parseInt(document.getElementById('devXP').value) || 0;
    game.xpNeeded = calculateXpNeeded(game.level);
    
    devSettings.godMode = document.getElementById('devGodMode').checked;
    const dbgHb = document.getElementById('devDebugHitboxes');
    devSettings.debugHitboxes = dbgHb ? dbgHb.checked : false;

    settings.spawn = parseFloat(document.getElementById('devSpawnRate').value) || GAME_CONFIG.INITIAL_SPAWN_RATE;
    settings.maxEnemies = parseInt(document.getElementById('devMaxEnemies').value) || GAME_CONFIG.MAX_ENEMIES;
    
    const enemySelect = document.getElementById('devEnemyType');
    devSettings.allowedEnemies = Array.from(enemySelect.selectedOptions).map(o => o.value);
    
    if (!game.inMenu || game.manualPause) {
        const whipLvl = parseInt(document.getElementById('devWhip').value) || 1;
        const whip = player.getWeapon(WhipWeapon);
        if (whip) {
            whip.level = 1;
            const whipPerk = perkPool.find(p => p.id === 'whip');
            for(let i = 1; i < whipLvl; i++) whip.upgrade(whipPerk);
            perkLevels['whip'] = whipLvl; 
        }

        const agLvl = parseInt(document.getElementById('devAutoGun').value) || 0;
        let autoGun = player.getWeapon(AutoGun);
        if (agLvl > 0) {
            if (!autoGun) {
                const p = perkPool.find(x => x.id === 'autogun');
                p.apply({player}, p);
                autoGun = player.getWeapon(AutoGun);
            }
            if (autoGun) {
                autoGun.bulletDamage = parseInt(document.getElementById('devDamage').value);
                autoGun.fireRate = parseInt(document.getElementById('devFireRate').value);
                autoGun.multishot = parseInt(document.getElementById('devMultishot').value);
                autoGun.pierce = parseInt(document.getElementById('devPierce').value);
                perkLevels['autogun'] = 1;
            }
        } else if (autoGun) {
            player.weapons = player.weapons.filter(w => !(w instanceof AutoGun));
            delete perkLevels['autogun'];
        }
        
        const handleWeapon = (WeaponClass, lvlInputId, perkId) => {
            const lvl = parseInt(document.getElementById(lvlInputId).value) || 0;
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
    
    console.log('[DEBUG-v0.99] js/services/dev.js: Dev Tools loaded & exported.');
}