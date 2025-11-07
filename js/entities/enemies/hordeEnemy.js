// ==============
// HORDEENEMY.JS (v0.76f - FIX: Zwiększenie separacji 2x)
// Lokalizacja: /js/entities/enemies/hordeEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg typu Horda.
 * Wolniejszy, ale pojawia się w grupach i ma mniejszą separację.
 */
export class HordeEnemy extends Enemy {
  getSpeed(game, dist) {
    return super.getSpeed(game, dist) * 0.8;
  }
  
  getSeparationRadius() {
    // POPRAWKA v0.76f: Zwiększono 2x (z 16 na 32)
    return 32;
  }
  
  getOutlineColor() {
    return '#aed581';
  }
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.76f] js/entities/enemies/hordeEnemy.js: Zwiększono separację (do 32).');