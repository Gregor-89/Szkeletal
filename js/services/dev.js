// ==============
// DEV.JS (v0.93 - FIX: AutoGun in Presets & Correct Event Timing)
// Lokalizacja: /js/services/dev.js
// ==============

import { findFreeSpotForPickup } from '../core/utils.js';
import { perkPool } from '../config/perks.js';
import { PLAYER_CONFIG, GAME_CONFIG, WEAPON_CONFIG, SIEGE_EVENT_CONFIG } from '../config/gameData.js';

// Importy broni
import { AutoGun } from '../config/weapons/autoGun.js';
import { OrbitalWeapon } from '../config/weapons/orbitalWeapon.js';
import { NovaWeapon } from '../config/weapons/novaWeapon.js';
import { WhipWeapon } from '../config/weapons/whipWeapon.js';
import { ChainLightningWeapon } from '../config/weapons/chainLightningWeapon.js';

import { PICKUP_CLASS_MAP } from '../managers/effects.js';
import { confirmOverlay, confirmText, btnConfirmYes } from '../ui/domElements.js';

/**
 * Eksportowana zmienna przechowująca docelowy czas startu.
 */
export let devStartTime = 0;

export function resetDevTime() {
    devStartTime = 0;
}

/**
 * Ustawienia Dev
 */
export const devSettings = {
    godMode: false,
    allowedEnemies: ['all'],
    allowedPickups: ['all'],
    presetLoaded: false,
    forcedSpawnRate: null, 
    forcedMaxEnemies: null
};

// Referencje
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
        loadConfigCallback();
        startRunCallback();
    } else {
        console.warn("[DEV] Brak callbacka startRunCallback.");
    }
}

/**
 * NOWA FUNKCJA (v0.93): Szybki test konkretnego wroga z POPRAWNĄ ZMIANĄ CZASU
 */
function devPresetEnemy(enemyType) {
    console.log(`[Dev] Uruchamianie testu jednostki: ${enemyType.toUpperCase()}`);

    // 1. Zmanipuluj select w HTML
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

    // 2. Ustal czas startu
    const ENEMY_UNLOCK_TIMES = {
        'standard': 0,
        'horde': 30,
        'aggressive': 60,
        'kamikaze': 90,
        'splitter': 120,
        'tank': 180,
        'ranged': 210, 
        'elite': 0, 
        'wall': SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME // 150s
    };
    
    const requiredTime = ENEMY_UNLOCK_TIMES[enemyType] || 0;
    const jumpTime = Math.max(4.1, requiredTime + 1);

    // 3. Ustawienia UI
    document.getElementById('devSpawnRate').value = "0.03"; 
    document.getElementById('devMaxEnemies').value = "100"; 
    const timeInput = document.getElementById('devTime');
    if (timeInput) timeInput.value = jumpTime;

    // 4. Aplikuj ustawienia
    applyDevSettings(); 
    devStartTime = jumpTime;

    // 5. Oznacz wroga jako "widzianego"
    if (gameState && gameState.game) {
        if (!gameState.game.seenEnemyTypes.includes(enemyType)) {
            gameState.game.seenEnemyTypes.push(enemyType);
        }
    }

    // 6. Restart Gry
    callStartRun();

    // 7. FIX PO RESECIE: Wymuś broń i zablokuj niechciane eventy
    setTimeout(() => {
        if (gameState && gameState.game && gameState.settings) {
            
            // A. WYMUSZENIE AUTOGUNA (FIX: "Tylko Bicz")
            // Musimy dodać broń ręcznie, bo resetAll czyści ekwipunek
            let autoGun = gameState.player.getWeapon(AutoGun);
            if (!autoGun) {
                const autogunPerk = perkPool.find(p => p.id === 'autogun');
                if (autogunPerk) {
                    autogunPerk.apply(gameState, autogunPerk); 
                    // Ustawienie lvl 1 dla pewności
                    gameState.perkLevels['autogun'] = 1; 
                    console.log('[Dev] AutoGun wymuszony po resecie.');
                }
            }

            // B. BLOKADA EVENTÓW (FIX: "Pojawiający się Oblężnik")
            
            // Obsługa OBLĘŻENIA
            if (enemyType === 'wall') {
                gameState.settings.lastSiegeEvent = -999999; // Wymuś natychmiastowy spawn
            } else {
                // Przesuń licznik ostatniego eventu w przyszłość (o 10000s)
                // Dzięki temu warunek (czas_gry - lastSiege > interval) będzie fałszywy
                gameState.settings.lastSiegeEvent = jumpTime + 10000;
            }

            // Obsługa ELITY
            if (enemyType === 'elite') {
                gameState.settings.lastElite = -999999; 
            } else {
                gameState.settings.lastElite = jumpTime + 10000;
            }
            
            console.log(`[Dev] Test wroga ${enemyType} aktywny. Czas: ${jumpTime}s. Eventy zablokowane.`);
        }
    }, 200);
}

