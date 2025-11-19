// ==============
// SPLITTERENEMY.JS (v0.91T - Fix migotania w nieskończoność)
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
            
            // NOWA LOGIKA v0.91L: Zapisz ostatni kierunek POZIOMY
            if (Math.abs(vx) > 0.1) {
                this.facingDir = Math.sign(vx);
            }
        }

        // POPRAWKA v0.91L: Zwiększono siłę separacji z 0.5 na 1.0
        this.x += (vx + this.separationX * 1.0) * dt;
        this.y += (vy + this.separationY * 1.0) * dt;
    }
    
    // NOWA LINIA v0.91T: Dekrementacja hitFlashT
    if (this.hitFlashT > 0) {
        this.hitFlashT -= dt;
    }
  }
}