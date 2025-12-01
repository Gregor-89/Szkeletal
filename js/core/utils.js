// ==============
// UTILS.JS (v0.96j - FIX: Sound Import)
// Lokalizacja: /js/core/utils.js
// ==============

import { EFFECTS_CONFIG } from '../config/gameData.js';
import { devSettings } from '../services/dev.js'; 
import { PICKUP_CLASS_MAP } from '../managers/effects.js'; 
import { getLang } from '../services/i18n.js';
import { playSound } from '../services/audio.js'; // FIX: Dodano import

// --- FIZYKA I KOLIZJE ---

export function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distance = Math.hypot(dx, dy);
    return distance < (r1 + r2);
}

export function findFreeSpotForPickup(pickups, cx, cy, range = 50) {
    for (let i = 0; i < 10; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * range;
        const tx = cx + Math.cos(ang) * dist;
        const ty = cy + Math.sin(ang) * dist;
        let ok = true;
        for (const p of pickups) {
            if (Math.hypot(p.x - tx, p.y - ty) < 20) { ok = false; break; }
        }
        if (ok) return { x: tx, y: ty };
    }
    return { x: cx, y: cy };
}

// --- EFEKTY WIZUALNE I TEKSTOWE ---

export function addHitText(hitTextPool, hitTexts, x, y, damage, color = '#ffd54f', overrideText = null) {
    const now = performance.now() / 1000;
    let merged = false;

    function formatDamage(value) {
        if (value !== Math.floor(value) || value < 1) return value.toFixed(1);
        return value.toFixed(0);
    }
    
    if (damage > 0 && overrideText === null) {
        for (let i = hitTexts.length - 1; i >= 0; i--) {
            const ht = hitTexts[i];
            if (ht.overrideText === null) {
                const dist = Math.hypot(x - ht.x, y - ht.y);
                const timeDiff = now - (ht.spawnTime || 0);
                if (dist < 25 && timeDiff < 0.15) {
                    ht.damage += damage;
                    ht.text = '-' + formatDamage(ht.damage); 
                    ht.life = 0.66; 
                    ht.vy = -0.8 * 60; 
                    ht.spawnTime = now;
                    merged = true;
                    break;
                }
            }
        }
    }

    if (!merged) {
        const ht = hitTextPool.get();
        if (ht) {
            const dmgText = (damage >= 0 ? '-' + formatDamage(damage) : '+' + formatDamage(Math.abs(damage)));
            const text = overrideText !== null ? overrideText : dmgText;
            ht.init(x, y - 10, text, color, 0.66, -0.6 * 60); 
            ht.spawnTime = now;
            ht.overrideText = overrideText;
            ht.damage = damage;
        }
    }
}

export function spawnConfetti(particlePool, x, y) {
    const cols = ['#ff5252', '#ffca28', '#66bb6a', '#42a5f5', '#ab47bc', '#e91e63', '#9c27b0', '#00bcd4'];
    const count = EFFECTS_CONFIG.CONFETTI_COUNT || 80;
    
    for (let i = 0; i < count; i++) {
        const p = particlePool.get();
        if (p) {
            const color = cols[Math.floor(Math.random() * cols.length)];
            const angle = Math.random() * Math.PI * 2;
            const speed = 180 + Math.random() * 240;
            p.init(
                x, y, 
                Math.cos(angle) * speed, 
                Math.sin(angle) * speed - 210, 
                1.5, 
                color, 
                6, 1.0, 4 
            );
        }
    }
}

