// ==============
// COLLISIONS.JS (v1.12 - Potato Stats)
// Lokalizacja: /js/managers/collisions.js
// ==============

import { checkCircleCollision, addHitText, limitedShake, spawnConfetti, findFreeSpotForPickup } from '../core/utils.js';
import { killEnemy } from './enemyManager.js';
import { playSound } from '../services/audio.js';
import { devSettings } from '../services/dev.js';
import { COLLISION_CONFIG, HAZARD_CONFIG, MAP_CONFIG, WEAPON_CONFIG } from '../config/gameData.js'; 
import { getLang } from '../services/i18n.js';
import { PICKUP_CLASS_MAP } from './effects.js';
import { LeaderboardService } from '../services/leaderboard.js'; // IMPORT

function spawnRainbowSplash(particlePool, x, y, count = 20) {
    for(let k=0; k<count; k++) {
        const p = particlePool.get();
        if(p) {
            const hue = Math.random() * 360;
            const color = `hsl(${hue}, 100%, 60%)`;
            p.init(
                x, y, 
                (Math.random()-0.5)*400, 
                (Math.random()-0.5)*400, 
                0.5 + Math.random()*0.3, 
                color, 
                0, 
                0.94, 
                4 + Math.random()*4
            );
        }
    }
}

export function checkCollisions(state) {
    const { 
        player, enemies, bullets, eBullets, gems, pickups, 
        game, settings, particlePool, gemsPool, hitTextPool, hitTexts,
        chests, hazards, bombIndicators, obstacles
    } = state;

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

    if (obstacles) {
        for (const obs of obstacles) {
            if (obs.isDead) continue; 

            const dx = player.x - obs.x;
            const dy = player.y - obs.y;
            const distSq = dx*dx + dy*dy; 
            const minDist = obs.hitboxRadius + (player.size * 0.4);
            const minDistSq = minDist * minDist;

            if (distSq < minDistSq) {
                const dist = Math.sqrt(distSq); 

                if (obs.type === 'shrine') {
                    const stats = MAP_CONFIG.OBSTACLE_STATS.shrine;
                    const cooldown = stats.cooldown || 120;
                    
                    if (game.health < game.maxHealth) {
                        if (game.time >= obs.lastUsedTime + cooldown) {
                            obs.lastUsedTime = game.time;
                            const heal = stats.healAmount || 100;
                            const oldHp = game.health;
                            game.health = Math.min(game.maxHealth, game.health + heal);
                            const healedAmount = game.health - oldHp;
                            
                            playSound('HealPickup');
                            
                            const shrineTxt = getLang('shrine_text') || "Rzyć umyta";
                            const offset = stats.textOffset || -85; 
                            addHitText(hitTextPool, hitTexts, player.x, player.y - 50, 0, "#FFD700", shrineTxt, 5.0, player, offset);
                            
                            addHitText(hitTextPool, hitTexts, player.x, player.y - 30, healedAmount, "#00FF00", "+HP", 2.0);
                            
                            for(let k=0; k<20; k++) {
                                const p = particlePool.get();
                                if(p) p.init(obs.x, obs.y, (Math.random()-0.5)*300, (Math.random()-0.5)*300, 1.0, '#FFD700', 0, 0.95, 4);
                            }
                        }
                    }
                }

                if (obs.isSolid) {
                    const angle = Math.atan2(dy, dx);
                    const push = minDist - dist;
                    player.x += Math.cos(angle) * push;
                    player.y += Math.sin(angle) * push;
                }
                
                if (obs.isSlow) {
                    game.playerInWater = true;
                }
            }

            if (obs.isSolid || obs.isSlow) {
                const checkEnemyRadius = obs.hitboxRadius + 100;
                
                for (const e of enemies) {
                    if (e.dying) continue;
                    
                    const edx = e.x - obs.x;
                    const edy = e.y - obs.y;
                    
                    if (Math.abs(edx) > checkEnemyRadius || Math.abs(edy) > checkEnemyRadius) continue;
                    
                    const eDistSq = edx*edx + edy*edy;
                    const eMinDist = obs.hitboxRadius + (e.size * 0.4);
                    
                    if (eDistSq < eMinDist * eMinDist) {
                        if (obs.isSolid) {
                            const eDist = Math.sqrt(eDistSq); 
                            const angle = Math.atan2(edy, edx);
                            const push = (eMinDist - eDist) * 0.5;
                            e.x += Math.cos(angle) * push;
                            e.y += Math.sin(angle) * push;
                        }
                        if (obs.isSlow && e.type !== 'wall') {
                            e.inWater = true; 
                        }
                    }
                }
            }
        }
        
        if (player.weapons) {
            for (const w of player.weapons) {
                if (w.items && w.items.length > 0) {
                    for (const item of w.items) {
                        const bx = item.ox;
                        const by = item.oy;
                        for (const obs of obstacles) {
                            if (obs.isDead || obs.isRuined || obs.hp === Infinity) continue;
                            if (checkCircleCollision(bx, by, 20, obs.x, obs.y, obs.hitboxRadius)) {
                                const now = game.time;
                                if (!obs.lastOrbitalHit || now - obs.lastOrbitalHit > 0.2) {
                                    obs.lastOrbitalHit = now;
                                    const dmg = w.damage || 10;
                                    const destroyed = obs.takeDamage(dmg, 'player');
                                    addHitText(hitTextPool, hitTexts, obs.x, obs.y - 20, dmg, '#fff');
                                    playSound('Hit');
                                    if (destroyed) {
                                        spawnConfetti(particlePool, obs.x, obs.y);
                                        playSound('Explosion');
                                        const gemCount = 5 + Math.floor(Math.random() * 4);
                                        for(let k=0; k<gemCount; k++) {
                                             const gem = gemsPool.get();
                                             if (gem) gem.init(obs.x + (Math.random()-0.5)*40, obs.y + (Math.random()-0.5)*40, 5, 5, '#81C784');
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
                    }
                }
            }
        }
    }

    for (let b of bombIndicators) {
        if (b.type === 'shockwave') {
            const progress = Math.min(1, b.life / b.maxLife);
            const currentRadius = b.maxRadius * progress;
            const currentRadiusSq = currentRadius * currentRadius; 
            
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (b.hitEnemies.includes(e.id)) continue;

                const dx = b.x - e.x;
                const dy = b.y - e.y;
                const distSq = dx*dx + dy*dy;
                const hitDist = currentRadius + e.size;
                
                if (distSq < hitDist * hitDist) {
                    b.hitEnemies.push(e.id);
                    const damage = b.damage;
                    e.takeDamage(damage, 'shockwave');
                    addHitText(hitTextPool, hitTexts, e.x, e.y - 20, damage, '#ff9800');

                    if (e.hp <= 0) {
                        const gem = gemsPool.get();
                        if (gem) {
                            gem.init(e.x + (Math.random() - 0.5) * 5, e.y + (Math.random() - 0.5) * 5, 4, (e.type === 'elite') ? 7 : 1, '#4FC3F7');
                        }
                        game.score += (e.type === 'elite' || e.type === 'lumberjack' || e.type === 'snakeEater') ? 80 : 10;

                        if (!b.onlyXP) {
                            function maybe(type, prob) {
                                if (!devSettings.allowedPickups.includes('all') && !devSettings.allowedPickups.includes(type)) return;
                                if (Math.random() < prob) {
                                    const pos = findFreeSpotForPickup(pickups, e.x, e.y);
                                    const PickupClass = PICKUP_CLASS_MAP[type];
                                    if (PickupClass) pickups.push(new PickupClass(pos.x, pos.y));
                                }
                            }
                            maybe('heal', 0.04); maybe('magnet', 0.025); maybe('speed', 0.02);
                            maybe('shield', 0.015); maybe('bomb', 0.01); maybe('freeze', 0.01);
                        }
                        
                        const p = particlePool.get();
                        if(p) p.init(e.x, e.y, 0, -50, 0.5, e.color, 0, 0.9, 3);

                        enemies.splice(j, 1);
                        state.enemyIdCounter++; 
                    } else {
                        const angle = Math.atan2(dy, dx);
                        e.applyKnockback(Math.cos(angle) * 300, Math.sin(angle) * 300);
                    }
                }
            }
            
            if (obstacles) {
                for (const obs of obstacles) {
                    if (obs.isDead || obs.isRuined || obs.hp === Infinity) continue;
                    
                    const dx = b.x - obs.x;
                    const dy = b.y - obs.y;
                    const distSq = dx*dx + dy*dy;
                    const hitDist = currentRadius + obs.hitboxRadius;
                    
                    if (distSq < hitDist * hitDist) {
                        const destroyed = obs.takeDamage(50, 'player');
                        if (destroyed) {
                             spawnConfetti(particlePool, obs.x, obs.y);
                             playSound('Explosion');
                             const gemCount = 5 + Math.floor(Math.random() * 4);
                             for(let k=0; k<gemCount; k++) {
                                 const gem = gemsPool.get();
                                 if (gem) gem.init(obs.x + (Math.random()-0.5)*40, obs.y + (Math.random()-0.5)*40, 5, 5, '#81C784');
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
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (!enemy || enemy.isDead) continue;
        
        if (checkCircleCollision(player.x, player.y, player.size * 0.4, enemy.x, enemy.y, enemy.size * 0.4)) {
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            const isInvulnerable = game.shield || devSettings.godMode;

            if (enemy.type === 'snakeEater') {
                if (enemy.tryHealPlayer(game, player, hitTextPool, hitTexts)) {
                    playSound('HealPickup'); 
                    spawnConfetti(particlePool, enemy.x, enemy.y);
                }
            } else {
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
    }
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!b) continue;
        if (typeof b.isOffScreen === 'function' && b.isOffScreen(state.camera)) { b.release(); continue; }
        
        if (obstacles) {
            let hitObs = false;
            for (const obs of obstacles) {
                if (obs.isDead || obs.isRuined || obs.hp === Infinity) continue; 
                if (checkCircleCollision(b.x, b.y, b.size, obs.x, obs.y, obs.hitboxRadius)) {
                    hitObs = true;
                    const destroyed = obs.takeDamage(b.damage, 'player');
                    addHitText(hitTextPool, hitTexts, obs.x, obs.y - 20, b.damage, '#fff');
                    playSound('Hit');
                    if (b.type === 'axe') {
                         const count = WEAPON_CONFIG.LUMBERJACK_AXE.IMPACT_PARTICLE_COUNT || 30;
                         spawnRainbowSplash(particlePool, b.x, b.y, count);
                    } else {
                         const p = particlePool.get();
                         if (p) p.init(b.x, b.y, Math.random()*100-50, Math.random()*100-50, 0.3, '#5D4037', 0, 0.9, 3);
                    }
                    if (destroyed) {
                        spawnConfetti(particlePool, obs.x, obs.y);
                        playSound('Explosion');
                        const gemCount = 5 + Math.floor(Math.random() * 4);
                        for(let k=0; k<gemCount; k++) {
                             const gem = gemsPool.get();
                             if (gem) gem.init(obs.x + (Math.random()-0.5)*40, obs.y + (Math.random()-0.5)*40, 5, 5, '#81C784');
                        }
                        if (Math.random() < obs.dropChance) {
                             const dropType = Math.random() < 0.3 ? 'chest' : 'heal';
                             const PickupClass = PICKUP_CLASS_MAP[dropType];
                             if (PickupClass) pickups.push(new PickupClass(obs.x, obs.y));
                        }
                    }
                    break;
                }
            }
            if (hitObs) {
                if (b.pierce > 0) b.pierce--;
                else b.release();
                continue;
            }
        }

        let hitEnemy = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (!e || e.isDead) continue; 
            if (b.lastEnemyHitId === e.id && b.pierce > 0) continue; 
            
            if (checkCircleCollision(b.x, b.y, b.size, e.x, e.y, e.size * 0.6)) {
                hitEnemy = true;
                const isDead = e.takeDamage(b.damage, 'player');
                
                let hitY = e.y;
                if (e.stats && e.stats.hitTextOffsetY !== undefined) {
                    hitY = e.y + e.stats.hitTextOffsetY; 
                } else if (['wall', 'tank', 'elite', 'lumberjack', 'snakeEater'].includes(e.type)) {
                    hitY = e.y - e.size * 0.8; 
                }
                
                addHitText(hitTextPool, hitTexts, e.x, hitY, b.damage);
                playSound('Hit');
                
                if (e.type !== 'wall' && e.type !== 'tank' && e.type !== 'snakeEater') {
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
                if (eb.type === 'axe') {
                     const count = WEAPON_CONFIG.LUMBERJACK_AXE.IMPACT_PARTICLE_COUNT || 30;
                     spawnRainbowSplash(particlePool, eb.x, eb.y, count);
                }
                eb.release(); 
            }
        }
    }

    const collectionRadius = 35;
    
    for (let i = gems.length - 1; i >= 0; i--) {
        const g = gems[i];
        if (!g || g.delay > 0) continue; 
        if (g.isCollected) continue; 
        if (g.isDecayedByHazard && g.isDecayedByHazard()) { g.release(); continue; }
        
        const dx = player.x - g.x;
        const dy = player.y - g.y;
        const distSq = dx*dx + dy*dy;
        
        if (game.magnet || distSq < (game.pickupRange * game.pickupRange)) {
            g.magnetized = true;
        }
        if (distSq < (collectionRadius + g.r) ** 2) {
            const collectedXP = Math.floor(g.val * (game.level >= 20 ? 1.2 : 1));
            game.xp += collectedXP; 
            game.hunger = game.maxHunger;
            playSound('XPPickup');
            g.collect();
            
            // NOWOŚĆ: Śledzenie zebranych ziemniaków
            LeaderboardService.trackStat('potatoes_collected', 1);
        }
    }
    
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        if (!p) continue;
        if (p.isDecayed && p.isDecayed()) { pickups.splice(i, 1); continue; }
        
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        const distSq = dx*dx + dy*dy;
        
        if (distSq < (game.pickupRange * game.pickupRange)) {
            p.isMagnetized = true; 
        }
        
        if (distSq < (collectionRadius + 10) ** 2) {
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
        
        const dx = player.x - c.x;
        const dy = player.y - c.y;
        const distSq = dx*dx + dy*dy;
        
        if (distSq < (collectionRadius + 20) ** 2) {
            chests.splice(i, 1);
            game.triggerChestOpen = true; 
        }
    }

    if (!game.hazardTicker) game.hazardTicker = 0;
    game.hazardTicker -= state.dt;

    for (const h of hazards) {
        if (!h || !h.isActive()) continue;
        const isMega = h.scale > 1.5; 
        if (h.checkCollision(player.x, player.y, player.size * 0.4)) {
            game.playerInHazard = true;
            if (isMega) game.playerInMegaHazard = true;
            if (!game.shield && !devSettings.godMode && game.hazardTicker <= 0) {
                const chunkDamage = h.damage * 0.5; 
                game.health -= chunkDamage;
                game.playerHitFlashT = 0.15;
                addHitText(hitTextPool, hitTexts, player.x, player.y - 10, chunkDamage, '#00AA00');
                playSound('PlayerHurt');
                game.hazardTicker = 0.5; 
            }
        }
        
        const hazardRadius = h.r;
        const hazardRadiusSq = hazardRadius * hazardRadius;
        
        for (const g of gems) {
            if (!g.active) continue;
            const dx = g.x - h.x;
            const dy = g.y - h.y;
            if ((dx*dx + dy*dy) < hazardRadiusSq) {
                g.hazardDecayT = Math.min(1.0, (g.hazardDecayT || 0) + HAZARD_CONFIG.HAZARD_PICKUP_DECAY_RATE * state.dt);
            }
        }
        for (const p of pickups) {
            const dx = p.x - h.x;
            const dy = p.y - h.y;
            if ((dx*dx + dy*dy) < hazardRadiusSq) {
                p.inHazardDecayT = Math.min(1.0, (p.inHazardDecayT || 0) + HAZARD_CONFIG.HAZARD_PICKUP_DECAY_RATE * state.dt);
            }
        }
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (!e || e.isDead) continue; 
            if (e.type !== 'elite' && e.type !== 'wall' && e.type !== 'snakeEater') { 
                if (h.checkCollision(e.x, e.y, e.size * 0.4)) {
                    e.hazardSlowdownT = 0.2; 
                    if (isMega) e.inMegaHazard = true; 
                    if (!e.hazardTicker) e.hazardTicker = Math.random() * 0.5; 
                    e.hazardTicker -= state.dt;
                    if (e.hazardTicker <= 0) {
                        const chunkDamage = h.enemyDamage * 0.5;
                        e.takeDamage(chunkDamage, 'hazard');
                        addHitText(hitTextPool, hitTexts, e.x, e.y - 10, chunkDamage, '#90EE90'); 
                        if (e.hp <= 0) {
                            state.enemyIdCounter = killEnemy(i, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, false, false);
                        }
                        e.hazardTicker = 0.5;
                    }
                }
            }
        }
    }
}