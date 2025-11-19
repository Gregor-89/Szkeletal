// ==============
// PICKUP.JS (v0.91g - Stronger Glow & White Heal)
// Lokalizacja: /js/entities/pickup.js
// ==============

import { getPickupEmoji, getPickupColor, getPickupLabel } from '../core/utils.js';
import { get as getAsset } from '../services/assets.js';
import { PICKUP_CONFIG } from '../config/gameData.js';

/**
 * Mapa kolorów poświaty dla poszczególnych typów pickupów.
 */
const PICKUP_GLOWS = {
  // POPRAWKA v0.91g: Talerz (Heal) ma teraz BIAŁĄ poświatę
  'heal': 'rgba(255, 255, 255, 1.0)', 
  
  // Pozostałe kolory (można zwiększyć alpha dla lepszego efektu)
  'magnet': 'rgba(255, 0, 0, 1.0)', 
  'shield': 'rgba(100, 181, 246, 0.9)', 
  'speed': 'rgba(255, 215, 0, 0.9)', 
  'bomb': 'rgba(255, 87, 34, 0.9)', 
  'freeze': 'rgba(0, 255, 255, 0.9)',
  'chest': 'rgba(255, 215, 0, 1.0)',
  'default': 'rgba(255, 255, 255, 0.8)'
};

/**
 * Klasa bazowa dla wszystkich pickupów (bonusów).
 */
export class Pickup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.r = 12; 
    this.life = PICKUP_CONFIG.BASE_LIFE; 
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.inHazardDecayT = 0; 
    this.floatOffset = Math.random() * 100;
  }
  
  isDecayed() {
    return this.inHazardDecayT >= 1.0;
  }
  
  applyEffect(state) {
    console.warn(`[Pickup] Metoda applyEffect() nie została zaimplementowana dla typu: ${this.type}`);
  }
  
  update(dt) {
    this.life -= dt;
  }
  
  isDead() {
    return this.life <= 0;
  }
  
  draw(ctx, pickupStyleEmoji, pickupShowLabels) {
    ctx.save();
    
    // Efekt migania przed zniknięciem
    if (this.life < 4) {
      ctx.globalAlpha = (Math.floor(performance.now() / 150) % 2 === 0) ? 0.3 : 1;
    }
    
    // Zanikanie w bagnie
    const decayAlpha = 1.0 - this.inHazardDecayT;
    ctx.globalAlpha *= decayAlpha; 
    
    const pulseScale = 1 + 0.1 * Math.sin(performance.now() / 200 + this.pulsePhase);
    
    // Obsługa specjalna assetu skrzyni
    const assetKey = (this.type === 'chest') ? 'chest' : 'pickup_' + this.type;
    const sprite = getAsset(assetKey);
    
    if (sprite) {
      const baseSize = 48;
      const size = baseSize * pulseScale;
      
      // Pływanie
      const floatY = Math.sin((performance.now() / 500) + this.floatOffset) * 4;
      
      // Aspect ratio
      const aspect = sprite.naturalWidth / sprite.naturalHeight;
      let drawW = size;
      let drawH = size;
      
      if (aspect > 1) {
        drawH = size / aspect;
      } else {
        drawW = size * aspect;
      }
      
      // Cień
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 16, drawW / 2, 6, 0, 0, Math.PI * 2); 
      ctx.fill();
      
      // Glow (Poświata)
      const glowColor = PICKUP_GLOWS[this.type] || PICKUP_GLOWS['default'];
      ctx.shadowColor = glowColor;
      // POPRAWKA v0.91g: Znacznie mocniejszy blur (40 zamiast 25)
      ctx.shadowBlur = 40; 
      
      // Rysowanie
      ctx.drawImage(sprite,
        this.x - drawW / 2,
        (this.y - drawH / 2) + floatY,
        drawW,
        drawH
      );
      
      ctx.shadowBlur = 0;
      
    } else {
      // Fallback (stara logika)
      const radius = this.r * pulseScale;
      if (pickupStyleEmoji) {
        ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.font = (radius * 2.2) + 'px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
        const emoji = getPickupEmoji(this.type);
        ctx.strokeText(emoji, this.x, this.y); ctx.fillText(emoji, this.x, this.y); ctx.shadowBlur = 0;
      } else {
        const color = getPickupColor(this.type);
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(this.x, this.y, radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.shadowBlur = 10; ctx.shadowColor = color; ctx.beginPath(); ctx.arc(this.x, this.y, radius, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
      }
    }
    
    if (pickupShowLabels) {
      ctx.globalAlpha = (this.life < 4 ? ctx.globalAlpha : 1.0) * decayAlpha;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial'; 
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 1)'; 
      ctx.shadowBlur = 4;
      
      const label = getPickupLabel(this.type);
      const yOffset = sprite ? 34 : 20;
      ctx.fillText(label, this.x, this.y + yOffset);
    }
    
    ctx.restore();
  }
}