/**
 * Presety z minimalnymi broniami.
 */
function devPresetMinimalWeapons() {
    if (!gameState.game || !gameState.settings || !gameState.player) return;
    
    const { game, settings, perkLevels, player } = gameState;

    const worldWidth = gameState.canvas.width * (gameState.camera.worldWidth / gameState.camera.viewWidth);
    const worldHeight = gameState.canvas.height * (gameState.camera.worldHeight / gameState.camera.viewHeight);
    player.reset(worldWidth, worldHeight);
    
    game.pickupRange = PLAYER_CONFIG.INITIAL_PICKUP_RANGE;
    game.maxHealth = PLAYER_CONFIG.INITIAL_HEALTH;
    game.health = PLAYER_CONFIG.INITIAL_HEALTH;
    
    for (let key in perkLevels) delete perkLevels[key];
    
    game.level = 10; 
    game.time = 181; 
    devSettings.allowedEnemies = ['all'];
    
    game.xp = 0;
    game.xpNeeded = calculateXpNeeded(game.level);
    
    const devTimeInput = document.getElementById('devTime');
    if (devTimeInput) devTimeInput.value = game.time; 
    devStartTime = game.time;
    
    const whip = player.getWeapon(WhipWeapon); 
    if (whip) whip.level = 1;

    ['speed', 'pickup', 'health'].forEach(perkId => {
        const perk = perkPool.find(p => p.id === perkId);
        if (perk && perk.max > 0) {
            perk.apply(gameState, perk); 
            perkLevels[perkId] = 1;
        }
    });

    const autogunPerk = perkPool.find(p => p.id === 'autogun');
    if (autogunPerk) {
        autogunPerk.apply(gameState, autogunPerk); 
        perkLevels['autogun'] = 1;
        ['firerate', 'damage', 'multishot', 'pierce'].forEach(perkId => {
             const perk = perkPool.find(p => p.id === perkId);
             if (perk && perk.max > 0) {
                perk.apply(gameState, perk); 
                perkLevels[perkId] = 1;
             }
        });
    }

    ['orbital', 'nova', 'chainLightning'].forEach(weaponId => {
        const perk = perkPool.find(p => p.id === weaponId);
        if (perk) {
            perk.apply(gameState, perk); 
            perkLevels[weaponId] = 1;
        }
    });
    
    document.getElementById('devLevel').value = game.level;
    document.getElementById('devHealth').value = game.health;
    document.getElementById('devMaxHealth').value = game.maxHealth;
    document.getElementById('devXP').value = game.xp;
    document.getElementById('devWhip').value = whip.level;
    document.getElementById('devAutoGun').value = 1;
    document.getElementById('devOrbital').value = 1;
    document.getElementById('devNova').value = 1;
    document.getElementById('devLightning').value = 1;

    const autoGun = player.getWeapon(AutoGun);
    if (autoGun) {
        document.getElementById('devDamage').value = autoGun.bulletDamage;
        document.getElementById('devFireRate').value = autoGun.fireRate;
        document.getElementById('devMultishot').value = autoGun.multishot;
        document.getElementById('devPierce').value = autoGun.pierce;
    }

    devSettings.presetLoaded = true;
    callStartRun();
}


