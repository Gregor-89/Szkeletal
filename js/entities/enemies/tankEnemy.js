// ==============
// TANKENEMY.JS (v0.92 - FINAL SAFE FIX)
// Lokalizacja: /js/entities/enemies/tankEnemy.js
// ==============

import { Enemy } from '../enemy.js';
import { get as getAsset } from '../../services/assets.js'; 

export class TankEnemy extends Enemy {
  
  constructor(x, y, stats, hpScale = 1) {
    super(x, y, stats, hpScale);
    this.visualScale = 1.0; // Fix rozmiaru (108px)
    this.assetKey = 'enemy_tank'; // Fix grafiki
  }
  
  getSpeed(game, dist) {
    let speed = this.speed * 0.6;
    speed *= (1 - (this.hitStun || 0));
    return speed;
  }
  
  getSeparationRadius() {
    return 112; 
  }
  
  getOutlineColor() {
    return '#8d6e63';
  }
  
  takeDamage(damage) {
    super.takeDamage(damage); 
    this.hitStun = 0;
  }
  
  draw(ctx, game) {
    if (!this.sprite) this.sprite = getAsset(this.assetKey);

    ctx.save();
    ctx.translate(this.x, this.y); // Zawsze centruj

    if (this.hitFlashT > 0 && Math.floor(performance.now() / 50) % 2 === 0) { 
      ctx.filter = 'grayscale(1) brightness(5)'; 
    }
    
    if (this.sprite) {
      const h = this.size * this.visualScale;
      const w = h * (this.sprite.naturalWidth / this.sprite.naturalHeight);
      
      ctx.save();
      if (this.facingDir === -1) ctx.scale(-1, 1);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.sprite, -w/2, -h/2, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
      ctx.strokeStyle = this.getOutlineColor();
      ctx.lineWidth = 2;
      ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
    }
    
    ctx.filter = 'none';
    this.drawHealthBar(ctx); // Rysuje pasek
    ctx.restore();
  }

  drawHealthBar(ctx) {
      if (this.hp < this.maxHp && this.hp > 0) {
          const pct = this.hp / this.maxHp;
          const w = 60, h = 6;
          const y = -(this.size * this.visualScale / 2) - 10;
          
          ctx.fillStyle = '#222'; ctx.fillRect(-w/2, y, w, h);
          ctx.fillStyle = '#f44336'; ctx.fillRect(-w/2, y, w * pct, h);
          ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(-w/2, y, w, h);
      }
  }
}