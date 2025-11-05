// ==============
// UTILS.JS (v0.72 - Dodano areaNuke, aby złamać cykl zależności)
// Lokalizacja: /js/core/utils.js
// ==============

// POPRAWKA v0.65: Import nowej centralnej konfiguracji
import { EFFECTS_CONFIG } from '../config/gameData.js';
import { devSettings } from '../services/dev.js'; // NOWY IMPORT dla areaNuke
import { PICKUP_CLASS_MAP } from '../managers/effects.js'; // NOWY IMPORT dla areaNuke

// --- EFEKTY WIZUALNE ---

export function addHitText(hitTextPool, hitTexts, x, y, damage, color = '#ffd54f', overrideText = null) {
    const now = performance.now() / 1000;
    let merged = false;

    // Funkcja pomocnicza formatująca obrażenia (utrzymanie ułamkowych wartości)
    function formatDamage(value) {
        // Jeśli wartość nie jest całkowita lub jest bardzo mała (np. 0.4), formatuj z jednym miejscem po przecinku.
        if (value !== Math.floor(value) || value < 1) {
            return value.toFixed(1);
        }
        return value.toFixed(0);
    }
    
    if (damage > 0 && overrideText === null) {
        // Ta pętla nadal działa, ponieważ 'hitTexts' to 'activeItems'
        for (let i = hitTexts.length - 1; i >= 0; i--) {
            const ht = hitTexts[i];
            if (ht.overrideText === null) {
                const dist = Math.hypot(x - ht.x, y - ht.y);
                const timeDiff = now - (ht.spawnTime || 0);

                if (dist < 25 && timeDiff < 0.15) {
                    ht.damage += damage;
                    // Użyj nowej funkcji formatującej
                    ht.text = '-' + formatDamage(ht.damage); 
                    // POPRAWKA v0.62e: Zmiana czasu życia na sekundy
                    ht.life = 0.66; // Było 40 klatek
                    ht.vy = -0.8 * 60; // Prędkość na sekundę
                    ht.spawnTime = now;
                    merged = true;
                    break;
                }
            }
        }
    }

    if (!merged) {
        // POPRAWKA v0.62: Użyj puli obiektów zamiast .push()
        const ht = hitTextPool.get();
        if (ht) {
            // Użyj nowej funkcji formatującej
            const dmgText = (damage >= 0 ? '-' + formatDamage(damage) : '+' + formatDamage(Math.abs(damage)));
            const text = overrideText !== null ? overrideText : dmgText;
            
            // POPRAWKA v0.62e: Zmiana czasu życia na sekundy i prędkości
            ht.init(x, y - 10, text, color, 0.66, -0.6 * 60); // (life, vy)
            
            ht.spawnTime = now;
            ht.overrideText = overrideText;
            ht.damage = damage;
        }
    }
}

// POPRAWKA v0.67: Logika Konfetti używa teraz poprawnych przeliczonych parametrów i starego, bardziej 'lekkiego' efektu.
export function spawnConfetti(particlePool, cx, cy) {
    const cols = ['#ff5252', '#ffca28', '#66bb6a', '#42a5f5', '#ab47bc', '#e91e63', '#9c27b0', '#00bcd4'];
    
    // Pobierz konfigurację konfetti, używając fallbacka
    const c = EFFECTS_CONFIG.CONFETTI || {};
    
    const numParticles = c.CONFETTI_COUNT || 80;
    const maxLife = c.CONFETTI_LIFE || 1.67;
    const initialSpeedMin = c.CONFETTI_SPEED_MIN || 180;
    const initialSpeedMax = c.CONFETTI_SPEED_MAX || 420;
    const initialUpVelocity = c.CONFETTI_INITIAL_UP_VELOCITY || -210;
    const gravityPerSecond = c.CONFETTI_GRAVITY || 6;
    const frictionPerSecond = c.CONFETTI_FRICTION || 1.0;
    const rotationSpeed = c.CONFETTI_ROTATION_SPEED || 12;

    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = initialSpeedMin + Math.random() * (initialSpeedMax - initialSpeedMin);
        const life = maxLife * (0.7 + Math.random() * 0.3); // Czas życia w sekundach

        // POPRAWKA v0.62: Użyj puli obiektów zamiast .push()
        const p = particlePool.get();
        if (p) {
            // init(x, y, vx, vy, life, color, gravity, friction, size, rotSpeed)
            p.init(
                cx, cy,
                Math.cos(angle) * speed, // vx (px/s)
                Math.sin(angle) * speed + initialUpVelocity, // vy (px/s)
                life, // s
                cols[Math.floor(Math.random() * cols.length)],
                gravityPerSecond, // px/s^2 (Bardzo mała grawitacja dla starszego, 'lekkiego' efektu)
                frictionPerSecond, // % zaniku na sekundę
                // POPRAWKA V0.67: Rozmiar cząsteczek z oryginalnego kodu (2.5 - 5px)
                2.5 + Math.random() * 2.5, // size 
                (Math.random() - 0.5) * rotationSpeed // rad/s
            );
        }
    }
}

