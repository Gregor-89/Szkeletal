// ==============
// PLAYER.JS (v1.10b - Shield Blink QoL)
// Lokalizacja: /js/entities/player.js
// ==============

import { WhipWeapon } from '../config/weapons/whipWeapon.js';
import { get as getAsset } from '../services/assets.js';
import { PLAYER_CONFIG, HAZARD_CONFIG, SKINS_CONFIG } from '../config/gameData.js';
import { getCurrentSkin } from '../services/skinManager.js';

export class Player {
    constructor(startX, startY) {
        this.type = 'player';

        this.x = startX;
        this.y = startY;
        this.baseSize = 80;
        this.size = this.baseSize;

        this.baseSpeed = PLAYER_CONFIG.BASE_SPEED;
        this.speedMultiplier = 1.0;
        this.color = '#4CAF50';

        this.weapons = [];
        this.weapons.push(new WhipWeapon(this));

        this.inHazard = false;

        this.knockback = { x: 0, y: 0 };

        this.currentSkinId = getCurrentSkin();
        this.refreshSkinAssets(this.currentSkinId);

        this.totalFrames = 16;
        this.cols = 4;
        this.rows = 4;

        this.currentFrame = 0;
        this.animTimer = 0;
        this.frameTime = 0.1;

        this.isMoving = false;
        this.facingDir = 1;

        this.isDead = false;
        this.deathTimer = 0;
        this.deathDuration = 1.5;
    }

    refreshSkinAssets(skinId) {
        const skinConfig = SKINS_CONFIG.find(s => s.id === skinId) || SKINS_CONFIG[0];
        this.currentSkinAsset = skinConfig.assetSprite;

        this.spriteSheet = getAsset(this.currentSkinAsset);
        // Fallbacki
        if (!this.spriteSheet) this.spriteSheet = getAsset('player_spritesheet');
        if (!this.spriteSheet) this.spriteSheet = getAsset('drakul');
        if (!this.spriteSheet) this.spriteSheet = getAsset('player');

        if (skinId === 'hot') {
            this.size = this.baseSize * 1.10;
        } else {
            this.size = this.baseSize;
        }
    }

    refreshSkin(newSkinId) {
        this.currentSkinId = newSkinId;
        this.refreshSkinAssets(newSkinId);
        this.currentFrame = 0;
        this.animTimer = 0;
    }

    reset(canvasWidth, canvasHeight) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.speedMultiplier = 1.0;

        this.weapons = [];
        this.weapons.push(new WhipWeapon(this));

        this.inHazard = false;
        this.isMoving = false;
        this.facingDir = 1;
        this.currentFrame = 0;
        this.animTimer = 0;
        this.knockback = { x: 0, y: 0 };

        this.isDead = false;
        this.deathTimer = 0;

