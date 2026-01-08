// ==============
// ELITEENEMY.JS (v0.97 - FIX: Losowe Grafiki Pocisków Nova)
// Lokalizacja: /js/entities/enemies/eliteEnemy.js
// ==============

import { Enemy } from '../enemy.js';
import { createEnemyInstance } from '../../managers/enemyManager.js'; 
import { playSound } from '../../services/audio.js';
import { WEAPON_CONFIG } from '../../config/gameData.js'; 

const SPECIAL_ATTACK_COOLDOWN = 7.0; 
const CHARGE_DURATION = 2.0;
const CHARGE_SPEED_MULTIPLIER = 2.5;

// ZMIANA: Lista dostępnych grafik dla pocisków Bossa
const BOSS_PROJECTILE_KEYS = [
    'boss_proj_1',
    'boss_proj_2',
    'boss_proj_3',
    'boss_proj_4',
    'boss_proj_5',
    'boss_proj_6'
];

export class EliteEnemy extends Enemy {
    
    constructor(x, y, stats, hpScale) {
        super(x, y, stats, hpScale);
        
        this.specialAttackTimer = SPECIAL_ATTACK_COOLDOWN;
        this.chargeTimer = 0; 
        this.isCharging = false;
        
        this.visualScale = 1.9; 
        this.assetKey = 'enemy_elite';
        this.mass = 5.0; 
        this.showHealthBar = true;
    }
    
    getOutlineColor() { 
        return this.isCharging ? '#f44336' : '#9C27B0'; 
    }

    getSpeed(game, dist) {
        let speed = super.getSpeed(game, dist); 
        if (this.isCharging) {
            speed *= CHARGE_SPEED_MULTIPLIER;
        }
        return speed;
    }

    applyKnockback(kx, ky) {
        super.applyKnockback(kx * 0.2, ky * 0.2);
    }

    // --- LOGIKA ATAKÓW SPECJALNYCH ---

    doSpecialAttack(state) {
        const attackType = Math.floor(Math.random() * 3); 
        switch (attackType) {
            case 0: this.chargeAttack(); break;
            case 1: this.novaAttack(state); break;
            case 2: this.spawnMinions(state); break;
        }
    }
    
    chargeAttack() {
        this.isCharging = true;
        this.chargeTimer = CHARGE_DURATION;
        playSound('EliteSpawn'); 
    }
    
    // ZMIANA GLÓWNA: Atak Nova z losowymi grafikami
    novaAttack(state) {
        const { eBulletsPool } = state; 
        const count = 12; 
        const dmg = 10; 
        const speed = WEAPON_CONFIG.RANGED_ENEMY_BULLET.SPEED || 432; 
        
        // ZMIANA: Zwiększamy rozmiar (wizualny promień), bo grafiki dymków muszą być czytelne
        const size = 20; 
        
        for (let i = 0; i < count; i++) {
            const ang = (i / count) * Math.PI * 2;
            const bullet = eBulletsPool.get(); 
            
            if (bullet) {
                // ZMIANA: Losowanie klucza grafiki
                const randomKey = BOSS_PROJECTILE_KEYS[Math.floor(Math.random() * BOSS_PROJECTILE_KEYS.length)];

                bullet.init(
                    this.x, this.y,
                    Math.cos(ang) * speed, 
                    Math.sin(ang) * speed, 
                    size,
                    dmg,
                    randomKey // Przekazujemy klucz grafiki (np. 'boss_proj_3') zamiast koloru
                );
            }
        }
        playSound('Nova');
    }
    
    spawnMinions(state) {
        const { enemies, game } = state;
        const count = 3; 
        const hpScale = (1 + 0.10 * (game.level - 1) + game.time / 90) * 0.5; 

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 30; 
            const minionX = this.x + Math.cos(angle) * dist;
            const minionY = this.y + Math.sin(angle) * dist;
            
            const newEnemy = createEnemyInstance('horde', minionX, minionY, hpScale, state.enemyIdCounter++);
            if (newEnemy) {
                 enemies.push(newEnemy);
            }
        }
        playSound('EliteSpawn');
    }
    
    // --- PĘTLA GŁÓWNA ---

    update(dt, player, game, state) {
        if (this.isDead) return;

        if (this.hitStun <= 0) {
            this.specialAttackTimer -= dt;
            if (this.specialAttackTimer <= 0) {
                this.specialAttackTimer = SPECIAL_ATTACK_COOLDOWN;
                this.doSpecialAttack(state);
            }
        }
        
        if (this.isCharging) {
            this.chargeTimer -= dt;
            if (this.chargeTimer <= 0) {
                this.isCharging = false;
            }
        }
        
        if (this.hitStun > 0) {
            this.hitStun -= dt;
        } else {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            let vx = 0, vy = 0;
            let currentSpeed = this.getSpeed(game, dist);

            if (dist > 0.1) {
                const targetAngle = Math.atan2(dy, dx);
                vx = Math.cos(targetAngle) * currentSpeed;
                vy = Math.sin(targetAngle) * currentSpeed;
                
                if (Math.abs(vx) > 0.1) {
                    this.facingDir = Math.sign(vx);
                }
            }

            this.x += (vx + this.separationX * 1.0) * dt;
            this.y += (vy + this.separationY * 1.0) * dt;
        }
        
        if (this.hitFlashT > 0) this.hitFlashT -= dt;
        if (this.frozenTimer > 0) this.frozenTimer -= dt;

        if (Math.abs(this.knockback.x) > 0.1 || Math.abs(this.knockback.y) > 0.1) {
            this.x += this.knockback.x * dt;
            this.y += this.knockback.y * dt;
            this.knockback.x *= 0.9;
            this.knockback.y *= 0.9;
        }

        if (this.totalFrames > 1) {
            const animSpeed = this.isCharging ? 2.0 : 1.0;
            this.animTimer += dt * animSpeed;
            if (this.animTimer >= this.frameTime) {
                this.animTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            }
        }
    } 

    // --- RYSOWANIE ---
    drawHealthBar(ctx) {
        if (!this.showHealthBar) return;
        ctx.save();
        if (this.facingDir === -1) ctx.scale(-1, 1);
        const w = 60; const h = 8; const frac = Math.max(0, this.hp / this.maxHp);
        const bx = -w / 2; const spriteH = this.size * this.visualScale; const by = -(spriteH / 2) - 4; 
        ctx.fillStyle = '#300'; ctx.fillRect(bx, by, w, h);
        ctx.fillStyle = '#9C27B0'; ctx.fillRect(bx, by, w * frac, h);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, w, h);
        ctx.restore();
    }
}