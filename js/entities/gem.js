// ==============
// GEM.JS (v0.68 - FINAL FIX: Dodano mechanikę zaniku i import)
// Lokalizacja: /js/entities/gem.js
// ==============

import { getRandomColor } from '../core/utils.js'; // NAPRAWIONO: Dodano import

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
    
    this.inHazardDecayT = 0; // NOWE: Licznik postępu zaniku w Hazardzie (0.0 do 1.0)
  }
  
  /**
   * POPRAWKA v0.62: Inicjalizuje gema.
   */
  init(x, y, r, val, color) {
    this.x = x;
    this.y = y;
    this.r = r || 4;
    this.val = val || 1;
    this.color = color || getRandomColor(); // Używa importowanej funkcji
    this.active = true;
    this.inHazardDecayT = 0; // Reset zaniku
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
   * Sprawdza, czy Gem powinien zostać usunięty z powodu zaniku w Hazardzie.
   */
  isDecayed() {
    return this.inHazardDecayT >= 1.0;
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
    if (!this.active) return;
    
    ctx.save();
    
    // Wizualne zanikanie (opacity)
    const alpha = 1.0 - this.inHazardDecayT;
    ctx.globalAlpha = alpha;
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}