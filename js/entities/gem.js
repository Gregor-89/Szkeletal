// (Linia 1) [DEBUG-v0.92M] js/entities/gem.js
// ==============
// GEM.JS (v0.92M - Fix: Pool + Grafika + Fizyka)
// Lokalizacja: /js/entities/gem.js
// ==============

import { getRandomColor } from '../core/utils.js';
import { GEM_CONFIG } from '../config/gameData.js';
import { get as getAsset } from '../services/assets.js';

export class Gem {
  constructor() {
    // --- Właściwości bazowe (Logic & Pool) ---
    this.x = 0;
    this.y = 0;
    this.r = 6; // Zwiększony lekko hitbox dla sprite'a
    this.val = 1;
    this.color = '#4FC3F7';
    
    this.active = false;
    this.pool = null; // Referencja do puli (Object Pool)
    
    this.life = 0;
    this.maxLife = GEM_CONFIG.BASE_LIFE;
    
    this.hazardDecayT = 0; // Zanikanie w bagnie
    
    // --- Właściwości wizualne (Graphics) ---
    this.initialY = 0;
    this.floatTimer = Math.random() * Math.PI * 2;
    this.scale = 0; // Animacja pojawiania się (0 -> 1)
    this.rotation = 0; // Obrót
    
    // --- Fizyka przyciągania ---
    this.isMagnetized = false;
    this.speed = 0; // Akceleracja przyciągania
  }
  
  /**
   * Inicjalizuje gema (wywoływane przez ObjectPool.get()).
   */
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
    
    // Reset efektów wizualnych
    this.initialY = y;
    this.floatTimer = Math.random() * Math.PI * 2;
    this.scale = 0; // Start od zera (efekt pop-in)
    this.rotation = 0;
    this.isMagnetized = false;
    this.speed = 0;
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
    this.isMagnetized = false;
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
   * Aktualizuje stan gema.
   */
  update(player, game, dt) {
    // 1. Obsługa czasu życia
    this.life -= dt;
    if (this.isDead()) {
      this.release();
      return;
    }
    
    // 2. Animacja "Pop-in" (pojawianie się)
    if (this.scale < 1) {
      this.scale += 3.0 * dt; // Szybkie skalowanie
      if (this.scale > 1) this.scale = 1;
    }
    
    // 3. Aktualizacja timera gibotania
    this.floatTimer += dt * 4;
    
    // 4. Logika Przyciągania (Magnet)
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    
    const range = game.magnet ? 9999 : game.pickupRange;
    
    // Jeśli gracz jest w zasięgu, aktywuj przyciąganie
    if (dist < range) {
      this.isMagnetized = true;
    }
    
    if (this.isMagnetized) {
      // Fizyka przyciągania z przyspieszeniem
      this.speed += 60 * dt; // Zwiększanie prędkości
      const baseSpeed = (player.speed || 300) * 1.2; // Baza zależna od prędkości gracza
      const currentSpeed = baseSpeed + this.speed;
      
      this.x += (dx / dist) * currentSpeed * dt;
      this.y += (dy / dist) * currentSpeed * dt;
      
      // Aktualizacja rotacji podczas lotu
      this.rotation += 10 * dt;
      
      // Reset pozycji bazowej (żeby nie skakał po zebraniu)
      this.initialY = this.y;
      
      // Zabezpieczenie przed "orbitowaniem" - jeśli bardzo blisko, uznaj za zebrany
      // (Właściwa kolizja jest w collisions.js, to tylko pomocnicze)
      if (dist < 10) {
        // collisions.js obsłuży zebranie w tej klatce
      }
    }
  }
  
  /**
   * Rysuje gema na canvasie.
   */
  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    
    // 1. Obliczanie przezroczystości (Miganie przed zniknięciem + Bagno)
    let alpha = 1.0 - this.hazardDecayT;
    const fadeTime = GEM_CONFIG.FADE_TIME;
    
    if (this.life < fadeTime) {
      // Miganie co 150ms
      alpha *= (Math.floor(performance.now() / 150) % 2 === 0) ? 0.3 : 1;
    }
    ctx.globalAlpha = alpha;
    
    // 2. Transformacje (Pozycja + Skala + Rotacja)
    // Efekt pływania tylko gdy nie jest przyciągany
    const floatOffset = this.isMagnetized ? 0 : Math.sin(this.floatTimer) * 3;
    
    ctx.translate(this.x, this.y + floatOffset);
    ctx.scale(this.scale, this.scale); // Animacja wejścia
    ctx.rotate(this.rotation); // Rotacja w locie
    
    // 3. Rysowanie Sprite'a lub Fallback
    const sprite = getAsset('gem');
    
    if (sprite) {
      const targetSize = 20 + (this.val > 1 ? 6 : 0); // Większe gemy są większe
      
      // Zachowanie proporcji obrazka
      const aspectRatio = sprite.naturalWidth / sprite.naturalHeight;
      const drawHeight = targetSize;
      const drawWidth = targetSize * aspectRatio;
      
      // Złota poświata (tylko dla wartościowych gemów lub zawsze)
      if (this.val > 1 || this.isMagnetized) {
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowColor = 'rgba(79, 195, 247, 0.4)';
        ctx.shadowBlur = 5;
      }
      
      ctx.drawImage(
        sprite,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
      
    } else {
      // FALLBACK (Stare kółka)
      ctx.fillStyle = this.color;
      
      // Rysuj jako romb (obrócony kwadrat)
      ctx.rotate(Math.PI / 4);
      const s = this.r;
      ctx.fillRect(-s, -s, s * 2, s * 2);
      
      // Obramowanie dla rzadkich
      if (this.val > 1) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-s, -s, s * 2, s * 2);
      }
    }
    
    ctx.restore();
  }
}