// POPRAWKA v0.65: Czas życia pobierany z EFFECTS_CONFIG
export function addBombIndicator(bombIndicators, cx, cy, radius) {
    bombIndicators.push({
        x: cx,
        y: cy,
        maxRadius: radius,
        life: 0,
        maxLife: EFFECTS_CONFIG.BOMB_INDICATOR_LIFE 
    });
}

export function limitedShake(game, settings, mag, ms) {
    if (game.screenShakeDisabled) return;
    if (settings.fireRate <= 150) { mag = Math.min(mag, 2); ms = Math.min(ms, 80); }
    if (game.shakeMag < mag) game.shakeMag = mag;
    if (game.shakeT < ms) game.shakeT = ms;
}

/**
 * NOWA FUNKCJA (v0.72): Logika bomby: niszczy wrogów i tworzy efekty w danym promieniu.
 * PRZENIESIONA Z effects.js
 */
export function areaNuke(cx, cy, r, onlyXP = false, game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators) {
    
    // Pobierz konfigurację efektów bomby
    const c = EFFECTS_CONFIG;
    
    for (let i = 0; i < c.NUKE_PARTICLE_COUNT; i++) {
        const angle = (i / c.NUKE_PARTICLE_COUNT) * Math.PI * 2;
        const dist = Math.random() * r;
        
        // POPRAWKA v0.62: Użyj puli cząsteczek
        const p = particlePool.get();
        if (p) {
            // init(x, y, vx, vy, life, color, gravity, friction, size)
            p.init(
                cx + Math.cos(angle) * dist,
                cy + Math.sin(angle) * dist,
                (Math.random() * 2 - 1) * c.NUKE_PARTICLE_SPEED, // vx (px/s)
                (Math.random() * 2 - 1) * c.NUKE_PARTICLE_SPEED, // vy (px/s)
                c.NUKE_PARTICLE_LIFE, // life (s)
                ['#ff6b00', '#ff9500', '#ffbb00', '#fff59d'][Math.floor(Math.random() * 4)], // color
                0, // gravity
                (1.0 - 0.98) // friction (0.02)
            );
        }
    }
    
    for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const d = Math.hypot(cx - e.x, cy - e.y);
        if (d <= r) {
            // POPRAWKA v0.62: Użyj puli gemów
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
            
            if (!onlyXP) {
                function maybe(type, prob) {
                    if (!devSettings.allowedPickups.includes('all') && !devSettings.allowedPickups.includes(type)) return;
                    if (Math.random() < prob) {
                        const pos = findFreeSpotForPickup(pickups, e.x, e.y);
                        // POPRAWKA v0.72: Użycie zaimportowanej Mapy
                        const PickupClass = PICKUP_CLASS_MAP[type];
                        if (PickupClass) {
                            pickups.push(new PickupClass(pos.x, pos.y));
                        }
                    }
                }
                maybe('heal', 0.04);
                maybe('magnet', 0.025);
                maybe('speed', 0.02);
                maybe('shield', 0.015);
                maybe('bomb', 0.01);
                maybe('freeze', 0.01);
            }
            
            // POPRAWKA v0.62: Użyj puli cząsteczek
            for (let k = 0; k < 4; k++) {
                const p = particlePool.get();
                if (p) {
                    // init(x, y, vx, vy, life, color)
                    p.init(
                        e.x, e.y,
                        (Math.random() - 0.5) * 4 * 60, // vx (px/s)
                        (Math.random() - 0.5) * 4 * 60, // vy (px/s)
                        0.5, // life (było 30 klatek)
                        '#ff0000' // color
                    );
                }
            }
            
            enemies.splice(j, 1);
        }
    }
    
    limitedShake(game, settings, 10, 180);
    addBombIndicator(bombIndicators, cx, cy, r);
}


