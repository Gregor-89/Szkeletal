// ==============
// TANKENEMY.JS (v0.77s - TEST: Zwiększenie separacji 2x)
// Lokalizacja: /js/entities/enemies/tankEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg Tank.
 * Wolniejszy, ale bardziej wytrzymały (logika HP w gameData).
 */
export class TankEnemy extends Enemy {
  getSpeed(game, dist) {
    return super.getSpeed(game, dist) * 0.6;
  }
  
  getSeparationRadius() {
    // POPRAWKA v0.77s: Zwiększono 2x (z 56 na 112)
    return 112;
  }
  
  getOutlineColor() {
    return '#8d6e63';
  }
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.77s] js/entities/enemies/tankEnemy.js: Zwiększono separację (do 112).');