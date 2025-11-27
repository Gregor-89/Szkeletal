// ==============
// GEM.JS (v0.95h - FIX: Removed Tint Rect)
// Lokalizacja: /js/entities/gem.js
// ==============

import { getRandomColor } from '../core/utils.js';
import { GEM_CONFIG } from '../config/gameData.js';
import { get as getAsset } from '../services/assets.js';

export class Gem {
  constructor() {
    this.x = 0; this.y = 0; this.r = 6; this.val = 1; this.color = '#4FC3F7';
    this.active = false; this.pool = null;
    this.life = 0; this.maxLife = GEM_CONFIG.BASE_LIFE; this.hazardDecayT = 0;
    this.floatTimer = Math.random() * Math.PI * 2;
    this.scale = 0; this.rotation = 0; this.magnetized = false; this.speed = 0;
    this.isCollected = false; 
  }
  
  init(x, y, r, val, color) {
    this.x = x; this.y = y; this.r = r || 6; this.val = val || 1; this.color = color || getRandomColor();
    this.active = true; this.hazardDecayT = 0;
    this.life = GEM_CONFIG.BASE_LIFE; this.maxLife = GEM_CONFIG.BASE_LIFE;
    this.floatTimer = Math.random() * Math.PI * 2;
    this.scale = 0; this.rotation = 0; this.magnetized = false; this.speed = 0;
    this.isCollected = false; 
  }
  
  release() {
    if (this.pool) this.pool.release(this);
    this.active = false; this.life = 0; this.magnetized = false; this.isCollected = false;
  }
  
  isDecayedByHazard() { return this.hazardDecayT >= 1.0; }
  
  collect() { this.isCollected = true; this.magnetized = false; }
  
  update(player, game, dt) {
    if (!this.active) return;
    
    if (this.isCollected) {
        this.scale -= 10.0 * dt; 
        this.x += (player.x - this.x) * 10 * dt;
        this.y += (player.y - this.y) * 10 * dt;
        if (this.scale <= 0) this.release();
        return; 
    }
    
    this.life -= dt;
    if (this.life <= 0) { this.release(); return; }
    
    if (this.scale < 1) {
      this.scale += 3.0 * dt; if (this.scale > 1) this.scale = 1;
    }
    this.floatTimer += dt * 4;
    
    if (this.magnetized) {
      const dx = player.x - this.x; const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);
      this.speed += 800 * dt; 
      if (dist > 0) {
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
      }
      this.rotation += 15 * dt;
    }
  }
  
  draw(ctx) {
    if (!this.active || this.scale <= 0) return;
    
    ctx.save();
    
    let alpha = 1.0 - this.hazardDecayT;
    if (this.life < GEM_CONFIG.FADE_TIME) {
      alpha *= (Math.floor(performance.now() / 150) % 2 === 0) ? 0.3 : 1;
    }
    ctx.globalAlpha = alpha;
    
    const floatOffset = (this.magnetized || this.isCollected) ? 0 : Math.sin(this.floatTimer) * 3;
    ctx.translate(this.x, this.y + floatOffset);
    ctx.scale(this.scale, this.scale);
    ctx.rotate(this.rotation);
    
    const sprite = getAsset('gem'); 
    
    if (sprite) {
      const targetSize = this.r * 5; 
      const aspectRatio = sprite.naturalWidth / sprite.naturalHeight;
      const drawHeight = targetSize;
      const drawWidth = targetSize * aspectRatio;
      
      // FIX: Mocna poświata zamiast kwadratowego tła
      if (this.val >= 20) { ctx.shadowColor = '#ff5252'; ctx.shadowBlur = 30; } 
      else if (this.val >= 5) { ctx.shadowColor = '#69f0ae'; ctx.shadowBlur = 20; } 
      else { ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = 5; }
      
      if (this.magnetized) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 15; }
      
      ctx.drawImage(sprite, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      
      // USUNIĘTO: Kod z source-atop i fillRect
      
    } else {
      ctx.fillStyle = this.color;
      ctx.rotate(Math.PI / 4);
      const s = this.r;
      ctx.fillRect(-s, -s, s * 2, s * 2);
    }
    
    ctx.restore();
  }
}