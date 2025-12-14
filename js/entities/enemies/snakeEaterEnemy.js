// ==============
// SNAKEEATERENEMY.JS (v1.11 - Single Shadow & Tuning)
// Lokalizacja: /js/entities/enemies/snakeEaterEnemy.js
// ==============

import { Enemy } from '../enemy.js';
import { get as getAsset } from '../../services/assets.js';
import { addHitText } from '../../core/utils.js';
import { getLang } from '../../services/i18n.js';

export class SnakeEaterEnemy extends Enemy {
  constructor(x, y, stats, hpScale = 1) {
    super(x, y, stats, hpScale);
    
    this.healCooldownMax = stats.healCooldown || 60.0;
    this.healTimer = 0;
    
    this.quoteTimer = 20.0;
    this.quoteInterval = 20.0;
    
    this.spriteIdle = getAsset('enemy_snakeEater');
    this.spriteWalk = getAsset('enemy_snakeEater_walk');
    this.spriteHeal = getAsset('enemy_snakeEater_heal');
    
    this.sprite = this.spriteWalk || this.spriteIdle;
    
    this.cols = 4;
    this.rows = 4;
    this.totalFrames = 16;
    this.frameTime = 0.1;
    
    this.isHealingAnim = false;
    this.healAnimTimer = 0;
    
    this.showHealthBar = true;
  }
  
  updateAnimation(dt, currentSpeed) {
    this.animTimer += dt;
    if (this.animTimer >= this.frameTime) {
      this.animTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
    }
  }
  
  getSpeed(game) {
    if (this.isHealingAnim) {
      return 0;
    }
    return super.getSpeed(game);
  }
  
  update(dt, player, game, state) {
    super.update(dt, player, game);
    
    if (this.sprite === this.spriteWalk || this.sprite === this.spriteHeal) {
      this.cols = 4;
      this.rows = 4;
      this.totalFrames = 16;
    } else {
      this.cols = 1;
      this.rows = 1;
      this.totalFrames = 1;
    }
    
    this.quoteTimer -= dt;
    if (this.quoteTimer <= 0) {
      this.quoteTimer = this.quoteInterval;
      this.sayRandomQuote(state.hitTextPool, state.hitTexts);
    }
    
    if (this.healTimer > 0) {
      this.healTimer -= dt;
    }
    
    if (this.isHealingAnim) {
      this.healAnimTimer -= dt;
      
      if (this.sprite !== this.spriteHeal && this.spriteHeal) {
        this.sprite = this.spriteHeal;
        this.currentFrame = 0;
      }
      
      if (this.healAnimTimer <= 0) {
        this.isHealingAnim = false;
        this.updateMovementSprite();
      }
    } else {
      this.updateMovementSprite();
    }
  }
  
  updateMovementSprite() {
    if (this.sprite !== this.spriteWalk && this.spriteWalk) {
      this.sprite = this.spriteWalk;
    } else if (!this.spriteWalk && this.sprite !== this.spriteIdle) {
      this.sprite = this.spriteIdle;
    }
  }
  
  tryHealPlayer(game, player, hitTextPool, hitTexts) {
    if (this.healTimer <= 0) {
      const healVal = this.stats.healAmount || 100;
      const oldHp = game.health;
      game.health = Math.min(game.maxHealth, game.health + healVal);
      const actualHealed = game.health - oldHp;
      
      const text = getLang('snake_heal_text') || "Rzyć wylizana, sytość odzyskana";
      
      const offset = this.stats.quoteOffsetY || -120;
      addHitText(hitTextPool, hitTexts, this.x, this.y + offset + 20, 0, '#4CAF50', text, 4.0, null, 0, 24);
      
      if (actualHealed > 0) {
        addHitText(hitTextPool, hitTexts, player.x, player.y - 30, actualHealed, "#00FF00", "+HP", 2.0);
      }
      
      this.healTimer = this.healCooldownMax;
      this.isHealingAnim = true;
      
      const frameTime = this.frameTime || 0.1;
      this.healAnimTimer = (16 * frameTime) * 2;
      
      return true;
    }
    return false;
  }
  
