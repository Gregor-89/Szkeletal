// ==============
// RANGEDENEMY.JS (v0.93 - FIX: Skala -25%)
// Lokalizacja: /js/entities/enemies/rangedEnemy.js
// ==============

import { Enemy } from '../enemy.js';
import { WEAPON_CONFIG } from '../../config/gameData.js';
import { get as getAsset } from '../../services/assets.js'; 

/**
 * Wróg Dystansowy (Menel).
 * Posiada dwa stany animacji: 
 * 1. Chodzenie (Strafe/Chase)
 * 2. Atak (Picie z butelki -> Rzut) - podczas ataku stoi w miejscu.
 */
export class RangedEnemy extends Enemy {
    
    constructor(x, y, stats, hpScale) {
        super(x, y, stats, hpScale);
        
        // KOREKTA ROZMIARU: Zmniejszono o 25% z 3.8 na 2.85.
        // Spritesheet 2048px. Hitbox 52px. visualScale = 2.85.
        this.visualScale = 2.85; 
        
        // Ładowanie zasobów
        this.walkSprite = getAsset('enemy_ranged_walk');
        this.attackSprite = getAsset('enemy_ranged_attack');
        
        // Domyślny sprite to chodzenie
        this.sprite = this.walkSprite || getAsset('enemy_ranged'); // fallback
        
        // Parametry animacji
        this.cols = 4;
        this.rows = 4;
        this.totalFrames = 16;
        this.frameTime = 0.1; // Prędkość animacji
        
        // --- LOGIKA STANU ---
        this.isAttacking = false; // Czy aktualnie pije/atakuje?
        
        // Konfiguracja statystyk
        this.rangedConfig = stats; 
        this.rangedCooldown = 0;
    }

    getSeparationRadius() { 
        return 64; 
    }
    
    getOutlineColor() { 
        return '#4dd0e1'; 
    }

    update(dt, player, game, state) {
        if (this.isDead) return;

        // Obsługa statusów (stun, flash, freeze)
        if (this.hitStun > 0) this.hitStun -= dt;
        if (this.hitFlashT > 0) this.hitFlashT -= dt;
        
        const freezeMult = (game.freezeT > 0 ? 0.25 : 1);
        if (this.frozenTimer > 0) {
            this.frozenTimer -= dt;
            return; // Zamrożony - brak ruchu i animacji
        }

        // Dystans do gracza
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        // =========================================================
        // MASZYNA STANÓW: ATAK (PICIE) vs CHODZENIE
        // =========================================================

        if (this.isAttacking) {
            // --- STAN 1: WYKONYWANIE ATAKU (Stoi i pije) ---
            
            // Animacja Ataku
            this.animTimer += dt;
            if (this.animTimer >= this.frameTime) {
                this.animTimer = 0;
                this.currentFrame++;
                
                // SPRAWDZENIE KOŃCA ANIMACJI (Moment rzutu)
                if (this.currentFrame >= this.totalFrames) {
                    // 1. Wykonaj strzał (na końcu animacji)
                    this.performShoot(player, game, state, dx, dy, dist);
                    
                    // 2. Zakończ atak
                    this.isAttacking = false;
                    this.rangedCooldown = this.rangedConfig.attackCooldown / freezeMult;
                    
                    // 3. Przywróć sprite chodzenia
                    this.sprite = this.walkSprite;
                    this.currentFrame = 0;
                }
            }
            
            // Podczas ataku zawsze patrz w stronę gracza
            if (Math.abs(dx) > 10) this.facingDir = Math.sign(dx);

        } else {
            // --- STAN 2: CHODZENIE (Ruch i sprawdzanie cooldownu) ---
            
            // 1. Logika Ruchu (Tylko jeśli nie jest zestunowany)
            if (this.hitStun <= 0) {
                this.handleMovement(dt, dx, dy, dist, game);
            }

            // 2. Sprawdzanie czy można zaatakować
            this.rangedCooldown -= dt;
            
            // WARUNEK ROZPOCZĘCIA ATAKU:
            if (this.rangedCooldown <= 0 && dist < this.rangedConfig.attackRange && this.hitStun <= 0 && this.attackSprite) {
                this.startAttack();
            }

            // 3. Animacja Chodzenia (Pętla)
            this.animTimer += dt;
            if (this.animTimer >= this.frameTime) {
                this.animTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            }
        }
        
        // Obsługa Knockbacku (Działa zawsze)
        if (Math.abs(this.knockback.x) > 0.1 || Math.abs(this.knockback.y) > 0.1) {
            this.x += this.knockback.x * dt;
            this.y += this.knockback.y * dt;
            this.knockback.x *= 0.9;
            this.knockback.y *= 0.9;
        }
    }

    /**
     * Rozpoczyna sekwencję ataku (picie).
     */
    startAttack() {
        this.isAttacking = true;
        this.sprite = this.attackSprite; // Podmiana na sprite ataku
        this.currentFrame = 0;           // Reset klatki na początek
        this.animTimer = 0;
    }

    /**
     * Faktyczne stworzenie pocisku (wywoływane na końcu animacji).
     */
    performShoot(player, game, state, dx, dy, dist) {
        if (!state.eBulletsPool) return;

        const bulletConfig = WEAPON_CONFIG.RANGED_ENEMY_BULLET;
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
                '#00BCD4', 
                Infinity, 
                'bottle', // Typ graficzny pocisku
                targetAngle 
            );
            
            // Fix grafiki pocisku
            bullet.sprite = getAsset('enemy_ranged_projectile');
            bullet.width = 22;
            bullet.height = 64;
            bullet.scale = 0.5;
            bullet.rotation = targetAngle + Math.PI / 2;
        }
    }

    /**
     * Logika poruszania się (Strafe/Chase).
     */
    handleMovement(dt, dx, dy, dist, game) {
        let isMoving = false;
        let vx = 0, vy = 0;
        let currentSpeed = this.getSpeed(game, dist); 

        let moveAngle = Math.atan2(dy, dx); 
        let strafeAngle = 0; 
        
        const optimalMin = 250; 
        const optimalMax = 400; 
        
        let moveForce = 0; 
        
        if (dist < optimalMin) { 
            moveAngle = Math.atan2(-dy, -dx);
            moveForce = currentSpeed;
            isMoving = true;
        } else if (dist > optimalMax) { 
            moveAngle = Math.atan2(dy, dx);
            moveForce = currentSpeed;
            isMoving = true;
        }
        
        if (dist >= optimalMin && dist <= optimalMax) {
            const strafeDirection = Math.sign(Math.sin(this.id));
            strafeAngle = moveAngle + (Math.PI / 2) * strafeDirection;
            const strafeSpeed = currentSpeed * 0.75; 
            vx += Math.cos(strafeAngle) * strafeSpeed;
            vy += Math.sin(strafeAngle) * strafeSpeed;
            isMoving = true;
        }
        
        if (moveForce > 0) {
            vx += Math.cos(moveAngle) * moveForce;
            vy += Math.sin(moveAngle) * moveForce;
        }
        
        this.x += (vx + this.separationX * 1.0) * dt; 
        this.y += (vy + this.separationY * 1.0) * dt;
        
        if (Math.abs(vx) > 0.1) {
                this.facingDir = Math.sign(vx);
        } else if (isMoving) {
                this.facingDir = Math.sign(dx);
        } else {
            if (Math.abs(dx) > 10) this.facingDir = Math.sign(dx);
        }
    }
}