export function applyPickupSeparation(pickups, canvas) {
    const count = pickups.length;
    for (let i = 0; i < count; i++) {
        const p1 = pickups[i];
        for (let j = i + 1; j < count; j++) {
            const p2 = pickups[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.hypot(dx, dy);
            const minDist = 20;
            if (dist < minDist && dist > 0.1) {
                const force = (minDist - dist) / dist;
                const pushX = dx * force * 0.5;
                const pushY = dy * force * 0.5;
                p1.x += pushX; p1.y += pushY;
                p2.x -= pushX; p2.y -= pushY;
            }
        }
        p1.x = Math.max(10, Math.min(canvas.width * 8 - 10, p1.x));
        p1.y = Math.max(10, Math.min(canvas.height * 8 - 10, p1.y));
    }
}

export function addBombIndicator(bombIndicators, cx, cy, radius, maxLife = 0.375) {
    bombIndicators.push({
        x: cx,
        y: cy,
        maxRadius: radius,
        life: 0,
        maxLife: maxLife,
        isSiege: false
    });
}

export function limitedShake(game, settings, amount, duration) {
    if (game.screenShakeDisabled) return;
    if (game.shakeMag < amount) {
        game.shakeMag = amount;
        game.shakeT = duration;
    }
}

export function areaNuke(cx, cy, r, onlyXP = false, game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators, isWallNuke = false) {
    const waveSpeed = r * 3.0; 
    const duration = r / waveSpeed; 

    // FIX v0.96j: Dodano dźwięk eksplozji
    playSound('Explosion');

    bombIndicators.push({
        type: 'shockwave', 
        x: cx, 
        y: cy,
        currentRadius: 10,
        maxRadius: r,
        speed: waveSpeed,
        damage: isWallNuke ? 15 : 9999, 
        isWallNuke: isWallNuke,
        onlyXP: onlyXP, 
        hitEnemies: [],
        life: 0,
        maxLife: duration 
    });

    for (let i = gemsPool.activeItems.length - 1; i >= 0; i--) {
        const g = gemsPool.activeItems[i];
        const d = Math.hypot(cx - g.x, cy - g.y);
        if (d <= r) {
            if (isWallNuke) g.release(); 
        }
    }

    const particleCount = isWallNuke ? 20 : 40;
    const particleColor = isWallNuke ? '#607D8B' : ['#ff6b00', '#ff9500', '#ffbb00'][Math.floor(Math.random()*3)];
    
    for (let i = 0; i < particleCount; i++) {
        const p = particlePool.get();
        if (p) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * (r * 0.2); 
            p.init(
                cx + Math.cos(angle) * dist,
                cy + Math.sin(angle) * dist,
                (Math.random() - 0.5) * 600,
                (Math.random() - 0.5) * 600,
                0.8,
                particleColor,
                0, 0.95, 4
            );
        }
    }
    
    limitedShake(game, settings, 15, 250);
}

// --- POMOCNIKI DANYCH ---

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
    switch (type) {
        case 'heal': return '#E91E63';
        case 'magnet': return '#8BC34A';
        case 'shield': return '#90CAF9';
        case 'speed': return '#FFD740';
        case 'bomb': return '#FF7043';
        case 'freeze': return '#81D4FA';
        case 'chest': return '#ffd700';
        default: return '#ccc';
    }
}

export function getPickupEmoji(type) {
    if (type === 'heal') return '❤️';
    if (type === 'magnet') return '🧲';
    if (type === 'shield') return '🛡️';
    if (type === 'speed') return '👟'; 
    if (type === 'bomb') return '💣';
    if (type === 'freeze') return '❄️';
    return '💎';
}

export function getPickupLabel(type) {
    if (type === 'heal') return getLang('pickup_heal_name');
    if (type === 'magnet') return getLang('pickup_magnet_name');
    if (type === 'shield') return getLang('pickup_shield_name');
    if (type === 'speed') return getLang('pickup_speed_name');
    if (type === 'bomb') return getLang('pickup_bomb_name');
    if (type === 'freeze') return getLang('pickup_freeze_name');
    if (type === 'chest') return getLang('pickup_chest_name'); 
    return 'Bonus';
}

export function hpScale(game) {
    return 1 + 0.10 * (game.level - 1) + game.time / 90;
}