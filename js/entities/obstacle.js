// ==============
// OBSTACLE.JS (v0.97w - Smooth Fading)
// Lokalizacja: /js/entities/obstacle.js
// ==============

import { get as getAsset } from '../services/assets.js';
import { MAP_CONFIG } from '../config/gameData.js';

export class Obstacle {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.type = config.type;
        
        const minScale = config.minScale || 1.0;
        const maxScale = config.maxScale || 1.0;
        this.scaleMultiplier = minScale + Math.random() * (maxScale - minScale);
        
        this.size = (config.size || 50) * this.scaleMultiplier;
        
        const hitboxScale = config.hitboxScale || 1.0;
        this.hitboxRadius = (this.size / 2) * hitboxScale;
        
        this.spriteOffset = (config.spriteOffset || 0) * this.size;
        
        this.hasShadow = config.hasShadow !== false;
        this.shadowScale = config.shadowScale || 1.0;
        this.shadowOffsetY = (config.shadowOffsetY || 0) * this.scaleMultiplier;
        
        this.color = config.color || '#888';
        this.hp = config.hp || Infinity;
        this.maxHp = this.hp;
        this.isSolid = (config.isSolid !== undefined) ? config.isSolid : true;
        this.isSlow = config.isSlow || false;
        this.slowFactor = config.slowFactor || 1.0;
        this.dropChance = config.dropChance || 0;
        this.isDead = false;
        this.isRuined = false; 
        
        this.lastUsedTime = -9999; 
        
        if (config.canRotate === false) {
            this.rotation = 0;
        } else {
            this.rotation = (Math.random() - 0.5) * 0.2; 
        }
        
        this.flipX = Math.random() < 0.5 ? 1 : -1;
        
        const variantsCount = config.variants || 1;
        let variantIdx = 1;
        if (variantsCount > 1) {
            variantIdx = Math.floor(Math.random() * variantsCount) + 1;
        }
        
        if (this.type === 'shrine') {
            this.assetKey = 'env_shrine';
        } else {
            this.assetKey = `env_${this.type}_${variantIdx}`;
        }
        
        this.shakeTimer = 0;
        
        // FIX v0.97w: Zmienna do płynnej przezroczystości
        this.opacity = 1.0;
    }

    takeDamage(amount, source) {
        if (this.hp === Infinity || this.isRuined) return false;
        if (source === 'enemy' || source === 'hazard') return false;
        
        this.hp -= amount;
        this.shakeTimer = 0.2; 
        
        if (this.hp <= 0) {
            if (this.type === 'hut') {
                this.isRuined = true;
                this.isSolid = false; 
                this.hasShadow = false;
            } else {
                this.isDead = true; 
            }
            return true; 
        }
        return false;
    }
    
    // FIX v0.97w: Dodano parametr 'player' do update, aby liczyć fading
    update(dt, player) {
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
        }
        
        // Logika Fading (płynne znikanie)
        let targetOpacity = 1.0;
        
        if (player && !this.isRuined && this.type !== 'water') {
            // Jeśli gracz jest wyżej i blisko w osi X (czyli za obiektem)
            if (player.y < this.y && Math.abs(player.x - this.x) < this.size * 0.6) {
                targetOpacity = 0.4; // Bardziej przezroczyste niż wcześniej (było 0.6)
            }
        }
        
        // Lerp (Linear Interpolation) dla płynności
        // Szybkość zmiany: 5.0 * dt
        this.opacity += (targetOpacity - this.opacity) * 5.0 * dt;
    }

    drawShadow(ctx) {
        if (this.isDead || this.isRuined || !this.hasShadow) return;

        ctx.save();
        
        let drawX = this.x;
        let drawY = this.y;
        if (this.shakeTimer > 0) {
            drawX += (Math.random() - 0.5) * 6;
            drawY += (Math.random() - 0.5) * 6;
        }
        
        ctx.translate(drawX, drawY);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        const shadowW = (this.size / 2) * this.shadowScale;
        const shadowH = shadowW * 0.4; 
        ctx.ellipse(0, this.shadowOffsetY, shadowW, shadowH, 0, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }

    draw(ctx, player, gameTime) {
        if (this.isDead) return;

        let sprite = getAsset(this.isRuined ? 'env_rubble' : this.assetKey);
        
        ctx.save();
        
        // Aplikacja przezroczystości
        ctx.globalAlpha = this.opacity;
        
        let drawX = this.x;
        let drawY = this.y;
        if (this.shakeTimer > 0) {
            drawX += (Math.random() - 0.5) * 6;
            drawY += (Math.random() - 0.5) * 6;
        }
        
        ctx.translate(drawX, drawY);
        ctx.rotate(this.rotation);
        ctx.scale(this.flipX, 1);
        
        if (this.type === 'shrine' && gameTime !== undefined) {
            const shrineStats = MAP_CONFIG.OBSTACLE_STATS.shrine;
            const cooldown = shrineStats.cooldown || 120;
            const isReady = gameTime >= this.lastUsedTime + cooldown;
            
            if (isReady) {
                ctx.shadowColor = '#FFD700'; 
                ctx.shadowBlur = 40 + Math.sin(gameTime * 4) * 20; 
            }
        }
        
        if (sprite) {
            const aspect = sprite.naturalWidth / sprite.naturalHeight;
            
            let drawSize = this.size;
            if (this.isRuined) drawSize *= 0.7;
            
            const drawH = drawSize;
            const drawW = drawH * aspect;
            
            let offsetY = this.spriteOffset;
            if (this.isRuined) offsetY = 25; 
            
            ctx.drawImage(sprite, -drawW/2, -drawH/2 + offsetY, drawW, drawH);
        } else {
            ctx.fillStyle = this.isRuined ? '#555' : this.color;
            ctx.beginPath();
            if (this.type === 'hut') {
                ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            } else {
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
        
        if (!this.isRuined && this.hp < this.maxHp && this.hp > 0) {
            const barW = this.size * 0.8;
            const barY = this.y + this.spriteOffset - this.size/2 - 20;
            ctx.fillStyle = 'red'; ctx.fillRect(this.x - barW/2, barY, barW, 6);
            ctx.fillStyle = '#0f0'; ctx.fillRect(this.x - barW/2, barY, barW * (this.hp / this.maxHp), 6);
        }
    }
}