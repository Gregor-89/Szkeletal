// ==============
// COLLISIONS.JS (v0.97b - Obstacles Physics)
// Lokalizacja: /js/managers/collisions.js
// ==============

import { checkCircleCollision, addHitText, limitedShake, spawnConfetti, findFreeSpotForPickup } from '../core/utils.js';
import { killEnemy } from './enemyManager.js';
import { playSound } from '../services/audio.js';
import { devSettings } from '../services/dev.js';
import { COLLISION_CONFIG, HAZARD_CONFIG } from '../config/gameData.js'; 
import { getLang } from '../services/i18n.js';
import { PICKUP_CLASS_MAP } from './effects.js'; // Potrzebne do spawnowania pickupów z fali

export function checkCollisions(state) {
    const { 
        player, enemies, bullets, eBullets, gems, pickups, 
        game, settings, particlePool, gemsPool, hitTextPool, hitTexts,
        chests, hazards, bombIndicators, obstacles // FIX v0.97b: Obstacles
    } = state;

    for (let i = 0; i < enemies.length; i++) {
        if (enemies[i]) enemies[i].inMegaHazard = false;
    }

    game.playerInHazard = false;
    game.playerInMegaHazard = false; 
    game.collisionSlowdown = 0;

    // --- FIX v0.97b: KOLIZJE Z PRZESZKODAMI ---
    if (obstacles) {
        for (const obs of obstacles) {
            if (obs.isDead) continue;

            // 1. Gracz vs Przeszkoda
            // Używamy hitboxRadius przeszkody i promienia gracza (player.size * 0.4)
            const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
            const minDist = obs.hitboxRadius + (player.size * 0.4);

            if (dist < minDist) {
                // Jeśli jest to przeszkoda SOLIDNA (drzewo, skała, chatka)
                if (obs.isSolid) {
                    const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
                    const push = minDist - dist;
                    // Wypchnij gracza
                    player.x += Math.cos(angle) * push;
                    player.y += Math.sin(angle) * push;
                }
                
                // Jeśli przeszkoda spowalnia (Woda)
                if (obs.isSlow) {
                    // Wykorzystujemy istniejącą flagę playerInHazard, aby użyć logiki spowolnienia z Player.js
                    // W gameData.js water ma slowFactor = 0.5, a hazardy też mają 0.5. Pasuje idealnie.
                    game.playerInHazard = true;
                }
            }

            // 2. Wrogowie vs Przeszkoda (tylko solidne)
            if (obs.isSolid) {
                for (const e of enemies) {
                    if (e.dying) continue;
                    // Prosta kolizja kołowa
                    const eDist = Math.hypot(e.x - obs.x, e.y - obs.y);
                    const eMinDist = obs.hitboxRadius + (e.size * 0.4);
                    
                    if (eDist < eMinDist) {
                        const angle = Math.atan2(e.y - obs.y, e.x - obs.x);
                        // Wypychamy wroga (ślizganie)
                        const push = (eMinDist - eDist) * 0.5; // Mniejsza siła, żeby się nie trzęśli
                        e.x += Math.cos(angle) * push;
                        e.y += Math.sin(angle) * push;
                    }
                }
            }
        }
    }
    // ------------------------------------------

    // --- FIX v0.96i: Obsługa fali uderzeniowej (Shockwave) ---
    for (let b of bombIndicators) {
        if (b.type === 'shockwave') {
            // Oblicz aktualny promień na podstawie postępu życia
            const progress = Math.min(1, b.life / b.maxLife);
            const currentRadius = b.maxRadius * progress;
            
            // Sprawdź kolizję z wrogami
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                // Jeśli wróg już oberwał od tej konkretnej fali, pomiń go
                if (b.hitEnemies.includes(e.id)) continue;

                const dist = Math.hypot(b.x - e.x, b.y - e.y);
                
                // Kolizja: Wróg jest wewnątrz aktualnego promienia fali
                if (dist < currentRadius + e.size) {
                    b.hitEnemies.push(e.id); // Oznacz jako trafionego

                    const damage = b.damage;
                    e.takeDamage(damage, 'shockwave');
                    addHitText(hitTextPool, hitTexts, e.x, e.y - 20, damage, '#ff9800');

                    if (e.hp <= 0) {
                        // Logika zabijania (skopiowana i dostosowana z areaNuke)
                        const gem = gemsPool.get();
                        if (gem) {
                            gem.init(
                                e.x + (Math.random() - 0.5) * 5,
                                e.y + (Math.random() - 0.5) * 5,
                                4,
                                (e.type === 'elite') ? 7 : 1,
                                '#4FC3F7'
                            );
                        }
                        
                        game.score += (e.type === 'elite') ? 80 : (e.type === 'tank' ? 20 : 10);

                        if (!b.onlyXP) {
                            // Szansa na pickup
                            function maybe(type, prob) {
                                if (!devSettings.allowedPickups.includes('all') && !devSettings.allowedPickups.includes(type)) return;
                                if (Math.random() < prob) {
                                    const pos = findFreeSpotForPickup(pickups, e.x, e.y);
                                    const PickupClass = PICKUP_CLASS_MAP[type];
                                    if (PickupClass) pickups.push(new PickupClass(pos.x, pos.y));
                                }
                            }
                            maybe('heal', 0.04);
                            maybe('magnet', 0.025);
                            maybe('speed', 0.02);
                            maybe('shield', 0.015);
                            maybe('bomb', 0.01);
                            maybe('freeze', 0.01);
                        }
                        
                        // Efekt śmierci (konfetti/cząsteczki)
                        const p = particlePool.get();
                        if(p) p.init(e.x, e.y, 0, -50, 0.5, e.color, 0, 0.9, 3);

                        enemies.splice(j, 1);
                        state.enemyIdCounter++; // Update licznika ID
                    } else {
                        // Odrzut dla przeżywających (np. Tank/Wall)
                        const angle = Math.atan2(e.y - b.y, e.x - b.x);
                        e.applyKnockback(Math.cos(angle) * 300, Math.sin(angle) * 300);
                    }
                }
            }
            
            // FIX v0.97b: Fala niszczy też chatki!
            if (obstacles) {
                for (const obs of obstacles) {
                    if (obs.isDead || obs.hp === Infinity) continue;
                    // Sprawdź, czy fala dotarła do chatki (tylko raz na falę? Nie mamy ID dla obstacles, więc fala bije co klatkę)
                    // ALE! BombIndicators żyją krótko. Żeby nie zabić chatki w 1 klatkę (fala zadaje np. 9999 dmg), 
                    // dodajmy proste sprawdzenie.
                    
                    const dist = Math.hypot(b.x - obs.x, b.y - obs.y);
                    if (dist < currentRadius + obs.hitboxRadius) {
                        // Fala zadaje np. 50 dmg klatkę chatce (żeby był efekt)
                        if (obs.takeDamage(10)) { // Jeśli zniszczono
                             spawnConfetti(particlePool, obs.x, obs.y);
                             playSound('Explosion');
                             
                             // Drop z chatki
                             if (Math.random() < obs.dropChance) {
                                 // Zawsze kurczak (Heal) albo Skrzynia?
                                 // Dajmy 30% szans na Skrzynię, 70% na Kurczaka
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
    // ---------------------------------------------------------

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
        
        // FIX v0.97b: Kolizja Pocisk - Przeszkoda (Chatka)
        if (obstacles) {
            let hitObs = false;
            for (const obs of obstacles) {
                if (obs.isDead || obs.hp === Infinity) continue; // Bij tylko zniszczalne
                
                if (checkCircleCollision(b.x, b.y, b.size, obs.x, obs.y, obs.hitboxRadius)) {
                    hitObs = true;
                    // Zadaj obrażenia chatce
                    const destroyed = obs.takeDamage(b.damage);
                    addHitText(hitTextPool, hitTexts, obs.x, obs.y - 20, b.damage, '#fff');
                    playSound('Hit');
                    
                    // Efekt cząsteczkowy (drzazgi)
                    const p = particlePool.get();
                    if (p) p.init(b.x, b.y, Math.random()*100-50, Math.random()*100-50, 0.3, '#5D4037', 0, 0.9, 3);

                    if (destroyed) {
                        spawnConfetti(particlePool, obs.x, obs.y);
                        playSound('Explosion');
                        // Drop
                        if (Math.random() < obs.dropChance) {
                             const dropType = Math.random() < 0.3 ? 'chest' : 'heal';
                             const PickupClass = PICKUP_CLASS_MAP[dropType];
                             if (PickupClass) pickups.push(new PickupClass(obs.x, obs.y));
                        }
                    }
                    break; // Jeden pocisk trafia jedną przeszkodę
                }
            }
            if (hitObs) {
                if (b.pierce > 0) b.pierce--;
                else b.release();
                continue; // Przejdź do następnego pocisku
            }
        }
        // ------------------------------------------------

        let hitEnemy = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (!e || e.isDead) continue; 
            if (b.lastEnemyHitId === e.id && b.pierce > 0) continue; 

            if (checkCircleCollision(b.x, b.y, b.size, e.x, e.y, e.size * 0.6)) {
                hitEnemy = true;
                const isDead = e.takeDamage(b.damage, 'player');
                
                let hitY = e.y;
                if (e.type === 'wall' || e.type === 'tank' || e.type === 'elite') {
                    hitY = e.y - e.size * 0.8; 
                }
                addHitText(hitTextPool, hitTexts, e.x, hitY, b.damage);
                
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
        if (g.isCollected) continue; 
        
        if (g.isDecayedByHazard && g.isDecayedByHazard()) { g.release(); continue; }

        const dist = Math.hypot(player.x - g.x, player.y - g.y);
        
        if (game.magnet || dist < game.pickupRange) {
            g.magnetized = true;
        }
        
        if (dist < collectionRadius + g.r) {
            const collectedXP = Math.floor(g.val * (game.level >= 20 ? 1.2 : 1));
            game.xp += collectedXP; 
            playSound('XPPickup');
            g.collect(); 
        }
    }
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        if (!p) continue;
        if (p.isDecayed && p.isDecayed()) { pickups.splice(i, 1); continue; }
        const dist = Math.hypot(player.x - p.x, player.y - p.y);
        
        if (dist < game.pickupRange) {
            p.isMagnetized = true; 
        }
        
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

    // 4. HAZARDY
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
        
        for (const g of gems) {
            if (!g.active) continue;
            const d = Math.hypot(g.x - h.x, g.y - h.y);
            if (d < hazardRadius) {
                g.hazardDecayT = Math.min(1.0, (g.hazardDecayT || 0) + HAZARD_CONFIG.HAZARD_PICKUP_DECAY_RATE * state.dt);
            }
        }
        for (const p of pickups) {
            const d = Math.hypot(p.x - h.x, p.y - h.y);
            if (d < hazardRadius) {
                p.inHazardDecayT = Math.min(1.0, (p.inHazardDecayT || 0) + HAZARD_CONFIG.HAZARD_PICKUP_DECAY_RATE * state.dt);
            }
        }
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (!e || e.isDead) continue; 
            
            if (e.type !== 'elite' && e.type !== 'wall') { 
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