  sayRandomQuote(hitTextPool, hitTexts) {
    const rnd = Math.floor(Math.random() * 18) + 1;
    const key = `quote_snake_${rnd}`;
    const text = getLang(key);
    
    if (text) {
      const offset = this.stats.quoteOffsetY || -120;
      addHitText(hitTextPool, hitTexts, this.x, this.y + offset, 0, '#FFD700', text, 3.5, this, 0, 20);
    }
  }
  
  draw(ctx, game) {
    if (!this.sprite) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // 1. FAKTYCZNY CIEŃ (Manualny - JEDYNY, bo hasShadow: false w gameData)
    const shadowY = this.stats.shadowOffsetY || 40;
    ctx.save();
    ctx.translate(0, shadowY);
    ctx.scale(1, 0.4);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Efekty
    if (this.hitFlashT > 0) {
      if (Math.floor(game.time * 20) % 2 === 0) ctx.filter = 'grayscale(1) brightness(5)';
    } else if (this.frozenTimer > 0) {
      ctx.filter = 'sepia(1) hue-rotate(170deg) saturate(2)';
    }
    
    if (this.facingDir === -1) {
      ctx.scale(-1, 1);
    }
    
    // 2. Rysowanie MOCNEJ POŚWIATY (Glow)
    if (this.healTimer <= 0) {
      ctx.save();
      ctx.shadowBlur = 40;
      ctx.shadowColor = '#66BB6A';
      ctx.globalCompositeOperation = 'lighter';
      
      const sheetW = this.sprite.naturalWidth;
      const sheetH = this.sprite.naturalHeight;
      const frameW = sheetW / this.cols;
      const frameH = sheetH / this.rows;
      const safeFrame = Math.floor(this.currentFrame) % (this.cols * this.rows);
      const col = safeFrame % this.cols;
      const row = Math.floor(safeFrame / this.cols);
      const sx = col * frameW;
      const sy = row * frameH;
      const destH = this.size * this.visualScale;
      const aspectRatio = frameW / frameH;
      const destW = destH * aspectRatio;
      
      ctx.drawImage(this.sprite, sx, sy, frameW, frameH, -destW / 2, -destH / 2, destW, destH);
      ctx.restore();
    }
    
    // 3. Rysowanie Sprite'a
    const sheetW = this.sprite.naturalWidth;
    const sheetH = this.sprite.naturalHeight;
    const frameW = sheetW / this.cols;
    const frameH = sheetH / this.rows;
    
    const safeFrame = Math.floor(this.currentFrame) % (this.cols * this.rows);
    const col = safeFrame % this.cols;
    const row = Math.floor(safeFrame / this.cols);
    
    const sx = col * frameW;
    const sy = row * frameH;
    
    const destH = this.size * this.visualScale;
    const aspectRatio = frameW / frameH;
    const destW = destH * aspectRatio;
    
    ctx.imageSmoothingEnabled = false;
    
    ctx.drawImage(this.sprite, sx, sy, frameW, frameH, -destW / 2, -destH / 2, destW, destH);
    
    ctx.restore();
    
    // 4. Pasek Życia
    if (this.showHealthBar && this.hp < this.maxHp) {
      this.drawCustomHealthBar(ctx);
    }
  }
  
  drawCustomHealthBar(ctx) {
    const barW = 80;
    const barH = 8;
    const offset = this.stats.healthBarOffsetY || 35;
    const barX = this.x - barW / 2;
    const barY = this.y + (this.size / 2) + offset;
    
    const pct = Math.max(0, this.hp / this.maxHp);
    
    ctx.save();
    ctx.fillStyle = '#111';
    ctx.fillRect(barX, barY, barW, barH);
    
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(barX, barY, barW * pct, barH);
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.restore();
  }
}