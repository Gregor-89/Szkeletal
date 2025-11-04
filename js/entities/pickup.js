// ==============
// PICKUP.JS (v0.56 - Integracja grafiki)
// Lokalizacja: /js/entities/pickup.js
// ==============

import { getPickupEmoji, getPickupColor, getPickupLabel } from '../core/utils.js';
// POPRAWKA v0.56: Import menedżera zasobów
import { get as getAsset } from '../services/assets.js';

/**
 * Klasa bazowa dla wszystkich pickupów (bonusów).
 */
export class Pickup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.r = 9;
    this.life = 14; // Czas życia w sekundach
    this.pulsePhase = Math.random() * Math.PI * 2;
  }
  
  /**
   * Aktualizuje stan pickupa (np. odlicza czas życia).
   * @param {number} dt - Delta time
   */
  update(dt) {
    this.life -= dt;
  }
  
  /**
   * Zwraca true, jeśli pickup powinien zostać usunięty.
   * @returns {boolean}
   */
  isDead() {
    return this.life <= 0;
  }
  
  /**
   * Rysuje pickup na canvasie.
   * Logika przeniesiona z 'draw.js'.
   * @param {CanvasRenderingContext2D} ctx 
   * @param {boolean} pickupStyleEmoji - Czy rysować jako emoji
   * @param {boolean} pickupShowLabels - Czy pokazywać etykiety
   */
  draw(ctx, pickupStyleEmoji, pickupShowLabels) {
    ctx.save();
    
    // Efekt migania przed zniknięciem
    if (this.life < 4) {
      ctx.globalAlpha = (Math.floor(performance.now() / 150) % 2 === 0) ? 0.3 : 1;
    }
    
    const pulseScale = 1 + 0.1 * Math.sin(performance.now() / 200 + this.pulsePhase);
    const radius = this.r * pulseScale;
    
    // POPRAWKA v0.56: Logika rysowania sprite'a lub starego stylu
    const sprite = getAsset('pickup_' + this.type); // Np. 'pickup_heal'
    
    if (sprite) {
      // 1. Jeśli sprite istnieje, narysuj go
      const drawSize = this.r * 2.5 * pulseScale; // Tymczasowo, z pulsem
      ctx.drawImage(sprite,
        this.x - drawSize / 2,
        this.y - drawSize / 2,
        drawSize,
        drawSize
      );
      
    } else {
      // 2. Jeśli nie, użyj starej logiki (Emoji lub Kółka)
      if (pickupStyleEmoji) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.font = (radius * 2.2) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const emoji = getPickupEmoji(this.type);
        ctx.strokeText(emoji, this.x, this.y);
        ctx.fillText(emoji, this.x, this.y);
        ctx.shadowBlur = 0;
      } else {
        const color = getPickupColor(this.type);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    
    if (pickupShowLabels) {
      ctx.globalAlpha = 1; // Upewnij się, że etykieta nie miga
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      const label = getPickupLabel(this.type);
      ctx.strokeText(label, this.x, this.y + 20);
      ctx.fillText(label, this.x, this.y + 20);
    }
    
    ctx.restore();
  }
}

// === KLASY SPECJALISTYCZNE ===

export class HealPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'heal');
  }
}

export class MagnetPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'magnet');
  }
}

export class ShieldPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'shield');
  }
}

export class SpeedPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'speed');
  }
}

export class BombPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'bomb');
  }
}

export class FreezePickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'freeze');
  }
}