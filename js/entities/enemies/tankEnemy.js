// ==============
// TANKENEMY.JS (v0.71 - Refaktoryzacja Wrogów)
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
    return 28;
  }
  
  getOutlineColor() {
    return '#8d6e63';
  }
}