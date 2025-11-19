// ==============
// AGGRESSIVEENEMY.JS (v0.91S - Fix migotania w nieskończoność)
// Lokalizacja: /js/entities/enemies/aggressiveEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg Agresywny.
 * Przyspiesza po krótkiej sygnalizacji, gdy jest blisko gracza.
 */
export class AggressiveEnemy extends Enemy {
  
  constructor(x, y, stats, hpScale) {
    super(x, y, stats, hpScale);
    this.isCharging = false;
    this.chargeTimer = 0.0;
    this.chargeDuration = 0.4; // Zwiększono z 0.2s do 0.4s
    this.chargeSpeedBonus = 2.0; // Mnożnik po sygnalizacji
  }
  
  getSpeed(game, dist) {
    let speed = super.getSpeed(game, dist);
    
    // Jeśli się sygnalizuje (pauzuje), jest zatrzymany
    if (this.isCharging) {
        return 0;
    }
    
    // Jeśli JEST w zasięgu (dist < 220) i NIE JEST w trakcie sygnalizacji
    // to automatycznie oznacza, że szarżuje, więc dostaje bonus.
    if (dist < 220) {
        speed *= this.chargeSpeedBonus; // 2.0x prędkości
    }
    
    return speed;
  }
  
  getOutlineColor() {
    // NOWA LOGIKA V0.83: Sygnalizacja szarży kolorem
    if (this.isCharging) {
        return '#f44336'; // Czerwona ramka podczas ładowania
    }
    return '#42a5f5';
  }
  
  update(dt, player, game, state) {
    let isMoving = false;
    
    if (this.hitStun > 0) {
        this.hitStun -= dt;
    } else {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        // --- LOGIKA SZARŻY ---
        
        // 1. Wróg jest w zasięgu ataku
        if (dist < 220) {
            if (!this.isCharging && this.chargeTimer <= 0) {
                // Warunek: Wejście w zasięg. Ustaw Sygnalizację/Pauzę.
                this.isCharging = true;
                this.chargeTimer = this.chargeDuration;
                
            } else if (this.isCharging) {
                // Warunek: Faza Sygnalizacji/Pauzy
                this.chargeTimer -= dt;
                
                if (this.chargeTimer <= 0) {
                    // Koniec Pauzy. Rozpocznij Szarżę.
                    this.isCharging = false;
                    this.chargeTimer = 1.5; // Ustaw cooldown na szybkie ponowienie szarży
                }
            }
        } else {
            // Poza zasięgiem - normalny ruch
            this.isCharging = false;
            if (this.chargeTimer > 0) this.chargeTimer -= dt; // Czekaj na reset cooldownu
        }
        
        let vx = 0, vy = 0;
        let currentSpeed = this.getSpeed(game, dist); 

        // Ruch tylko jeśli prędkość > 0 (pozwala na zatrzymanie podczas isCharging)
        if (dist > 0.1 && currentSpeed > 0) { 
            const targetAngle = Math.atan2(dy, dx);
            // POPRAWKA: Usunięto randomOffset (jest w klasie bazowej, ale AggressiveEnemy go nie używa)
            const finalAngle = targetAngle; // AggressiveEnemy zawsze celuje prosto (chyba że ma hitstun)
            
            vx = Math.cos(finalAngle) * currentSpeed;
            vy = Math.sin(finalAngle) * currentSpeed;
            isMoving = true;
            
            // NOWA LOGIKA v0.91h: Zapisz ostatni kierunek POZIOMY
            if (Math.abs(vx) > 0.1) {
                this.facingDir = Math.sign(vx);
            }
        }
        
        this.x += (vx + this.separationX * 1.0) * dt;
        this.y += (vy + this.separationY * 1.0) * dt;
    }
    
    // NOWA LINIA v0.91S: Dekrementacja hitFlashT
    if (this.hitFlashT > 0) {
        this.hitFlashT -= dt;
    }
    
    // Aktualizacja animacji (skopiowana z klasy bazowej i naprawiona)
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