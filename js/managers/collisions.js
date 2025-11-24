// ==============
// COLLISIONS.JS (v1.02 - FIX: Player Knockback & Pickup Range)
// Lokalizacja: /js/managers/collisions.js
// ==============

import { checkCircleCollision, addHitText } from '../core/utils.js';
import { killEnemy } from './enemyManager.js';
import { playSound } from '../services/audio.js';
import { devSettings } from '../services/dev.js';
import { COLLISION_CONFIG, HAZARD_CONFIG } from '../config/gameData.js'; 

export function checkCollisions(state) {
    const { 
        player, enemies, bullets, eBullets, gems, pickups, 
        game, settings, particlePool, gemsPool, hitTextPool, hitTexts,
        chests, hazards 
    } = state;

    game.playerInHazard = false;

    // 1. KOLIZJA GRACZ - WROGOWIE
    if (!game.shield && !devSettings.godMode) {
        for (const enemy of enemies) {
            if (enemy.isDead) continue;
            
            // Hitbox gracza: player.size / 2. Wroga: enemy.size / 2.
            if (checkCircleCollision(player.x, player.y, player.size / 2, enemy.x, enemy.y, enemy.size / 2)) {
                
                game.health -= enemy.damage;
                game.playerHitFlashT = 0.1; 
                playSound('PlayerHurt');
                
                // ODRZUT WZAJEMNY (FIX)
                const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                
                // Odrzuć wroga
                enemy.applyKnockback(-Math.cos(angle) * 100, -Math.sin(angle) * 100);
                
                // Odrzuć gracza (NOWOŚĆ)
                // Siła odrzutu dla gracza (np. 200px/s)
                player.applyKnockback(Math.cos(angle) * 200, Math.sin(angle) * 200);
            }
            
            if (enemy.type === 'wall') {
                if (checkCircleCollision(player.x, player.y, player.size / 2, enemy.x, enemy.y, enemy.size / 2)) {
                    game.collisionSlowdown = COLLISION_CONFIG.WALL_COLLISION_SLOWDOWN; 
                }
            }
        }
    }
    
    // 2. POCISKI GRACZA
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (typeof b.isOffScreen === 'function' && b.isOffScreen(state.camera)) {
            b.release();
            continue;
        }
        
        let hitEnemy = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (e.isDead) continue; 
            if (b.lastEnemyHitId === e.id && b.pierce > 0) continue; 

            if (checkCircleCollision(b.x, b.y, b.size, e.x, e.y, e.size / 2)) {
                hitEnemy = true;
                const isDead = e.takeDamage(b.damage, 'player');
                addHitText(hitTextPool, hitTexts, e.x, e.y, b.damage);
                
                const angle = Math.atan2(e.y - b.y, e.x - b.x);
                const kbForce = (b.damage + 20) * 3; 
                e.applyKnockback(Math.cos(angle) * kbForce, Math.sin(angle) * kbForce);
                
                const p = particlePool.get();
                if (p) p.init(b.x, b.y, Math.random()*100-50, Math.random()*100-50, 0.2, b.color, 0, 0.9, 3);

                if (isDead) {
                    state.enemyIdCounter = killEnemy(j, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests);
                } else {
                    playSound('Hit');
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
            if (typeof eb.isOffScreen === 'function' && eb.isOffScreen(state.camera)) {
                eb.release(); 
                continue;
            }
            if (checkCircleCollision(eb.x, eb.y, eb.size, player.x, player.y, player.size / 2)) {
                game.health -= eb.damage;
                game.playerHitFlashT = 0.1;
                playSound('PlayerHurt');
                eb.release(); 
            }
        }
    }

    // 3. PICKUPY / GEMY (FIX: Zmniejszony zasięg zbierania)
    
    // Fizyczny promień gracza do zbierania (mniejszy niż wizualny size=80)
    const collectionRadius = 25; 

    for (let i = gems.length - 1; i >= 0; i--) {
        const g = gems[i];
        if (g.delay > 0) continue; 
        const dist = Math.hypot(player.x - g.x, player.y - g.y);
        
        // Magnes (Daleki zasięg)
        if (dist < game.pickupRange + (game.magnet ? 150 : 0)) g.magnetized = true;
        
        // Zbieranie (Bliski zasięg - FIX)
        if (dist < collectionRadius + g.r) {
            game.xp += g.val * (game.level >= 20 ? 1.2 : 1); 
            playSound('Gem');
            g.release(); 
        }
    }

    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dist = Math.hypot(player.x - p.x, player.y - p.y);
        
        if (dist < game.pickupRange + (game.magnet ? 150 : 0)) p.isMagnetized = true; 
        
        // Zbieranie (Bliski zasięg - FIX)
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
        const dist = Math.hypot(player.x - c.x, player.y - c.y);
        
        // Skrzynie też wymagają podejścia
        if (dist < collectionRadius + 20) {
            chests.splice(i, 1);
            game.triggerChestOpen = true; 
        }
    }

    // 4. HAZARDY - GRACZ
    if (!game.hazardTicker) game.hazardTicker = 0;
    game.hazardTicker -= state.dt;

    for (const h of hazards) {
        if (h.checkCollision(player.x, player.y, player.size * 0.4)) {
            game.playerInHazard = true;
            if (!game.shield && !devSettings.godMode && game.hazardTicker <= 0) {
                const chunkDamage = h.damage * 0.5; 
                game.health -= chunkDamage;
                game.playerHitFlashT = 0.15;
                playSound('PlayerHurt');
                game.hazardTicker = 0.5; 
            }
        }
    }

    // 5. HAZARDY - WROGOWIE
    for (const h of hazards) {
        for (const e of enemies) {
            if (e.type !== 'elite' && e.type !== 'wall') { 
                if (h.checkCollision(e.x, e.y, e.size * 0.4)) {
                    if (!e.hazardTicker) e.hazardTicker = Math.random() * 0.5; 
                    e.hazardTicker -= state.dt;
                    
                    // --- FIX: Zmniejszanie Timera Spowolnienia u Wrogów ---
                    // To jest robione w enemy.js, ale tutaj INICJUJEMY spowolnienie
                    e.hazardSlowdownT = 0.2; 
                    
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