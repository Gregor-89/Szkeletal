// ==============
// KAMIKAZEENEMY.JS (v0.76f - FIX: Zwiększenie separacji 2x)
// Lokalizacja: /js/entities/enemies/kamikazeEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg Kamikaze.
 * Znacznie przyspiesza, gdy jest bardzo blisko gracza.
 */
export class KamikazeEnemy extends Enemy {
  getSpeed(game, dist) {
    let speed = super.getSpeed(game, dist);
    if (dist < 140) speed *= 2.0; // +100% prędkości
    return speed;
  }
  
  getSeparationRadius() {
    // POPRAWKA v0.76f: Zwiększono 2x (z 12 na 24)
    return 24;
  }
  
  getOutlineColor() {
    return '#ffee58';
  }
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.76f] js/entities/enemies/kamikazeEnemy.js: Zwiększono separację (do 24).');