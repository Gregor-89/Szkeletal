// ==============
// RANGEDENEMY.JS (v0.85a - Aktywny Kąt Ataku / Circle Strafe)
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

            let moveAngle = Math.atan2(dy, dx); // Kąt do gracza
            let strafeAngle = 0; // Kąt ruchu bocznego
            
            const optimalMin = 300; 
            const optimalMax = 400;
            
            // --- Krok 1: Określenie siły (do przodu/do tyłu) ---
            let moveForce = 0; // Początkowa siła ruchu
            
            if (dist < optimalMin) { 
                // Uciekaj (wektor przeciwny do gracza)
                moveAngle = Math.atan2(-dy, -dx);
                moveForce = currentSpeed;
                isMoving = true;
            } else if (dist > optimalMax) { 
                // Podchodź (wektor w kierunku gracza)
                moveForce = currentSpeed;
                isMoving = true;
            }
            
            // --- Krok 2: Aktywny Kąt Ataku (Circle Strafe) ---
            if (dist >= optimalMin && dist <= optimalMax) {
                // NOWA LOGIKA V0.85A: W optymalnej strefie zmuszamy do krążenia
                
                // Kierunek krążenia (stały dla danego wroga)
                const strafeDirection = Math.sign(Math.sin(this.id));
                // Kąt prostopadły do gracza (ruch boczny)
                strafeAngle = moveAngle + (Math.PI / 2) * strafeDirection;
                
                // Siła ruchu bocznego (75% bazowej prędkości)
                const strafeSpeed = currentSpeed * 0.75; 
                
                vx += Math.cos(strafeAngle) * strafeSpeed;
                vy += Math.sin(strafeAngle) * strafeSpeed;
                isMoving = true;
            }
            
            // --- Krok 3: Dodaj ruch do przodu/do tyłu (jeśli jest) ---
            if (moveForce > 0) {
                vx += Math.cos(moveAngle) * moveForce;
                vy += Math.sin(moveAngle) * moveForce;
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