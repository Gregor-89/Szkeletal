// ==============
// ELITEENEMY.JS (v0.83n - Ostateczna Naprawa Składni)
// Lokalizacja: /js/entities/enemies/eliteEnemy.js
// ==============

import { Enemy } from '../enemy.js';
// POPRAWKA KRYTYCZNA: Zamiast 'findClosestEnemy' importujemy 'createEnemyInstance'
import { createEnemyInstance } from '../../managers/enemyManager.js'; 
import { playSound } from '../../services/audio.js';
import { WEAPON_CONFIG } from '../../config/gameData.js'; // Potrzebne do NovaAttack
import { EnemyBullet } from '../bullet.js'; // Potrzebne do NovaAttack

// STAŁE DLA ELITY
const SPECIAL_ATTACK_COOLDOWN = 7.0; // Co 7 sekund wykonuje atak specjalny
const CHARGE_DURATION = 2.0;
const CHARGE_SPEED_MULTIPLIER = 2.5;

/**
 * Wróg Elita (Mini-boss).
 * Posiada pasek HP i ataki specjalne.
 */
export class EliteEnemy extends Enemy {
    
    constructor(x, y, stats, hpScale) {
        super(x, y, stats, hpScale);
        this.specialAttackTimer = SPECIAL_ATTACK_COOLDOWN;
        this.chargeTimer = 0; // Czas trwania szarży
        this.isCharging = false;
    }
    
    getOutlineColor() { 
        // Czerwona ramka podczas szarży
        return this.isCharging ? '#f44336' : '#e91e63'; 
    }

    getSpeed(game, dist) {
        let speed = super.getSpeed(game, dist);
        if (this.isCharging) {
            speed *= CHARGE_SPEED_MULTIPLIER;
        }
        return speed;
    }

    drawHealthBar(ctx) {
        const w = 26, h = 4;
        const frac = Math.max(0, this.hp / this.maxHp);
        const bx = this.x - w / 2;
        const by = this.y - this.size / 2 - 8;
        
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
    
    // --- Logika Ataków Specjalnych ---
    
    doSpecialAttack(state) {
        const attackType = Math.floor(Math.random() * 3); // 0, 1, 2
        
        switch (attackType) {
            case 0:
                this.chargeAttack();
                break;
            case 1:
                this.novaAttack(state);
                break;
            case 2:
                this.spawnMinions(state);
                break;
        }
    }
    
    chargeAttack() {
        this.isCharging = true;
        this.chargeTimer = CHARGE_DURATION;
        playSound('EliteSpawn'); // Używamy dźwięku spawnu jako sygnału
    }
    
    novaAttack(state) {
        // Elite strzela pociskami wroga (EnemyBullet)
        const { game, eBulletsPool } = state; 
        const count = 8;
        // Obrażenia i prędkość jak pocisk wroga
        const dmg = 5; 
        const speed = WEAPON_CONFIG.RANGED_ENEMY_BULLET.SPEED || 504; 
        const size = 5; // Promień pocisku wroga (z rangedEnemy.js)
        
        for (let i = 0; i < count; i++) {
            const ang = (i / count) * Math.PI * 2;
            const bullet = eBulletsPool.get(); // Użyj puli pocisków wroga
            if (bullet) {
                // Pociski wroga używają EnemyBullet.init(x, y, vx, vy, size, damage, color)
                bullet.init(
                    this.x, this.y,
                    Math.cos(ang) * speed, 
                    Math.sin(ang) * speed, 
                    size,
                    dmg,
                    '#9C27B0' // Fioletowy pocisk
                );
            }
        }
        playSound('Nova');
    }
    
    spawnMinions(state) {
        const { enemies, game } = state;
        const count = 3; 
        const hpScale = (1 + 0.12 * (game.level - 1) + game.time / 90) * 0.5; // Słabsze miniony

        for (let i = 0; i < count; i++) {
            // Spawnowanie w pobliżu Elity (promień 50px)
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 20; 
            const minionX = this.x + Math.cos(angle) * dist;
            const minionY = this.y + Math.sin(angle) * dist;
            
            // POPRAWKA BŁĘDU LOGICZNEGO: Używamy zaimportowanej funkcji createEnemyInstance
            const newEnemy = createEnemyInstance('horde', minionX, minionY, hpScale, state.enemyIdCounter++);
            if (newEnemy) {
                 enemies.push(newEnemy);
            }
        }
        playSound('EliteSpawn');
    }
    
    // --- Nadpisana Metoda Update ---
    
    update(dt, player, game, state) {
        
        // 1. Logika ataku specjalnego
        if (this.hitStun <= 0) {
            this.specialAttackTimer -= dt;
            
            if (this.specialAttackTimer <= 0) {
                this.specialAttackTimer = SPECIAL_ATTACK_COOLDOWN;
                this.doSpecialAttack(state);
            }
        }
        
        // 2. Logika Szarży (trwałość i wyłączenie)
        if (this.isCharging) {
            this.chargeTimer -= dt;
            if (this.chargeTimer <= 0) {
                this.isCharging = false;
            }
        }
        
        // 3. Normalny ruch
        let isMoving = false;
        
        if (this.hitStun > 0) {
            this.hitStun -= dt;
        } else {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            let vx = 0, vy = 0;
            // currentSpeed jest już w px/s (przeskalowane w getSpeed())
            let currentSpeed = this.getSpeed(game, dist);

            if (dist > 0.1) {
                const targetAngle = Math.atan2(dy, dx);
                // Brak losowego offsetu dla Elity
                vx = Math.cos(targetAngle) * currentSpeed;
                vy = Math.sin(targetAngle) * currentSpeed;
                isMoving = true;
            }

            // Zastosuj dt do finalnego ruchu
            this.x += (vx + this.separationX * 0.5) * dt;
            this.y += (vy + this.separationY * 0.5) * dt;
        }
        
        // Aktualizacja animacji (skopiowana z klasy bazowej Enemy.js)
        const dtMs = dt * 1000;
        if (isMoving) {
            this.animationTimer += dtMs;
            if (this.animationTimer >= this.animationSpeed) {
                this.animationTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            }
        } else {
            this.currentFrame = 0;
            this.animationTimer = 0;
        }
    } 
    
    // NADPISANA METODA: Rysowanie paska HP (zgodnie z v0.71)
    drawHealthBar(ctx) {
        const w = 26, h = 4;
        const frac = Math.max(0, this.hp / this.maxHp);
        const bx = this.x - w / 2;
        const by = this.y - this.size / 2 - 8;
        
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
}