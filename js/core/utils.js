// ==============
// UTILS.JS (v0.67 - Konfetti Fix)
// Lokalizacja: /js/core/utils.js
// ==============

// POPRAWKA v0.65: Import nowej centralnej konfiguracji
import { EFFECTS_CONFIG } from '../config/gameData.js';

// --- EFEKTY WIZUALNE ---

export function addHitText(hitTextPool, hitTexts, x, y, damage, color = '#ffd54f', overrideText = null) {
    const now = performance.now() / 1000;
    let merged = false;

    if (damage > 0 && overrideText === null) {
        // Ta pętla nadal działa, ponieważ 'hitTexts' to 'activeItems'
        for (let i = hitTexts.length - 1; i >= 0; i--) {
            const ht = hitTexts[i];
            if (ht.overrideText === null) {
                const dist = Math.hypot(x - ht.x, y - ht.y);
                const timeDiff = now - (ht.spawnTime || 0);

                if (dist < 25 && timeDiff < 0.15) {
                    ht.damage += damage;
                    ht.text = '-' + ht.damage.toFixed(0);
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
            const text = overrideText !== null ? overrideText : (damage >= 0 ? '-' + damage.toFixed(0) : '+' + Math.abs(damage).toFixed(0));
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

// --- POMOCNIKI RYSOWANIA I DANYCH ---

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