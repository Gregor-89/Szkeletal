// ==============
// HORDEENEMY.JS (v0.91S - Fix migotania w nieskończoność)
// Lokalizacja: /js/entities/enemies/hordeEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg typu Horda.
 * Wolniejszy, ale pojawia się w grupach, ma mniejszą separację i próbuje otaczać gracza.
 */
export class HordeEnemy extends Enemy {
  
  // NOWY KONSTRUKTOR (v0.91k)
  constructor(x, y, stats, hpScale) {
    super(x, y, stats, hpScale);
    // Nadpisz domyślną skalę (1.0) z klasy bazowej Enemy
    this.drawScale = 0.75; // 75% bazowego rozmiaru (80px * 0.75 = 60px wysokości)
  }
  
  getSpeed(game, dist) {
    return super.getSpeed(game, dist) * 0.8;
  }
  
  // (v0.91d: Usunięto getSeparationRadius(), aby dziedziczyć this.size (teraz 39) z klasy bazowej)
  
  getOutlineColor() {
    return '#aed581';
  }
  
  /**
   * Nadpisana metoda update dla dodania logiki Roju (Swarming).
   * Sprawia, że wrogowie celują w losowy punkt wokół gracza.
   */
  update(dt, player, game, state) {
    
    if (this.hitStun > 0) {
        this.hitStun -= dt;
    } else {
        // --- NOWA LOGIKA V0.85A: Kohezyjny Rój Atakujący ---
        const SWARM_RADIUS = 20; // Docelowy punkt 20px za graczem
        
        const targetAngleOffset = (this.id % 7) * (Math.PI * 2 / 7); // Stały kąt offsetu
        
        const targetX = player.x + Math.cos(targetAngleOffset) * SWARM_RADIUS;
        const targetY = player.y + Math.sin(targetAngleOffset) * SWARM_RADIUS;
        // ---------------------------------------------------

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);
        
        let vx = 0, vy = 0;
        let currentSpeed = this.getSpeed(game, dist);

        if (dist > 0.1) {
            const targetAngleToTarget = Math.atan2(dy, dx);
            vx = Math.cos(targetAngleToTarget) * currentSpeed;
            vy = Math.sin(targetAngleToTarget) * currentSpeed;

            // NOWA LOGIKA v0.91d: Zapisz ostatni kierunek POZIOMY
            if (Math.abs(vx) > 0.1) {
                this.facingDir = Math.sign(vx);
            }
        }

        // POPRAWKA v0.91d: Zwiększono siłę separacji z 0.5 na 1.0
        this.x += (vx + this.separationX * 1.0) * dt;
        this.y += (vy + this.separationY * 1.0) * dt;
    } 
    
    // NOWA LINIA v0.91S: Dekrementacja hitFlashT
    if (this.hitFlashT > 0) {
        this.hitFlashT -= dt;
    }
  }
}