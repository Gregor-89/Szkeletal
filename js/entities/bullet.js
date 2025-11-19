// ==============
// BULLET.JS (v0.92F - Wersja kompletna: Sprite'y gracza i butelka wroga)
// Lokalizacja: /js/entities/bullet.js
// ==============

import { get as getAsset } from '../services/assets.js'; 
import { WEAPON_CONFIG } from '../config/gameData.js'; 

/**
 * Klasa bazowa dla wszystkich pocisków.
 */
class Bullet {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = 0;
    this.damage = 0;
    this.color = '#fff';
    
    this.active = false; 
    this.pool = null; 
    
    this.life = Infinity;
    this.maxLife = Infinity;

    this.type = 'default';
    this.rotation = 0; 
    this.rotSpeed = 0; 
  }
  
  init(x, y, vx, vy, size, damage, color, life = Infinity, type = 'default', rotation = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx; 
    this.vy = vy; 
    this.size = size;
    this.damage = damage;
    this.color = color;
    this.active = true;
    
    this.life = life;
    this.maxLife = life;

    this.type = type;
    this.rotation = rotation;
    this.rotSpeed = 0; 
  }
  
  release() {
    if (this.pool) {
      this.pool.release(this);
    }
    this.active = false; 
    this.life = Infinity; 
  }
  
  update(dt) {
    this.x += this.vx * dt; 
    this.y += this.vy * dt; 
    
    this.rotation += this.rotSpeed * dt;
    
    if (this.life !== Infinity) {
      this.life -= dt;
      if (this.life <= 0) {
        this.release();
      }
    }
  }
  
  draw(ctx) {
    if (this.maxLife !== Infinity && this.life < 0.25) {
      ctx.globalAlpha = Math.max(0, this.life / 0.25);
    }
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    if (this.maxLife !== Infinity) {
      ctx.globalAlpha = 1;
    }
  }
  
  isOffScreen(camera) {
    const margin = 50;
    const viewLeft = camera.offsetX;
    const viewRight = camera.offsetX + camera.viewWidth;
    const viewTop = camera.offsetY;
    const viewBottom = camera.offsetY + camera.viewHeight;
    
    return (
      this.x < viewLeft - margin ||
      this.x > viewRight + margin ||
      this.y < viewTop - margin ||
      this.y > viewBottom + margin
    );
  }
}

/**
 * Klasa dla pocisków gracza.
 */
export class PlayerBullet extends Bullet {
  constructor() {
    super(); 
    this.pierce = 0;
    this.bouncesLeft = 0;
    this.lastEnemyHitId = -1;
    this.curveDir = 0;
    
    this.animParams = null;
    this.animTimer = 0;
    this.currentFrame = 0;
    
    this.playerRef = null;
    this.offsetX = 0;
    this.offsetY = 0;
    
    this.drawScale = 0;
    
    // Sprite'y
    this.spriteKey = null;
    this.spriteScale = 1.0;
  }
  
  init(x, y, vx, vy, size, damage, color, pierce, life = Infinity, bouncesLeft = 0, curveDir = 0, animParams = null, playerRef = null, drawScale = 0, spriteKey = null, spriteScale = 1.0) {
    super.init(x, y, vx, vy, size, damage, color, life, 'player', 0); 
    
    this.pierce = pierce;
    this.bouncesLeft = bouncesLeft;
    this.lastEnemyHitId = -1;
    this.curveDir = curveDir;
    
    this.animParams = animParams;
    this.animTimer = 0;
    this.currentFrame = 0;
    
    this.playerRef = playerRef;
    if (this.playerRef) {
        this.offsetX = this.x - this.playerRef.x;
        this.offsetY = this.y - this.playerRef.y;
    }
    
    this.drawScale = drawScale;
    
    // Inicjalizacja sprite'a
    this.spriteKey = spriteKey;
    this.spriteScale = spriteScale;
    
    // Jeśli mamy sprite, ustaw rotację zgodnie z wektorem ruchu
    if (this.spriteKey && (Math.abs(vx) > 0 || Math.abs(vy) > 0)) {
        this.rotation = Math.atan2(vy, vx);
    }
  }
  
