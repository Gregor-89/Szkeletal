// ==============
// KAMIKAZEENEMY.JS (v1.01 - Knockback Priority v0.100)
// Lokalizacja: /js/entities/enemies/kamikazeEnemy.js
// ==============

import { Enemy } from '../enemy.js';
import { addHitText } from '../../core/utils.js';
import { playSound } from '../../services/audio.js';
import { devSettings } from '../../services/dev.js';

// STAŁE DLA KAMIKAZE
const DETONATION_RADIUS = 50;
const DETONATION_DAMAGE = 10;

/**
 * Wróg Kamikaze (Troll).
 * Znacznie przyspiesza, gdy jest bardzo blisko gracza i detonuje w jego pobliżu.
 */
export class KamikazeEnemy extends Enemy {
    
    constructor(x, y, stats, hpScale) {
        super(x, y, stats, hpScale);
        
        this.visualScale = 1.6;
        
        // ZMIANA: Bardzo niska odporność
        this.knockbackResistance = 0.15; // Jeszcze mniej niż 0.25
    }
    
    getSpeed(game, dist) {
        let speed = super.getSpeed(game, dist);
        if (dist < 140) speed *= 2.0;
        return speed;
    }
    
    getOutlineColor() {
        return '#ff7043';
    }
    
    /**
     * Nadpisana metoda update dla dodania logiki detonacji i zygzaka.
     */
    update(dt, player, game, state) {
        
        if (this.hitStun > 0) {
            this.hitStun -= dt;
        } else {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            // --- LOGIKA DETONACJI ---
            const hitRadiusPE = player.size * 0.5 + this.size * 0.5;
            if (dist < hitRadiusPE + 10) {
                
                if (game.shield || devSettings.godMode) {
                    addHitText(state.hitTextPool, state.hitTexts, player.x, player.y - 16, 0, '#90CAF9', 'Detonacja Tarcza');
                } else {
                    game.health -= DETONATION_DAMAGE;
                    addHitText(state.hitTextPool, state.hitTexts, player.x, player.y - 16, DETONATION_DAMAGE, '#f44336');
                    playSound('PlayerHurt');
                }
                
                const index = state.enemies.indexOf(this);
                if (index !== -1) {
                    state.enemyIdCounter = state.killEnemy(
                        index, this, game, state.settings, state.enemies,
                        state.particlePool, state.gemsPool, state.pickups, state.enemyIdCounter,
                        state.chests, false, true
                    );
                }
                return;
            }
            // --- KONIEC LOGIKI DETONACJI ---
            
            // ZMIANA: Sprawdzamy, czy jesteśmy pod wpływem silnego knockbacku
            const isKnockedBack = (Math.abs(this.knockback.x) > 20 || Math.abs(this.knockback.y) > 20);
            
            if (!isKnockedBack && dist > 0.1) {
                // LOGIKA ZYGZAKA (Tylko jeśli nie latamy w powietrzu)
                let currentSpeed = this.getSpeed(game, dist);
                
                const PREDICT_DIST = 150;
                const SINUSOID_MAGNITUDE = 0.8;
                const SINUSOID_FREQUENCY = 5.0;
                
                const angleToPlayer = Math.atan2(dy, dx);
                
                const predictedTargetX = player.x + Math.cos(angleToPlayer) * PREDICT_DIST;
                const predictedTargetY = player.y + Math.sin(angleToPlayer) * PREDICT_DIST;
                
                const pDx = predictedTargetX - this.x;
                const pDy = predictedTargetY - this.y;
                const angleToTarget = Math.atan2(pDy, pDx);
                
                const anglePerp = angleToTarget + Math.PI / 2;
                const sideForce = currentSpeed * SINUSOID_MAGNITUDE * Math.sin(game.time * SINUSOID_FREQUENCY);
                
                // Nadpisujemy vx/vy tylko jeśli mamy kontrolę
                this.vx = Math.cos(angleToTarget) * currentSpeed + Math.cos(anglePerp) * sideForce;
                this.vy = Math.sin(angleToTarget) * currentSpeed + Math.sin(anglePerp) * sideForce;
                
                if (Math.abs(this.vx) > 0.1) {
                    this.facingDir = Math.sign(this.vx);
                }
            } else if (isKnockedBack) {
                // Jeśli knockback, tracimy kontrolę nad ruchem (vx, vy = 0)
                // Fizyka knockbacku z klasy bazowej (super.update) zajmie się przesunięciem
                this.vx = 0;
                this.vy = 0;
            }
            
            // Aplikujemy ruch (albo własny, albo 0) + separację
            this.x += (this.vx + this.separationX * 1.0) * dt;
            this.y += (this.vy + this.separationY * 1.0) * dt;
        }
        
        // Obsługa Knockbacku (taka sama jak w base, ale musimy ją tu mieć, bo nadpisujemy update)
        if (Math.abs(this.knockback.x) > 0.1 || Math.abs(this.knockback.y) > 0.1) {
            this.x += this.knockback.x * dt;
            this.y += this.knockback.y * dt;
            this.knockback.x *= 0.9;
            this.knockback.y *= 0.9;
        }
        
        if (this.hitFlashT > 0) {
            this.hitFlashT -= dt;
        }
        
        if (this.totalFrames > 1) {
            this.animTimer += dt;
            if (this.animTimer >= this.frameTime) {
                this.animTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            }
        }
    }
}