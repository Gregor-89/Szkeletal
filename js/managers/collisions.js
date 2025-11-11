// ==============
// COLLISIONS.JS (v0.79h - FIX: Ochrona przed 'undefined' w pętlach kolizji)
// Lokalizacja: /js/managers/collisions.js
// ==============

import { addHitText, limitedShake, spawnConfetti } from '../core/utils.js';
import { devSettings } from '../services/dev.js';

import { killEnemy } from './enemyManager.js';
import { playSound } from '../services/audio.js';
// POPRAWKA v0.72: USUNIĘTO PLAYER_CONFIG, PICKUP_CONFIG
// POPRAWKA v0.68: Import HAZARD_CONFIG
import { HAZARD_CONFIG, COLLISION_CONFIG } from '../config/gameData.js'; // NOWY IMPORT COLLISION_CONFIG

/**
 * Główna funkcja kolizji.
 * Sprawdza wszystkie interakcje między bytami.
 */
export function checkCollisions(state) {
    const { 
        player, game, settings, canvas, 
        bullets, eBullets, enemies, gems, pickups, chests, hazards, // DODANO: hazards
        bombIndicators, camera, // DODANO: obiekt camera
        // POPRAWKA v0.62: Pobranie pul obiektów
        gemsPool, particlePool, hitTextPool,
        // 'hitTexts' i 'gems' to teraz 'activeItems'
        hitTexts 
    } = state;

// POPRAWKA v0.68: Zresetuj stan gracza w Hazardzie na początku każdej klatki.
player.inHazard = false;
// POPRAWKA v0.77d: Zresetuj spowolnienie kolizji na początku każdej klatki.
game.collisionSlowdown = 0;

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

    // POPRAWKA v0.66: Użyj metody isOffScreen z argumentem 'camera'
    if (eb.isOffScreen(camera)) {
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
            
            // NOWA LOGIKA v0.75: Użycie takeDamage()
            e.takeDamage(b.damage); 
            
            // POPRAWKA v0.75: Odrzut tylko, jeśli to NIE jest Oblężnik
            if (e.type !== 'wall') {
                const angle = Math.atan2(e.y - player.y, e.x - player.x);
                e.x += Math.cos(angle) * 3;
                e.y += Math.sin(angle) * 3;
            }

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
    
    // POPRAWKA v0.66: Użyj metody isOffScreen z argumentem 'camera'
    if (b.isOffScreen(camera)) {
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
            
            // NOWA LOGIKA v0.75: Spowolnienie Kolizji Oblężnika
            if (e.type === 'wall') {
                // Nakładamy duże spowolnienie (-75%)
                game.collisionSlowdown = COLLISION_CONFIG.WALL_COLLISION_SLOWDOWN; 
                
                // MOCNY ODRZUT (60 zamiast 40)
                const knockbackForce = 60;
                const angle = Math.atan2(player.y - e.y, player.x - e.x);
                
                player.x += Math.cos(angle) * knockbackForce; 
                player.y += Math.sin(angle) * knockbackForce;
            } else {
                // Standardowe spowolnienie kolizji wroga (20%)
                game.collisionSlowdown = 0.20;
                const angle = Math.atan2(player.y - e.y, player.x - e.x);
                
                // Standardowy odrzut wroga i gracza
                player.x += Math.cos(angle) * 8;
                player.y += Math.sin(angle) * 8;
                const enemyAngle = Math.atan2(e.y - player.y, e.x - player.x);
                e.x += Math.cos(enemyAngle) * 15;
                e.y += Math.sin(enemyAngle) * 15;
            }


            if (game.shield || devSettings.godMode) {
                // POPRAWKA v0.62: Użyj puli hitText
                addHitText(hitTextPool, hitTexts, player.x, player.y - 16, 0, '#90CAF9', 'Tarcza');
            } else {
                const dmg = (e.type === 'kamikaze' ? 8 : 5);
                game.health -= dmg;
                // POPRAWKA v0.62: Użyj puli hitText
                addHitText(hitTextPool, hitTexts, player.x, player.y - 16, dmg, '#f44336');
                playSound('PlayerHurt'); 
                limitedShake(game, settings, 7, 120);
            }
        }
    }
}

