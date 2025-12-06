// ==============
// PICKUP.JS (v1.02 - NaN & Visibility Fix)
// Lokalizacja: /js/entities/pickup.js
// ==============

import { getPickupEmoji, getPickupColor, getPickupLabel } from '../core/utils.js';
import { get as getAsset } from '../services/assets.js';
import { PICKUP_CONFIG } from '../config/gameData.js';

const PICKUP_GLOWS = {
  'heal': 'rgba(255, 255, 255, 1.0)', 
  'magnet': 'rgba(255, 0, 0, 1.0)', 
  'shield': 'rgba(100, 181, 246, 0.9)', 
  'speed': 'rgba(255, 215, 0, 0.9)', 
  'bomb': 'rgba(255, 87, 34, 0.9)', 
  'freeze': 'rgba(0, 255, 255, 0.9)',
  'chest': 'rgba(255, 215, 0, 1.0)',
  'default': 'rgba(255, 255, 255, 0.8)'
};

export class Pickup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.r = 12; 
    
    // FIX: Strong fallback. If config fails, 14s.
    const cfgLife = (PICKUP_CONFIG && PICKUP_CONFIG.BASE_LIFE);
    this.life = (typeof cfgLife === 'number' && cfgLife > 0) ? cfgLife : 14;
    
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.inHazardDecayT = 0; 
    this.floatOffset = Math.random() * 100;
    this.isMagnetized = false; 
  }
  
  isDecayed() {
    return this.inHazardDecayT >= 1.0;
  }
  
  applyEffect(state) {
    console.warn(`[Pickup] Metoda applyEffect() nie została zaimplementowana dla typu: ${this.type}`);
  }
  
  update(dt, player) {
    this.life -= dt;
    
    if (this.isMagnetized) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
            this.x += (dx / dist) * 400 * dt;
            this.y += (dy / dist) * 400 * dt;
        }
    }
  }
  
  isDead() {
    return this.life <= 0;
  }
  
  draw(ctx, pickupStyleEmoji, pickupShowLabels) {
    ctx.save();
    
    if (this.life < 4) {
      ctx.globalAlpha = (Math.floor(performance.now() / 150) % 2 === 0) ? 0.3 : 1;
    }
    
    // FIX: NaN check for decay alpha
    let decayT = this.inHazardDecayT || 0;
    if (isNaN(decayT)) decayT = 0;
    const decayAlpha = 1.0 - decayT;
    ctx.globalAlpha *= Math.max(0, Math.min(1, decayAlpha)); 
    
    if (decayT > 0) {
        const scale = 1.0 - (decayT * 0.5);
        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);
        ctx.translate(-this.x, -this.y);
    }
    
    const pulseScale = 1 + 0.1 * Math.sin(performance.now() / 200 + this.pulsePhase);
    
    const assetKey = (this.type === 'chest') ? 'chest' : 'pickup_' + this.type;
    const sprite = getAsset(assetKey);
    
    if (sprite) {
      const baseSize = 48;
      const size = baseSize * pulseScale;
      
      const floatY = Math.sin((performance.now() / 500) + this.floatOffset) * 4;
      
      const aspect = sprite.naturalWidth / sprite.naturalHeight;
      let drawW = size;
      let drawH = size;
      
      if (aspect > 1) {
        drawH = size / aspect;
      } else {
        drawW = size * aspect;
      }
      
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 16, drawW / 2, 6, 0, 0, Math.PI * 2); 
      ctx.fill();
      
      const glowColor = PICKUP_GLOWS[this.type] || PICKUP_GLOWS['default'];
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 40; 
      
      ctx.drawImage(sprite,
        this.x - drawW / 2,
        (this.y - drawH / 2) + floatY,
        drawW,
        drawH
      );
      
      ctx.shadowBlur = 0;
      
    } else {
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
      ctx.globalAlpha = (this.life < 4 ? (Math.floor(performance.now() / 150) % 2 === 0 ? 0.3 : 1) : 1.0) * Math.max(0, decayAlpha);
      
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