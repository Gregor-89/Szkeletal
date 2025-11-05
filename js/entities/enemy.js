// ==============
// ENEMY.JS (v0.71 - Refaktoryzacja: Tylko Klasa Bazowa)
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
        this.size = stats.size;
        this.damage = stats.damage;
        this.color = stats.color;

        // Stan
        this.lastPlayerCollision = 0;
        this.hitStun = 0;
        this.rangedCooldown = 0;
        this.separationCooldown = Math.random() * 0.15;
        this.separationX = 0;
        this.separationY = 0;
        this.hazardSlowdownT = 0; // POPRAWKA v0.68a: Timer spowolnienia przez Hazard
        
        // Stan animacji
        this.spriteSheet = getAsset('enemy_' + this.type); 
        this.frameWidth = 32;     
        this.frameHeight = 32;    
        this.frameCount = 4;      
        this.animationSpeed = 150;  
        this.animationTimer = 0;
        this.currentFrame = 0;
    }

    /**
     * Główna metoda aktualizacji. Domyślnie goni gracza.
     * POPRAWKA v0.64: Zastosowano fizykę opartą na dt.
     */
    update(dt, player, game, state) {
        let isMoving = false;
        
        if (this.hitStun > 0) {
            this.hitStun -= dt;
        } else {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            let vx = 0, vy = 0;
            // currentSpeed jest już w px/s (przeskalowane w getSpeed())
            let currentSpeed = this.getSpeed(game, dist);

            if (dist > 0.1) {
                const randomOffset = Math.sin(game.time * 3 + this.id * 7.3) * 0.15;
                const targetAngle = Math.atan2(dy, dx) + randomOffset;
                vx = Math.cos(targetAngle) * currentSpeed;
                vy = Math.sin(targetAngle) * currentSpeed;
                isMoving = true;
            }

            // POPRAWKA v0.64: Zastosuj dt do finalnego ruchu
            // separationX i Y są teraz również w px/s (dzięki v0.64b)
            this.x += (vx + this.separationX * 0.5) * dt;
            this.y += (vy + this.separationY * 0.5) * dt;
        }
        
        // Aktualizacja animacji
        const dtMs = dt * 1000;
        if (isMoving) {
            this.animationTimer += dtMs;
            if (this.animationTimer >= this.animationSpeed) {
                this.animationTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            }
        } else {
            this.currentFrame = 0;
            this.animationTimer = 0;
        }
    }

    /**
     * Oblicza separację od innych wrogów (wywoływane rzadziej z gameLogic)
     * POPRAWKA v0.64b: Przeskalowanie siły separacji, aby pasowała do jednostek px/s
     */
    applySeparation(dt, enemies) {
        this.separationCooldown -= dt;
        if (this.separationCooldown <= 0) {
            this.separationCooldown = 0.15; 
            
            this.separationX = 0; 
            this.separationY = 0;
            
            const separationRadius = this.getSeparationRadius();
            const multiplier = 144; // MUSI pasować do mnożnika prędkości z v0.64!
            
            for (const other of enemies) {
                if (this.id === other.id) continue;
                
                const odx = this.x - other.x;
                const ody = this.y - other.y;
                const d = Math.hypot(odx, ody);
                
                if (d < separationRadius && d > 0.1) {
                    const force = (separationRadius - d) / separationRadius;
                    
                    // POPRAWKA v0.64b: Skalujemy siłę (force) o ten sam mnożnik co prędkość,
                    // aby obie siły działały w tej samej jednostce (px/s)
                    this.separationX += (odx / d) * force * multiplier;
                    this.separationY += (ody / d) * force * multiplier;
                }
            }
        }
    }

    /**
     * Główna metoda rysowania.
     * POPRAWKA v0.69: Sygnatura draw NIE POTRZEBUJE 'player' (powrót do v0.68)
     */
    draw(ctx, game) {
        ctx.save();

        if (game.freezeT > 0 || this.hazardSlowdownT > 0) { // Sprawdź, czy wróg jest spowolniony przez Freeze lub Hazard
            // Rysowanie efektu spowolnienia (niebieski/zielony kontur)
            ctx.strokeStyle = (this.hazardSlowdownT > 0 && game.freezeT <= 0) ? '#00FF00' : '#29b6f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.size / 2 - 2, this.y - this.size / 2 - 2, this.size + 4, this.size + 4);
        }

        if (this.hitStun > 0 && Math.floor(performance.now() / 50) % 2 === 0) {
            ctx.globalAlpha = 0.7;
        }

        if (this.spriteSheet) {
            const sourceX = this.currentFrame * this.frameWidth;
            const sourceY = 0;
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
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);

            ctx.strokeStyle = this.getOutlineColor();
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        }

        ctx.globalAlpha = 1;

        this.drawHealthBar(ctx);

        ctx.restore();
    }

    // --- Metody Pomocnicze (mogą być nadpisane) ---

    getSpeed(game, dist) {
        // Oblicz redukcję prędkości wynikającą ze spowolnienia Hazardu
        const hazardSlowdown = this.hazardSlowdownT > 0 ? HAZARD_CONFIG.HAZARD_ENEMY_SLOWDOWN_MULTIPLIER : 1;
        
        // Zwraca prędkość w px/s
        return this.speed * (game.freezeT > 0 ? 0.25 : 1) * (1 - (this.hitStun || 0)) * hazardSlowdown;
    }

    getSeparationRadius() {
        return 20; 
    }

    getOutlineColor() {
        return colorForEnemy(this); 
    }

    drawHealthBar(ctx) {
        // Domyślnie nic nie rysuj
    }
}

// === KLASY SPECJALISTYCZNE (PRZENIESIONE DO /js/entities/enemies/ ) ===
// (StandardEnemy, HordeEnemy, AggressiveEnemy, KamikazeEnemy, SplitterEnemy, TankEnemy, RangedEnemy, EliteEnemy, WallEnemy)
// Zostały usunięte z tego pliku.