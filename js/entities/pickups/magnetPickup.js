// ==============
// MAGNETPICKUP.JS (v0.71 - Refaktoryzacja Pickupów)
// Lokalizacja: /js/entities/pickups/magnetPickup.js
// ==============

import { Pickup } from '../pickup.js';

/**
 * Pickup Magnes.
 */
export class MagnetPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'magnet');
  }
}