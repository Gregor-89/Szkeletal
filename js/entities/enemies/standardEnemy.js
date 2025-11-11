// ==============
// STANDARDENEMY.JS (v0.83o - Ostateczna Naprawa Składni)
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
    let isMoving = false;
    
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
            
            // NOWA LOGIKA V0.83: Dodaj lekkie "unikanie kierunkowe" (wężyk)
            const targetAngleEvasion = targetAngle + Math.PI / 2; // Obróć o 90 stopni
            
            // Wektor w kierunku gracza
            vx = Math.cos(targetAngle) * currentSpeed;
            vy = Math.sin(targetAngle) * currentSpeed;
            
            // Wektor unikania (bardzo mała siła, ~15% bazowej prędkości)
            const sideSpeed = currentSpeed * 0.15;
            vx += Math.cos(targetAngleEvasion) * sideSpeed * Math.sin(game.time * 5 + this.id);
            vy += Math.sin(targetAngleEvasion) * sideSpeed * Math.sin(game.time * 5 + this.id);

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
        if (this.animationTimer >= this.animationSpeed) { // Użycie this.animationSpeed
            this.animationTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % this.frameCount; // Użycie this.frameCount
        }
    } else {
        this.currentFrame = 0;
        this.animationTimer = 0;
    }
  }
}