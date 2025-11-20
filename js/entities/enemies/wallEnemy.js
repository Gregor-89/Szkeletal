// ==============
// WALLENEMY.JS (v0.92 - Fix: Skala 1.0 dla dużego wroga)
// Lokalizacja: /js/entities/enemies/wallEnemy.js
// ==============

import { Enemy } from '../enemy.js';
import { WALL_DETONATION_CONFIG } from '../../config/gameData.js';
import { areaNuke, addHitText } from '../../core/utils.js';
import { killEnemy } from '../../managers/enemyManager.js';

export class WallEnemy extends Enemy {
  
  constructor(x, y, stats, hpScale = 1) {
    super(x, y, stats, hpScale);
    
    this.showHealthBar = false; 
    this.initialLife = WALL_DETONATION_CONFIG.WALL_DECAY_TIME;
    this.detonationT = this.initialLife + (Math.random() * WALL_DETONATION_CONFIG.WALL_DETONATION_TIME_VARIANCE);
    this.isDetonating = false;
    this.isAutoDead = false; 
    
    // FIX: Ustawiamy skalę na 1.0, żeby nie był gigantem
    this.visualScale = 1.0; 
    
    // Upewniamy się, że asset jest
    this.assetKey = 'enemy_wall';
  }
  
  takeDamage(damage) {
      super.takeDamage(damage);
      this.showHealthBar = true;
  }

  getOutlineColor() {
    return this.isDetonating ? '#FF4500' : '#90A4AE'; 
  }
  
  getSeparationRadius() {
    return 30; 
  }

  selfDestruct(state) {
    const { game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators, hitTextPool, hitTexts, chests } = state;
    
    const radius = WALL_DETONATION_CONFIG.WALL_DETONATION_RADIUS; 
    const damage = WALL_DETONATION_CONFIG.WALL_DETONATION_DAMAGE; 
    
    for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (e.id === this.id) continue; 
        
        const d = Math.hypot(this.x - e.x, this.y - e.y);
        
        if (d <= radius) {
            e.takeDamage(damage);
            if (typeof addHitText === 'function') {
                 addHitText(hitTextPool, hitTexts, e.x, e.y, damage, '#ff9800'); 
            }
            
            if (e.hp <= 0) {
                state.enemyIdCounter = killEnemy(j, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, false, true); 
            }
        }
    }

    areaNuke(
        this.x,
        this.y,
        radius, 
        false, 
        game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators,
        true 
    );

    this.isAutoDead = true; 
    console.log(`[WallEnemy] Oblężnik ID:${this.id} detonuje.`);
  }

  update(dt, player, game, state) {
    super.update(dt, player, game, state); 
    
    if (!this.isAutoDead) {
        this.detonationT -= dt;

        if (this.detonationT <= WALL_DETONATION_CONFIG.WALL_DETONATION_WARNING_TIME && !this.isDetonating) {
            this.isDetonating = true;
        }

        if (this.detonationT <= 0) {
            this.selfDestruct(state);
        }
    }
    
    if (this.hitFlashT > 0) {
        this.hitFlashT -= dt;
    }
  }

  draw(ctx, game) {
    ctx.save();
    
    if (this.isDetonating) {
        const timeElapsed = WALL_DETONATION_CONFIG.WALL_DETONATION_WARNING_TIME - this.detonationT;
        const pulseFactor = (Math.sin(timeElapsed * 8) + 1) / 2; 
        
        const pulseAlpha = 0.1 + (pulseFactor * 0.4); 
        const pulseSize = this.size * 0.5 * 1.5 + (pulseFactor * this.size * 0.5 * 0.3); 
        
        ctx.globalAlpha = pulseAlpha;
        ctx.fillStyle = '#ff9800'; 
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1; 
    }
    
    super.draw(ctx, game);
    ctx.restore();
  }
  
  drawHealthBar(ctx) {
      if (!this.showHealthBar) return;
      
      const w = 40, h = 6; 
      const frac = Math.max(0, this.hp / this.maxHp);
      
      // Pozycja względem 0,0 (bo draw ma translate)
      const bx = -w / 2;
      const spriteH = this.size * this.visualScale; // 88px
      const by = -(spriteH / 2) - 8;
      
      ctx.fillStyle = '#300';
      ctx.fillRect(bx, by, w, h);
      let hpColor;
      if (frac > 0.6) hpColor = '#0f0';
      else if (frac > 0.3) hpColor = '#ff0';
      else hpColor = '#f00';
      ctx.fillStyle = hpColor;
      ctx.fillRect(bx, by, w * frac, h);
      ctx.strokeStyle = '#111';
      ctx.strokeRect(bx, by, w, h);
  }
}