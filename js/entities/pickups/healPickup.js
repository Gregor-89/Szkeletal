// ==============
// HEALPICKUP.JS (v0.71 - Refaktoryzacja Pickupów)
// Lokalizacja: /js/entities/pickups/healPickup.js
// ==============

import { Pickup } from '../pickup.js';

/**
 * Pickup Leczący.
 */
export class HealPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'heal');
  }
}