function applyDevSettings() {
    if (!gameState.game || !gameState.settings || !gameState.player) return;
    
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
    
    devSettings.presetLoaded = true;
    
    if (!game.inMenu || game.manualPause) {
        game.xpNeeded = calculateXpNeeded(game.level);
        
        const whip = player.getWeapon(WhipWeapon);
        const whipLevel = parseInt(document.getElementById('devWhip').value) || 1;
        if (whip && whip.level !== whipLevel) {
            whip.level = 1; 
            const whipPerk = perkPool.find(p => p.id === 'whip');
            for(let i = 1; i < whipLevel; i++) whip.upgrade(whipPerk);
            perkLevels['whip'] = whipLevel - 1;
        }

        let autoGun = player.getWeapon(AutoGun);
        const autoGunLevel = parseInt(document.getElementById('devAutoGun').value) || 0; 
        
        if (autoGunLevel === 0 && autoGun) {
            player.weapons = player.weapons.filter(w => !(w instanceof AutoGun));
            autoGun = null;
            delete perkLevels['autogun']; delete perkLevels['damage']; delete perkLevels['firerate']; delete perkLevels['multishot']; delete perkLevels['pierce'];
        } else if (autoGunLevel === 1 && !autoGun) {
            const autogunPerk = perkPool.find(p => p.id === 'autogun');
            autogunPerk.apply(gameState, autogunPerk);
            autoGun = player.getWeapon(AutoGun); 
            perkLevels['autogun'] = 1;
        }

        if (autoGun) {
            autoGun.bulletDamage = parseInt(document.getElementById('devDamage').value) || (WEAPON_CONFIG.AUTOGUN.BASE_DAMAGE || 1);
            autoGun.fireRate = parseInt(document.getElementById('devFireRate').value) || (WEAPON_CONFIG.AUTOGUN.BASE_FIRE_RATE || 650);
            autoGun.multishot = parseInt(document.getElementById('devMultishot').value) || 0;
            autoGun.pierce = parseInt(document.getElementById('devPierce').value) || 0;
        }

        const orbital = player.getWeapon(OrbitalWeapon);
        const orbitalLevel = parseInt(document.getElementById('devOrbital').value) || 0;
        if (orbitalLevel === 0 && orbital) {
            player.weapons = player.weapons.filter(w => !(w instanceof OrbitalWeapon));
            delete perkLevels['orbital'];
        } else if (orbitalLevel > 0 && !orbital) {
            const perk = perkPool.find(p => p.id === 'orbital');
            for(let i=0; i<orbitalLevel; i++) perk.apply(gameState, perk);
            perkLevels['orbital'] = orbitalLevel;
        } else if (orbital && orbital.level !== orbitalLevel) {
            orbital.level = orbitalLevel;
            orbital.updateStats();
            perkLevels['orbital'] = orbitalLevel;
        }
        
        const nova = player.getWeapon(NovaWeapon);
        const novaLevel = parseInt(document.getElementById('devNova').value) || 0;
         if (novaLevel === 0 && nova) {
            player.weapons = player.weapons.filter(w => !(w instanceof NovaWeapon));
            delete perkLevels['nova'];
        } else if (novaLevel > 0 && !nova) {
            const perk = perkPool.find(p => p.id === 'nova');
            for(let i=0; i<novaLevel; i++) perk.apply(gameState, perk);
            perkLevels['nova'] = novaLevel;
        } else if (nova && nova.level !== novaLevel) {
            nova.level = novaLevel;
            nova.updateStats();
            perkLevels['nova'] = novaLevel;
        }
        
        const lightning = player.getWeapon(ChainLightningWeapon);
        const lightningLevel = parseInt(document.getElementById('devLightning').value) || 0;
         if (lightningLevel === 0 && lightning) {
            player.weapons = player.weapons.filter(w => !(w instanceof ChainLightningWeapon));
            delete perkLevels['chainLightning'];
        } else if (lightningLevel > 0 && !lightning) {
            const perk = perkPool.find(p => p.id === 'chainLightning');
            for(let i=0; i<lightningLevel; i++) perk.apply(gameState, perk);
            perkLevels['chainLightning'] = lightningLevel;
        } else if (lightning && lightning.level !== lightningLevel) {
            lightning.level = 1; 
            const perk = perkPool.find(p => p.id === 'chainLightning');
            for(let i = 1; i < lightningLevel; i++) lightning.upgrade(perk);
            perkLevels['chainLightning'] = lightningLevel - 1;
        }
    }
    
    devSettings.godMode = document.getElementById('devGodMode').checked;
    settings.spawn = parseFloat(document.getElementById('devSpawnRate').value) || GAME_CONFIG.INITIAL_SPAWN_RATE;
    settings.maxEnemies = parseInt(document.getElementById('devMaxEnemies').value) || GAME_CONFIG.MAX_ENEMIES;
    
    const enemySelect = document.getElementById('devEnemyType');
    devSettings.allowedEnemies = Array.from(enemySelect.selectedOptions).map(o => o.value);
    
    const pickupSelect = document.getElementById('devPickupType');
    devSettings.allowedPickups = Array.from(pickupSelect.selectedOptions).map(o => o.value);
    
    showDevConfirmModal('✅ Ustawienia Dev zastosowane!');
    console.log('✅ Ustawienia Dev zastosowane!');
}