// --- POMOCNIKI RYSOWANIA I DANYCH (PRZYWRÓCONE FRAGMENTY) ---

// PRZYWRÓCONA FUNKCJA - NAPRAWIA BŁĄD 'getRandomColor'
export function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export function colorForEnemy(e) {
    if (e.type === 'elite') return '#9C27B0';
    if (e.type === 'horde') return '#8BC34A';
    if (e.type === 'aggressive') return '#2196F3';
    if (e.type === 'tank') return '#795548';
    if (e.type === 'splitter') return '#EC407A';
    if (e.type === 'ranged') return '#00BCD4';
    if (e.type === 'kamikaze') return '#FFEB3B';
    return '#FFC107';
}

export function getPickupColor(type) {
    if (type === 'heal') return '#E91E63';
    if (type === 'magnet') return '#8BC34A';
    if (type === 'shield') return '#90CAF9';
    if (type === 'speed') return '#FFD740';
    if (type === 'bomb') return '#FF7043';
    if (type === 'freeze') return '#81D4FA';
    return '#ccc';
}

export function getPickupEmoji(type) {
    if (type === 'heal') return '❤️';
    if (type === 'magnet') return '🧲';
    if (type === 'shield') return '🛡️';
    if (type === 'speed') return '⚡';
    if (type === 'bomb') return '💣';
    if (type === 'freeze') return '❄️';
    return '💎';
}

export function getPickupLabel(type) {
    if (type === 'heal') return 'Leczenie';
    if (type === 'magnet') return 'Magnes';
    if (type === 'shield') return 'Tarcza';
    if (type === 'speed') return 'Szybkość';
    if (type === 'bomb') return 'Bomba';
    if (type === 'freeze') return 'Zamrożenie';
    return 'Bonus';
}

// --- POMOCNIKI OBLICZEŃ ---

export function hpScale(game) {
    return 1 + 0.12 * (game.level - 1) + game.time / 90;
}

export function findFreeSpotForPickup(pickups, baseX, baseY) {
    const maxAttempts = 8;
    const minDist = 22;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const angle = (attempt / maxAttempts) * Math.PI * 2;
        const dist = 20 + Math.random() * 15;
        const testX = baseX + Math.cos(angle) * dist;
        const testY = baseY + Math.sin(angle) * dist;

        let isClear = true;
        for (const other of pickups) {
            const d = Math.hypot(testX - other.x, testY - other.y);
            if (d < minDist) {
                isClear = false;
                break;
            }
        }

        if (isClear) {
            return { x: testX, y: testY };
        }
    }

    return {
        x: baseX + (Math.random() - 0.5) * 35,
        y: baseY + (Math.random() - 0.5) * 35
    };
}

export function applyPickupSeparation(pickups, canvas) {
    const separationRadius = 25;

    for (let i = 0; i < pickups.length; i++) {
        const p = pickups[i];
        let separationX = 0;
        let separationY = 0;
        let neighborCount = 0;

        for (let j = 0; j < pickups.length; j++) {
            if (i === j) continue;
            const other = pickups[j];

            const dx = p.x - other.x;
            const dy = p.y - other.y;
            const dist = Math.hypot(dx, dy);

            if (dist < separationRadius && dist > 0.1) {
                const force = (separationRadius - dist) / separationRadius;
                separationX += (dx / dist) * force;
                separationY += (dy / dist) * force;
                neighborCount++;
            }
        }

        if (neighborCount > 0) {
            p.x += separationX * 0.3;
            p.y += separationY * 0.3;

            p.x = Math.max(15, Math.min(canvas.width - 15, p.x));
            p.y = Math.max(15, Math.min(canvas.height - 15, p.y));
        }
    }
}