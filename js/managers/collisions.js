// ==============
// COLLISIONS.JS (v1.28d - ABRAKADABRA FIX: Full Logic & Shrine Interaction)
// Lokalizacja: /js/managers/collisions.js
// ==============

import { checkCircleCollision, addHitText, limitedShake, spawnConfetti } from '../core/utils.js';
import { killEnemy } from './enemyManager.js';
import { playSound } from '../services/audio.js';
import { devSettings } from '../services/dev.js';
import { HAZARD_CONFIG, MAP_CONFIG, WEAPON_CONFIG } from '../config/gameData.js';
import { getLang } from '../services/i18n.js';
import { PICKUP_CLASS_MAP } from './effects.js';
import { LeaderboardService } from '../services/leaderboard.js';

/**
 * Tworzy efekt rozbryzgu cząsteczek przy trafieniu.
 */
function spawnRainbowSplash(particlePool, x, y, count = 20) {
    for (let k = 0; k < count; k++) {
        const p = particlePool.get();
        if (p) {
            const hue = Math.random() * 360;
            const color = `hsl(${hue}, 100%, 60%)`;
            p.init(x, y, (Math.random() - 0.5) * 400, (Math.random() - 0.5) * 400, 0.5 + Math.random() * 0.3, color, 0, 0.94, 4 + Math.random() * 4);
        }
    }
}

/**
 * Główna funkcja sprawdzająca kolizje w świecie gry.
 */
