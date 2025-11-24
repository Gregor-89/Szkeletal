// ==============
// UTILS.JS (v0.99 - FIX: Przywrócono checkCircleCollision)
// Lokalizacja: /js/core/utils.js
// ==============

import { EFFECTS_CONFIG, WALL_DETONATION_CONFIG, GEM_CONFIG } from '../config/gameData.js';
import { devSettings } from '../services/dev.js'; 
import { PICKUP_CLASS_MAP } from '../managers/effects.js'; 
import { getLang } from '../services/i18n.js';

// --- FIZYKA I KOLIZJE ---

/**
 * Sprawdza kolizję dwóch okręgów.
 * (Tej funkcji brakowało, co powodowało błąd w collisions.js)
 */
export function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distance = Math.hypot(dx, dy);
    return distance < (r1 + r2);
}

// --- EFEKTY WIZUALNE ---

export function addHitText(hitTextPool, hitTexts, x, y, damage, color = '#ffd54f', overrideText = null) {
    const now = performance.now() / 1000;
    let merged = false;

    function formatDamage(value) {
        if (value !== Math.floor(value) || value < 1) {
            return value.toFixed(1);
        }
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

export function spawnConfetti(particlePool, cx, cy) {
    const cols = ['#ff5252', '#ffca28', '#66bb6a', '#42a5f5', '#ab47bc', '#e91e63', '#9c27b0', '#00bcd4'];
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
        const life = maxLife * (0.7 + Math.random() * 0.3); 

        const p = particlePool.get();
        if (p) {
            p.init(
                cx, cy,
                Math.cos(angle) * speed, 
                Math.sin(angle) * speed + initialUpVelocity, 
                life, 
                cols[Math.floor(Math.random() * cols.length)],
                gravityPerSecond, 
                frictionPerSecond, 
                2.5 + Math.random() * 2.5, 
                (Math.random() - 0.5) * rotationSpeed 
            );
        }
    }
}

export function addBombIndicator(bombIndicators, cx, cy, radius, maxLife = EFFECTS_CONFIG.BOMB_INDICATOR_LIFE, color = 'rgba(255, 255, 255, 0.9)', shadow = 'rgba(255, 152, 0, 0.7)') {
    bombIndicators.push({
        x: cx,
        y: cy,
        maxRadius: radius,
        life: 0,
        maxLife: maxLife, 
        color: color,
        shadow: shadow
    });
}

export function limitedShake(game, settings, mag, ms) {
    if (game.screenShakeDisabled) return;
    if (settings.fireRate <= 150) { mag = Math.min(mag, 2); ms = Math.min(ms, 80); }
    if (game.shakeMag < mag) game.shakeMag = mag;
    if (game.shakeT < ms) game.shakeT = ms;
}

export function areaNuke(cx, cy, r, onlyXP = false, game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators, isWallNuke = false) {
    const c = EFFECTS_CONFIG;
    const isWallDetonation = isWallNuke;
    
    const particleColor = isWallDetonation ? '#607D8B' : ['#ff6b00', '#ff9500', '#ffbb00', '#fff59d'][Math.floor(Math.random() * 4)];
    const particleCount = isWallDetonation ? 20 : c.NUKE_PARTICLE_COUNT;

    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const dist = Math.random() * r;
        
        const p = particlePool.get();
        if (p) {
            p.init(
                cx + Math.cos(angle) * dist,
                cy + Math.sin(angle) * dist,
                (Math.random() * 2 - 1) * c.NUKE_PARTICLE_SPEED * (isWallDetonation ? 0.5 : 1), 
                (Math.random() * 2 - 1) * c.NUKE_PARTICLE_SPEED * (isWallDetonation ? 0.5 : 1), 
                c.NUKE_PARTICLE_LIFE * (isWallDetonation ? 0.3 : 1), 
                particleColor, 
                0, 
                (1.0 - 0.98) 
            );
        }
    }
    
    for (let i = gemsPool.activeItems.length - 1; i >= 0; i--) {
        const g = gemsPool.activeItems[i];
        const d = Math.hypot(cx - g.x, cy - g.y);
        if (d <= r) {
            g.release();
        }
    }

    for (let j = pickups.length - 1; j >= 0; j--) {
        const p = pickups[j];
        const d = Math.hypot(cx - p.x, cy - p.y);
        if (d <= r) {
            pickups.splice(j, 1);
        }
    }
    
    for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const d = Math.hypot(cx - e.x, cy - e.y);
        
        if (d <= r) {
            if (isWallDetonation) continue; 
            
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
                    
                    if (!PICKUP_CLASS_MAP) return;
                    
                    if (Math.random() < prob) {
                        const pos = findFreeSpotForPickup(pickups, e.x, e.y);
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
            
            enemies.splice(j, 1);
        }
    }
    
    limitedShake(game, settings, 10, 180);
    if (!isWallDetonation) {
        addBombIndicator(bombIndicators, cx, cy, r);
    }
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