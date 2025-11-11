// ==============
// KAMIKAZEENEMY.JS (v0.85b - Nowy Kolor Obrysu)
// Lokalizacja: /js/entities/enemies/kamikazeEnemy.js
// ==============

import { Enemy } from '../enemy.js';
import { addHitText } from '../../core/utils.js';
import { playSound } from '../../services/audio.js';
import { devSettings } from '../../services/dev.js'; // DODANO: Import devSettings

// STAŁE DLA KAMIKAZE
const DETONATION_RADIUS = 50;
const DETONATION_DAMAGE = 10;

/**
 * Wróg Kamikaze.
 * Znacznie przyspiesza, gdy jest bardzo blisko gracza i detonuje w jego pobliżu.
 */
export class KamikazeEnemy extends Enemy {
  
  // Zwiększam bazową prędkość, aby był szybszy nawet bez szarży
  getSpeed(game, dist) {
    let speed = super.getSpeed(game, dist); 
    // Zostawiam tylko logikę szarży.
    if (dist < 140) speed *= 2.0; // +100% prędkości przy szarży
    return speed;
  }
  
  getSeparationRadius() {
    // POPRAWKA v0.77s: Zwiększono 2x (z 24 na 48)
    return 48;
  }
  
  getOutlineColor() {
    // NOWA LOGIKA V0.85B: Zmieniono kolor na bardziej wyróżniający (pomarańczowy dyniowy)
    return '#ff7043'; // Poprzednio: '#ffee58' (jasny żółty)
  }
  
  /**
   * Nadpisana metoda update dla dodania logiki detonacji i zygzaka.
   */
  update(dt, player, game, state) {
    let isMoving = false;
    
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
            // NOWA LOGIKA V0.85A: Zygzak z predykcją (celowanie 150px przed graczem)
            const PREDICT_DIST = 150; // Celuj 150px przed graczem
            const SINUSOID_MAGNITUDE = 0.8; // Siła sinusa (0.8x prędkości)
            const SINUSOID_FREQUENCY = 5.0; // Częstotliwość
            
            // 1. Ustal kąt do gracza (podstawowy kierunek)
            const angleToPlayer = Math.atan2(dy, dx);
            
            // 2. Ustal punkt docelowy z lekką predykcją (w kierunku ostatniego ruchu gracza)
            const predictedTargetX = player.x + Math.cos(angleToPlayer) * PREDICT_DIST;
            const predictedTargetY = player.y + Math.sin(angleToPlayer) * PREDICT_DIST;

            // 3. Oblicz nowy kąt do *przewidywanego celu*
            const pDx = predictedTargetX - this.x;
            const pDy = predictedTargetY - this.y;
            const angleToTarget = Math.atan2(pDy, pDx);
            
            // 4. Dodaj stałą siłę boczną do kąta celu, oscylującą w czasie
            const anglePerp = angleToTarget + Math.PI / 2;
            const sideForce = currentSpeed * SINUSOID_MAGNITUDE * Math.sin(game.time * SINUSOID_FREQUENCY);

            // 5. Wektor ruchu jest kombinacją siły do celu i siły bocznej
            vx = Math.cos(angleToTarget) * currentSpeed + Math.cos(anglePerp) * sideForce;
            vy = Math.sin(angleToTarget) * currentSpeed + Math.sin(anglePerp) * sideForce;

            isMoving = true;
        }

        // POPRAWKA v0.64: Zastosuj dt do finalnego ruchu
        this.x += (vx + this.separationX * 0.5) * dt;
        this.y += (vy + this.separationY * 0.5) * dt;
    }
    
    // Aktualizacja animacji (skopiowana z klasy bazowej i NAPRAWIONA)
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

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.77s] js/entities/enemies/kamikazeEnemy.js: Zwiększono separację (do 48).');