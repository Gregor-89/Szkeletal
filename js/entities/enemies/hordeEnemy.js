// ==============
// HORDEENEMY.JS (v0.71 - Refaktoryzacja Wrogów)
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
    return 16;
  }
  
  getOutlineColor() {
    return '#aed581';
  }
}