        this.currentSkinId = getCurrentSkin();
        this.refreshSkinAssets(this.currentSkinId);
    }

    startDeath() {
        if (this.isDead) return;
        this.isDead = true;
        this.deathTimer = this.deathDuration;
    }

    updateDeathAnimation(dt) {
        if (!this.isDead) return;
        this.deathTimer -= dt;
    }

    applyKnockback(kx, ky) {
        this.knockback.x += kx;
        this.knockback.y += ky;
    }

    getWeapon(WeaponClass) {
        return this.weapons.find(w => w instanceof WeaponClass);
    }

    addWeapon(WeaponClass, perk) {
        let existing = this.getWeapon(WeaponClass);
        if (existing) {
            existing.upgrade(perk);
        } else {
            this.weapons.push(new WeaponClass(this));
        }
    }

    update(dt, game, keys, jVec, camera) {
        const globalSkin = getCurrentSkin();
        if (this.currentSkinId !== globalSkin) {
            this.refreshSkin(globalSkin);
        }

        if (this.isDead) return;

        if (Math.abs(this.knockback.x) > 0.1 || Math.abs(this.knockback.y) > 0.1) {
            this.x += this.knockback.x * dt;
            this.y += this.knockback.y * dt;
            this.knockback.x *= 0.9;
            this.knockback.y *= 0.9;
        }

        let dx = 0, dy = 0;
        if (keys['arrowup'] || keys['w']) dy = -1;
        if (keys['arrowdown'] || keys['s']) dy = 1;
        if (keys['arrowleft'] || keys['a']) dx = -1;
        if (keys['arrowright'] || keys['d']) dx = 1;

        if (jVec && (jVec.x !== 0 || jVec.y !== 0)) {
            dx = jVec.x;
            dy = jVec.y;
        }

        let inputMagnitude = 0;

        if (dx !== 0 || dy !== 0) {
            inputMagnitude = Math.hypot(dx, dy);
            if (inputMagnitude > 1) {
                dx /= inputMagnitude;
                dy /= inputMagnitude;
                inputMagnitude = 1;
            }
            this.isMoving = true;
            if (dx !== 0) this.facingDir = Math.sign(dx);
        } else {
            this.isMoving = false;
        }

        let maxCurrentSpeed = this.baseSpeed * this.speedMultiplier;

        if (game.collisionSlowdown > 0) {
            maxCurrentSpeed *= (1 - game.collisionSlowdown);
            game.collisionSlowdown = Math.max(0, game.collisionSlowdown - dt * 2.0);
        }

        if (game.playerInHazard) {
            maxCurrentSpeed *= (HAZARD_CONFIG.SLOWDOWN_MULTIPLIER || 0.5);
        }

        if (game.playerInWater) {
            maxCurrentSpeed *= 0.5;
        }

        if (game.speedT > 0) {
            maxCurrentSpeed *= 1.4;
        }

        const actualSpeed = maxCurrentSpeed * inputMagnitude;

        this.x += dx * actualSpeed * dt;
        this.y += dy * actualSpeed * dt;

        this.updateAnimation(dt, actualSpeed);
    }

    updateAnimation(dt, actualSpeed) {
        if (!this.spriteSheet) {
            this.refreshSkinAssets(this.currentSkinId);
        }

        if (this.isMoving) {
            const speedRatio = actualSpeed / this.baseSpeed;

            this.animTimer += dt * speedRatio;

            if (this.animTimer >= this.frameTime) {
                this.animTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            }
        } else {
            this.currentFrame = 0;
            this.animTimer = 0;
        }
    }

    draw(ctx, game) {
        if (this.isDead) return;

        if (!this.spriteSheet) {
            this.refreshSkinAssets(this.currentSkinId);
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        if (game.playerHitFlashT > 0) {
            if (Math.floor(performance.now() / 50) % 2 === 0) {
                ctx.filter = 'grayscale(1) brightness(5)';
            }
        }
        else if (game.playerInMegaHazard) {
            ctx.filter = 'brightness(0.7) sepia(1) hue-rotate(130deg) saturate(2)';
        }
        else if (game.playerInWater) {
            ctx.filter = 'brightness(0.9) sepia(1) hue-rotate(190deg) saturate(3)';
        }
        else if (game.playerInHazard) {
            ctx.filter = 'sepia(1) hue-rotate(60deg) saturate(2)';
        }

        if (game.shield) {
            let alpha = 0.5;
            let strokeAlpha = 0.8;

            if (game.shieldT < 3.0) {
                // ZMIANA v0.110d: Zmniejszono częstotliwość migania tarczy o połowę (mnożnik 0.75 zamiast 1.5)
                const freq = 2 + (3.0 - game.shieldT) * 0.75;
                const blinkVal = Math.sin((performance.now() / 1000) * freq * Math.PI * 2);

                if (blinkVal > 0) {
                    alpha = 0.8;
                    strokeAlpha = 1.0;
                } else {
                    alpha = 0.1;
                    strokeAlpha = 0.2;
                }
            }

            ctx.shadowColor = '#40C4FF';
            ctx.shadowBlur = 20 + 5 * Math.sin(performance.now() / 100);

            const t = performance.now() / 1000;
            const r = this.size * 0.8;

            const shieldGrad = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r);
            shieldGrad.addColorStop(0, 'rgba(64, 196, 255, 0.0)');
            shieldGrad.addColorStop(0.85, `rgba(64, 196, 255, ${alpha * 0.3})`);
            shieldGrad.addColorStop(1, `rgba(64, 196, 255, ${alpha})`);

            ctx.fillStyle = shieldGrad;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = `rgba(200, 240, 255, ${strokeAlpha})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([15, 12]);

            ctx.save();
            ctx.rotate(t * 1.5);
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            ctx.setLineDash([]);
        }

        if (this.spriteSheet) {
            if (this.facingDir === -1) {
                ctx.scale(-1, 1);
            }

            const sheetW = this.spriteSheet.naturalWidth;
            const sheetH = this.spriteSheet.naturalHeight;

            if (sheetW > 0 && sheetH > 0) {
                const frameW = sheetW / this.cols;
                const frameH = sheetH / this.rows;

                const col = this.currentFrame % this.cols;
                const row = Math.floor(this.currentFrame / this.cols);

                const sx = col * frameW;
                const sy = row * frameH;

                const drawH = this.size;
                const ratio = frameW / frameH;
                const drawW = drawH * ratio;

                ctx.imageSmoothingEnabled = false;

                ctx.drawImage(
                    this.spriteSheet,
                    sx, sy, frameW, frameH,
                    -drawW / 2, -drawH / 2 - 10,
                    drawW, drawH
                );
            }

        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(-10, -10, 20, 20);
        }

        ctx.filter = 'none';

        if (this.facingDir === -1) ctx.scale(-1, 1);

        const hpBarW = 64;
        const hpBarH = 6;
        const hpBarX = -hpBarW / 2;
        const hpBarY = -this.size / 2 - 20;

        const healthPct = Math.max(0, Math.min(1, game.health / game.maxHealth));

        ctx.fillStyle = '#222';
        ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);

        const grad = ctx.createLinearGradient(hpBarX, hpBarY, hpBarX + hpBarW, hpBarY);
        grad.addColorStop(0, '#f44336');
        grad.addColorStop(0.5, '#ffa726');
        grad.addColorStop(1, '#66bb6a');
        ctx.fillStyle = grad;
        ctx.fillRect(hpBarX, hpBarY, hpBarW * healthPct, hpBarH);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);

        ctx.restore();

        for (const w of this.weapons) {
            if (w.draw) w.draw(ctx);
        }
    }
}