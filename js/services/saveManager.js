// ==============
// SAVEMANAGER.JS (v1.09c - Restore Game Visibility Fix)
// Lokalizacja: /js/services/saveManager.js
// ==============

import { Hazard } from '../entities/hazard.js';
import { Chest } from '../entities/chest.js';

import { HealPickup } from '../entities/pickups/healPickup.js';
import { MagnetPickup } from '../entities/pickups/magnetPickup.js';
import { ShieldPickup } from '../entities/pickups/shieldPickup.js';
import { SpeedPickup } from '../entities/pickups/speedPickup.js';
import { BombPickup } from '../entities/pickups/bombPickup.js';
import { FreezePickup } from '../entities/pickups/freezePickup.js';

import { AutoGun } from '../config/weapons/autoGun.js';
import { OrbitalWeapon } from '../config/weapons/orbitalWeapon.js';
import { NovaWeapon } from '../config/weapons/novaWeapon.js';
import { WhipWeapon } from '../config/weapons/whipWeapon.js'; 
import { ChainLightningWeapon } from '../config/weapons/chainLightningWeapon.js';

import { ENEMY_CLASS_MAP } from '../managers/enemyManager.js';
import { initAudio, playSound } from './audio.js';
import { titleDiv } from '../ui/domElements.js';

const SAVE_KEY = 'szkeletal_savegame';

const PICKUP_CLASS_MAP = {
    heal: HealPickup,
    magnet: MagnetPickup,
    shield: ShieldPickup,
    speed: SpeedPickup,
    bomb: BombPickup,
    freeze: FreezePickup
};

const WEAPON_CLASS_MAP = {
    AutoGun: AutoGun,
    OrbitalWeapon: OrbitalWeapon,
    NovaWeapon: NovaWeapon,
    WhipWeapon: WhipWeapon,
    ChainLightningWeapon: ChainLightningWeapon 
};

function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
}

function safeJsonParse(str, fallback) {
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch (e) {
        console.warn("[SaveManager] Wykryto uszkodzony JSON zapisu, próbuję naprawić...", e);
        try {
            const sanitized = str.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
            return JSON.parse(sanitized);
        } catch (e2) {
            console.error("[SaveManager] Nie udało się naprawić zapisu gry. Zwracam fallback.", e2);
            return fallback;
        }
    }
}

export function getSavedGameFromStorage() {
    const raw = localStorage.getItem(SAVE_KEY);
    return safeJsonParse(raw, null);
}

export function clearSavedGame() {
    localStorage.removeItem(SAVE_KEY);
    console.log('[SaveManager] Zapis gry usunięty.');
}

export function saveGame(state) {
    try {
        const { 
            game, player, settings, perkLevels, enemies, 
            bulletsPool, eBulletsPool, gemsPool, 
            pickups, chests, hazards, enemyIdCounter 
        } = state;
        
        let shadowData = {};
        if (game._getShadows) shadowData = game._getShadows();

        const activeBullets = bulletsPool.activeItems.map(b => ({
            x: b.x, y: b.y, vx: b.vx, vy: b.vy, size: b.size, 
            damage: b.damage, color: b.color, pierce: b.pierce
        }));

        const activeEBullets = eBulletsPool.activeItems.map(eb => ({
            x: eb.x, y: eb.y, vx: eb.vx, vy: eb.vy, size: eb.size, 
            damage: eb.damage, color: eb.color
        }));

        const activeGems = gemsPool.activeItems.map(g => ({
            x: g.x, y: g.y, r: g.r, val: g.val, color: g.color
        }));

        const savedState = { 
            game: {
                score: game.score,
                level: game.level,
                xp: game.xp,
                xpNeeded: game.xpNeeded,
                health: game.health,
                maxHealth: game.maxHealth,
                time: game.time,
                hyper: game.hyper,
                zoomLevel: game.zoomLevel || 1.0, 
                hunger: game.hunger,
                totalKills: game.totalKills,
                seenEnemyTypes: [...(game.seenEnemyTypes || [])]
            },
            integrity: shadowData,
            
            player: { 
                x: player.x, 
                y: player.y, 
                speed: player.speed, 
                weapons: player.weapons.map(w => {
                    return w.toJSON ? w.toJSON() : { type: w.constructor.name };
                }) 
            }, 
            settings: { ...settings },
            perkLevels: { ...perkLevels },
            enemies: enemies.map(e => ({
                type: e.type, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp, 
                id: e.id, stats: e.stats, visualScale: e.visualScale
            })), 
            pickups: pickups.map(p => ({ type: p.type, x: p.x, y: p.y })),
            chests: chests.map(c => ({ x: c.x, y: c.y })),
            hazards: hazards.map(h => ({ x: h.x, y: h.y, isMega: h.isMega, scale: h.scale, life: h.life })),
            bullets: activeBullets,
            eBullets: activeEBullets,
            gems: activeGems,
            enemyIdCounter: enemyIdCounter 
        };
        
        const jsonStr = JSON.stringify(savedState);
        localStorage.setItem(SAVE_KEY, jsonStr);
        console.log('[SaveManager] Gra zapisana pomyślnie.');
        
        return savedState;
    } catch (e) {
        console.error('[SaveManager] Błąd krytyczny zapisu:', e);
        return null;
    }
}

