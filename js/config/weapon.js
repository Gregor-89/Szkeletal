// ==============
// WEAPON.JS (v0.65 - Pełna centralizacja danych - Poprawka stabilności)
// Lokalizacja: /js/config/weapon.js
// ==============

import { limitedShake, addHitText } from '../core/utils.js';
import { findClosestEnemy, killEnemy } from '../managers/enemyManager.js';
import { playSound } from '../services/audio.js';
import { areaNuke } from '../managers/effects.js';
// POPRAWKA v0.65: Import nowej centralnej konfiguracji
import { GAME_CONFIG, WEAPON_CONFIG, PERK_CONFIG } from './gameData.js';

/**
 * POPRAWKA v0.65: Usunięto stałą INITIAL_SETTINGS.
 * Została przeniesiona do gameData.js (jako GAME_CONFIG i WEAPON_CONFIG).
 */

// ===================================
// KLASA BAZOWA BRONI
// ===================================

class Weapon {
    constructor(player) {
        this.player = player;
        this.level = 1;
        this.lastFire = 0; 
    }

    update(state) {
        // Domyślnie nic nie rób
    }

    draw(ctx) {
        // Domyślnie nic nie rysuj
    }

    upgrade(perk) {
        this.level++;
        // Wywołujemy updateStats() bez argumentu,
        // ponieważ teraz będzie ona pobierać dane z PERK_CONFIG
        this.updateStats(); 
    }
    
    updateStats() {
        // Domyślnie nic nie rób
    }
    
    toJSON() {
        return {
            type: this.constructor.name,
            level: this.level,
            lastFire: this.lastFire
        };
    }
}

// ===================================
// BRONIE SPECJALISTYCZNE
// ===================================

/**
 * AutoGun: Domyślna broń gracza.
 */
export class AutoGun extends Weapon {
    constructor(player) {
        super(player);
        
        // POPRAWKA STABILNOŚCI: Dodanie defensywnego fallbacka do konfiguracji
        const config = WEAPON_CONFIG.AUTOGUN || {};
        
        // POPRAWKA v0.65: Użyj wartości z WEAPON_CONFIG lub wartości domyślnych (500, 1, 864, 3)
        this.fireRate = config.BASE_FIRE_RATE || 500;
        this.bulletDamage = config.BASE_DAMAGE || 1;
        this.bulletSpeed = config.BASE_SPEED || 864;
        this.bulletSize = config.BASE_SIZE || 3;
        
        this.multishot = 0;
        this.pierce = 0;
        
        this.cachedTarget = null;
        this.cacheTimer = 0; 
    }

    // Ta metoda jest teraz wywoływana przez perk.apply() w perks.js
    // Wartości są modyfikowane bezpośrednio w perks.js
    updateStats(perk) {
        if (!perk) return; // Wywołane przez addWeapon, a nie przez apply
        
        // Zabezpieczenie przed brakiem konfiguracji perka
        const config = PERK_CONFIG[perk.id] || {};
        
        switch (perk.id) {
            case 'firerate':
                this.fireRate *= config.value;
                break;
            case 'damage':
                this.bulletDamage += config.value;
                break;
            case 'multishot':
                this.multishot += config.value;
                break;
            case 'pierce':
                this.pierce += config.value;
                break;
        }
    }
    
    update(state) {
        const { game, enemies, bulletsPool, settings, dt } = state;
        const now = performance.now();
        
        if (now - this.lastFire < this.fireRate / (game.hyper ? 1.2 : 1)) return;
        
        this.cacheTimer -= dt;
        if (this.cacheTimer <= 0 || !this.cachedTarget || this.cachedTarget.hp <= 0) {
            this.cacheTimer = 0.1; 
            const { enemy: tgt } = findClosestEnemy(this.player, enemies);
            this.cachedTarget = tgt;
        }

        if (!this.cachedTarget) return; 
        
        this.lastFire = now;
        playSound('Shoot');

        const dx = this.cachedTarget.x - this.player.x;
        const dy = this.cachedTarget.y - this.player.y;
        const baseAng = Math.atan2(dy, dx);
        const count = 1 + this.multishot;
        const spread = Math.min(0.4, 0.12 * this.multishot);

        // Prędkość jest już w px/s
        const finalSpeed = this.bulletSpeed * (game.hyper ? 1.15 : 1);

        for (let i = 0; i < count; i++) {
            const off = spread * (i - (count - 1) / 2);
            
            const bullet = bulletsPool.get();
            if (bullet) {
                bullet.init(
                    this.player.x,
                    this.player.y,
                    Math.cos(baseAng + off) * finalSpeed, // px/s
                    Math.sin(baseAng + off) * finalSpeed, // px/s
                    this.bulletSize,
                    this.bulletDamage,
                    '#FFC107',
                    this.pierce
                );
            }
        }
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            fireRate: this.fireRate,
            bulletDamage: this.bulletDamage,
            multishot: this.multishot,
            pierce: this.pierce
        };
    }
}

/**
 * OrbitalWeapon: Broń pasywna.
 */
export class OrbitalWeapon extends Weapon {
    constructor(player) {
        super(player);
        this.items = []; 
        this.angle = 0;
        this.radius = 0;
        this.damage = 0;
        this.speed = 0;
        this.collisionTimer = 0;
        this.updateStats(); 
    }
    
