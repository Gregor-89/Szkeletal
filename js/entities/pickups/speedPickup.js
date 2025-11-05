// ==============
// SPEEDPICKUP.JS (v0.71 - Refaktoryzacja Pickupów)
// Lokalizacja: /js/entities/pickups/speedPickup.js
// ==============

import { Pickup } from '../pickup.js';

/**
 * Pickup Szybkość.
 */
export class SpeedPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'speed');
  }
}