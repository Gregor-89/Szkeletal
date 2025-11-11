// ==============
// DEV.JS (v0.81f - Aktualizacja Dev Menu dla Bicza/AutoGuna)
// Lokalizacja: /js/services/dev.js
// ==============

import { findFreeSpotForPickup } from '../core/utils.js';
import { perkPool } from '../config/perks.js';
import { PLAYER_CONFIG, GAME_CONFIG, WEAPON_CONFIG } from '../config/gameData.js';

// POPRAWKA v0.71: Import 3 podklas broni z nowego folderu
import { AutoGun } from '../config/weapons/autoGun.js';
import { OrbitalWeapon } from '../config/weapons/orbitalWeapon.js';
import { NovaWeapon } from '../config/weapons/novaWeapon.js';
// NOWY IMPORT v0.81f
import { WhipWeapon } from '../config/weapons/whipWeapon.js';

// POPRAWKA v0.74: Import mapy z managera efektów
import { PICKUP_CLASS_MAP } from '../managers/effects.js';
// POPRAWKA v0.77v: Usunięto 'btnConfirmNo' z importu, aby uniknąć błędu stałej
import { confirmOverlay, confirmText, btnConfirmYes } from '../ui/domElements.js'; // NOWY IMPORT

/**
 * Eksportowana zmienna przechowująca docelowy czas startu.
 * Zostanie użyta w ui.js do skorygowania timera.
 */
export let devStartTime = 0;

/**
 * NOWA FUNKCJA (v0.76d): Resetuje czas startowy dewelopera.
 * Musi być wywoływana przez eventManager przy starcie nowej gry.
 */
export function resetDevTime() {
    devStartTime = 0;
}


/**
 * Eksportowane ustawienia deweloperskie.
 */
export const devSettings = {
    godMode: false,
    allowedEnemies: ['all'],
    allowedPickups: ['all'],
    presetLoaded: false
};

// Wewnętrzna referencja do stanu gry i funkcji startu
let gameState = {};
// POPRAWKA v0.76e: Rozdzielenie callbacków
let loadConfigCallback = () => {};
let startRunCallback = () => {};

// Funkcja obliczająca XP potrzebne na dany poziom
function calculateXpNeeded(level) {
    let xp = GAME_CONFIG.INITIAL_XP_NEEDED || 5;
    for (let i = 1; i < level; i++) {
        xp = Math.floor(xp * GAME_CONFIG.XP_GROWTH_FACTOR) + GAME_CONFIG.XP_GROWTH_ADD;
    }
    return xp;
}

// NOWA FUNKCJA v0.75: Pokazuje prosty modal z wiadomością
function showDevConfirmModal(text) {
    // POPRAWKA v0.77v: Pobierz btnConfirmNo jako zmienną lokalną 'let'
    let btnConfirmNo = document.getElementById('btnConfirmNo');
    
    if (!confirmOverlay || !confirmText || !btnConfirmYes || !btnConfirmNo) return;
    
    // Tymczasowe ustawienie modala na wiadomość potwierdzającą
    confirmText.textContent = text;
    confirmOverlay.style.display = 'flex';
    
    btnConfirmYes.style.display = 'none';
    
    // Klonowanie przycisku "No", aby usunąć stare listenery
    let newBtnNo = btnConfirmNo.cloneNode(true);
    newBtnNo.textContent = 'OK';
    btnConfirmNo.parentNode.replaceChild(newBtnNo, btnConfirmNo);
    btnConfirmNo = newBtnNo; // Aktualizacja referencji (teraz działa, bo to 'let')
    
    // Ustawienie timera na automatyczne zniknięcie po 1.5s
    const timerId = setTimeout(() => {
        confirmOverlay.style.display = 'none';
        btnConfirmYes.style.display = 'inline-block';
        btnConfirmNo.textContent = 'Anuluj';
    }, 1500);
    
    // Zabezpieczenie przed kliknięciem, które czyści timer
    btnConfirmNo.onclick = () => {
        clearTimeout(timerId);
        confirmOverlay.style.display = 'none';
        btnConfirmYes.style.display = 'inline-block';
        // Musimy znaleźć oryginalny przycisk "No" w DOM, aby przywrócić mu tekst
        let originalBtnNo = document.getElementById('btnConfirmNo');
        if (originalBtnNo) originalBtnNo.textContent = 'Anuluj';
    };
}


