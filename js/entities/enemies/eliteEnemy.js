// ==============
// ELITEENEMY.JS (v0.92 - Fix: Skala i HealthBar)
// Lokalizacja: /js/entities/enemies/eliteEnemy.js
// ==============

import { Enemy } from '../enemy.js';
import { createEnemyInstance } from '../../managers/enemyManager.js'; 
import { playSound } from '../../services/audio.js';
import { WEAPON_CONFIG } from '../../config/gameData.js'; 
import { EnemyBullet } from '../bullet.js'; 

const SPECIAL_ATTACK_COOLDOWN = 7.0; 
const CHARGE_DURATION = 2.0;
const CHARGE_SPEED_MULTIPLIER = 2.5;

export class EliteEnemy extends Enemy {
    
    constructor(x, y, stats, hpScale) {
        super(x, y, stats, hpScale);
        this.specialAttackTimer = SPECIAL_ATTACK_COOLDOWN;
        this.chargeTimer = 0; 
        this.isCharging = false;
        
        // ZMIANA: visualScale = 1.0 (zamiast drawScale = 1.5)
        this.visualScale = 1.0; 
        this.assetKey = 'enemy_elite';
    }
    
    getOutlineColor() { 
        return this.isCharging ? '#f44336' : '#e91e63'; 
    }

    getSpeed(game, dist) {
        let speed = super.getSpeed(game, dist); // W klasie bazowej v0.91 speed bierze 2 argumenty
        if (this.isCharging) {
            speed *= CHARGE_SPEED_MULTIPLIER;
        }
        return speed;
    }

    // NADPISANA METODA z v0.91W - Dostosowana do visualScale
    drawHealthBar(ctx) {
        const w = 40, h = 6; 
        const frac = Math.max(0, this.hp / this.maxHp);
        
        // Rysujemy względem środka (zakładając, że w draw() jest translate)
        // Ale chwila, EliteEnemy nie ma własnego draw() w v0.91W!
        // Korzysta z draw() klasy bazowej Enemy.
        // W klasie bazowej Enemy (v0.92 powyżej) drawHealthBar jest wywoływana
        // PO translate(this.x, this.y).
        // Więc tutaj musimy rysować względem (0,0).
        
        const bx = -w / 2;
        
        // Pozycja paska: 
        const spriteHeight = this.size * this.visualScale;
        const by = -(spriteHeight / 2) - 12; 
        
        ctx.fillStyle = '#300';
        ctx.fillRect(bx, by, w, h);
        let hpColor;
        if (frac > 0.6) hpColor = '#0f0';
        else if (frac > 0.3) hpColor = '#ff0';
        else hpColor = '#f00';
        ctx.fillStyle = hpColor;
        ctx.fillRect(bx, by, w * frac, h);
        ctx.strokeStyle = '#111';
        ctx.strokeRect(bx, by, w, h);
    }
    
    // ... Reszta metod (doSpecialAttack, chargeAttack, novaAttack, spawnMinions, update) bez zmian ...
    // Skopiuj je ze swojego pliku v0.91W
    
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
    
    novaAttack(state) {
        const { game, eBulletsPool } = state; 
        const count = 8;
        const dmg = 5; 
        const speed = WEAPON_CONFIG.RANGED_ENEMY_BULLET.SPEED || 504; 
        const size = 5; 
        
        for (let i = 0; i < count; i++) {
            const ang = (i / count) * Math.PI * 2;
            const bullet = eBulletsPool.get(); 
            if (bullet) {
                bullet.init(
                    this.x, this.y,
                    Math.cos(ang) * speed, 
                    Math.sin(ang) * speed, 
                    size,
                    dmg,
                    '#9C27B0' 
                );
            }
        }
        playSound('Nova');
    }
    
    spawnMinions(state) {
        const { enemies, game } = state;
        const count = 3; 
        const hpScale = (1 + 0.12 * (game.level - 1) + game.time / 90) * 0.5; 

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 20; 
            const minionX = this.x + Math.cos(angle) * dist;
            const minionY = this.y + Math.sin(angle) * dist;
            
            const newEnemy = createEnemyInstance('horde', minionX, minionY, hpScale, state.enemyIdCounter++);
            if (newEnemy) {
                 enemies.push(newEnemy);
            }
        }
        playSound('EliteSpawn');
    }
    
    update(dt, player, game, state) {
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
        
        if (this.hitFlashT > 0) {
            this.hitFlashT -= dt;
        }
    } 
}