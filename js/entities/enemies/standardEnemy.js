// ==============
// STANDARDENEMY.JS (v0.71 - Refaktoryzacja Wrogów)
// Lokalizacja: /js/entities/enemies/standardEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg standardowy.
 * Dziedziczy z bazowej klasy Enemy.
 */
export class StandardEnemy extends Enemy {
  // Nadpisuje metodę bazową, aby zwrócić specyficzny kolor konturu
  getOutlineColor() {
    return '#ffa726';
  }
}