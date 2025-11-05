// ==============
// SPLITTERENEMY.JS (v0.71 - Refaktoryzacja Wrogów)
// Lokalizacja: /js/entities/enemies/splitterEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg Splitter.
 * Po śmierci dzieli się na mniejsze jednostki (logika w enemyManager).
 */
export class SplitterEnemy extends Enemy {
  getOutlineColor() {
    return '#f06292';
  }
}