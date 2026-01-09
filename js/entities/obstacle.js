// ==============
// OBSTACLE.JS (v1.13b - Shrine Logic Stability)
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

        // Czas ostatniego użycia (np. dla kapliczek). -9999 zapewnia gotowość na starcie.
        this.lastUsedTime = -9999;

        // System zapobiegania "mieleniu" HP przez bicz i pociski z pierce.
        this.lastStrikeId = null;
        this.lastHitTime = 0;

        if (config.canRotate === false) this.rotation = 0;
        else this.rotation = (Math.random() - 0.5) * 0.2;

        this.flipX = Math.random() < 0.5 ? 1 : -1;

        const variantsCount = config.variants || 1;
        let variantIdx = 1;
        if (variantsCount > 1) variantIdx = Math.floor(Math.random() * variantsCount) + 1;

        if (this.type === 'shrine') this.assetKey = 'env_shrine';
        else this.assetKey = `env_${this.type}_${variantIdx}`;

        this.shakeTimer = 0;
        this.opacity = 1.0;
    }

    /**
     * @param {number} amount - Obrażenia
     * @param {string} source - Źródło (player/enemy)
     * @param {string|number} strikeId - Unikalne ID uderzenia
     * @param {number} gameTime - Aktualny czas gry
     */
    takeDamage(amount, source, strikeId = null, gameTime = 0) {
        if (this.hp === Infinity || this.isRuined) return false;
        if (source === 'enemy' || source === 'hazard') return false;

        if (strikeId !== null && this.lastStrikeId === strikeId) return false;
        if (gameTime > 0 && gameTime - this.lastHitTime < 0.1) return false;

        this.lastStrikeId = strikeId;
        this.lastHitTime = gameTime;

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
            return true; // Zniszczono
        }
        return "hit"; // Trafiono
    }

    update(dt, player) {
        if (this.shakeTimer > 0) this.shakeTimer -= dt;
        let targetOpacity = 1.0;

        if (player && !this.isRuined && this.type !== 'water') {
            // FIX: Precyzyjne granice wizualne sprite'a
            const drawSize = this.size;
            const offsetY = this.spriteOffset;
            const visualTop = this.y - drawSize / 2 + offsetY;

            // Warunki przezroczystości:
            // 1. Obiekt jest "niżej" niż gracz (this.y > player.y) -> potencjalnie zasłania gracza
            // 2. Gracz fizycznie znajduje się w pionowym obszarze rysowania sprite'a (między visualTop a this.y)
            // 3. Gracz jest blisko w poziomie (X)
            if (this.y > player.y && player.y > visualTop && Math.abs(player.x - this.x) < this.size * 0.6) {
                targetOpacity = 0.4;
            }
        }

        this.opacity += (targetOpacity - this.opacity) * 5.0 * dt;
    }

    drawShadow(ctx) {
        if (this.isDead || this.isRuined || !this.hasShadow) return;
        ctx.save();
        let drawX = this.x, drawY = this.y;
        if (this.shakeTimer > 0) { drawX += (Math.random() - 0.5) * 6; drawY += (Math.random() - 0.5) * 6; }
        ctx.translate(drawX, drawY);
        ctx.rotate(this.rotation);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        const shadowW = (this.size / 2) * this.shadowScale;
        const shadowH = shadowW * 0.4;
        ctx.ellipse(0, this.shadowOffsetY, shadowW, shadowH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Sprawdza czy kapliczka jest gotowa (poza cooldownem)
     */
    isShrineReady(gameTime) {
        if (this.type !== 'shrine') return false;
        const stats = MAP_CONFIG.OBSTACLE_STATS.shrine;
        return gameTime >= this.lastUsedTime + (stats.cooldown || 120);
    }

    draw(ctx, player, gameTime) {
        if (this.isDead) return;

        // --- LOGIKA GLOW DLA KAPLICZKI ---
        if (this.type === 'shrine' && this.isShrineReady(gameTime)) {
            ctx.save();
            const pulse = 1 + 0.1 * Math.sin(gameTime * 3);
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 0.8 * pulse);
            grad.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
            grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.8 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        let sprite = getAsset(this.isRuined ? 'env_rubble' : this.assetKey);
        ctx.save();
        ctx.globalAlpha = this.opacity;
        let drawX = this.x, drawY = this.y;
        if (this.shakeTimer > 0) { drawX += (Math.random() - 0.5) * 6; drawY += (Math.random() - 0.5) * 6; }
        ctx.translate(drawX, drawY);
        ctx.rotate(this.rotation);
        ctx.scale(this.flipX, 1);

        if (sprite) {
            const aspect = sprite.naturalWidth / sprite.naturalHeight;
            let drawSize = this.size;
            if (this.isRuined) drawSize *= 0.7;
            const drawH = drawSize, drawW = drawH * aspect;
            let offsetY = this.spriteOffset;
            if (this.isRuined) offsetY = 25;
            ctx.drawImage(sprite, -drawW / 2, -drawH / 2 + offsetY, drawW, drawH);
        } else {
            ctx.fillStyle = this.isRuined ? '#555' : this.color;
            ctx.beginPath();
            if (this.type === 'hut') ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            else { ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.restore();

        // Pasek HP dla chatek
        if (!this.isRuined && this.hp < this.maxHp && this.hp > 0) {
            const barW = this.size * 0.8;
            const barY = this.y + this.spriteOffset - this.size / 2 - 20;
            ctx.fillStyle = 'red'; ctx.fillRect(this.x - barW / 2, barY, barW, 6);
            ctx.fillStyle = '#0f0'; ctx.fillRect(this.x - barW / 2, barY, barW * (this.hp / this.maxHp), 6);
        }
    }
}