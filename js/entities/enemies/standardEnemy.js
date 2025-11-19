// ==============
// STANDARDENEMY.JS (v0.91S - Fix migotania w nieskończoność)
// Lokalizacja: /js/entities/enemies/standardEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg standardowy.
 * Dziedziczy z bazowej klasy Enemy, ale dodaje ruch "wężykiem".
 */
export class StandardEnemy extends Enemy {
  // Nadpisuje metodę bazową, aby zwrócić specyficzny kolor konturu
  getOutlineColor() {
    return '#ffa726';
  }
  
  /**
   * Nadpisana metoda update dla dodania unikania kierunkowego.
   */
  update(dt, player, game, state) {
    
    if (this.hitStun > 0) {
        this.hitStun -= dt;
    } else {
        const dx = player.x - this.x;
        const dy = player.y - this.y; 
        const dist = Math.hypot(dx, dy);
        
        let vx = 0, vy = 0;
        let currentSpeed = this.getSpeed(game, dist);

        if (dist > 0.1) {
            const targetAngle = Math.atan2(dy, dx);
            
            // NOWA LOGIKA V0.85A: Mocniejszy i wolniejszy "wężyk"
            const targetAngleEvasion = targetAngle + Math.PI / 2; // Obróć o 90 stopni
            
            // Wektor w kierunku gracza
            vx = Math.cos(targetAngle) * currentSpeed;
            vy = Math.sin(targetAngle) * currentSpeed;
            
            // Wektor unikania (Mocniejsza siła, ~35% bazowej prędkości, wolniejsza oscylacja)
            const sideSpeed = currentSpeed * 0.35; // Zwiększono z 0.15 na 0.35
            vx += Math.cos(targetAngleEvasion) * sideSpeed * Math.sin(game.time * 2.5 + this.id); // Zmniejszono częstotliwość z 5 na 2.5
            vy += Math.sin(targetAngleEvasion) * sideSpeed * Math.sin(game.time * 2.5 + this.id);

            // NOWA LOGIKA v0.91a: Zapisz ostatni kierunek POZIOMY
            if (Math.abs(vx) > 0.1) {
                this.facingDir = Math.sign(vx);
            }
        }

        // POPRAWKA v0.91b: Zastosuj dt do finalnego ruchu
        this.x += (vx + this.separationX * 1.0) * dt;
        this.y += (vy + this.separationY * 1.0) * dt;
    } 
    
    // NOWA LINIA v0.91S: Dekrementacja hitFlashT
    if (this.hitFlashT > 0) {
        this.hitFlashT -= dt;
    }
  }
}