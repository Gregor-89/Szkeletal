// ==============
// WALLENEMY.JS (v0.96 - FIX: Lower HP Bar)
// Lokalizacja: /js/entities/enemies/wallEnemy.js
// ==============

import { Enemy } from '../enemy.js';
import { WALL_DETONATION_CONFIG } from '../../config/gameData.js';
import { areaNuke, addHitText, addBombIndicator } from '../../core/utils.js';
import { killEnemy } from '../../managers/enemyManager.js';
import { playSound } from '../../services/audio.js';

export class WallEnemy extends Enemy {
  
  constructor(x, y, stats, hpScale = 1) {
    super(x, y, stats, hpScale);
    
    this.showHealthBar = false; 
    this.initialLife = WALL_DETONATION_CONFIG.WALL_DECAY_TIME;
    this.detonationT = this.initialLife + (Math.random() * WALL_DETONATION_CONFIG.WALL_DETONATION_TIME_VARIANCE);
    this.isDetonating = false;
    this.isAutoDead = false; 
    this.assetKey = 'enemy_wall';

    this.visualScale = 2.9;
    this.baseSpeed = (stats.speed || 16) * 0.5; 
    this.mass = 1000; 
  }
  
  getSeparationRadius() {
      return this.size * 0.5; 
  }
  
  takeDamage(damage) {
      super.takeDamage(damage);
      this.showHealthBar = true;
  }

  getOutlineColor() {
    return this.isDetonating ? '#FF0000' : '#8e24aa'; 
  }
  
  applyKnockback(kx, ky) {
      // Brak reakcji
  }

  selfDestruct(state) {
    const { game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators, hitTextPool, hitTexts, chests } = state;
    
    const radius = WALL_DETONATION_CONFIG.WALL_DETONATION_RADIUS; 
    const damage = WALL_DETONATION_CONFIG.WALL_DETONATION_DAMAGE; 
    
    addBombIndicator(bombIndicators, this.x, this.y, radius, 0.5);
    playSound('Explosion');

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
    
    for (let k = chests.length - 1; k >= 0; k--) {
        const c = chests[k];
        const dist = Math.hypot(this.x - c.x, this.y - c.y);
        if (dist <= radius) {
            chests.splice(k, 1);
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
  }

  update(dt, player, game, state) {
    if (this.isAutoDead) return; 

    this.detonationT -= dt;

    if (this.detonationT <= WALL_DETONATION_CONFIG.WALL_DETONATION_WARNING_TIME && !this.isDetonating) {
        this.isDetonating = true;
    }

    if (this.detonationT <= 0) {
        this.selfDestruct(state);
        this.die(); 
        return;
    }
    
    super.update(dt, player, game, state);

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 40) {
        const angle = Math.atan2(dy, dx);
        let speed = this.baseSpeed;
        if (game.freezeT > 0) speed *= 0.5;
        
        this.x += Math.cos(angle) * speed * dt;
        this.y += Math.sin(angle) * speed * dt;
        
        if (Math.abs(dx) > 10) this.facingDir = Math.sign(dx);
    }
  }

  draw(ctx, game) {
    ctx.save();
    
    if (this.isDetonating) {
        const timeLeft = Math.max(0, this.detonationT);
        const warnTime = WALL_DETONATION_CONFIG.WALL_DETONATION_WARNING_TIME; 
        const frequency = 1 + (warnTime - timeLeft) * 3.5; 
        
        if (Math.floor(game.time * frequency) % 2 === 0) {
            ctx.filter = 'grayscale(1) sepia(1) saturate(10) hue-rotate(-50deg)'; 
        }
    }
    
    super.draw(ctx, game);
    this.drawHealthBar(ctx);
    ctx.restore();
  }
  
  drawHealthBar(ctx) {
      if (!this.showHealthBar) return;
      
      ctx.save();
      if (this.facingDir === -1) ctx.scale(-1, 1);
      
      const w = 40, h = 6; 
      const frac = Math.max(0, this.hp / this.maxHp);
      
      const bx = -w / 2;
      const spriteH = this.size * this.visualScale; 
      
      // FIX: Obniżenie o kolejne 2px (z +2 na +4)
      const by = -(spriteH * 0.35) + 4;
      
      ctx.fillStyle = '#300'; ctx.fillRect(bx, by, w, h);
      let hpColor = (frac > 0.6) ? '#0f0' : (frac > 0.3 ? '#ff0' : '#f00');
      ctx.fillStyle = hpColor; ctx.fillRect(bx, by, w * frac, h);
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, w, h);
      
      ctx.restore();
  }
}