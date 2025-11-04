// ==============
// WEAPON.JS (v0.63c - Poprawka skalowania prędkości DT)
// Lokalizacja: /js/config/weapon.js
// ==============

import { limitedShake, addHitText } from '../core/utils.js';
import { findClosestEnemy, killEnemy } from '../managers/enemyManager.js';
import { playSound } from '../services/audio.js';
// import { PlayerBullet } from '../entities/bullet.js'; // Już niepotrzebne
import { areaNuke } from '../managers/effects.js';

/**
 * Ustawienia początkowe broni (i inne, które tu pasują)
 * POPRAWKA v0.63c: Przeskalowanie prędkości pocisku na 144 FPS (zamiast 60)
 */
export const INITIAL_SETTINGS = {
    spawn: 0.02,
    maxEnemies: 110,
    bulletSpeed: 864, // Było: 360 (teraz 6 * 144)
    bulletSize: 3,
    bulletDamage: 1,
    fireRate: 500,
    eliteInterval: 24000,
    xpNeeded: 5
};

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
        this.updateStats(perk);
    }
    
    updateStats(perk) {
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
        this.fireRate = INITIAL_SETTINGS.fireRate;
        this.bulletDamage = INITIAL_SETTINGS.bulletDamage;
        // POPRAWKA v0.64: Użyj przeskalowanej prędkości
        this.bulletSpeed = INITIAL_SETTINGS.bulletSpeed; // Już jest w px/s
        this.bulletSize = INITIAL_SETTINGS.bulletSize;
        this.multishot = 0;
        this.pierce = 0;
        
        this.cachedTarget = null;
        this.cacheTimer = 0; 
    }

    updateStats(perk) {
        switch (perk.id) {
            case 'firerate':
                this.fireRate *= 0.85;
                break;
            case 'damage':
                this.bulletDamage += 1;
                break;
            case 'multishot':
                this.multishot += 1;
                break;
            case 'pierce':
                this.pierce += 1;
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
    
    updateStats(perk) {
        this.damage = 1 + Math.floor(this.level / 2);
        this.radius = (28 + 6 * this.level) * 1.5;
        // UWAGA: Prędkość orbitala (radiany/s) nie musi być skalowana *60,
        // ponieważ była już poprawnie mnożona przez dt w v0.62.
        this.speed = (1.2 + 0.2 * this.level);
        
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
    
    updateStats(perk) {
        this.cooldown = Math.max(0.6, (2.2 - 0.3 * this.level));
        this.bulletCount = Math.min(24, 8 + 2 * this.level);
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
            const dmg = autoGun ? autoGun.bulletDamage : INITIAL_SETTINGS.bulletDamage;
            const pierce = autoGun ? autoGun.pierce : 0;
            // POPRAWKA v0.64: Użyj przeskalowanej prędkości
            const speed = autoGun ? autoGun.bulletSpeed : INITIAL_SETTINGS.bulletSpeed; // Już w px/s
            const size = autoGun ? autoGun.bulletSize : INITIAL_SETTINGS.bulletSize;

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