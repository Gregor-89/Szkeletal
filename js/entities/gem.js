// ==============
// GEM.JS (v0.62 - Implementacja Puli Obiektów)
// Lokalizacja: /js/entities/gem.js
// ==============

import { get as getAsset } from '../services/assets.js';

export class Gem {
  constructor() {
    // Właściwości zostaną ustawione przez .init()
    this.x = 0;
    this.y = 0;
    this.r = 4;
    this.val = 1;
    this.color = '#4FC3F7';
    
    // POPRAWKA v0.62: Właściwości Puli Obiektów
    this.active = false;
    this.pool = null;
  }
  
  /**
   * POPRAWKA v0.62: Inicjalizuje gema.
   */
  init(x, y, r, val, color) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.val = val;
    this.color = color;
    this.active = true;
  }
  
  /**
   * POPRAWKA v0.62: Zwalnia obiekt z powrotem do puli.
   */
  release() {
    if (this.pool) {
      this.pool.release(this);
    }
    this.active = false;
  }
  
  /**
   * Aktualizuje pozycję gema (tylko jeśli aktywny).
   */
  update(player, game, dt) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d = Math.hypot(dx, dy);
    
    const range = game.magnet ? 9999 : game.pickupRange;
    
    if (d < range) {
      // Prędkość jest już poprawnie skalowana przez 'dt' (z v0.59)
      const spd = (game.magnet ? 8 : 2.5) * 60;
      this.x += (dx / d) * spd * dt;
      this.y += (dy / d) * spd * dt;
    }
  }
  
  /**
   * Rysuje gema na canvasie (tylko jeśli aktywny).
   */
  draw(ctx) {
    const sprite = getAsset('gem');
    
    if (sprite) {
      const drawSize = this.r * 2.5;
      ctx.drawImage(sprite,
        this.x - drawSize / 2,
        this.y - drawSize / 2,
        drawSize,
        drawSize
      );
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}