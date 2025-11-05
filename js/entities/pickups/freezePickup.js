// ==============
// FREEZEPICKUP.JS (v0.71 - Refaktoryzacja Pickupów)
// Lokalizacja: /js/entities/pickups/freezePickup.js
// ==============

import { Pickup } from '../pickup.js';

/**
 * Pickup Zamrożenie.
 */
export class FreezePickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'freeze');
  }
}