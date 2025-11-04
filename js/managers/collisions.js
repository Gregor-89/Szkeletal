// ==============
// COLLISIONS.JS (v0.62e - Pula Obiektów i Fizyka DT)
// Lokalizacja: /js/managers/collisions.js
// ==============

import { addHitText, limitedShake, spawnConfetti } from '../core/utils.js';
import { devSettings } from '../services/dev.js';

import { killEnemy } from './enemyManager.js';
import { areaNuke } from './effects.js';
import { playSound } from '../services/audio.js';

/**
 * Główna funkcja kolizji.
 * Sprawdza wszystkie interakcje między bytami.
 */
export function checkCollisions(state) {
    const { 
        player, game, settings, canvas, 
        bullets, eBullets, enemies, gems, pickups, chests, // 'bullets', 'eBullets', 'gems' to teraz 'activeItems'
        bombIndicators, 
        // POPRAWKA v0.62: Pobranie pul obiektów
        gemsPool, particlePool, hitTextPool,
        // 'hitTexts' i 'gems' to teraz 'activeItems'
        hitTexts 
    } = state;

// --- Pociski Wrogów vs Gracz ---
// Iterujemy wstecz, aby 'release()' (które modyfikuje tablicę) nie psuło pętli
for (let i = eBullets.length - 1; i >= 0; i--) {
    const eb = eBullets[i];
    
    // POPRAWKA v0.61: Usunięto eb.update() (jest już w gameLogic.js)
    
    const hitRadiusEB = player.size * 0.5 + eb.size;
    if (Math.abs(player.x - eb.x) > hitRadiusEB || Math.abs(player.y - eb.y) > hitRadiusEB) {
        // Pomiń
    } else {
        const d = Math.hypot(player.x - eb.x, player.y - eb.y);
        if (d < hitRadiusEB) {
            if (game.shield || devSettings.godMode) {
                // POPRAWKA v0.62: Użyj puli hitText
                addHitText(hitTextPool, hitTexts, player.x, player.y - 16, 0, '#90CAF9', 'Tarcza');
            } else {
                game.health -= 5;
                playSound('PlayerHurt');
                limitedShake(game, settings, 7, 100);
            }
            // POPRAWKA v0.61: Użyj 'release()' zamiast 'splice()'
            eb.release();
            continue; 
        }
    }

    if (eb.isOffScreen(canvas)) {
        // POPRAWKA v0.61: Użyj 'release()' zamiast 'splice()'
        eb.release();
    }
}

// --- Pociski Gracza vs Wrogowie ---
// Iterujemy wstecz
for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (!b) continue; // Na wszelki wypadek

    // POPRAWKA v0.61: Usunięto b.update() (jest już w gameLogic.js)
    
    let hitSomething = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (!e) continue;
        
        const hitRadiusB = b.size + e.size * 0.6;
        if (Math.abs(b.x - e.x) > hitRadiusB || Math.abs(b.y - e.y) > hitRadiusB) {
            continue;
        }

        const d = Math.hypot(b.x - e.x, b.y - e.y);
        if (d < hitRadiusB) {
            e.hp -= b.damage;
            e.hitStun = 0.15;
            const angle = Math.atan2(e.y - player.y, e.x - player.x);
            e.x += Math.cos(angle) * 3;
            e.y += Math.sin(angle) * 3;

            // POPRAWKA v0.62e: Użyj puli cząsteczek i fizyki opartej na DT
            if (Math.random() < 0.5) {
                const p = particlePool.get();
                if (p) {
                    // init(x, y, vx, vy, life, color)
                    p.init(e.x, e.y, (Math.random() - 0.5) * 2 * 60, (Math.random() - 0.5) * 2 * 60, 0.25, '#ff0000');
                }
            }

            // POPRAWKA v0.62: Użyj puli hitText
            addHitText(hitTextPool, hitTexts, e.x, e.y, b.damage);

            if (e.hp <= 0) {
                // POPRAWKA v0.62: Przekaż pule do killEnemy
                state.enemyIdCounter = killEnemy(j, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, false);
            }
            if (b.pierce > 0) {
                b.pierce--;
            } else {
                // POPRAWKA v0.61: Użyj 'release()' zamiast 'splice()'
                b.release();
                hitSomething = true;
            }
            break; 
        }
    }
    if (hitSomething) continue; 
    
    if (b.isOffScreen(canvas)) {
        // POPRAWKA v0.61: Użyj 'release()' zamiast 'splice()'
        b.release();
    }
}

