// ==============
// SAVEMANAGER.JS (v0.70 - Refaktoryzacja: Naprawa brakujących importów)
// Lokalizacja: /js/services/saveManager.js
// ==============

// Import klas bytów potrzebnych do rekonstrukcji stanu
import { Hazard } from '../entities/hazard.js';
import { Chest } from '../entities/chest.js';
import { 
    HealPickup, MagnetPickup, ShieldPickup, 
    SpeedPickup, BombPickup, FreezePickup 
} from '../entities/pickup.js';
// POPRAWKA v0.70: Import klas broni (wcześniej w main.js)
import { AutoGun, OrbitalWeapon, NovaWeapon } from '../config/weapon.js';
// POPRAWKA v0.70: Import mapy wrogów (wcześniej w main.js)
import { ENEMY_CLASS_MAP } from '../managers/enemyManager.js';
import { initAudio } from './audio.js';

// Mapy klas (przeniesione z main.js)
const PICKUP_CLASS_MAP = {
    heal: HealPickup,
    magnet: MagnetPickup,
    shield: ShieldPickup,
    speed: SpeedPickup,
    bomb: BombPickup,
    freeze: FreezePickup
};

// POPRAWKA v0.70: Mapa klas broni (przeniesiona z main.js)
const WEAPON_CLASS_MAP = {
    AutoGun: AutoGun,
    OrbitalWeapon: OrbitalWeapon,
    NovaWeapon: NovaWeapon
};

/**
 * Zapisuje aktualny stan gry do obiektu.
 * (Logika przeniesiona z eventu btnPauseMenu w main.js)
 * @param {object} state - Główny obiekt gameStateRef.
 * @returns {object} Obiekt stanu gry gotowy do zapisania.
 */
export function saveGame(state) {
    const { 
        game, player, settings, perkLevels, enemies, 
        bulletsPool, eBulletsPool, gemsPool, 
        pickups, chests, hazards, enemyIdCounter 
    } = state;
    
    // Zapisz tylko aktywne obiekty z pul
    const activeBullets = bulletsPool.activeItems.map(b => ({ ...b }));
    const activeEBullets = eBulletsPool.activeItems.map(eb => ({ ...eb }));
    const activeGems = gemsPool.activeItems.map(g => ({ ...g }));

    const savedState = { 
        game: {...game},
        player: { 
            x: player.x, 
            y: player.y, 
            speed: player.speed, 
            weapons: player.weapons.map(w => w.toJSON ? w.toJSON() : { type: w.constructor.name }) // Użyj toJSON jeśli dostępne
        }, 
        settings: {...settings},
        perkLevels: {...perkLevels},
        enemies: enemies.map(e => ({ ...e })), // Zakładamy, że wróg jest prostym obiektem
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
 * (Logika przeniesiona z eventu btnContinue w main.js)
 * @param {object} savedState - Obiekt zapisany przez saveGame().
 * @param {object} state - Główny obiekt gameStateRef, który ma być nadpisany.
 * @param {object} uiData - Obiekt uiData do zarządzania pętlą gry.
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
    // Użyj 'replace' lub 'clear+assign' dla perkLevels, aby uniknąć problemów z referencją
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
            // Zastosuj zapisane właściwości (poziom, obrażenia bazowe itp.)
            Object.assign(newWeapon, savedWeapon); 
            player.weapons.push(newWeapon);
        }
    }

    // 4. Wczytaj Byty (Deserializacja)
    
    // Wrogowie
    const loadedEnemies = savedState.enemies || [];
    for (const savedEnemy of loadedEnemies) {
        const EnemyClass = ENEMY_CLASS_MAP[savedEnemy.type];
        if (EnemyClass && savedEnemy.stats) {
            // Użyj hpScale = 1, ponieważ HP jest już zapisane
            const newEnemy = new EnemyClass(savedEnemy.x, savedEnemy.y, savedEnemy.stats, 1); 
            Object.assign(newEnemy, savedEnemy);
            enemies.push(newEnemy);
        }
    }
    
    // Pociski Gracza (z puli)
    const loadedBullets = savedState.bullets || [];
    for (const b of loadedBullets) {
        const newBullet = bulletsPool.get(); 
        if (newBullet) {
            newBullet.init(b.x, b.y, b.vx, b.vy, b.size, b.damage, b.color, b.pierce);
            Object.assign(newBullet, b); 
        }
    }
    
    // Pociski Wrogów (z puli)
    const loadedEBullets = savedState.eBullets || [];
    for (const eb of loadedEBullets) {
        const newEBullet = eBulletsPool.get(); 
        if (newEBullet) {
            newEBullet.init(eb.x, eb.y, eb.vx, eb.vy, eb.size, eb.damage, eb.color);
            Object.assign(newEBullet, eb);
        }
    }

    // Gemy (z puli)
    const loadedGems = savedState.gems || [];
    for (const g of loadedGems) {
        const newGem = gemsPool.get();
        if(newGem) {
            newGem.init(g.x, g.y, g.r, g.val, g.color);
            Object.assign(newGem, g);
        }
    }
    
    // Hazardy (tablica)
    const loadedHazards = savedState.hazards || [];
    for (const h of loadedHazards) {
        const newHazard = new Hazard(h.x, h.y, h.isMega, h.scale);
        Object.assign(newHazard, h);
        hazards.push(newHazard);
    }

    // Pickupy (tablica)
    const loadedPickups = savedState.pickups || [];
    for (const p of loadedPickups) {
        const PickupClass = PICKUP_CLASS_MAP[p.type];
        if (PickupClass) {
            const newPickup = new PickupClass(p.x, p.y);
            Object.assign(newPickup, p); 
            pickups.push(newPickup);
        }
    }
    
    // Skrzynie (tablica)
    const loadedChests = savedState.chests || [];
    for (const c of loadedChests) {
        const newChest = new Chest(c.x, c.y);
        Object.assign(newChest, c); 
        chests.push(newChest);
    }
    
    state.enemyIdCounter = savedState.enemyIdCounter || 0;
    
    // 5. Uruchom grę (logika przeniesiona z main.js)
    document.getElementById('menuOverlay').style.display='none';
    game.inMenu = false; 
    game.paused = false; 
    game.running = true; 
    
    initAudio();
    
    if (uiData.animationFrameId === null) {
      uiData.startTime = performance.now() - game.time * 1000; 
      uiData.lastTime = performance.now();
      // Resetuj także te zmienne (z main.js)
      // (Będą one musiały być dostępne w uiData lub przekazane inaczej)
      // Na potrzeby refaktoryzacji zakładamy, że uiData przechowuje te referencje
      uiData.lastFrameTime = performance.now();
      uiData.frameCount = 0;
      uiData.fps = 0;
      uiData.animationFrameId = requestAnimationFrame(uiData.loopCallback);
    }
    
    console.log("[DEBUG-v0.70] saveManager.js: Wczytywanie zakończone.");
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.70] js/services/saveManager.js: Załadowano moduł Menedżera Zapisu.');