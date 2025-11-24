// ==============
// PLAYER.JS (v1.02 - FIX: Knockback & Physics)
// Lokalizacja: /js/entities/player.js
// ==============

import { WhipWeapon } from '../config/weapons/whipWeapon.js'; 
import { get as getAsset } from '../services/assets.js';
import { PLAYER_CONFIG, HAZARD_CONFIG } from '../config/gameData.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.size = 80; // Wizualny rozmiar (hitbox jest mniejszy)

        this.baseSpeed = PLAYER_CONFIG.BASE_SPEED;
        this.speedMultiplier = 1.0;
        this.color = '#4CAF50';
        
        this.weapons = [];
        this.weapons.push(new WhipWeapon(this));
        
        this.inHazard = false; 
        
        // Fizyka
        this.knockback = { x: 0, y: 0 }; // NOWOŚĆ: Wektor odrzutu
        
        // Animacja
        this.spriteSheet = null; 
        this.totalFrames = 16;
        this.cols = 4;
        this.rows = 4;
        this.currentFrameIndex = 0; 
        this.animTimer = 0;
        this.baseAnimSpeed = 0.04; 
        
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
        this.currentFrameIndex = 0;
        this.animTimer = 0;
        this.knockback = { x: 0, y: 0 };
    }
    
    // NOWA METODA: Aplikacja odrzutu
    applyKnockback(kx, ky) {
        this.knockback.x += kx;
        this.knockback.y += ky;
    }

    update(dt, game, keys, jVec, camera) { 
        // 1. Obsługa Knockbacku (Zanikanie)
        if (Math.abs(this.knockback.x) > 0.1 || Math.abs(this.knockback.y) > 0.1) {
            this.x += this.knockback.x * dt;
            this.y += this.knockback.y * dt;
            this.knockback.x *= 0.9; // Tarcie
            this.knockback.y *= 0.9;
        }

        let vx = 0, vy = 0;
        
        // 2. Obliczanie prędkości
        const hazardSlowdown = game.playerInHazard ? HAZARD_CONFIG.SLOWDOWN_MULTIPLIER : 1;
        const wallSlowdown = (1 - (game.collisionSlowdown || 0));
        const pickupBonus = (game.speedT > 0 ? 1.4 : 1);

        const speedMul = pickupBonus * wallSlowdown * hazardSlowdown * this.speedMultiplier;
        const currentMaxSpeed = this.baseSpeed * 1.3 * speedMul; 
        const currentSpeedFactor = this.baseSpeed * speedMul; 

        // 3. Input
        if (Math.abs(jVec.x) > 0.1 || Math.abs(jVec.y) > 0.1) {
            vx += jVec.x * currentSpeedFactor;
            vy += jVec.y * currentSpeedFactor;
        }
        
        if (keys['w'] || keys['arrowup']) vy -= currentSpeedFactor;
        if (keys['s'] || keys['arrowdown']) vy += currentSpeedFactor;
        if (keys['a'] || keys['arrowleft']) vx -= currentSpeedFactor;
        if (keys['d'] || keys['arrowright']) vx += currentSpeedFactor;

        const sp = Math.hypot(vx, vy);
        if (sp > currentMaxSpeed) {
            vx = (vx / sp) * currentMaxSpeed;
            vy = (vy / sp) * currentMaxSpeed;
        }

        // Aplikacja ruchu
        this.x += vx * dt;
        this.y += vy * dt;
        
        this.isMoving = (Math.abs(vx) > 0 || Math.abs(vy) > 0);
        
        if (Math.abs(vx) > 0.1) {
            this.facingDir = Math.sign(vx);
        }

        if (game.collisionSlowdown > 0) {
            game.collisionSlowdown -= dt * 2.0;
            if (game.collisionSlowdown < 0) game.collisionSlowdown = 0;
        }

        // 4. Animacja
        this.updateAnimation(dt);
        
        return this.isMoving;
    }

    updateAnimation(dt) {
        if (!this.spriteSheet) {
            this.spriteSheet = getAsset('player');
        }
        
        if (this.isMoving) {
            const sp = Math.hypot(this.knockback.x, this.knockback.y); // Uwzględnij knockback w animacji? Nie, tylko input.
            // Ale szybkość animacji zależna od ruchu
            this.animTimer += dt;
            if (this.animTimer > 0.1) {
                this.frameX = (this.frameX + 1) % 4; 
                this.animTimer = 0;
            }
        } else {
            this.frameX = 0; 
            this.animTimer = 0;
        }
    }

    getWeapon(weaponClass) {
        return this.weapons.find(w => w instanceof weaponClass) || null;
    }

    addWeapon(weaponClass, perk) {
        let existing = this.getWeapon(weaponClass);
        if (existing) {
            existing.upgrade(perk);
        } else {
            this.weapons.push(new weaponClass(this));
        }
    }

    draw(ctx, game) {
        if (!this.spriteSheet) {
             this.spriteSheet = getAsset('player');
        }

        let visualTopOffset = this.size / 2;

        if (this.spriteSheet) {
            const sheetW = this.spriteSheet.naturalWidth;
            const sheetH = this.spriteSheet.naturalHeight;
            const frameW = sheetW / this.cols;
            const frameH = sheetH / this.rows;
            
            const col = this.currentFrameIndex % this.cols;
            const row = Math.floor(this.currentFrameIndex / this.cols);
            const sx = col * frameW;
            const sy = row * frameH;

            // Rysujemy 48x64 (fizycznie), co jest mniejsze niż 80px size w configu?
            // Ustalmy spójność. Jeśli size=80, to obrazek powinien być podobny.
            // Ale w poprzedniej wersji rysowaliśmy na sztywno wymiary.
            
            ctx.save();
            ctx.translate(this.x, this.y); 
            
            if (this.facingDir === -1) {
                ctx.scale(-1, 1);
            }
            
            if (game.playerHitFlashT > 0 && Math.floor(performance.now() / 50) % 2 === 0) {
                ctx.filter = 'grayscale(1) brightness(5)';
            }
            
            ctx.imageSmoothingEnabled = false; 
            
            // Wymiary rysowania
            const drawW = 60; 
            const drawH = 80;
            visualTopOffset = drawH / 2;

            ctx.drawImage(
                this.spriteSheet, 
                this.frameX * frameW, 0, frameW, frameH, 
                -drawW/2, -drawH/2 - 10, 
                drawW, drawH            
            );
            
            ctx.filter = 'none'; 
            ctx.restore(); 
            
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - 10, this.y - 10, 20, 20);
        }
        
        if (game.playerInHazard) {
            const hazardPulse = 50 + 3 * Math.sin(performance.now() / 80); 
            ctx.strokeStyle = '#00FF00'; 
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, hazardPulse, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Pasek HP
        const hpBarW = 64;
        const hpBarH = 6;
        const hpBarX = this.x - hpBarW / 2;
        const hpBarY = this.y - visualTopOffset - 12; 
        
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

        if (game.shield) {
            const pulse = 50 + 3 * Math.sin(performance.now() / 100); 
            ctx.strokeStyle = '#90CAF9';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, pulse, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Rysowanie broni (bicz, orbity itp.)
        for (const w of this.weapons) {
            w.draw(ctx);
        }
    }
}