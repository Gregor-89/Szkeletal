// ==============
// RANGEDENEMY.JS (v0.91T-Final - Logika rzutu butelką i facingDir)
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
    
    // NOWY KONSTRUKTOR (v0.91P)
    constructor(x, y, stats, hpScale) {
        super(x, y, stats, hpScale);
        // Nadpisz domyślną skalę (1.0) z klasy bazowej Enemy
        this.drawScale = 1.0; 
        // Wymuszenie pobrania konfiguracji z ENEMY_STATS (zawiera statystyki pocisku)
        this.rangedConfig = stats; 
        this.rangedCooldown = 0; // Reset (jest już w bazowej klasie, ale dla pewności)
    }

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
            
            // Konfiguracja Menela (używamy stałych z ENEMY_STATS)
            const optimalMin = 250; // Menel rzuca butelkami z dystansu 300px
            const optimalMax = 400; // Górny dystans
            
            // --- Krok 1: Określenie siły (do przodu/do tyłu) ---
            let moveForce = 0; // Początkowa siła ruchu
            
            if (dist < optimalMin) { 
                // Uciekaj (wektor przeciwny do gracza)
                moveAngle = Math.atan2(-dy, -dx);
                moveForce = currentSpeed;
                isMoving = true;
            } else if (dist > optimalMax) { 
                // Podchodź (wektor w kierunku gracza)
                moveAngle = Math.atan2(dy, dx);
                moveForce = currentSpeed;
                isMoving = true;
            }
            
            // --- Krok 2: Aktywny Kąt Ataku (Circle Strafe) ---
            if (dist >= optimalMin && dist <= optimalMax) {
                
                const strafeDirection = Math.sign(Math.sin(this.id));
                strafeAngle = moveAngle + (Math.PI / 2) * strafeDirection;
                
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
            
            this.x += (vx + this.separationX * 1.0) * dt; // Siła separacji 1.0
            this.y += (vy + this.separationY * 1.0) * dt;
            
            // NOWA LOGIKA v0.91P-Final: Aktualizacja facingDir
            if (Math.abs(vx) > 0.1) {
                 this.facingDir = Math.sign(vx);
            } else if (isMoving) {
                 // Jeśli nie ma wyraźnego ruchu poziomego (Menel krąży), 
                 // kierunek patrzenia jest zgodny z kątem do gracza (dx).
                 this.facingDir = Math.sign(dx);
            }
            
            // --- Krok 4: Strzelanie (Butelką) ---
            this.rangedCooldown -= dt;
            
            // Strzelaj, jeśli jesteś w zasięgu ataku i możesz strzelać
            if (this.rangedCooldown <= 0 && dist < this.rangedConfig.attackRange && state.eBulletsPool) {
                
                const bulletConfig = WEAPON_CONFIG.RANGED_ENEMY_BULLET;
                const bulletSpeed = bulletConfig.SPEED * (game.freezeT > 0 ? 0.25 : 1); // px/s
                
                const bullet = state.eBulletsPool.get();
                if (bullet) {
                    // Kąt strzału jest zawsze prosto na gracza
                    const targetAngle = Math.atan2(dy, dx);
                    
                    // init(x, y, vx, vy, size, damage, color, life, type, rotation)
                    bullet.init(
                        this.x, this.y,
                        Math.cos(targetAngle) * bulletSpeed,
                        Math.sin(targetAngle) * bulletSpeed,
                        bulletConfig.SIZE, // Hitbox butelki
                        bulletConfig.DAMAGE, // Obrażenia butelki
                        '#00BCD4', // Stary kolor (tylko na fallback)
                        Infinity, // Czas życia (długi, pocisk znika po kolizji lub poza ekranem)
                        'bottle', // NOWY TYP POCISKU
                        targetAngle // Początkowy kąt rotacji butelki
                    );
                }
                
                this.rangedCooldown = this.rangedConfig.attackCooldown / (game.freezeT > 0 ? 0.25 : 1);
            }
        }
        
        // NOWA LINIA v0.91T: Dekrementacja hitFlashT
        if (this.hitFlashT > 0) {
            this.hitFlashT -= dt;
        }
    }
}