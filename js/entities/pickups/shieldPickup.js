// ==============
// SHIELDPICKUP.JS (v0.71 - Refaktoryzacja Pickupów)
// Lokalizacja: /js/entities/pickups/shieldPickup.js
// ==============

import { Pickup } from '../pickup.js';

/**
 * Pickup Tarcza.
 */
export class ShieldPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'shield');
  }
}