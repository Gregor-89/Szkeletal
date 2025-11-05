// ==============
// AGGRESSIVEENEMY.JS (v0.71 - Refaktoryzacja Wrogów)
// Lokalizacja: /js/entities/enemies/aggressiveEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg Agresywny.
 * Przyspiesza, gdy jest blisko gracza.
 */
export class AggressiveEnemy extends Enemy {
  getSpeed(game, dist) {
    let speed = super.getSpeed(game, dist);
    if (dist < 220) speed *= 1.5; // +50% prędkości
    return speed;
  }
  
  getOutlineColor() {
    return '#42a5f5';
  }
}