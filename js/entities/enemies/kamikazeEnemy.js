// ==============
// KAMIKAZEENEMY.JS (v0.93 - FIX: Animacja i Skala)
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
  
  // KONSTRUKTOR (v0.93 - VisualScale)
  constructor(x, y, stats, hpScale) {
    super(x, y, stats, hpScale);
    
    // ZMIANA v0.93: Zastąpiono drawScale przez visualScale.
    // Hitbox: 36px. VisualScale: 1.6 -> Wynik ~57px (Mały, ale widoczny)
    this.visualScale = 1.6; 
  }
  
  // Zwiększam bazową prędkość, aby był szybszy nawet bez szarży
  getSpeed(game, dist) {
    let speed = super.getSpeed(game, dist); 
    if (dist < 140) speed *= 2.0; // +100% prędkości przy szarży
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

        let vx = 0, vy = 0;
        let currentSpeed = this.getSpeed(game, dist);

        if (dist > 0.1) {
            // LOGIKA ZYGZAKA (v0.85A)
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

            vx = Math.cos(angleToTarget) * currentSpeed + Math.cos(anglePerp) * sideForce;
            vy = Math.sin(angleToTarget) * currentSpeed + Math.sin(anglePerp) * sideForce;
            
            if (Math.abs(vx) > 0.1) {
                this.facingDir = Math.sign(vx);
            }
        }

        this.x += (vx + this.separationX * 1.0) * dt;
        this.y += (vy + this.separationY * 1.0) * dt;
    }
    
    if (this.hitFlashT > 0) {
        this.hitFlashT -= dt;
    }

    // --- FIX V0.93: RĘCZNA AKTUALIZACJA ANIMACJI ---
    // Ponieważ nadpisaliśmy metodę update, musimy tu dodać ten blok kodu,
    // inaczej spritesheet utknie na 1 klatce.
    if (this.totalFrames > 1) {
        this.animTimer += dt;
        if (this.animTimer >= this.frameTime) {
            this.animTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
        }
    }
  }
}