  release() {
    super.release(); 
    this.playerRef = null; 
    this.offsetX = 0;
    this.offsetY = 0;
    this.animParams = null; 
    this.drawScale = 0; 
    this.spriteKey = null; 
  }
  
  update(dt) {
    if (this.playerRef) {
        this.x = this.playerRef.x + this.offsetX;
        this.y = this.playerRef.y + this.offsetY;
        
        if (this.life !== Infinity) {
            this.life -= dt;
            if (this.life <= 0) {
                this.release();
                return; 
            }
        }
    } else {
        super.update(dt);
        if (!this.active) return; 
    }
    
    if (this.animParams) {
      this.animTimer += dt * 1000; 
      if (this.animTimer >= this.animParams.animSpeed) {
        this.animTimer = 0;
        this.currentFrame = (this.currentFrame + 1); 
        if (this.currentFrame >= this.animParams.frameCount) {
          this.currentFrame = this.animParams.frameCount - 1;
        }
      }
    }
  }
  
  draw(ctx) {
    // 1. Animacja Bicza (priorytet)
    if (this.animParams && this.playerRef) {
      const ap = this.animParams;
      const sprite = ap.spriteSheet;
      if (!sprite) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 5, this.y - this.size / 2, 10, this.size);
        return;
      }
      
      if (this.maxLife !== Infinity && this.life < 0.25) {
        ctx.globalAlpha = Math.max(0, this.life / 0.25);
      } else {
        ctx.globalAlpha = 1;
      }
      
      const scalePercent = (this.drawScale > 0 ? this.drawScale : this.size) / 100.0;
      const drawWidth = ap.frameWidth * scalePercent; 
      const drawHeight = ap.frameHeight * scalePercent;
      const sx = this.currentFrame * ap.frameWidth;
      const sy = ap.animRow * ap.frameHeight;
      
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.curveDir === 1) ctx.scale(-1, 1); 
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(sprite, sx, sy, ap.frameWidth, ap.frameHeight, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      return;
    }

    // 2. Sprite Pocisku (Venom / Nova)
    if (this.spriteKey) {
        const sprite = getAsset(this.spriteKey);
        if (sprite) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            // Bazujemy na 'size' jako promieniu
            const drawSize = this.size * 2 * this.spriteScale;
            const aspect = sprite.naturalWidth / sprite.naturalHeight;
            
            let w = drawSize;
            let h = drawSize / aspect;
            if (aspect > 1) { h = w / aspect; } else { w = h * aspect; }

            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
            ctx.restore();
            return;
        }
    }

    // 3. Fallback (Kółko)
    ctx.globalAlpha = 1; 
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Klasa dla pocisków wroga.
 */
export class EnemyBullet extends Bullet {
  static bottleSprite = null; 
  static bottleConfig = WEAPON_CONFIG.RANGED_ENEMY_BULLET;

  constructor() {
    super(); 
  }
  
  init(x, y, vx, vy, size, damage, color, life = Infinity, type = 'default', rotation = 0) {
    super.init(x, y, vx, vy, size, damage, color, life, type, rotation);
    
    if (this.type === 'bottle') {
      this.rotSpeed = (Math.random() > 0.5 ? 1 : -1) * 15; 
      if (!EnemyBullet.bottleSprite) {
          EnemyBullet.bottleSprite = getAsset('enemy_ranged_projectile');
      }
    }
  }

  draw(ctx) {
    if (this.type === 'bottle' && EnemyBullet.bottleSprite) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 255, 255, 0.95)'; 
        ctx.shadowBlur = 12; 
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.imageSmoothingEnabled = false;
        
        const drawWidth = EnemyBullet.bottleConfig.SPRITE_WIDTH * 0.5; 
        const drawHeight = EnemyBullet.bottleConfig.SPRITE_HEIGHT * 0.5; 

        ctx.drawImage(EnemyBullet.bottleSprite, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore(); 
    } else {
        super.draw(ctx);
    }
  }
}