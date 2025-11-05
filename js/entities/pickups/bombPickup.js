// ==============
// BOMBPICKUP.JS (v0.71 - Refaktoryzacja Pickupów)
// Lokalizacja: /js/entities/pickups/bombPickup.js
// ==============

import { Pickup } from '../pickup.js';

/**
 * Pickup Bomba.
 */
export class BombPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'bomb');
  }
}