// --- Gracz vs Wrogowie ---
const now = performance.now();
for (let j = enemies.length - 1; j >= 0; j--) {
    const e = enemies[j];
    
    const hitRadiusPE = player.size * 0.5 + e.size * 0.5;
    if (Math.abs(player.x - e.x) > hitRadiusPE || Math.abs(player.y - e.y) > hitRadiusPE) {
        continue;
    }

    const d = Math.hypot(player.x - e.x, player.y - e.y);
    if (d < hitRadiusPE) {
        if (!e.lastPlayerCollision || now - e.lastPlayerCollision > 500) {
            e.lastPlayerCollision = now;
            game.collisionSlowdown = 0.20;
            const angle = Math.atan2(player.y - e.y, player.x - e.x);
            player.x += Math.cos(angle) * 8;
            player.y += Math.sin(angle) * 8;
            player.x = Math.max(player.size / 2, Math.min(canvas.width - player.size / 2, player.x));
            player.y = Math.max(player.size / 2, Math.min(canvas.height - player.size / 2, player.y));

            if (game.shield || devSettings.godMode) {
                // POPRAWKA v0.62: Użyj puli hitText
                addHitText(hitTextPool, hitTexts, player.x, player.y - 16, 0, '#90CAF9', 'Tarcza');
            } else {
                const dmg = (e.type === 'kamikaze' ? 8 : 5);
                game.health -= dmg;
                // POPRAWKA v0.62: Użyj puli hitText
                addHitText(hitTextPool, hitTexts, player.x, player.y - 16, dmg, '#f44336');
                const angle = Math.atan2(e.y - player.y, e.x - player.x);
                e.x += Math.cos(angle) * 15;
                e.y += Math.sin(angle) * 15;
                playSound('PlayerHurt'); 
                limitedShake(game, settings, 7, 120);
            }
        }
    }
}

// --- Gracz vs Gemy (XP) ---
for (let i = gems.length - 1; i >= 0; i--) {
    const g = gems[i];
    
    const hitRadiusPG = player.size * 0.5 + g.r;
    if (Math.abs(player.x - g.x) > hitRadiusPG || Math.abs(player.y - g.y) > hitRadiusPG) {
        continue;
    }
    
    const d = Math.hypot(player.x - g.x, player.y - g.y);
    if (d < hitRadiusPG) {
        game.xp += g.val;
        // POPRAWKA v0.62: Użyj 'release()' zamiast 'splice()'
        g.release();
        playSound('XPPickup');
    }
}

// --- Gracz vs Pickupy ---
for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];

    const hitRadiusPP = player.size * 0.5 + p.r;
    if (Math.abs(player.x - p.x) > hitRadiusPP || Math.abs(player.y - p.y) > hitRadiusPP) {
        continue;
    }

    const d = Math.hypot(player.x - p.x, player.y - p.y);
    if (d < hitRadiusPP) {
        if (p.type === 'heal') {
            game.health = Math.min(game.maxHealth, game.health + 30);
            // POPRAWKA v0.62: Użyj puli hitText
            addHitText(hitTextPool, hitTexts, player.x, player.y - 16, -30, '#4caf50', '+HP');
            playSound('HealPickup');
        } else if (p.type === 'magnet') {
            game.magnet = true;
            game.magnetT = 1.0;
            playSound('MagnetPickup');
        } else if (p.type === 'shield') {
            game.shield = true;
            game.shieldT = 8;
            playSound('ShieldPickup');
        } else if (p.type === 'speed') {
            game.speedT = 8;
            playSound('SpeedPickup');
        } else if (p.type === 'bomb') {
            // POPRAWKA v0.62: Przekaż pule do areaNuke
            areaNuke(player.x, player.y, 200, true, game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators);
            playSound('BombPickup');
        } else if (p.type === 'freeze') {
            game.freezeT = 5;
            playSound('FreezePickup');
        }
        pickups.splice(i, 1);
    }
}

// --- Gracz vs Skrzynie ---
for (let i = chests.length - 1; i >= 0; i--) {
    const c = chests[i];
    
    const hitRadiusPC = player.size * 0.5 + c.r;
    if (Math.abs(player.x - c.x) > hitRadiusPC || Math.abs(player.y - c.y) > hitRadiusPC) {
        continue;
    }
    
    const d = Math.hypot(player.x - c.x, player.y - c.y);
    if (d < hitRadiusPC) {
        game.shield = true;
        game.shieldT = 3;
        // POPRAWKA v0.62: Użyj puli hitText
        addHitText(hitTextPool, hitTexts, player.x, player.y - 35, 0, '#90CAF9', 'Tarcza +3s');

        chests.splice(i, 1);
        game.triggerChestOpen = true; // Ustawiamy flagę dla main.js
    }
}
}