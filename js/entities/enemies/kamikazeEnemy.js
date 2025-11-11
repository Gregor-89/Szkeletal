// ==============
// KAMIKAZEENEMY.JS (v0.83v - Szybszy i Zygzakowaty)
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
    let speed = super.getSpeed(game, dist) * 1.5; // Zwiększenie bazowej prędkości 1.5x
    if (dist < 140) speed *= 2.0; // +100% prędkości przy szarży (razem 3.0x bazowej)
    return speed;
  }
  
  getSeparationRadius() {
    // POPRAWKA v0.77s: Zwiększono 2x (z 24 na 48)
    return 48;
  }
  
  getOutlineColor() {
    return '#ffee58';
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
            const targetAngle = Math.atan2(dy, dx);
            
            // NOWA LOGIKA V0.83V: Mocniejszy ruch zygzakowaty (losowy offset co 0.5s)
            // Użycie this.id i this.time do stworzenia powtarzalnego, ale widocznego zygzaka
            const zigzagPeriod = 0.5;
            const zigzagPhase = Math.floor(game.time / zigzagPeriod) + this.id * 0.1;
            const zigzagOffset = Math.sin(zigzagPhase) * 0.5; // Maks. kąt 0.5 rad
            
            // Stary offset (losowość) zostaje usunięty na rzecz sterowanego zygzaka
            const finalAngle = targetAngle + zigzagOffset;
            
            vx = Math.cos(finalAngle) * currentSpeed;
            vy = Math.sin(finalAngle) * currentSpeed;
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