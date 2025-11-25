// ==============
// PLAYER.JS (v0.94w - FIX: Sprite Rendering Matrix)
// Lokalizacja: /js/entities/player.js
// ==============

import { WhipWeapon } from '../config/weapons/whipWeapon.js'; 
import { get as getAsset } from '../services/assets.js';
import { PLAYER_CONFIG, HAZARD_CONFIG } from '../config/gameData.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.size = 80; // Rozmiar docelowy na ekranie

        this.baseSpeed = PLAYER_CONFIG.BASE_SPEED;
        this.speedMultiplier = 1.0;
        this.color = '#4CAF50';
        
        this.weapons = [];
        this.weapons.push(new WhipWeapon(this));
        
        this.inHazard = false; 
        
        this.knockback = { x: 0, y: 0 };
        
        // Assety
        this.spriteSheet = getAsset('player_spritesheet'); 
        if (!this.spriteSheet) this.spriteSheet = getAsset('drakul'); 
        if (!this.spriteSheet) this.spriteSheet = getAsset('player');
        
        // Konfiguracja Sprite Sheeta
        this.totalFrames = 16; 
        this.cols = 4;
        this.rows = 4;
        
        this.currentFrame = 0; 
        this.animTimer = 0;
        this.frameTime = 0.1; 
        
        this.isMoving = false;
        this.facingDir = 1; 
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
        // 1. Fizyka
        if (Math.abs(this.knockback.x) > 0.1 || Math.abs(this.knockback.y) > 0.1) {
            this.x += this.knockback.x * dt;
            this.y += this.knockback.y * dt;
            this.knockback.x *= 0.9;
            this.knockback.y *= 0.9;
        }

        // 2. Input
        let dx = 0, dy = 0;
        if (keys['ArrowUp'] || keys['w']) dy = -1;
        if (keys['ArrowDown'] || keys['s']) dy = 1;
        if (keys['ArrowLeft'] || keys['a']) dx = -1;
        if (keys['ArrowRight'] || keys['d']) dx = 1;

        if (jVec && (jVec.x !== 0 || jVec.y !== 0)) {
            dx = jVec.x;
            dy = jVec.y;
        }

        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            if (len > 1) { dx /= len; dy /= len; }
            this.isMoving = true;
            if (dx !== 0) this.facingDir = Math.sign(dx);
        } else {
            this.isMoving = false;
        }
        
        // 3. Prędkość
        let currentSpeed = this.baseSpeed * this.speedMultiplier;

        if (game.collisionSlowdown > 0) {
            currentSpeed *= (1 - game.collisionSlowdown);
            game.collisionSlowdown = Math.max(0, game.collisionSlowdown - dt * 2.0);
        }

        if (game.playerInHazard) {
            currentSpeed *= (HAZARD_CONFIG.SLOWDOWN_MULTIPLIER || 0.5);
        }
        
        if (game.speedT > 0) {
            currentSpeed *= 1.4;
        }

        this.x += dx * currentSpeed * dt;
        this.y += dy * currentSpeed * dt;

        // 4. Animacja
        this.updateAnimation(dt);
    }

    updateAnimation(dt) {
        if (!this.spriteSheet) {
            this.spriteSheet = getAsset('player_spritesheet') || getAsset('drakul') || getAsset('player');
        }
        
        if (this.isMoving) {
            this.animTimer += dt;
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
        // Fallback assetu
        if (!this.spriteSheet) {
             this.spriteSheet = getAsset('player_spritesheet') || getAsset('drakul') || getAsset('player');
        }

        ctx.save();
        ctx.translate(this.x, this.y); 
        
        // --- Efekty Wizualne ---
        if (game.playerHitFlashT > 0) {
            if (Math.floor(performance.now() / 50) % 2 === 0) {
                ctx.filter = 'grayscale(1) brightness(5)';
            }
        } else if (game.playerInHazard) {
            ctx.filter = 'sepia(1) hue-rotate(60deg) saturate(2)';
        }
        
        if (game.shield) {
            ctx.shadowColor = '#00BFFF';
            ctx.shadowBlur = 15 + 5 * Math.sin(performance.now() / 100);
        }

        // --- Rysowanie Postaci ---
        if (this.spriteSheet) {
            if (this.facingDir === -1) {
                ctx.scale(-1, 1);
            }
            
            const sheetW = this.spriteSheet.naturalWidth;
            const sheetH = this.spriteSheet.naturalHeight;
            
            // Zabezpieczenie przed niezaładowanym obrazkiem
            if (sheetW > 0 && sheetH > 0) {
                // FIX: Poprawne obliczanie klatki w siatce (cols x rows)
                const frameW = sheetW / this.cols;
                const frameH = sheetH / this.rows;
                
                const col = this.currentFrame % this.cols;
                const row = Math.floor(this.currentFrame / this.cols);
                
                const sx = col * frameW;
                const sy = row * frameH;
                
                // Skalowanie do rozmiaru gracza (80px)
                // Jeśli grafika ma np. 128px, a chcemy 80px, to scale = 80/128
                const drawH = this.size; 
                const ratio = frameW / frameH;
                const drawW = drawH * ratio;
                
                ctx.imageSmoothingEnabled = false; 
                
                ctx.drawImage(
                    this.spriteSheet, 
                    sx, sy, frameW, frameH, 
                    -drawW / 2, -drawH / 2 - 10, // Offset Y -10 (lekko w górę)
                    drawW, drawH            
                );
            }
            
        } else {
            // Fallback (Kwadrat)
            ctx.fillStyle = this.color;
            ctx.fillRect(-10, -10, 20, 20);
        }
        
        ctx.filter = 'none'; 
        
        // --- Pasek HP ---
        if (this.facingDir === -1) ctx.scale(-1, 1); // Reset skali

        const hpBarW = 64;
        const hpBarH = 6;
        const hpBarX = -hpBarW / 2;
        const hpBarY = -this.size / 2 - 20; // Nad głową (dynamicznie do rozmiaru)
        
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

        // --- Efekt Tarczy (Okrąg) ---
        if (game.shield) {
            const pulse = 50 + 3 * Math.sin(performance.now() / 100); 
            ctx.strokeStyle = '#90CAF9';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, pulse, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore(); 
        
        // --- Bronie ---
        for (const w of this.weapons) {
            if (w.draw) w.draw(ctx);
        }
    }
}