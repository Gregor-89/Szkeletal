// ==============
// HAZARD.JS (v0.95 - FIX: Bubble Distribution)
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
    
    this.r = HAZARD_CONFIG.SIZE * scale;
    
    this.maxLife = HAZARD_CONFIG.HAZARD_LIFE * (isMega ? 1.5 : 1.0);
    this.life = this.maxLife;
    
    this.activeTime = 0;
    this.warningTime = HAZARD_CONFIG.HAZARD_WARNING_TIME || 1.5;
    this.fadeInT = 0;
    
    this.damage = HAZARD_CONFIG.DAMAGE_PER_SECOND;
    this.enemyDamage = HAZARD_CONFIG.HAZARD_ENEMY_DAMAGE_PER_SECOND;
    
    if (isMega) {
      this.damage *= HAZARD_CONFIG.MEGA_HAZARD_PLAYER_DAMAGE_MULTIPLIER;
      this.enemyDamage *= HAZARD_CONFIG.MEGA_HAZARD_ENEMY_DAMAGE_MULTIPLIER;
    }
    
    this.blobs = [];
    const blobCount = isMega ? 12 : 7;
    
    this.blobs.push({ dx: 0, dy: 0, r: this.r * 0.6 });
    
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
    
    this.bubbles = [];
    this.bubbleTimer = 0;
    
    this.pattern = null;
    this.textureKey = 'hazard_sewage';
    
    this.pulsePhase = Math.random() * Math.PI * 2;
  }
  
  isActive() {
    return this.activeTime >= this.warningTime;
  }
  
  isDead() {
    return this.life <= 0;
  }
  
  update(dt) {
    this.activeTime += dt;
    this.pulsePhase += dt * 5;
    
    if (this.isActive()) {
      this.life -= dt;
      if (this.fadeInT < 1.0) this.fadeInT += dt * 2.0;
      
      this.bubbleTimer -= dt;
      if (this.bubbleTimer <= 0) {
        this.spawnBubble();
        this.bubbleTimer = 0.1 + Math.random() * 0.2;
      }
    }
    
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.life -= dt;
      b.size += dt * 5;
      if (b.life <= 0) this.bubbles.splice(i, 1);
    }
  }
  
  spawnBubble() {
    const blob = this.blobs[Math.floor(Math.random() * this.blobs.length)];
    const angle = Math.random() * Math.PI * 2;
    // FIX: Zwiększono zasięg spawnu bąbelków (z 0.8 na 1.0)
    const dist = Math.random() * (blob.r * 1.0);
    
    this.bubbles.push({
      x: blob.dx + Math.cos(angle) * dist,
      y: blob.dy + Math.sin(angle) * dist,
      size: 2 + Math.random() * 3,
      life: 0.6 + Math.random() * 0.6,
      maxLife: 1.2
    });
  }
  
  draw(ctx, game) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    if (!this.isActive()) {
      const factor = (Math.sin(this.pulsePhase) + 1) / 2;
      const alpha = 0.3 + 0.4 * factor;
      const color = this.isMega ? `rgba(255, 0, 255, ${alpha})` : `rgba(255, 50, 50, ${alpha})`;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]);
      
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    else {
      let alpha = 1;
      if (this.fadeInT < 1) alpha = this.fadeInT;
      else if (this.life < 1.0) alpha = this.life;
      ctx.globalAlpha = alpha;
      
      if (!this.pattern) {
        const img = getAsset(this.textureKey);
        if (img) {
          this.pattern = ctx.createPattern(img, 'repeat');
        }
      }
      
      ctx.beginPath();
      const borderSize = 4;
      for (const b of this.blobs) {
        ctx.moveTo(b.dx + b.r + borderSize, b.dy);
        ctx.arc(b.dx, b.dy, b.r + borderSize, 0, Math.PI * 2);
      }
      ctx.fillStyle = 'rgba(80, 200, 80, 0.5)';
      ctx.fill();
      
      ctx.beginPath();
      for (const b of this.blobs) {
        ctx.moveTo(b.dx + b.r, b.dy);
        ctx.arc(b.dx, b.dy, b.r, 0, Math.PI * 2);
      }
      
      if (this.pattern) {
        const matrix = new DOMMatrix();
        matrix.translateSelf(this.x, this.y);
        matrix.scaleSelf(0.15, 0.15);
        this.pattern.setTransform(matrix);
        ctx.fillStyle = this.pattern;
      } else {
        ctx.fillStyle = this.isMega ? '#5d4037' : '#4e342e';
      }
      
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      if (this.isMega) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(100, 0, 100, 0.5)';
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      
      for (const b of this.bubbles) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(40, 80, 40, 0.8)';
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(200, 255, 200, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
      }
    }
    
    ctx.restore();
  }
  
  checkCollision(entityX, entityY, entityRadius) {
    if (!this.isActive()) return false;
    
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