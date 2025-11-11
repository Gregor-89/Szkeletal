// ==============
// RANGEDENEMY.JS (v0.83v - Wzmocnienie Dystansu)
// Lokalizacja: /js/entities/enemies/rangedEnemy.js
// ==============

import { Enemy } from '../enemy.js';
// Wróg dystansowy potrzebuje konfiguracji broni
import { WEAPON_CONFIG } from '../../config/gameData.js';

/**
 * Wróg Dystansowy.
 * Utrzymuje dystans, strzela do gracza i porusza się bokiem (strafe).
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

            let moveAngle = 0; // Kąt do przodu/do tyłu
            let strafeAngle = 0; // Kąt ruchu bocznego
            
            // NOWA LOGIKA V0.83V: Zwiększono optymalny dystans
            const optimalMin = 250; 
            const optimalMax = 300;
            
            // 1. Ruch do przodu/do tyłu (Utrzymywanie dystansu)
            if (dist < optimalMin) { 
                // Uciekaj (kąt przeciwny do gracza)
                moveAngle = Math.atan2(-dy, -dx);
                isMoving = true;
            } else if (dist > optimalMax) { 
                // Podchodź (kąt w kierunku gracza)
                moveAngle = Math.atan2(dy, dx);
                isMoving = true;
            } else {
                // Jesteś w strefie, ale nie poruszaj się do przodu/do tyłu
                moveAngle = Math.atan2(dy, dx); // Domyślny kąt (dla obliczeń bocznych)
            }
            
            // 2. Ruch Boczny (Strafe) - TYLKO W STREFIE OPTYMALNEJ
            if (dist >= optimalMin && dist <= optimalMax) {
                // Kąt prostopadły do gracza (ruch boczny)
                const strafeDirection = Math.sign(Math.sin(game.time * 2 + this.id)); // Zmienia się wolno
                strafeAngle = moveAngle + (Math.PI / 2) * strafeDirection;
                
                // Siła ruchu bocznego (np. 50% bazowej prędkości)
                const strafeSpeed = currentSpeed * 0.5; // Zwiększono z 0.3 na 0.5
                
                vx += Math.cos(strafeAngle) * strafeSpeed;
                vy += Math.sin(strafeAngle) * strafeSpeed;
                isMoving = true;
            }
            
            // 3. Dodaj ruch do przodu/do tyłu (jeśli jest)
            if (dist < optimalMin || dist > optimalMax) {
                vx += Math.cos(moveAngle) * currentSpeed;
                vy += Math.sin(moveAngle) * currentSpeed;
            }
            
            this.x += (vx + this.separationX * 0.5) * dt;
            this.y += (vy + this.separationY * 0.5) * dt;
            
            // Strzelanie (bez zmian)
            this.rangedCooldown -= dt;
            if (this.rangedCooldown <= 0 && dist > 0.1 && state.eBulletsPool) {
                const bulletSpeed = WEAPON_CONFIG.RANGED_ENEMY_BULLET.SPEED * (game.freezeT > 0 ? 0.25 : 1); // px/s
                
                const bullet = state.eBulletsPool.get();
                if (bullet) {
                    // Kąt strzału jest zawsze prosto na gracza
                    const targetAngle = Math.atan2(dy, dx);
                    bullet.init(
                        this.x, this.y,
                        Math.cos(targetAngle) * bulletSpeed,
                        Math.sin(targetAngle) * bulletSpeed,
                        5, 5, '#00BCD4'
                    );
                }
                
                this.rangedCooldown = 1.2 / (game.freezeT > 0 ? 0.25 : 1);
            }
        }
        
        // Logika animacji (skopiowana z klasy bazowej i NAPRAWIONA)
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