// ==============
// HORDEENEMY.JS (v0.83v - Wzmocnienie Roju)
// Lokalizacja: /js/entities/enemies/hordeEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg typu Horda.
 * Wolniejszy, ale pojawia się w grupach, ma mniejszą separację i próbuje otaczać gracza.
 */
export class HordeEnemy extends Enemy {
  getSpeed(game, dist) {
    return super.getSpeed(game, dist) * 0.8;
  }
  
  getSeparationRadius() {
    // POPRAWKA v0.76f: Zwiększono 2x (z 16 na 32)
    return 32;
  }
  
  getOutlineColor() {
    return '#aed581';
  }
  
  /**
   * Nadpisana metoda update dla dodania logiki Roju (Swarming).
   * Sprawia, że wrogowie celują w losowy punkt wokół gracza.
   */
  update(dt, player, game, state) {
    let isMoving = false;
    
    if (this.hitStun > 0) {
        this.hitStun -= dt;
    } else {
        // NOWA LOGIKA V0.83V: Wzmocniono promień Roju
        const swarmRadius = 100;
        // Losowy offset (bazowany na ID, aby był stały przez krótki czas)
        const targetX = player.x + Math.sin(this.id) * swarmRadius;
        const targetY = player.y + Math.cos(this.id) * swarmRadius;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);
        
        let vx = 0, vy = 0;
        let currentSpeed = this.getSpeed(game, dist);

        if (dist > 0.1) {
            const targetAngle = Math.atan2(dy, dx);
            vx = Math.cos(targetAngle) * currentSpeed;
            vy = Math.sin(targetAngle) * currentSpeed;
            isMoving = true;
        }

        // POPRAWKA v0.64: Zastosuj dt do finalnego ruchu
        this.x += (vx + this.separationX * 0.5) * dt;
        this.y += (vy + this.separationY * 0.5) * dt;
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

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.76f] js/entities/enemies/hordeEnemy.js: Zwiększono separację (do 32).');