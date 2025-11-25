// ==============
// GAMELOGIC.JS (v0.94y - FIX: Smart Siege Intervals)
// Lokalizacja: /js/core/gameLogic.js
// ==============

import { keys, jVec } from '../ui/input.js';
import { 
    spawnEnemy, 
    spawnElite, 
    spawnSiegeRing, 
    spawnWallEnemies, 
    killEnemy, 
    getAvailableEnemyTypes 
} from '../managers/enemyManager.js'; 
import { spawnHazard } from '../managers/effects.js';
import { applyPickupSeparation, spawnConfetti } from './utils.js'; 
import { checkCollisions } from '../managers/collisions.js';
import { HAZARD_CONFIG, SIEGE_EVENT_CONFIG, GAME_CONFIG, WEAPON_CONFIG } from '../config/gameData.js';

export function updateCamera(player, camera, canvasWidth, canvasHeight) {
    player.x = Math.max(player.size / 2, Math.min(camera.worldWidth - player.size / 2, player.x));
    player.y = Math.max(player.size / 2, Math.min(camera.worldHeight - player.size / 2, player.y));
    
    let targetX = player.x - camera.viewWidth / 2;
    let targetY = player.y - camera.viewHeight / 2;
    
    targetX = Math.max(0, targetX);
    targetX = Math.min(targetX, camera.worldWidth - camera.viewWidth);
    targetY = Math.max(0, targetY);
    targetY = Math.min(targetY, camera.worldHeight - camera.viewHeight);

    camera.offsetX = Math.round(targetX);
    camera.offsetY = Math.round(targetY);
}

