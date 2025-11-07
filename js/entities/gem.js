// ==============
// GEM.JS (v0.76 - Milestone Balance: Dodano ograniczony czas życia gemów)
// Lokalizacja: /js/entities/gem.js
// ==============

import { getRandomColor } from '../core/utils.js';
// NOWY IMPORT v0.76: Konfiguracja czasu życia gemów
import { GEM_CONFIG } from '../config/gameData.js';

export class Gem {
  constructor() {
    // Właściwości zostaną ustawione przez .init()
    this.x = 0;
    this.y = 0;
    this.r = 4;
    this.val = 1;
    this.color = '#4FC3F7';
    
    this.active = false;
    this.pool = null;
    
    // NOWE (v0.76): Czas życia gemów
    this.life = 0;
    this.maxLife = GEM_CONFIG.BASE_LIFE;
    
    this.hazardDecayT = 0; // Przemianowano z inHazardDecayT
  }
  
  /**
   * Inicjalizuje gema.
   */
  init(x, y, r, val, color) {
    this.x = x;
    this.y = y;
    this.r = r || 4;
    this.val = val || 1;
    this.color = color || getRandomColor();
    this.active = true;
    this.hazardDecayT = 0; // Reset zaniku
    
    // NOWE (v0.76): Ustawienie czasu życia
    this.life = GEM_CONFIG.BASE_LIFE;
    this.maxLife = GEM_CONFIG.BASE_LIFE;
  }
  
  /**
   * Zwalnia obiekt z powrotem do puli.
   */
  release() {
    if (this.pool) {
      this.pool.release(this);
    }
    this.active = false;
    // Resetuj stan v0.76
    this.life = 0;
  }
  
  /**
   * Zwraca true, jeśli Gem powinien zostać usunięty z powodu zaniku w Hazardzie.
   */
  isDecayedByHazard() {
    return this.hazardDecayT >= 1.0;
  }
  
  /**
   * NOWA METODA (v0.76): Zwraca true, jeśli czas życia gema minął.
   */
  isDead() {
    return this.life <= 0;
  }
  
  /**
   * Aktualizuje pozycję gema (tylko jeśli aktywny).
   * Dodano logikę czasu życia (v0.76).
   */
  update(player, game, dt) {
    // 1. Logika czasu życia
    this.life -= dt;
    if (this.isDead()) {
      this.release();
      return; // Zatrzymaj dalsze przetwarzanie, jeśli jest martwy
    }
    
    // 2. Logika przyciągania (przeniesiona z v0.68)
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d = Math.hypot(dx, dy);
    
    const range = game.magnet ? 9999 : game.pickupRange;
    
    if (d < range) {
      const spd = (game.magnet ? 8 : 2.5) * 60;
      this.x += (dx / d) * spd * dt;
      this.y += (dy / d) * spd * dt;
    }
  }
  
  /**
   * Rysuje gema na canvasie (tylko jeśli aktywny).
   * Dodano logikę zanikania (v0.76).
   */
  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    
    // 1. Wizualne zanikanie (Hazard)
    let alpha = 1.0 - this.hazardDecayT;
    
    // 2. NOWE (v0.76): Efekt migania przed zniknięciem (czas życia)
    const fadeTime = GEM_CONFIG.FADE_TIME;
    if (this.life < fadeTime) {
      // Mnoży alfę przez efekt migania (0.3 lub 1.0)
      alpha *= (Math.floor(performance.now() / 150) % 2 === 0) ? 0.3 : 1;
    }
    
    ctx.globalAlpha = alpha;
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.76] js/entities/gem.js: Zaimplementowano ograniczony czas życia (GEM_CONFIG).');