export function checkCollisions(state) {
    const {
        player, enemies, bullets, eBullets, gems, pickups,
        game, settings, particlePool, gemsPool, hitTextPool, hitTexts,
        chests, hazards, bombIndicators, obstacles
    } = state;

    // Resetowanie stanów wrogów na początku klatki
    for (let i = 0; i < enemies.length; i++) {
        if (enemies[i]) {
            enemies[i].inMegaHazard = false;
            enemies[i].inWater = false;
        }
    }

    game.playerInHazard = false;
    game.playerInMegaHazard = false;
    game.playerInWater = false;
    game.collisionSlowdown = 0;

    // --- PRZESZKODY I MAPA (Kapliczki, Woda, Drzewa) ---
    if (obstacles) {
        for (const obs of obstacles) {
            if (obs.isDead) continue;

            const dx = player.x - obs.x;
            const dy = player.y - obs.y;
            const distSq = dx * dx + dy * dy;

            // --- LOGIKA KAPLICZKI (Naprawa Etap 2 - FIX LECZENIA) ---
            if (obs.type === 'shrine') {
                const stats = MAP_CONFIG.OBSTACLE_STATS.shrine;
                // Margines interakcji: musi być większy niż fizyczny hitbox (obs.hitboxRadius), 
                // aby gracz mógł "dosunąć" się do obiektu i wywołać leczenie.
                const interactionRadius = obs.hitboxRadius + 45;

                if (distSq < interactionRadius * interactionRadius) {
                    const cooldown = stats.cooldown || 120;
                    // Aktywacja tylko gdy gracz jest ranny i kapliczka gotowa
                    if (game.health < game.maxHealth) {
                        if (game.time >= obs.lastUsedTime + cooldown) {
                            obs.lastUsedTime = game.time;
                            const heal = stats.healAmount || 999;
                            const oldHp = game.health;
                            game.health = Math.min(game.maxHealth, game.health + heal);
                            const healedAmount = Math.ceil(game.health - oldHp);

                            playSound('HealPickup');

                            // Poprawka tekstu (używamy snake_heal_text zgodnie z pamięcią użytkownika)
                            const shrineTxt = getLang('snake_heal_text') || "Rzyć wylizana, sytość odzyskana";
                            addHitText(hitTextPool, hitTexts, player.x, player.y - 50, 0, "#FFD700", shrineTxt, 5.0, player, stats.textOffset || -85);
                            addHitText(hitTextPool, hitTexts, player.x, player.y - 30, healedAmount, "#00FF00", "+HP", 2.0);

                            // Efekt wizualny
                            for (let k = 0; k < 25; k++) {
                                const p = particlePool.get();
                                if (p) p.init(obs.x, obs.y, (Math.random() - 0.5) * 350, (Math.random() - 0.5) * 350, 1.2, '#FFD700', 0, 0.94, 5);
                            }
                        }
                    }
                }
            }

            const minDist = obs.hitboxRadius + (player.size * 0.4);
            if (distSq < minDist * minDist) {
                if (obs.isSolid) {
                    const dist = Math.sqrt(distSq);
                    const angle = Math.atan2(dy, dx);
                    const push = minDist - dist;
                    player.x += Math.cos(angle) * push;
                    player.y += Math.sin(angle) * push;
                }
                if (obs.isSlow) game.playerInWater = true;
            }

            // Kolizje wrogów z przeszkodami
            if (obs.isSolid || obs.isSlow) {
                const checkEnemyRadius = obs.hitboxRadius + 100;
                for (const e of enemies) {
                    if (e.dying) continue;
                    const edx = e.x - obs.x;
                    const edy = e.y - obs.y;
                    if (Math.abs(edx) > checkEnemyRadius || Math.abs(edy) > checkEnemyRadius) continue;
                    const eDistSq = edx * edx + edy * edy;
                    const eMinDist = obs.hitboxRadius + (e.size * 0.4);
                    if (eDistSq < eMinDist * eMinDist) {
                        if (obs.isSolid) {
                            const eDist = Math.sqrt(eDistSq);
                            const angle = Math.atan2(edy, edx);
                            const push = (eMinDist - eDist) * 0.5;
                            e.x += Math.cos(angle) * push;
                            e.y += Math.sin(angle) * push;
                        }
                        if (obs.isSlow && e.type !== 'wall') e.inWater = true;
                    }
                }
            }
        }

        // --- ATAKI OBSZAROWE BRONI NA PRZESZKODY ---
        if (player.weapons) {
            for (const w of player.weapons) {
                if (w.items && w.items.length > 0) {
                    const weaponStrikeId = w.currentStrikeId || null;
                    for (const item of w.items) {
                        const bx = item.ox;
                        const by = item.oy;
                        for (const obs of obstacles) {
                            if (obs.isDead || obs.isRuined || obs.hp === Infinity) continue;
                            if (checkCircleCollision(bx, by, 20, obs.x, obs.y, obs.hitboxRadius)) {
                                const dmg = w.damage || 10;
                                const destroyed = obs.takeDamage(dmg, 'player', weaponStrikeId, game.time);
                                if (destroyed !== false) {
                                    if (w.onItemHit) w.onItemHit(item); // FIX: Flash przy trafieniu w przeszkodę
                                    addHitText(hitTextPool, hitTexts, obs.x, obs.y - 20, dmg, '#fff');
                                    playSound('Hit');
                                    if (destroyed === true) {
                                        game.score += 10;
                                        spawnConfetti(particlePool, obs.x, obs.y);
                                        playSound('Explosion');
                                        const gemCount = 5 + Math.floor(Math.random() * 4);
                                        for (let k = 0; k < gemCount; k++) {
                                            const gem = gemsPool.get();
                                            if (gem) gem.init(obs.x + (Math.random() - 0.5) * 40, obs.y + (Math.random() - 0.5) * 40, 5, 5, '#81C784');
                                        }
                                        if (Math.random() < obs.dropChance) {
                                            const dropType = Math.random() < 0.3 ? 'chest' : 'heal';
                                            const PickupClass = PICKUP_CLASS_MAP[dropType];
                                            if (PickupClass) pickups.push(new PickupClass(obs.x, obs.y));
                                        }
                                    }
                                }
                            }
                        }
                        // Kolizja z przeciwnikami dla Orbital/Nova
                        for (let j = enemies.length - 1; j >= 0; j--) {
                            const e = enemies[j];
                            if (!e || e.isDead || (weaponStrikeId && e.lastStrikeId === weaponStrikeId)) continue;
                            if (checkCircleCollision(bx, by, 20, e.x, e.y, e.size * 0.6)) {
                                if (weaponStrikeId) e.lastStrikeId = weaponStrikeId;
                                const dmg = w.damage || 10;
                                const isDead = e.takeDamage(dmg, 'player');
                                addHitText(hitTextPool, hitTexts, e.x, e.y, dmg);
                                playSound('Hit');
                                if (e.type !== 'wall' && e.type !== 'tank') {
                                    const angle = Math.atan2(e.y - by, e.x - bx);
                                    e.applyKnockback(Math.cos(angle) * 150, Math.sin(angle) * 150);
                                }
                                if (w.onItemHit) w.onItemHit(item);
                                if (isDead) state.enemyIdCounter = killEnemy(j, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, true);
                            }
                        }
                    }
                }
            }
        }
    }

    // --- BOMB INDICATORS / SHOCKWAVE ---
    for (let b of bombIndicators) {
        if (b.type === 'shockwave') {
            const progress = Math.min(1, b.life / b.maxLife);
            const currentRadius = b.maxRadius * progress;
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (b.hitEnemies.includes(e.id)) continue;
                const dx = b.x - e.x; const dy = b.y - e.y;
                const distSq = dx * dx + dy * dy;
                const hitDist = currentRadius + e.size;
                if (distSq < hitDist * hitDist) {
                    b.hitEnemies.push(e.id);
                    e.takeDamage(b.damage, 'shockwave');
                    addHitText(hitTextPool, hitTexts, e.x, e.y - 20, b.damage, '#ff9800');
                    if (e.hp <= 0) state.enemyIdCounter = killEnemy(j, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, false, false);
                    else { const angle = Math.atan2(dy, dx); e.applyKnockback(Math.cos(angle) * 300, Math.sin(angle) * 300); }
                }
            }
            if (obstacles) {
                for (const obs of obstacles) {
                    if (obs.isDead || obs.isRuined || obs.hp === Infinity) continue;
                    const dx = b.x - obs.x; const dy = b.y - obs.y;
                    if (dx * dx + dy * dy < (currentRadius + obs.hitboxRadius) ** 2) {
                        if (obs.takeDamage(50, 'player', 'bomb_' + b.id, game.time)) {
                            game.score += 10;
                            spawnConfetti(particlePool, obs.x, obs.y); playSound('Explosion');
                        }
                    }
                }
            }
        }
    }

    // --- KOLIZJE GRACZ-WRÓG ---
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (!enemy || enemy.isDead) continue;
        if (checkCircleCollision(player.x, player.y, player.size * 0.4, enemy.x, enemy.y, enemy.size * 0.4)) {
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            const isInvulnerable = game.shield || devSettings.godMode;
            if (enemy.type === 'snakeEater') {
                if (enemy.tryHealPlayer(game, player, hitTextPool, hitTexts)) {
                    playSound('HealPickup'); spawnConfetti(particlePool, enemy.x, enemy.y);
                }
            } else {
                if (!isInvulnerable) {
                    const now = performance.now();
                    if (!enemy.lastPlayerCollision || now - enemy.lastPlayerCollision > 500) {
                        enemy.lastPlayerCollision = now;
                        const dmg = (enemy.type === 'kamikaze' ? 15 : enemy.damage);
                        game.health -= dmg; game.playerHitFlashT = 0.15;
                        addHitText(hitTextPool, hitTexts, player.x, player.y - 20, dmg, '#FF0000');
                        playSound('PlayerHurt'); limitedShake(game, settings, 5, 100);
                    }
                }
                const pushDir = (enemy.type === 'wall') ? 5 : 2;
                player.x += Math.cos(angle) * pushDir; player.y += Math.sin(angle) * pushDir;
                if (enemy.type !== 'wall') {
                    const enemyPush = isInvulnerable ? 15 : 3;
                    enemy.x -= Math.cos(angle) * enemyPush; enemy.y -= Math.sin(angle) * enemyPush;
                }
                if (enemy.type === 'kamikaze') {
                    spawnConfetti(particlePool, enemy.x, enemy.y); playSound('Explosion');
                    state.enemyIdCounter = killEnemy(i, enemy, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, false, false);
                }
            }
        }
    }

    // --- POCISKI GRACZA ---
    const MAX_BULLET_DIST_SQ = (3500 / (game.zoomLevel || 1.0)) ** 2;
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!b) continue;
        const distSq = (b.x - player.x) ** 2 + (b.y - player.y) ** 2;
        if (distSq > MAX_BULLET_DIST_SQ || (typeof b.isOffScreen === 'function' && b.isOffScreen(state.camera, game))) {
            b.release(); continue;
        }
        if (obstacles) {
            let hitObs = false;
            for (const obs of obstacles) {
                if (obs.isDead || obs.isRuined || obs.hp === Infinity) continue;
                if (checkCircleCollision(b.x, b.y, b.size, obs.x, obs.y, obs.hitboxRadius)) {
                    const res = obs.takeDamage(b.damage, 'player', b.strikeId || null, game.time);
                    if (res === false && b.strikeId) continue;
                    hitObs = true;
                    addHitText(hitTextPool, hitTexts, obs.x, obs.y - 20, b.damage, '#fff');
                    playSound('Hit');
                    if (res === true) {
                        game.score += 10;
                        spawnConfetti(particlePool, obs.x, obs.y); playSound('Explosion');
                        const gemCount = 5 + Math.floor(Math.random() * 4);
                        for (let k = 0; k < gemCount; k++) {
                            const gem = gemsPool.get();
                            if (gem) gem.init(obs.x + (Math.random() - 0.5) * 40, obs.y + (Math.random() - 0.5) * 40, 5, 5, '#81C784');
                        }
                    }
                    if (b.pierce > 0) { b.pierce--; b.flashT = 0.15; } // FIX: Flash przy przebiciu przeszkody (czas 0.15s)
                    else { b.release(); break; }
                }
            }
            if (hitObs && !bullets[i]) continue;
        }
        let hitEnemy = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (!e || e.isDead || b.lastEnemyHitId === e.id) continue;
            if (b.strikeId && e.lastStrikeId === b.strikeId) continue;
            if (checkCircleCollision(b.x, b.y, b.size, e.x, e.y, e.size * 0.6)) {
                hitEnemy = true;
                const isDead = e.takeDamage(b.damage, 'player');
                if (b.strikeId) e.lastStrikeId = b.strikeId;
                addHitText(hitTextPool, hitTexts, e.x, e.y, b.damage);
                playSound('Hit');
                if (e.type !== 'wall' && e.type !== 'tank') {
                    const angle = Math.atan2(e.y - b.y, e.x - b.x);
                    const kbForce = (b.damage + 20) * 8 * (b.type === 'orbital' ? 3.0 : 1.0);
                    e.applyKnockback(Math.cos(angle) * kbForce, Math.sin(angle) * kbForce);
                }
                const p = particlePool.get();
                if (p) p.init(b.x, b.y, Math.random() * 100 - 50, Math.random() * 100 - 50, 0.2, b.color, 0, 0.9, 3);
                if (isDead) state.enemyIdCounter = killEnemy(j, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, b.type === 'orbital');
                if (b.pierce > 0) { b.pierce--; b.lastEnemyHitId = e.id; b.flashT = 0.15; hitEnemy = false; } // FIX: Flash przy przebiciu (czas 0.15s)
                else if (b.bouncesLeft > 0) { b.bouncesLeft--; b.lastEnemyHitId = e.id; b.vx = -b.vx; b.vy = -b.vy; b.flashT = 0.15; hitEnemy = false; }
                if (hitEnemy) break;
            }
        }
        if (hitEnemy) b.release();
    }

    // --- POCISKI WROGÓW ---
    if (!game.shield && !devSettings.godMode) {
        for (let i = eBullets.length - 1; i >= 0; i--) {
            const eb = eBullets[i];
            if (!eb) continue;
            if (typeof eb.isOffScreen === 'function' && eb.isOffScreen(state.camera, game)) { eb.release(); continue; }
            if (checkCircleCollision(eb.x, eb.y, eb.size, player.x, player.y, player.size / 2)) {
                game.health -= eb.damage; game.playerHitFlashT = 0.1;
                addHitText(hitTextPool, hitTexts, player.x, player.y, eb.damage, '#FF0000');
                playSound('PlayerHurt');
                if (eb.type === 'axe') spawnRainbowSplash(particlePool, eb.x, eb.y, WEAPON_CONFIG.LUMBERJACK_AXE.IMPACT_PARTICLE_COUNT || 30);
                eb.release();
            }
            if (obstacles) {
                for (const obs of obstacles) {
                    if (obs.isDead || obs.isRuined) continue;
                    if (checkCircleCollision(eb.x, eb.y, eb.size, obs.x, obs.y, obs.hitboxRadius)) { eb.release(); break; }
                }
            }
        }
    }

    // --- ZBIERANIE PRZEDMIOTÓW ---
    const collectionRadius = 35;
    for (let i = gems.length - 1; i >= 0; i--) {
        const g = gems[i];
        if (!g || g.delay > 0 || g.isCollected) continue;
        const dx = player.x - g.x; const dy = player.y - g.y;
        if (game.magnet || (dx * dx + dy * dy) < (game.pickupRange * game.pickupRange)) g.magnetized = true;
        if ((dx * dx + dy * dy) < (collectionRadius + g.r) ** 2) {
            game.xp += Math.floor(g.val * (game.level >= 20 ? 1.2 : 1));
            game.score += 1; game.hunger = 100; playSound('XPPickup'); g.collect();
            LeaderboardService.trackStat('potatoes_collected', 1);
        }
    }
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        if (!p) continue;
        const dx = player.x - p.x; const dy = player.y - p.y;
        if ((dx * dx + dy * dy) < (game.pickupRange * game.pickupRange)) p.isMagnetized = true;
        if ((dx * dx + dy * dy) < (collectionRadius + 10) ** 2) {
            p.applyEffect(state); playSound('Pickup');
            addHitText(hitTextPool, hitTexts, player.x, player.y - 20, 0, '#FFF', (p.getLabel ? p.getLabel() : "Bonus"));
            pickups.splice(i, 1);
        }
    }
    for (let i = chests.length - 1; i >= 0; i--) {
        const c = chests[i];
        if (!c) continue;
        const dx = player.x - c.x; const dy = player.y - c.y;
        if ((dx * dx + dy * dy) < (collectionRadius + 20) ** 2) { chests.splice(i, 1); game.triggerChestOpen = true; }
    }

    // --- ZAGROŻENIA ŚRODOWISKOWE (Szambo) ---
    if (!game.hazardTicker) game.hazardTicker = 0;
    game.hazardTicker -= state.dt;

    for (const h of hazards) {
        if (!h || !h.isActive()) continue;
        const isMega = h.scale > 1.5;

        if (h.checkCollision(player.x, player.y, player.size * 0.4)) {
            game.playerInHazard = true;
            if (isMega) game.playerInMegaHazard = true;

            if (!game.shield && !devSettings.godMode && game.hazardTicker <= 0) {
                game.health -= h.damage * 0.5;
                game.playerHitFlashT = 0.15;
                addHitText(hitTextPool, hitTexts, player.x, player.y - 10, h.damage * 0.5, '#00AA00');
                playSound('PlayerHurt');
            }
        }

        const hazardRadiusSq = h.r * h.r;
        for (const g of gems) {
            if (g.active && ((g.x - h.x) ** 2 + (g.y - h.y) ** 2) < hazardRadiusSq) {
                g.hazardDecayT = Math.min(1.0, (g.hazardDecayT || 0) + HAZARD_CONFIG.HAZARD_PICKUP_DECAY_RATE * state.dt);
            }
        }
        for (const p of pickups) {
            if (((p.x - h.x) ** 2 + (p.y - h.y) ** 2) < hazardRadiusSq) {
                p.inHazardDecayT = Math.min(1.0, (p.inHazardDecayT || 0) + HAZARD_CONFIG.HAZARD_PICKUP_DECAY_RATE * state.dt);
            }
        }
        // FIX ABRAKADABRA: Przywrócono gnicie skrzyń w szambie
        for (const c of chests) {
            if (((c.x - h.x) ** 2 + (c.y - h.y) ** 2) < hazardRadiusSq) {
                c.hazardDecayT = Math.min(1.0, (c.hazardDecayT || 0) + (HAZARD_CONFIG.HAZARD_CHEST_DECAY_RATE || 0.067) * state.dt);
            }
        }

        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (e && !e.isDead && !['elite', 'wall', 'snakeEater'].includes(e.type) && h.checkCollision(e.x, e.y, e.size * 0.4)) {
                e.hazardSlowdownT = 0.2;
                if (isMega) e.inMegaHazard = true;

                if (!e.hazardTicker) e.hazardTicker = Math.random() * 0.5;
                e.hazardTicker -= state.dt;

                if (e.hazardTicker <= 0) {
                    if (e.takeDamage(h.enemyDamage * 0.5, 'hazard')) {
                        state.enemyIdCounter = killEnemy(i, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, false, false);
                    } else {
                        addHitText(hitTextPool, hitTexts, e.x, e.y - 10, h.enemyDamage * 0.5, '#90EE90');
                    }
                    e.hazardTicker = 0.5;
                }
            }
        }
    }

    if (game.hazardTicker <= 0) game.hazardTicker = 0.5;
}