// --- Gracz vs Gemy (XP) ---
for (let i = gems.length - 1; i >= 0; i--) {
    const g = gems[i];
    // POPRAWKA v0.79h: Dodano zabezpieczenie
    if (!g) { continue; }
    
    // POPRAWKA v0.76: Użyj isDecayedByHazard() zamiast isDecayed()
    if (g.isDecayedByHazard()) { g.release(); continue; } // Znikaj, jeśli dotarł do końca zaniku (z bagna)
    // UWAGA: Standardowy czas życia (isDead) jest obsługiwany w gem.update()
    
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
    
    // POPRAWKA v0.79h: Dodano zabezpieczenie przed 'undefined'
    if (!p) { continue; } 
    
    if (p.isDecayed()) { pickups.splice(i, 1); continue; } // Znikaj, jeśli dotarł do końca zaniku

    const hitRadiusPP = player.size * 0.5 + p.r;
    if (Math.abs(player.x - p.x) > hitRadiusPP || Math.abs(player.y - p.y) > hitRadiusPP) {
        continue;
    }
    const d = Math.hypot(player.x - p.x, player.y - p.y);
    if (d < hitRadiusPP) {
        // NOWA LOGIKA v0.72: Zastąpienie instrukcji if/else wywołaniem metody
        p.applyEffect(state); 
        
        pickups.splice(i, 1);
    }
}

// --- Gracz vs Skrzynie ---
for (let i = chests.length - 1; i >= 0; i--) {
    const c = chests[i];
    
    // POPRAWKA v0.79h: Dodano zabezpieczenie przed 'undefined'
    if (!c) { continue; }
    
    if (c.isDecayed()) { chests.splice(i, 1); continue; } // Znikaj, jeśli dotarł do końca zaniku

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

// --- Logika Bagna: Kolizja Dropów z Hazardami ---
for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];

    if (!h.isActive()) {
        continue;
    }

    const hazardRadius = h.r;

    // A. Gemy (gems)
    for (let j = gems.length - 1; j >= 0; j--) {
        const g = gems[j];
        // POPRAWKA v0.79h: Dodano zabezpieczenie
        if (!g || !g.active) continue;

        const d = Math.hypot(g.x - h.x, g.y - h.y);
        if (d < hazardRadius + g.r) {
            // Drop znajduje się w aktywnym Hazardzie: AKTYWUJ ZANIK
            // POPRAWKA v0.76: Zmiana nazwy właściwości
            g.hazardDecayT = Math.min(1.0, g.hazardDecayT + HAZARD_CONFIG.HAZARD_PICKUP_DECAY_RATE * state.dt);
            // POPRAWKA v0.76: Użyj isDecayedByHazard()
            if (g.isDecayedByHazard()) {
                g.release(); 
            }
        }
    }

    // B. Pickupy (pickups)
    for (let j = pickups.length - 1; j >= 0; j--) {
        const p = pickups[j];
        // POPRAWKA v0.79h: Dodano zabezpieczenie
        if (!p) { continue; }

        const d = Math.hypot(p.x - h.x, p.y - h.y);
        if (d < hazardRadius + p.r) {
            // Drop znajduje się w aktywnym Hazardzie: AKTYWUJ ZANIK
            p.inHazardDecayT = Math.min(1.0, p.inHazardDecayT + HAZARD_CONFIG.HAZARD_PICKUP_DECAY_RATE * state.dt);
            if (p.isDecayed()) {
                pickups.splice(j, 1); 
            }
        }
    }

    // C. Skrzynie (chests)
    for (let j = chests.length - 1; j >= 0; j--) {
        const c = chests[j];
        // POPRAWKA v0.79h: Dodano zabezpieczenie
        if (!c) { continue; }

        const d = Math.hypot(c.x - h.x, c.y - h.y);
        if (d < hazardRadius + c.r) {
            // Skrzynia znajduje się w aktywnym Hazardzie: AKTYWUJ WOLNY ZANIK
            c.inHazardDecayT = Math.min(1.0, c.inHazardDecayT + HAZARD_CONFIG.HAZARD_CHEST_DECAY_RATE * state.dt);
            if (c.isDecayed()) {
                chests.splice(j, 1); 
            }
        }
    }
}
// --- Koniec Logiki Bagna ---


