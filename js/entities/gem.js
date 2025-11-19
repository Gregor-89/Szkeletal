// ==============
// GEM.JS (v0.91g - Gibotanie i Poświata Ziemniaczka)
// Lokalizacja: /js/entities/gem.js
// ==============

import { getRandomColor } from '../core/utils.js';
import { GEM_CONFIG } from '../config/gameData.js';
import { get as getAsset } from '../services/assets.js';

export class Gem {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.r = 4; // Mechaniczny hitbox (promień)
    this.val = 1;
    this.color = '#4FC3F7';
    
    this.active = false;
    this.pool = null;
    
    this.life = 0;
    this.maxLife = GEM_CONFIG.BASE_LIFE;
    
    this.hazardDecayT = 0;
    
    // --- NOWE WŁAŚCIWOŚCI (v0.91g) ---
    this.initialY = 0; // Początkowa pozycja Y dla efektu gibotania
    this.floatTimer = Math.random() * Math.PI * 2; // Losowy start dla asynchronicznego gibotania
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
    this.hazardDecayT = 0;
    
    this.life = GEM_CONFIG.BASE_LIFE;
    this.maxLife = GEM_CONFIG.BASE_LIFE;
    
    // --- NOWE (v0.91g) ---
    this.initialY = y; // Zapisz początkową pozycję Y
    this.floatTimer = Math.random() * Math.PI * 2; // Zresetuj timer
  }
  
  /**
   * Zwalnia obiekt z powrotem do puli.
   */
  release() {
    if (this.pool) {
      this.pool.release(this);
    }
    this.active = false;
    this.life = 0;
  }
  
  /**
   * Zwraca true, jeśli Gem powinien zostać usunięty z powodu zaniku w Hazardzie.
   */
  isDecayedByHazard() {
    return this.hazardDecayT >= 1.0;
  }
  
  /**
   * Zwraca true, jeśli czas życia gema minął.
   */
  isDead() {
    return this.life <= 0;
  }
  
  /**
   * Aktualizuje pozycję gema (tylko jeśli aktywny).
   * Dodano logikę czasu życia (v0.76).
   */
  update(player, game, dt) {
    this.life -= dt;
    if (this.isDead()) {
      this.release();
      return;
    }
    
    // --- NOWE (v0.91g): Aktualizacja floatTimera ---
    this.floatTimer += dt * 4; // Prędkość gibotania
    
    // 2. Logika przyciągania (przeniesiona z v0.68)
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d = Math.hypot(dx, dy);
    
    const range = game.magnet ? 9999 : game.pickupRange;
    
    if (d < range) {
      const spd = (game.magnet ? 8 : 2.5) * 60;
      this.x += (dx / d) * spd * dt;
      this.y += (dy / d) * spd * dt;
      // --- NOWE (v0.91g): Resetuj initialY przy ruchu ---
      this.initialY = this.y;
    }
  }
  
  /**
   * Rysuje gema na canvasie (tylko jeśli aktywny).
   * Dodano logikę zanikania (v0.76).
   */
  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    
    let alpha = 1.0 - this.hazardDecayT;
    
    const fadeTime = GEM_CONFIG.FADE_TIME;
    if (this.life < fadeTime) {
      alpha *= (Math.floor(performance.now() / 150) % 2 === 0) ? 0.3 : 1;
    }
    
    ctx.globalAlpha = alpha;
    
    const sprite = getAsset('gem');
    
    if (sprite) {
      const targetVisualHeight = 20;
      const aspectRatio = sprite.naturalWidth / sprite.naturalHeight;
      const drawHeight = targetVisualHeight;
      const drawWidth = targetVisualHeight * aspectRatio;
      
      // --- NOWE (v0.91g): Efekt gibotania ---
      const floatOffset = Math.sin(this.floatTimer) * 2; // +/- 2px
      
      // --- NOWE (v0.91g): Efekt złotej poświaty ---
      ctx.shadowColor = 'rgba(255, 215, 0, 0.7)'; // Złoty kolor
      ctx.shadowBlur = 8; // Rozmycie
      
      ctx.imageSmoothingEnabled = false;
      
      ctx.drawImage(
        sprite,
        this.x - drawWidth / 2,
        this.y - drawHeight / 2 + floatOffset, // Dodaj offset do Y
        drawWidth,
        drawHeight
      );
      
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore(); // Przywróć kontekst (wyłącz cień i globalAlpha)
  }
}