function devSpawnPickup(type) {
    if (!gameState.game || !gameState.pickups || !gameState.player) return;
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

function applyDevPreset(level, perkLevelOffset = 0) {
    if (!gameState.game || !gameState.settings || !gameState.player) return;
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
    
    for (let key in perkLevels) delete perkLevels[key];
    
    game.level = level;
    game.time = 121; 
    devSettings.allowedEnemies = ['all'];
    
    game.xp = 0;
    game.xpNeeded = calculateXpNeeded(game.level);
    
    const whip = player.getWeapon(WhipWeapon); 
    const whipPerk = perkPool.find(p => p.id === 'whip');
    const targetWhipLevel = Math.max(1, (whipPerk.max || 5) - perkLevelOffset);
    if (targetWhipLevel > 1) {
        for(let i = 1; i < targetWhipLevel; i++) whip.upgrade(whipPerk);
        perkLevels['whip'] = targetWhipLevel - 1; 
    }

    let autoGun = null;
    const autogunPerk = perkPool.find(p => p.id === 'autogun');
    if (autogunPerk) {
        autogunPerk.apply(gameState, autogunPerk); 
        perkLevels['autogun'] = 1;
        autoGun = player.getWeapon(AutoGun); 
    }
    
    if (autoGun) {
        const perksToApply = ['damage', 'firerate', 'multishot', 'pierce'];
        perksToApply.forEach(perkId => {
            const perk = perkPool.find(p => p.id === perkId);
            const targetLevel = Math.max(0, perk.max - perkLevelOffset);
            for (let i = 0; i < targetLevel; i++) perk.apply(gameState, perk);
            perkLevels[perkId] = targetLevel;
        });
    }
    
    perkPool.forEach(perk => {
        if (['orbital', 'nova', 'chainLightning', 'speed', 'pickup', 'health'].includes(perk.id)) {
             const targetLevel = Math.max(0, perk.max - perkLevelOffset);
             if (targetLevel > 0) {
                 perkLevels[perk.id] = targetLevel;
                 for (let i = 0; i < targetLevel; i++) perk.apply(gameState, perk);
             }
        }
    });
    
    document.getElementById('devLevel').value = game.level;
    document.getElementById('devHealth').value = game.health;
    document.getElementById('devMaxHealth').value = game.maxHealth;
    document.getElementById('devXP').value = game.xp;
    
    const devTimeInput = document.getElementById('devTime');
    if (devTimeInput) devTimeInput.value = game.time; 
    devStartTime = game.time;
    
    document.getElementById('devWhip').value = whip.level;
    document.getElementById('devAutoGun').value = autoGun ? 1 : 0;
    
    if (autoGun) {
        document.getElementById('devDamage').value = autoGun.bulletDamage;
        document.getElementById('devFireRate').value = autoGun.fireRate;
        document.getElementById('devMultishot').value = autoGun.multishot;
        document.getElementById('devPierce').value = autoGun.pierce;
    } else {
        document.getElementById('devDamage').value = WEAPON_CONFIG.AUTOGUN.BASE_DAMAGE || 1;
        document.getElementById('devFireRate').value = WEAPON_CONFIG.AUTOGUN.BASE_FIRE_RATE || 650;
        document.getElementById('devMultishot').value = 0;
        document.getElementById('devPierce').value = 0;
    }
    
    const orbital = player.getWeapon(OrbitalWeapon);
    const nova = player.getWeapon(NovaWeapon);
    const lightning = player.getWeapon(ChainLightningWeapon); 
    document.getElementById('devOrbital').value = orbital ? orbital.level : 0;
    document.getElementById('devNova').value = nova ? nova.level : 0;
    document.getElementById('devLightning').value = lightning ? lightning.level : 0; 
    
    devSettings.presetLoaded = true;
    callStartRun();
}

function devPresetAlmostMax() {
    applyDevPreset(10, 1);
}

function devPresetMax() {
    applyDevPreset(10, 0);
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
    
    console.log('[DEBUG-v0.93] js/services/dev.js: Dev Tools zainicjalizowane.');
}