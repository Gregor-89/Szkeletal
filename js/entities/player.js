// ==============
// PLAYER.JS (v0.92a - Fix: Dokładny rozmiar 80px)
// Lokalizacja: /js/entities/player.js
// ==============

import { AutoGun } from '../config/weapons/autoGun.js';
import { WhipWeapon } from '../config/weapons/whipWeapon.js'; 
import { get as getAsset } from '../services/assets.js';
import { PLAYER_CONFIG } from '../config/gameData.js';

export class Player {
    constructor(startX, startY) {
        // Pozycja i rozmiar
        this.x = startX;
        this.y = startY;
        
        // Hitbox (średnica kolizji) - to jest fizyczna wielkość gracza
        // W v0.91 wynikowy rozmiar obrazka wynosił 80px.
        this.size = 80; 

        // Statystyki
        this.speed = PLAYER_CONFIG.BASE_SPEED;
        this.color = '#4CAF50';
        
        this.weapons = [];
        this.weapons.push(new WhipWeapon(this));
        
        this.inHazard = false; 
        
        // --- LOGIKA ANIMACJI v0.92 ---
        this.spriteSheet = getAsset('player'); 
        
        // Konfiguracja Sprite Sheeta (4x4)
        this.totalFrames = 16;
        this.cols = 4;
        this.rows = 4;
        
        // Stan animacji
        this.currentFrameIndex = 0; 
        this.animTimer = 0;
        this.baseAnimSpeed = 0.04; 
        
        this.isMoving = false;
        this.facingDir = 1; // 1 = Prawo, -1 = Lewo
    }

    /**
     * Resetuje gracza do stanu początkowego.
     */
    reset(canvasWidth, canvasHeight) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.speed = PLAYER_CONFIG.BASE_SPEED;
        
        this.weapons = [];
        this.weapons.push(new WhipWeapon(this));
        
        this.inHazard = false;
        
        // Reset animacji
        this.isMoving = false;
        this.facingDir = 1;
        this.currentFrameIndex = 0;
        this.animTimer = 0;
    }

    /**
     * Aktualizuje ruch i animację gracza.
     */
    update(dt, game, keys, jVec, camera) {
        let vx = 0, vy = 0;
        
        const hazardSlowdown = this.inHazard ? 0.5 : 1;
        
        const speedMul = (game.speedT > 0 ? 1.4 : 1) * (1 - (game.collisionSlowdown || 0)) * hazardSlowdown;
        const currentMaxSpeed = this.speed * 1.3 * speedMul; 
        const currentSpeedFactor = this.speed * speedMul; 

        // Input z joysticka
        if (Math.abs(jVec.x) > 0.1 || Math.abs(jVec.y) > 0.1) {
            vx += jVec.x * currentSpeedFactor;
            vy += jVec.y * currentSpeedFactor;
        }
        
        // Input z klawiatury
        if (keys['w'] || keys['arrowup']) vy -= currentSpeedFactor;
        if (keys['s'] || keys['arrowdown']) vy += currentSpeedFactor;
        if (keys['a'] || keys['arrowleft']) vx -= currentSpeedFactor;
        if (keys['d'] || keys['arrowright']) vx += currentSpeedFactor;

        // Normalizacja prędkości
        const sp = Math.hypot(vx, vy);
        if (sp > currentMaxSpeed) {
            vx = (vx / sp) * currentMaxSpeed;
            vy = (vy / sp) * currentMaxSpeed;
        }

        this.x += vx * dt;
        this.y += vy * dt;
        
        this.isMoving = (Math.abs(vx) > 0 || Math.abs(vy) > 0);
        
        // Zapisz ostatni kierunek POZIOMY (dla odbicia lustrzanego)
        if (Math.abs(vx) > 0.1) {
            this.facingDir = Math.sign(vx);
        }

        // --- AKTUALIZACJA ANIMACJI v0.92 ---
        if (this.isMoving) {
            const speedRatio = sp / PLAYER_CONFIG.BASE_SPEED;
            this.animTimer += dt * speedRatio;
            
            if (this.animTimer >= this.baseAnimSpeed) {
                this.animTimer = 0;
                this.currentFrameIndex = (this.currentFrameIndex + 1) % this.totalFrames;
            }
        } else {
            this.currentFrameIndex = 0;
            this.animTimer = 0;
        }

        return this.isMoving;
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

    /**
     * Rysuje gracza i jego pasek HP na canvasie.
     */
    draw(ctx, game) {
        if (!this.spriteSheet) {
             this.spriteSheet = getAsset('player');
        }

        // Zmienna pomocnicza do ustalenia, gdzie jest góra grafiki (dla paska HP)
        // Domyślnie: połowa hitboxa
        let visualTopOffset = this.size / 2;

        if (this.spriteSheet) {
            // 1. Obliczanie wymiarów klatki ŹRÓDŁOWEJ
            const sheetW = this.spriteSheet.naturalWidth;
            const sheetH = this.spriteSheet.naturalHeight;
            
            const frameW = sheetW / this.cols;
            const frameH = sheetH / this.rows;
            
            // 2. Obliczanie pozycji klatki
            const col = this.currentFrameIndex % this.cols;
            const row = Math.floor(this.currentFrameIndex / this.cols);
            const sx = col * frameW;
            const sy = row * frameH;

            // 3. Obliczanie wymiarów DOCELOWYCH (na ekranie) - FIX v0.92a
            // Ustawiamy visualScale na 1.0, aby grafika miała dokładnie rozmiar hitboxa (80px).
            // Dzięki temu rozmiar jest identyczny jak w v0.91.
            const visualScale = 1.0; 
            
            // Zachowujemy proporcje klatki źródłowej (na wypadek gdyby nie była idealnym kwadratem)
            const ratio = frameW / frameH; 
            
            // Height = 80px * 1.0 = 80px
            const destH = this.size * visualScale; 
            const destW = destH * ratio; 
            
            visualTopOffset = destH / 2; 

            ctx.save();
            ctx.translate(this.x, this.y); 
            
            if (this.facingDir === -1) {
                ctx.scale(-1, 1);
            }
            
            if (game.playerHitFlashT > 0 && Math.floor(performance.now() / 50) % 2 === 0) {
                ctx.filter = 'grayscale(1) brightness(5)';
            }
            
            ctx.imageSmoothingEnabled = false; 
            
            // RYSOWANIE KLATKI
            ctx.drawImage(
                this.spriteSheet, 
                sx, sy, frameW, frameH, // Źródło
                -destW / 2, -destH / 2, // Cel (centrowanie względem x,y)
                destW, destH            // Wymuszony rozmiar
            );
            
            ctx.filter = 'none'; 
            ctx.restore(); 
            
        } else {
            // Fallback
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        }
        
        // Rysowanie efektów
        if (this.inHazard) {
            const hazardPulse = 50 + 3 * Math.sin(performance.now() / 80); 
            ctx.strokeStyle = '#00FF00'; 
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, hazardPulse, 0, Math.PI * 2);
            ctx.stroke();
        }

        const hpBarW = 64;
        const hpBarH = 6;
        const hpBarX = this.x - hpBarW / 2;
        
        // Pasek HP
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
        
        for (const weapon of this.weapons) {
            weapon.draw(ctx);
        }
    }
}