// ==============
// ENEMY.JS (v0.64b - Poprawka siły separacji)
// Lokalizacja: /js/entities/enemy.js
// ==============

import { colorForEnemy } from '../core/utils.js';
// POPRAWKA v0.61: Nie importujemy już EnemyBullet, bo nie tworzymy go tutaj
// import { EnemyBullet } from './bullet.js'; 
import { get as getAsset } from '../services/assets.js';

// === KLASA BAZOWA WRONIA ===

export class Enemy {
    constructor(x, y, stats, hpScale) {
        this.x = x;
        this.y = y;
        this.id = 0; 

        // Statystyki
        this.stats = stats;
        this.type = stats.type || 'standard';
        this.hp = Math.floor(stats.hp * hpScale);
        this.maxHp = this.hp;
        // POPRAWKA v0.64: Prędkość jest teraz w px/s (skalowanie odbywa się w enemyManager)
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
     */
    draw(ctx, game) {
        ctx.save();

        if (game.freezeT > 0) {
            ctx.strokeStyle = '#29b6f6';
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
        // Zwraca prędkość w px/s
        return this.speed * (game.freezeT > 0 ? 0.25 : 1) * (1 - (this.hitStun || 0));
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

// === KLASY SPECJALISTYCZNE ===

export class StandardEnemy extends Enemy {
    getOutlineColor() { return '#ffa726'; }
}

export class HordeEnemy extends Enemy {
    getSpeed(game, dist) { return super.getSpeed(game, dist) * 0.8; }
    getSeparationRadius() { return 16; }
    getOutlineColor() { return '#aed581'; }
}

export class AggressiveEnemy extends Enemy {
    getSpeed(game, dist) {
        let speed = super.getSpeed(game, dist);
        if (dist < 220) speed *= 1.5; 
        return speed;
    }
    getOutlineColor() { return '#42a5f5'; }
}

export class KamikazeEnemy extends Enemy {
    getSpeed(game, dist) {
        let speed = super.getSpeed(game, dist);
        if (dist < 140) speed *= 2.0; 
        return speed;
    }
    getSeparationRadius() { return 12; }
    getOutlineColor() { return '#ffee58'; }
}

export class SplitterEnemy extends Enemy {
    getOutlineColor() { return '#f06292'; }
}

export class TankEnemy extends Enemy {
    getSpeed(game, dist) { return super.getSpeed(game, dist) * 0.6; } 
    getSeparationRadius() { return 28; } 
    getOutlineColor() { return '#8d6e63'; }
}

export class RangedEnemy extends Enemy {
    getSeparationRadius() { return 16; }
    getOutlineColor() { return '#4dd0e1'; }

    /**
     * Nadpisana metoda update dla wroga dystansowego.
     * POPRAWKA v0.64: Zastosowano fizykę dt i przeskalowano prędkość pocisku.
     */
    update(dt, player, game, state) {
        // Logika ruchu i strzelania (zanim wywołamy logikę animacji)
        let isMoving = false;
        if (this.hitStun > 0) {
             this.hitStun -= dt;
        } else {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            let vx = 0, vy = 0;
            let currentSpeed = this.getSpeed(game, dist); // Prędkość w px/s

            if (dist < 180) { vx = -(dx / dist) * currentSpeed; vy = -(dy / dist) * currentSpeed; isMoving = true; } // Uciekaj
            else if (dist > 220) { vx = (dx / dist) * currentSpeed; vy = (dy / dist) * currentSpeed; isMoving = true; } // Podchodź
            else { vx = 0; vy = 0; } // Stój
            
            // POPRAWKA v0.64: Zastosuj dt do finalnego ruchu
            this.x += (vx + this.separationX * 0.5) * dt;
            this.y += (vy + this.separationY * 0.5) * dt;
            
            // Strzelanie
            this.rangedCooldown -= dt;
            // POPRAWKA v0.61: Użyj puli obiektów
            if (this.rangedCooldown <= 0 && dist > 0.1 && state.eBulletsPool) {
                // POPRAWKA v0.63c: Przeskalowanie prędkości pocisku na 144 FPS (3.5 * 144)
                const bulletSpeed = 504 * (game.freezeT > 0 ? 0.25 : 1); // px/s (było 210)
                
                const bullet = state.eBulletsPool.get();
                if (bullet) {
                    bullet.init(
                        this.x, this.y,
                        (dx / dist) * bulletSpeed,
                        (dy / dist) * bulletSpeed,
                        5, 5, '#00BCD4'
                    );
                }
                
                this.rangedCooldown = 1.2 / (game.freezeT > 0 ? 0.25 : 1);
            }
        }
        
        // Logika animacji (skopiowana z bazowego 'update')
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
}

export class EliteEnemy extends Enemy {
    getOutlineColor() { return '#e91e63'; }

    drawHealthBar(ctx) {
        const w = 26, h = 4;
        const frac = Math.max(0, this.hp / this.maxHp);
        const bx = this.x - w / 2;
        const by = this.y - this.size / 2 - 8;
        
        ctx.fillStyle = '#300';
        ctx.fillRect(bx, by, w, h);
        let hpColor;
        if (frac > 0.6) hpColor = '#0f0';
        else if (frac > 0.3) hpColor = '#ff0';
        else hpColor = '#f00';
        ctx.fillStyle = hpColor;
        ctx.fillRect(bx, by, w * frac, h);
        ctx.strokeStyle = '#111';
        ctx.strokeRect(bx, by, w, h);
    }
}