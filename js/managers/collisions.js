// ==============
// COLLISIONS.JS (v0.94v - FIX: Hazard Loot Decay Restored)
// Lokalizacja: /js/managers/collisions.js
// ==============

import { checkCircleCollision, addHitText, limitedShake, spawnConfetti } from '../core/utils.js';
import { killEnemy } from './enemyManager.js';
import { playSound } from '../services/audio.js';
import { devSettings } from '../services/dev.js';
import { COLLISION_CONFIG, HAZARD_CONFIG } from '../config/gameData.js'; 
import { getLang } from '../services/i18n.js';

export function checkCollisions(state) {
    const { 
        player, enemies, bullets, eBullets, gems, pickups, 
        game, settings, particlePool, gemsPool, hitTextPool, hitTexts,
        chests, hazards 
    } = state;

    game.playerInHazard = false;
    game.collisionSlowdown = 0;

    // 1. KOLIZJA GRACZ - WROGOWIE
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (!enemy || enemy.isDead) continue;
        
        if (checkCircleCollision(player.x, player.y, player.size * 0.4, enemy.x, enemy.y, enemy.size * 0.4)) {
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            const isInvulnerable = game.shield || devSettings.godMode;

            if (!isInvulnerable) {
                const now = performance.now();
                if (!enemy.lastPlayerCollision || now - enemy.lastPlayerCollision > 500) {
                     enemy.lastPlayerCollision = now;
                     const dmg = (enemy.type === 'kamikaze' ? 15 : enemy.damage);
                     game.health -= dmg;
                     game.playerHitFlashT = 0.15; 
                     addHitText(hitTextPool, hitTexts, player.x, player.y - 20, dmg, '#FF0000');
                     playSound('PlayerHurt');
                     limitedShake(game, settings, 5, 100);
                }
            }

            // Fizyka (zawsze aktywna)
            if (enemy.type === 'wall') {
                game.collisionSlowdown = COLLISION_CONFIG.WALL_COLLISION_SLOWDOWN || 0.75;
                player.x += Math.cos(angle) * 5; 
                player.y += Math.sin(angle) * 5;
            } else {
                game.collisionSlowdown = 0.1; 
                player.x += Math.cos(angle) * 2; 
                player.y += Math.sin(angle) * 2;
                
                const pushForce = isInvulnerable ? 15 : 3;
                enemy.x -= Math.cos(angle) * pushForce;
                enemy.y -= Math.sin(angle) * pushForce;
            }

            if (enemy.type === 'kamikaze') {
                 spawnConfetti(particlePool, enemy.x, enemy.y); 
                 playSound('Explosion'); 
                 state.enemyIdCounter = killEnemy(i, enemy, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, false, false);
                 continue; 
            }
        }
    }
    
    // 2. POCISKI GRACZA
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!b) continue;
        if (typeof b.isOffScreen === 'function' && b.isOffScreen(state.camera)) { b.release(); continue; }
        
        let hitEnemy = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (!e || e.isDead) continue; 
            if (b.lastEnemyHitId === e.id && b.pierce > 0) continue; 

            if (checkCircleCollision(b.x, b.y, b.size, e.x, e.y, e.size * 0.6)) {
                hitEnemy = true;
                const isDead = e.takeDamage(b.damage, 'player');
                addHitText(hitTextPool, hitTexts, e.x, e.y, b.damage);
                playSound('Hit');

                if (e.type !== 'wall' && e.type !== 'tank') {
                    const angle = Math.atan2(e.y - b.y, e.x - b.x);
                    const isOrbital = (b.type === 'orbital');
                    const kbMultiplier = isOrbital ? 3.0 : 1.0;
                    const kbForce = (b.damage + 20) * 8 * kbMultiplier; 
                    e.applyKnockback(Math.cos(angle) * kbForce, Math.sin(angle) * kbForce);
                }
                
                const p = particlePool.get();
                if (p) p.init(b.x, b.y, Math.random()*100-50, Math.random()*100-50, 0.2, b.color, 0, 0.9, 3);

                if (isDead) {
                    state.enemyIdCounter = killEnemy(j, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, b.type === 'orbital');
                }

                if (b.pierce > 0) {
                    b.pierce--;
                    b.lastEnemyHitId = e.id; 
                    hitEnemy = false; 
                } else {
                    if (b.bouncesLeft > 0) {
                        b.bouncesLeft--;
                        b.lastEnemyHitId = e.id;
                        b.vx = -b.vx + (Math.random() - 0.5) * 100;
                        b.vy = -b.vy + (Math.random() - 0.5) * 100;
                        hitEnemy = false; 
                    }
                }
                if (hitEnemy) break; 
            }
        }
        if (hitEnemy) b.release(); 
    }

    // 2b. POCISKI WROGA
    if (!game.shield && !devSettings.godMode) {
        for (let i = eBullets.length - 1; i >= 0; i--) {
            const eb = eBullets[i];
            if (!eb) continue;
            if (typeof eb.isOffScreen === 'function' && eb.isOffScreen(state.camera)) { eb.release(); continue; }
            if (checkCircleCollision(eb.x, eb.y, eb.size, player.x, player.y, player.size / 2)) {
                game.health -= eb.damage;
                game.playerHitFlashT = 0.1;
                addHitText(hitTextPool, hitTexts, player.x, player.y, eb.damage, '#FF0000');
                playSound('PlayerHurt');
                eb.release(); 
            }
        }
    }

    // 3. PICKUPY / GEMY
    const collectionRadius = 35;
    for (let i = gems.length - 1; i >= 0; i--) {
        const g = gems[i];
        if (!g || g.delay > 0) continue; 
        
        // Jeśli zatonął w bagnie -> usuń
        if (g.isDecayedByHazard && g.isDecayedByHazard()) { g.release(); continue; }

        const dist = Math.hypot(player.x - g.x, player.y - g.y);
        if (dist < game.pickupRange + (game.magnet ? 150 : 0)) g.magnetized = true;
        if (dist < collectionRadius + g.r) {
            game.xp += g.val * (game.level >= 20 ? 1.2 : 1); 
            playSound('XPPickup');
            g.release(); 
        }
    }
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        if (!p) continue;
        if (p.isDecayed && p.isDecayed()) { pickups.splice(i, 1); continue; }
        const dist = Math.hypot(player.x - p.x, player.y - p.y);
        if (dist < game.pickupRange + (game.magnet ? 150 : 0)) p.isMagnetized = true; 
        if (dist < collectionRadius + 10) {
            p.applyEffect(state); 
            playSound('Pickup');
            const label = (p.getLabel && typeof p.getLabel === 'function') ? p.getLabel() : "Bonus";
            addHitText(hitTextPool, hitTexts, player.x, player.y - 20, 0, '#FFF', label);
            pickups.splice(i, 1);
        }
    }
    for (let i = chests.length - 1; i >= 0; i--) {
        const c = chests[i];
        if (!c) continue;
        if (c.isDecayed && c.isDecayed()) { chests.splice(i, 1); continue; }
        const dist = Math.hypot(player.x - c.x, player.y - c.y);
        if (dist < collectionRadius + 20) {
            chests.splice(i, 1);
            game.triggerChestOpen = true; 
        }
    }

    // 4. HAZARDY - GRACZ & LOOT DECAY
    if (!game.hazardTicker) game.hazardTicker = 0;
    game.hazardTicker -= state.dt;

    for (const h of hazards) {
        if (!h || !h.isActive()) continue;

        // Gracz
        if (h.checkCollision(player.x, player.y, player.size * 0.4)) {
            game.playerInHazard = true;
            if (!game.shield && !devSettings.godMode && game.hazardTicker <= 0) {
                const chunkDamage = h.damage * 0.5; 
                game.health -= chunkDamage;
                game.playerHitFlashT = 0.15;
                addHitText(hitTextPool, hitTexts, player.x, player.y - 10, chunkDamage, '#00AA00');
                playSound('PlayerHurt');
                game.hazardTicker = 0.5; 
            }
        }
        
        // FIX: Topienie przedmiotów w bagnie (przywrócone z v0.92)
        const hazardRadius = h.r;
        
        // Gemy
        for (const g of gems) {
            if (!g.active) continue;
            const d = Math.hypot(g.x - h.x, g.y - h.y);
            if (d < hazardRadius) {
                g.hazardDecayT = Math.min(1.0, (g.hazardDecayT || 0) + HAZARD_CONFIG.HAZARD_PICKUP_DECAY_RATE * state.dt);
            }
        }
        // Pickupy
        for (const p of pickups) {
            const d = Math.hypot(p.x - h.x, p.y - h.y);
            if (d < hazardRadius) {
                p.inHazardDecayT = Math.min(1.0, (p.inHazardDecayT || 0) + HAZARD_CONFIG.HAZARD_PICKUP_DECAY_RATE * state.dt);
            }
        }
        
        // Wrogowie
        for (const e of enemies) {
            if (!e) continue;
            if (e.type !== 'elite' && e.type !== 'wall') { 
                if (h.checkCollision(e.x, e.y, e.size * 0.4)) {
                    e.hazardSlowdownT = 0.2; 
                    if (!e.hazardTicker) e.hazardTicker = Math.random() * 0.5; 
                    e.hazardTicker -= state.dt;
                    if (e.hazardTicker <= 0) {
                        const chunkDamage = h.enemyDamage * 0.5;
                        e.takeDamage(chunkDamage, 'hazard');
                        addHitText(hitTextPool, hitTexts, e.x, e.y - 10, chunkDamage, '#90EE90'); 
                        e.hazardTicker = 0.5;
                    }
                }
            }
        }
    }
}