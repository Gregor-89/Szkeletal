// ==============
// GAMELOGIC.JS (v0.111b - ABRAKADABRA: Restored Entity Splices)
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
import { applyPickupSeparation, spawnConfetti, addHitText } from './utils.js';
import { checkCollisions } from '../managers/collisions.js';
import { HAZARD_CONFIG, SIEGE_EVENT_CONFIG, GAME_CONFIG, WEAPON_CONFIG, HUNGER_CONFIG } from '../config/gameData.js';
import { playSound } from '../services/audio.js';
import { devSettings } from '../services/dev.js';
import { getLang } from '../services/i18n.js';

export function updateCamera(player, camera, canvasWidth, canvasHeight, zoomLevel = 1.0) {
    const zoom = zoomLevel || 1.0;
    const viewW = camera.viewWidth / zoom;
    const viewH = camera.viewHeight / zoom;

    player.x = Math.max(player.size / 2, Math.min(camera.worldWidth - player.size / 2, player.x));
    player.y = Math.max(player.size / 2, Math.min(camera.worldHeight - player.size / 2, player.y));

    let targetX = player.x - viewW / 2;
    let targetY = player.y - viewH / 2;

    // FIX: Bufor krawędzi (150px), aby kamera nie pokazywała "czarnej pustki" nawet przy małym zoomie
    const EDGE_BUFFER = 150;
    targetX = Math.max(0, targetX);
    targetX = Math.min(targetX, camera.worldWidth - viewW - EDGE_BUFFER);
    targetY = Math.max(0, targetY);
    targetY = Math.min(targetY, camera.worldHeight - viewH - EDGE_BUFFER);

    camera.offsetX = Math.round(targetX);
    camera.offsetY = Math.round(targetY);
}

