// ==============
// OBSTACLE.JS (v0.97b - Scaling & Shake Fix)
// Lokalizacja: /js/entities/obstacle.js
// ==============

import { get as getAsset } from '../services/assets.js';

export class Obstacle {
  constructor(x, y, config) {
    this.x = x;
    this.y = y;
    this.type = config.type;
    
    // Losowanie skali (v0.97b)
    const minScale = config.minScale || 1.0;
    const maxScale = config.maxScale || 1.0;
    this.scaleMultiplier = minScale + Math.random() * (maxScale - minScale);
    
    // Bazowy rozmiar * wylosowana skala
    this.size = (config.size || 50) * this.scaleMultiplier;
    
    // Hitbox też skalujemy
    const hitboxScale = config.hitboxScale || 1.0;
    this.hitboxRadius = (this.size / 2) * hitboxScale;
    
    this.color = config.color || '#888';
    
    this.hp = config.hp || Infinity;
    this.maxHp = this.hp;
    
    this.isSolid = (config.isSolid !== undefined) ? config.isSolid : true;
    this.isSlow = config.isSlow || false;
    this.slowFactor = config.slowFactor || 1.0;
    
    this.dropChance = config.dropChance || 0;
    this.isDead = false;
    
    // Wizualia
    this.rotation = (Math.random() - 0.5) * 0.2;
    
    // Wybór wariantu
    const variantsCount = config.variants || 1;
    const variantIdx = Math.floor(Math.random() * variantsCount) + 1;
    this.assetKey = `env_${this.type}_${variantIdx}`;
    
    // FIX v0.97b: Shake logic (zamiast przesuwania x/y)
    this.shakeTimer = 0;
  }
  
  takeDamage(amount) {
    if (this.hp === Infinity) return false;
    
    this.hp -= amount;
    
    // Ustaw timer trzęsienia
    this.shakeTimer = 0.2;
    
    if (this.hp <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }
  
  update(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
    }
  }
  
  draw(ctx) {
    if (this.isDead) return;
    
    const sprite = getAsset(this.assetKey);
    
    ctx.save();
    
    // Aplikuj trzęsienie tylko wizualnie
    let drawX = this.x;
    let drawY = this.y;
    if (this.shakeTimer > 0) {
      drawX += (Math.random() - 0.5) * 6;
      drawY += (Math.random() - 0.5) * 6;
    }
    
    ctx.translate(drawX, drawY);
    ctx.rotate(this.rotation);
    // Skala jest już uwzględniona w this.size, ale sprite'y mają swoje wymiary
    // Musimy przeskalować sprite tak, aby pasował do this.size
    // Wcześniej używałem scaleVar, teraz mam scaleMultiplier aplikowany do size
    
    // Rysujemy na bazie this.size
    
    if (sprite) {
      const aspect = sprite.naturalWidth / sprite.naturalHeight;
      const drawH = this.size;
      const drawW = drawH * aspect;
      
      // Cień pod obiektem
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(0, drawH / 2 - 5, drawW / 2.5, drawH / 5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.drawImage(sprite, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      // Placeholder
      ctx.fillStyle = this.color;
      ctx.beginPath();
      
      if (this.type === 'hut') {
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      } else if (this.type === 'water') {
        ctx.fillStyle = 'rgba(66, 165, 245, 0.6)';
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
    
    // Pasek HP
    if (this.hp < this.maxHp && this.hp > 0) {
      const barW = this.size * 0.8;
      ctx.fillStyle = 'red';
      ctx.fillRect(drawX - barW / 2, drawY - this.size / 2 - 15, barW, 6);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(drawX - barW / 2, drawY - this.size / 2 - 15, barW * (this.hp / this.maxHp), 6);
    }
  }
}