// --- Gracz vs Pola Zagrożenia (Hazards) ---
const nowMs = performance.now(); 
for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];

    // POPRAWKA v0.68a: Sprawdź, czy Hazard jest AKTYWNY
    if (!h.isActive()) {
        continue;
    }
    
    const hitRadiusPH = player.size * 0.5 + h.r;
    if (Math.abs(player.x - h.x) > hitRadiusPH || Math.abs(player.y - h.y) > hitRadiusPH) {
        continue;
    }
    
    const d = Math.hypot(player.x - h.x, player.y - h.y);
    if (d < hitRadiusPH) {
        player.inHazard = true;
        
        if (devSettings.godMode) {
            // Nadal pokazuj wizualny efekt
            addHitText(hitTextPool, hitTexts, player.x, player.y - 16, 0, '#00FF00', 'Hazard');
            // Ale nie zadawaj obrażeń i nie spowalniaj
            continue;
        }
        
        // POPRAWKA v0.68: Dyskretne obrażenia dla Gracza (co 400ms)
        if (Math.floor(nowMs / 400) !== Math.floor((nowMs - state.dt * 1000) / 400)) {
            const discreteDmg = h.playerDmgPerHit; // Użyj wartości z obiektu Hazard
            
            if (!game.shield) {
                game.health -= discreteDmg;
                // Pokazuj uderzenie
                addHitText(hitTextPool, hitTexts, player.x, player.y - 16, discreteDmg, '#ff0000');
            } else {
                // Tarcza pochłania DoT, ale nadal pokazuje, że jesteś w Hazardzie
                addHitText(hitTextPool, hitTexts, player.x, player.y - 16, 0, '#90CAF9', 'Tarcza');
            }
        }
    }
}

// --- Wrogowie vs Pola Zagrożenia (Hazards) ---
for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];

    // POPRAWKA v0.68a: Tylko aktywne Hazardy wpływają na wrogów
    if (!h.isActive()) {
        continue;
    }
    const hazardRadius = h.r;
    const slowdownTime = 0.1; // Krótki czas timera, odświeżany co klatkę

    for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        // POPRAWKA v0.79h: Dodano zabezpieczenie
        if (!e) { continue; }
        
        const hitRadiusEH = e.size * 0.5 + hazardRadius;
        const d = Math.hypot(e.x - h.x, e.y - h.y);

        if (d < hitRadiusEH) {
            // 1. Zastosuj spowolnienie (odśwież timer)
            e.hazardSlowdownT = slowdownTime; 
            
            // POPRAWKA v0.68: Dyskretne obrażenia dla Wrogów (co 400ms)
            if (Math.floor(nowMs / 400) !== Math.floor((nowMs - state.dt * 1000) / 400)) {
                const discreteDmg = h.enemyDmgPerHit; // Użyj wartości z obiektu Hazard
                e.hp -= discreteDmg;

                // Pokazuj tekst obrażeń co ~0.4s
                addHitText(hitTextPool, hitTexts, e.x, e.y, discreteDmg, '#00FF00'); // Zielony tekst obrażeń
            }

            // 3. Sprawdź, czy wróg został zabity
            if (e.hp <= 0) {
                // POPRAWKA v0.62: Przekaż pule do killEnemy
                state.enemyIdCounter = killEnemy(j, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, false);
            }
        }
    }
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.79h] js/managers/collisions.js: Dodano zabezpieczenia (if !p) w pętlach pickups i chests.');
}