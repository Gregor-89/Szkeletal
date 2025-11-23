// ==============
// STANDARDENEMY.JS (v0.93 - Cleanup: Użycie automatyki Enemy.js)
// Lokalizacja: /js/entities/enemies/standardEnemy.js
// ==============

import { Enemy } from '../enemy.js';
import { ENEMY_STATS } from '../../config/gameData.js';

export class StandardEnemy extends Enemy {
    // Konstruktor
    constructor(x, y, stats, hpScale = 1) {
        super(x, y, stats, hpScale);
        
        // USUNIĘTO: Ręczna konfiguracja animacji (cols, rows, totalFrames).
        // Teraz zajmuje się tym automatycznie klasa bazowa Enemy w oparciu o dostępność spritesheeta.
        
        this.frameTime = 0.08; // Opcjonalnie: DadGamer może mieć customową prędkość
        
        // POPRAWKA ROZMIARU (z v0.92):
        this.visualScale = 1.54;
    }

    getOutlineColor() {
        return '#ffa726';
    }
  
    update(dt, player, game) {
        if (this.isDead) return;

        // Obsługa Timerów
        if (this.hitStun > 0) this.hitStun -= dt;
        if (this.hitFlashT > 0) this.hitFlashT -= dt;
        if (this.hazardSlowdownT > 0) this.hazardSlowdownT -= dt;
        if (this.frozenTimer > 0) {
            this.frozenTimer -= dt;
            return; 
        }

        // Obsługa Knockbacku
        if (Math.abs(this.knockback.x) > 0.1 || Math.abs(this.knockback.y) > 0.1) {
            this.x += this.knockback.x * dt;
            this.y += this.knockback.y * dt;
            this.knockback.x *= 0.9;
            this.knockback.y *= 0.9;
        }
        // Ruch "Wężyk"
        else if (this.hitStun <= 0) {
            const dx = player.x - this.x;
            const dy = player.y - this.y; 
            const dist = Math.hypot(dx, dy);
            
            let vx = 0, vy = 0;
            let currentSpeed = this.getSpeed(game); 

            if (dist > 0.1) {
                const targetAngle = Math.atan2(dy, dx);
                const targetAngleEvasion = targetAngle + Math.PI / 2; 
                
                vx = Math.cos(targetAngle) * currentSpeed;
                vy = Math.sin(targetAngle) * currentSpeed;
                
                const sideSpeed = currentSpeed * 0.35; 
                vx += Math.cos(targetAngleEvasion) * sideSpeed * Math.sin(game.time * 2.5 + this.id);
                vy += Math.sin(targetAngleEvasion) * sideSpeed * Math.sin(game.time * 2.5 + this.id);

                if (Math.abs(vx) > 0.1) {
                    this.facingDir = Math.sign(vx);
                }
            }

            this.x += (vx + this.separationX * 1.0) * dt;
            this.y += (vy + this.separationY * 1.0) * dt;
        } 
        
        // Aktualizacja Animacji (używa logiki z Enemy.js)
        if (this.totalFrames > 1) {
            this.animTimer += dt;
            if (this.animTimer >= this.frameTime) {
                this.animTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            }
        }
    }
}