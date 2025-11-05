// ==============
// WALLENEMY.JS (v0.71 - Refaktoryzacja Wrogów)
// Lokalizacja: /js/entities/enemies/wallEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg Oblężnik (Wall).
 * Bardzo wolny i wytrzymały, pojawia się w Wydarzeniu Oblężenia.
 */
export class WallEnemy extends Enemy {
  getOutlineColor() {
    return '#90A4AE'; // Szaro-niebieski
  }
  
  getSeparationRadius() {
    return 30; // Większa separacja, aby utrzymać "ścianę"
  }
}