// ==============
// RANGEDENEMY.JS (v0.77s - TEST: Zwiększenie separacji 2x)
// Lokalizacja: /js/entities/enemies/rangedEnemy.js
// ==============

import { Enemy } from '../enemy.js';
// Wróg dystansowy potrzebuje konfiguracji broni
import { WEAPON_CONFIG } from '../../config/gameData.js';

/**
 * Wróg Dystansowy.
 * Utrzymuje dystans i strzela do gracza.
 */
export class RangedEnemy extends Enemy {
    getSeparationRadius() { 
        // POPRAWKA v0.77s: Zwiększono 2x (z 32 na 64)
        return 64; 
    }
    
    getOutlineColor() { 
        return '#4dd0e1'; 
    }

    /**
     * Nadpisana metoda update dla wroga dystansowego.
     */
    update(dt, player, game, state) {
        let isMoving = false;
        if (this.hitStun > 0) {
             this.hitStun -= dt;
        } else {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            let vx = 0, vy = 0;
            let currentSpeed = this.getSpeed(game, dist); 

            if (dist < 180) { vx = -(dx / dist) * currentSpeed; vy = -(dy / dist) * currentSpeed; isMoving = true; } // Uciekaj
            else if (dist > 220) { vx = (dx / dist) * currentSpeed; vy = (dy / dist) * currentSpeed; isMoving = true; } // Podchodź
            else { vx = 0; vy = 0; } // Stój
            
            this.x += (vx + this.separationX * 0.5) * dt;
            this.y += (vy + this.separationY * 0.5) * dt;
            
            // Strzelanie
            this.rangedCooldown -= dt;
            if (this.rangedCooldown <= 0 && dist > 0.1 && state.eBulletsPool) {
                const bulletSpeed = WEAPON_CONFIG.RANGED_ENEMY_BULLET.SPEED * (game.freezeT > 0 ? 0.25 : 1); // px/s
                
                const bullet = state.eBulletsPool.get();
                if (bullet) {
                    bullet.init(
                        this.x, this.y,
                        (dx / dist) * bulletSpeed,
                        (dy / dist) * bulletSpeed,
                        5, 5, '#00BCD4'
                    );
                }
                
                this.rangedCooldown = 1.2 / (game.freezeT > 0 ? 0.25 : 1);
            }
        }
        
        // Logika animacji (skopiowana z bazowego 'update')
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
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.77s] js/entities/enemies/rangedEnemy.js: Zwiększono separację (do 64).');