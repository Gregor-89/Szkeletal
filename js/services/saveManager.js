// ==============
// SAVEMANAGER.JS (v0.79a - Dodanie Bicza do mapy klas)
// Lokalizacja: /js/services/saveManager.js
// ==============

// Import klas bytów potrzebnych do rekonstrukcji stanu
import { Hazard } from '../entities/hazard.js';
import { Chest } from '../entities/chest.js';

// POPRAWKA v0.71: Import 6 podklas pickupów z nowego folderu
import { HealPickup } from '../entities/pickups/healPickup.js';
import { MagnetPickup } from '../entities/pickups/magnetPickup.js';
import { ShieldPickup } from '../entities/pickups/shieldPickup.js';
import { SpeedPickup } from '../entities/pickups/speedPickup.js';
import { BombPickup } from '../entities/pickups/bombPickup.js';
import { FreezePickup } from '../entities/pickups/freezePickup.js';

// POPRAWKA v0.71: Import 3 podklas broni z nowego folderu
import { AutoGun } from '../config/weapons/autoGun.js';
import { OrbitalWeapon } from '../config/weapons/orbitalWeapon.js';
import { NovaWeapon } from '../config/weapons/novaWeapon.js';
// NOWY IMPORT v0.79
import { WhipWeapon } from '../config/weapons/whipWeapon.js'; 

// Import mapy wrogów (zrefaktoryzowane w v0.71)
import { ENEMY_CLASS_MAP } from '../managers/enemyManager.js';
import { initAudio } from './audio.js';
// POPRAWKA v0.77p: Import referencji DOM do tytułu
import { docTitle, titleDiv } from '../ui/domElements.js';

// Mapy klas (przeniesione z main.js)
const PICKUP_CLASS_MAP = {
    heal: HealPickup,
    magnet: MagnetPickup,
    shield: ShieldPickup,
    speed: SpeedPickup,
    bomb: BombPickup,
    freeze: FreezePickup
};

// Mapa klas broni (działa bez zmian)
const WEAPON_CLASS_MAP = {
    AutoGun: AutoGun,
    OrbitalWeapon: OrbitalWeapon,
    NovaWeapon: NovaWeapon,
    WhipWeapon: WhipWeapon // NOWA LINIA v0.79
};

/**
 * Zapisuje aktualny stan gry do obiektu.
 */
export function saveGame(state) {
    const { 
        game, player, settings, perkLevels, enemies, 
        bulletsPool, eBulletsPool, gemsPool, 
        pickups, chests, hazards, enemyIdCounter 
    } = state;
    
    const activeBullets = bulletsPool.activeItems.map(b => ({ ...b }));
    const activeEBullets = eBulletsPool.activeItems.map(eb => ({ ...eb }));
    const activeGems = gemsPool.activeItems.map(g => ({ ...g }));

    const savedState = { 
        game: {...game},
        player: { 
            x: player.x, 
            y: player.y, 
            speed: player.speed, 
            weapons: player.weapons.map(w => w.toJSON ? w.toJSON() : { type: w.constructor.name }) 
        }, 
        settings: {...settings},
        perkLevels: {...perkLevels},
        enemies: enemies.map(e => ({ ...e })), 
        bullets: activeBullets,
        eBullets: activeEBullets,
        gems: activeGems,
        pickups: pickups.map(p => ({ ...p })),
        chests: chests.map(c => ({ ...c })),
        hazards: hazards.map(h => ({ ...h, isMega: h.isMega, scale: h.scale })),
        enemyIdCounter: enemyIdCounter 
    };
    
    console.log('[DEBUG-v0.70] saveManager.js: Gra zapisana.', savedState);
    return savedState;
}

/**
 * Wczytuje zapisany stan gry do aktualnego stanu.
 */
export function loadGame(savedState, state, uiData) {
    if (!savedState) {
        console.error("[saveManager.js] Błąd: Próbowano wczytać pusty stan (savedState is null).");
        return;
    }

    console.log("[DEBUG-v0.70] saveManager.js: Wczytywanie stanu gry...", savedState);

    const { 
        game, player, settings, perkLevels, enemies, 
        bulletsPool, eBulletsPool, gemsPool, 
        particlePool, hitTextPool, 
        pickups, chests, hazards, bombIndicators
    } = state;

    // 1. Resetuj stan (pule i tablice)
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

    // 2. Wczytaj proste obiekty
    Object.assign(game, savedState.game);
    Object.assign(settings, savedState.settings);
    Object.keys(perkLevels).forEach(key => delete perkLevels[key]);
    Object.assign(perkLevels, savedState.perkLevels);

    // 3. Wczytaj Gracza i Bronie
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

    // 4. Wczytaj Byty (Deserializacja)
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
            Object.assign(newBullet, b); 
        }
    }
    
    const loadedEBullets = savedState.eBullets || [];
    for (const eb of loadedEBullets) {
        const newEBullet = eBulletsPool.get(); 
        if (newEBullet) {
            newEBullet.init(eb.x, eb.y, eb.vx, eb.vy, eb.size, eb.damage, eb.color);
            Object.assign(newEBullet, eb);
        }
    }

    const loadedGems = savedState.gems || [];
    for (const g of loadedGems) {
        const newGem = gemsPool.get();
        if(newGem) {
            newGem.init(g.x, g.y, g.r, g.val, g.color);
            Object.assign(newGem, g);
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
    
    // 5. Uruchom grę
    document.getElementById('menuOverlay').style.display='none';
    game.inMenu = false; 
    game.paused = false; 
    game.running = true; 
    
    // POPRAWKA v0.77p: Ustawienie wersji w HTML (brakowało tego tutaj)
    docTitle.textContent = `Szkeletal: Estrone Kiszok v${uiData.VERSION}`;
    titleDiv.textContent = `Szkeletal: Estrone Kiszok v${uiData.VERSION}`;
    
    initAudio();
    
    if (uiData.animationFrameId === null) {
      uiData.startTime = performance.now() - game.time * 1000; 
      uiData.lastTime = performance.now();
      uiData.animationFrameId = requestAnimationFrame(uiData.loopCallback);
    }
    
    console.log("[DEBUG-v0.70] saveManager.js: Wczytywanie zakończone.");
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.71-FIX] js/services/saveManager.js: Zaktualizowano importy broni do 3 oddzielnych plików.');