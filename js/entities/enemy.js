// ==============
// ENEMY.JS (v0.91W - Usunięcie przestarzałej logiki animacji)
// Lokalizacja: /js/entities/enemy.js
// ==============

import { colorForEnemy } from '../core/utils.js';
// POPRAWKA v0.65: Import nowej centralnej konfiguracji
import { WEAPON_CONFIG, HAZARD_CONFIG } from '../config/gameData.js';
import { get as getAsset } from '../services/assets.js';

// === KLASA BAZOWA WRONIA ===

export class Enemy {
    constructor(x, y, stats, hpScale) {
        this.x = x;
        this.y = y;
        this.id = 0; 

        // Statystyki
        this.stats = stats; // Statystyki są już pobierane z gameData.js (w enemyManager)
        this.type = stats.type || 'standard';
        this.hp = Math.floor(stats.hp * hpScale);
        this.maxHp = this.hp;
        this.speed = stats.speed;
        this.size = stats.size; // Mechaniczny hitbox (np. 52 dla 'standard')
        this.damage = stats.damage;
        this.color = stats.color;

        // Stan
        this.lastPlayerCollision = 0;
        this.hitStun = 0;
        this.hitFlashT = 0; // NOWA LINIA v0.91R: Timer mrugania na biało
        this.rangedCooldown = 0;
        this.separationCooldown = Math.random() * 0.15;
        this.separationX = 0;
        this.separationY = 0;
        this.hazardSlowdownT = 0; // POPRAWKA v0.68a: Timer spowolnienia przez Hazard
        
        // --- NOWA LOGIKA GRAFIKI (v0.91j) ---
        this.spriteSheet = getAsset('enemy_' + this.type); 
        
        this.spriteWidth = 32; // Domyślnie
        this.spriteHeight = 32; // Domyślnie
        if (this.spriteSheet) {
            this.spriteWidth = this.spriteSheet.naturalWidth;
            this.spriteHeight = this.spriteSheet.naturalHeight;
        }
        
        // NOWA LINIA v0.91j: Mnożnik rozmiaru wizualnego. 1.0 = 100% (bazowe 80px wysokości)
        this.drawScale = 1.0; 
        
        this.facingDir = 1; 

        // (Usunięto starą logikę animacji)
    }
    
    /**
     * NOWA METODA (v0.75): Obsługa otrzymania obrażeń.
     */
    takeDamage(damage) {
        this.hp -= damage;
        this.hitStun = 0.15;
        this.hitFlashT = 0.15; // NOWA LINIA v0.91R: Ustaw timer mrugania
    }

    /**
     * Główna metoda aktualizacji. Domyślnie goni gracza.
     */
    update(dt, player, game, state) {
        
        if (this.hitStun > 0) {
            this.hitStun -= dt;
        } else {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            let vx = 0, vy = 0;
            let currentSpeed = this.getSpeed(game, dist);

            if (dist > 0.1) {
                const randomOffset = Math.sin(game.time * 3 + this.id * 7.3) * 0.15;
                const targetAngle = Math.atan2(dy, dx) + randomOffset;
                vx = Math.cos(targetAngle) * currentSpeed;
                vy = Math.sin(targetAngle) * currentSpeed;
                
                if (Math.abs(vx) > 0.1) {
                    this.facingDir = Math.sign(vx);
                }
            }

            // POPRAWKA v0.91b: Zwiększono siłę separacji z 0.5 na 1.0
            this.x += (vx + this.separationX * 1.0) * dt;
            this.y += (vy + this.separationY * 1.0) * dt;
        }
        
        if (this.hitFlashT > 0) { // NOWA LINIA v0.91R: Dekrementacja timera mrugania
            this.hitFlashT -= dt;
        }
    }

    /**
     * Oblicza separację od innych wrogów (wywoływane rzadziej z gameLogic)
     */
    applySeparation(dt, enemies) {
        this.separationCooldown -= dt;
        if (this.separationCooldown <= 0) {
            this.separationCooldown = 0.15; 
            
            this.separationX = 0; 
            this.separationY = 0;
            
            const multiplier = 144; 
            
            for (const other of enemies) {
                if (this.id === other.id) continue;
                
                if (this.type === 'wall' && other.type !== 'wall') {
                    continue;
                }
                
                const odx = this.x - other.x;
                const ody = this.y - other.y;
                const d = Math.hypot(odx, ody);
                
                // POPRAWKA v0.91b: Użyj sumy promieni hitboxów (size/2)
                const requiredDist = (this.size / 2) + (other.size / 2);
                
                if (d < requiredDist && d > 0.1) {
                    const force = (requiredDist - d) / requiredDist; 
                    
                    this.separationX += (odx / d) * force * multiplier;
                    this.separationY += (ody / d) * force * multiplier;
                }
            }
        }
    }

    /**
     * Główna metoda rysowania.
     */
    draw(ctx, game) {
        ctx.save();
        
        // POPRAWKA v0.91R: Używamy hitFlashT zamiast hitStun do mrugania
        if (this.hitFlashT > 0 && Math.floor(performance.now() / 50) % 2 === 0) {
            ctx.filter = 'grayscale(1) brightness(5)'; // Białe mignięcie
        }

        // Spowolnienie
        if (game.freezeT > 0 || this.hazardSlowdownT > 0) { 
            ctx.strokeStyle = (this.hazardSlowdownT > 0 && game.freezeT <= 0) ? '#00FF00' : '#29b6f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.size / 2 - 2, this.y - this.size / 2 - 2, this.size + 4, this.size + 4);
        }
        
        // --- NOWA LOGIKA RYSOWANIA (v0.91j - Skalowanie z drawScale) ---
        if (this.spriteSheet) {
            // Cel: 80px wysokości * mnożnik (np. 1.0 dla standard, 0.7 dla trolla)
            const targetVisualHeight = 80 * this.drawScale; 
            
            // Oblicz proporcje (W / H)
            const aspectRatio = this.spriteWidth / this.spriteHeight;
            
            const drawHeight = targetVisualHeight;
            const drawWidth = targetVisualHeight * aspectRatio;
            
            ctx.save();
            ctx.translate(this.x, this.y); 
            
            if (this.facingDir === -1) {
                ctx.scale(-1, 1);
            }
            
            ctx.imageSmoothingEnabled = false; 
            
            ctx.drawImage(
                this.spriteSheet,  
                -drawWidth / 2, // Wycentruj w poziomie
                -drawHeight / 2, // Wycentruj w pionie
                drawWidth,       
                drawHeight       
            );
            
            ctx.restore(); 
            
        } else {
            // Fallback (stara logika kwadratu)
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);

            ctx.strokeStyle = this.getOutlineColor();
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        }
        // --- KONIEC LOGIKI RYSOWANIA (v0.91j) ---

        ctx.filter = 'none';
        ctx.globalAlpha = 1;

        this.drawHealthBar(ctx);

        ctx.restore();
    }

    // --- Metody Pomocnicze (mogą być nadpisane) ---

    getSpeed(game, dist) {
        const hazardSlowdown = this.hazardSlowdownT > 0 ? HAZARD_CONFIG.HAZARD_ENEMY_SLOWDOWN_MULTIPLIER : 1;
        return this.speed * (game.freezeT > 0 ? 0.25 : 1) * (1 - (this.hitStun || 0)) * hazardSlowdown;
    }

    getSeparationRadius() {
        return this.size; 
    }

    getOutlineColor() {
        return colorForEnemy(this); 
    }

    drawHealthBar(ctx) {
        // Domyślnie nic nie rysuj
    }
}