export function updateGame(state, dt, levelUpFn, openChestFn, camera) {
    const { 
        player, game, settings, canvas,
        enemies, eBullets, bullets, gems, pickups, stars,
        particles, hitTexts, chests, particlePool, hazards 
    } = state;

    state.killEnemy = (idx, e, game, settings, enemies, particlePool, gemsPool, pickups, enemyIdCounter, chests, fromOrbital, preventDrops) => 
        killEnemy(idx, e, game, settings, enemies, particlePool, gemsPool, pickups, enemyIdCounter, chests, fromOrbital, preventDrops);

    player.update(dt, game, keys, jVec(), camera); 
    updateCamera(player, camera, canvas.width, canvas.height);

    if (game.magnet) { game.magnetT -= dt; if (game.magnetT <= 0) game.magnet = false; }
    if (game.shield) { game.shieldT -= dt; if (game.shieldT <= 0) game.shield = false; }
    if (game.speedT > 0) game.speedT -= dt;
    if (game.freezeT > 0) game.freezeT -= dt;
    if (game.playerHitFlashT > 0) game.playerHitFlashT -= dt;
    
    if (game.newEnemyWarningT > 0) {
        game.newEnemyWarningT -= dt;
        if (game.newEnemyWarningT <= 0) {
            game.seenEnemyTypes.push(game.newEnemyWarningType);
            game.newEnemyWarningType = null;
            console.log(`[LOGIC] Ostrzeżenie minęło. Nowy typ wroga odblokowany.`);
        }
    }
    
    getAvailableEnemyTypes(game);

    for (let i = enemies.length - 1; i >= 0; i--) { 
        const e = enemies[i];
        if (!e) continue;

        if (e.hazardSlowdownT > 0) e.hazardSlowdownT -= dt;

        if (e.type === 'wall' && e.isAutoDead) {
            enemies.splice(i, 1);
            continue;
        }
    }
    
    if (game.time - settings.lastHazardSpawn > HAZARD_CONFIG.SPAWN_INTERVAL) {
        spawnHazard(hazards, player, camera);
        settings.lastHazardSpawn = game.time;
    }

    const minutesElapsed = game.time / 60;
    const dynamicLimit = Math.min(
        settings.maxEnemies, 
        GAME_CONFIG.INITIAL_MAX_ENEMIES + (minutesElapsed * GAME_CONFIG.ENEMY_LIMIT_GROWTH_PER_MINUTE)
    );
    game.dynamicEnemyLimit = Math.floor(dynamicLimit);

    if (game.time > GAME_CONFIG.SPAWN_GRACE_PERIOD) {
        const nonWallEnemiesCount = enemies.filter(e => e && e.type !== 'wall').length;
        const spawnRate = settings.spawn * (game.hyper ? 1.25 : 1) * (1 + 0.15 * (game.level - 1)) * (1 + game.time / 60);
        
        const isWarningActive = game.newEnemyWarningT > 0;
        const isSiegeActive = (settings.siegeState === 'warning');

        if (!isWarningActive && !isSiegeActive && Math.random() < spawnRate && nonWallEnemiesCount < game.dynamicEnemyLimit) { 
            state.enemyIdCounter = spawnEnemy(enemies, game, canvas, state.enemyIdCounter, camera);
        }

        const timeSinceLastElite = game.time - settings.lastElite;
        if (!isWarningActive && !isSiegeActive && timeSinceLastElite > (settings.eliteInterval / (game.hyper ? 1.15 : 1))) { 
            state.enemyIdCounter = spawnElite(enemies, game, canvas, state.enemyIdCounter, camera);
            settings.lastElite = game.time;
        }
    }
    
    // 10. EVENT OBLĘŻENIA (SIEGE) - FIX: Random Interval AFTER wave ends
    
    // Inicjalizacja stanu (jeśli brak)
    if (!settings.siegeState) settings.siegeState = 'idle';

    const activeWalls = enemies.some(e => e.type === 'wall');

    // 1. Wykrywanie końca oblężenia
    if (settings.siegeState === 'active') {
        if (!activeWalls) {
            settings.siegeState = 'idle';
            // Losowy czas: 100 - 300 sekund
            const nextDelay = 100 + Math.random() * 200;
            settings.currentSiegeInterval = game.time + nextDelay;
            console.log(`[LOGIC] Siege Defeated! Next wave in: ${nextDelay.toFixed(1)}s`);
        }
    }
    // Zabezpieczenie: Jeśli mamy ściany ale stan to idle (np. po wczytaniu gry), przełącz na active
    else if (activeWalls && settings.siegeState === 'idle') {
        settings.siegeState = 'active';
        settings.currentSiegeInterval = Infinity; 
    }

    // 2. Sprawdzanie timera (tylko w stanie idle)
    if (settings.siegeState === 'idle' && game.time >= settings.currentSiegeInterval) {
        // Start Warning Phase
        settings.siegeState = 'warning';
        settings.siegeWarningT = SIEGE_EVENT_CONFIG.SIEGE_WARNING_TIME;
        
        state.enemyIdCounter = spawnSiegeRing(state); 
        settings.lastSiegeEvent = game.time;
        settings.currentSiegeInterval = Infinity; // Blokujemy timer
        
        console.log(`[LOGIC] Siege Warning Started!`);
    }

    // 3. Obsługa Warning Phase
    if (settings.siegeState === 'warning') {
        if (settings.siegeWarningT > 0) {
            settings.siegeWarningT -= dt;
            if (settings.siegeWarningT <= 0) {
                state.enemyIdCounter = spawnWallEnemies(state); 
                settings.siegeWarningT = 0;
                settings.siegeState = 'active'; 
            }
        }
    }

    // 11. PĘTLE AKTUALIZACJI

    for (const e of enemies) {
        if (!e) continue; 
        e.update(dt, player, game, state); 
        e.applySeparation(dt, enemies);
    }
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!b) { bullets.splice(i, 1); continue; }

        b.update(dt);
        if (!b.active) {
            if (bullets[i] === b) bullets.splice(i, 1);
        }
    }
    
    for (let i = eBullets.length - 1; i >= 0; i--) {
        const eb = eBullets[i];
        if (!eb) { eBullets.splice(i, 1); continue; }

        eb.update(dt);
        
        if (eb.type === 'bottle') {
            if (eb.lastTrailTime === undefined) eb.lastTrailTime = 0; 
            eb.lastTrailTime += dt;
            if (eb.lastTrailTime >= WEAPON_CONFIG.RANGED_ENEMY_BULLET.TRAIL_INTERVAL) {
                eb.lastTrailTime = 0;
                const p = particlePool.get();
                if (p) p.init(eb.x, eb.y, (Math.random()-0.5)*80, (Math.random()-0.5)*80, 0.1, '#29b6f6', 0, 1.0, 2);
            }
        }

        if (!eb.active) {
            if (eBullets[i] === eb) eBullets.splice(i, 1);
        }
    }
    
    for (let i = gems.length - 1; i >= 0; i--) {
        const g = gems[i];
        if (!g) { gems.splice(i, 1); continue; }

        g.update(player, game, dt);
        if (!g.active) {
            if (gems[i] === g) gems.splice(i, 1);
        }
    }

    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        if (!p) { pickups.splice(i, 1); continue; }

        p.update(dt, player);
        if (p.isDead()) {
            if (pickups[i] === p) pickups.splice(i, 1);
        }
    }
    applyPickupSeparation(pickups, canvas);
    
    for (const c of chests) {
        if (c) c.update(dt);
    }

    for (let i = hazards.length - 1; i >= 0; i--) { 
        const h = hazards[i];
        if (!h) { hazards.splice(i, 1); continue; }

        h.update(dt);
        if (h.isDead()) {
            if (hazards[i] === h) hazards.splice(i, 1);
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!p) { particles.splice(i, 1); continue; }
        p.update(dt);
    }
    
    for (let i = hitTexts.length - 1; i >= 0; i--) {
        const ht = hitTexts[i];
        if (!ht) { hitTexts.splice(i, 1); continue; }
        ht.update(dt);
    }

    for (let i = 0; i < stars.length; i++) { 
        if (stars[i]) stars[i].t = (stars[i].t || 0) + dt; 
    }

    if (game.xp >= game.xpNeeded) {
        levelUpFn(); 
    }

    state.dt = dt; 
    for (const w of player.weapons) {
        if (w) w.update(state);
    }

    checkCollisions(state); 

    if (game.triggerChestOpen) {
        game.triggerChestOpen = false; 
        openChestFn(); 
        spawnConfetti(state.particlePool, player.x, player.y);
    }
}