export function updateGame(state, dt, levelUpFn, openChestFn, camera) {
    const {
        player, game, settings, canvas,
        enemies, eBullets, bullets, gems, pickups, stars,
        particles, hitTexts, chests, particlePool, hazards,
        obstacles, hitTextPool
    } = state;

    if (game.paused) return;

    state.killEnemy = (idx, e, game, settings, enemies, particlePool, gemsPool, pickups, enemyIdCounter, chests, fromOrbital, preventDrops) =>
        killEnemy(idx, e, game, settings, enemies, particlePool, gemsPool, pickups, enemyIdCounter, chests, fromOrbital, preventDrops);

    player.update(dt, game, keys, jVec(), camera);
    updateCamera(player, camera, canvas.width, canvas.height, game.zoomLevel);

    if (!devSettings.godMode) {
        game.hunger = Math.max(0, game.hunger - (HUNGER_CONFIG.DECAY_RATE * dt));

        if (game.hunger <= 0) {
            game.starvationTimer += dt;
            if (typeof game.starvationTextCooldown === 'undefined') game.starvationTextCooldown = 0;
            if (game.starvationTextCooldown > 0) game.starvationTextCooldown -= dt;

            if (game.starvationTimer >= HUNGER_CONFIG.STARVATION_TICK) {
                game.health -= HUNGER_CONFIG.STARVATION_DAMAGE;
                game.starvationTimer = 0;
                game.playerHitFlashT = 0.1;
                playSound('PlayerHurt');

                if (game.starvationTextCooldown <= 0) {
                    const warningTxt = getLang('warning_hunger') || "GŁÓD!";
                    addHitText(hitTextPool, hitTexts, player.x, player.y - 20,
                        HUNGER_CONFIG.STARVATION_DAMAGE, '#FF5722', warningTxt, 2.0, player, HUNGER_CONFIG.TEXT_OFFSET_WARNING);
                    game.starvationTextCooldown = 3.0;
                }
            }

            game.quoteTimer -= dt;
            if (game.quoteTimer <= 0) {
                const randIdx = Math.floor(Math.random() * 5) + 1;
                const randomQuote = getLang(`quote_hunger_${randIdx}`);
                if (randomQuote) {
                    addHitText(hitTextPool, hitTexts, player.x, player.y - 60,
                        0, '#FFD700', randomQuote, 5.0, player, HUNGER_CONFIG.TEXT_OFFSET_QUOTE);
                }
                game.quoteTimer = 8.0;
            }
        } else {
            game.starvationTimer = 0;
            game.quoteTimer = 0;
            game.starvationTextCooldown = 0;

            if (typeof game.gameplayQuoteTimer === 'undefined') game.gameplayQuoteTimer = 60;
            if (game.gameplayQuoteTimer > 0) game.gameplayQuoteTimer -= dt;

            if (game.gameplayQuoteTimer <= 0) {
                if (game.health > 0) {
                    const randIdx = Math.floor(Math.random() * 15) + 1;
                    const quote = getLang(`quote_gameplay_${randIdx}`);
                    if (quote) {
                        addHitText(hitTextPool, hitTexts, player.x, player.y - 60,
                            0, '#FFD700', quote, 4.0, player, -50);
                    }
                }
                game.gameplayQuoteTimer = 60 + Math.random() * 10;
            }
        }
    }

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
        }
    }

    getAvailableEnemyTypes(game);

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e) continue;
        if (e.hazardSlowdownT > 0) e.hazardSlowdownT -= dt;
        if (e.dying) {
            e.deathTimer -= dt;
            if (e.deathTimer <= 0) enemies.splice(i, 1);
            continue;
        }
        if (e.type === 'wall' && e.isAutoDead) {
            enemies.splice(i, 1);
            continue;
        }
    }

    if (game.time - settings.lastHazardSpawn > HAZARD_CONFIG.SPAWN_INTERVAL) {
        spawnHazard(hazards, player, camera, obstacles);
        settings.lastHazardSpawn = game.time;
    }

    const minutesElapsed = game.time / 60;
    const dynamicLimit = Math.min(
        settings.maxEnemies,
        GAME_CONFIG.INITIAL_MAX_ENEMIES + (minutesElapsed * GAME_CONFIG.ENEMY_LIMIT_GROWTH_PER_MINUTE)
    );
    game.dynamicEnemyLimit = Math.floor(dynamicLimit);

    if (game.time > GAME_CONFIG.SPAWN_GRACE_PERIOD) {
        const nonWallEnemiesCount = enemies.filter(e => e && e.type !== 'wall' && !e.dying).length;
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

    if (!settings.siegeState) settings.siegeState = 'idle';
    const activeWalls = enemies.some(e => e.type === 'wall');

    if (settings.siegeState === 'active') {
        if (!activeWalls) {
            settings.siegeState = 'idle';
            const nextDelay = 100 + Math.random() * 200;
            settings.currentSiegeInterval = game.time + nextDelay;
        }
    }
    else if (activeWalls && settings.siegeState === 'idle') {
        settings.siegeState = 'active';
        settings.currentSiegeInterval = Infinity;
    }

    if (settings.siegeState === 'idle' && game.time >= settings.currentSiegeInterval) {
        settings.siegeState = 'warning';
        settings.siegeWarningT = SIEGE_EVENT_CONFIG.SIEGE_WARNING_TIME;
        state.enemyIdCounter = spawnSiegeRing(state);
        settings.lastSiegeEvent = game.time;
        settings.currentSiegeInterval = Infinity;
    }

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

    for (const e of enemies) {
        if (!e || e.dying) continue;
        e.update(dt, player, game, state);
        e.applySeparation(dt, enemies);
    }

    // POCISKI GRACZA (Z Cullingiem)
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!b) { bullets.splice(i, 1); continue; }

        b.update(dt);

        // Culling pocisków (v0.111)
        if (b.active && b.isOffScreen && b.isOffScreen(camera, game)) {
            b.release();
        }

        if (!b.active) {
            if (bullets[i] === b) bullets.splice(i, 1);
        }
    }

    // POCISKI WROGÓW (Z Cullingiem)
    for (let i = eBullets.length - 1; i >= 0; i--) {
        const eb = eBullets[i];
        if (!eb) { eBullets.splice(i, 1); continue; }

        eb.update(dt);

        // Culling pocisków wrogów (v0.111)
        if (eb.active && eb.isOffScreen && eb.isOffScreen(camera, game)) {
            eb.release();
        }

        if (eb.lastTrailTime === undefined) eb.lastTrailTime = 0;
        eb.lastTrailTime += dt;

        let trailInterval = 0.1;
        if (eb.type === 'bottle') {
            trailInterval = WEAPON_CONFIG.RANGED_ENEMY_BULLET.TRAIL_INTERVAL;
            if (eb.lastTrailTime >= trailInterval) {
                eb.lastTrailTime = 0;
                const p = particlePool.get();
                if (p) p.init(eb.x, eb.y, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, 0.1, '#29b6f6', 0, 1.0, 2);
            }
        }
        else if (eb.type === 'axe') {
            const axeConfig = WEAPON_CONFIG.LUMBERJACK_AXE;
            trailInterval = axeConfig.TRAIL_INTERVAL || 0.015;
            if (eb.lastTrailTime >= trailInterval) {
                eb.lastTrailTime = 0;
                const p = particlePool.get();
                if (p) {
                    const hue = (game.time * 800) % 360;
                    const opacity = axeConfig.TRAIL_OPACITY || 0.25;
                    const rainbowColor = `hsla(${hue}, 100%, 60%, ${opacity})`;
                    const size = axeConfig.TRAIL_SIZE || 22;
                    const offset = axeConfig.TRAIL_OFFSET || 40;
                    const trailX = eb.x + Math.cos(eb.rotation - Math.PI / 2) * offset;
                    const trailY = eb.y + Math.sin(eb.rotation - Math.PI / 2) * offset;
                    p.init(trailX, trailY, 0, 0, 0.4, rainbowColor, 0, 1.0, size);
                }
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
        if (!g.active) { if (gems[i] === g) gems.splice(i, 1); }
    }

    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        if (!p) { pickups.splice(i, 1); continue; }
        p.update(dt, player);
        if (p.isDead()) { if (pickups[i] === p) pickups.splice(i, 1); }
    }
    applyPickupSeparation(pickups, canvas);

    for (const c of chests) if (c) c.update(dt);

    for (let i = hazards.length - 1; i >= 0; i--) {
        const h = hazards[i];
        if (!h) { hazards.splice(i, 1); continue; }
        h.update(dt);
        if (h.isDead()) { if (hazards[i] === h) hazards.splice(i, 1); }
    }

    // --- FIX ABRAKADABRA: Przywrócone pełne pętle z splice dla cząsteczek i tekstów ---
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!p) { particles.splice(i, 1); continue; }
        p.update(dt);
        // Poprawka: Usunięcie z tablicy jeśli nieaktywne (v0.111b)
        if (!p.active) particles.splice(i, 1);
    }
    for (let i = hitTexts.length - 1; i >= 0; i--) {
        const ht = hitTexts[i];
        if (!ht) { hitTexts.splice(i, 1); continue; }
        ht.update(dt);
        // Poprawka: Usunięcie z tablicy jeśli nieaktywne (v0.111b)
        if (!ht.active) hitTexts.splice(i, 1);
    }

    for (let i = 0; i < stars.length; i++) if (stars[i]) stars[i].t = (stars[i].t || 0) + dt;

    state.dt = dt;
    for (const w of player.weapons) if (w) w.update(state);

    checkCollisions(state);

    if (game.xp >= game.xpNeeded) {
        game.paused = true;
        spawnConfetti(state.particlePool, player.x, player.y);
        levelUpFn();
    }

    if (game.triggerChestOpen) {
        game.triggerChestOpen = false;
        openChestFn();
        spawnConfetti(state.particlePool, player.x, player.y);
    }
}