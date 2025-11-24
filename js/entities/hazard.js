// ==============
// HAZARD.JS (v0.99d - FIX: Missing isDead function)
// Lokalizacja: /js/entities/hazard.js
// ==============

import { HAZARD_CONFIG } from '../config/gameData.js';
import { get as getAsset } from '../services/assets.js';

export class Hazard {
  constructor(x, y, isMega = false, scale = 1.0) {
    this.x = x;
    this.y = y;
    this.isMega = isMega;
    this.scale = scale;
    
    // Promień logiczny
    this.r = HAZARD_CONFIG.SIZE * scale;
    
    // Czas życia
    this.maxLife = HAZARD_CONFIG.HAZARD_LIFE * (isMega ? 1.5 : 1.0);
    this.life = this.maxLife;
    this.fadeInT = 0;
    
    // Obrażenia (używane w collisions.js)
    this.damage = HAZARD_CONFIG.DAMAGE_PER_SECOND;
    this.enemyDamage = HAZARD_CONFIG.HAZARD_ENEMY_DAMAGE_PER_SECOND;
    
    if (isMega) {
      this.damage *= HAZARD_CONFIG.MEGA_HAZARD_PLAYER_DAMAGE_MULTIPLIER;
      this.enemyDamage *= HAZARD_CONFIG.MEGA_HAZARD_ENEMY_DAMAGE_MULTIPLIER;
    }
    
    // --- KSZTAŁT KAŁUŻY (Blobs) ---
    this.blobs = [];
    const blobCount = isMega ? 12 : 7;
    
    this.blobs.push({ dx: 0, dy: 0, r: this.r * 0.6 }); // Środek
    
    for (let i = 0; i < blobCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (this.r * 0.5);
      const subR = (this.r * 0.3) + Math.random() * (this.r * 0.4);
      
      this.blobs.push({
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        r: subR
      });
    }
    
    // Bąbelki
    this.bubbles = [];
    this.bubbleTimer = 0;
    
    this.pattern = null;
    this.textureKey = 'hazard_sewage';
  }
  
  // NAPRAWIONO: Dodano brakującą metodę
  isDead() {
    return this.life <= 0;
  }
  
  update(dt) {
    this.life -= dt;
    if (this.fadeInT < 1.0) this.fadeInT += dt * 2.0;
    
    // Bąbelki
    this.bubbleTimer -= dt;
    if (this.bubbleTimer <= 0) {
      this.spawnBubble();
      this.bubbleTimer = 0.1 + Math.random() * 0.3;
    }
    
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.life -= dt;
      b.size += dt * 2;
      if (b.life <= 0) this.bubbles.splice(i, 1);
    }
  }
  
  spawnBubble() {
    const blob = this.blobs[Math.floor(Math.random() * this.blobs.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (blob.r * 0.8);
    
    this.bubbles.push({
      x: blob.dx + Math.cos(angle) * dist,
      y: blob.dy + Math.sin(angle) * dist,
      size: 1,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1.0
    });
  }
  
  draw(ctx, game) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    let alpha = 1;
    if (this.fadeInT < 1) alpha = this.fadeInT;
    else if (this.life < 1.0) alpha = this.life;
    ctx.globalAlpha = alpha;
    
    // Tekstura
    if (!this.pattern) {
      const img = getAsset(this.textureKey);
      if (img) {
        this.pattern = ctx.createPattern(img, 'repeat');
      }
    }
    
    // --- RYSOWANIE 1: OBRYS (Tło) ---
    ctx.beginPath();
    const borderSize = 4;
    for (const b of this.blobs) {
      ctx.moveTo(b.dx + b.r + borderSize, b.dy);
      ctx.arc(b.dx, b.dy, b.r + borderSize, 0, Math.PI * 2);
    }
    ctx.fillStyle = 'rgba(100, 255, 100, 0.4)';
    ctx.fill();
    
    // --- RYSOWANIE 2: ŚRODEK (Tekstura) ---
    ctx.beginPath();
    for (const b of this.blobs) {
      ctx.moveTo(b.dx + b.r, b.dy);
      ctx.arc(b.dx, b.dy, b.r, 0, Math.PI * 2);
    }
    
    if (this.pattern) {
      const matrix = new DOMMatrix();
      matrix.translateSelf(this.x, this.y);
      matrix.scaleSelf(0.5, 0.5);
      this.pattern.setTransform(matrix);
      
      ctx.fillStyle = this.pattern;
    } else {
      ctx.fillStyle = this.isMega ? '#5d4037' : '#4e342e';
    }
    
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Bąbelki
    for (const b of this.bubbles) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(60, 100, 60, 0.6)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(200, 255, 200, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  checkCollision(entityX, entityY, entityRadius) {
    const dist = Math.hypot(entityX - this.x, entityY - this.y);
    if (dist > this.r + entityRadius + 20) return false;
    
    const localX = entityX - this.x;
    const localY = entityY - this.y;
    
    for (const blob of this.blobs) {
      const d = Math.hypot(localX - blob.dx, localY - blob.dy);
      if (d < blob.r + entityRadius) {
        return true;
      }
    }
    return false;
  }
}