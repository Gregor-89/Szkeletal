// ==============
// LUMBERJACKENEMY.JS (v1.00 - New Boss: Drwal)
// Lokalizacja: /js/entities/enemies/lumberjackEnemy.js
// ==============

import { Enemy } from '../enemy.js';
import { WEAPON_CONFIG } from '../../config/gameData.js';
import { get as getAsset } from '../../services/assets.js'; 
import { playSound } from '../../services/audio.js';

/**
 * Drwal Zjebadło (Boss).
 * Hybryda zachowania Ranged i Elite.
 * - Posiada animację chodzenia i ataku.
 * - Rzuca "tęczową" siekierą.
 * - Jest bossem (pasek HP).
 */
export class LumberjackEnemy extends Enemy {
    
    constructor(x, y, stats, hpScale) {
        super(x, y, stats, hpScale);
        
        // Wizualnie duży (Boss)
        this.visualScale = 2.2; 
        
        // Ładowanie zasobów
        this.walkSprite = getAsset('enemy_lumberjack_walk');
        this.attackSprite = getAsset('enemy_lumberjack_attack');
        
        // Domyślny sprite
        this.sprite = this.walkSprite || getAsset('enemy_lumberjack');
        
        // Parametry animacji
        this.cols = 4;
        this.rows = 4;
        this.totalFrames = 16;
        this.frameTime = 0.1;
        
        // Logika stanu
        this.isAttacking = false; 
        this.rangedConfig = stats; 
        this.rangedCooldown = 1.0; // Krótkie opóźnienie na start
        
        this.showHealthBar = true; // Zawsze pokazuj pasek HP dla bossa
        this.mass = 4.0; // Cięższy niż zwykłe moby
    }

    getSeparationRadius() { 
        return 80; 
    }
    
    getOutlineColor() { 
        return '#795548'; // Brązowy
    }

    update(dt, player, game, state) {
        if (this.isDead) return;

        // Statusy
        if (this.hitStun > 0) this.hitStun -= dt;
        if (this.hitFlashT > 0) this.hitFlashT -= dt;
        const freezeMult = (game.freezeT > 0 ? 0.25 : 1);
        if (this.frozenTimer > 0) {
            this.frozenTimer -= dt;
            return;
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        // --- MASZYNA STANÓW ---

        if (this.isAttacking) {
            // STAN: ATAK
            this.animTimer += dt;
            if (this.animTimer >= this.frameTime) {
                this.animTimer = 0;
                this.currentFrame++;
                
                // Rzut w konkretnej klatce (np. 10/16) lub na końcu
                if (this.currentFrame === 10) {
                     this.performShoot(player, game, state, dx, dy);
                }

                if (this.currentFrame >= this.totalFrames) {
                    // Koniec ataku
                    this.isAttacking = false;
                    this.rangedCooldown = this.rangedConfig.attackCooldown / freezeMult;
                    this.sprite = this.walkSprite;
                    this.currentFrame = 0;
                }
            }
            if (Math.abs(dx) > 10) this.facingDir = Math.sign(dx);

        } else {
            // STAN: CHODZENIE
            
            // 1. Ruch
            if (this.hitStun <= 0) {
                this.handleMovement(dt, dx, dy, dist, game);
            }

            // 2. Cooldown
            this.rangedCooldown -= dt;
            
            // 3. Przejście do ataku
            if (this.rangedCooldown <= 0 && dist < this.rangedConfig.attackRange && this.hitStun <= 0 && this.attackSprite) {
                this.startAttack();
            }

            // 4. Animacja chodzenia
            this.animTimer += dt;
            if (this.animTimer >= this.frameTime) {
                this.animTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            }
        }
        
        // Knockback (zredukowany dla bossa)
        if (Math.abs(this.knockback.x) > 0.1 || Math.abs(this.knockback.y) > 0.1) {
            this.x += this.knockback.x * dt * 0.3; // Boss jest stabilniejszy
            this.y += this.knockback.y * dt * 0.3;
            this.knockback.x *= 0.9;
            this.knockback.y *= 0.9;
        }
    }

    startAttack() {
        this.isAttacking = true;
        this.sprite = this.attackSprite;
        this.currentFrame = 0;
        this.animTimer = 0;
        playSound('EliteSpawn'); // Okrzyk przy ataku
    }

    performShoot(player, game, state, dx, dy) {
        if (!state.eBulletsPool) return;

        const bulletConfig = WEAPON_CONFIG.LUMBERJACK_AXE;
        const bulletSpeed = bulletConfig.SPEED * (game.freezeT > 0 ? 0.25 : 1);
        
        const bullet = state.eBulletsPool.get();
        if (bullet) {
            const targetAngle = Math.atan2(dy, dx);
            
            bullet.init(
                this.x, this.y,
                Math.cos(targetAngle) * bulletSpeed,
                Math.sin(targetAngle) * bulletSpeed,
                bulletConfig.SIZE, 
                bulletConfig.DAMAGE, 
                '#ff0000', // Kolor fallback
                Infinity, 
                'axe', // Typ pocisku
                targetAngle 
            );
            
            // Konfiguracja graficzna siekiery
            bullet.sprite = getAsset('projectile_axe');
            bullet.width = bulletConfig.SPRITE_WIDTH;
            bullet.height = bulletConfig.SPRITE_HEIGHT;
            bullet.scale = 1.5;
        }
        playSound('Shoot');
    }

    handleMovement(dt, dx, dy, dist, game) {
        // Boss podchodzi pewniej niż Menel, nie ucieka tak panicznie, ale trzyma dystans
        let vx = 0, vy = 0;
        let currentSpeed = this.getSpeed(game, dist); 
        
        let moveAngle = Math.atan2(dy, dx);
        const optimalDist = 200;
        
        if (dist > optimalDist) {
             // Goń gracza
             vx = Math.cos(moveAngle) * currentSpeed;
             vy = Math.sin(moveAngle) * currentSpeed;
        } else if (dist < optimalDist - 50) {
             // Cofnij się lekko
             vx = -Math.cos(moveAngle) * currentSpeed * 0.5;
             vy = -Math.sin(moveAngle) * currentSpeed * 0.5;
        } else {
             // Krążenie (Strafe) gdy jest w dobrym zasięgu
             const strafeAngle = moveAngle + Math.PI / 2;
             vx = Math.cos(strafeAngle) * currentSpeed * 0.6;
             vy = Math.sin(strafeAngle) * currentSpeed * 0.6;
        }
        
        this.x += (vx + this.separationX * 0.5) * dt; 
        this.y += (vy + this.separationY * 0.5) * dt;
        
        if (Math.abs(vx) > 0.1) this.facingDir = Math.sign(vx);
    }

    // Customowy pasek zdrowia bossa
    drawHealthBar(ctx) {
        if (!this.showHealthBar) return;
        ctx.save();
        if (this.facingDir === -1) ctx.scale(-1, 1);
        const w = 60; const h = 8; const frac = Math.max(0, this.hp / this.maxHp);
        const bx = -w / 2; const spriteH = this.size * this.visualScale; const by = -(spriteH / 2) - 10; 
        ctx.fillStyle = '#300'; ctx.fillRect(bx, by, w, h);
        ctx.fillStyle = '#FF5722'; // Pomarańczowy dla Drwala
        ctx.fillRect(bx, by, w * frac, h);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, w, h);
        ctx.restore();
    }
}