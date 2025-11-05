// ==============
// KAMIKAZEENEMY.JS (v0.71 - Refaktoryzacja Wrogów)
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
    return 12;
  }
  
  getOutlineColor() {
    return '#ffee58';
  }
}