// ==============
// PLAYER.JS (v0.80a - Śledzenie facingDir dla Asymetrycznego Bicza)
// Lokalizacja: /js/entities/player.js
// ==============

// POPRAWKA v0.71: Import 1 podklasy broni z nowego folderu
import { AutoGun } from '../config/weapons/autoGun.js';
// NOWY IMPORT v0.79
import { WhipWeapon } from '../config/weapons/whipWeapon.js'; 
import { get as getAsset } from '../services/assets.js';
// POPRAWKA v0.65: Import nowej centralnej konfiguracji
import { PLAYER_CONFIG } from '../config/gameData.js';

export class Player {
    constructor(startX, startY) {
        // Pozycja i rozmiar
        this.x = startX;
        this.y = startY;
        // POPRAWKA v0.65: Użyj wartości z PLAYER_CONFIG
        this.size = PLAYER_CONFIG.SIZE;

        // Statystyki
        // POPRAWKA v0.65: Użyj wartości z PLAYER_CONFIG
        this.speed = PLAYER_CONFIG.BASE_SPEED;
        this.color = '#4CAF50';
        
        this.weapons = [];
        this.weapons.push(new AutoGun(this));
        
        // POPRAWKA v0.68: Dodanie stanu dla Pól Zagrożenia
        this.inHazard = false; // Nowy stan
        
        // POPRAWKA v0.57b: Stan animacji
        this.spriteSheet = getAsset('player'); // Pobierz arkusz sprite'ów
        this.frameWidth = 32;     // Placeholder: szerokość jednej klatki
        this.frameHeight = 32;    // Placeholder: wysokość jednej klatki
        
        // Definicje animacji
        this.animations = {
            'idle': { row: 0, frameCount: 4, animationSpeed: 200 }, // Placeholder: 4 klatki, 200ms/klatkę
            'walk': { row: 1, frameCount: 4, animationSpeed: 150 }  // Placeholder: 4 klatki, 150ms/klatkę
        };
        this.currentState = 'idle'; // Domyślny stan
        
        this.animationTimer = 0;
        this.currentFrame = 0;
        this.isMoving = false;
        
        // NOWE v0.80a: Śledzenie ostatniego kierunku *poziomego* (1 = prawo, -1 = lewo)
        this.facingDir = 1;
    }

    /**
     * Resetuje gracza do stanu początkowego.
     */
    reset(canvasWidth, canvasHeight) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        // POPRAWKA v0.65: Użyj wartości z PLAYER_CONFIG
        this.speed = PLAYER_CONFIG.BASE_SPEED;
        
        this.weapons = [];
        this.weapons.push(new AutoGun(this));
        
        // POPRAWKA v0.68: Resetowanie stanu dla Pól Zagrożenia
        this.inHazard = false;
        
        // Reset animacji
        this.animationTimer = 0;
        this.currentFrame = 0;
        this.isMoving = false;
        this.currentState = 'idle';
        
        // NOWE v0.80a: Reset śledzenia kierunku
        this.facingDir = 1;
    }

    /**
     * Aktualizuje ruch i animację gracza.
     */
    update(dt, game, keys, jVec, camera) {
        let vx = 0, vy = 0;
        
        const hazardSlowdown = this.inHazard ? 0.5 : 1;
        
        const speedMul = (game.speedT > 0 ? 1.4 : 1) * (1 - (game.collisionSlowdown || 0)) * hazardSlowdown;
        const currentSpeed = this.speed * speedMul;
        const maxSpeed = this.speed * 1.3 * speedMul;

        // Input z joysticka
        if (Math.abs(jVec.x) > 0.1 || Math.abs(jVec.y) > 0.1) {
            vx += jVec.x * currentSpeed;
            vy += jVec.y * currentSpeed;
        }
        
        // Input z klawiatury
        if (keys['w'] || keys['arrowup']) vy -= currentSpeed;
        if (keys['s'] || keys['arrowdown']) vy += currentSpeed;
        if (keys['a'] || keys['arrowleft']) vx -= currentSpeed;
        if (keys['d'] || keys['arrowright']) vx += currentSpeed;

        // Normalizacja prędkości
        const sp = Math.hypot(vx, vy);
        if (sp > maxSpeed) {
            vx = (vx / sp) * maxSpeed;
            vy = (vy / sp) * maxSpeed;
        }

        this.x += vx * dt;
        this.y += vy * dt;
        
        this.isMoving = (Math.abs(vx) > 0 || Math.abs(vy) > 0);
        
        // NOWE v0.80a: Zapisz ostatni kierunek POZIOMY
        // Aktualizuj tylko, jeśli ruch poziomy jest wystarczająco duży,
        // aby uniknąć zmiany kierunku przy ruchu pionowym lub dryfowaniu joysticka.
        if (Math.abs(vx) > 0.1) {
            this.facingDir = Math.sign(vx);
        }

        // Aktualizacja stanów animacji
        const oldState = this.currentState;
        this.currentState = this.isMoving ? 'walk' : 'idle';
        
        if (oldState !== this.currentState) {
            this.animationTimer = 0;
            this.currentFrame = 0;
        }
        
        const dtMs = dt * 1000; 
        const currentAnim = this.animations[this.currentState];
        
        this.animationTimer += dtMs;
        if (this.animationTimer >= currentAnim.animationSpeed) {
            this.animationTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % currentAnim.frameCount;
        }

        return this.isMoving;
    }
    
    /**
     * Znajduje broń danego typu w ekwipunku gracza.
     */
    getWeapon(weaponClass) {
        return this.weapons.find(w => w instanceof weaponClass) || null;
    }

    /**
     * Dodaje nową broń lub ulepsza istniejącą.
     */
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
        
        if (this.spriteSheet) {
            const currentAnim = this.animations[this.currentState];
            
            const sourceX = this.currentFrame * this.frameWidth;
            const sourceY = currentAnim.row * this.frameHeight; 
            
            const drawSize = this.size * 2.5; 

            ctx.drawImage(
                this.spriteSheet, 
                sourceX,           
                sourceY,           
                this.frameWidth,   
                this.frameHeight,  
                this.x - drawSize / 2, 
                this.y - drawSize / 2, 
                drawSize,          
                drawSize           
            );
            
        } else {
            // Fallback
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        }
        
        if (this.inHazard) {
            const hazardPulse = 22 + 3 * Math.sin(performance.now() / 80);
            ctx.strokeStyle = '#00FF00'; // Zielony kontur
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, hazardPulse, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Rysowanie małego paska HP nad graczem
        const hpBarW = 64;
        const hpBarH = 6;
        const hpBarX = this.x - hpBarW / 2;
        const hpBarY = this.y - this.size / 2 - 12;
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
            const pulse = 22 + 3 * Math.sin(performance.now() / 100);
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