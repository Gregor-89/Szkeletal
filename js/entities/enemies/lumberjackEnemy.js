// ==============
// LUMBERJACKENEMY.JS (v1.01 - Dynamic Anim)
// Lokalizacja: /js/entities/enemies/lumberjackEnemy.js
// ==============

import { Enemy } from '../enemy.js';
import { WEAPON_CONFIG } from '../../config/gameData.js';
import { get as getAsset } from '../../services/assets.js'; 
import { playSound } from '../../services/audio.js';

export class LumberjackEnemy extends Enemy {
    
    constructor(x, y, stats, hpScale) {
        super(x, y, stats, hpScale);
        
        this.visualScale = 2.2; 
        
        this.walkSprite = getAsset('enemy_lumberjack_walk');
        this.attackSprite = getAsset('enemy_lumberjack_attack');
        
        this.sprite = this.walkSprite || getAsset('enemy_lumberjack');
        
        this.cols = 4;
        this.rows = 4;
        this.totalFrames = 16;
        this.frameTime = 0.1;
        
        this.isAttacking = false; 
        this.rangedConfig = stats; 
        this.rangedCooldown = 1.0; 
        
        this.showHealthBar = true; 
        this.mass = 4.0; 
    }

    getSeparationRadius() { 
        return 80; 
    }
    
    getOutlineColor() { 
        return '#795548'; 
    }

    update(dt, player, game, state) {
        if (this.isDead) return;

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
            // STAN: ATAK (Stoi w miejscu - animacja stała)
            this.animTimer += dt;
            if (this.animTimer >= this.frameTime) {
                this.animTimer = 0;
                this.currentFrame++;
                
                if (this.currentFrame === 10) {
                     this.performShoot(player, game, state, dx, dy);
                }

                if (this.currentFrame >= this.totalFrames) {
                    this.isAttacking = false;
                    this.rangedCooldown = this.rangedConfig.attackCooldown / freezeMult;
                    this.sprite = this.walkSprite;
                    this.currentFrame = 0;
                }
            }
            if (Math.abs(dx) > 10) this.facingDir = Math.sign(dx);

        } else {
            // STAN: CHODZENIE
            let currentSpeed = 0;
            
            // 1. Ruch
            if (this.hitStun <= 0) {
                currentSpeed = this.handleMovement(dt, dx, dy, dist, game);
            }

            // 2. Cooldown
            this.rangedCooldown -= dt;
            
            // 3. Przejście do ataku
            if (this.rangedCooldown <= 0 && dist < this.rangedConfig.attackRange && this.hitStun <= 0 && this.attackSprite) {
                this.startAttack();
            }

            // 4. Animacja chodzenia (Dynamiczna)
            // Używamy metody z klasy bazowej Enemy, która skaluje animację
            this.updateAnimation(dt, currentSpeed);
        }
        
        if (Math.abs(this.knockback.x) > 0.1 || Math.abs(this.knockback.y) > 0.1) {
            this.x += this.knockback.x * dt * 0.3; 
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
        playSound('EliteSpawn'); 
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
                '#ff0000', 
                Infinity, 
                'axe', 
                targetAngle 
            );
            
            bullet.sprite = getAsset('projectile_axe');
            bullet.width = bulletConfig.SPRITE_WIDTH;
            bullet.height = bulletConfig.SPRITE_HEIGHT;
            bullet.scale = 1.5;
        }
        playSound('Shoot');
    }

    handleMovement(dt, dx, dy, dist, game) {
        let vx = 0, vy = 0;
        let currentSpeed = this.getSpeed(game, dist); 
        
        let moveAngle = Math.atan2(dy, dx);
        const optimalDist = 200;
        
        if (dist > optimalDist) {
             vx = Math.cos(moveAngle) * currentSpeed;
             vy = Math.sin(moveAngle) * currentSpeed;
        } else if (dist < optimalDist - 50) {
             vx = -Math.cos(moveAngle) * currentSpeed * 0.5;
             vy = -Math.sin(moveAngle) * currentSpeed * 0.5;
        } else {
             const strafeAngle = moveAngle + Math.PI / 2;
             vx = Math.cos(strafeAngle) * currentSpeed * 0.6;
             vy = Math.sin(strafeAngle) * currentSpeed * 0.6;
        }
        
        this.x += (vx + this.separationX * 0.5) * dt; 
        this.y += (vy + this.separationY * 0.5) * dt;
        
        if (Math.abs(vx) > 0.1) this.facingDir = Math.sign(vx);
        
        // Zwracamy faktyczną prędkość, aby sterować animacją
        return Math.hypot(vx, vy);
    }

    drawHealthBar(ctx) {
        if (!this.showHealthBar) return;
        ctx.save();
        if (this.facingDir === -1) ctx.scale(-1, 1);
        const w = 60; const h = 8; const frac = Math.max(0, this.hp / this.maxHp);
        const bx = -w / 2; const spriteH = this.size * this.visualScale; const by = -(spriteH / 2) - 10; 
        ctx.fillStyle = '#300'; ctx.fillRect(bx, by, w, h);
        ctx.fillStyle = '#FF5722'; 
        ctx.fillRect(bx, by, w * frac, h);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, w, h);
        ctx.restore();
    }
}