export async function loadGame(savedStateInput, state, uiData, autoResume = true) {
    let savedState = savedStateInput;
    if (!savedState) {
        savedState = getSavedGameFromStorage();
    }

    if (!savedState) {
        console.warn("[SaveManager] Brak zapisu do wczytania.");
        return;
    }

    const { 
        game, player, settings, perkLevels, enemies, 
        bulletsPool, eBulletsPool, gemsPool, 
        particlePool, hitTextPool, 
        pickups, chests, hazards, bombIndicators
    } = state;

    enemies.length = 0;
    pickups.length = 0;
    chests.length = 0;
    hazards.length = 0;
    bombIndicators.length = 0;
    bulletsPool.releaseAll();
    eBulletsPool.releaseAll();
    gemsPool.releaseAll();
    particlePool.releaseAll();
    hitTextPool.releaseAll();

    Object.assign(game, savedState.game);
    Object.assign(settings, savedState.settings);
    
    const savedZoom = localStorage.getItem('szkeletal_zoom');
    if (savedZoom) {
        game.zoomLevel = parseInt(savedZoom) / 100;
    }

    Object.keys(perkLevels).forEach(key => delete perkLevels[key]);
    Object.assign(perkLevels, savedState.perkLevels);
    
    if (savedState.integrity && game._setShadows) {
        game._setShadows(
            savedState.integrity.s, 
            savedState.integrity.h, 
            savedState.integrity.c
        );
    }

    player.x = savedState.player.x;
    player.y = savedState.player.y;
    player.speed = savedState.player.speed;
    player.weapons = [];
    const loadedWeapons = savedState.player.weapons || [];
    for (const savedWeapon of loadedWeapons) {
        const WeaponClass = WEAPON_CLASS_MAP[savedWeapon.type];
        if (WeaponClass) {
            const newWeapon = new WeaponClass(player);
            Object.assign(newWeapon, savedWeapon); 
            player.weapons.push(newWeapon);
        }
    }

    const loadedEnemies = savedState.enemies || [];
    for (const savedEnemy of loadedEnemies) {
        const EnemyClass = ENEMY_CLASS_MAP[savedEnemy.type];
        if (EnemyClass && savedEnemy.stats) {
            const newEnemy = new EnemyClass(savedEnemy.x, savedEnemy.y, savedEnemy.stats, 1); 
            Object.assign(newEnemy, savedEnemy);
            enemies.push(newEnemy);
        }
    }
    
    const loadedBullets = savedState.bullets || [];
    for (const b of loadedBullets) {
        const newBullet = bulletsPool.get(); 
        if (newBullet) {
            newBullet.init(b.x, b.y, b.vx, b.vy, b.size, b.damage, b.color, b.pierce);
        }
    }
    
    const loadedEBullets = savedState.eBullets || [];
    for (const eb of loadedEBullets) {
        const newEBullet = eBulletsPool.get(); 
        if (newEBullet) {
            newEBullet.init(eb.x, eb.y, eb.vx, eb.vy, eb.size, eb.damage, eb.color);
        }
    }

    const loadedGems = savedState.gems || [];
    for (const g of loadedGems) {
        const newGem = gemsPool.get();
        if(newGem) {
            newGem.init(g.x, g.y, g.r, g.val, g.color);
        }
    }
    
    const loadedHazards = savedState.hazards || [];
    for (const h of loadedHazards) {
        const newHazard = new Hazard(h.x, h.y, h.isMega, h.scale);
        Object.assign(newHazard, h);
        hazards.push(newHazard);
    }

    const loadedPickups = savedState.pickups || [];
    for (const p of loadedPickups) {
        const PickupClass = PICKUP_CLASS_MAP[p.type];
        if (PickupClass) {
            const newPickup = new PickupClass(p.x, p.y);
            Object.assign(newPickup, p); 
            pickups.push(newPickup);
        }
    }
    
    const loadedChests = savedState.chests || [];
    for (const c of loadedChests) {
        const newChest = new Chest(c.x, c.y);
        Object.assign(newChest, c); 
        chests.push(newChest);
    }
    
    state.enemyIdCounter = savedState.enemyIdCounter || 0;
    
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay) menuOverlay.style.display = 'none';

    // FIX v0.110l: Przywrócenie widoczności planszy gry
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) gameContainer.style.display = 'flex';
    
    game.inMenu = false; 
    
    if (autoResume) {
        game.paused = false; 
        game.running = true; 
    } else {
        game.paused = true;
        game.running = true; // Still running loop, but paused logic
    } 
    
    const newTitle = `Szkeletal: Ziemniaczkowy Głód Estrogenowego Drakula v${uiData.VERSION}`;
    document.title = newTitle;
    if(titleDiv) titleDiv.textContent = newTitle;
    
    initAudio();
    playSound('MusicStop');
    
    setTimeout(() => {
        if (game.running && !game.inMenu) {
            playSound('MusicGameplay');
        }
    }, 100);
    
    if (uiData.animationFrameId === null) {
      uiData.startTime = performance.now() - game.time * 1000; 
      uiData.lastTime = performance.now();
      uiData.animationFrameId = requestAnimationFrame(uiData.loopCallback);
    }
    
    console.log("[SaveManager] Gra załadowana pomyślnie.");
}