/**
 * Funkcja wywołująca start gry
 * POPRAWKA v0.76e: Musi teraz wywołać oba callbacki
 */
function callStartRun() {
    if (gameState.game.inMenu || !gameState.game.running) {
        // 1. Wczytaj konfigurację UI (np. etykiety pickupów)
        loadConfigCallback();
        // 2. Uruchom grę (co wywoła resetAll)
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
    
    const { game, settings, player, perkLevels } = gameState;
    
    // --- LOGIKA CZASU (Zawsze Ustawiana) ---
    const devTimeInput = document.getElementById('devTime');
    if (devTimeInput) {
        devStartTime = parseInt(devTimeInput.value) || 0;
        // Jeśli gra już działa/jest w pauzie, ustawiamy czas natychmiast (i timery)
        if (!game.inMenu || game.manualPause) {
            game.time = devStartTime;
            settings.lastElite = game.time;
            settings.lastSiegeEvent = game.time;
        }
    }
    
    // POPRAWKA v0.75: Ustawienie HP/Max HP/Level/XP jest UNCONDITIONAL
    game.health = parseInt(document.getElementById('devHealth').value) || PLAYER_CONFIG.INITIAL_HEALTH;
    game.maxHealth = parseInt(document.getElementById('devMaxHealth').value) || PLAYER_CONFIG.INITIAL_HEALTH;
    game.level = parseInt(document.getElementById('devLevel').value) || 1;
    game.xp = parseInt(document.getElementById('devXP').value) || 0;
    
    // POPRAWKA v0.75: Ustawienie flagi, by zablokować pełny reset w resetAll()
    devSettings.presetLoaded = true;
    
    if (!game.inMenu || game.manualPause) {
        // Obliczenia zależne od poziomu
        game.xpNeeded = calculateXpNeeded(game.level);
        
        // --- LOGIKA BRONI (v0.81f) ---
        
        // 1. BICZ (Zawsze istnieje)
        const whip = player.getWeapon(WhipWeapon);
        const whipLevel = parseInt(document.getElementById('devWhip').value) || 1;
        if (whip && whip.level !== whipLevel) {
            whip.level = 1; // Reset
            const whipPerk = perkPool.find(p => p.id === 'whip');
            for(let i = 1; i < whipLevel; i++) {
                whip.upgrade(whipPerk); // Ulepszaj poziom po poziomie
            }
            perkLevels['whip'] = whipLevel - 1;
        }

        // 2. AUTOGUN (Opcjonalny)
        let autoGun = player.getWeapon(AutoGun);
        const autoGunLevel = parseInt(document.getElementById('devAutoGun').value) || 0; // 0 lub 1
        
        if (autoGunLevel === 0 && autoGun) {
            // Usuń AutoGun
            player.weapons = player.weapons.filter(w => !(w instanceof AutoGun));
            autoGun = null;
            delete perkLevels['autogun'];
            delete perkLevels['damage'];
            delete perkLevels['firerate'];
            delete perkLevels['multishot'];
            delete perkLevels['pierce'];
        } else if (autoGunLevel === 1 && !autoGun) {
            // Dodaj AutoGun
            const autogunPerk = perkPool.find(p => p.id === 'autogun');
            autogunPerk.apply(gameState, autogunPerk);
            autoGun = player.getWeapon(AutoGun); // Pobierz nową instancję
            perkLevels['autogun'] = 1;
        }

        // Ustaw statystyki AutoGuna (jeśli istnieje)
        if (autoGun) {
            autoGun.bulletDamage = parseInt(document.getElementById('devDamage').value) || (WEAPON_CONFIG.AUTOGUN.BASE_DAMAGE || 1);
            autoGun.fireRate = parseInt(document.getElementById('devFireRate').value) || (WEAPON_CONFIG.AUTOGUN.BASE_FIRE_RATE || 650);
            autoGun.multishot = parseInt(document.getElementById('devMultishot').value) || 0;
            autoGun.pierce = parseInt(document.getElementById('devPierce').value) || 0;
            // Uwaga: Nie przeliczamy perkLevels wstecz z tych wartości
        }

        // 3. INNE BRONIE (Orbital, Nova)
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
 * POPRAWKA v0.81f: Zaktualizowano logikę dla Bicza (bazowy) i AutoGuna (opcjonalny).
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
    game.time = 121; // Ustawienie czasu na potrzeby presetu (może zostać nadpisane przez devTime)
    devSettings.allowedEnemies = ['all'];
    
    game.xp = 0;
    game.xpNeeded = calculateXpNeeded(game.level);
    
    // --- Nowa logika presetów v0.81f ---
    
    // 1. BICZ (Bazowy)
    const whip = player.getWeapon(WhipWeapon); // Ma Lvl 1 po resecie
    const whipPerk = perkPool.find(p => p.id === 'whip');
    const targetWhipLevel = Math.max(1, (whipPerk.max || 5) - perkLevelOffset);
    if (targetWhipLevel > 1) {
        for(let i = 1; i < targetWhipLevel; i++) { // Zaczynamy od 1, bo Lvl 1 już jest
            whip.upgrade(whipPerk);
        }
        perkLevels['whip'] = targetWhipLevel - 1; // (Lvl 5 -> 4 ulepszenia)
    }

    // 2. AUTOGUN (Opcjonalny)
    let autoGun = null;
    const autogunPerk = perkPool.find(p => p.id === 'autogun');
    if (autogunPerk) {
        autogunPerk.apply(gameState, autogunPerk); // Dodaje AutoGun (Lvl 1)
        perkLevels['autogun'] = 1;
        autoGun = player.getWeapon(AutoGun); // Pobierz instancję
    }
    
    // Ulepsz AutoGun (jeśli istnieje)
    if (autoGun) {
        const perksToApply = ['damage', 'firerate', 'multishot', 'pierce'];
        perksToApply.forEach(perkId => {
            const perk = perkPool.find(p => p.id === perkId);
            const targetLevel = Math.max(0, perk.max - perkLevelOffset);
            for (let i = 0; i < targetLevel; i++) {
                perk.apply(gameState, perk);
            }
            perkLevels[perkId] = targetLevel;
        });
    }
    
    // 3. INNE BRONIE (Bez zmian)
    perkPool.forEach(perk => {
        if (perk.id === 'orbital' || perk.id === 'nova') {
             const targetLevel = Math.max(0, perk.max - perkLevelOffset);
             if (targetLevel > 0) {
                 perkLevels[perk.id] = targetLevel;
                 for (let i = 0; i < targetLevel; i++) {
                     perk.apply(gameState, perk);
                 }
             }
        } else if (['speed', 'pickup', 'health'].includes(perk.id)) {
            // Statystyki pasywne (bez zmian)
            const targetLevel = Math.max(0, perk.max - perkLevelOffset);
             if (targetLevel > 0) {
                 perkLevels[perk.id] = targetLevel;
                 for (let i = 0; i < targetLevel; i++) {
                     perk.apply(gameState, perk);
                 }
             }
        }
    });
    // --- Koniec nowej logiki ---
    
    // Zaktualizuj UI Dev Menu, aby pasowało do presetu
    document.getElementById('devLevel').value = game.level;
    document.getElementById('devHealth').value = game.health;
    document.getElementById('devMaxHealth').value = game.maxHealth;
    document.getElementById('devXP').value = game.xp;
    
    const devTimeInput = document.getElementById('devTime');
    if (devTimeInput) devTimeInput.value = game.time; 
    devStartTime = game.time;
    
    // Zaktualizuj UI Broni
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
    document.getElementById('devOrbital').value = orbital ? orbital.level : 0;
    document.getElementById('devNova').value = nova ? nova.level : 0;
    
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
 * POPRAWKA v0.76e: Przyjmuje dwa callbacki
 */
export function initDevTools(stateRef, loadConfigFn, startRunFn) {
    gameState = stateRef;
    loadConfigCallback = loadConfigFn;
    startRunCallback = startRunFn;
    
    window.applyDevSettings = applyDevSettings;
    window.devSpawnPickup = devSpawnPickup;
    window.devPresetAlmostMax = devPresetAlmostMax;
    window.devPresetMax = devPresetMax;
    
    console.log('[DEBUG-v0.76e] js/services/dev.js: Dev Tools zainicjalizowane z dwoma callbackami (loadConfig/startRun).');
}