// ==============
// HORDEENEMY.JS (v0.94l - FIX: Restore Knockback)
// Lokalizacja: /js/entities/enemies/hordeEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg typu Horda (Maciek z czatu).
 */
export class HordeEnemy extends Enemy {
  
  constructor(x, y, stats, hpScale) {
    super(x, y, stats, hpScale);
    this.visualScale = 1.6; 
  }
  
  getSeparationRadius() {
      return this.size * 0.5; 
  }
  
  getSpeed(game, dist) {
    return super.getSpeed(game, dist) * 0.8;
  }
  
  getOutlineColor() {
    return '#aed581';
  }
  
  update(dt, player, game, state) {
    // Statusy
    if (this.frozenTimer > 0) {
        this.frozenTimer -= dt;
        return; 
    }
    if (this.hazardSlowdownT > 0) {
        this.hazardSlowdownT -= dt;
    }

    // FIX: Przywrócenie logiki knockbacku (skopiowane z Enemy.js)
    if (Math.abs(this.knockback.x) > 0.1 || Math.abs(this.knockback.y) > 0.1) {
        this.x += this.knockback.x * dt;
        this.y += this.knockback.y * dt;
        // Wygaszanie pędu
        this.knockback.x *= 0.9;
        this.knockback.y *= 0.9;
    } 
    // Normalny ruch tylko gdy nie ma knockbacku i hitstuna
    else if (this.hitStun > 0) {
        this.hitStun -= dt;
    } else {
        // Logika Roju
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
    
    if (this.totalFrames > 1) {
        this.animTimer += dt;
        if (this.animTimer >= this.frameTime) {
            this.animTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
        }
    }
  }
}