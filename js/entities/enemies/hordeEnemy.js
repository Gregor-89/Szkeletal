// ==============
// HORDEENEMY.JS (v0.93 - FIX: Poprawa rozmiaru na 1.6x)
// Lokalizacja: /js/entities/enemies/hordeEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg typu Horda.
 * Wolniejszy, ale pojawia się w grupach, ma mniejszą separację i próbuje otaczać gracza.
 */
export class HordeEnemy extends Enemy {
  
  // KONSTRUKTOR (v0.93 Fix Rozmiaru)
  constructor(x, y, stats, hpScale) {
    super(x, y, stats, hpScale);
    
    // POPRAWKA: Zmniejszono z 1.9 na 1.6.
    // Przy hitboxie 39px daje to teraz wysokość ok. 62px (oryginalnie mieli ~60px).
    this.visualScale = 1.6; 
  }
  
  getSpeed(game, dist) {
    return super.getSpeed(game, dist) * 0.8;
  }
  
  getOutlineColor() {
    return '#aed581';
  }
  
  /**
   * Nadpisana metoda update dla dodania logiki Roju (Swarming).
   */
  update(dt, player, game, state) {
    
    if (this.hitStun > 0) {
        this.hitStun -= dt;
    } else {
        // --- LOGIKA KOHEZYJNEGO ROJU (Zachowana z v0.85A) ---
        const SWARM_RADIUS = 20; 
        
        const targetAngleOffset = (this.id % 7) * (Math.PI * 2 / 7); 
        
        const targetX = player.x + Math.cos(targetAngleOffset) * SWARM_RADIUS;
        const targetY = player.y + Math.sin(targetAngleOffset) * SWARM_RADIUS;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);
        
        let vx = 0, vy = 0;
        let currentSpeed = this.getSpeed(game, dist);

        if (dist > 0.1) {
            const targetAngleToTarget = Math.atan2(dy, dx);
            vx = Math.cos(targetAngleToTarget) * currentSpeed;
            vy = Math.sin(targetAngleToTarget) * currentSpeed;

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
    
    // Aktualizacja Animacji
    if (this.totalFrames > 1) {
        this.animTimer += dt;
        if (this.animTimer >= this.frameTime) {
            this.animTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
        }
    }
  }
}