// ==============
// BULLET.JS (v0.95 - FIX: Invisible Hitbox Support)
// Lokalizacja: /js/entities/bullet.js
// ==============

import { get as getAsset } from '../services/assets.js';

export class Bullet {
    constructor() {
        this.active = false;
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.size = 0;
        this.damage = 0;
        this.color = '#fff';
        this.isEnemy = false; 
        this.type = 'default'; 
        this.pool = null;
        this.life = Infinity;
        this.maxLife = Infinity;
    }

    init(x, y, vx, vy, size, damage, color, life = Infinity, type = 'default') {
        this.active = true;
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.size = size;
        this.damage = damage;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.type = type; 
    }

    isOffScreen(camera) {
        const margin = 50;
        const viewLeft = camera.offsetX;
        const viewRight = camera.offsetX + camera.viewWidth;
        const viewTop = camera.offsetY;
        const viewBottom = camera.offsetY + camera.viewHeight;
        return (this.x < viewLeft - margin || this.x > viewRight + margin || this.y < viewTop - margin || this.y > viewBottom + margin);
    }

    release() {
        if (this.pool) {
            this.pool.release(this);
        }
        this.active = false; 
        this.life = Infinity; 
    }

    update(dt) {
        if (!this.active) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        if (this.life !== Infinity) {
            this.life -= dt;
            if (this.life <= 0) {
                this.release();
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        if (this.maxLife !== Infinity && this.life < 0.25) {
            ctx.globalAlpha = Math.max(0, this.life / 0.25);
        }
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.globalAlpha = 1;
    }
}

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
    this.spriteKey = null;
    this.spriteScale = 1.0;
  }
  
  init(x, y, vx, vy, size, damage, color, pierce, life = Infinity, bouncesLeft = 0, curveDir = 0, animParams = null, playerRef = null, drawScale = 0, spriteKey = null, spriteScale = 1.0) {
    super.init(x, y, vx, vy, size, damage, color, life, 'player');
    
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
    this.spriteKey = spriteKey;
    this.spriteScale = spriteScale;
    
    if (this.spriteKey && (Math.abs(vx) > 0 || Math.abs(vy) > 0)) {
        this.rotation = Math.atan2(vy, vx);
    } else {
        this.rotation = 0;
    }
  }
  
  release() {
    super.release();
    this.playerRef = null; 
    this.offsetX = 0; this.offsetY = 0;
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
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.life !== Infinity) {
            this.life -= dt;
            if (this.life <= 0) {
                this.release();
                return;
            }
        }
    }
    
    if (!this.active) return;

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
    if (!this.active) return;

    // FIX: Jeśli drawScale jest 0, nie rysuj nic (dla Point-Blank bicza)
    if (this.drawScale <= 0.001 && !this.spriteKey) return;

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

    if (this.spriteKey) {
        const sprite = getAsset(this.spriteKey);
        if (sprite) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
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

    // Fallback (Kółko) - rysuje się tylko jeśli nie ma animacji/sprite'a i drawScale > 0
    ctx.globalAlpha = 1; 
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class EnemyBullet extends Bullet {
    static bottleSprite = null;

    constructor() {
        super();
        this.isEnemy = true;
        this.rotation = 0;
        this.rotSpeed = 0;
    }

    init(x, y, vx, vy, size, damage, color, life = Infinity, type = 'default', rotation = 0) {
        super.init(x, y, vx, vy, size, damage, color, life, type);
        if (this.type === 'bottle') {
            this.rotSpeed = (Math.random() > 0.5 ? 1 : -1) * 15; 
            this.rotation = rotation || Math.random() * Math.PI * 2;
        } else {
            this.rotSpeed = 0;
            this.rotation = rotation;
        }
    }

    update(dt) {
        super.update(dt);
        if (!this.active) return;

        if (this.type === 'bottle') {
            this.rotation += this.rotSpeed * dt;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);

        let asset = null;
        if (this.type === 'bottle') {
            if (!EnemyBullet.bottleSprite) EnemyBullet.bottleSprite = getAsset('enemy_ranged_projectile');
            asset = EnemyBullet.bottleSprite;
        } else {
            asset = getAsset(this.color);
        }

        if (asset) {
            ctx.shadowColor = 'rgba(255, 100, 100, 0.5)'; 
            ctx.shadowBlur = 10; 
            
            if (this.rotation !== 0) ctx.rotate(this.rotation);
            
            let drawWidth = this.size * 2;
            let drawHeight = this.size * 2;

            if (this.type === 'bottle') {
                drawWidth = 22 * 0.625; 
                drawHeight = 64 * 0.625;
            } else {
                drawWidth = this.size * 2.0;
                drawHeight = this.size * 2.0;
            }

            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(asset, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

        } else {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 4;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}