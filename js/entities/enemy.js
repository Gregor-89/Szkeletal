// ==============
// ENEMY.JS (v0.94l - FIX: Revert Death Anim, Keep Healthbar)
// Lokalizacja: /js/entities/enemy.js
// ==============

import { colorForEnemy } from '../core/utils.js';
import { HAZARD_CONFIG } from '../config/gameData.js';
import { get as getAsset } from '../services/assets.js';

export class Enemy {
    constructor(x, y, stats, hpScale = 1) {
        this.x = x;
        this.y = y;
        this.id = Math.random();
        this.stats = stats;
        this.type = stats.type || 'standard';
        this.hp = Math.floor(stats.hp * (hpScale || 1));
        this.maxHp = this.hp;
        this.speed = stats.speed;
        this.size = stats.size || 20;
        this.damage = stats.damage;
        this.color = stats.color;
        this.xpValue = stats.xpValue || 1;
        
        this.isDead = false;
        
        // Usunięto flagi dying/deathTimer (wracamy do natychmiastowego killa)
        
        this.hitStun = 0;
        this.hitFlashT = 0;
        this.frozenTimer = 0;
        this.knockback = { x: 0, y: 0 };
        
        this.showHealthBar = false;
        
        this.separationCooldown = Math.random() * 0.15;
        this.separationX = 0;
        this.separationY = 0;
        this.hazardSlowdownT = 0;
        
        const idleKey = stats.assetKey || ('enemy_' + this.type);
        const spriteSheetKey = idleKey + '_spritesheet';
        const spriteSheet = getAsset(spriteSheetKey);
        
        if (spriteSheet) {
            this.sprite = spriteSheet;
            this.cols = 4;
            this.rows = 4;
            this.totalFrames = 16;
            this.frameTime = 0.1;
        } else {
            this.sprite = getAsset(idleKey);
            this.cols = 1;
            this.rows = 1;
            this.totalFrames = 1;
        }
        
        this.currentFrame = 0;
        this.animTimer = 0;
        this.facingDir = 1;
        this.visualScale = 1.54;
    }
    
    update(dt, player, game) {
        if (this.isDead) return;
        
        if (this.hitStun > 0) this.hitStun -= dt;
        if (this.hitFlashT > 0) this.hitFlashT -= dt;
        if (this.hazardSlowdownT > 0) this.hazardSlowdownT -= dt;
        
        if (this.frozenTimer > 0) {
            this.frozenTimer -= dt;
            return;
        }
        
        if (Math.abs(this.knockback.x) > 0.1 || Math.abs(this.knockback.y) > 0.1) {
            this.x += this.knockback.x * dt;
            this.y += this.knockback.y * dt;
            this.knockback.x *= 0.9;
            this.knockback.y *= 0.9;
        }
        else if (this.hitStun <= 0) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            let currentSpeed = this.getSpeed(game);
            
            if (dist > 0.1) {
                const randomOffset = Math.sin(game.time * 3 + this.id * 7.3) * 0.15;
                const targetAngle = Math.atan2(dy, dx) + randomOffset;
                this.x += Math.cos(targetAngle) * currentSpeed * dt;
                this.y += Math.sin(targetAngle) * currentSpeed * dt;
                
                if (Math.abs(dx) > 0.1) this.facingDir = Math.sign(dx);
            }
            
            this.x += this.separationX * 1.0 * dt;
            this.y += this.separationY * 1.0 * dt;
        }
        
        if (this.totalFrames > 1) {
            this.animTimer += dt;
            if (this.animTimer >= this.frameTime) {
                this.animTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            }
        }
    }
    
    getSeparationRadius() { return (this.size * this.visualScale) * 0.5; }
    
    applySeparation(dt, enemies) {
        this.separationCooldown -= dt;
        if (this.separationCooldown <= 0) {
            this.separationCooldown = 0.15;
            this.separationX = 0;
            this.separationY = 0;
            const multiplier = 144;
            const myRadius = this.getSeparationRadius();
            
            for (const other of enemies) {
                if (this.id === other.id || other.isDead) continue;
                if (this.type === 'wall' && other.type !== 'wall') continue;
                
                const odx = this.x - other.x;
                const ody = this.y - other.y;
                const d = Math.hypot(odx, ody);
                const requiredDist = myRadius + other.getSeparationRadius();
                
                if (d < requiredDist && d > 0.1) {
                    const force = (requiredDist - d) / requiredDist;
                    this.separationX += (odx / d) * force * multiplier;
                    this.separationY += (ody / d) * force * multiplier;
                }
            }
        }
    }
    
    getSpeed(game) {
        const hazardSlowdown = this.hazardSlowdownT > 0 ? HAZARD_CONFIG.HAZARD_ENEMY_SLOWDOWN_MULTIPLIER : 1;
        return this.speed * (game.freezeT > 0 ? 0.25 : 1) * (1 - (this.hitStun || 0)) * hazardSlowdown;
    }
    
    draw(ctx, game) {
        if (!this.sprite) {
            const key = this.stats.assetKey || ('enemy_' + this.type);
            this.sprite = getAsset(key);
        }
        
        ctx.save();
        
        if (this.hitFlashT > 0) {
            if (Math.floor(game.time * 20) % 2 === 0) ctx.filter = 'grayscale(1) brightness(5)';
        } else if (this.frozenTimer > 0 || game.freezeT > 0) {
            ctx.filter = 'sepia(1) hue-rotate(170deg) saturate(2)';
        } else if (this.hazardSlowdownT > 0) {
            ctx.filter = 'sepia(1) hue-rotate(60deg) saturate(2)';
        }
        
        if (this.sprite) {
            const sheetW = this.sprite.naturalWidth;
            const sheetH = this.sprite.naturalHeight;
            const frameW = sheetW / this.cols;
            const frameH = sheetH / this.rows;
            const col = this.currentFrame % this.cols;
            const row = Math.floor(this.currentFrame / this.cols);
            const sx = col * frameW;
            const sy = row * frameH;
            const destH = this.size * this.visualScale;
            const aspectRatio = frameW / frameH;
            const destW = destH * aspectRatio;
            
            ctx.imageSmoothingEnabled = false;
            
            if (this.facingDir === -1) {
                ctx.translate(this.x, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(this.sprite, sx, sy, frameW, frameH, -destW / 2, -destH / 2, destW, destH);
                ctx.restore();
                ctx.save();
            } else {
                ctx.drawImage(this.sprite, sx, sy, frameW, frameH, this.x - destW / 2, this.y - destH / 2, destW, destH);
            }
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            ctx.strokeStyle = this.getOutlineColor();
            ctx.strokeRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        }
        
        // Healthbary rysowane przez draw.js
        ctx.restore();
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlashT = 0.15;
        
        if (this.type === 'tank' || this.type === 'elite' || this.type === 'wall') {
            this.showHealthBar = true;
        }
        
        if (this.hp <= 0) {
            this.die();
            return true;
        }
        return false;
    }
    
    applyKnockback(kx, ky) {
        if (this.frozenTimer > 0) return;
        this.knockback.x = kx;
        this.knockback.y = ky;
    }
    
    freeze(duration) { this.frozenTimer = duration; }
    
    die() {
        this.isDead = true;
        // Brak animacji śmierci typu fade-out, robimy to w menedżerze przez particle
    }
    
    getOutlineColor() { return colorForEnemy(this); }
    
    drawHealthBar(ctx) {}
}