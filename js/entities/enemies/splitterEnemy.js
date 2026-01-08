// ==============
// SPLITTERENEMY.JS (v0.93 - FIX: Animacja i Skala)
// Lokalizacja: /js/entities/enemies/splitterEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg Splitter (Wykop).
 * Po śmierci dzieli się na mniejsze jednostki (logika w enemyManager).
 */
export class SplitterEnemy extends Enemy {
  
  // KONSTRUKTOR (v0.93)
  constructor(x, y, stats, hpScale) {
    super(x, y, stats, hpScale);
    
    // Hitbox: 52px. VisualScale: 1.54 -> Wynik ~80px.
    // Taki sam rozmiar jak DadGamer (Standard).
    this.visualScale = 1.54;
  }

  getOutlineColor() {
    return '#f06292';
  }
  
  /**
   * Nadpisana, aby dać Splitterowi stały bonus prędkości i prostą trajektorię.
   */
  update(dt, player, game, state) {
    // Wywołaj bazową logikę, ale bez random offset.
    
    if (this.hitStun > 0) {
        this.hitStun -= dt;
    } else {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        let vx = 0, vy = 0;
        let currentSpeed = this.getSpeed(game, dist) * 1.15; // BONUS PRĘDKOŚCI +15%

        if (dist > 0.1) {
            // Bezpośrednie celowanie (usunięto randomOffset)
            const targetAngle = Math.atan2(dy, dx);
            vx = Math.cos(targetAngle) * currentSpeed;
            vy = Math.sin(targetAngle) * currentSpeed;
            
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

    // --- FIX v0.93: RĘCZNA AKTUALIZACJA ANIMACJI ---
    // Wymagane, ponieważ nadpisaliśmy metodę update()
    if (this.totalFrames > 1) {
        this.animTimer += dt;
        if (this.animTimer >= this.frameTime) {
            this.animTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
        }
    }
  }
}