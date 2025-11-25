// ==============
// GEM.JS (v0.94f - FIX: Physics & Acceleration)
// Lokalizacja: /js/entities/gem.js
// ==============

import { getRandomColor } from '../core/utils.js';
import { GEM_CONFIG } from '../config/gameData.js';
import { get as getAsset } from '../services/assets.js';

export class Gem {
  constructor() {
    // --- Właściwości bazowe ---
    this.x = 0;
    this.y = 0;
    this.r = 6;
    this.val = 1;
    this.color = '#4FC3F7';
    
    this.active = false;
    this.pool = null;
    
    this.life = 0;
    this.maxLife = GEM_CONFIG.BASE_LIFE;
    
    this.hazardDecayT = 0;
    
    // --- Właściwości wizualne ---
    this.floatTimer = Math.random() * Math.PI * 2;
    this.scale = 0;
    this.rotation = 0;
    
    // --- Fizyka przyciągania ---
    this.magnetized = false; // FIX: Używamy tej samej nazwy co w collisions.js
    this.speed = 0;
  }
  
  init(x, y, r, val, color) {
    this.x = x;
    this.y = y;
    this.r = r || 6;
    this.val = val || 1;
    this.color = color || getRandomColor();
    
    this.active = true;
    this.hazardDecayT = 0;
    
    this.life = GEM_CONFIG.BASE_LIFE;
    this.maxLife = GEM_CONFIG.BASE_LIFE;
    
    this.floatTimer = Math.random() * Math.PI * 2;
    this.scale = 0;
    this.rotation = 0;
    this.magnetized = false;
    this.speed = 0;
  }
  
  release() {
    if (this.pool) {
      this.pool.release(this);
    }
    this.active = false;
    this.life = 0;
    this.magnetized = false;
  }
  
  isDecayedByHazard() {
    return this.hazardDecayT >= 1.0;
  }
  
  update(player, game, dt) {
    if (!this.active) return;
    
    // 1. Obsługa czasu życia
    this.life -= dt;
    if (this.life <= 0) {
      this.release();
      return;
    }
    
    // 2. Animacja "Pop-in"
    if (this.scale < 1) {
      this.scale += 3.0 * dt;
      if (this.scale > 1) this.scale = 1;
    }
    
    // 3. Aktualizacja timera gibotania
    this.floatTimer += dt * 4;
    
    // 4. Logika Przyciągania (Magnet) - FIX: Akceleracja
    if (this.magnetized) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);
      
      // Stopniowe zwiększanie prędkości
      this.speed += 800 * dt; // Akceleracja (px/s^2)
      const currentSpeed = this.speed;
      
      if (dist > 0) {
        this.x += (dx / dist) * currentSpeed * dt;
        this.y += (dy / dist) * currentSpeed * dt;
      }
      
      this.rotation += 15 * dt;
    }
  }
  
  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    
    // Przezroczystość
    let alpha = 1.0 - this.hazardDecayT;
    if (this.life < GEM_CONFIG.FADE_TIME) {
      alpha *= (Math.floor(performance.now() / 150) % 2 === 0) ? 0.3 : 1;
    }
    ctx.globalAlpha = alpha;
    
    // Transformacje
    const floatOffset = this.magnetized ? 0 : Math.sin(this.floatTimer) * 3;
    ctx.translate(this.x, this.y + floatOffset);
    ctx.scale(this.scale, this.scale);
    ctx.rotate(this.rotation);
    
    // Rysowanie Sprite'a
    const sprite = getAsset('gem'); // Upewnij się, że klucz w assets.js to 'gem'
    
    if (sprite) {
      const targetSize = 20 + (this.val > 1 ? 6 : 0);
      const aspectRatio = sprite.naturalWidth / sprite.naturalHeight;
      const drawHeight = targetSize;
      const drawWidth = targetSize * aspectRatio;
      
      if (this.val > 1 || this.magnetized) {
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowColor = 'rgba(79, 195, 247, 0.4)';
        ctx.shadowBlur = 5;
      }
      
      ctx.drawImage(sprite, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      
    } else {
      // Fallback
      ctx.fillStyle = this.color;
      ctx.rotate(Math.PI / 4);
      const s = this.r;
      ctx.fillRect(-s, -s, s * 2, s * 2);
    }
    
    ctx.restore();
  }
}