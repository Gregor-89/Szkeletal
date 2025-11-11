// ==============
// SPLITTERENEMY.JS (v0.85a - Priorytetowy Ruch)
// Lokalizacja: /js/entities/enemies/splitterEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg Splitter.
 * Po śmierci dzieli się na mniejsze jednostki (logika w enemyManager).
 */
export class SplitterEnemy extends Enemy {
  getOutlineColor() {
    return '#f06292';
  }
  
  /**
   * Nadpisana, aby dać Splitterowi stały bonus prędkości i prostą trajektorię.
   */
  update(dt, player, game, state) {
    // Wywołaj bazową logikę, ale bez random offset.
    // Zastąpienie logiki bazowej (aby usunąć wężyk)
    let isMoving = false;
    
    if (this.hitStun > 0) {
        this.hitStun -= dt;
    } else {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        let vx = 0, vy = 0;
        let currentSpeed = this.getSpeed(game, dist) * 1.15; // BONUS PRĘDKOŚCI +15%

        if (dist > 0.1) {
            // Bezpośrednie celowanie (usunięto randomOffset z klasy bazowej Enemy.js, aby uprościć, ale trzeba go nadpisać)
            const targetAngle = Math.atan2(dy, dx);
            // NOWA LOGIKA V0.85A: PROSTE CELOWANIE (bez wężyka)
            vx = Math.cos(targetAngle) * currentSpeed;
            vy = Math.sin(targetAngle) * currentSpeed;
            isMoving = true;
        }

        // Zastosuj dt do finalnego ruchu
        this.x += (vx + this.separationX * 0.5) * dt;
        this.y += (vy + this.separationY * 0.5) * dt;
    }
    
    // Aktualizacja animacji (skopiowana z klasy bazowej i NAPRAWIONA)
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