    // POPRAWKA v0.65: Skalowanie pobierane z PERK_CONFIG
    updateStats() {
        const c = PERK_CONFIG.orbital || {}; // POPRAWKA STABILNOŚCI: Dodanie defensywnego fallbacka
        
        this.damage = (c.DAMAGE_BASE || 1) + Math.floor(this.level / (c.DAMAGE_LEVEL_DIVISOR || 2));
        this.radius = ((c.RADIUS_BASE || 28) + (c.RADIUS_PER_LEVEL || 6) * this.level) * (c.RADIUS_MULTIPLIER || 1.5);
        this.speed = (c.SPEED_BASE || 1.2) + (c.SPEED_PER_LEVEL || 0.2) * this.level;
        
        // Ta logika jest poprawna - dodaje nowy orbital, jeśli poziom jest wyższy niż liczba itemów
        while (this.items.length < this.level) {
            this.items.push({ angle: Math.random() * Math.PI * 2, ox: 0, oy: 0 });
        }
        while (this.items.length > this.level) {
            this.items.pop();
        }
    }

    update(state) {
        // POPRAWKA v0.62: Pobranie pul obiektów
        const { dt, enemies, particlePool, hitTextPool, hitTexts, game, settings, gemsPool, pickups, chests } = state;
        
        // Ta prędkość (radiany/s) jest już poprawnie mnożona przez dt.
        this.angle += this.speed * dt;
        
        for (let i = 0; i < this.items.length; i++) {
            const it = this.items[i];
            const ang = this.angle + i * (Math.PI * 2 / this.items.length);
            it.ox = this.player.x + Math.cos(ang) * this.radius;
            it.oy = this.player.y + Math.sin(ang) * this.radius;
        }

        this.collisionTimer -= dt;
        if (this.collisionTimer > 0) return; 
        
        this.collisionTimer = 0.05; 
        
        for (let i = 0; i < this.items.length; i++) {
            const it = this.items[i];
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (Math.abs(it.ox - e.x) > this.radius || Math.abs(it.oy - e.y) > this.radius) {
                    continue;
                }
                
                const d = Math.hypot(it.ox - e.x, it.oy - e.y);
                if (d < 5 + e.size * 0.5) {
                    const dps = this.damage * this.collisionTimer;
                    e.hp -= dps; 
                    
                    // POPRAWKA v0.62e: Użyj puli cząsteczek i fizyki opartej na DT
                    const p = particlePool.get();
                    if (p) {
                        p.init(
                            e.x, e.y, 
                            (Math.random() - 0.5) * 1 * 60, // vx (px/s)
                            (Math.random() - 0.5) * 1 * 60, // vy (px/s)
                            0.16, // life (było 10 klatek)
                            '#ff0000'
                        );
                    }
                    
                    // POPRAWKA v0.62: Użyj puli hitText
                    addHitText(hitTextPool, hitTexts, e.x, e.y, dps, '#80deea');
                    
                    if (e.hp <= 0) {
                        // POPRAWKA v0.62: Przekaż pule do killEnemy
                        state.enemyIdCounter = killEnemy(j, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, true);
                    }
                }
            }
        }
    }
    
    draw(ctx) {
        for (let i = 0; i < this.items.length; i++) {
            const it = this.items[i];
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#80DEEA';
            ctx.fillStyle = '#80DEEA';
            ctx.beginPath();
            ctx.arc(it.ox, it.oy, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            angle: this.angle
        };
    }
}

/**
 * NovaWeapon: Broń obszarowa.
 */
export class NovaWeapon extends Weapon {
    constructor(player) {
        super(player);
        this.timer = 0; 
        this.cooldown = 0;
        this.bulletCount = 0;
        this.updateStats(); 
    }
    
    // POPRAWKA v0.65: Skalowanie pobierane z PERK_CONFIG
    updateStats() {
        const c = PERK_CONFIG.nova || {}; // POPRAWKA STABILNOŚCI: Dodanie defensywnego fallbacka
        
        this.cooldown = Math.max((c.COOLDOWN_MIN || 0.6), ((c.COOLDOWN_BASE || 2.2) - (c.COOLDOWN_REDUCTION_PER_LEVEL || 0.3) * this.level));
        this.bulletCount = Math.min((c.COUNT_MAX || 24), (c.COUNT_BASE || 8) + (c.COUNT_PER_LEVEL || 2) * this.level);
        
        if (this.timer === 0) { 
             this.timer = this.cooldown;
        }
    }
    
    update(state) {
        const { dt, game, bulletsPool, settings } = state;
        
        this.timer -= dt;
        if (this.timer <= 0) {
            this.timer = this.cooldown;
            
            const autoGun = this.player.getWeapon(AutoGun);
            // POPRAWKA v0.65: Użyj wartości z WEAPON_CONFIG jako fallback
            const fallbackConfig = WEAPON_CONFIG.AUTOGUN || {};
            const dmg = autoGun ? autoGun.bulletDamage : (fallbackConfig.BASE_DAMAGE || 1);
            const pierce = autoGun ? autoGun.pierce : 0;
            const speed = autoGun ? autoGun.bulletSpeed : (fallbackConfig.BASE_SPEED || 864); // Już w px/s
            const size = autoGun ? autoGun.bulletSize : (fallbackConfig.BASE_SIZE || 3);

            for (let i = 0; i < this.bulletCount; i++) {
                const ang = (i / this.bulletCount) * Math.PI * 2;
                
                const bullet = bulletsPool.get();
                if (bullet) {
                    bullet.init(
                        this.player.x,
                        this.player.y,
                        Math.cos(ang) * speed, // px/s
                        Math.sin(ang) * speed, // px/s
                        size,
                        dmg,
                        '#FFC107',
                        pierce
                    );
                }
            }

            playSound('Nova');
            limitedShake(game, settings, 4, 100);
        }
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            timer: this.timer
        };
    }
}